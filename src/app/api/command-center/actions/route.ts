import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/command-center/actions
 * Returns persistent action items for the engineer.
 * Generates new actions from current project data if none exist for today.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can access actions" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;

    // Get existing open/in-progress actions
    const existingActions = await db.actionItem.findMany({
      where: {
        createdById: engineerId,
        status: { in: ["open", "in_progress"] },
      },
      include: {
        project: { select: { id: true, name: true, city: true } },
        feedback: { select: { useful: true } },
      },
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Also get today's completed actions for analytics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCompleted = await db.actionItem.findMany({
      where: {
        createdById: engineerId,
        status: "completed",
        completedAt: { gte: todayStart },
      },
      select: { id: true, title: true, outcome: true, completedAt: true },
    });

    // Get historical stats
    const allActions = await db.actionItem.findMany({
      where: { createdById: engineerId },
      select: { status: true, outcome: true },
    });

    const stats = {
      total: allActions.length,
      open: allActions.filter((a) => a.status === "open").length,
      inProgress: allActions.filter((a) => a.status === "in_progress").length,
      completed: allActions.filter((a) => a.status === "completed").length,
      dismissed: allActions.filter((a) => a.status === "dismissed").length,
      todayCompleted: todayCompleted.length,
    };

    // Compute actionability rate from feedback
    const allFeedback = await db.actionFeedback.findMany({
      where: { userId: engineerId },
      select: { useful: true },
    });
    const usefulCount = allFeedback.filter((f) => f.useful === "yes").length;
    const partialCount = allFeedback.filter((f) => f.useful === "partially").length;
    const totalFeedback = allFeedback.length;

    const actionabilityRate =
      totalFeedback > 0
        ? Math.round(((usefulCount + partialCount * 0.5) / totalFeedback) * 100)
        : null;

    // Completion rate
    const acceptedCount = stats.open + stats.inProgress + stats.completed;
    const completionRate =
      acceptedCount > 0 ? Math.round((stats.completed / acceptedCount) * 100) : null;

    return NextResponse.json({
      actions: existingActions.map((a) => ({
        id: a.id,
        projectId: a.projectId,
        projectName: a.project.name,
        projectCity: a.project.city,
        title: a.title,
        description: a.description,
        category: a.category,
        priority: a.priority,
        signal: a.signal,
        signalValue: a.signalValue,
        source: a.source,
        href: a.href,
        status: a.status,
        outcome: a.outcome,
        completedNote: a.completedNote,
        completedAt: a.completedAt,
        dismissedReason: a.dismissedReason,
        createdAt: a.createdAt,
        hasFeedback: a.feedback.length > 0,
      })),
      todayCompleted,
      stats,
      actionabilityRate,
      completionRate,
      feedbackCount: totalFeedback,
    });
  } catch (error) {
    console.error("Actions list API error:", error);
    return NextResponse.json({ error: "Failed to load actions" }, { status: 500 });
  }
}

/**
 * POST /api/command-center/actions
 * Generate and persist new action items from current project data.
 * Only creates actions that don't already exist (deduplication).
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can generate actions" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const now = new Date();

    // Fetch all projects with relevant data
    const projects = await db.project.findMany({
      where: { engineerId },
      include: {
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 1,
          select: { inspectionDate: true },
        },
        issues: {
          where: { status: { in: ["open", "under_review"] } },
          select: { id: true, severity: true, title: true },
        },
        photos: { select: { id: true } },
        workers: { where: { active: true }, select: { id: true } },
        _count: { select: { inspections: true, photos: true } },
      },
    });

    // Get existing open action signals to avoid duplicates
    const existingActions = await db.actionItem.findMany({
      where: {
        createdById: engineerId,
        status: { in: ["open", "in_progress"] },
      },
      select: { signal: true, projectId: true },
    });
    const existingKeys = new Set(
      existingActions.map((a) => `${a.projectId}:${a.signal}`)
    );

    const newActions: Array<{
      projectId: string;
      createdById: string;
      title: string;
      description: string;
      category: string;
      priority: string;
      signal: string;
      signalValue: string;
      source: string;
      href: string;
    }> = [];

    for (const project of projects) {
      const projectId = project.id;
      const projectName = project.name;

      // ─── Inspection actions ────────────────────────────────────────────
      const lastInspection = project.inspections[0]?.inspectionDate;
      if (!lastInspection) {
        const daysSinceCreation = Math.floor(
          (now.getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreation > 7 && !existingKeys.has(`${projectId}:no_inspection`)) {
          newActions.push({
            projectId,
            createdById: engineerId,
            title: `Schedule first inspection — ${projectName}`,
            description: `No inspections recorded in ${daysSinceCreation} days since project creation.`,
            category: "inspection",
            priority: daysSinceCreation > 14 ? "critical" : "high",
            signal: "no_inspection",
            signalValue: `${daysSinceCreation} days since creation`,
            source: "risk-engine-v1",
            href: `/engineer/sites/${projectId}`,
          });
        }
      } else {
        const daysSince = Math.floor(
          (now.getTime() - lastInspection.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince > 21 && !existingKeys.has(`${projectId}:inspection_overdue`)) {
          newActions.push({
            projectId,
            createdById: engineerId,
            title: `Inspection overdue — ${projectName}`,
            description: `Last inspection was ${daysSince} days ago. Expected interval is 21 days.`,
            category: "inspection",
            priority: daysSince > 30 ? "critical" : "high",
            signal: "inspection_overdue",
            signalValue: `${daysSince} days`,
            source: "risk-engine-v1",
            href: `/engineer/sites/${projectId}`,
          });
        }
      }

      // ─── Issue actions ─────────────────────────────────────────────────
      const criticalIssues = project.issues.filter((i) => i.severity === "critical");
      if (criticalIssues.length > 0 && !existingKeys.has(`${projectId}:critical_issue`)) {
        newActions.push({
          projectId,
          createdById: engineerId,
          title: `Review critical issues — ${projectName}`,
          description: `${criticalIssues.length} critical issue${criticalIssues.length > 1 ? "s" : ""} require${criticalIssues.length === 1 ? "s" : ""} attention: ${criticalIssues[0].title}`,
          category: "issue",
          priority: "critical",
          signal: "critical_issue",
          signalValue: `${criticalIssues.length} critical`,
          source: "risk-engine-v1",
          href: `/engineer/evidence?projectId=${projectId}`,
        });
      }

      const openIssues = project.issues.filter(
        (i) => i.severity === "high" || i.severity === "medium"
      );
      if (openIssues.length > 2 && !existingKeys.has(`${projectId}:open_issues`)) {
        newActions.push({
          projectId,
          createdById: engineerId,
          title: `Review open issues — ${projectName}`,
          description: `${openIssues.length} open issues need review.`,
          category: "issue",
          priority: "medium",
          signal: "open_issues",
          signalValue: `${openIssues.length} open`,
          source: "risk-engine-v1",
          href: `/engineer/evidence?projectId=${projectId}`,
        });
      }

      // ─── Evidence actions ──────────────────────────────────────────────
      if (project.issues.length > 0 && project._count.photos === 0 && !existingKeys.has(`${projectId}:evidence_gap`)) {
        newActions.push({
          projectId,
          createdById: engineerId,
          title: `Upload site evidence — ${projectName}`,
          description: "Issues reported but no site photos uploaded yet.",
          category: "evidence",
          priority: "medium",
          signal: "evidence_gap",
          signalValue: "0 photos with open issues",
          source: "risk-engine-v1",
          href: `/engineer/sites/${projectId}`,
        });
      }

      // ─── Schedule actions ──────────────────────────────────────────────
      if (project.expectedCompletion) {
        const daysUntil = Math.floor(
          (project.expectedCompletion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil < 0 && !existingKeys.has(`${projectId}:schedule_overdue`)) {
          newActions.push({
            projectId,
            createdById: engineerId,
            title: `Timeline overdue — ${projectName}`,
            description: `Expected completion was ${Math.abs(daysUntil)} days ago.`,
            category: "schedule",
            priority: "critical",
            signal: "schedule_overdue",
            signalValue: `${Math.abs(daysUntil)} days overdue`,
            source: "risk-engine-v1",
            href: `/engineer/sites/${projectId}`,
          });
        } else if (daysUntil < 14 && project.progress < 70 && !existingKeys.has(`${projectId}:schedule_at_risk`)) {
          newActions.push({
            projectId,
            createdById: engineerId,
            title: `Schedule at risk — ${projectName}`,
            description: `${project.progress}% complete with ${daysUntil} days remaining.`,
            category: "schedule",
            priority: "high",
            signal: "schedule_at_risk",
            signalValue: `${project.progress}% in ${daysUntil}d`,
            source: "risk-engine-v1",
            href: `/engineer/sites/${projectId}`,
          });
        }
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    newActions.sort(
      (a, b) =>
        (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3)
    );

    // Persist new actions
    if (newActions.length > 0) {
      await db.actionItem.createMany({ data: newActions });
    }

    return NextResponse.json({
      created: newActions.length,
      message: `${newActions.length} new action(s) generated from project data.`,
    });
  } catch (error) {
    console.error("Actions generate API error:", error);
    return NextResponse.json({ error: "Failed to generate actions" }, { status: 500 });
  }
}

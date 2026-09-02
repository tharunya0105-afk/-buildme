import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface ActionItem {
  id: string;
  type: "inspection" | "issue" | "workforce" | "schedule" | "evidence";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  projectName: string;
  projectId: string;
  href: string;
}

/**
 * GET /api/dashboard/actions
 * Returns actionable items generated from real database records.
 * No fabricated data — every item has a real database basis.
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
    const actions: ActionItem[] = [];

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
          select: { id: true, severity: true, title: true, status: true },
        },
        workers: {
          where: { active: true },
          select: { id: true },
        },
        photos: { select: { id: true } },
        _count: { select: { inspections: true, photos: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const now = new Date();

    for (const project of projects) {
      const projectId = project.id;
      const projectName = project.name;

      // ─── Inspection Actions ────────────────────────────────────────────
      const lastInspection = project.inspections[0]?.inspectionDate;
      if (!lastInspection) {
        const daysSinceCreation = Math.floor(
          (now.getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreation > 7) {
          actions.push({
            id: `action-inspection-${projectId}`,
            type: "inspection",
            severity: daysSinceCreation > 14 ? "critical" : "warning",
            title: `No inspection recorded — ${projectName}`,
            description: `No inspections have been recorded in ${daysSinceCreation} days since project creation.`,
            projectName,
            projectId,
            href: `/engineer/sites/${projectId}`,
          });
        }
      } else {
        const daysSinceInspection = Math.floor(
          (now.getTime() - lastInspection.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceInspection > 21) {
          actions.push({
            id: `action-inspection-${projectId}`,
            type: "inspection",
            severity: daysSinceInspection > 30 ? "critical" : "warning",
            title: `Inspection overdue — ${projectName}`,
            description: `Last inspection was ${daysSinceInspection} days ago.`,
            projectName,
            projectId,
            href: `/engineer/sites/${projectId}`,
          });
        }
      }

      // ─── Issue Actions ─────────────────────────────────────────────────
      const criticalIssues = project.issues.filter(i => i.severity === "critical");
      if (criticalIssues.length > 0) {
        actions.push({
          id: `action-issue-critical-${projectId}`,
          type: "issue",
          severity: "critical",
          title: `${criticalIssues.length} critical issue${criticalIssues.length > 1 ? "s" : ""} — ${projectName}`,
          description: `${criticalIssues[0].title}${criticalIssues.length > 1 ? ` and ${criticalIssues.length - 1} more` : ""}`,
          projectName,
          projectId,
          href: `/engineer/evidence?projectId=${projectId}`,
        });
      } else {
        const openIssues = project.issues.filter(i => i.severity === "high" || i.status === "under_review");
        if (openIssues.length > 0) {
          actions.push({
            id: `action-issue-open-${projectId}`,
            type: "issue",
            severity: "warning",
            title: `${openIssues.length} open issue${openIssues.length > 1 ? "s" : ""} — ${projectName}`,
            description: `${openIssues[0].title}${openIssues.length > 1 ? ` and ${openIssues.length - 1} more` : ""}`,
            projectName,
            projectId,
            href: `/engineer/evidence?projectId=${projectId}`,
          });
        }
      }

      // ─── Schedule Actions ──────────────────────────────────────────────
      if (project.expectedCompletion) {
        const daysUntil = Math.floor(
          (project.expectedCompletion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil < 0) {
          actions.push({
            id: `action-schedule-${projectId}`,
            type: "schedule",
            severity: "critical",
            title: `Timeline overdue — ${projectName}`,
            description: `Expected completion was ${Math.abs(daysUntil)} days ago.`,
            projectName,
            projectId,
            href: `/engineer/sites/${projectId}`,
          });
        } else if (daysUntil < 14 && project.progress < 70) {
          actions.push({
            id: `action-schedule-${projectId}`,
            type: "schedule",
            severity: "warning",
            title: `Schedule at risk — ${projectName}`,
            description: `Only ${project.progress}% complete with ${daysUntil} days remaining.`,
            projectName,
            projectId,
            href: `/engineer/sites/${projectId}`,
          });
        }
      }

      // ─── Evidence Actions ──────────────────────────────────────────────
      if (project.issues.length > 0 && project._count.photos === 0) {
        actions.push({
          id: `action-evidence-${projectId}`,
          type: "evidence",
          severity: "warning",
          title: `Upload site evidence — ${projectName}`,
          description: "Issues have been reported but no site photos have been uploaded.",
          projectName,
          projectId,
          href: `/engineer/sites/${projectId}`,
        });
      }
    }

    // Sort: critical first, then warning, then info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Actions API error:", error);
    return NextResponse.json(
      { error: "Failed to load actions" },
      { status: 500 }
    );
  }
}

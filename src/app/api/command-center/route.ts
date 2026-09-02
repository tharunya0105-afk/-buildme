import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/command-center
 * Returns the Daily Command Center state: today's priorities, project attention, and AI brief.
 * All data is from real database records — no fabricated actions.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can access the command center" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;

    // Fetch all projects with their related data
    const projects = await db.project.findMany({
      where: { engineerId },
      include: {
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 2,
          select: { inspectionDate: true, id: true },
        },
        issues: {
          where: { status: { in: ["open", "under_review"] } },
          select: { id: true, severity: true, title: true, status: true, createdAt: true },
        },
        photos: { select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
        workers: {
          where: { active: true },
          select: { id: true },
        },
        _count: { select: { inspections: true, photos: true, issues: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // ─── Compute attention data for each project ──────────────────────────
    const projectData = projects.map((project) => {
      const lastInspection = project.inspections[0]?.inspectionDate;
      const daysSinceInspection = lastInspection
        ? Math.floor((now.getTime() - lastInspection.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const daysSinceCreation = Math.floor(
        (now.getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const openIssues = project.issues;
      const criticalIssues = openIssues.filter((i) => i.severity === "critical");
      const highIssues = openIssues.filter((i) => i.severity === "high");
      const lastPhoto = project.photos[0]?.createdAt;
      const daysSincePhoto = lastPhoto
        ? Math.floor((now.getTime() - lastPhoto.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Simple attention score (mirrors existing dashboard logic)
      let attentionScore = 0;
      const reasons: string[] = [];

      if (!lastInspection && daysSinceCreation > 7) {
        attentionScore += 30;
        reasons.push("No inspection recorded");
      } else if (daysSinceInspection !== null && daysSinceInspection > 21) {
        attentionScore += 25;
        reasons.push(`Inspection overdue by ${daysSinceInspection - 21} days`);
      }

      if (criticalIssues.length > 0) {
        attentionScore += 20;
        reasons.push(`${criticalIssues.length} critical issue(s)`);
      }
      if (highIssues.length > 0) {
        attentionScore += 10;
        reasons.push(`${highIssues.length} high-severity issue(s)`);
      }
      if (openIssues.length > 3) {
        attentionScore += 5;
        reasons.push(`${openIssues.length} open issues total`);
      }

      if (daysSincePhoto !== null && daysSincePhoto > 14) {
        attentionScore += 5;
        reasons.push("Evidence gap — no recent photos");
      }

      // Schedule check
      if (project.expectedCompletion) {
        const daysUntil = Math.floor(
          (project.expectedCompletion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil < 0) {
          attentionScore += 15;
          reasons.push(`Timeline overdue by ${Math.abs(daysUntil)} days`);
        } else if (daysUntil < 14 && project.progress < 70) {
          attentionScore += 10;
          reasons.push(`Schedule risk — ${project.progress}% complete, ${daysUntil} days left`);
        }
      }

      attentionScore = Math.min(attentionScore, 100);

      const level =
        attentionScore >= 40 ? "high" : attentionScore >= 20 ? "medium" : "low";

      return {
        id: project.id,
        name: project.name,
        city: project.city,
        status: project.status,
        progress: project.progress,
        currentStage: project.currentStage,
        attentionScore,
        attentionLevel: level,
        reasons,
        daysSinceInspection,
        openIssueCount: openIssues.length,
        criticalIssueCount: criticalIssues.length,
        hasPhotos: project._count.photos > 0,
        daysSincePhoto,
        updatedAt: project.updatedAt,
        stageLabel: project.currentStage || "Unknown",
      };
    });

    // Sort by attention score descending
    projectData.sort((a, b) => b.attentionScore - a.attentionScore);

    // ─── Compute today's priorities ───────────────────────────────────────
    const projectsNeedingAttention = projectData.filter((p) => p.attentionLevel !== "low");
    const totalOverdueInspections = projectData.filter(
      (p) => p.daysSinceInspection !== null && p.daysSinceInspection > 21
    ).length;
    const totalCriticalIssues = projectData.reduce((sum, p) => sum + p.criticalIssueCount, 0);
    const totalOpenIssues = projectData.reduce((sum, p) => sum + p.openIssueCount, 0);
    const evidenceGaps = projectData.filter(
      (p) => p.openIssueCount > 0 && !p.hasPhotos
    ).length;

    // ─── Generate AI Daily Brief (deterministic) ──────────────────────────
    let aiBrief = "";
    if (projectsNeedingAttention.length === 0) {
      aiBrief = "All projects are on track. No immediate actions required.";
    } else {
      const topProject = projectsNeedingAttention[0];
      const parts: string[] = [];
      parts.push(
        `${projectsNeedingAttention.length} project${projectsNeedingAttention.length > 1 ? "s" : ""} require${projectsNeedingAttention.length === 1 ? "s" : ""} attention.`
      );
      if (topProject.reasons.length > 0) {
        parts.push(
          `Highest priority: ${topProject.name} — ${topProject.reasons[0].toLowerCase()}.`
        );
      }
      if (totalCriticalIssues > 0) {
        parts.push(`${totalCriticalIssues} critical issue${totalCriticalIssues > 1 ? "s" : ""} open.`);
      }
      if (totalOverdueInspections > 0) {
        parts.push(
          `${totalOverdueInspections} overdue inspection${totalOverdueInspections > 1 ? "s" : ""}.`
        );
      }
      if (evidenceGaps > 0) {
        parts.push(`${evidenceGaps} evidence gap${evidenceGaps > 1 ? "s" : ""} to address.`);
      }
      aiBrief = parts.join(" ");
    }

    return NextResponse.json({
      date: today,
      engineer: (session.user as any).name || "Engineer",
      summary: {
        totalProjects: projects.length,
        projectsNeedingAttention: projectsNeedingAttention.length,
        overdueInspections: totalOverdueInspections,
        criticalIssues: totalCriticalIssues,
        openIssues: totalOpenIssues,
        evidenceGaps,
      },
      projects: projectData,
      aiBrief,
      engineVersion: "risk-engine-v1",
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Command center API error:", error);
    return NextResponse.json(
      { error: "Failed to load command center" },
      { status: 500 }
    );
  }
}

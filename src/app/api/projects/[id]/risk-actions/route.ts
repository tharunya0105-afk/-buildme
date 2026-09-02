import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateProjectHealth, HealthAction } from "@/lib/spatial/project-health";

/**
 * GET /api/projects/[id]/risk-actions
 * Returns explainable risk signals with recommended actions for a specific project.
 * Each action traces back to real database evidence.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { id: projectId } = await context.params;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 1,
          select: { inspectionDate: true },
        },
        photos: { select: { id: true } },
        issues: {
          select: { id: true, severity: true, status: true },
        },
        workers: {
          where: { active: true },
          select: { id: true },
        },
        aiAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { overallAssessment: true },
        },
        _count: { select: { inspections: true, photos: true, aiAnalyses: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Authorization
    if (role === "engineer" && project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (role === "homeowner" && project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Compute workforce data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckIns = await db.workerCheckIn.findMany({
      where: { projectId, checkInTime: { gte: today } },
      select: { verificationStatus: true, workerId: true },
    });

    const verifiedToday = new Set(
      todayCheckIns.filter(c => c.verificationStatus === "verified").map(c => c.workerId)
    ).size;
    const outsideGeofence = todayCheckIns.filter(c => c.verificationStatus === "outside_geofence").length;

    const openIssues = project.issues.filter(i => i.status === "open" || i.status === "under_review").length;
    const criticalIssues = project.issues.filter(i => i.severity === "critical" && i.status !== "resolved").length;
    const highSeverityIssues = project.issues.filter(i => i.severity === "high" && i.status !== "resolved").length;
    const resolvedIssues = project.issues.filter(i => i.status === "resolved").length;
    const issuesUnderReview = project.issues.filter(i => i.status === "under_review").length;

    const health = calculateProjectHealth({
      projectId: project.id,
      projectName: project.name,
      currentStage: project.currentStage,
      progress: project.progress,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      expectedCompletion: project.expectedCompletion?.toISOString() ?? null,
      builtArea: project.builtArea,
      lastInspectionDate: project.inspections[0]?.inspectionDate?.toISOString() ?? null,
      totalInspections: project._count.inspections,
      totalPhotos: project._count.photos,
      openIssues,
      highSeverityIssues,
      criticalIssues,
      issuesUnderReview,
      totalIssues: project.issues.length,
      resolvedIssues,
      totalWorkers: project.workers.length,
      activeWorkers: project.workers.length,
      todayVerifiedCheckIns: verifiedToday,
      todayOutsideGeofence: outsideGeofence,
      todayNotCheckedIn: project.workers.length - todayCheckIns.length,
      hasAnomalies: false,
      totalAiAnalyses: project._count.aiAnalyses,
      latestAiAssessment: project.aiAnalyses[0]?.overallAssessment ?? null,
      aiReviewRecommended: project.aiAnalyses.some(a => a.overallAssessment === "review_recommended"),
      daysSinceLastUpdate: Math.floor((Date.now() - project.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
    });

    // Trace each action back to database evidence
    const tracedActions = health.actions.map(action => ({
      ...action,
      evidence: getEvidenceForAction(action, project),
    }));

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      overallScore: health.overallScore,
      riskLevel: health.riskLevel,
      summary: health.summary,
      actions: tracedActions,
      disclaimer: "BuildMe records observations and generates recommendations. Final decisions remain with the involved professionals.",
      calculatedAt: health.calculatedAt,
    });
  } catch (error) {
    console.error("Risk actions API error:", error);
    return NextResponse.json({ error: "Failed to compute risk actions" }, { status: 500 });
  }
}

function getEvidenceForAction(action: HealthAction, project: any): string {
  switch (action.category) {
    case "inspection": {
      const lastDate = project.inspections[0]?.inspectionDate;
      if (lastDate) {
        const days = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return `Last inspection: ${days} days ago (${new Date(lastDate).toLocaleDateString()})`;
      }
      return `No inspections recorded in ${Math.floor((Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days`;
    }
    case "issue": {
      const critical = project.issues.filter((i: any) => i.severity === "critical" && i.status !== "resolved").length;
      const high = project.issues.filter((i: any) => i.severity === "high" && i.status !== "resolved").length;
      return `${critical} critical, ${high} high-severity issues in database`;
    }
    case "workforce": {
      const workers = project.workers.length;
      return `${workers} active workers assigned to this project`;
    }
    case "schedule": {
      if (project.expectedCompletion) {
        const daysUntil = Math.floor((project.expectedCompletion.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil < 0
          ? `Expected completion was ${Math.abs(daysUntil)} days ago`
          : `${daysUntil} days until expected completion`;
      }
      return "No expected completion date set";
    }
    case "evidence": {
      return `${project._count.photos} photos uploaded, ${project._count.inspections} inspections recorded`;
    }
    default:
      return "";
  }
}

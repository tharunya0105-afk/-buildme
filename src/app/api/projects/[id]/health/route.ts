import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateProjectHealth, HealthInput } from "@/lib/spatial/project-health";

/**
 * GET /api/projects/[id]/health
 * Returns a comprehensive Project Health Score for a specific project.
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

    // Fetch the project with all related data
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        inspections: {
          orderBy: { inspectionDate: "desc" },
          select: { inspectionDate: true, photos: { select: { id: true } } },
        },
        photos: { select: { id: true } },
        issues: {
          select: { id: true, severity: true, status: true },
        },
        workers: {
          where: { active: true },
          select: { id: true },
        },
        alerts: {
          where: { resolved: false },
          select: { id: true, severity: true },
        },
        aiAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { overallAssessment: true },
        },
        _count: {
          select: {
            inspections: true,
            photos: true,
            aiAnalyses: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Authorization check
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
      where: {
        projectId,
        checkInTime: { gte: today },
      },
      select: {
        verificationStatus: true,
        workerId: true,
        checkInTime: true,
      },
    });

    const activeWorkerIds = project.workers.map(w => w.id);
    const verifiedToday = new Set(
      todayCheckIns
        .filter(c => c.verificationStatus === "verified")
        .map(c => c.workerId)
    ).size;
    const outsideGeofence = todayCheckIns.filter(
      c => c.verificationStatus === "outside_geofence"
    ).length;

    // Check for anomalies (same worker at multiple sites within 1 hour)
    const hasAnomalies = await checkForAnomalies(project.engineerId);

    // Issue counts
    const openIssues = project.issues.filter(i => i.status === "open" || i.status === "under_review").length;
    const highSeverityIssues = project.issues.filter(i => i.severity === "high" && i.status !== "resolved").length;
    const criticalIssues = project.issues.filter(i => i.severity === "critical" && i.status !== "resolved").length;
    const issuesUnderReview = project.issues.filter(i => i.status === "under_review").length;
    const resolvedIssues = project.issues.filter(i => i.status === "resolved").length;

    const lastInspectionDate = project.inspections[0]?.inspectionDate?.toISOString() ?? null;
    const daysSinceLastUpdate = Math.floor(
      (Date.now() - project.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const healthInput: HealthInput = {
      projectId: project.id,
      projectName: project.name,
      currentStage: project.currentStage,
      progress: project.progress,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      expectedCompletion: project.expectedCompletion?.toISOString() ?? null,
      builtArea: project.builtArea,
      lastInspectionDate,
      totalInspections: project._count.inspections,
      totalPhotos: project._count.photos,
      openIssues,
      highSeverityIssues,
      criticalIssues,
      issuesUnderReview,
      totalIssues: project.issues.length,
      resolvedIssues,
      totalWorkers: project.workers.length,
      activeWorkers: activeWorkerIds.length,
      todayVerifiedCheckIns: verifiedToday,
      todayOutsideGeofence: outsideGeofence,
      todayNotCheckedIn: activeWorkerIds.length - todayCheckIns.length,
      hasAnomalies,
      totalAiAnalyses: project._count.aiAnalyses,
      latestAiAssessment: project.aiAnalyses[0]?.overallAssessment ?? null,
      aiReviewRecommended: project.aiAnalyses.some(a => a.overallAssessment === "review_recommended"),
      daysSinceLastUpdate,
    };

    const health = calculateProjectHealth(healthInput);

    return NextResponse.json(health);
  } catch (error) {
    console.error("Project health API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate project health" },
      { status: 500 }
    );
  }
}

/**
 * Check for workforce location anomalies across the engineer's projects.
 * Returns true if any worker was verified at two different sites within 1 hour.
 */
async function checkForAnomalies(engineerId: string): Promise<boolean> {
  try {
    // Get all projects for this engineer
    const projects = await db.project.findMany({
      where: { engineerId },
      select: { id: true },
    });

    const projectIds = projects.map(p => p.id);

    // Get recent check-ins (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCheckIns = await db.workerCheckIn.findMany({
      where: {
        projectId: { in: projectIds },
        verificationStatus: "verified",
        checkInTime: { gte: oneDayAgo },
      },
      select: {
        workerId: true,
        projectId: true,
        checkInTime: true,
      },
      orderBy: { checkInTime: "desc" },
    });

    // Group by worker
    const workerCheckIns = new Map<string, Array<{ projectId: string; checkInTime: Date }>>();
    for (const ci of recentCheckIns) {
      if (!workerCheckIns.has(ci.workerId)) {
        workerCheckIns.set(ci.workerId, []);
      }
      workerCheckIns.get(ci.workerId)!.push({
        projectId: ci.projectId,
        checkInTime: ci.checkInTime,
      });
    }

    // Check for same worker at different sites within 1 hour
    for (const checkIns of workerCheckIns.values()) {
      for (let i = 0; i < checkIns.length - 1; i++) {
        for (let j = i + 1; j < checkIns.length; j++) {
          if (checkIns[i].projectId !== checkIns[j].projectId) {
            const timeDiff = Math.abs(
              checkIns[i].checkInTime.getTime() - checkIns[j].checkInTime.getTime()
            );
            const oneHourMs = 60 * 60 * 1000;
            if (timeDiff < oneHourMs) {
              return true;
            }
          }
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

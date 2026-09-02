import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateRiskIntelligence, type FeatureInput } from "@/lib/intelligence/risk-engine";
import { haversineDistance } from "@/lib/spatial/geo-utils";

/**
 * GET /api/projects/[id]/risk
 * Returns comprehensive risk intelligence for a project.
 * Requires authentication and project ownership.
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

    // Fetch project with all related data
    // Using any to avoid Prisma include type inference issues on the server
    const project: any = await db.project.findUnique({
      where: { id: projectId },
      include: {
        inspections: {
          orderBy: { inspectionDate: "desc" },
          select: { inspectionDate: true, photos: { select: { id: true } } },
        },
        photos: { select: { id: true, createdAt: true } },
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

    // ── Compute inspection data ──
    const lastInspectionDate = project.inspections[0]?.inspectionDate?.toISOString() ?? null;

    // ── Compute issue data ──
    const openIssues = project.issues.filter(
      (i: any) => i.status === "open" || i.status === "under_review"
    ).length;
    const criticalIssues = project.issues.filter(
      (i: any) => i.severity === "critical" && i.status !== "resolved"
    ).length;
    const highSeverityIssues = project.issues.filter(
      (i: any) => i.severity === "high" && i.status !== "resolved"
    ).length;
    const resolvedIssues = project.issues.filter((i: any) => i.status === "resolved").length;

    // ── Compute workforce data ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckIns = await db.workerCheckIn.findMany({
      where: { projectId, checkInTime: { gte: today } },
      select: { verificationStatus: true, workerId: true },
    });
    const activeWorkerIds: string[] = project.workers.map((w: any) => w.id);
    const verifiedToday = new Set(
      todayCheckIns.filter((c: any) => c.verificationStatus === "verified").map((c: any) => c.workerId)
    ).size;
    const outsideGeofence = todayCheckIns.filter(
      (c: any) => c.verificationStatus === "outside_geofence"
    ).length;

    // ── Anomaly check ──
    const hasAnomalies = await checkForAnomalies(project.engineerId);

    // ── Nearby projects ──
    const nearbyProjects = await findNearbyProjectsWithRisk(
      projectId, project.latitude, project.longitude, project.engineerId
    );

    // ── Build feature input ──
    const featureInput: FeatureInput = {
      projectId: project.id,
      projectName: project.name,
      currentStage: project.currentStage,
      progress: project.progress,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      expectedCompletion: project.expectedCompletion?.toISOString() ?? null,
      builtArea: project.builtArea,
      latitude: project.latitude,
      longitude: project.longitude,

      lastInspectionDate,
      totalInspections: project._count.inspections,
      totalPhotos: project._count.photos,

      openIssues,
      criticalIssues,
      highSeverityIssues,
      totalIssues: project.issues.length,
      resolvedIssues,
      issuesWithoutPhotos: 0, // not available on Issue model

      totalWorkers: project.workers.length,
      activeWorkers: activeWorkerIds.length,
      todayVerifiedCheckIns: verifiedToday,
      todayOutsideGeofence: outsideGeofence,
      hasAnomalies,

      totalAiAnalyses: project._count.aiAnalyses,
      aiReviewRecommended: project.aiAnalyses.some(
        (a: any) => a.overallAssessment === "review_recommended"
      ),

      nearbyProjects,
    };

    // ── Calculate risk intelligence ──
    const result = calculateRiskIntelligence(featureInput);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Risk intelligence API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate risk intelligence" },
      { status: 500 }
    );
  }
}

/**
 * Check for workforce location anomalies across the engineer's projects.
 */
async function checkForAnomalies(engineerId: string): Promise<boolean> {
  try {
    const projects = await db.project.findMany({
      where: { engineerId },
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCheckIns = await db.workerCheckIn.findMany({
      where: {
        projectId: { in: projectIds },
        verificationStatus: "verified",
        checkInTime: { gte: oneDayAgo },
      },
      select: { workerId: true, projectId: true, checkInTime: true },
      orderBy: { checkInTime: "desc" },
    });

    const workerCheckIns = new Map<string, Array<{ projectId: string; checkInTime: Date }>>();
    for (const ci of recentCheckIns) {
      if (!workerCheckIns.has(ci.workerId)) workerCheckIns.set(ci.workerId, []);
      workerCheckIns.get(ci.workerId)!.push({ projectId: ci.projectId, checkInTime: ci.checkInTime });
    }

    for (const checkIns of workerCheckIns.values()) {
      for (let i = 0; i < checkIns.length - 1; i++) {
        for (let j = i + 1; j < checkIns.length; j++) {
          if (checkIns[i].projectId !== checkIns[j].projectId) {
            const timeDiff = Math.abs(checkIns[i].checkInTime.getTime() - checkIns[j].checkInTime.getTime());
            if (timeDiff < 60 * 60 * 1000) return true;
          }
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Find nearby projects with their risk scores (for spatial context).
 */
async function findNearbyProjectsWithRisk(
  currentProjectId: string,
  lat: number | null,
  lng: number | null,
  engineerId: string
): Promise<Array<{ id: string; name: string; distanceKm: number; riskScore: number }>> {
  if (!lat || !lng) return [];

  try {
    const allProjects = await db.project.findMany({
      where: { engineerId, id: { not: currentProjectId } },
      select: { id: true, name: true, latitude: true, longitude: true, status: true },
    });

    const nearby = allProjects
      .filter((p: any) => p.latitude && p.longitude)
      .map((p: any) => {
        const dist = haversineDistance(lat, lng, p.latitude!, p.longitude!);
        let riskScore = 30;
        if (p.status === "review") riskScore = 70;
        else if (p.status === "attention") riskScore = 50;
        return { id: p.id, name: p.name, distanceKm: Math.round(dist * 10) / 10, riskScore };
      })
      .filter((p: any) => p.distanceKm <= 25)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 10);

    return nearby;
  } catch {
    return [];
  }
}

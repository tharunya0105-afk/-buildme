import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/workforce/summary?projectId=...
 * Returns workforce summary for a project or all projects.
 * All data comes from the database — no hardcoded values.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can access workforce summary" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Single project summary
      const project = await db.project.findFirst({
        where: { id: projectId, engineerId },
      });
      if (!project) {
        return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
      }

      const totalWorkers = await db.worker.count({
        where: { projectId, active: true },
      });

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Today's check-ins — only the latest per worker
      const todayCheckIns = await db.workerCheckIn.findMany({
        where: {
          projectId,
          checkInTime: { gte: today, lt: tomorrow },
        },
        include: {
          worker: { select: { id: true, name: true, workerType: true } },
        },
        orderBy: { checkInTime: "desc" },
      });

      // Deduplicate: keep only latest check-in per worker
      const latestCheckIns = new Map<string, typeof todayCheckIns[0]>();
      for (const ci of todayCheckIns) {
        if (!latestCheckIns.has(ci.workerId)) {
          latestCheckIns.set(ci.workerId, ci);
        }
      }
      const uniqueCheckIns = Array.from(latestCheckIns.values());

      const verifiedCount = uniqueCheckIns.filter(c => c.verificationStatus === "verified").length;
      const outsideCount = uniqueCheckIns.filter(c => c.verificationStatus === "outside_geofence").length;
      const lowAccuracyCount = uniqueCheckIns.filter(c => c.verificationStatus === "low_accuracy").length;
      const pendingCount = uniqueCheckIns.filter(c => c.verificationStatus === "pending").length;
      const checkedInIds = new Set(uniqueCheckIns.map(c => c.workerId));
      const notCheckedIn = totalWorkers - checkedInIds.size;

      const verificationRate = totalWorkers > 0
        ? Math.round((verifiedCount / totalWorkers) * 100)
        : 0;

      return NextResponse.json({
        projectId: project.id,
        projectName: project.name,
        totalWorkers,
        verifiedOnSite: verifiedCount,
        outsideGeofence: outsideCount,
        lowAccuracy: lowAccuracyCount,
        pending: pendingCount,
        notCheckedIn,
        verificationRate,
        checkIns: uniqueCheckIns.map(c => ({
          id: c.id,
          workerId: c.workerId,
          workerName: c.worker.name,
          workerType: c.worker.workerType,
          latitude: c.latitude,
          longitude: c.longitude,
          distanceFromSite: c.distanceFromSite,
          verificationStatus: c.verificationStatus,
          checkInTime: c.checkInTime.toISOString(),
        })),
      });
    }

    // All projects summary (for multi-site engineer overview)
    const projects = await db.project.findMany({
      where: { engineerId },
      include: {
        workers: {
          where: { active: true },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const summaries = [];

    for (const project of projects) {
      const totalWorkers = project.workers.length;

      if (totalWorkers === 0) {
        summaries.push({
          projectId: project.id,
          projectName: project.name,
          city: project.city,
          totalWorkers: 0,
          verifiedOnSite: 0,
          outsideGeofence: 0,
          notCheckedIn: 0,
          verificationRate: 0,
        });
        continue;
      }

      const todayCheckIns = await db.workerCheckIn.findMany({
        where: {
          projectId: project.id,
          checkInTime: { gte: today, lt: tomorrow },
        },
        include: {
          worker: { select: { id: true } },
        },
        orderBy: { checkInTime: "desc" },
      });

      const latestCheckIns = new Map<string, string>();
      for (const ci of todayCheckIns) {
        if (!latestCheckIns.has(ci.workerId)) {
          latestCheckIns.set(ci.workerId, ci.verificationStatus);
        }
      }

      const verifiedCount = Array.from(latestCheckIns.values()).filter(s => s === "verified").length;
      const outsideCount = Array.from(latestCheckIns.values()).filter(s => s === "outside_geofence").length;
      const notCheckedIn = totalWorkers - latestCheckIns.size;

      summaries.push({
        projectId: project.id,
        projectName: project.name,
        city: project.city,
        totalWorkers,
        verifiedOnSite: verifiedCount,
        outsideGeofence: outsideCount,
        notCheckedIn,
        verificationRate: totalWorkers > 0 ? Math.round((verifiedCount / totalWorkers) * 100) : 0,
      });
    }

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error("Workforce summary error:", error);
    return NextResponse.json({ error: "Failed to load workforce summary" }, { status: 500 });
  }
}

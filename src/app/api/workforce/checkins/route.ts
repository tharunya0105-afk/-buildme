import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Haversine distance calculation (server-side).
 * Returns distance in METRES.
 */
function haversineDistanceMetres(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth's radius in metres
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine verification status based on distance and accuracy.
 * IMPORTANT: This is server-side — the client NEVER determines verification status.
 */
function determineVerificationStatus(
  distanceMetres: number,
  accuracy: number | null,
  geofenceRadius: number
): string {
  // Low accuracy GPS — unreliable
  if (accuracy !== null && accuracy > 50) {
    return "low_accuracy";
  }
  // Within geofence
  if (distanceMetres <= geofenceRadius) {
    return "verified";
  }
  // Outside geofence
  return "outside_geofence";
}

/**
 * POST /api/workforce/checkins
 * Create a worker check-in with server-side geofence verification.
 * The client submits coordinates; the SERVER determines verification status.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can record check-ins" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const body = await request.json();
    const { workerId, latitude, longitude, accuracy, notes, geofenceRadius } = body;

    // Validate inputs
    if (!workerId) {
      return NextResponse.json({ error: "workerId is required" }, { status: 400 });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Valid latitude and longitude are required" }, { status: 400 });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    if (accuracy !== undefined && accuracy !== null && (typeof accuracy !== "number" || accuracy < 0)) {
      return NextResponse.json({ error: "Invalid accuracy value" }, { status: 400 });
    }

    // Find worker and verify ownership through project
    const worker = await db.worker.findFirst({
      where: {
        id: workerId,
        active: true,
        project: { engineerId },
      },
      include: { project: true },
    });
    if (!worker) {
      return NextResponse.json({ error: "Worker not found or access denied" }, { status: 404 });
    }

    const project = worker.project;

    // Require project to have coordinates
    if (project.latitude === null || project.longitude === null) {
      return NextResponse.json(
        { error: "Project has no GPS coordinates. Cannot verify geofence." },
        { status: 400 }
      );
    }

    // Calculate distance from site (server-side)
    const distanceMetres = haversineDistanceMetres(
      latitude, longitude,
      project.latitude, project.longitude
    );

    // Determine allowed radius (use provided or default 100m)
    const allowedRadius = typeof geofenceRadius === "number" && geofenceRadius > 0
      ? geofenceRadius
      : 100;

    // SERVER determines verification status — never trust the client
    const verificationStatus = determineVerificationStatus(
      distanceMetres,
      accuracy ?? null,
      allowedRadius
    );

    // Check for location anomaly: same worker checked in at a distant site recently
    const recentCheckIn = await db.workerCheckIn.findFirst({
      where: {
        workerId,
        verificationStatus: "verified",
        checkInTime: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // last hour
        },
      },
      orderBy: { checkInTime: "desc" },
    });

    // Check if this worker has a checked-in status today that hasn't been checked out
    const existingCheckIn = await db.workerCheckIn.findFirst({
      where: {
        workerId,
        checkOutTime: null,
      },
      orderBy: { checkInTime: "desc" },
    });

    // Auto-checkout previous if exists
    if (existingCheckIn) {
      await db.workerCheckIn.update({
        where: { id: existingCheckIn.id },
        data: { checkOutTime: new Date() },
      });
    }

    // Create check-in record
    const checkIn = await db.workerCheckIn.create({
      data: {
        workerId,
        projectId: project.id,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        siteLatitude: project.latitude,
        siteLongitude: project.longitude,
        distanceFromSite: Math.round(distanceMetres * 100) / 100,
        geofenceRadius: allowedRadius,
        verificationStatus,
        checkedInById: engineerId,
        notes: notes || null,
      },
      include: {
        worker: { select: { name: true, workerType: true } },
      },
    });

    // Track product event
    await db.productEvent.create({
      data: { userId: engineerId, projectId: project.id, eventType: "workforce_checkin", metadata: JSON.stringify({ workerId, verificationStatus, distanceFromSite: checkIn.distanceFromSite }) },
    }).catch(() => {});

    return NextResponse.json({
      checkIn,
      location: {
        distanceMetres: checkIn.distanceFromSite,
        siteLatitude: project.latitude,
        siteLongitude: project.longitude,
        geofenceRadius: allowedRadius,
      },
      verification: {
        status: verificationStatus,
        distanceFormatted: checkIn.distanceFromSite < 1000
          ? `${Math.round(checkIn.distanceFromSite)}m`
          : `${(checkIn.distanceFromSite / 1000).toFixed(1)} km`,
        accuracyFormatted: accuracy ? `${Math.round(accuracy)}m` : "Unknown",
      },
      // Flag potential anomaly for engineer review
      anomaly: recentCheckIn ? {
        message: "This worker was verified at another site within the last hour. Location sequence requires review.",
        previousCheckInTime: recentCheckIn.checkInTime,
      } : null,
    }, { status: 201 });
  } catch (error) {
    console.error("Check-in POST error:", error);
    return NextResponse.json({ error: "Failed to record check-in" }, { status: 500 });
  }
}

/**
 * GET /api/workforce/checkins?projectId=...
 * Returns check-ins for a project (filtered by engineer ownership).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can view check-ins" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const dateStr = searchParams.get("date"); // optional: YYYY-MM-DD

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Verify project belongs to this engineer
    const project = await db.project.findFirst({
      where: { id: projectId, engineerId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Build date filter
    const dateFilter: Record<string, Date> = {};
    if (dateStr) {
      const date = new Date(dateStr);
      dateFilter.gte = date;
      dateFilter.lt = new Date(date.getTime() + 86400000);
    }

    const checkIns = await db.workerCheckIn.findMany({
      where: {
        projectId,
        ...(dateStr ? { checkInTime: dateFilter } : {}),
      },
      include: {
        worker: { select: { id: true, name: true, workerType: true } },
      },
      orderBy: { checkInTime: "desc" },
      take: 100,
    });

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error("Check-ins GET error:", error);
    return NextResponse.json({ error: "Failed to load check-ins" }, { status: 500 });
  }
}

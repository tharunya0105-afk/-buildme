import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/pilots
 * Returns all pilots for the current engineer.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    let pilots;
    if (role === "engineer") {
      pilots = await db.pilot.findMany({
        where: { createdById: userId },
        include: {
          project: { select: { id: true, name: true, city: true, status: true, progress: true, currentStage: true } },
          measurements: { select: { id: true, category: true, metricName: true, baselineValue: true, currentValue: true, unit: true, notes: true } },
          feedback: { select: { id: true, rating: true, category: true, feedback: true } },
          _count: { select: { measurements: true, feedback: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Homeowner can only see pilots for their assigned project
      const project = await db.project.findFirst({ where: { homeownerId: userId } });
      if (!project) {
        return NextResponse.json({ pilots: [] });
      }
      pilots = await db.pilot.findMany({
        where: { projectId: project.id },
        include: {
          project: { select: { id: true, name: true, city: true } },
          _count: { select: { measurements: true, feedback: true } },
        },
      });
    }

    return NextResponse.json({ pilots });
  } catch (error) {
    console.error("Pilots GET error:", error);
    return NextResponse.json({ error: "Failed to load pilots" }, { status: 500 });
  }
}

/**
 * POST /api/pilots
 * Create a new pilot (engineer only).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can create pilots" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const { projectId, participantName, participantEmail, participantRole, customerSegment, hypothesis, objectives, startDate, expectedEndDate, durationDays, baselineProcess, notes, status } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const pilot = await db.pilot.create({
      data: {
        projectId,
        createdById: userId,
        participantName: participantName || null,
        participantEmail: participantEmail || null,
        participantRole: participantRole || null,
        customerSegment: customerSegment || null,
        hypothesis: hypothesis || null,
        objectives: objectives || "[]",
        status: status || "selected",
        startDate: startDate ? new Date(startDate) : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        durationDays: durationDays || null,
        baselineProcess: baselineProcess || null,
        notes: notes || null,
      },
      include: {
        project: { select: { id: true, name: true, city: true, status: true, progress: true, currentStage: true } },
        measurements: { select: { id: true, category: true, metricName: true, baselineValue: true, currentValue: true, unit: true, notes: true } },
        feedback: { select: { id: true, rating: true, category: true, feedback: true } },
        _count: { select: { measurements: true, feedback: true } },
      },
    });

    // Track event
    await db.productEvent.create({
      data: { userId, projectId, eventType: "pilot_created", metadata: JSON.stringify({ pilotId: pilot.id }) },
    });

    return NextResponse.json({ success: true, pilot });
  } catch (error) {
    console.error("Pilots POST error:", error);
    return NextResponse.json({ error: "Failed to create pilot" }, { status: 500 });
  }
}

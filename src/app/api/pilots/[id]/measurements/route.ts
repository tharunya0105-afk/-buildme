import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/pilots/[id]/measurements
 * Add a measurement to a pilot (engineer only).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can add measurements" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { id: pilotId } = await context.params;
    const body = await request.json();

    // Verify pilot ownership
    const pilot = await db.pilot.findUnique({ where: { id: pilotId } });
    if (!pilot) {
      return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
    }
    if (pilot.createdById !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { category, metricName, baselineValue, currentValue, unit, notes } = body;

    if (!category || !metricName) {
      return NextResponse.json({ error: "category and metricName are required" }, { status: 400 });
    }

    const measurement = await db.pilotMeasurement.create({
      data: {
        pilotId,
        category,
        metricName,
        baselineValue: baselineValue !== undefined ? parseFloat(baselineValue) : null,
        currentValue: currentValue !== undefined ? parseFloat(currentValue) : null,
        unit: unit || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, measurement });
  } catch (error) {
    console.error("Measurement POST error:", error);
    return NextResponse.json({ error: "Failed to add measurement" }, { status: 500 });
  }
}

/**
 * GET /api/pilots/[id]/measurements
 * Get all measurements for a pilot.
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

    const { id: pilotId } = await context.params;
    const measurements = await db.pilotMeasurement.findMany({
      where: { pilotId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    console.error("Measurements GET error:", error);
    return NextResponse.json({ error: "Failed to load measurements" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/pilots/[id]
 * Returns pilot details with measurements and feedback.
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

    const { id } = await context.params;
    const pilot = await db.pilot.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, city: true, currentStage: true, progress: true } },
        measurements: { orderBy: { createdAt: "desc" } },
        feedback: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
        _count: { select: { measurements: true, feedback: true } },
      },
    });

    if (!pilot) {
      return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
    }

    // Authorization
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role === "engineer" && pilot.createdById !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (role === "homeowner") {
      const project = await db.project.findUnique({ where: { id: pilot.projectId } });
      if (!project || project.homeownerId !== userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ pilot });
  } catch (error) {
    console.error("Pilot GET error:", error);
    return NextResponse.json({ error: "Failed to load pilot" }, { status: 500 });
  }
}

/**
 * PATCH /api/pilots/[id]
 * Update pilot status and details (engineer only).
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can update pilots" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.pilot.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
    }
    if (existing.createdById !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { status, featuresUsed, currentProcess, problemsObserved, outcome, notes, endDate } = body;

    const pilot = await db.pilot.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(featuresUsed !== undefined && { featuresUsed: JSON.stringify(featuresUsed) }),
        ...(currentProcess !== undefined && { currentProcess }),
        ...(problemsObserved !== undefined && { problemsObserved }),
        ...(outcome !== undefined && { outcome }),
        ...(notes !== undefined && { notes }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: { project: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, pilot });
  } catch (error) {
    console.error("Pilot PATCH error:", error);
    return NextResponse.json({ error: "Failed to update pilot" }, { status: 500 });
  }
}

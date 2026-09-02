import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/workers?projectId=...
 * Returns workers for a given project (filtered by engineer ownership).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can access workers" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

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

    const workers = await db.worker.findMany({
      where: { projectId },
      include: {
        checkIns: {
          orderBy: { checkInTime: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ workers });
  } catch (error) {
    console.error("Workers GET error:", error);
    return NextResponse.json({ error: "Failed to load workers" }, { status: 500 });
  }
}

/**
 * POST /api/workers
 * Create a new worker assigned to a project.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can manage workers" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const body = await request.json();
    const { projectId, name, phone, workerType } = body;

    if (!projectId || !name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "projectId and name are required" }, { status: 400 });
    }

    // Verify project belongs to this engineer
    const project = await db.project.findFirst({
      where: { id: projectId, engineerId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const worker = await db.worker.create({
      data: {
        projectId: projectId,
        name: name.trim(),
        phone: phone || null,
        workerType: workerType || null,
        assignedById: engineerId,
      },
    });

    return NextResponse.json({ worker }, { status: 201 });
  } catch (error) {
    console.error("Workers POST error:", error);
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
  }
}

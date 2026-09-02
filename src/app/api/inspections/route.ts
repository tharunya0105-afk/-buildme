import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/inspections - List inspections for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause: any = {};

    if (role === "engineer") {
      whereClause.project = { engineerId: userId };
    } else {
      whereClause.project = { homeownerId: userId };
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const inspections = await db.inspection.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        photos: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: { inspectionDate: "desc" },
      take: limit,
    });

    return NextResponse.json(inspections);
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}

// POST /api/inspections - Create a new inspection (engineer only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;

    if (role !== "engineer") {
      return NextResponse.json(
        { error: "Only engineers can create inspections" },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { projectId, stage, notes, inspectionDate } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create the inspection
    const inspection = await db.inspection.create({
      data: {
        projectId,
        engineerId: userId,
        stage: stage || project.currentStage,
        notes: notes?.trim() || null,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : new Date(),
      },
    });

    // Update project's updatedAt
    await db.project.update({
      where: { id: projectId },
      data: {
        updatedAt: new Date(),
        // Update stage if changed
        ...(stage && stage !== project.currentStage
          ? { currentStage: stage }
          : {}),
      },
    });

    // Create timeline event
    const stageLabel =
      stage || project.currentStage || "Unknown";
    await db.timelineEvent.create({
      data: {
        projectId,
        type: "inspection",
        title: "Inspection completed",
        description: `Stage: ${stageLabel}`,
      },
    });

    // Track product event
    await db.productEvent.create({
      data: { userId, projectId, eventType: "inspection_created", metadata: JSON.stringify({ stage }) },
    }).catch(() => {});

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json(
      { error: "Failed to create inspection" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/ai/predictions
 * List AI predictions for the current user's projects.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    // Only show predictions for this user's projects
    const predictions = await db.aiPrediction.findMany({
      where: {
        ...where,
        project: { engineerId: userId },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(predictions);
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ai/predictions
 * Create a new AI prediction record.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId, propertyId, inspectionId, photoId,
      modelName, modelVersion, prediction, predictionCategory,
      confidence, severity, explanation, inputMetadata,
    } = body;

    const newPrediction = await db.aiPrediction.create({
      data: {
        projectId: projectId || null,
        propertyId: propertyId || null,
        inspectionId: inspectionId || null,
        photoId: photoId || null,
        modelName: modelName || "Unknown",
        modelVersion: modelVersion || "v0",
        prediction: prediction || "Unknown",
        predictionCategory: predictionCategory || null,
        confidence: confidence || 0,
        severity: severity || null,
        explanation: explanation ? JSON.stringify(explanation) : null,
        inputMetadata: inputMetadata ? JSON.stringify(inputMetadata) : null,
        status: "pending",
      },
    });

    return NextResponse.json(newPrediction, { status: 201 });
  } catch (error) {
    console.error("Error creating prediction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

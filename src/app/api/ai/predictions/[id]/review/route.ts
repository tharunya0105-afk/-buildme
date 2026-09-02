import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/ai/predictions/[id]/review
 * Engineer reviews an AI prediction.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can review predictions" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;
    const body = await request.json();
    const { status, comment } = body;

    const validStatuses = ["confirmed", "rejected", "needs_inspection"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const prediction = await db.aiPrediction.findUnique({
      where: { id },
      include: { project: { select: { engineerId: true } } },
    });

    if (!prediction) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    if (prediction.project && prediction.project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updated = await db.aiPrediction.update({
      where: { id },
      data: {
        status,
        engineerReview: comment || null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    // Create a timeline event if confirmed
    if (status === "confirmed" && prediction.projectId) {
      await db.timelineEvent.create({
        data: {
          projectId: prediction.projectId,
          type: "update",
          title: "AI Prediction Confirmed",
          description: `Engineer confirmed: ${prediction.prediction} (${Math.round(prediction.confidence * 100)}% confidence)`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error reviewing prediction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

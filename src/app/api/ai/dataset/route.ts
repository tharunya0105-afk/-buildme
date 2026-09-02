import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/ai/dataset
 * Get dataset statistics for the engineer's projects.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all photos for this user's projects
    const totalPhotos = await db.photo.count({
      where: { project: { engineerId: userId } },
    });

    // Get predictions
    const predictions = await db.aiPrediction.findMany({
      where: { project: { engineerId: userId } },
      select: { status: true },
    });

    const confirmed = predictions.filter(p => p.status === "confirmed").length;
    const rejected = predictions.filter(p => p.status === "rejected").length;
    const pending = predictions.filter(p => p.status === "pending").length;

    // Dataset images
    const totalDatasetImages = await db.aiDatasetImage.count();
    const labeledImages = await db.aiDatasetImage.count({ where: { hasLabel: true } });

    const stats = {
      totalImages: totalPhotos,
      labeledImages,
      unlabeledImages: totalPhotos - labeledImages,
      confirmedIssues: confirmed,
      rejectedPredictions: rejected,
      pendingReviews: pending,
      totalPredictions: predictions.length,
      labelCoverage: totalPhotos > 0 ? Math.round((labeledImages / totalPhotos) * 100) : 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dataset stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/ai/dataset
 * Add an image to the dataset for labeling.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, photoId, imageUrl, imageCategory, constructionStage, latitude, longitude } = body;

    const image = await db.aiDatasetImage.create({
      data: {
        projectId: projectId || null,
        photoId: photoId || null,
        imageUrl: imageUrl || "",
        imageCategory: imageCategory || null,
        constructionStage: constructionStage || null,
        latitude: latitude || null,
        longitude: longitude || null,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Error adding to dataset:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

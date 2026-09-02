import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/ai/dataset/label
 * Label a dataset image.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { imageId, label, severity } = body;

    if (!imageId || !label) {
      return NextResponse.json({ error: "imageId and label are required" }, { status: 400 });
    }

    const image = await db.aiDatasetImage.findUnique({ where: { id: imageId } });
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const updated = await db.aiDatasetImage.update({
      where: { id: imageId },
      data: {
        hasLabel: true,
        labelText: label,
        labelSeverity: severity || null,
        labeledBy: userId,
        labeledAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error labeling image:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

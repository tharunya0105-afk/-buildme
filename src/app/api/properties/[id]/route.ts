import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/properties/[id]
 * Get property detail with all related data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    const property = await db.property.findUnique({
      where: { id },
      include: {
        inspections: {
          orderBy: { inspectionDate: "desc" },
          include: {
            photos: { select: { id: true, fileUrl: true, fileName: true, category: true } },
            _count: { select: { photos: true } },
          },
        },
        photos: {
          orderBy: { createdAt: "desc" },
          select: { id: true, fileUrl: true, fileName: true, category: true, inspectionId: true, createdAt: true },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        analyses: {
          orderBy: { createdAt: "desc" },
          include: {
            photoAnalyses: {
              include: {
                photo: { select: { id: true, fileUrl: true, category: true } },
              },
            },
          },
        },
        checklist: {
          orderBy: { category: "asc" },
        },
        _count: {
          select: { inspections: true, photos: true, documents: true, analyses: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (property.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse condition reasons
    let conditionReasons = [];
    try {
      conditionReasons = JSON.parse(property.conditionReasons);
    } catch {
      conditionReasons = [];
    }

    return NextResponse.json({
      ...property,
      conditionReasons,
    });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

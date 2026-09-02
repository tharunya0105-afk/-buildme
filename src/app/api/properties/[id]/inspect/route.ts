import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateConditionScore } from "@/lib/property/condition-score";

/**
 * POST /api/properties/[id]/inspect
 * Create a property inspection and optionally run AI analysis.
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

    const userId = (session.user as any).id;
    const { id } = await params;
    const body = await request.json();
    const { notes, photoIds } = body;

    // Verify property ownership
    const property = await db.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (property.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create inspection
    const inspection = await db.propertyInspection.create({
      data: {
        propertyId: id,
        userId,
        notes: notes?.trim() || null,
      },
    });

    // Associate photos with this inspection
    if (photoIds && photoIds.length > 0) {
      await db.propertyPhoto.updateMany({
        where: { id: { in: photoIds }, propertyId: id },
        data: { inspectionId: inspection.id },
      });
    }

    // Update property condition score
    const allPhotos = await db.propertyPhoto.findMany({
      where: { propertyId: id },
      select: { category: true },
    });

    const allAnalyses = await db.propertyPhotoAnalysis.findMany({
      where: { photo: { propertyId: id } },
      select: { severity: true },
    });

    const categories = [...new Set(allPhotos.map(p => p.category).filter(Boolean))] as string[];
    const highSeverity = allAnalyses.filter(a => a.severity === "high").length;
    const mediumSeverity = allAnalyses.filter(a => a.severity === "medium").length;
    const lowSeverity = allAnalyses.filter(a => a.severity === "low").length;

    const conditionResult = calculateConditionScore({
      propertyAge: property.propertyAge,
      totalPhotos: allPhotos.length,
      totalIssues: allAnalyses.length,
      highSeverityIssues: highSeverity,
      mediumSeverityIssues: mediumSeverity,
      lowSeverityIssues: lowSeverity,
      inspectionCategories: categories,
    });

    await db.property.update({
      where: { id },
      data: {
        conditionLevel: conditionResult.level,
        conditionScore: conditionResult.score,
        conditionReasons: JSON.stringify(conditionResult.reasons),
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

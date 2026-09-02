import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULT_CHECKLIST = [
  // Property
  { category: "property", item: "Verify ownership documents" },
  { category: "property", item: "Verify property boundaries" },
  { category: "property", item: "Verify built-up area" },
  { category: "property", item: "Check construction age" },
  // Structural
  { category: "structural", item: "Inspect visible cracks" },
  { category: "structural", item: "Check signs of dampness" },
  { category: "structural", item: "Inspect roof/terrace" },
  { category: "structural", item: "Inspect walls and floors" },
  { category: "structural", item: "Consider professional structural inspection" },
  // Utilities
  { category: "utilities", item: "Check electrical system" },
  { category: "utilities", item: "Check plumbing" },
  { category: "utilities", item: "Check water supply" },
  { category: "utilities", item: "Check drainage" },
  // Legal
  { category: "legal", item: "Verify ownership/title documents" },
  { category: "legal", item: "Check required approvals" },
  { category: "legal", item: "Check applicable local property records" },
  { category: "legal", item: "Consult a qualified legal professional" },
  // Financial
  { category: "financial", item: "Compare asking price with local market information" },
  { category: "financial", item: "Estimate likely repair/maintenance costs" },
  { category: "financial", item: "Consider taxes and transaction expenses" },
];

/**
 * GET /api/properties/[id]/checklist
 * Get the due-diligence checklist for a property.
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

    const property = await db.property.findUnique({ where: { id } });
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let checklist = await db.propertyChecklist.findMany({
      where: { propertyId: id },
      orderBy: { category: "asc" },
    });

    // Initialize checklist if empty
    if (checklist.length === 0) {
      await db.propertyChecklist.createMany({
        data: DEFAULT_CHECKLIST.map(item => ({
          propertyId: id,
          category: item.category,
          item: item.item,
        })),
      });
      checklist = await db.propertyChecklist.findMany({
        where: { propertyId: id },
        orderBy: { category: "asc" },
      });
    }

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/properties/[id]/checklist
 * Update a checklist item.
 */
export async function PATCH(
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
    const { checklistId, completed, notes } = body;

    const property = await db.property.findUnique({ where: { id } });
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updated = await db.propertyChecklist.update({
      where: { id: checklistId },
      data: {
        ...(completed !== undefined && { completed }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating checklist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

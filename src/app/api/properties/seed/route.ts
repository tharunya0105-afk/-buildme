import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/properties/seed
 * Seed a demo ready-built property for evaluation demonstration.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if properties already exist
    const existing = await db.property.count({ where: { userId } });
    if (existing > 0) {
      return NextResponse.json(
        { error: "Properties already exist. Demo seeding only works for new accounts.", existingProperties: existing },
        { status: 400 }
      );
    }

    // Create demo property
    const property = await db.property.create({
      data: {
        userId,
        name: "Green Valley Residence",
        propertyType: "house",
        builtArea: 2200,
        floors: 2,
        propertyAge: 10,
        constructionYear: 2016,
        latitude: 11.0168,
        longitude: 76.9558,
        address: "42, Race Course Road, Near VOC Park",
        city: "Coimbatore",
        district: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641018",
        formattedAddress: "42, Race Course Road, Near VOC Park, Coimbatore, Tamil Nadu - 641018",
        askingPrice: 6500000,
        bedrooms: 3,
        bathrooms: 2,
        parking: "covered",
        constructionType: "house",
        conditionLevel: "moderate",
        conditionScore: 42,
        conditionReasons: JSON.stringify([
          { factor: "issue_severity", description: "1 medium-severity, 2 low-severity visible concerns detected", severity: "info" },
          { factor: "inspection_completeness", description: "45% areas inspected. Missing: kitchen, bathroom, roof, structural", severity: "warning" },
          { factor: "property_age", description: "Property is approximately 10 years old", severity: "info" },
        ]),
        notes: "Demo property for buyer evaluation demonstration. All data is fictional.",
      },
    });

    // Create demo checklist items
    const checklistItems = [
      { category: "property", item: "Verify ownership documents" },
      { category: "property", item: "Verify property boundaries" },
      { category: "property", item: "Verify built-up area" },
      { category: "property", item: "Check construction age", completed: true },
      { category: "structural", item: "Inspect visible cracks", completed: true },
      { category: "structural", item: "Check signs of dampness", completed: true },
      { category: "structural", item: "Inspect roof/terrace" },
      { category: "structural", item: "Inspect walls and floors", completed: true },
      { category: "structural", item: "Consider professional structural inspection" },
      { category: "utilities", item: "Check electrical system" },
      { category: "utilities", item: "Check plumbing" },
      { category: "utilities", item: "Check water supply", completed: true },
      { category: "utilities", item: "Check drainage" },
      { category: "legal", item: "Verify ownership/title documents" },
      { category: "legal", item: "Check required approvals" },
      { category: "legal", item: "Check applicable local property records" },
      { category: "legal", item: "Consult a qualified legal professional" },
      { category: "financial", item: "Compare asking price with local market information" },
      { category: "financial", item: "Estimate likely repair/maintenance costs" },
      { category: "financial", item: "Consider taxes and transaction expenses" },
    ];

    await db.propertyChecklist.createMany({
      data: checklistItems.map(item => ({
        propertyId: property.id,
        category: item.category,
        item: item.item,
        completed: item.completed || false,
      })),
    });

    // Create a demo inspection
    const inspection = await db.propertyInspection.create({
      data: {
        propertyId: property.id,
        userId,
        notes: "Initial walkthrough. Exterior and some interior areas photographed. Noticed possible dampness near bathroom wall and minor paint peeling in bedroom.",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Demo property seeded: Green Valley Residence, Coimbatore",
      propertyId: property.id,
      inspectionId: inspection.id,
      note: "All data is demo data for demonstration purposes only.",
    });
  } catch (error) {
    console.error("Property seed error:", error);
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}

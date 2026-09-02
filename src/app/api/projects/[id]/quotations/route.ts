import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

// ─── GET: List quotations for a project ────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const { id: projectId } = await params;

  // Verify project access
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      engineerId: userId,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const quotations = await prisma.quotation.findMany({
    where: { projectId },
    include: {
      lineItems: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quotations);
}

// ─── POST: Create a quotation with scope analysis ──────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const { id: projectId } = await params;

  // Verify project access
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      engineerId: userId,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();

  // Validate required fields
  if (!body.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Validate scope arrays
  const validScopeItems = [
    "structure", "foundation", "masonry", "plastering", "flooring",
    "waterproofing", "painting", "doors", "electrical", "plumbing",
    "kitchen", "bathroom", "fittings", "fabrication",
  ];

  const includedScope = Array.isArray(body.includedScope) ? body.includedScope : [];
  const excludedScope = Array.isArray(body.excludedScope) ? body.excludedScope : [];

  // Calculate scope completeness
  const scopeCompleteness = Math.round(
    (includedScope.length / validScopeItems.length) * 100
  );

  // Determine rate type
  let rateType: string | null = null;
  if (body.ratePerSqFt) rateType = "per_sqft";
  else if (body.ratePerSquare) rateType = "per_square";
  else if (body.totalAmount && body.builtArea) rateType = "per_sqft";
  else if (body.totalAmount) rateType = "lump_sum";

  // Build missing info array
  const missingInfo: string[] = [];
  if (!body.totalAmount) missingInfo.push("Total amount not specified");
  if (!body.builtArea) missingInfo.push("Built-up area not specified");
  if (!body.materialBrands) missingInfo.push("Material brands not specified");
  if (!body.escalationClause) missingInfo.push("Escalation clause not specified");
  if (!body.validity) missingInfo.push("Quotation validity not specified");
  if (!body.assumptions) missingInfo.push("Assumptions not documented");
  if (includedScope.includes("waterproofing") && !body.waterproofingSpec)
    missingInfo.push("Waterproofing specification unclear");

  // Build comparison warning
  let comparisonWarning: string | null = null;
  if (excludedScope.length > 3) {
    comparisonWarning = `This quotation excludes ${excludedScope.length} major categories (${excludedScope.join(", ")}). Direct price comparison with fully-scope quotations may be misleading.`;
  }

  // Create quotation
  const quotation = await prisma.quotation.create({
    data: {
      projectId,
      createdById: userId,
      title: body.title,
      sourceDocument: body.sourceDocument || null,
      sourceType: body.sourceType || "manual",

      location: body.location || project.address,
      builtArea: body.builtArea || project.builtArea,
      floors: body.floors || null,
      projectType: body.projectType || project.constructionType,

      totalAmount: body.totalAmount || null,
      ratePerSqFt: body.ratePerSqFt || null,
      ratePerSquare: body.ratePerSquare || null,
      rateType,

      includesStructure: includedScope.includes("structure"),
      includesFoundation: includedScope.includes("foundation"),
      includesMasonry: includedScope.includes("masonry"),
      includesPlastering: includedScope.includes("plastering"),
      includesFlooring: includedScope.includes("flooring"),
      includesWaterproofing: includedScope.includes("waterproofing"),
      includesPainting: includedScope.includes("painting"),
      includesDoors: includedScope.includes("doors"),
      includesElectrical: includedScope.includes("electrical"),
      includesPlumbing: includedScope.includes("plumbing"),
      includesKitchen: includedScope.includes("kitchen"),
      includesBathroom: includedScope.includes("bathroom"),
      includesFittings: includedScope.includes("fittings"),
      includesFabrication: includedScope.includes("fabrication"),

      materialBrands: body.materialBrands || null,
      materialSpec: body.materialSpec || null,
      qualityLevel: body.qualityLevel || null,

      paymentTerms: body.paymentTerms || null,
      escalationClause: body.escalationClause || null,
      exclusions: body.exclusions ? JSON.stringify(body.exclusions) : null,
      assumptions: body.assumptions ? JSON.stringify(body.assumptions) : null,
      validity: body.validity || null,
      siteRequirements: body.siteRequirements ? JSON.stringify(body.siteRequirements) : null,

      scopeCompleteness,
      missingInfo: missingInfo.length > 0 ? JSON.stringify(missingInfo) : null,
      analysisNotes: body.analysisNotes || null,

      comparableScope: excludedScope.length <= 2,
      comparisonWarning,

      lineItems: {
        create: (body.lineItems || []).map((item: Record<string, unknown>) => ({
          category: item.category || "other",
          description: item.description || "",
          quantity: item.quantity || null,
          unit: item.unit || null,
          rate: item.rate || null,
          amount: item.amount || null,
          isExcluded: item.isExcluded || false,
          notes: item.notes || null,
        })),
      },
    },
    include: {
      lineItems: true,
    },
  });

  return NextResponse.json(quotation, { status: 201 });
}

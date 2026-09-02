import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

const SCOPE_CATEGORIES = [
  { key: "structure", label: "Structure" },
  { key: "foundation", label: "Foundation" },
  { key: "masonry", label: "Masonry" },
  { key: "plastering", label: "Plastering" },
  { key: "flooring", label: "Flooring" },
  { key: "waterproofing", label: "Waterproofing" },
  { key: "painting", label: "Painting" },
  { key: "doors", label: "Doors & Windows" },
  { key: "electrical", label: "Electrical" },
  { key: "plumbing", label: "Plumbing" },
  { key: "kitchen", label: "Kitchen" },
  { key: "bathroom", label: "Bathroom" },
  { key: "fittings", label: "Fittings" },
  { key: "fabrication", label: "Fabrication" },
];

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
    where: { id: projectId, engineerId: userId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const { quotationAId, quotationBId } = body;

  if (!quotationAId || !quotationBId) {
    return NextResponse.json(
      { error: "Two quotation IDs required" },
      { status: 400 }
    );
  }

  // Fetch both quotations
  const [qA, qB] = await Promise.all([
    prisma.quotation.findFirst({
      where: { id: quotationAId, projectId },
      include: { lineItems: true },
    }),
    prisma.quotation.findFirst({
      where: { id: quotationBId, projectId },
      include: { lineItems: true },
    }),
  ]);

  if (!qA || !qB) {
    return NextResponse.json(
      { error: "One or both quotations not found" },
      { status: 404 }
    );
  }

  // ─── Scope Comparison ────────────────────────────────────────────────

  const scopeComparison = SCOPE_CATEGORIES.map(cat => {
    const key = `includes${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}` as keyof typeof qA;
    return {
      category: cat.label,
      key: cat.key,
      quotationA: Boolean(qA[key]),
      quotationB: Boolean(qB[key]),
    };
  });

  const sharedCategories = scopeComparison.filter(s => s.quotationA && s.quotationB);
  const onlyInA = scopeComparison.filter(s => s.quotationA && !s.quotationB);
  const onlyInB = scopeComparison.filter(s => !s.quotationA && s.quotationB);
  const inNeither = scopeComparison.filter(s => !s.quotationA && !s.quotationB);

  // ─── Price Comparison ────────────────────────────────────────────────

  const priceA = qA.totalAmount || 0;
  const priceB = qB.totalAmount || 0;

  const rateA = qA.ratePerSqFt || qA.ratePerSquare || (qA.totalAmount && qA.builtArea ? qA.totalAmount / qA.builtArea : null);
  const rateB = qB.ratePerSqFt || qB.ratePerSquare || (qB.totalAmount && qB.builtArea ? qB.totalAmount / qB.builtArea : null);

  // ─── Quality Comparison ──────────────────────────────────────────────

  const qualityComparison = {
    quotationA: {
      qualityLevel: qA.qualityLevel,
      materialBrands: qA.materialBrands,
      materialSpec: qA.materialSpec,
    },
    quotationB: {
      qualityLevel: qB.qualityLevel,
      materialBrands: qB.materialBrands,
      materialSpec: qB.materialSpec,
    },
  };

  // ─── Missing Information ─────────────────────────────────────────────

  const missingA = qA.missingInfo ? JSON.parse(qA.missingInfo) : [];
  const missingB = qB.missingInfo ? JSON.parse(qB.missingInfo) : [];

  // ─── Exclusions ──────────────────────────────────────────────────────

  const exclusionsA = qA.exclusions ? JSON.parse(qA.exclusions) : [];
  const exclusionsB = qB.exclusions ? JSON.parse(qB.exclusions) : [];

  // ─── Assumptions ─────────────────────────────────────────────────────

  const assumptionsA = qA.assumptions ? JSON.parse(qA.assumptions) : [];
  const assumptionsB = qB.assumptions ? JSON.parse(qB.assumptions) : [];

  // ─── Comparability Warning ───────────────────────────────────────────

  const scopeOverlap = sharedCategories.length / SCOPE_CATEGORIES.length;
  let comparabilityWarning = "";

  if (scopeOverlap < 0.5) {
    comparabilityWarning = `WARNING: These quotations share only ${Math.round(scopeOverlap * 100)}% scope overlap. Direct price comparison is highly misleading. The quotations cover fundamentally different scopes.`;
  } else if (scopeOverlap < 0.75) {
    comparabilityWarning = `CAUTION: These quotations share ${Math.round(scopeOverlap * 100)}% scope overlap. Price differences may primarily reflect scope differences rather than actual cost differences.`;
  } else {
    comparabilityWarning = `These quotations share ${Math.round(scopeOverlap * 100)}% scope overlap. Price comparison has moderate reliability, but differences in material specification and quality level should still be considered.`;
  }

  // ─── Missing from Both ───────────────────────────────────────────────

  const missingFromBoth = inNeither.map(s => s.category);

  return NextResponse.json({
    quotationA: {
      id: qA.id,
      title: qA.title,
      totalAmount: priceA,
      ratePerSqFt: rateA,
      rateType: qA.rateType,
      qualityLevel: qA.qualityLevel,
      builtArea: qA.builtArea,
      scopeCompleteness: qA.scopeCompleteness,
    },
    quotationB: {
      id: qB.id,
      title: qB.title,
      totalAmount: priceB,
      ratePerSqFt: rateB,
      rateType: qB.rateType,
      qualityLevel: qB.qualityLevel,
      builtArea: qB.builtArea,
      scopeCompleteness: qB.scopeCompleteness,
    },
    scopeComparison,
    summary: {
      sharedCategories: sharedCategories.map(s => s.category),
      onlyInQuotationA: onlyInA.map(s => s.category),
      onlyInQuotationB: onlyInB.map(s => s.category),
      missingFromBoth,
      scopeOverlap: Math.round(scopeOverlap * 100),
    },
    priceComparison: {
      quotationAPrice: priceA,
      quotationBPrice: priceB,
      priceDifference: priceA - priceB,
      quotationARate: rateA,
      quotationBRate: rateB,
    },
    qualityComparison,
    missingInformation: {
      quotationA: missingA,
      quotationB: missingB,
    },
    exclusions: {
      quotationA: exclusionsA,
      quotationB: exclusionsB,
    },
    assumptions: {
      quotationA: assumptionsA,
      quotationB: assumptionsB,
    },
    comparabilityWarning,
  });
}

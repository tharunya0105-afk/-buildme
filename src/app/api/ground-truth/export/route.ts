/**
 * BuildMe Ground-Truth Export & Validation Analytics API
 *
 * Exports the validated project dataset for ML readiness analysis.
 * Calculates validation metrics ONLY when sufficient data exists.
 * Does NOT fabricate any records.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET — Export ground-truth dataset and analytics ───────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json"; // "json" | "csv"

    // Get all projects for this engineer with estimates and budget events
    const projects = await db.project.findMany({
      where: { engineerId: userId },
      include: {
        costEstimates: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        budgetEvents: true,
      },
    });

    // Build ground-truth records
    const groundTruthRecords = projects.map(p => {
      const latestEstimate = p.costEstimates[0];
      const totalSpend = p.budgetEvents
        .filter(e => e.amount > 0 && e.type !== "original_estimate")
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        project_id: p.id,
        estimate_id: latestEstimate?.id || null,
        location: p.district || p.city || null,
        area_sqft: p.builtArea,
        floors: null,
        building_type: p.constructionType,
        quality: latestEstimate?.qualityLevel || null,
        estimated_low_inr: latestEstimate?.lowerEstimate || null,
        estimated_central_inr: latestEstimate?.estimatedTotal || p.estimatedCost || null,
        estimated_high_inr: latestEstimate?.higherEstimate || null,
        final_cost_inr: p.trackingStatus === "completed" ? p.finalCostInr : null,
        recorded_spend_inr: totalSpend > 0 ? Math.round(totalSpend) : null,
        variance_inr: (p.trackingStatus === "completed" && p.finalCostInr != null && latestEstimate)
          ? Math.round(p.finalCostInr - latestEstimate.estimatedTotal)
          : null,
        variance_percent: (p.trackingStatus === "completed" && p.finalCostInr != null && latestEstimate && latestEstimate.estimatedTotal > 0)
          ? Math.round(((p.finalCostInr - latestEstimate.estimatedTotal) / latestEstimate.estimatedTotal) * 100)
          : null,
        tracking_status: p.trackingStatus || "planning",
        validation_status: p.validationStatus || "unverified",
        completion_date: p.completionDate?.toISOString() || null,
        methodology_version: latestEstimate?.methodologyVersion || p.methodologyVersion || null,
        created_at: p.createdAt.toISOString(),
      };
    });

    // Validation analytics (only calculate when sufficient data)
    const completedProjects = groundTruthRecords.filter(r => r.tracking_status === "completed" && r.final_cost_inr != null);
    const activeProjects = groundTruthRecords.filter(r => r.tracking_status === "active");
    const planningProjects = groundTruthRecords.filter(r => r.tracking_status === "planning");
    const verifiedProjects = completedProjects.filter(r => r.validation_status === "independently_verified");

    let validationMetrics = null;
    if (completedProjects.length >= 3) {
      const errors = completedProjects
        .filter(r => r.variance_percent != null)
        .map(r => r.variance_percent!);

      const absoluteErrors = errors.map(Math.abs);
      const sortedAbsErrors = [...absoluteErrors].sort((a, b) => a - b);

      validationMetrics = {
        sampleSize: completedProjects.length,
        mape: errors.length > 0 ? Math.round(errors.reduce((s, e) => s + e, 0) / errors.length) : null,
        medianAbsolutePercentageError: sortedAbsErrors.length > 0
          ? sortedAbsErrors[Math.floor(sortedAbsErrors.length / 2)]
          : null,
        meanError: errors.length > 0 ? Math.round(errors.reduce((s, e) => s + e, 0) / errors.length) : null,
        maxAbsoluteError: sortedAbsErrors.length > 0 ? sortedAbsErrors[sortedAbsErrors.length - 1] : null,
        bias: errors.length > 0 ? (errors.reduce((s, e) => s + e, 0) > 0 ? "overestimating" : "underestimating") : null,
        note: "Metrics calculated from user-reported completed projects. Not independently verified unless marked.",
      };
    }

    const analytics = {
      totalProjects: projects.length,
      trackingStatus: {
        planning: planningProjects.length,
        active: activeProjects.length,
        completed: completedProjects.length,
        cancelled: groundTruthRecords.filter(r => r.tracking_status === "cancelled").length,
      },
      completedWithFinalCost: completedProjects.length,
      userReported: completedProjects.filter(r => r.validation_status === "user_reported").length,
      documentSupported: completedProjects.filter(r => r.validation_status === "document_supported").length,
      independentlyVerified: verifiedProjects.length,
      totalRecordedSpend: groundTruthRecords
        .filter(r => r.recorded_spend_inr != null)
        .reduce((s, r) => s + (r.recorded_spend_inr || 0), 0),
      validationMetrics,
      methodologyNote: "All metrics calculated from real project data. No synthetic records.",
    };

    // CSV export
    if (format === "csv") {
      const headers = Object.keys(groundTruthRecords[0] || {}).join(",");
      const rows = groundTruthRecords.map(r =>
        Object.values(r).map(v => v === null ? "" : String(v)).join(",")
      ).join("\n");

      return new NextResponse(`${headers}\n${rows}`, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="BuildMe_GroundTruth_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      records: groundTruthRecords,
      analytics,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}

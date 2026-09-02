/**
 * BuildMe Validation Analytics API
 *
 * Central evidence dashboard data source.
 * Calculates evidence funnel, range coverage, bias, and project status.
 * Only shows statistics when sufficient data exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    // Fetch all projects with estimates and budget events
    const projects = await db.project.findMany({
      where: { engineerId: userId },
      include: {
        costEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
        budgetEvents: true,
        evidences: true,
      },
    });

    // ─── Evidence Funnel ────────────────────────────────────────────────────
    const totalProjects = projects.length;
    const estimatesGenerated = projects.filter(p => p.costEstimates.length > 0).length;
    const projectsTracked = projects.filter(p => p.trackingStatus === "active" || p.trackingStatus === "completed").length;
    const expenditureRecorded = projects.filter(p => {
      const spend = p.budgetEvents
        .filter(e => e.amount > 0 && e.type !== "original_estimate")
        .reduce((s, e) => s + e.amount, 0);
      return spend > 0;
    }).length;
    const projectsCompleted = projects.filter(p => p.trackingStatus === "completed").length;
    const finalCostCaptured = projects.filter(p => p.trackingStatus === "completed" && p.finalCostInr != null).length;
    const documentSupported = projects.filter(p => p.validationStatus === "document_supported").length;
    const independentlyVerified = projects.filter(p => p.validationStatus === "independently_verified").length;

    const funnel = {
      totalProjects,
      estimatesGenerated,
      projectsTracked,
      expenditureRecorded,
      projectsCompleted,
      finalCostCaptured,
      documentSupported,
      independentlyVerified,
    };

    // ─── Project Details ────────────────────────────────────────────────────
    const projectDetails = projects.map(p => {
      const est = p.costEstimates[0];
      const totalSpend = p.budgetEvents
        .filter(e => e.amount > 0 && e.type !== "original_estimate")
        .reduce((s, e) => s + e.amount, 0);

      const centralEstimate = est?.estimatedTotal || p.estimatedCost || 0;
      const finalCost = p.trackingStatus === "completed" ? p.finalCostInr : null;

      return {
        id: p.id,
        name: p.name,
        location: p.district || p.city,
        area: p.builtArea,
        buildingType: p.constructionType,
        quality: est?.qualityLevel,
        trackingStatus: p.trackingStatus || "planning",
        validationStatus: p.validationStatus || "unverified",
        methodologyVersion: est?.methodologyVersion || p.methodologyVersion,
        createdAt: p.createdAt.toISOString(),
        completionDate: p.completionDate?.toISOString(),
        estimate: est ? {
          low: est.lowerEstimate,
          central: est.estimatedTotal,
          high: est.higherEstimate,
          ratePerSqft: est.baseRate,
          locationMatch: est.locationMatch,
          evidenceConfidence: est.evidenceConfidence,
        } : null,
        recordedSpend: Math.round(totalSpend),
        finalCost: finalCost,
        evidenceCount: p.evidences.length,
      };
    });

    // ─── Validation Analytics (only when ≥1 completed project) ──────────────
    const completedWithCost = projectDetails.filter(
      p => p.trackingStatus === "completed" && p.finalCost != null && p.estimate
    );

    let validationMetrics = null;
    let rangeCoverage = null;
    let estimatorBias = null;

    if (completedWithCost.length >= 1) {
      const errors = completedWithCost.map(p => {
        const variance = p.finalCost! - p.estimate!.central;
        const variancePct = (variance / p.estimate!.central) * 100;
        return {
          projectId: p.id,
          location: p.location,
          estimated: p.estimate!.central,
          actual: p.finalCost!,
          variance,
          variancePct: Math.round(variancePct * 10) / 10,
        };
      });

      const absPcts = errors.map(e => Math.abs(e.variancePct)).sort((a, b) => a - b);
      const meanBias = Math.round(errors.reduce((s, e) => s + e.variancePct, 0) / errors.length * 10) / 10;

      validationMetrics = {
        sampleSize: completedWithCost.length,
        sufficientForStatistics: completedWithCost.length >= 3,
        meanBias,
        medianAbsolutePercentageError: absPcts[Math.floor(absPcts.length / 2)],
        maxAbsoluteError: absPcts[absPcts.length - 1],
        biasDirection: meanBias > 0 ? "underestimating" : meanBias < 0 ? "overestimating" : "unbiased",
        errors,
        note: completedWithCost.length < 3
          ? "Sample size < 3. Results are observational, not statistically reliable."
          : "Sample size sufficient for preliminary analysis.",
      };

      // Range coverage
      const insideRange = completedWithCost.filter(p =>
        p.finalCost! >= p.estimate!.low && p.finalCost! <= p.estimate!.high
      ).length;

      rangeCoverage = {
        insideRange,
        total: completedWithCost.length,
        percentage: Math.round((insideRange / completedWithCost.length) * 100),
        note: completedWithCost.length < 3
          ? "Sample size < 3. Range coverage is observational."
          : "Planning range coverage based on completed projects.",
      };

      // Bias
      estimatorBias = {
        meanBias,
        direction: meanBias > 0 ? "BuildMe underestimates on average" :
                   meanBias < 0 ? "BuildMe overestimates on average" :
                   "No systematic bias detected",
        note: completedWithCost.length < 3
          ? "Insufficient data for reliable bias assessment."
          : "Bias calculated from completed project outcomes.",
      };
    }

    // ─── Data Quality ───────────────────────────────────────────────────────
    const missingFinalCost = projects.filter(p =>
      p.trackingStatus === "completed" && !p.finalCostInr
    ).length;
    const missingArea = projects.filter(p => !p.builtArea).length;
    const missingLocation = projects.filter(p => !p.district && !p.city).length;
    const missingEstimate = projects.filter(p => p.costEstimates.length === 0).length;
    const incompleteProjects = projects.filter(p =>
      p.trackingStatus === "active" && !p.finalCostInr
    ).length;

    const dataQuality = {
      totalProjects,
      eligibleForValidation: completedWithCost.length,
      notEligible: totalProjects - completedWithCost.length,
      missingFinalCost,
      missingArea,
      missingLocation,
      missingEstimate,
      incompleteProjects,
      eligibleReason: "Completed project with final cost and estimate attached",
      exclusionReasons: [
        missingFinalCost > 0 ? `${missingFinalCost} completed but no final cost` : null,
        missingArea > 0 ? `${missingArea} projects missing area` : null,
        missingEstimate > 0 ? `${missingEstimate} projects without estimate` : null,
        incompleteProjects > 0 ? `${incompleteProjects} still active` : null,
      ].filter(Boolean),
    };

    // ─── Pilot Readiness ────────────────────────────────────────────────────
    const pilotReadiness = {
      product: {
        estimateGeneration: true,
        estimatePersistence: true,
        projectTracking: true,
        expenseTracking: true,
        finalCostCapture: true,
        export: true,
      },
      evidence: {
        groundTruthSchema: true,
        validationStatuses: true,
        evidenceTracking: true,
        methodologyVersioning: true,
        privacyControls: true,
      },
      validation: {
        completedProjects: projectsCompleted > 0,
        finalCostObservations: finalCostCaptured > 0,
        documentSupportedOutcomes: documentSupported > 0,
        independentVerification: independentlyVerified > 0,
        estimatorAccuracy: completedWithCost.length >= 3,
      },
    };

    return NextResponse.json({
      validationStatus: projectsCompleted > 0 ? "PILOT_READY" : "PILOT_PREPARATION",
      funnel,
      projectDetails,
      validationMetrics,
      rangeCoverage,
      estimatorBias,
      dataQuality,
      pilotReadiness,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load validation data" }, { status: 500 });
  }
}

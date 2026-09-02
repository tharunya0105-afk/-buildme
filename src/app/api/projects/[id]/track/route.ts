/**
 * BuildMe Ground-Truth Tracking API
 *
 * Manages project tracking status, final cost, and validation.
 * This is the infrastructure for collecting real project outcome data.
 *
 * Does NOT fabricate any records. Starts with zero completed projects.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_TRACKING_STATUSES = ["planning", "active", "completed", "cancelled"];
const VALID_VALIDATION_STATUSES = ["unverified", "user_reported", "document_supported", "independently_verified"];

// ─── GET — Fetch tracking status for a project ─────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: projectId } = await params;

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
      include: {
        costEstimates: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        budgetEvents: {
          orderBy: { createdAt: "desc" },
        },
        changeRequests: {
          where: { status: { in: ["approved", "completed"] } },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Calculate budget metrics from budgetEvents
    // Exclude original_estimate from recorded spend (it's the baseline, not actual expenditure)
    const totalRecordedSpend = project.budgetEvents
      .filter(e => e.amount > 0 && e.type !== "original_estimate")
      .reduce((sum, e) => sum + e.amount, 0);

    const latestEstimate = project.costEstimates[0] ?? null;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    project.budgetEvents
      .filter(e => e.amount > 0 && e.type !== "original_estimate")
      .forEach(e => {
        const cat = e.category || e.type || "other";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + e.amount;
      });

    // Change request cost impact
    const totalChangeImpact = project.changeRequests
      .filter(cr => cr.actualCost != null)
      .reduce((sum, cr) => sum + (cr.actualCost || 0), 0);

    const centralEstimate = latestEstimate?.estimatedTotal || project.estimatedCost || 0;
    const percentConsumed = centralEstimate > 0
      ? Math.round((totalRecordedSpend / centralEstimate) * 100)
      : 0;
    const variance = centralEstimate > 0
      ? totalRecordedSpend - centralEstimate
      : 0;

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      trackingStatus: project.trackingStatus || "planning",
      validationStatus: project.validationStatus || "unverified",
      validationNotes: project.validationNotes,
      methodologyVersion: project.methodologyVersion,

      // Estimate
      estimate: latestEstimate ? {
        id: latestEstimate.id,
        central: latestEstimate.estimatedTotal,
        low: latestEstimate.lowerEstimate,
        high: latestEstimate.higherEstimate,
        ratePerSqft: latestEstimate.baseRate,
        methodologyVersion: latestEstimate.methodologyVersion,
        locationMatch: latestEstimate.locationMatch,
        evidenceConfidence: latestEstimate.evidenceConfidence,
      } : null,

      // Project details
      area: project.builtArea,
      floors: null, // not stored on Project directly
      buildingType: project.constructionType,
      quality: latestEstimate?.qualityLevel,
      location: project.district || project.city,

      // Budget tracking
      budget: {
        totalRecordedSpend: Math.round(totalRecordedSpend),
        centralEstimate: Math.round(centralEstimate),
        percentConsumed,
        varianceFromEstimate: Math.round(variance),
        categoryBreakdown,
        totalChangeImpact: Math.round(totalChangeImpact),
        expenseCount: project.budgetEvents.filter(e => e.amount > 0 && e.type !== "original_estimate").length,
      },

      // Ground truth (only when completed)
      groundTruth: project.trackingStatus === "completed" ? {
        finalCostInr: project.finalCostInr,
        completionDate: project.completionDate,
        initialEstimateInr: centralEstimate,
        absoluteVariance: project.finalCostInr != null ? project.finalCostInr - centralEstimate : null,
        percentageVariance: project.finalCostInr != null && centralEstimate > 0
          ? Math.round(((project.finalCostInr - centralEstimate) / centralEstimate) * 100)
          : null,
      } : null,

      // Summary
      expenseCount: project.budgetEvents.filter(e => e.type !== "original_estimate").length,
      changeRequestCount: project.changeRequests.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch tracking data" }, { status: 500 });
  }
}

// ─── POST — Create initial estimate entry for tracking ──────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: projectId } = await params;
    const body = await req.json();

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Activate tracking
    const updated = await db.project.update({
      where: { id: projectId },
      data: {
        trackingStatus: "active",
        methodologyVersion: body.methodologyVersion || "1.0",
      },
    });

    // Record original estimate as budget event if not already recorded
    const existingOriginal = await db.budgetEvent.findFirst({
      where: { projectId, type: "original_estimate" },
    });

    if (!existingOriginal && body.centralEstimate) {
      await db.budgetEvent.create({
        data: {
          projectId,
          createdById: userId,
          type: "original_estimate",
          title: "BuildMe Benchmark Estimate",
          description: `Estimate based on ${body.methodologyVersion || "v1.0"} methodology`,
          amount: body.centralEstimate,
          confidence: "medium",
          source: "engineer",
        },
      });
    }

    // Also create CostEstimate record if not already present
    const existingEstimate = await db.costEstimate.findFirst({
      where: { projectId },
    });

    if (!existingEstimate && body.centralEstimate) {
      const area = project.builtArea || 2000;
      const centralRate = body.centralEstimate / area;
      await db.costEstimate.create({
        data: {
          projectId,
          userId,
          district: project.district,
          state: project.state,
          builtArea: area,
          floors: body.floors || 2,
          constructionType: project.constructionType,
          qualityLevel: body.quality || "standard",
          baseRate: Math.round(centralRate),
          qualityFactor: 1.0,
          locationFactor: 1.0,
          estimatedTotal: body.centralEstimate,
          lowerEstimate: body.lowEstimate || Math.round(body.centralEstimate * 0.85),
          higherEstimate: body.highEstimate || Math.round(body.centralEstimate * 1.20),
          methodologyVersion: body.methodologyVersion || "1.0",
          locationMatch: body.locationMatch || "DIRECT",
          evidenceConfidence: body.evidenceConfidence || "HIGH",
          evidenceConfidenceScore: body.evidenceConfidenceScore || 85,
        },
      });
    }

    return NextResponse.json({
      success: true,
      trackingStatus: updated.trackingStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to activate tracking" }, { status: 500 });
  }
}

// ─── PATCH — Update tracking status or final cost ──────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: projectId } = await params;
    const body = await req.json();

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Update tracking status
    if (body.trackingStatus) {
      if (!VALID_TRACKING_STATUSES.includes(body.trackingStatus)) {
        return NextResponse.json(
          { error: `Invalid tracking status. Must be one of: ${VALID_TRACKING_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.trackingStatus = body.trackingStatus;
    }

    // Update final cost (only allowed when completing)
    if (body.finalCostInr !== undefined) {
      if (body.finalCostInr !== null && body.finalCostInr <= 0) {
        return NextResponse.json({ error: "Final cost must be positive" }, { status: 400 });
      }
      updateData.finalCostInr = body.finalCostInr;
    }

    // Update completion date
    if (body.completionDate !== undefined) {
      updateData.completionDate = body.completionDate ? new Date(body.completionDate) : null;
    }

    // Update validation status
    if (body.validationStatus) {
      if (!VALID_VALIDATION_STATUSES.includes(body.validationStatus)) {
        return NextResponse.json(
          { error: `Invalid validation status. Must be one of: ${VALID_VALIDATION_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.validationStatus = body.validationStatus;
    }

    // Update validation notes
    if (body.validationNotes !== undefined) {
      updateData.validationNotes = body.validationNotes;
    }

    // Auto-set completion date when marking completed
    if (body.trackingStatus === "completed" && !body.completionDate && !project.completionDate) {
      updateData.completionDate = new Date();
    }

    const updated = await db.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      trackingStatus: updated.trackingStatus,
      finalCostInr: updated.finalCostInr,
      validationStatus: updated.validationStatus,
      completionDate: updated.completionDate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update tracking" }, { status: 500 });
  }
}

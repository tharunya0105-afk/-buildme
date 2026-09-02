import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAttentionScore } from "@/lib/spatial/attention-score";

/**
 * GET /api/projects/[id]/truth
 * Returns the complete "Project Truth" — evidence-linked timeline with budget story.
 * This is the core BuildMe differentiator.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Fetch project with ownership check
    const project = await db.project.findUnique({
      where: { id },
      include: {
        engineer: { select: { id: true, name: true, email: true } },
        homeowner: { select: { id: true, name: true, email: true } },
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 5,
          select: {
            id: true, inspectionDate: true, stage: true, notes: true,
            photos: { select: { id: true, fileUrl: true, fileName: true, createdAt: true } },
          },
        },
        photos: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, fileUrl: true, fileName: true, createdAt: true, inspectionId: true },
        },
        issues: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true, title: true, description: true, category: true, severity: true, status: true,
            createdAt: true, resolvedAt: true,
            evidence: { select: { id: true, type: true, description: true, trustLabel: true, createdAt: true } },
            timelineEvents: { orderBy: { createdAt: "desc" }, take: 3 },
          },
        },
        costEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
        workers: {
          where: { active: true },
          select: {
            id: true, name: true, workerType: true,
            checkIns: {
              orderBy: { checkInTime: "desc" },
              take: 1,
              select: { verificationStatus: true, checkInTime: true, distanceFromSite: true },
            },
          },
        },
        budgetEvents: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true, type: true, category: true, title: true, description: true,
            amount: true, cumulativeTotal: true, confidence: true, source: true,
            evidenceRef: true, approved: true, createdAt: true,
          },
        },
        changeRequests: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, title: true, description: true, category: true, status: true,
            estimatedCostLow: true, estimatedCostHigh: true, actualCost: true,
            assumptions: true, timelineImpactDays: true, rationale: true,
            createdAt: true, completedAt: true,
          },
        },
        siteContexts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true, roadAccess: true, vehicleAccess: true, waterAvailability: true,
            siteLevel: true, soilType: true, waterTableDepth: true, accessDistanceM: true,
            basementRequired: true, costRiskNotes: true, createdAt: true,
          },
        },
        timelineEvents: {
          orderBy: { createdAt: "desc" },
          take: 15,
          select: { id: true, type: true, title: true, description: true, createdAt: true },
        },
        alerts: {
          where: { resolved: false },
          select: { id: true, severity: true, title: true, description: true },
        },
        riskPredictions: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
        _count: {
          select: { inspections: true, photos: true, issues: true, workers: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Authorization check
    if (role === "engineer" && project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (role === "homeowner" && project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Compute attention score
    const lastInspectionDate = project.inspections[0]?.inspectionDate ?? null;
    const attentionScore = calculateAttentionScore({
      projectStatus: project.status,
      currentStage: project.currentStage,
      progress: project.progress,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      expectedCompletion: project.expectedCompletion?.toISOString() ?? null,
      lastInspectionDate: lastInspectionDate?.toISOString() ?? null,
      openAlerts: project.alerts.length,
      totalInspections: project._count.inspections,
      totalPhotos: project._count.photos,
      unresolvedAlerts: project.alerts.length,
      recentAiReviewRecommended: false,
    });

    // Build the Budget Story
    const originalEstimate = project.estimatedCost;
    const budgetEvents = project.budgetEvents;
    
    // Find the last cumulative total
    const lastBudgetEvent = budgetEvents.filter(e => e.cumulativeTotal !== null).pop();
    const currentExpectedCost = lastBudgetEvent?.cumulativeTotal ?? originalEstimate;
    
    // Calculate total spent (payments)
    const totalPaid = budgetEvents
      .filter(e => e.type === "payment")
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    
    // Calculate budget changes by category
    const budgetChanges = budgetEvents
      .filter(e => e.type === "change_impact" || e.type === "escalation" || e.type === "site_condition")
      .map(e => ({
        id: e.id,
        type: e.type,
        title: e.title,
        amount: e.amount,
        category: e.category,
        confidence: e.confidence,
        source: e.source,
        createdAt: e.createdAt,
      }));

    // Active workforce summary
    const workforceSummary = {
      totalWorkers: project.workers.length,
      checkedInToday: project.workers.filter(w =>
        w.checkIns[0]?.checkInTime &&
        new Date(w.checkIns[0].checkInTime).toDateString() === new Date().toDateString()
      ).length,
      verifiedToday: project.workers.filter(w =>
        w.checkIns[0]?.verificationStatus === "verified"
      ).length,
    };

    // Build the evidence-linked unified timeline
    const timelineEvents: Array<{
      id: string;
      date: string;
      type: string;
      title: string;
      description: string | null;
      amount?: number;
      confidence?: string;
      category?: string;
      status?: string;
    }> = [];

    // Add budget events to timeline
    budgetEvents.forEach(e => {
      timelineEvents.push({
        id: `budget-${e.id}`,
        date: e.createdAt.toISOString(),
        type: "budget",
        title: e.title,
        description: e.description,
        amount: e.amount,
        confidence: e.confidence,
        category: e.category ?? undefined,
      });
    });

    // Add change requests
    project.changeRequests.forEach(cr => {
      timelineEvents.push({
        id: `change-${cr.id}`,
        date: cr.createdAt.toISOString(),
        type: "change",
        title: cr.title,
        description: cr.description,
        status: cr.status,
        category: cr.category,
        amount: cr.estimatedCostHigh ?? cr.estimatedCostLow ?? undefined,
      });
    });

    // Add inspections
    project.inspections.forEach(insp => {
      timelineEvents.push({
        id: `inspection-${insp.id}`,
        date: insp.inspectionDate.toISOString(),
        type: "inspection",
        title: `Inspection — ${insp.stage ?? "site visit"}`,
        description: insp.notes,
      });
    });

    // Add issues
    project.issues.forEach(issue => {
      timelineEvents.push({
        id: `issue-${issue.id}`,
        date: issue.createdAt.toISOString(),
        type: "issue",
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
      });
    });

    // Add photos
    project.photos.forEach(photo => {
      timelineEvents.push({
        id: `photo-${photo.id}`,
        date: photo.createdAt.toISOString(),
        type: "evidence",
        title: "Site evidence uploaded",
        description: photo.fileName ?? null,
      });
    });

    // Sort by date descending
    timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Build response
    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        city: project.city,
        district: project.district,
        state: project.state,
        latitude: project.latitude,
        longitude: project.longitude,
        constructionType: project.constructionType,
        builtArea: project.builtArea,
        currentStage: project.currentStage,
        status: project.status,
        progress: project.progress,
        homeownerName: project.homeownerName,
        estimatedCost: project.estimatedCost,
        expectedCompletion: project.expectedCompletion,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        engineer: project.engineer,
        homeowner: project.homeowner,
      },
      truth: {
        originalEstimate,
        currentExpectedCost,
        totalPaid,
        budgetChangeFromOriginal: currentExpectedCost
          ? currentExpectedCost - (originalEstimate ?? 0)
          : null,
        budgetChangePercentage: originalEstimate && currentExpectedCost
          ? Math.round(((currentExpectedCost - originalEstimate) / originalEstimate) * 100)
          : null,
        budgetChanges,
        openAlerts: project.alerts.length,
      },
      workforce: workforceSummary,
      siteContext: project.siteContexts[0] ?? null,
      changeRequests: project.changeRequests,
      latestRisk: project.riskPredictions[0] ?? null,
      attentionScore,
      timeline: timelineEvents.slice(0, 30),
      counts: project._count,
    });
  } catch (error) {
    console.error("Project Truth API error:", error);
    return NextResponse.json({ error: "Failed to load project truth" }, { status: 500 });
  }
}

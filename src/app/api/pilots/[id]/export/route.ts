import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/pilots/[id]/export
 * Export a comprehensive pilot report as JSON.
 * Every field is explicitly labelled as observed, reported, calculated, or not measured.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: pilotId } = await context.params;

    const pilot = await db.pilot.findUnique({
      where: { id: pilotId },
      include: {
        project: {
          select: {
            id: true, name: true, city: true, currentStage: true, progress: true,
            constructionType: true, builtArea: true,
          },
        },
        measurements: { orderBy: { createdAt: "asc" } },
        feedback: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!pilot) {
      return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
    }

    // Authorization
    if (pilot.createdById !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get usage analytics for the pilot's project
    const events = await db.productEvent.findMany({
      where: { projectId: pilot.projectId },
      select: { eventType: true, createdAt: true },
    });

    const eventTypeCounts: Record<string, number> = {};
    events.forEach(e => {
      eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1;
    });

    // Calculate pilot duration
    const startDate = pilot.startDate ? new Date(pilot.startDate) : null;
    const endDate = pilot.endDate ? new Date(pilot.endDate) : new Date();
    const durationDays = startDate ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

    // Compute measurement changes
    const measurementSummary = pilot.measurements.map(m => ({
      category: m.category,
      metric: m.metricName,
      baseline: m.baselineValue,
      current: m.currentValue,
      unit: m.unit,
      change: m.baselineValue !== null && m.currentValue !== null
        ? m.currentValue - m.baselineValue
        : null,
      changePercent: m.baselineValue !== null && m.currentValue !== null && m.baselineValue !== 0
        ? Math.round(((m.currentValue - m.baselineValue) / m.baselineValue) * 100)
        : null,
      _label: "observed_during_pilot",
    }));

    // Feedback summary
    const ratings = pilot.feedback.filter(f => f.rating !== null).map(f => f.rating!);
    const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

    const report = {
      _disclaimer: "This report contains observed and calculated data from a pilot program. Claims are limited to what was directly measured or reported.",
      _generatedAt: new Date().toISOString(),

      pilotSummary: {
        project: pilot.project.name,
        city: pilot.project.city,
        participant: pilot.participantName || "Not specified",
        participantRole: pilot.participantRole || "Not specified",
        status: pilot.status,
        startDate: pilot.startDate,
        endDate: pilot.endDate,
        durationDays: durationDays,
        _label: "reported",
      },

      usage: {
        inspections: eventTypeCounts["inspection_created"] || 0,
        photos: eventTypeCounts["photo_uploaded"] || 0,
        issuesCreated: eventTypeCounts["issue_created"] || 0,
        issuesResolved: eventTypeCounts["issue_resolved"] || 0,
        evidenceAdded: eventTypeCounts["evidence_added"] || 0,
        workforceCheckins: eventTypeCounts["workforce_checkin"] || 0,
        workersAdded: eventTypeCounts["worker_added"] || 0,
        homeownerConcerns: eventTypeCounts["homeowner_concern_reported"] || 0,
        costEstimates: eventTypeCounts["cost_estimate_created"] || 0,
        _label: "calculated_from_events",
      },

      measurements: measurementSummary,

      feedback: {
        totalResponses: pilot.feedback.length,
        averageRating: avgRating,
        ratings: ratings,
        categories: pilot.feedback.reduce((acc, f) => {
          acc[f.category] = (acc[f.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        responses: pilot.feedback.map(f => ({
          category: f.category,
          rating: f.rating,
          feedback: f.feedback,
          feature: f.feature,
          submittedBy: f.user.name,
          role: f.user.role,
          date: f.feedbackDate || f.createdAt,
          _label: "reported_by_user",
        })),
      },

      validation: {
        willingToContinue: pilot.outcome?.includes("continue") ? "reported" : "not_measured",
        willingToPay: "not_measured_until_pricing_experiment",
        majorObjections: pilot.problemsObserved || "not_recorded",
        baselineProcess: pilot.baselineProcess || "not_recorded",
        currentProcess: pilot.currentProcess || "not_recorded",
      },

      observationLabels: {
        usage: "calculated_from_database_events",
        measurements: "observed_during_pilot",
        feedback: "reported_by_pilot_participants",
        validation: "requires_additional_evidence",
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Pilot export error:", error);
    return NextResponse.json({ error: "Failed to export pilot report" }, { status: 500 });
  }
}

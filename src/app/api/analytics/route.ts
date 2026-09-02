import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/analytics
 * Returns product usage analytics from real ProductEvent records.
 * All values are computed live from the database.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Get all events for this user's projects (or all their events if engineer)
    const whereClause = role === "engineer"
      ? { user: { id: userId } }
      : { project: { homeownerId: userId } };

    const events = await db.productEvent.findMany({
      where: whereClause,
      select: { eventType: true, createdAt: true, projectId: true },
      orderBy: { createdAt: "desc" },
    });

    // Count by event type
    const eventTypeCounts: Record<string, number> = {};
    events.forEach(e => {
      eventTypeCounts[e.eventType] = (eventTypeCounts[e.eventType] || 0) + 1;
    });

    // Feature usage mapping
    const featureUsage = {
      inspections: (eventTypeCounts["inspection_created"] || 0),
      photos: (eventTypeCounts["photo_uploaded"] || 0),
      issues: (eventTypeCounts["issue_created"] || 0),
      issue_resolved: (eventTypeCounts["issue_resolved"] || 0),
      evidence: (eventTypeCounts["evidence_added"] || 0),
      workforce_checkins: (eventTypeCounts["workforce_checkin"] || 0),
      workers_added: (eventTypeCounts["worker_added"] || 0),
      homeowner_concerns: (eventTypeCounts["homeowner_concern_reported"] || 0),
      cost_estimates: (eventTypeCounts["cost_estimate_created"] || 0),
      ai_analyses: (eventTypeCounts["ai_analysis_requested"] || 0),
      projects_created: (eventTypeCounts["project_created"] || 0),
    };

    // Activity over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => new Date(e.createdAt) >= thirtyDaysAgo);

    // Group by day
    const dailyActivity: Record<string, number> = {};
    recentEvents.forEach(e => {
      const day = new Date(e.createdAt).toISOString().split("T")[0];
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    });

    // Unique projects with activity
    const activeProjects = new Set(events.map(e => e.projectId).filter(Boolean)).size;

    // Pilot stats
    const pilots = await db.pilot.findMany({
      where: role === "engineer" ? { createdById: userId } : { project: { homeownerId: userId } },
      select: { status: true },
    });

    const pilotStats = {
      total: pilots.length,
      planned: pilots.filter(p => p.status === "planned").length,
      active: pilots.filter(p => p.status === "active").length,
      completed: pilots.filter(p => p.status === "completed").length,
    };

    // Validation stats
    const [interviews, experiments, feedback] = await Promise.all([
      db.customerInterview.count({ where: { userId } }),
      db.pricingExperiment.count({ where: { userId } }),
      db.productFeedback.count({ where: { userId } }),
    ]);

    // Interview insights
    const interviewRecords = await db.customerInterview.findMany({
      where: { userId },
      select: { willingnessToTry: true, willingnessToPay: true, problemExperienced: true },
    });

    const willingnessToTry = interviewRecords.filter(i => i.willingnessToTry === "yes").length;
    const willingnessToPay = interviewRecords.filter(i => i.willingnessToPay === "yes").length;
    const problemConfirmed = interviewRecords.filter(i => i.problemExperienced).length;

    return NextResponse.json({
      featureUsage,
      totalEvents: events.length,
      activeProjects,
      dailyActivity,
      pilotStats,
      validation: {
        interviews,
        experiments,
        feedback,
        willingnessToTry,
        willingnessToPay,
        problemConfirmed,
      },
      summary: {
        totalFeatureUses: Object.values(featureUsage).reduce((a, b) => a + b, 0),
        mostUsedFeature: Object.entries(featureUsage).sort(([, a], [, b]) => b - a)[0]?.[0] || null,
        dataRange: events.length > 0 ? {
          from: events[events.length - 1].createdAt,
          to: events[0].createdAt,
        } : null,
      },
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}

/**
 * POST /api/analytics
 * Record a product event (internal use by other APIs).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { projectId, eventType, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: "eventType is required" }, { status: 400 });
    }

    const validEvents = [
      "project_created", "inspection_created", "photo_uploaded",
      "issue_created", "issue_resolved", "evidence_added",
      "worker_added", "workforce_checkin", "homeowner_concern_reported",
      "cost_estimate_created", "ai_analysis_requested", "login",
    ];

    if (!validEvents.includes(eventType)) {
      return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
    }

    const event = await db.productEvent.create({
      data: {
        userId,
        projectId: projectId || null,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Analytics POST error:", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}

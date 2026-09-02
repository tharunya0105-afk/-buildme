import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAttentionScore } from "@/lib/spatial/attention-score";

/**
 * GET /api/dashboard
 * Returns enriched project data with computed attention scores.
 * All data comes from the database — no hardcoded arrays.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can access dashboard" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;

    // Fetch all projects for this engineer with related data
    const projects = await db.project.findMany({
      where: { engineerId },
      include: {
        _count: {
          select: {
            inspections: true,
            photos: true,
            alerts: true,
            aiAnalyses: true,
          },
        },
        engineer: {
          select: { id: true, name: true, email: true },
        },
        homeowner: {
          select: { id: true, name: true, email: true },
        },
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 1,
          select: { inspectionDate: true, stage: true, notes: true },
        },
        alerts: {
          where: { resolved: false },
          select: { id: true, severity: true, title: true },
        },
        timelineEvents: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, type: true, title: true, description: true, createdAt: true },
        },
        photos: {
          select: { id: true },
        },
        aiAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { overallAssessment: true, confidence: true, summary: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Compute attention scores for each project
    const enrichedProjects = projects.map((project) => {
      const lastInspectionDate = project.inspections[0]?.inspectionDate ?? null;

      // Check if any recent AI analysis recommended review
      const recentAiReviewRecommended = project.aiAnalyses.some(
        (a) => a.overallAssessment === "review_recommended"
      );

      const attentionInput = {
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
        recentAiReviewRecommended,
      };

      const attentionScore = calculateAttentionScore(attentionInput);

      return {
        id: project.id,
        name: project.name,
        address: project.address,
        city: project.city,
        district: project.district,
        state: project.state,
        pincode: project.pincode,
        latitude: project.latitude,
        longitude: project.longitude,
        formattedAddress: project.formattedAddress,
        constructionType: project.constructionType,
        builtArea: project.builtArea,
        currentStage: project.currentStage,
        status: project.status,
        progress: project.progress,
        homeownerName: project.homeownerName,
        estimatedCost: project.estimatedCost,
        engineerNotes: project.engineerNotes,
        expectedCompletion: project.expectedCompletion?.toISOString() ?? null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        lastInspectionDate: lastInspectionDate?.toISOString() ?? null,
        _count: project._count,
        alerts: project.alerts,
        timelineEvents: project.timelineEvents,
        latestAiAnalysis: project.aiAnalyses[0] ?? null,
        attentionScore,
      };
    });

    // Compute dashboard summary
    const summary = {
      totalProjects: enrichedProjects.length,
      normalProjects: enrichedProjects.filter((p) => p.status === "normal").length,
      attentionProjects: enrichedProjects.filter((p) => p.status === "attention").length,
      reviewProjects: enrichedProjects.filter((p) => p.status === "review").length,
      totalAlerts: enrichedProjects.reduce((sum, p) => sum + p.alerts.length, 0),
      totalInspections: enrichedProjects.reduce((sum, p) => sum + p._count.inspections, 0),
      totalPhotos: enrichedProjects.reduce((sum, p) => sum + p._count.photos, 0),
    };

    return NextResponse.json({
      projects: enrichedProjects,
      summary,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

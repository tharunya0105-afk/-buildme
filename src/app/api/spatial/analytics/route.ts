import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calculateAttentionScore,
  buildScoreInput,
} from "@/lib/spatial/attention-score";
import type { SpatialAnalytics } from "@/lib/spatial/types";

/**
 * GET /api/spatial/analytics
 * Get spatial analytics for the engineer's projects.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;

    const projects = await db.project.findMany({
      where: { engineerId },
      include: {
        _count: {
          select: { inspections: true, photos: true },
        },
        alerts: {
          where: { resolved: false },
          select: { id: true },
        },
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 1,
          select: { inspectionDate: true },
        },
        aiAnalyses: {
          where: { overallAssessment: "review_recommended" },
          take: 1,
          select: { id: true },
        },
      },
    });

    const totalProjects = projects.length;

    // Projects by district
    const districtMap = new Map<string, number>();
    for (const p of projects) {
      const district = p.district || p.city || "Unknown";
      districtMap.set(district, (districtMap.get(district) || 0) + 1);
    }
    const projectsByDistrict = Array.from(districtMap.entries())
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count);

    // Projects by stage
    const stageMap = new Map<string, number>();
    for (const p of projects) {
      const stage = p.currentStage || "unknown";
      stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
    }
    const projectsByStage = Array.from(stageMap.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count);

    // Attention levels
    let highAttention = 0;
    let mediumAttention = 0;
    let lowAttention = 0;
    let overdueInspections = 0;

    for (const project of projects) {
      const lastInspectionDate =
        project.inspections.length > 0
          ? project.inspections[0].inspectionDate
          : null;

      const scoreInput = buildScoreInput({
        status: project.status,
        currentStage: project.currentStage,
        progress: project.progress,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        expectedCompletion: project.expectedCompletion,
        lastInspectionDate,
        unresolvedAlerts: project.alerts.length,
        totalInspections: project._count.inspections,
        totalPhotos: project._count.photos,
        recentAiReviewRecommended: project.aiAnalyses.length > 0,
      });

      const { level } = calculateAttentionScore(scoreInput);

      if (level === "high") highAttention++;
      else if (level === "medium") mediumAttention++;
      else lowAttention++;

      // Check overdue
      if (!lastInspectionDate) {
        const daysSinceCreation = Math.floor(
          (Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreation > 30) overdueInspections++;
      } else {
        const daysSince = Math.floor(
          (Date.now() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince > 30) overdueInspections++;
      }
    }

    const analytics: SpatialAnalytics = {
      totalProjects,
      projectsByDistrict,
      projectsByStage,
      highAttentionSites: highAttention,
      mediumAttentionSites: mediumAttention,
      lowAttentionSites: lowAttention,
      overdueInspections,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Spatial analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

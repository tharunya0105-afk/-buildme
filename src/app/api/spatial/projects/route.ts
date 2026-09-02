import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calculateAttentionScore,
  buildScoreInput,
} from "@/lib/spatial/attention-score";
import type { SpatialProject } from "@/lib/spatial/types";

/**
 * GET /api/spatial/projects
 * Get all engineer projects with attention scores and spatial data.
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
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "high" | "medium" | "low" | "overdue" | "issues" | "stage:X"

    // Get all projects for this engineer
    const projects = await db.project.findMany({
      where: { engineerId },
      include: {
        _count: {
          select: {
            inspections: true,
            photos: true,
          },
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
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true },
        },
      },
    });

    // Calculate attention scores for each project
    const spatialProjects: SpatialProject[] = projects.map((project) => {
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

      const attentionScore = calculateAttentionScore(scoreInput);

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
        constructionType: project.constructionType,
        builtArea: project.builtArea,
        currentStage: project.currentStage,
        status: project.status,
        progress: project.progress,
        homeownerName: project.homeownerName,
        expectedCompletion: project.expectedCompletion?.toISOString() || null,
        estimatedCost: project.estimatedCost,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        lastInspectionDate: lastInspectionDate?.toISOString() || null,
        openIssues: project.alerts.length,
        attentionScore,
      };
    });

    // Apply filters
    let filtered = spatialProjects;

    if (filter === "high") {
      filtered = spatialProjects.filter((p) => p.attentionScore.level === "high");
    } else if (filter === "medium") {
      filtered = spatialProjects.filter((p) => p.attentionScore.level === "medium");
    } else if (filter === "low") {
      filtered = spatialProjects.filter((p) => p.attentionScore.level === "low");
    } else if (filter === "overdue") {
      filtered = spatialProjects.filter((p) => {
        if (!p.lastInspectionDate) return true;
        const daysSince = Math.floor(
          (Date.now() - new Date(p.lastInspectionDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince > 30;
      });
    } else if (filter === "issues") {
      filtered = spatialProjects.filter((p) => p.openIssues > 0);
    } else if (filter?.startsWith("stage:")) {
      const stage = filter.replace("stage:", "");
      filtered = spatialProjects.filter((p) => p.currentStage === stage);
    }

    // Sort by attention score descending
    filtered.sort((a, b) => b.attentionScore.score - a.attentionScore.score);

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Spatial projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

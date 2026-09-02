import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  analyzeConstructionProgress,
  getAiConfig,
} from "@/lib/ai/provider";
import type { AiAnalysisInput, AiAnalysisResult } from "@/lib/ai/types";

/**
 * POST /api/ai/analysis
 * Run a new AI progress analysis for two inspections.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can run AI analysis" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const body = await request.json();
    const { previousInspectionId, currentInspectionId } = body;

    if (!previousInspectionId || !currentInspectionId) {
      return NextResponse.json(
        { error: "Both previousInspectionId and currentInspectionId are required" },
        { status: 400 }
      );
    }

    if (previousInspectionId === currentInspectionId) {
      return NextResponse.json(
        { error: "Previous and current inspection must be different" },
        { status: 400 }
      );
    }

    // Fetch both inspections with photos and project info
    const [previousInspection, currentInspection] = await Promise.all([
      db.inspection.findUnique({
        where: { id: previousInspectionId },
        include: {
          photos: true,
          project: true,
        },
      }),
      db.inspection.findUnique({
        where: { id: currentInspectionId },
        include: {
          photos: true,
          project: true,
        },
      }),
    ]);

    if (!previousInspection || !currentInspection) {
      return NextResponse.json(
        { error: "One or both inspections not found" },
        { status: 404 }
      );
    }

    // Verify both inspections belong to the same project
    if (previousInspection.projectId !== currentInspection.projectId) {
      return NextResponse.json(
        { error: "Both inspections must belong to the same project" },
        { status: 400 }
      );
    }

    // Verify the engineer owns this project
    if (previousInspection.project.engineerId !== engineerId) {
      return NextResponse.json(
        { error: "You do not have access to this project" },
        { status: 403 }
      );
    }

    // Check if analysis already exists for this pair
    const existingAnalysis = await db.aiAnalysis.findFirst({
      where: {
        previousInspectionId,
        currentInspectionId,
      },
    });

    if (existingAnalysis) {
      return NextResponse.json(existingAnalysis);
    }

    // Check if AI is configured
    const aiConfig = getAiConfig();
    if (!aiConfig) {
      return NextResponse.json(
        {
          error: "NO_AI_CONFIGURED",
          message:
            "AI analysis is not configured. Please set the AI_API_KEY or OPENAI_API_KEY environment variable.",
        },
        { status: 503 }
      );
    }

    // Limit images per inspection
    const maxImages = aiConfig.maxImagesPerInspection;
    const previousImageUrls = previousInspection.photos
      .slice(0, maxImages)
      .map((p) => p.fileUrl);
    const currentImageUrls = currentInspection.photos
      .slice(0, maxImages)
      .map((p) => p.fileUrl);

    if (previousImageUrls.length === 0 && currentImageUrls.length === 0) {
      return NextResponse.json(
        { error: "Neither inspection has photos to analyze" },
        { status: 400 }
      );
    }

    // Build the analysis input
    const analysisInput: AiAnalysisInput = {
      project: {
        projectId: previousInspection.project.id,
        projectName: previousInspection.project.name,
        constructionType: previousInspection.project.constructionType,
        builtArea: previousInspection.project.builtArea,
        currentStage: previousInspection.project.currentStage,
      },
      previousInspection: {
        inspectionId: previousInspection.id,
        inspectionDate: previousInspection.inspectionDate.toISOString(),
        stage: previousInspection.stage,
        notes: previousInspection.notes,
        imageUrls: previousImageUrls,
      },
      currentInspection: {
        inspectionId: currentInspection.id,
        inspectionDate: currentInspection.inspectionDate.toISOString(),
        stage: currentInspection.stage,
        notes: currentInspection.notes,
        imageUrls: currentImageUrls,
      },
    };

    // Run the AI analysis
    let aiResult: AiAnalysisResult & { model: string; provider: string };

    try {
      aiResult = await analyzeConstructionProgress(analysisInput);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage === "NO_AI_CONFIGURED") {
        return NextResponse.json(
          {
            error: "NO_AI_CONFIGURED",
            message:
              "AI analysis is not configured. Please set the AI_API_KEY or OPENAI_API_KEY environment variable.",
          },
          { status: 503 }
        );
      }

      console.error("AI analysis failed:", errorMessage);
      return NextResponse.json(
        {
          error: "AI analysis could not be completed. Please try again.",
          detail: errorMessage,
        },
        { status: 500 }
      );
    }

    // Save the analysis to the database
    const analysis = await db.aiAnalysis.create({
      data: {
        projectId: previousInspection.projectId,
        previousInspectionId,
        currentInspectionId,
        generatedBy: engineerId,
        model: aiResult.model,
        provider: aiResult.provider,
        overallAssessment: aiResult.overall_assessment,
        confidence: aiResult.confidence,
        constructionStageObserved: aiResult.construction_stage_observed,
        summary: aiResult.summary,
        structuredResult: JSON.stringify({
          overall_assessment: aiResult.overall_assessment,
          confidence: aiResult.confidence,
          construction_stage_observed: aiResult.construction_stage_observed,
          changes: aiResult.changes,
          unchanged_observations: aiResult.unchanged_observations,
          uncertain_observations: aiResult.uncertain_observations,
          engineer_review_recommended: aiResult.engineer_review_recommended,
          summary: aiResult.summary,
        }),
      },
      include: {
        project: { select: { id: true, name: true } },
        previousInspection: {
          select: { id: true, inspectionDate: true, stage: true },
        },
        currentInspection: {
          select: { id: true, inspectionDate: true, stage: true },
        },
      },
    });

    // Add a timeline event for the analysis
    await db.timelineEvent.create({
      data: {
        projectId: previousInspection.projectId,
        type: "update",
        title: "AI Progress Analysis",
        description: `Analysis: ${aiResult.summary}`,
      },
    });

    // If review is recommended, add a timeline note
    if (aiResult.engineer_review_recommended) {
      await db.timelineEvent.create({
        data: {
          projectId: previousInspection.projectId,
          type: "alert",
          title: "AI Review Recommended",
          description:
            "The AI analysis identified an observation that may require engineer review.",
        },
      });
    }

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    console.error("AI analysis API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/analysis?projectId=xxx
 * List AI analyses for a project.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Verify access to the project
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (role === "engineer" && project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (role === "homeowner" && project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const analyses = await db.aiAnalysis.findMany({
      where: { projectId },
      include: {
        previousInspection: {
          select: { id: true, inspectionDate: true, stage: true },
        },
        currentInspection: {
          select: { id: true, inspectionDate: true, stage: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(analyses);
  } catch (error) {
    console.error("AI analysis list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

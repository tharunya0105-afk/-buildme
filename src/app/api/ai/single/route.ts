import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAiConfig } from "@/lib/ai/provider";

/**
 * POST /api/ai/single
 * Run AI analysis on a single inspection (no before/after comparison).
 * Produces structured visual observations from the inspection photos.
 *
 * DISCLAIMER: AI analysis is based only on visible image evidence and does
 * not replace inspection by a qualified civil/structural engineer.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json(
        { error: "Only engineers can run AI analysis" },
        { status: 403 }
      );
    }

    const engineerId = (session.user as any).id;
    const body = await request.json();
    const { inspectionId } = body;

    if (!inspectionId) {
      return NextResponse.json(
        { error: "inspectionId is required" },
        { status: 400 }
      );
    }

    // Fetch the inspection with photos and project
    const inspection = await db.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        photos: true,
        project: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 }
      );
    }

    // Verify the engineer owns this project
    if (inspection.project.engineerId !== engineerId) {
      return NextResponse.json(
        { error: "You do not have access to this inspection" },
        { status: 403 }
      );
    }

    if (inspection.photos.length === 0) {
      return NextResponse.json(
        {
          error: "NO_PHOTOS",
          message:
            "This inspection has no photos to analyze. Upload inspection photos first.",
        },
        { status: 400 }
      );
    }

    // Check if analysis already exists for this single inspection
    const existingAnalysis = await db.aiAnalysis.findFirst({
      where: {
        previousInspectionId: inspectionId,
        currentInspectionId: inspectionId,
        analysisType: "single",
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

    // Limit images
    const maxImages = aiConfig.maxImagesPerInspection;
    const imageUrls = inspection.photos.slice(0, maxImages).map((p) => p.fileUrl);

    // Build the single-inspection prompt
    const systemPrompt = buildSingleInspectionSystemPrompt();
    const userMessage = buildSingleInspectionUserMessage(inspection, imageUrls);

    // Call OpenAI
    let aiResult: SingleInspectionResult;
    try {
      aiResult = await callOpenAIForSingleInspection(aiConfig, systemPrompt, userMessage, imageUrls);
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

      console.error("AI single analysis failed:", errorMessage);
      return NextResponse.json(
        {
          error: "AI analysis could not be completed. Please try again.",
          detail: errorMessage,
        },
        { status: 500 }
      );
    }

    // Persist to AiAnalysis using same inspection ID for both fields (single analysis sentinel)
    const analysis = await db.aiAnalysis.create({
      data: {
        projectId: inspection.projectId,
        previousInspectionId: inspectionId,
        currentInspectionId: inspectionId,
        generatedBy: engineerId,
        model: aiConfig.model,
        provider: aiConfig.provider,
        analysisType: "single",
        overallAssessment: aiResult.overall_assessment,
        confidence: aiResult.confidence,
        constructionStageObserved: aiResult.construction_stage_observed ?? null,
        summary: aiResult.summary,
        structuredResult: JSON.stringify(aiResult),
      },
      include: {
        project: { select: { id: true, name: true } },
        previousInspection: {
          select: { id: true, inspectionDate: true, stage: true },
        },
      },
    });

    // Record a timeline event
    await db.timelineEvent.create({
      data: {
        projectId: inspection.projectId,
        type: "update",
        title: "AI Inspection Analysis",
        description: `Single-inspection AI analysis: ${aiResult.summary}`,
      },
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    console.error("AI single analysis API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface SingleInspectionResult {
  overall_assessment: string;
  confidence: number;
  construction_stage_observed: string | null;
  observations: string[];
  visible_issues: Array<{
    category: string;
    description: string;
    severity: "low" | "medium" | "high";
    confidence: number;
    type: "VISUAL_OBSERVATION";
  }>;
  safety_observations: string[];
  material_observations: string[];
  workmanship_observations: string[];
  limitations: string[];
  engineer_review_recommended: boolean;
  summary: string;
  disclaimer: string;
}

// ─── Prompt Builders ─────────────────────────────────────────────────────────

function buildSingleInspectionSystemPrompt(): string {
  return `You are a construction site visual analysis assistant. You examine photographs from a single construction site inspection and produce structured observations.

## CRITICAL RULES
1. You can ONLY describe what is VISUALLY OBSERVABLE in the photographs.
2. You MUST NOT make engineering conclusions or safety certifications.
3. You MUST NOT say: "The structure is safe", "The building is structurally sound", "There are no defects", "Construction is compliant."
4. You MUST clearly label all findings as VISUAL OBSERVATION — not engineering conclusions.
5. You MUST explicitly state limitations when image quality, angle, or coverage prevents reliable observation.
6. Do NOT invent observations not visible in the images.
7. Distinguish clearly between what you can see and what you cannot determine.

## DISCLAIMER TO INCLUDE
Always include in your response:
"AI analysis is based only on visible image evidence and does not replace inspection by a qualified civil/structural engineer."

## OUTPUT FORMAT
Respond ONLY with valid JSON matching this exact schema:

{
  "overall_assessment": "satisfactory_visible_progress" | "observations_noted" | "issues_visible" | "insufficient_image_coverage" | "review_recommended",
  "confidence": 0.0 to 1.0,
  "construction_stage_observed": "string or null",
  "observations": ["string - general visible observations"],
  "visible_issues": [
    {
      "category": "string (e.g. masonry, concrete, reinforcement, waterproofing, finishing, electrical_rough, plumbing_rough)",
      "description": "string - what is VISIBLY observable",
      "severity": "low" | "medium" | "high",
      "confidence": 0.0 to 1.0,
      "type": "VISUAL_OBSERVATION"
    }
  ],
  "safety_observations": ["string - visible site safety conditions"],
  "material_observations": ["string - visible material conditions"],
  "workmanship_observations": ["string - visible workmanship characteristics"],
  "limitations": ["string - what cannot be determined from these images"],
  "engineer_review_recommended": true or false,
  "summary": "string - brief overall summary",
  "disclaimer": "AI analysis is based only on visible image evidence and does not replace inspection by a qualified civil/structural engineer."
}

Respond ONLY with the JSON object. No additional text.`;
}

function buildSingleInspectionUserMessage(
  inspection: { inspectionDate: Date; stage: string | null; notes: string | null; photos: { fileUrl: string }[] },
  imageUrls: string[]
): string {
  return `## INSPECTION CONTEXT
- Date: ${inspection.inspectionDate.toISOString()}
- Stage: ${inspection.stage || "Unknown"}
- Engineer Notes: ${inspection.notes || "None"}
- Photos: ${imageUrls.length}

## TASK
Analyze the provided inspection photographs and produce structured visual observations.
Remember: label everything as VISUAL OBSERVATION, not engineering conclusions.`;
}

async function callOpenAIForSingleInspection(
  config: { apiKey: string; model: string; maxImagesPerInspection: number },
  systemPrompt: string,
  userMessage: string,
  imageUrls: string[]
): Promise<SingleInspectionResult> {
  const imageParts = imageUrls.map((url) => ({
    type: "image_url",
    image_url: { url, detail: "low" },
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userMessage },
            ...imageParts,
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned empty response");
  }

  let result: SingleInspectionResult;
  try {
    const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned malformed JSON response");
  }

  // Ensure disclaimer is always present
  if (!result.disclaimer) {
    result.disclaimer =
      "AI analysis is based only on visible image evidence and does not replace inspection by a qualified civil/structural engineer.";
  }

  // Ensure arrays exist
  if (!Array.isArray(result.observations)) result.observations = [];
  if (!Array.isArray(result.visible_issues)) result.visible_issues = [];
  if (!Array.isArray(result.safety_observations)) result.safety_observations = [];
  if (!Array.isArray(result.material_observations)) result.material_observations = [];
  if (!Array.isArray(result.workmanship_observations)) result.workmanship_observations = [];
  if (!Array.isArray(result.limitations)) result.limitations = [];

  return result;
}

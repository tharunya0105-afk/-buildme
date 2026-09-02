// ─── AI Provider Abstraction ────────────────────────────────────────────────
// This module provides a provider-agnostic interface for construction progress
// analysis. The underlying provider can be swapped by changing the implementation.

import { AiAnalysisInput, AiAnalysisResult, AiAnalysisConfig } from "./types";

/**
 * Get the AI analysis configuration from environment variables.
 * Returns null if no API key is configured.
 */
export function getAiConfig(): AiAnalysisConfig | null {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const provider = process.env.AI_PROVIDER || "openai";
  const model = process.env.AI_MODEL || "gpt-4o";

  if (!apiKey) {
    return null;
  }

  return {
    provider,
    model,
    apiKey,
    maxImagesPerInspection: parseInt(process.env.AI_MAX_IMAGES || "6", 10),
    imageMaxWidth: parseInt(process.env.AI_IMAGE_MAX_WIDTH || "1024", 10),
    imageMaxHeight: parseInt(process.env.AI_IMAGE_MAX_HEIGHT || "1024", 10),
  };
}

/**
 * Build the system prompt for construction progress analysis.
 */
function buildSystemPrompt(): string {
  return `You are a construction progress analysis assistant. You compare photographs from two different construction site inspections and produce a structured progress report.

## YOUR TASK
Compare the previous inspection images with the current inspection images. Identify visible construction changes between the two inspection periods.

## IMPORTANT RULES
1. Focus ONLY on observable evidence in the photographs.
2. Distinguish between clearly visible changes and uncertain observations.
3. Do NOT invent information that cannot be seen in the images.
4. Do NOT claim structural safety, engineering compliance, or defect diagnosis.
5. Do NOT say: "The structure is safe", "The building is structurally sound", "There are no defects", "Construction is compliant".
6. Instead use language like: "Visible progress was detected", "A potential observation is visible and may require engineer review", "The available images are insufficient to determine this".
7. When image quality or camera angle prevents reliable comparison, state this explicitly.
8. Consider the construction stage when interpreting changes.
9. Use engineer notes as supporting context, not as proof.
10. Prefer conservative conclusions when evidence is insufficient.
11. A lack of visible change does NOT necessarily mean construction has stopped.

## OUTPUT FORMAT
You MUST respond with valid JSON matching this exact schema:

{
  "overall_assessment": "progress_detected" | "limited_visible_change" | "no_clear_change" | "insufficient_evidence" | "review_recommended",
  "confidence": 0.0 to 1.0,
  "construction_stage_observed": "string or null",
  "changes": [
    {
      "category": "string (e.g. masonry, roofing, flooring, electrical, plumbing, painting, landscaping, foundation, framing)",
      "description": "string describing what changed",
      "confidence": 0.0 to 1.0
    }
  ],
  "unchanged_observations": ["string describing what appears unchanged"],
  "uncertain_observations": ["string describing what you cannot reliably determine"],
  "engineer_review_recommended": true or false,
  "summary": "string - a brief overall summary"
}

## ASSESSMENT VALUES
- "progress_detected": Clear visible progress between inspections
- "limited_visible_change": Minor changes visible but limited overall progress
- "no_clear_change": No meaningful visual difference detected
- "insufficient_evidence": Images too few, blurry, or misaligned for comparison
- "review_recommended": An observation detected that may require engineer attention

Respond ONLY with the JSON object. No additional text before or after.`;
}

/**
 * Build the user message with inspection context and images.
 */
function buildUserMessage(input: AiAnalysisInput): string {
  const { project, previousInspection, currentInspection } = input;

  let message = `## PROJECT CONTEXT
- Project: ${project.projectName}
- Construction Type: ${project.constructionType || "Not specified"}
- Built Area: ${project.builtArea ? `${project.builtArea} sq ft` : "Not specified"}

## PREVIOUS INSPECTION
- Date: ${previousInspection.inspectionDate}
- Stage: ${previousInspection.stage || "Unknown"}
- Notes: ${previousInspection.notes || "None"}
- Photos: ${previousInspection.imageUrls.length}

## CURRENT INSPECTION
- Date: ${currentInspection.inspectionDate}
- Stage: ${currentInspection.stage || "Unknown"}
- Notes: ${currentInspection.notes || "None"}
- Photos: ${currentInspection.imageUrls.length}

## IMAGES
The images are provided in order: first all PREVIOUS INSPECTION images (labeled), then all CURRENT INSPECTION images (labeled).

Compare the two sets of images and produce your structured analysis.`;

  return message;
}

/**
 * Call OpenAI's multimodal API for construction progress analysis.
 */
async function callOpenAI(
  config: AiAnalysisConfig,
  input: AiAnalysisInput
): Promise<AiAnalysisResult> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(input);

  // Build image content parts
  const imageParts: Array<{ type: string; image_url: { url: string; detail: string } }> = [];

  for (const url of input.previousInspection.imageUrls) {
    imageParts.push({
      type: "image_url",
      image_url: { url, detail: "low" },
    });
  }

  for (const url of input.currentInspection.imageUrls) {
    imageParts.push({
      type: "image_url",
      image_url: { url, detail: "low" },
    });
  }

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

  // Parse the JSON response
  let result: AiAnalysisResult;
  try {
    // Strip markdown code fences if present
    const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned malformed JSON response");
  }

  // Validate the result structure
  const validAssessments = [
    "progress_detected",
    "limited_visible_change",
    "no_clear_change",
    "insufficient_evidence",
    "review_recommended",
  ];

  if (!validAssessments.includes(result.overall_assessment)) {
    throw new Error("AI returned invalid overall_assessment value");
  }

  if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
    throw new Error("AI returned invalid confidence value");
  }

  if (!Array.isArray(result.changes)) {
    throw new Error("AI returned invalid changes array");
  }

  return result;
}

/**
 * Main analysis function. Provider-agnostic entry point.
 * Currently supports OpenAI. Add new provider cases as needed.
 */
export async function analyzeConstructionProgress(
  input: AiAnalysisInput
): Promise<AiAnalysisResult & { model: string; provider: string }> {
  const config = getAiConfig();

  if (!config) {
    throw new Error("NO_AI_CONFIGURED");
  }

  let result: AiAnalysisResult;

  switch (config.provider) {
    case "openai":
      result = await callOpenAI(config, input);
      break;
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  return {
    ...result,
    model: config.model,
    provider: config.provider,
  };
}

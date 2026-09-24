/**
 * Stage Classifier — Photo-to-Stage Probability Distribution
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  TRACK 2 — CLASSIFIER INTERFACE                                         ║
 * ║  This is the EMISSION MODEL for the Viterbi decoder in trajectory.ts    ║
 * ║  It outputs P(stage | image) for each stage in the graph.               ║
 * ║                                                                          ║
 * ║  CURRENT IMPLEMENTATION: GPT-4o Vision (stub/placeholder)               ║
 * ║  Replace classifier body with a fine-tuned ViT or ResNet when ready.    ║
 * ║  The interface (StageObservation) must remain stable.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * NOTE: The GPT-4o call itself is NOT novel (it is a conventional API call).
 * The novel mechanism is in trajectory.ts — this file is just the emission
 * probability estimator that feeds the decoder.
 */

import { getStagesForElement } from "./index";
import type { StageObservation } from "./trajectory";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassifierInput {
  photoId: string;
  imageUrl: string;        // must be a URL accessible to the model (signed URL)
  elementType: string;     // e.g. "column", "brickwork"
  timestamp: string;       // ISO timestamp from EXIF or upload
  projectContext?: string; // optional: "G+2 residential, brickwork floor 1 in progress"
}

export interface ClassifierResult {
  photoId: string;
  elementType: string;
  /** Probability distribution over stage IDs for this element type */
  stageProbabilities: Record<string, number>;
  /** Raw model confidence in the classification (not the trajectory) */
  overallConfidence: number;
  /** Model explanation for highest-probability stage */
  reasoning?: string;
  /** Whether this came from the model or a mock/fallback */
  source: "gpt4o" | "mock" | "cached";
}

// ─── GPT-4o Prompt Builder ────────────────────────────────────────────────────

function buildClassificationPrompt(
  elementType: string,
  stageLabels: { id: string; label: string; description: string }[]
): string {
  const stageList = stageLabels
    .map((s, i) => `  ${i + 1}. "${s.id}": ${s.label} — ${s.description}`)
    .join("\n");

  return `You are a construction stage classification assistant for Indian residential RCC-frame buildings.

Your task: analyze this site photo and assign a probability to each construction stage listed below, for the structural element type "${elementType}".

Rules:
- Probabilities must sum to 1.0 (or close to it)
- Be conservative: if you cannot clearly see evidence of a stage, assign low probability
- If the photo is blurry, not of this element, or lacks clear evidence, set overallConfidence below 0.3
- Do NOT infer stages that are concealed — only assign probability to what is directly visible

Stages to score (for element type: ${elementType}):
${stageList}

Respond ONLY with a JSON object in this exact format:
{
  "stageProbabilities": {
    "<stage_id>": <probability_0_to_1>,
    ...
  },
  "overallConfidence": <0_to_1>,
  "reasoning": "<one sentence explaining the top stage assignment>"
}`;
}

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * Classify a single photo against the stage graph for the given element type.
 *
 * Returns a probability distribution over stages that is used as the
 * emission probability in the Viterbi decoder.
 */
export async function classifyPhoto(
  input: ClassifierInput,
  apiKey?: string
): Promise<ClassifierResult> {
  const stages = getStagesForElement(input.elementType);

  if (stages.length === 0) {
    return makeMockResult(input, stages, "No stages defined for element type");
  }

  const stageLabels = stages.map((s) => ({
    id: s.id,
    label: s.label,
    description: s.description,
  }));

  const effectiveApiKey = apiKey ?? process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;

  if (!effectiveApiKey) {
    console.warn("[Classifier] No API key — returning mock probabilities");
    return makeMockResult(input, stages, "No API key configured");
  }

  try {
    const prompt = buildClassificationPrompt(input.elementType, stageLabels);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 512,
        temperature: 0.1, // low temperature for consistent classification
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: input.imageUrl, detail: "high" },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Classifier] API error:", error);
      return makeMockResult(input, stages, `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from model response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Classifier] No JSON in response:", content);
      return makeMockResult(input, stages, "Could not parse model response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const stageProbabilities: Record<string, number> = {};

    // Normalise: ensure all stages present, sum to 1
    let total = 0;
    for (const stage of stages) {
      const p = Math.max(0, Math.min(1, parsed.stageProbabilities?.[stage.id] ?? 0));
      stageProbabilities[stage.id] = p;
      total += p;
    }
    if (total > 0) {
      for (const id of Object.keys(stageProbabilities)) {
        stageProbabilities[id] /= total;
      }
    }

    return {
      photoId: input.photoId,
      elementType: input.elementType,
      stageProbabilities,
      overallConfidence: Math.max(0, Math.min(1, parsed.overallConfidence ?? 0.5)),
      reasoning: parsed.reasoning,
      source: "gpt4o",
    };
  } catch (err) {
    console.error("[Classifier] Unexpected error:", err);
    return makeMockResult(input, stages, String(err));
  }
}

/**
 * Classify a batch of photos for the same element type.
 * Processes sequentially to respect rate limits.
 */
export async function classifyPhotoBatch(
  inputs: ClassifierInput[],
  apiKey?: string,
  delayMs = 200
): Promise<ClassifierResult[]> {
  const results: ClassifierResult[] = [];
  for (const input of inputs) {
    results.push(await classifyPhoto(input, apiKey));
    if (delayMs > 0 && input !== inputs[inputs.length - 1]) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}

/**
 * Convert classifier results to StageObservation format for the trajectory decoder.
 */
export function classifierResultsToObservations(
  results: ClassifierResult[],
  timestamps: Record<string, string> // photoId -> timestamp
): StageObservation[] {
  return results.map((r) => ({
    photoId: r.photoId,
    timestamp: timestamps[r.photoId] ?? new Date().toISOString(),
    stageProbabilities: r.stageProbabilities,
    overallConfidence: r.overallConfidence,
  }));
}

// ─── Mock / Baseline ──────────────────────────────────────────────────────────

/**
 * Baseline comparator: returns the per-image argmax classification
 * WITHOUT any trajectory fitting. Used for ablation comparison.
 * This is the "no graph constraints, no temporal coherence" baseline.
 */
export function getBaselineClassification(
  result: ClassifierResult
): { stageId: string; probability: number } {
  let bestStage = "";
  let bestProb = -1;
  for (const [stageId, prob] of Object.entries(result.stageProbabilities)) {
    if (prob > bestProb) {
      bestProb = prob;
      bestStage = stageId;
    }
  }
  return { stageId: bestStage, probability: bestProb };
}

function makeMockResult(
  input: ClassifierInput,
  stages: { id: string }[],
  _reason: string
): ClassifierResult {
  // Uniform distribution as mock — worst case for the trajectory decoder
  const uniform = stages.length > 0 ? 1 / stages.length : 0;
  const stageProbabilities: Record<string, number> = {};
  for (const s of stages) {
    stageProbabilities[s.id] = uniform;
  }
  return {
    photoId: input.photoId,
    elementType: input.elementType,
    stageProbabilities,
    overallConfidence: 0.1,
    reasoning: "Mock result (no API key or API error)",
    source: "mock",
  };
}

/**
 * API: Run trajectory fitting for a structural element
 *
 * POST /api/trajectory/[elementId]
 *
 * Runs the Viterbi trajectory decoder over all StageRecords for this element,
 * writes the result back to StructuralElement, and logs any abstention.
 *
 * This endpoint is the production wire-in of the Track 2 pipeline.
 * Called: after photo upload + classification, or on-demand from the stage dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fitTrajectoryWithDualPassCheck,
  DEFAULT_TRAJECTORY_CONFIG,
  type StageObservation,
  type TrajectoryConfig,
} from "@/lib/stage-graph/trajectory";
import { getBaselineClassification } from "@/lib/stage-graph/classifier";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { elementId } = await params;

  // Fetch the element and its project (for auth check)
  const element = await db.structuralElement.findUnique({
    where: { id: elementId },
    include: {
      project: { select: { engineerId: true, homeownerId: true } },
      stageRecords: {
        orderBy: { photoTimestamp: "asc" },
      },
    },
  });

  if (!element) {
    return NextResponse.json({ error: "Element not found" }, { status: 404 });
  }

  // Authorization: engineer on the project only
  const userId = (session.user as { id?: string }).id;
  if (element.project.engineerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (element.stageRecords.length === 0) {
    return NextResponse.json(
      { error: "No stage records — upload and classify photos first" },
      { status: 400 }
    );
  }

  // Build observation sequence from stage records
  const observations: StageObservation[] = [];
  for (const record of element.stageRecords) {
    // Group all records for the same photo into one observation
    const existing = observations.find((o) => o.photoId === (record.photoId ?? record.id));
    if (existing) {
      existing.stageProbabilities[record.stageId] = Math.max(
        existing.stageProbabilities[record.stageId] ?? 0,
        record.probability
      );
    } else {
      observations.push({
        photoId: record.photoId ?? record.id,
        timestamp: record.photoTimestamp.toISOString(),
        stageProbabilities: { [record.stageId]: record.probability },
        overallConfidence: record.overallConfidence ?? undefined,
      });
    }
  }

  // Parse config overrides from request body (for ablation testing)
  let configOverride: Partial<TrajectoryConfig> = {};
  try {
    const body = await request.json();
    configOverride = body.config ?? {};
  } catch {
    // No body — use defaults
  }

  const config: TrajectoryConfig = { ...DEFAULT_TRAJECTORY_CONFIG, ...configOverride };

  // Run trajectory fitting with dual-pass check
  const { result, dualPassAgreed } = fitTrajectoryWithDualPassCheck(
    element.elementType,
    elementId,
    observations,
    config
  );

  // Write result back to StructuralElement
  const updateData: Record<string, unknown> = {
    lastFittedAt: new Date(),
    abstained: result.abstained,
    abstentionReason: result.abstentionReason ?? null,
    currentStageId: result.currentStage?.stageId ?? null,
    currentStageLabel: result.currentStage?.stageLabel ?? null,
    currentStageStatus: result.currentStage?.status ?? null,
    trajectoryConfidence: result.trajectoryConfidence,
  };

  await db.structuralElement.update({
    where: { id: elementId },
    data: updateData,
  });

  // Update stage records with trajectory status
  for (const fitted of result.fittedPath) {
    // Find records that correspond to this stage
    const matchingRecords = element.stageRecords.filter(
      (r) => r.stageId === fitted.stageId
    );
    for (const record of matchingRecords) {
      await db.stageRecord.update({
        where: { id: record.id },
        data: {
          trajectoryStatus: fitted.status,
          fittedPathJson: JSON.stringify(result.fittedPath),
        },
      });
    }
  }

  // Log abstention event if abstained
  if (result.abstained) {
    await db.abstentionEvent.create({
      data: {
        projectId: element.projectId,
        elementId: elementId,
        reason: result.abstentionReason ?? "Unknown",
        confidenceA: result.trajectoryConfidence,
      },
    });
  }

  // Compute baseline for comparison logging
  const baselineVotes: Record<string, number> = {};
  for (const record of element.stageRecords) {
    const bl = { stageId: record.stageId, probability: record.probability };
    if (!baselineVotes[bl.stageId] || bl.probability > baselineVotes[bl.stageId]) {
      baselineVotes[bl.stageId] = bl.probability;
    }
  }
  const baselineStage = Object.entries(baselineVotes).sort(([, a], [, b]) => b - a)[0];

  return NextResponse.json({
    success: true,
    elementId,
    trajectory: result,
    dualPassAgreed,
    baseline: baselineStage
      ? { stageId: baselineStage[0], probability: baselineStage[1] }
      : null,
    configUsed: config,
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ elementId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { elementId } = await params;

  const element = await db.structuralElement.findUnique({
    where: { id: elementId },
    include: {
      stageRecords: {
        orderBy: { photoTimestamp: "asc" },
        select: {
          id: true,
          stageId: true,
          stageLabel: true,
          probability: true,
          trajectoryStatus: true,
          photoTimestamp: true,
          classifierSource: true,
          baselineStageId: true,
        },
      },
      abstentionEvents: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!element) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ element });
}

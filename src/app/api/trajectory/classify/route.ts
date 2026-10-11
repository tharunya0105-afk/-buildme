import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { classifyPhoto } from "@/lib/stage-graph/classifier";
import { getStagesForElement } from "@/lib/stage-graph/index";
import {
  fitTrajectoryWithDualPassCheck,
  DEFAULT_TRAJECTORY_CONFIG,
  type StageObservation,
} from "@/lib/stage-graph/trajectory";
import { applyRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/trajectory/classify
 *
 * Core Track 2 Pipeline:
 * 1. Takes photoId (or imageUrl) + elementId
 * 2. Runs GPT-4o Vision (or configured emission classifier)
 * 3. Persists StageRecord rows in the database
 * 4. Runs Viterbi dual-pass trajectory decoder
 * 5. Updates StructuralElement with fitted stage & confidence
 * 6. Logs AbstentionEvent if dual-pass disagrees or confidence is low
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit(session, "ai");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { elementId, photoId, imageUrl: directImageUrl, timestamp } = body;

    if (!elementId) {
      return NextResponse.json(
        { error: "elementId is required" },
        { status: 400 }
      );
    }

    // Fetch element with project
    const element = await db.structuralElement.findUnique({
      where: { id: elementId },
      include: {
        project: { select: { id: true, engineerId: true, homeownerId: true, name: true } },
      },
    });

    if (!element) {
      return NextResponse.json({ error: "Structural element not found" }, { status: 404 });
    }

    // Engineer or authorized user check
    if (session.user.role !== "engineer" && element.project.engineerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: engineer access only" }, { status: 403 });
    }

    let finalImageUrl = directImageUrl;
    let photoRecord: any = null;
    let photoDate = timestamp ? new Date(timestamp) : new Date();

    if (photoId) {
      photoRecord = await db.photo.findUnique({
        where: { id: photoId },
      });
      if (photoRecord) {
        finalImageUrl = photoRecord.fileUrl;
        photoDate = photoRecord.timestamp;

        // Tag photo to element if not already tagged
        await db.photoElementTag.create({
          data: { photoId, elementId, confirmedByEngineer: true },
        }).catch(() => {});
      }
    }

    if (!finalImageUrl) {
      return NextResponse.json(
        { error: "No image URL or photo record available for classification" },
        { status: 400 }
      );
    }

    // 1. Run classifier
    const classifierResult = await classifyPhoto({
      photoId: photoId || `photo_${Date.now()}`,
      imageUrl: finalImageUrl,
      elementType: element.elementType,
      timestamp: photoDate.toISOString(),
      projectContext: `Project ${element.project.name}, Element ${element.label} (${element.elementType})`,
    });

    // Determine top / argmax stage
    let topStageId = "";
    let maxProb = -1;
    for (const [sId, prob] of Object.entries(classifierResult.stageProbabilities)) {
      if (prob > maxProb) {
        maxProb = prob;
        topStageId = sId;
      }
    }

    const elementStages = getStagesForElement(element.elementType);
    const topStageLabel = elementStages.find((s) => s.id === topStageId)?.label ?? topStageId;

    // 2. Persist StageRecord
    const savedRecord = await db.stageRecord.create({
      data: {
        elementId: element.id,
        photoId: photoId || null,
        photoTimestamp: photoDate,
        stageId: topStageId,
        stageLabel: topStageLabel,
        probability: maxProb,
        overallConfidence: classifierResult.overallConfidence,
        classifierSource: classifierResult.source,
        rawOutput: JSON.stringify(classifierResult),
        baselineStageId: topStageId,
        baselineProbability: maxProb,
      },
    });

    // 3. Fetch all stage records for this element to run trajectory fitting
    const allRecords = await db.stageRecord.findMany({
      where: { elementId: element.id },
      orderBy: { photoTimestamp: "asc" },
    });

    // 4. Build observation sequence for Viterbi
    const observations: StageObservation[] = [];
    for (const record of allRecords) {
      let stageProbabilities: Record<string, number> = { [record.stageId]: record.probability };
      if (record.rawOutput) {
        try {
          const parsed = JSON.parse(record.rawOutput);
          if (parsed.stageProbabilities) {
            stageProbabilities = parsed.stageProbabilities;
          }
        } catch {
          // fallback to single stage
        }
      }

      observations.push({
        photoId: record.photoId ?? record.id,
        timestamp: record.photoTimestamp.toISOString(),
        stageProbabilities,
        overallConfidence: record.overallConfidence ?? undefined,
      });
    }

    // 5. Fit trajectory dual pass
    const { result, dualPassAgreed } = fitTrajectoryWithDualPassCheck(
      element.elementType,
      element.id,
      observations,
      DEFAULT_TRAJECTORY_CONFIG
    );

    // 6. Update StructuralElement
    const updatedElement = await db.structuralElement.update({
      where: { id: element.id },
      data: {
        currentStageId: result.currentStage?.stageId ?? null,
        currentStageLabel: result.currentStage?.stageLabel ?? null,
        currentStageStatus: result.currentStage?.status ?? null,
        trajectoryConfidence: result.trajectoryConfidence,
        lastFittedAt: new Date(),
        abstained: result.abstained,
        abstentionReason: result.abstentionReason ?? null,
      },
    });

    // 7. Update latest record's trajectoryStatus
    await db.stageRecord.update({
      where: { id: savedRecord.id },
      data: {
        trajectoryStatus: result.currentStage?.status ?? null,
        fittedPathJson: JSON.stringify(result.fittedPath),
      },
    });

    // 8. Log AbstentionEvent if abstained
    if (result.abstained) {
      await db.abstentionEvent.create({
        data: {
          projectId: element.project.id,
          elementId: element.id,
          reason: result.abstentionReason ?? "Dual-pass disagreement or low confidence",
          confidenceA: result.trajectoryConfidence,
        },
      });
    }

    return NextResponse.json({
      success: true,
      classifierResult,
      trajectoryResult: result,
      dualPassAgreed,
      element: updatedElement,
      record: savedRecord,
    });
  } catch (error: any) {
    console.error("Trajectory classify error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during classification" },
      { status: 500 }
    );
  }
}

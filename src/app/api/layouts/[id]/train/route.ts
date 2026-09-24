import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { FEATURE_DIM } from "@/lib/ai/layout/head-constants";

/**
 * POST /api/layouts/[id]/train
 * Records that a correction was used as a training sample for the layout
 * head. The actual gradient step happens client-side (the head lives in the
 * browser); this endpoint stores the server-side record so training data is
 * auditable and can be re-used for offline retraining.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { id } = await params;
    const plan = await db.layoutPlan.findUnique({
      where: { id },
      include: { project: { select: { engineerId: true, homeownerId: true } } },
    });
    if (!plan) {
      return NextResponse.json({ error: "Layout plan not found" }, { status: 404 });
    }
    if (plan.project.engineerId !== userId && plan.project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { kind, loss, theta, samplesAfter } = body as {
      kind?: string;
      loss?: number;
      theta?: number[];
      samplesAfter?: number;
    };

    if (!kind) {
      return NextResponse.json({ error: "correction kind is required" }, { status: 400 });
    }

    await db.layoutCorrection.create({
      data: {
        planId: id,
        createdById: userId,
        kind,
        targetRef: null,
        beforeSnapshot: null,
        afterSnapshot: JSON.stringify({
          loss: loss ?? null,
          theta: theta ?? null,
          samplesAfter: samplesAfter ?? null,
          featureDim: FEATURE_DIM,
          headVersion: "layout-head-v1",
        }),
      },
    });

    await db.layoutPlan.update({
      where: { id },
      data: { correctionsCount: { increment: 1 } },
    });

    return NextResponse.json({
      ok: true,
      headVersion: "layout-head-v1",
      featureDim: FEATURE_DIM,
      samplesAfter: samplesAfter ?? null,
    });
  } catch (error) {
    console.error("Layout train log error:", error);
    return NextResponse.json({ error: "Failed to record training sample" }, { status: 500 });
  }
}

/**
 * GET /api/layouts/[id]/train
 * Aggregate training stats for this plan's correction history.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { id } = await params;
    const plan = await db.layoutPlan.findUnique({
      where: { id },
      include: {
        project: { select: { engineerId: true, homeownerId: true } },
        corrections: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!plan) {
      return NextResponse.json({ error: "Layout plan not found" }, { status: 404 });
    }
    if (plan.project.engineerId !== userId && plan.project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const byKind: Record<string, number> = {};
    for (const c of plan.corrections) {
      byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
    }

    return NextResponse.json({
      totalSamples: plan.corrections.length,
      byKind,
      latest: plan.corrections.at(-1)?.afterSnapshot ?? null,
      headVersion: "layout-head-v1",
    });
  } catch (error) {
    console.error("Layout train stats error:", error);
    return NextResponse.json({ error: "Failed to fetch training stats" }, { status: 500 });
  }
}

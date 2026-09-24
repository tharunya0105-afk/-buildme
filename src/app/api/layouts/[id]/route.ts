import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/layouts/[id] — fetch a plan with its geometry and corrections.
 * PATCH — update geometry after corrections (merge, delete, move walls…).
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
        project: { select: { id: true, name: true, engineerId: true, homeownerId: true } },
        corrections: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { createdBy: { select: { id: true, name: true } } },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Layout plan not found" }, { status: 404 });
    }
    if (plan.project.engineerId !== userId && plan.project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Fetch layout plan error:", error);
    return NextResponse.json({ error: "Failed to fetch layout plan" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();
    const {
      rooms, walls, openings, stats,
      scaleFeetPerPx, title, floorLabel,
      correction,
    } = body as {
      rooms?: unknown;
      walls?: unknown;
      openings?: unknown;
      stats?: unknown;
      scaleFeetPerPx?: number;
      title?: string;
      floorLabel?: string;
      correction?: {
        kind: string;
        targetRef?: string;
        before?: unknown;
        after?: unknown;
      };
    };

    const data: Record<string, unknown> = {};
    if (rooms !== undefined) data.rooms = JSON.stringify(rooms);
    if (walls !== undefined) data.walls = JSON.stringify(walls);
    if (openings !== undefined) data.openings = JSON.stringify(openings);
    if (stats !== undefined) data.stats = JSON.stringify(stats);
    if (scaleFeetPerPx !== undefined) data.scaleFeetPerPx = scaleFeetPerPx;
    if (title?.trim()) data.title = title.trim();
    if (floorLabel?.trim()) data.floorLabel = floorLabel.trim();
    if (rooms !== undefined) data.source = "hybrid";

    const updated = await db.layoutPlan.update({ where: { id }, data });

    if (correction?.kind) {
      await db.layoutCorrection.create({
        data: {
          planId: id,
          createdById: userId,
          kind: correction.kind,
          targetRef: correction.targetRef ?? null,
          beforeSnapshot: correction.before ? JSON.stringify(correction.before) : null,
          afterSnapshot: JSON.stringify(correction.after ?? {}),
        },
      });
      await db.layoutPlan.update({
        where: { id },
        data: { correctionsCount: { increment: 1 } },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update layout plan error:", error);
    return NextResponse.json({ error: "Failed to update layout plan" }, { status: 500 });
  }
}

export async function DELETE(
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
      include: { project: { select: { engineerId: true } } },
    });
    if (!plan) {
      return NextResponse.json({ error: "Layout plan not found" }, { status: 404 });
    }
    if (plan.project.engineerId !== userId) {
      return NextResponse.json({ error: "Only the engineer can delete plans" }, { status: 403 });
    }

    await db.layoutPlan.update({ where: { id }, data: { status: "archived" } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete layout plan error:", error);
    return NextResponse.json({ error: "Failed to delete layout plan" }, { status: 500 });
  }
}

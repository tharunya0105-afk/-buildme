import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * PATCH /api/workers/[id]
 * Update worker details (deactivate, change type, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can update workers" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const { id } = await params;

    // Find worker and verify ownership through project
    const worker = await db.worker.findFirst({
      where: {
        id,
        project: { engineerId },
      },
    });
    if (!worker) {
      return NextResponse.json({ error: "Worker not found or access denied" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone || null;
    if (body.workerType !== undefined) updates.workerType = body.workerType || null;
    if (body.active !== undefined) updates.active = body.active;

    const updated = await db.worker.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ worker: updated });
  } catch (error) {
    console.error("Worker PATCH error:", error);
    return NextResponse.json({ error: "Failed to update worker" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * PATCH /api/command-center/actions/[id]
 * Update action status: start, complete, or dismiss.
 * All changes are attributed to the authenticated engineer.
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
      return NextResponse.json({ error: "Only engineers can update actions" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const { id: actionId } = await params;

    // Verify ownership
    const existing = await db.actionItem.findUnique({ where: { id: actionId } });
    if (!existing) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }
    if (existing.createdById !== engineerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { status, completedNote, outcome, dismissedReason } = body;

    const validStatuses = ["open", "in_progress", "completed", "dismissed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    if (status === "in_progress") {
      updateData.status = "in_progress";
    } else if (status === "completed") {
      updateData.status = "completed";
      updateData.completedAt = new Date();
      updateData.completedById = engineerId;
      if (completedNote) updateData.completedNote = completedNote;
      if (outcome) updateData.outcome = outcome;
    } else if (status === "dismissed") {
      updateData.status = "dismissed";
      updateData.dismissedAt = new Date();
      updateData.dismissedReason = dismissedReason || "No reason provided";
    } else if (status) {
      updateData.status = status;
    }

    const updated = await db.actionItem.update({
      where: { id: actionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      action: {
        id: updated.id,
        status: updated.status,
        outcome: updated.outcome,
        completedAt: updated.completedAt,
        dismissedAt: updated.dismissedAt,
      },
    });
  } catch (error) {
    console.error("Action update error:", error);
    return NextResponse.json({ error: "Failed to update action" }, { status: 500 });
  }
}

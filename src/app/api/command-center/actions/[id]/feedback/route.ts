import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/command-center/actions/[id]/feedback
 * Submit feedback on whether a recommendation was useful.
 * Critical for future intelligence validation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can submit feedback" }, { status: 403 });
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
    const { useful, falsePositive, missedIssue, notes } = body;

    const validUseful = ["yes", "partially", "no"];
    if (!useful || !validUseful.includes(useful)) {
      return NextResponse.json(
        { error: "Useful must be 'yes', 'partially', or 'no'" },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await db.actionFeedback.findFirst({
      where: { actionId, userId: engineerId },
    });

    let feedback;
    if (existingFeedback) {
      feedback = await db.actionFeedback.update({
        where: { id: existingFeedback.id },
        data: {
          useful,
          falsePositive: falsePositive ?? null,
          missedIssue: missedIssue ?? null,
          notes: notes ?? null,
        },
      });
    } else {
      feedback = await db.actionFeedback.create({
        data: {
          actionId,
          userId: engineerId,
          useful,
          falsePositive: falsePositive ?? null,
          missedIssue: missedIssue ?? null,
          notes: notes ?? null,
        },
      });
    }

    return NextResponse.json({ success: true, feedbackId: feedback.id });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

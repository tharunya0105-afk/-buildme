/**
 * BuildMe Pilot Feedback API
 *
 * Collects genuine user feedback from pilot participants.
 * Maximum 5 questions focused on actual product usage.
 * Allows negative feedback — never manipulates responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_CATEGORIES = ["usability", "usefulness", "bug", "missing_feature", "pricing", "trust", "other"];

// ─── GET — List feedback for a pilot ───────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: pilotId } = await params;

    const pilot = await db.pilot.findFirst({
      where: { id: pilotId, createdById: (session.user as any).id as string },
    });
    if (!pilot) return NextResponse.json({ error: "Pilot not found" }, { status: 404 });

    const feedback = await db.pilotFeedback.findMany({
      where: { pilotId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        category: true,
        rating: true,
        feedback: true,
        feature: true,
        severity: true,
        feedbackDate: true,
      },
    });

    return NextResponse.json({ feedback });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST — Submit pilot feedback ──────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: pilotId } = await params;
    const body = await req.json();

    const pilot = await db.pilot.findFirst({
      where: { id: pilotId, createdById: userId },
    });
    if (!pilot) return NextResponse.json({ error: "Pilot not found" }, { status: 404 });

    const { category, rating, feedback, feature, severity } = body;

    if (!feedback || typeof feedback !== "string" || !feedback.trim()) {
      return NextResponse.json({ error: "Feedback text is required" }, { status: 400 });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }
    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const fb = await db.pilotFeedback.create({
      data: {
        pilotId,
        userId,
        category: category || "other",
        rating: rating || null,
        feedback: feedback.trim(),
        feature: feature || null,
        severity: severity || null,
      },
    });

    return NextResponse.json({ success: true, feedback: { id: fb.id, category: fb.category, rating: fb.rating } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

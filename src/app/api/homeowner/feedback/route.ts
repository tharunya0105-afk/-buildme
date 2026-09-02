import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/homeowner/feedback
 * Allow a homeowner to submit feedback about their project experience.
 * Creates a ProductFeedback record linked to the homeowner's user ID.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "homeowner") {
      return NextResponse.json({ error: "Only homeowners can submit this feedback" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { projectId, responses, rating, whatWorked, whatDifficult, wouldUseAgain, comments } = body;

    // Verify project belongs to homeowner
    if (projectId) {
      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project || project.homeownerId !== userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Store responses as individual feedback records
    const savedResponses = [];

    // Handle simple form fields
    if (rating) {
      const record = await db.productFeedback.create({
        data: { userId, source: "homeowner_feedback", category: "usability", feedback: `Overall rating: ${rating}/5`, severity: null, feedbackDate: new Date() },
      });
      savedResponses.push(record);
    }
    if (whatWorked) {
      const record = await db.productFeedback.create({
        data: { userId, source: "homeowner_feedback", category: "usefulness", feedback: `What was helpful: ${whatWorked}`, severity: null, feedbackDate: new Date() },
      });
      savedResponses.push(record);
    }
    if (whatDifficult) {
      const record = await db.productFeedback.create({
        data: { userId, source: "homeowner_feedback", category: "usability", feedback: `What was difficult: ${whatDifficult}`, severity: "medium", feedbackDate: new Date() },
      });
      savedResponses.push(record);
    }
    if (wouldUseAgain) {
      const record = await db.productFeedback.create({
        data: { userId, source: "homeowner_feedback", category: "value", feedback: `Would use again: ${wouldUseAgain}`, severity: null, feedbackDate: new Date() },
      });
      savedResponses.push(record);
    }
    if (comments) {
      const record = await db.productFeedback.create({
        data: { userId, source: "homeowner_feedback", category: "other", feedback: comments, severity: null, feedbackDate: new Date() },
      });
      savedResponses.push(record);
    }

    // Handle legacy responses object format
    if (responses && typeof responses === "object") {
      for (const [question, answer] of Object.entries(responses)) {
        if (answer && typeof answer === "string" && answer.trim()) {
          const record = await db.productFeedback.create({
            data: { userId, source: "homeowner_survey", category: "usability", feedback: `${question}: ${answer.trim()}`, severity: null, feedbackDate: new Date() },
          });
          savedResponses.push(record);
        }
      }
    }

    return NextResponse.json({ success: true, count: savedResponses.length });
  } catch (error) {
    console.error("Homeowner feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

/**
 * GET /api/homeowner/feedback
 * Check if homeowner has already submitted feedback for a project.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const feedback = await db.productFeedback.findMany({
      where: { userId, source: "homeowner_survey" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ feedback, hasSubmitted: feedback.length > 0 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}

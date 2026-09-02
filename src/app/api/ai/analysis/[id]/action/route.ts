import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/ai/analysis/[id]/action
 * Engineer action on an AI analysis: dismiss, review, update status.
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
      return NextResponse.json({ error: "Only engineers can perform this action" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const { id } = await params;
    const body = await request.json();
    const { action, note, projectStatus } = body;

    // Valid actions: "dismiss", "reviewed", "update_status"
    const validActions = ["dismiss", "reviewed", "update_status"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // Find the analysis
    const analysis = await db.aiAnalysis.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, engineerId: true } },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    if (analysis.project.engineerId !== engineerId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build timeline event description
    let timelineTitle = "";
    let timelineDescription = "";

    switch (action) {
      case "dismiss":
        timelineTitle = "AI Analysis Dismissed";
        timelineDescription = note
          ? `Engineer dismissed AI review recommendation. Note: ${note}`
          : "Engineer dismissed AI review recommendation.";
        break;
      case "reviewed":
        timelineTitle = "AI Analysis Reviewed";
        timelineDescription = note
          ? `Engineer reviewed AI analysis. Note: ${note}`
          : "Engineer reviewed the AI analysis.";
        break;
      case "update_status":
        if (!projectStatus || !["normal", "attention", "review"].includes(projectStatus)) {
          return NextResponse.json(
            { error: "Invalid project status" },
            { status: 400 }
          );
        }
        await db.project.update({
          where: { id: analysis.projectId },
          data: { status: projectStatus },
        });
        timelineTitle = "Project Status Updated";
        timelineDescription = `Project status changed to "${projectStatus}" based on AI analysis review.`;
        break;
    }

    // Add timeline event
    await db.timelineEvent.create({
      data: {
        projectId: analysis.projectId,
        type: action === "update_status" ? "alert" : "update",
        title: timelineTitle,
        description: timelineDescription,
      },
    });

    return NextResponse.json({ success: true, action, timelineTitle });
  } catch (error) {
    console.error("AI analysis action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

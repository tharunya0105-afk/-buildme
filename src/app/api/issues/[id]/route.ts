import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/issues/[id]
 * Get a single issue with evidence and timeline.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { id } = await params;

    const issue = await db.issue.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, engineerId: true, homeownerId: true, name: true } },
        reportedBy: { select: { id: true, name: true, role: true } },
        evidence: {
          include: {
            uploadedBy: { select: { id: true, name: true, role: true } },
            photo: { select: { id: true, fileUrl: true, fileName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        timelineEvents: {
          include: { performedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Verify access
    if (role === "engineer" && issue.project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (role === "homeowner" && issue.project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json({ error: "Failed to fetch issue" }, { status: 500 });
  }
}

/**
 * PATCH /api/issues/[id]
 * Update issue status/details. Engineer only.
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

    const userId = (session.user as any).id;
    const { id } = await params;
    const body = await request.json();
    const { status, severity, description } = body;

    const issue = await db.issue.findUnique({
      where: { id },
      include: { project: { select: { engineerId: true } } },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (issue.project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const previousStatus = issue.status;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (status && status !== previousStatus) {
      updateData.status = status;
      if (status === "resolved") {
        updateData.resolvedAt = new Date();
      }

      // Create timeline event for status change
      await db.issueTimelineEvent.create({
        data: {
          issueId: id,
          action: status === "resolved" ? "resolved" : "status_changed",
          description: `Status changed from ${previousStatus} to ${status}`,
          performedById: userId,
          previousStatus,
          newStatus: status,
        },
      });
    }

    if (severity) updateData.severity = severity;
    if (description !== undefined) updateData.description = description?.trim() || null;

    const updated = await db.issue.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: { select: { id: true, name: true, role: true } },
        _count: { select: { evidence: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}

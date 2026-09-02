import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/issues/[id]/evidence
 * Add evidence to an issue. Requires auth and project access.
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

    const userId = (session.user as any).id;
    const { id: issueId } = await params;
    const body = await request.json();
    const { type, description, photoId, trustLabel } = body;

    if (!type) {
      return NextResponse.json({ error: "Evidence type is required" }, { status: 400 });
    }

    // Verify issue exists and user has access
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: { project: { select: { engineerId: true, homeownerId: true } } },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Verify access
    const role = (session.user as any).role;
    if (role === "engineer" && issue.project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (role === "homeowner" && issue.project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // If photoId provided, verify it belongs to the same project
    if (photoId) {
      const photo = await db.photo.findUnique({ where: { id: photoId } });
      if (!photo || photo.projectId !== issue.projectId) {
        return NextResponse.json({ error: "Photo not found or not in this project" }, { status: 400 });
      }
    }

    const evidence = await db.evidence.create({
      data: {
        issueId,
        uploadedById: userId,
        type,
        description: description?.trim() || null,
        photoId: photoId || null,
        trustLabel: trustLabel || "self_reported",
      },
      include: {
        uploadedBy: { select: { id: true, name: true, role: true } },
        photo: { select: { id: true, fileUrl: true, fileName: true } },
      },
    });

    // Create timeline event
    await db.issueTimelineEvent.create({
      data: {
        issueId,
        action: "evidence_added",
        description: `Evidence added: ${type}${description ? ` — ${description}` : ""}`,
        performedById: userId,
      },
    });

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error("Error adding evidence:", error);
    return NextResponse.json({ error: "Failed to add evidence" }, { status: 500 });
  }
}

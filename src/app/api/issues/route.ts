import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/issues?projectId=xxx
 * List issues for a project. Requires auth and project access.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Verify project access
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (role === "engineer" && project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (role === "homeowner" && project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const issues = await db.issue.findMany({
      where: { projectId },
      include: {
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
        _count: { select: { evidence: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

/**
 * POST /api/issues
 * Create a new issue. Engineer only.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { projectId, title, description, category, severity } = body;

    if (!projectId || !title?.trim()) {
      return NextResponse.json({ error: "projectId and title are required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const issue = await db.issue.create({
      data: {
        projectId,
        reportedById: userId,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "other",
        severity: severity || "medium",
        status: "open",
      },
      include: {
        reportedBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Create timeline event
    await db.issueTimelineEvent.create({
      data: {
        issueId: issue.id,
        action: "created",
        description: "Issue reported",
        performedById: userId,
      },
    });

    // Create project timeline event
    await db.timelineEvent.create({
      data: {
        projectId,
        type: "alert",
        title: "Issue Reported",
        description: title.trim(),
      },
    });

    // Track product event
    await db.productEvent.create({
      data: { userId, projectId, eventType: "issue_created", metadata: JSON.stringify({ title: title.trim(), category, severity }) },
    }).catch(() => {});

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}

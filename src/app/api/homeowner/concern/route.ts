import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/homeowner/concern
 * Allows a homeowner to report a concern about their assigned project.
 * Creates an Issue record in the existing Issue system.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "homeowner") {
      return NextResponse.json({ error: "Only homeowners can report concerns" }, { status: 403 });
    }

    const homeownerId = (session.user as any).id;
    const body = await request.json();
    const { projectId, category, title, description, severity } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "projectId and title are required" },
        { status: 400 }
      );
    }

    // Verify the project belongs to this homeowner
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, homeownerId: true, name: true, engineerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.homeownerId !== homeownerId) {
      return NextResponse.json({ error: "You do not have access to this project" }, { status: 403 });
    }

    // Create the issue using the existing Issue model
    const issue = await db.issue.create({
      data: {
        projectId,
        reportedById: homeownerId,
        title,
        description: description || null,
        category: category || "other",
        severity: severity || "medium",
        status: "open",
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    // Create a timeline event
    await db.issueTimelineEvent.create({
      data: {
        issueId: issue.id,
        action: "created",
        description: `Concern reported by homeowner`,
        performedById: homeownerId,
      },
    });

    // Also create a project timeline event
    await db.timelineEvent.create({
      data: {
        projectId,
        type: "update",
        title: "Homeowner concern reported",
        description: title,
      },
    });

    // Track product event
    await db.productEvent.create({
      data: { userId: homeownerId, projectId, eventType: "homeowner_concern_reported", metadata: JSON.stringify({ title, category, severity }) },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      issue: {
        id: issue.id,
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        status: issue.status,
        project: issue.project.name,
        createdAt: issue.createdAt,
      },
    });
  } catch (error) {
    console.error("Homeowner concern API error:", error);
    return NextResponse.json(
      { error: "Failed to submit concern" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/homeowner/concern
 * Returns concerns/issues for the homeowner's assigned project.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "homeowner") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const homeownerId = (session.user as any).id;

    // Find the homeowner's assigned project
    const project = await db.project.findFirst({
      where: { homeownerId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ issues: [] });
    }

    const issues = await db.issue.findMany({
      where: { projectId: project.id },
      include: {
        evidence: {
          select: { id: true, type: true, description: true, createdAt: true },
        },
        timelineEvents: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { action: true, description: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error("Homeowner concerns GET error:", error);
    return NextResponse.json({ error: "Failed to load concerns" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/projects/[id]/changes
 * List change requests for a project.
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

    const { id } = await params;
    const userId = (session.user as any).id;

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId && project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const changes = await db.changeRequest.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, description: true, category: true, status: true,
        estimatedCostLow: true, estimatedCostHigh: true, actualCost: true,
        assumptions: true, timelineImpactDays: true, rationale: true,
        createdAt: true, updatedAt: true, completedAt: true,
      },
    });

    return NextResponse.json(changes);
  } catch (error) {
    console.error("Changes API error:", error);
    return NextResponse.json({ error: "Failed to load changes" }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/changes
 * Create a new change request with cost impact estimation.
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

    const { id } = await params;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can create change requests" }, { status: 403 });
    }

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, estimatedCostLow, estimatedCostHigh, assumptions, timelineImpactDays, rationale } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const validCategories = ["addition", "deletion", "modification", "material_upgrade", "design_change", "site_requirement", "other"];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const change = await db.changeRequest.create({
      data: {
        projectId: id,
        createdById: userId,
        title: title.trim(),
        description: description ?? null,
        category: category ?? "other",
        estimatedCostLow: typeof estimatedCostLow === "number" ? estimatedCostLow : null,
        estimatedCostHigh: typeof estimatedCostHigh === "number" ? estimatedCostHigh : null,
        assumptions: assumptions ?? null,
        timelineImpactDays: typeof timelineImpactDays === "number" ? timelineImpactDays : null,
        rationale: rationale ?? null,
      },
    });

    // Also create a budget event for the change impact
    if (estimatedCostHigh || estimatedCostLow) {
      const estimatedAmount = estimatedCostHigh ?? estimatedCostLow ?? 0;
      await db.budgetEvent.create({
        data: {
          projectId: id,
          createdById: userId,
          type: "change_impact",
          category: category ?? "other",
          title: `Change: ${title.trim()}`,
          description: description ?? null,
          amount: estimatedAmount,
          confidence: "medium",
          source: "engineer",
          changeRequestId: change.id,
        },
      });
    }

    return NextResponse.json(change, { status: 201 });
  } catch (error) {
    console.error("Create change request error:", error);
    return NextResponse.json({ error: "Failed to create change request" }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]/changes
 * Update a change request status.
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

    const { id } = await params;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (role !== "engineer") {
      return NextResponse.json({ error: "Only engineers can update change requests" }, { status: 403 });
    }

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { changeId, status, actualCost } = body;

    if (!changeId) {
      return NextResponse.json({ error: "changeId is required" }, { status: 400 });
    }

    const validStatuses = ["proposed", "approved", "rejected", "in_progress", "completed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (typeof actualCost === "number") updateData.actualCost = actualCost;
    if (status === "approved") {
      updateData.approvedById = userId;
      updateData.approvedAt = new Date();
    }
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const change = await db.changeRequest.update({
      where: { id: changeId, projectId: id },
      data: updateData,
    });

    return NextResponse.json(change);
  } catch (error) {
    console.error("Update change request error:", error);
    return NextResponse.json({ error: "Failed to update change request" }, { status: 500 });
  }
}

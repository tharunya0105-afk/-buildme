import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/projects/[id]/budget
 * Returns budget events and budget story for a project.
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

    const events = await db.budgetEvent.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, type: true, category: true, title: true, description: true,
        amount: true, cumulativeTotal: true, confidence: true, source: true,
        approved: true, createdAt: true,
      },
    });

    // Compute budget story
    const originalEstimate = project.estimatedCost;
    const lastEvent = events.filter(e => e.cumulativeTotal !== null).pop();
    const currentExpectedCost = lastEvent?.cumulativeTotal ?? originalEstimate;
    const totalPaid = events
      .filter(e => e.type === "payment")
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    return NextResponse.json({
      originalEstimate,
      currentExpectedCost,
      totalPaid,
      budgetChangeFromOriginal: currentExpectedCost && originalEstimate
        ? currentExpectedCost - originalEstimate
        : null,
      budgetChangePercentage: originalEstimate && currentExpectedCost
        ? Math.round(((currentExpectedCost - originalEstimate) / originalEstimate) * 100)
        : null,
      events,
    });
  } catch (error) {
    console.error("Budget API error:", error);
    return NextResponse.json({ error: "Failed to load budget data" }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/budget
 * Create a budget event (payment, cost update, etc.)
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
      return NextResponse.json({ error: "Only engineers can create budget events" }, { status: 403 });
    }

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { type, category, title, description, amount, confidence, source } = body;

    const validTypes = ["payment", "material_cost", "labour_cost", "change_impact", "site_condition", "escalation", "other"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid budget event type" }, { status: 400 });
    }
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof amount !== "number" || isNaN(amount)) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    // Calculate cumulative total
    const existingEvents = await db.budgetEvent.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
      select: { amount: true, type: true },
    });

    // Start from original estimate
    let cumulativeTotal = project.estimatedCost ?? 0;
    existingEvents.forEach(e => {
      if (e.type === "payment") {
        cumulativeTotal += Math.abs(e.amount);
      } else {
        cumulativeTotal += e.amount;
      }
    });
    // Add this event
    cumulativeTotal += type === "payment" ? Math.abs(amount) : amount;

    const event = await db.budgetEvent.create({
      data: {
        projectId: id,
        createdById: userId,
        type,
        category: category ?? null,
        title: title.trim(),
        description: description ?? null,
        amount,
        cumulativeTotal,
        confidence: confidence ?? "medium",
        source: source ?? "engineer",
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Create budget event error:", error);
    return NextResponse.json({ error: "Failed to create budget event" }, { status: 500 });
  }
}

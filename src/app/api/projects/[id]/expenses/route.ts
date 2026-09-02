/**
 * BuildMe Project Expenses API
 *
 * Records legitimate project expenses for budget tracking.
 * Each expense is a real financial record, not fabricated data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_EXPENSE_TYPES = [
  "material_cost", "labour_cost", "professional_fees",
  "equipment", "approvals", "transportation", "other",
];

const VALID_CATEGORIES = [
  "foundation", "structure", "brickwork", "roofing",
  "flooring", "electrical", "plumbing", "painting",
  "waterproofing", "interior", "exterior", "other",
];

// ─── GET — List expenses for a project ─────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: projectId } = await params;

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const expenses = await db.budgetEvent.findMany({
      where: {
        projectId,
        type: { not: "original_estimate" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        category: true,
        title: true,
        description: true,
        amount: true,
        source: true,
        confidence: true,
        evidenceRef: true,
        approved: true,
        createdAt: true,
      },
    });

    // Category summary
    const categorySummary: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || e.type;
      categorySummary[cat] = (categorySummary[cat] || 0) + e.amount;
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      expenses,
      summary: {
        totalExpenses: Math.round(totalExpenses),
        expenseCount: expenses.length,
        categorySummary,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch expenses" }, { status: 500 });
  }
}

// ─── POST — Record a new expense ──────────────────────────────────────────

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

    const { id: projectId } = await params;
    const body = await req.json();

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validation
    const { type, category, title, description, amount, date } = body;

    if (!type || !VALID_EXPENSE_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid expense type. Must be one of: ${VALID_EXPENSE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    if (amount > 100000000) {
      return NextResponse.json({ error: "Amount exceeds reasonable limit (₹10 crore)" }, { status: 400 });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    const expense = await db.budgetEvent.create({
      data: {
        projectId,
        createdById: userId,
        type,
        category: category || null,
        title: title.trim(),
        description: description || null,
        amount: Math.round(amount),
        source: "engineer",
        confidence: "user_reported",
        approved: false,
      },
    });

    return NextResponse.json({
      success: true,
      expense: {
        id: expense.id,
        type: expense.type,
        category: expense.category,
        title: expense.title,
        amount: expense.amount,
        createdAt: expense.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record expense" }, { status: 500 });
  }
}

// ─── PATCH — Update an expense ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: projectId } = await params;
    const body = await req.json();

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { expenseId, ...updates } = body;
    if (!expenseId) {
      return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
    }

    // Verify expense belongs to this project
    const existing = await db.budgetEvent.findFirst({
      where: { id: expenseId, projectId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (updates.amount !== undefined) {
      if (typeof updates.amount !== "number" || updates.amount <= 0) {
        return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
      }
      updateData.amount = Math.round(updates.amount);
    }
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.type !== undefined && VALID_EXPENSE_TYPES.includes(updates.type)) {
      updateData.type = updates.type;
    }
    if (updates.approved !== undefined) updateData.approved = updates.approved;

    const updated = await db.budgetEvent.update({
      where: { id: expenseId },
      data: updateData,
    });

    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update expense" }, { status: 500 });
  }
}

// ─── DELETE — Remove an expense ────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: projectId } = await params;
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return NextResponse.json({ error: "expenseId query parameter required" }, { status: 400 });
    }

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = await db.budgetEvent.findFirst({
      where: { id: expenseId, projectId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await db.budgetEvent.delete({ where: { id: expenseId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete expense" }, { status: 500 });
  }
}

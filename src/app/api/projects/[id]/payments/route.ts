import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET — List payment requests for a project ──────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const payments = await db.paymentRequest.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// ─── POST — Create a payment request ────────────────────────────────────────

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
    const { title, description, amount, milestone, notes, budgetRemaining, totalPaidSoFar } = body;

    if (!title || !amount || amount <= 0) {
      return NextResponse.json({ error: "Title and valid amount are required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const payment = await db.paymentRequest.create({
      data: {
        projectId,
        createdById: userId,
        title,
        description: description || null,
        amount: parseFloat(amount),
        milestone: milestone || null,
        notes: notes || null,
        budgetRemaining: budgetRemaining != null ? parseFloat(budgetRemaining) : null,
        totalPaidSoFar: totalPaidSoFar != null ? parseFloat(totalPaidSoFar) : null,
        status: "requested",
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment request:", error);
    return NextResponse.json({ error: "Failed to create payment request" }, { status: 500 });
  }
}

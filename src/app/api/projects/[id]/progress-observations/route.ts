import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET — List progress observations for a project ─────────────────────────

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

    const observations = await db.progressObservation.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(observations);
  } catch (error) {
    console.error("Error fetching progress observations:", error);
    return NextResponse.json({ error: "Failed to fetch observations" }, { status: 500 });
  }
}

// ─── POST — Create a progress observation ───────────────────────────────────

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
    const { title, observed, inferred, notVerifiable, changeDescription, stage, confidence } = body;

    if (!title || !observed) {
      return NextResponse.json({ error: "Title and observed description are required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const observation = await db.progressObservation.create({
      data: {
        projectId,
        createdById: userId,
        title,
        observed,
        inferred: inferred || null,
        notVerifiable: notVerifiable || null,
        changeDescription: changeDescription || null,
        stage: stage || null,
        confidence: confidence || "medium",
      },
    });

    return NextResponse.json(observation, { status: 201 });
  } catch (error) {
    console.error("Error creating progress observation:", error);
    return NextResponse.json({ error: "Failed to create observation" }, { status: 500 });
  }
}

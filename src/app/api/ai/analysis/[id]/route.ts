import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/ai/analysis/[id]
 * Get a specific AI analysis with full details.
 */
export async function GET(
  request: NextRequest,
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

    const analysis = await db.aiAnalysis.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, engineerId: true, homeownerId: true },
        },
        previousInspection: {
          include: {
            photos: {
              select: { id: true, fileUrl: true, fileName: true, createdAt: true },
            },
          },
        },
        currentInspection: {
          include: {
            photos: {
              select: { id: true, fileUrl: true, fileName: true, createdAt: true },
            },
          },
        },
        engineer: {
          select: { id: true, name: true },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Verify access
    if (role === "engineer" && analysis.project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (role === "homeowner" && analysis.project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse structured result
    let structuredResult;
    try {
      structuredResult = JSON.parse(analysis.structuredResult);
    } catch {
      structuredResult = null;
    }

    return NextResponse.json({
      ...analysis,
      structuredResult,
    });
  } catch (error) {
    console.error("AI analysis detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

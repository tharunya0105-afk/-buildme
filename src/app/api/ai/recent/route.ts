import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/ai/recent
 * Get recent AI analyses across all of the engineer's projects.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const analyses = await db.aiAnalysis.findMany({
      where: {
        project: { engineerId },
      },
      include: {
        project: {
          select: { id: true, name: true, status: true },
        },
        previousInspection: {
          select: { id: true, inspectionDate: true, stage: true },
        },
        currentInspection: {
          select: { id: true, inspectionDate: true, stage: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(analyses);
  } catch (error) {
    console.error("Recent AI insights error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/ai/metrics
 * Returns real AI analysis statistics from the database.
 * All values are computed live - never hardcoded.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if ((session.user as any).role !== "engineer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const engineerId = (session.user as any).id;

    const analyses = await db.aiAnalysis.findMany({
      where: { project: { engineerId } },
      select: {
        id: true,
        projectId: true,
        confidence: true,
        createdAt: true,
        analysisType: true,
        overallAssessment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAnalyses = analyses.length;
    const projectsAnalyzed = new Set(analyses.map((a) => a.projectId)).size;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const analysesLast7Days = analyses.filter(
      (a) => new Date(a.createdAt) >= sevenDaysAgo
    ).length;

    let averageConfidence: number | null = null;
    let hasConfidenceData = false;

    if (totalAnalyses > 0) {
      const total = analyses.reduce((sum, a) => sum + a.confidence, 0);
      averageConfidence = Math.round((total / totalAnalyses) * 100) / 100;
      hasConfidenceData = true;
    }

    const comparisonCount = analyses.filter((a) => a.analysisType === "comparison").length;
    const singleCount = analyses.filter((a) => a.analysisType === "single").length;

    const pendingReviews = await db.aiPrediction.count({
      where: { project: { engineerId }, status: "pending" },
    });

    return NextResponse.json({
      totalAnalyses,
      projectsAnalyzed,
      analysesLast7Days,
      averageConfidence,
      hasConfidenceData,
      comparisonCount,
      singleCount,
      pendingReviews,
    });
  } catch (error) {
    console.error("AI metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

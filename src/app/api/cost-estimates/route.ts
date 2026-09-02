import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/cost-estimates?projectId=xxx
 * List cost estimates for a project.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, string> = { userId };
    if (projectId) where.projectId = projectId;

    const estimates = await db.costEstimate.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Error fetching cost estimates:", error);
    return NextResponse.json({ error: "Failed to fetch estimates" }, { status: 500 });
  }
}

/**
 * POST /api/cost-estimates
 * Save a cost estimate.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const {
      projectId, district, state, builtArea, floors,
      constructionType, qualityLevel, baseRate,
      qualityFactor, locationFactor, estimatedTotal,
      lowerEstimate, higherEstimate,
    } = body;

    if (!projectId || !builtArea || !estimatedTotal) {
      return NextResponse.json({ error: "projectId, builtArea, and estimatedTotal are required" }, { status: 400 });
    }

    // Verify project access
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const estimate = await db.costEstimate.create({
      data: {
        projectId,
        userId,
        district: district || null,
        state: state || null,
        builtArea,
        floors: floors || null,
        constructionType: constructionType || null,
        qualityLevel: qualityLevel || "standard",
        baseRate,
        qualityFactor,
        locationFactor,
        estimatedTotal,
        lowerEstimate: lowerEstimate || estimatedTotal * 0.85,
        higherEstimate: higherEstimate || estimatedTotal * 1.2,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    // Track product event
    await db.productEvent.create({
      data: { userId, projectId, eventType: "cost_estimate_created", metadata: JSON.stringify({ estimatedTotal }) },
    }).catch(() => {});

    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error("Error saving cost estimate:", error);
    return NextResponse.json({ error: "Failed to save estimate" }, { status: 500 });
  }
}

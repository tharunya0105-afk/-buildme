import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/projects/[id]/site-context
 * Returns site context for a project.
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

    const context = await db.siteContext.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(context ?? null);
  } catch (error) {
    console.error("Site context GET error:", error);
    return NextResponse.json({ error: "Failed to load site context" }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/site-context
 * Create or update site context.
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
      return NextResponse.json({ error: "Only engineers can set site context" }, { status: 403 });
    }

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { roadAccess, vehicleAccess, waterAvailability, siteLevel, soilType, waterTableDepth, accessDistanceM, basementRequired, costRiskNotes } = body;

    // Upsert — create new or update existing
    const existing = await db.siteContext.findFirst({ where: { projectId: id } });

    let context;
    if (existing) {
      context = await db.siteContext.update({
        where: { id: existing.id },
        data: {
          roadAccess: roadAccess ?? existing.roadAccess,
          vehicleAccess: vehicleAccess ?? existing.vehicleAccess,
          waterAvailability: waterAvailability ?? existing.waterAvailability,
          siteLevel: siteLevel ?? existing.siteLevel,
          soilType: soilType ?? existing.soilType,
          waterTableDepth: waterTableDepth ?? existing.waterTableDepth,
          accessDistanceM: typeof accessDistanceM === "number" ? accessDistanceM : existing.accessDistanceM,
          basementRequired: typeof basementRequired === "boolean" ? basementRequired : existing.basementRequired,
          costRiskNotes: costRiskNotes ?? existing.costRiskNotes,
        },
      });
    } else {
      context = await db.siteContext.create({
        data: {
          projectId: id,
          createdById: userId,
          roadAccess: roadAccess ?? null,
          vehicleAccess: vehicleAccess ?? null,
          waterAvailability: waterAvailability ?? null,
          siteLevel: siteLevel ?? null,
          soilType: soilType ?? null,
          waterTableDepth: waterTableDepth ?? null,
          accessDistanceM: typeof accessDistanceM === "number" ? accessDistanceM : null,
          basementRequired: typeof basementRequired === "boolean" ? basementRequired : false,
          costRiskNotes: costRiskNotes ?? null,
        },
      });
    }

    return NextResponse.json(context);
  } catch (error) {
    console.error("Site context POST error:", error);
    return NextResponse.json({ error: "Failed to save site context" }, { status: 500 });
  }
}

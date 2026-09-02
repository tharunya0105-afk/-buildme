import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/projects/[id] - Get a single project with details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        engineer: {
          select: { id: true, name: true, email: true },
        },
        homeowner: {
          select: { id: true, name: true, email: true },
        },
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 10,
        },
        photos: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        alerts: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        timelineEvents: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            inspections: true,
            photos: true,
            alerts: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify access
    if (
      (role === "engineer" && project.engineerId !== userId) ||
      (role === "homeowner" && project.homeownerId !== userId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

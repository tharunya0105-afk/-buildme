import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/inspections/[id]/photos - List photos for an inspection
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

    const inspection = await db.inspection.findUnique({
      where: { id },
      include: {
        project: {
          select: { engineerId: true, homeownerId: true },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 }
      );
    }

    // Verify access
    if (
      (role === "engineer" && inspection.project.engineerId !== userId) ||
      (role === "homeowner" && inspection.project.homeownerId !== userId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const photos = await db.photo.findMany({
      where: { inspectionId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/inspections/[id] - Get a single inspection with details
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
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            engineerId: true,
            homeownerId: true,
          },
        },
        engineer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photos: {
          orderBy: { createdAt: "asc" },
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

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspection" },
      { status: 500 }
    );
  }
}

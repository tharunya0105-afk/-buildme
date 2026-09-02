import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/alerts - List alerts for the current user's projects
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const resolved = searchParams.get("resolved");

    let whereClause: any = {};

    if (role === "engineer") {
      whereClause.project = { engineerId: userId };
    } else {
      whereClause.project = { homeownerId: userId };
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (resolved !== null) {
      whereClause.resolved = resolved === "true";
    }

    const alerts = await db.alert.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (role !== "engineer") {
      return NextResponse.json(
        { error: "Only engineers can access dashboard stats" },
        { status: 403 }
      );
    }

    const [
      totalActiveSites,
      normalSites,
      attentionSites,
      reviewSites,
      recentInspections,
    ] = await Promise.all([
      db.project.count({
        where: { engineerId: userId },
      }),
      db.project.count({
        where: { engineerId: userId, status: "normal" },
      }),
      db.project.count({
        where: { engineerId: userId, status: "attention" },
      }),
      db.project.count({
        where: { engineerId: userId, status: "review" },
      }),
      db.inspection.count({
        where: {
          project: { engineerId: userId },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalActiveSites,
      normalSites,
      attentionSites,
      reviewSites,
      recentInspections,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

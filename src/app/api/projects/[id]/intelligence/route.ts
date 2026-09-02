import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProjectIntelligence } from "@/lib/intelligence/project-intelligence";

/**
 * GET /api/projects/[id]/intelligence
 * Returns comprehensive project intelligence for the AI Brain.
 * Requires authentication and project ownership.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { id: projectId } = await context.params;

    const intelligence = await getProjectIntelligence(projectId, userId);

    if (!intelligence) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(intelligence);
  } catch (error) {
    console.error("Intelligence API error:", error);
    return NextResponse.json(
      { error: "Failed to generate project intelligence" },
      { status: 500 }
    );
  }
}

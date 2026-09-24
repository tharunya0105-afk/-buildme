import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * GET /api/layouts?projectId=…
 * List layout plans for a project (any project member).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId && project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const plans = await db.layoutPlan.findMany({
      where: { projectId, status: "active" },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { corrections: true } },
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("List layout plans error:", error);
    return NextResponse.json({ error: "Failed to list layout plans" }, { status: 500 });
  }
}

/**
 * POST /api/layouts  (multipart form: file, projectId, title, floorLabel,
 * width, height, rooms/walls/openings/stats JSON, scaleFeetPerPx)
 * Upload a layout image + its analyzed geometry (engineer or homeowner).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const title = (formData.get("title") as string | null)?.trim() || "Floor Plan";
    const floorLabel = (formData.get("floorLabel") as string | null)?.trim() || "Ground Floor";
    const widthPx = parseInt(formData.get("width") as string, 10) || null;
    const heightPx = parseInt(formData.get("height") as string, 10) || null;
    const scaleFeetPerPx = formData.get("scaleFeetPerPx")
      ? parseFloat(formData.get("scaleFeetPerPx") as string)
      : null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.engineerId !== userId && project.homeownerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported format. Please upload JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum is 20MB." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "layouts", projectId);
    await mkdir(uploadDir, { recursive: true });
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${timestamp}-${randomSuffix}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

    const rooms = formData.get("rooms") as string | null;
    const walls = formData.get("walls") as string | null;
    const openings = formData.get("openings") as string | null;
    const stats = formData.get("stats") as string | null;

    const plan = await db.layoutPlan.create({
      data: {
        projectId,
        createdById: userId,
        title,
        floorLabel,
        fileUrl: `/uploads/layouts/${projectId}/${filename}`,
        fileName: file.name,
        mimeType: file.type,
        widthPx,
        heightPx,
        scaleFeetPerPx,
        rooms: rooms || "[]",
        walls: walls || "[]",
        openings: openings || "[]",
        stats: stats || null,
        source: "ai",
      },
    });

    await db.timelineEvent
      .create({
        data: {
          projectId,
          type: "update",
          title: "Layout uploaded",
          description: `${title} (${floorLabel}) was uploaded with AI extraction.`,
        },
      })
      .catch(() => {});

    await db.productEvent
      .create({
        data: {
          userId,
          projectId,
          eventType: "layout_uploaded",
          metadata: JSON.stringify({ planId: plan.id, title }),
        },
      })
      .catch(() => {});

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Upload layout plan error:", error);
    return NextResponse.json({ error: "Layout upload failed. Please try again." }, { status: 500 });
  }
}

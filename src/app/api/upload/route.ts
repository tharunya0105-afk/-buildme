import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUploadedFile } from "@/lib/storage";
import { eventBus } from "@/lib/events";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/upload - Upload a photo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = applyRateLimit(session, "upload");
    if (rateLimitResponse) return rateLimitResponse;

    const role = session.user.role;

    if (role !== "engineer") {
      return NextResponse.json(
        { error: "Only engineers can upload photos" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string;
    const inspectionId = formData.get("inspectionId") as string;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.engineerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image format. Please upload JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 400 }
      );
    }

    // Store file via storage adapter (cloud object storage or local fallback)
    const bytes = await file.arrayBuffer();
    const stored = await saveUploadedFile(bytes, file.name, projectId);

    // Create photo record
    const photo = await db.photo.create({
      data: {
        projectId,
        inspectionId: inspectionId || null,
        uploadedBy: userId,
        fileUrl: stored.fileUrl,
        fileName: file.name,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    // Track product event
    await db.productEvent.create({
      data: { userId, projectId, eventType: "photo_uploaded", metadata: JSON.stringify({ fileName: file.name }) },
    }).catch(() => {});

    // Broadcast realtime event
    eventBus.broadcast({
      type: "photo_uploaded",
      projectId,
      payload: { photoId: photo.id, fileName: file.name, uploadedBy: userId },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Photo upload failed. Please try again." },
      { status: 500 }
    );
  }
}

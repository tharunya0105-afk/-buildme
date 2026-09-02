import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/properties/[id]/photos
 * Upload a photo for a property.
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

    const userId = (session.user as any).id;
    const { id } = await params;

    const property = await db.property.findUnique({ where: { id } });
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string || null;
    const inspectionId = formData.get("inspectionId") as string || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported image format" }, { status: 400 });
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    // Save file to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `property-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = `public/uploads/${filename}`;

    const fs = await import("fs/promises");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), filepath);
    await fs.writeFile(fullPath, buffer);

    const fileUrl = `/uploads/${filename}`;

    // Create photo record
    const photo = await db.propertyPhoto.create({
      data: {
        propertyId: id,
        uploadedBy: userId,
        fileUrl,
        fileName: file.name,
        category: category || null,
        inspectionId: inspectionId || null,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error uploading property photo:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/**
 * GET /api/properties/[id]/photos
 * List photos for a property.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    const property = await db.property.findUnique({ where: { id } });
    if (!property || property.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const photos = await db.propertyPhoto.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

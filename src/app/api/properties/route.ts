import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/properties
 * List properties for the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const properties = await db.property.findMany({
      where: { userId },
      include: {
        _count: {
          select: { inspections: true, photos: true, documents: true, analyses: true },
        },
        photos: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: { id: true, fileUrl: true, category: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/properties
 * Create a new property for buyer evaluation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const {
      name, propertyType, builtArea, floors, propertyAge, constructionYear,
      latitude, longitude, address, city, district, state, pincode,
      formattedAddress, askingPrice, bedrooms, bathrooms, parking,
      constructionType, notes,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Property name is required" }, { status: 400 });
    }

    const property = await db.property.create({
      data: {
        userId,
        name: name.trim(),
        propertyType: propertyType || null,
        builtArea: builtArea ? parseFloat(builtArea) : null,
        floors: floors ? parseInt(floors) : null,
        propertyAge: propertyAge ? parseInt(propertyAge) : null,
        constructionYear: constructionYear ? parseInt(constructionYear) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        district: district?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        formattedAddress: formattedAddress || null,
        askingPrice: askingPrice ? parseFloat(askingPrice) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        parking: parking || null,
        constructionType: constructionType || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}

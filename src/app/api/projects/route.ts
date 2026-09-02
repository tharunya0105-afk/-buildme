import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/projects - List projects for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const projects = await db.project.findMany({
      where: role === "engineer" ? { engineerId: userId } : { homeownerId: userId },
      include: {
        _count: {
          select: {
            inspections: true,
            photos: true,
            alerts: true,
            issues: true,
          },
        },
        engineer: {
          select: { id: true, name: true, email: true },
        },
        homeowner: {
          select: { id: true, name: true, email: true },
        },
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 5,
          select: { inspectionDate: true, stage: true, notes: true },
        },
        timelineEvents: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, type: true, title: true, description: true, createdAt: true },
        },
        issues: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, severity: true, status: true, createdAt: true },
        },
        photos: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, fileUrl: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project (engineer only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;

    if (role !== "engineer") {
      return NextResponse.json(
        { error: "Only engineers can create projects" },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      name,
      address,
      city,
      district,
      state,
      pincode,
      latitude,
      longitude,
      formattedAddress,
      constructionType,
      builtArea,
      currentStage,
      progress,
      homeownerName,
      homeownerEmail,
      expectedCompletion,
      estimatedCost,
      engineerNotes,
    } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: "Site name is required" }, { status: 400 });
    }
    if (!address?.trim()) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }
    if (!homeownerName?.trim()) {
      return NextResponse.json({ error: "Homeowner name is required" }, { status: 400 });
    }
    if (!homeownerEmail?.trim()) {
      return NextResponse.json({ error: "Homeowner email is required" }, { status: 400 });
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    // Find or create homeowner user
    let homeownerId = null;
    if (homeownerEmail) {
      let homeowner = await db.user.findUnique({
        where: { email: homeownerEmail.toLowerCase().trim() },
      });

      if (!homeowner) {
        // Create a placeholder homeowner account (they'll set password on signup)
        const bcrypt = await import("bcryptjs");
        const tempPassword = await bcrypt.hash("SET_ON_SIGNUP_" + Date.now(), 12);
        homeowner = await db.user.create({
          data: {
            name: homeownerName.trim(),
            email: homeownerEmail.toLowerCase().trim(),
            passwordHash: tempPassword,
            role: "homeowner",
          },
        });
      }

      homeownerId = homeowner.id;
    }

    const project = await db.project.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        city: city?.trim() || null,
        district: district?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        formattedAddress: formattedAddress || null,
        constructionType: constructionType || null,
        builtArea: builtArea ? parseFloat(builtArea) : null,
        currentStage: currentStage || null,
        status: "normal",
        progress: progress || 0,
        engineerId: userId,
        homeownerId,
        homeownerName: homeownerName?.trim() || null,
        expectedCompletion: expectedCompletion ? new Date(expectedCompletion) : null,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        engineerNotes: engineerNotes?.trim() || null,
      },
    });

    // Create initial timeline event
    await db.timelineEvent.create({
      data: {
        projectId: project.id,
        type: "milestone",
        title: "Project Created",
        description: `Construction site "${name}" has been created. Stage: ${currentStage || "Planning"}.`,
      },
    });

    // Track product event
    await db.productEvent.create({
      data: { userId, projectId: project.id, eventType: "project_created", metadata: JSON.stringify({ name, city }) },
    }).catch(() => {}); // non-blocking

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

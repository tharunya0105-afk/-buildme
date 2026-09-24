/**
 * API: Structural Elements for a project
 *
 * GET  /api/projects/[id]/elements — list all elements with current stage status
 * POST /api/projects/[id]/elements — create a new element
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const userId = (session.user as { id?: string }).id;
  const userRole = (session.user as { role?: string }).role;

  // Verify access
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { engineerId: true, homeownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isEngineer = project.engineerId === userId;
  const isHomeowner = project.homeownerId === userId;

  if (!isEngineer && !isHomeowner && userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const elements = await db.structuralElement.findMany({
    where: { projectId },
    include: {
      stageRecords: {
        orderBy: { photoTimestamp: "desc" },
        take: 1,
        select: {
          photoTimestamp: true,
          stageLabel: true,
          probability: true,
          classifierSource: true,
        },
      },
      abstentionEvents: {
        where: { resolved: false },
        select: { id: true },
      },
      _count: {
        select: {
          stageRecords: true,
          photoTags: true,
        },
      },
    },
    orderBy: [{ elementType: "asc" }, { label: "asc" }],
  });

  return NextResponse.json({ elements });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const userId = (session.user as { id?: string }).id;

  // Only engineers can create elements
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { engineerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.engineerId !== userId) {
    return NextResponse.json({ error: "Forbidden — engineers only" }, { status: 403 });
  }

  const body = await request.json();
  const { elementType, label, floor, zone, notes } = body;

  if (!elementType || !label) {
    return NextResponse.json(
      { error: "elementType and label are required" },
      { status: 400 }
    );
  }

  const element = await db.structuralElement.create({
    data: {
      projectId,
      elementType,
      label,
      floor: floor ?? null,
      zone: zone ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ element }, { status: 201 });
}

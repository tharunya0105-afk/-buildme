/**
 * BuildMe Project Evidence API
 *
 * Manages evidence documents associated with tracked projects.
 * Evidence types: quotation, BOQ, estimate, invoice, final_bill, completion_doc, photo, other.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_EVIDENCE_TYPES = [
  "quotation", "boq", "estimate_document", "invoice",
  "final_bill", "completion_doc", "photo", "other",
];

const VALID_VERIFICATION = ["unverified", "user_confirmed", "independently_verified"];

// ─── GET ───────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: (session.user as any).id as string },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const evidences = await db.projectEvidence.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ evidences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: projectId } = await params;
    const body = await req.json();

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { evidenceType, documentName, description, fileUrl } = body;

    if (!evidenceType || !VALID_EVIDENCE_TYPES.includes(evidenceType)) {
      return NextResponse.json(
        { error: `Invalid evidence type. Must be: ${VALID_EVIDENCE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (!documentName || typeof documentName !== "string" || !documentName.trim()) {
      return NextResponse.json({ error: "Document name is required" }, { status: 400 });
    }

    const evidence = await db.projectEvidence.create({
      data: {
        projectId,
        createdById: userId,
        evidenceType,
        documentName: documentName.trim(),
        description: description || null,
        fileUrl: fileUrl || null,
        verificationStatus: "unverified",
      },
    });

    return NextResponse.json({ success: true, evidence });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PATCH ─────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { id: projectId } = await params;
    const body = await req.json();
    const { evidenceId, verificationStatus } = body;

    if (!evidenceId) return NextResponse.json({ error: "evidenceId required" }, { status: 400 });

    const project = await db.project.findFirst({
      where: { id: projectId, engineerId: userId },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await db.projectEvidence.findFirst({
      where: { id: evidenceId, projectId },
    });
    if (!existing) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });

    if (verificationStatus && !VALID_VERIFICATION.includes(verificationStatus)) {
      return NextResponse.json(
        { error: `Invalid verification status. Must be: ${VALID_VERIFICATION.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await db.projectEvidence.update({
      where: { id: evidenceId },
      data: verificationStatus ? { verificationStatus } : {},
    });

    return NextResponse.json({ success: true, evidence: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

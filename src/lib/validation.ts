import { z } from "zod";

// ─── Shared primitives ───────────────────────────────────────────────────────

export const cuid = z.string().min(1, "ID is required");

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["engineer", "homeowner", "buyer"]).default("engineer"),
});

// ─── Projects ────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  constructionType: z.enum(["house", "villa", "apartment", "renovation"]).optional(),
  builtArea: z.number().positive().optional(),
  homeownerId: z.string().optional(),
  homeownerName: z.string().optional(),
  currentStage: z.enum(["planning", "foundation", "structure", "brickwork", "roofing", "electrical_plumbing", "finishing", "completed"]).optional(),
  estimatedCost: z.number().positive().optional(),
  engineerNotes: z.string().max(2000).optional(),
  expectedCompletion: z.string().datetime({ offset: true }).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["normal", "attention", "review"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

// ─── Issues ─────────────────────────────────────────────────────────────────

export const createIssueSchema = z.object({
  projectId: cuid,
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(["structural", "water", "electrical", "plumbing", "material", "workmanship", "delay", "cost", "other"]).default("other"),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export const updateIssueSchema = z.object({
  status: z.enum(["open", "under_review", "resolved", "dismissed"]).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  note: z.string().max(1000).optional(),
});

// ─── Inspections ─────────────────────────────────────────────────────────────

export const createInspectionSchema = z.object({
  projectId: cuid,
  stage: z.string().optional(),
  notes: z.string().max(2000).optional(),
  inspectionDate: z.string().datetime({ offset: true }).optional(),
});

// ─── Workers ─────────────────────────────────────────────────────────────────

export const createWorkerSchema = z.object({
  projectId: cuid,
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().max(20).optional(),
  workerType: z.enum(["mason", "electrician", "plumber", "carpenter", "helper", "other"]).optional(),
});

export const workerCheckInSchema = z.object({
  workerId: cuid,
  projectId: cuid,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

// ─── Cost Estimates ──────────────────────────────────────────────────────────

export const createCostEstimateSchema = z.object({
  projectId: cuid,
  builtArea: z.number().positive("Built area must be positive"),
  floors: z.number().int().min(1).max(20).optional(),
  constructionType: z.string().optional(),
  qualityLevel: z.enum(["economy", "standard", "premium"]),
  district: z.string().optional(),
  state: z.string().optional(),
});

// ─── Homeowner concern ───────────────────────────────────────────────────────

export const createConcernSchema = z.object({
  projectId: cuid,
  title: z.string().min(1, "Concern title is required").max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(["structural", "water", "electrical", "plumbing", "material", "workmanship", "delay", "cost", "other"]).default("other"),
  severity: z.enum(["low", "medium", "high"]).default("medium"),
});

// ─── Alerts ──────────────────────────────────────────────────────────────────

export const createAlertSchema = z.object({
  projectId: cuid,
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

// ─── Helper: parse or return 400 ─────────────────────────────────────────────

import { NextResponse } from "next/server";

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Validation error", details: result.error.flatten().fieldErrors },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }
  return { success: false, data: null, errors: result.error.issues };
}

export const createCheckinSchema = workerCheckInSchema;

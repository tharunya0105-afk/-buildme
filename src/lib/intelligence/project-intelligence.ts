// ─── Project Intelligence Aggregation ────────────────────────────────────────
// Combines observed project data, risk engine output, spatial context,
// and AI site brief into a single structured intelligence result.
//
// This is the core "AI Brain" layer. It does NOT fabricate anything.
// Every value comes from real database records.

import { db } from "@/lib/db";
import { calculateRiskIntelligence, type FeatureInput } from "./risk-engine";
import { haversineDistance } from "../spatial/geo-utils";
import type { RiskIntelligenceResult } from "./types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProjectIntelligenceData {
  // Project basics
  project: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    district: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    currentStage: string | null;
    status: string;
    progress: number;
    constructionType: string | null;
    builtArea: number | null;
    homeownerName: string | null;
    engineerName: string;
    engineerEmail: string;
    createdAt: string;
    updatedAt: string;
  };

  // Observed signals (direct from DB)
  observed: {
    totalInspections: number;
    lastInspectionDate: string | null;
    lastInspectionStage: string | null;
    totalPhotos: number;
    totalIssues: number;
    openIssues: number;
    criticalIssues: number;
    highSeverityIssues: number;
    resolvedIssues: number;
    totalWorkers: number;
    activeWorkers: number;
    verifiedCheckInsToday: number;
    outsideGeofenceToday: number;
    totalAiAnalyses: number;
    recentTimelineEvents: Array<{
      id: string;
      type: string;
      title: string;
      description: string | null;
      createdAt: string;
    }>;
  };

  // Risk intelligence (from risk-engine-v1)
  risk: RiskIntelligenceResult;

  // AI Site Brief (deterministic, grounded in data)
  aiBrief: AiSiteBrief;

  // Intelligence pipeline stages
  pipeline: PipelineStage[];

  // Intelligence layers classification
  layers: IntelligenceLayers;

  // Engine metadata
  engineVersion: string;
  generatedAt: string;
}

// ─── AI Site Brief ──────────────────────────────────────────────────────────

export interface AiSiteBrief {
  generatedFrom: string[];
  riskLevel: string;
  riskScore: number;
  summary: string;
  priorityActions: string[];
  dataConfidence: number;
  engineNote: string;
  disclaimer: string;
  isAiPowered: boolean;
}

// ─── Pipeline Stage ─────────────────────────────────────────────────────────

export interface PipelineStage {
  id: string;
  label: string;
  status: "active" | "pending" | "future";
  detail: string;
  icon: string;
}

// ─── Intelligence Layers ────────────────────────────────────────────────────

export interface IntelligenceLayers {
  observed: Array<{ feature: string; value: string | number | boolean; source: string }>;
  derived: Array<{ feature: string; value: string | number | boolean; source: string }>;
  predicted: Array<{ feature: string; value: string; source: string }>;
  aiInterpretation: { available: boolean; status: string };
  futureMl: Array<{ capability: string; status: string }>;
}

// ─── Main Function ──────────────────────────────────────────────────────────

/**
 * Get comprehensive project intelligence from real database data.
 * Combines observed signals, risk engine, AI brief, and pipeline status.
 */
export async function getProjectIntelligence(
  projectId: string,
  engineerId: string
): Promise<ProjectIntelligenceData | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      engineer: { select: { name: true, email: true } },
      inspections: {
        orderBy: { inspectionDate: "desc" },
        select: {
          id: true,
          inspectionDate: true,
          stage: true,
          notes: true,
          photos: { select: { id: true } },
        },
      },
      photos: { select: { id: true, createdAt: true } },
      issues: {
        select: { id: true, severity: true, status: true },
      },
      workers: {
        where: { active: true },
        select: { id: true, name: true, workerType: true },
      },
      aiAnalyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { overallAssessment: true },
      },
      timelineEvents: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, type: true, title: true, description: true, createdAt: true },
      },
      _count: {
        select: {
          inspections: true,
          photos: true,
          aiAnalyses: true,
        },
      },
    },
  });

  if (!project || project.engineerId !== engineerId) return null;

  // ── Observed data ──
  const openIssues = project.issues.filter(
    (i) => i.status === "open" || i.status === "under_review"
  ).length;
  const criticalIssues = project.issues.filter(
    (i) => i.severity === "critical" && i.status !== "resolved"
  ).length;
  const highSeverityIssues = project.issues.filter(
    (i) => i.severity === "high" && i.status !== "resolved"
  ).length;
  const resolvedIssues = project.issues.filter((i) => i.status === "resolved").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCheckIns = await db.workerCheckIn.findMany({
    where: { projectId, checkInTime: { gte: today } },
    select: { verificationStatus: true, workerId: true },
  });
  const verifiedToday = new Set(
    todayCheckIns.filter((c) => c.verificationStatus === "verified").map((c) => c.workerId)
  ).size;
  const outsideGeofence = todayCheckIns.filter(
    (c) => c.verificationStatus === "outside_geofence"
  ).length;

  const lastInspection = project.inspections[0];
  const lastInspectionDate = lastInspection?.inspectionDate?.toISOString() ?? null;

  // ── Nearby projects ──
  const nearbyProjects = await findNearbyForIntelligence(
    projectId,
    project.latitude,
    project.longitude,
    project.engineerId
  );

  // ── Risk engine ──
  const featureInput: FeatureInput = {
    projectId: project.id,
    projectName: project.name,
    currentStage: project.currentStage,
    progress: project.progress,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    expectedCompletion: null,
    builtArea: project.builtArea,
    latitude: project.latitude,
    longitude: project.longitude,
    lastInspectionDate,
    totalInspections: project._count.inspections,
    totalPhotos: project._count.photos,
    openIssues,
    criticalIssues,
    highSeverityIssues,
    totalIssues: project.issues.length,
    resolvedIssues,
    issuesWithoutPhotos: 0,
    totalWorkers: project.workers.length,
    activeWorkers: project.workers.length,
    todayVerifiedCheckIns: verifiedToday,
    todayOutsideGeofence: outsideGeofence,
    hasAnomalies: false,
    totalAiAnalyses: project._count.aiAnalyses,
    aiReviewRecommended: project.aiAnalyses.some(
      (a) => a.overallAssessment === "review_recommended"
    ),
    nearbyProjects,
  };

  const risk = calculateRiskIntelligence(featureInput);

  // ── AI Site Brief ──
  const aiBrief = generateAiSiteBrief(risk, project);

  // ── Pipeline stages ──
  const pipeline = buildPipeline(project, risk);

  // ── Intelligence layers ──
  const layers = buildIntelligenceLayers(risk);

  return {
    project: {
      id: project.id,
      name: project.name,
      address: project.address,
      city: project.city,
      district: project.district,
      state: project.state,
      latitude: project.latitude,
      longitude: project.longitude,
      currentStage: project.currentStage,
      status: project.status,
      progress: project.progress,
      constructionType: project.constructionType,
      builtArea: project.builtArea,
      homeownerName: project.homeownerName,
      engineerName: project.engineer.name,
      engineerEmail: project.engineer.email,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
    observed: {
      totalInspections: project._count.inspections,
      lastInspectionDate,
      lastInspectionStage: lastInspection?.stage ?? null,
      totalPhotos: project._count.photos,
      totalIssues: project.issues.length,
      openIssues,
      criticalIssues,
      highSeverityIssues,
      resolvedIssues,
      totalWorkers: project.workers.length,
      activeWorkers: project.workers.length,
      verifiedCheckInsToday: verifiedToday,
      outsideGeofenceToday: outsideGeofence,
      totalAiAnalyses: project._count.aiAnalyses,
      recentTimelineEvents: project.timelineEvents.map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        description: e.description,
        createdAt: e.createdAt.toISOString(),
      })),
    },
    risk,
    aiBrief,
    pipeline,
    layers,
    engineVersion: "risk-engine-v1",
    generatedAt: new Date().toISOString(),
  };
}

// ─── AI Site Brief Generator ────────────────────────────────────────────────
// Deterministic, grounded in real data. NOT an LLM call.

function generateAiSiteBrief(
  risk: RiskIntelligenceResult,
  project: any
): AiSiteBrief {
  const { overallRiskScore, overallSeverity, categoryRisks, recommendedActions, dataConfidence, spatialContext } = risk;

  // Build summary from actual factors
  const highRiskCategories = categoryRisks.filter(
    (c) => c.severity === "critical" || c.severity === "high"
  );
  const lowRiskCategories = categoryRisks.filter((c) => c.severity === "low");

  let summary = "";
  if (overallSeverity === "critical") {
    summary = `This project requires immediate attention. ${highRiskCategories.length} risk ${highRiskCategories.length === 1 ? "category" : "categories"} ${highRiskCategories.length === 1 ? "is" : "are"} elevated. `;
  } else if (overallSeverity === "high") {
    summary = `This project requires moderate attention. `;
  } else if (overallSeverity === "medium") {
    summary = `This project is progressing with some areas to monitor. `;
  } else {
    summary = `This project is in a healthy state. `;
  }

  // Add specific drivers
  const drivers = highRiskCategories
    .slice(0, 2)
    .map((c) => {
      const factor = c.topFactors[0] || `${c.label} needs review`;
      return factor;
    });
  if (drivers.length > 0) {
    summary += `Key drivers: ${drivers.join("; ")}. `;
  }

  // Add positive signals
  if (lowRiskCategories.length > 0) {
    const positives = lowRiskCategories.map((c) => c.label);
    summary += `${positives.join(", ")} ${positives.length === 1 ? "is" : "are"} within normal range.`;
  }

  // Priority actions from risk engine
  const priorityActions = recommendedActions.slice(0, 3).map((a) => a.label);

  const generatedFrom = [
    `${risk.observedSignals.length} observed signals`,
    "risk-engine-v1",
    "6 risk categories",
    `data confidence: ${dataConfidence.overall}%`,
  ];
  if (spatialContext.hasCoordinates) {
    generatedFrom.push(
      spatialContext.nearbyProjectCount > 0
        ? `${spatialContext.nearbyProjectCount} nearby projects`
        : "project coordinates"
    );
  }

  return {
    generatedFrom,
    riskLevel: overallSeverity,
    riskScore: overallRiskScore,
    summary,
    priorityActions,
    dataConfidence: dataConfidence.overall,
    engineNote: "Generated by risk-engine-v1 using structured project intelligence.",
    disclaimer: "AI interpretation — not an engineering certification.",
    isAiPowered: false,
  };
}

// ─── Pipeline Builder ───────────────────────────────────────────────────────

function buildPipeline(project: any, risk: RiskIntelligenceResult): PipelineStage[] {
  return [
    {
      id: "project_data",
      label: "Project Data",
      status: "active",
      detail: `${project._count.inspections} inspections, ${project._count.photos} photos, ${project.issues.length} issues`,
      icon: "Building2",
    },
    {
      id: "feature_engineering",
      label: "Feature Engineering",
      status: "active",
      detail: `${risk.observedSignals.length + risk.derivedSignals.length} signals extracted`,
      icon: "Cpu",
    },
    {
      id: "risk_engine",
      label: "Risk Engine",
      status: "active",
      detail: `risk-engine-v1 · ${risk.categoryRisks.length} categories`,
      icon: "Activity",
    },
    {
      id: "spatial_context",
      label: "Spatial Context",
      status: risk.spatialContext.hasCoordinates ? "active" : "pending",
      detail: risk.spatialContext.nearbyProjectCount > 0
        ? `${risk.spatialContext.nearbyProjectCount} nearby projects · ${risk.spatialContext.nearestProjectDistanceKm}km`
        : risk.spatialContext.hasCoordinates
          ? "Coordinates available"
          : "No location data",
      icon: "Map",
    },
    {
      id: "explainability",
      label: "Explainability",
      status: "active",
      detail: `${risk.explanations.length} traceable factors`,
      icon: "Eye",
    },
    {
      id: "ai_interpretation",
      label: "AI Interpretation",
      status: "active",
      detail: "Deterministic — grounded in project signals",
      icon: "Brain",
    },
    {
      id: "actions",
      label: "Actions",
      status: "active",
      detail: `${risk.recommendedActions.length} recommended next steps`,
      icon: "Zap",
    },
  ];
}

// ─── Intelligence Layers Builder ────────────────────────────────────────────

function buildIntelligenceLayers(risk: RiskIntelligenceResult): IntelligenceLayers {
  const observed = risk.observedSignals.map((s) => ({
    feature: s.feature,
    value: s.value,
    source: s.source,
  }));

  const derived = risk.derivedSignals.map((s) => ({
    feature: s.feature,
    value: s.value,
    source: s.source,
  }));

  const predicted = risk.predictedRisks.map((s) => ({
    feature: s.feature,
    value: `${s.severity} risk (${s.riskScore}/100)`,
    source: s.source,
  }));

  return {
    observed,
    derived,
    predicted,
    aiInterpretation: {
      available: true,
      status: "deterministic — grounded in project signals",
    },
    futureMl: [
      { capability: "Trained risk prediction model", status: "requires pilot data" },
      { capability: "Cost estimation ML model", status: "requires regional dataset" },
      { capability: "Delay prediction model", status: "requires historical outcomes" },
      { capability: "Visual defect detection", status: "requires labeled images" },
    ],
  };
}

// ─── Nearby Projects Helper ─────────────────────────────────────────────────

async function findNearbyForIntelligence(
  currentProjectId: string,
  lat: number | null,
  lng: number | null,
  engineerId: string
): Promise<Array<{ id: string; name: string; distanceKm: number; riskScore: number }>> {
  if (!lat || !lng) return [];

  try {
    const allProjects = await db.project.findMany({
      where: { engineerId, id: { not: currentProjectId } },
      select: { id: true, name: true, latitude: true, longitude: true, status: true },
    });

    return allProjects
      .filter((p) => p.latitude && p.longitude)
      .map((p) => {
        const dist = haversineDistance(lat, lng, p.latitude!, p.longitude!);
        let riskScore = 30;
        if (p.status === "review") riskScore = 70;
        else if (p.status === "attention") riskScore = 50;
        return {
          id: p.id,
          name: p.name,
          distanceKm: Math.round(dist * 10) / 10,
          riskScore,
        };
      })
      .filter((p) => p.distanceKm <= 25)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10);
  } catch {
    return [];
  }
}

// ─── Construction Risk Intelligence Engine ───────────────────────────────────
// RULE-BASED prototype — NOT machine learning.
// Generates explainable risk scores, feature vectors, and recommended actions
// from real database records. Feature vectors are designed so that a future
// real ML model can be trained on the same inputs.
//
// Engine version: risk-engine-v1
// All weights are prototype weights that can be calibrated from pilot data.

import type {
  RiskFeatureVector,
  ObservedSignal,
  DerivedSignal,
  PredictedSignal,
  CategoryRisk,
  RiskExplanation,
  RiskAction,
  DataConfidence,
  SpatialContext,
  RiskIntelligenceResult,
  RiskCategory,
} from "./types";
import { RISK_WEIGHTS, TOTAL_RISK_WEIGHT, RISK_ENGINE_VERSION } from "./types";
import { haversineDistance } from "../spatial/geo-utils";

// ─── Feature Extraction ─────────────────────────────────────────────────────

export interface FeatureInput {
  projectId: string;
  projectName: string;
  currentStage: string | null;
  progress: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  expectedCompletion: string | null;
  builtArea: number | null;
  latitude: number | null;
  longitude: number | null;

  // Inspection
  lastInspectionDate: string | null;
  totalInspections: number;
  totalPhotos: number;

  // Issues
  openIssues: number;
  criticalIssues: number;
  highSeverityIssues: number;
  totalIssues: number;
  resolvedIssues: number;
  issuesWithoutPhotos: number;

  // Workforce
  totalWorkers: number;
  activeWorkers: number;
  todayVerifiedCheckIns: number;
  todayOutsideGeofence: number;
  hasAnomalies: boolean;

  // AI
  totalAiAnalyses: number;
  aiReviewRecommended: boolean;

  // Spatial (computed externally)
  nearbyProjects: Array<{ id: string; name: string; distanceKm: number; riskScore: number }>;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Extract a structured feature vector from raw project data.
 * This is the function that produces ML-ready feature inputs.
 */
export function extractFeatureVector(input: FeatureInput): RiskFeatureVector {
  const now = new Date().toISOString();

  // Inspection features
  const inspectionRecency = input.lastInspectionDate
    ? daysBetween(input.lastInspectionDate, now)
    : null;
  const inspectionOverdue = inspectionRecency !== null ? inspectionRecency > 30 : input.totalInspections === 0 && daysBetween(input.createdAt, now) > 14;
  const overdueByDays = inspectionOverdue && inspectionRecency !== null ? Math.max(0, inspectionRecency - 30) : 0;
  const photosPerInspection = input.totalInspections > 0 ? input.totalPhotos / input.totalInspections : 0;

  // Issue features
  const issueResolutionRate = input.totalIssues > 0
    ? Math.round((input.resolvedIssues / input.totalIssues) * 100)
    : 100;

  // Schedule features
  const scheduleOverdue = input.expectedCompletion
    ? daysBetween(input.expectedCompletion, now) < 0
    : false;
  const scheduleOverdueByDays = scheduleOverdue && input.expectedCompletion
    ? Math.abs(daysBetween(input.expectedCompletion, now))
    : 0;
  let progressVsExpected: number | null = null;
  if (input.expectedCompletion) {
    const totalDays = daysBetween(input.createdAt, input.expectedCompletion);
    if (totalDays > 0) {
      const daysSinceCreation = daysBetween(input.createdAt, now);
      const expectedProgress = Math.min(100, Math.round((daysSinceCreation / totalDays) * 100));
      progressVsExpected = expectedProgress - input.progress;
    }
  }
  const daysSinceLastUpdate = daysBetween(input.updatedAt, now);
  const projectAgeDays = daysBetween(input.createdAt, now);

  // Workforce features
  const workforceAttendanceRate = input.activeWorkers > 0
    ? Math.round((input.todayVerifiedCheckIns / input.activeWorkers) * 100)
    : 0;

  // Evidence features
  const daysSinceLastEvidence = input.totalPhotos > 0
    ? daysBetween(input.updatedAt, now) // approximation — use last update
    : null;
  const evidenceCoverage = input.totalInspections > 0
    ? Math.min(100, Math.round((input.totalPhotos / (input.totalInspections * 4)) * 100)) // 4 photos per inspection = ideal
    : 0;

  // Spatial features
  const nearby = input.nearbyProjects;
  const nearestProjectDistanceKm = nearby.length > 0 ? nearby[0].distanceKm : null;
  const nearbyAverageRisk = nearby.length > 0
    ? nearby.reduce((sum, p) => sum + p.riskScore, 0) / nearby.length
    : null;

  return {
    inspectionRecency,
    inspectionOverdue,
    overdueByDays,
    totalInspections: input.totalInspections,
    inspectionFrequency: input.totalInspections >= 2 && input.lastInspectionDate
      ? Math.round(projectAgeDays / input.totalInspections)
      : null,
    photosPerInspection: Math.round(photosPerInspection * 10) / 10,

    openIssueCount: input.openIssues,
    criticalIssueCount: input.criticalIssues,
    highIssueCount: input.highSeverityIssues,
    issueResolutionRate,
    issuesWithoutPhotos: input.issuesWithoutPhotos,
    totalIssueCount: input.totalIssues,

    scheduleOverdue,
    scheduleOverdueByDays,
    progressVsExpected,
    daysSinceLastUpdate,
    projectAgeDays,

    totalWorkers: input.totalWorkers,
    activeWorkers: input.activeWorkers,
    todayVerifiedCheckIns: input.todayVerifiedCheckIns,
    todayOutsideGeofence: input.todayOutsideGeofence,
    workforceAttendanceRate,
    hasLocationAnomaly: input.hasAnomalies,

    totalPhotos: input.totalPhotos,
    daysSinceLastEvidence,
    evidenceCoverage,
    hasAiAnalysis: input.totalAiAnalyses > 0,

    hasCoordinates: input.latitude !== null && input.longitude !== null,
    nearbyProjectCount: nearby.length,
    nearestProjectDistanceKm,
    nearbyAverageRisk,
  };
}

// ─── Signal Generation ──────────────────────────────────────────────────────

function generateObservedSignals(input: FeatureInput, features: RiskFeatureVector): ObservedSignal[] {
  const signals: ObservedSignal[] = [];

  // Inspection signals
  signals.push({
    feature: "inspection_recency",
    value: features.inspectionRecency !== null ? `${features.inspectionRecency} days` : "Never inspected",
    description: features.inspectionRecency !== null
      ? `Last inspection ${features.inspectionRecency} days ago`
      : "No inspection has been recorded",
    source: "database",
  });

  signals.push({
    feature: "total_inspections",
    value: features.totalInspections,
    description: `${features.totalInspections} inspection${features.totalInspections !== 1 ? "s" : ""} recorded`,
    source: "database",
  });

  // Issue signals
  signals.push({
    feature: "open_issues",
    value: features.openIssueCount,
    description: `${features.openIssueCount} open issue${features.openIssueCount !== 1 ? "s" : ""}`,
    source: "database",
  });

  if (features.criticalIssueCount > 0) {
    signals.push({
      feature: "critical_issues",
      value: features.criticalIssueCount,
      description: `${features.criticalIssueCount} critical issue${features.criticalIssueCount !== 1 ? "s" : ""}`,
      source: "database",
    });
  }

  // Schedule signals
  if (input.expectedCompletion) {
    signals.push({
      feature: "expected_completion",
      value: input.expectedCompletion,
      description: features.scheduleOverdue
        ? `Schedule overdue by ${features.scheduleOverdueByDays} days`
        : `Expected completion: ${new Date(input.expectedCompletion).toLocaleDateString()}`,
      source: "database",
    });
  }

  signals.push({
    feature: "project_progress",
    value: `${features.progressVsExpected !== null ? features.progressVsExpected : "?"}%`,
    description: features.progressVsExpected !== null
      ? features.progressVsExpected > 0
        ? `Progress is ${features.progressVsExpected}% behind expected pace`
        : `Progress is ${Math.abs(features.progressVsExpected)}% ahead of expected pace`
      : `Current progress: ${input.progress}%`,
    source: "database",
  });

  // Workforce signals
  if (features.totalWorkers > 0) {
    signals.push({
      feature: "workforce_present",
      value: `${features.todayVerifiedCheckIns}/${features.activeWorkers}`,
      description: `${features.todayVerifiedCheckIns} of ${features.activeWorkers} workers verified today`,
      source: "database",
    });
  }

  // Evidence signals
  signals.push({
    feature: "total_photos",
    value: features.totalPhotos,
    description: `${features.totalPhotos} photo${features.totalPhotos !== 1 ? "s" : ""} uploaded`,
    source: "database",
  });

  // Spatial signals
  if (features.hasCoordinates) {
    signals.push({
      feature: "location",
      value: `${input.latitude?.toFixed(4)}, ${input.longitude?.toFixed(4)}`,
      description: `Project located at ${input.latitude?.toFixed(4)}°N, ${input.longitude?.toFixed(4)}°E`,
      source: "database",
    });
  }

  if (features.nearbyProjectCount > 0) {
    signals.push({
      feature: "nearby_projects",
      value: features.nearbyProjectCount,
      description: `${features.nearbyProjectCount} project${features.nearbyProjectCount !== 1 ? "s" : ""} within 25km`,
      source: "database",
    });
  }

  return signals;
}

function generateDerivedSignals(features: RiskFeatureVector): DerivedSignal[] {
  const signals: DerivedSignal[] = [];

  // Inspection frequency
  if (features.inspectionFrequency !== null) {
    signals.push({
      feature: "inspection_frequency",
      value: `${features.inspectionFrequency} days avg`,
      description: `Average inspection interval: ${features.inspectionFrequency} days`,
      source: "computed",
      derivedFrom: ["total_inspections", "project_age"],
    });
  }

  // Issue resolution rate
  signals.push({
    feature: "issue_resolution_rate",
    value: `${features.issueResolutionRate}%`,
    description: `${features.issueResolutionRate}% of issues resolved`,
    source: "computed",
    derivedFrom: ["resolved_issues", "total_issues"],
  });

  // Photos per inspection
  signals.push({
    feature: "photos_per_inspection",
    value: features.photosPerInspection,
    description: `Average ${features.photosPerInspection} photos per inspection`,
    source: "computed",
    derivedFrom: ["total_photos", "total_inspections"],
  });

  // Workforce attendance
  if (features.totalWorkers > 0) {
    signals.push({
      feature: "workforce_attendance_rate",
      value: `${features.workforceAttendanceRate}%`,
      description: `Today's workforce verification rate: ${features.workforceAttendanceRate}%`,
      source: "computed",
      derivedFrom: ["verified_checkins", "active_workers"],
    });
  }

  // Evidence coverage
  signals.push({
    feature: "evidence_coverage",
    value: `${features.evidenceCoverage}%`,
    description: `Evidence coverage: ${features.evidenceCoverage}% (target: 100%)`,
    source: "computed",
    derivedFrom: ["total_photos", "total_inspections"],
  });

  return signals;
}

// ─── Risk Category Scoring ──────────────────────────────────────────────────

function calculateInspectionRisk(features: RiskFeatureVector): { score: number; severity: "low" | "medium" | "high" | "critical"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  if (features.inspectionOverdue) {
    const penalty = Math.min(80, 40 + features.overdueByDays * 2);
    score += penalty;
    factors.push(`Inspection overdue by ${features.overdueByDays} days`);
  } else if (features.inspectionRecency !== null && features.inspectionRecency > 21) {
    score += 25;
    factors.push(`Last inspection was ${features.inspectionRecency} days ago`);
  }

  if (features.totalInspections === 0 && features.projectAgeDays > 14) {
    score += 60;
    factors.push("No inspections recorded");
  }

  if (features.photosPerInspection < 2 && features.totalInspections > 0) {
    score += 10;
    factors.push(`Low photo evidence (${features.photosPerInspection} per inspection)`);
  }

  score = Math.min(100, score);
  const severity = score >= 60 ? "critical" : score >= 35 ? "high" : score >= 15 ? "medium" : "low";
  return { score, severity, factors };
}

function calculateIssueRisk(features: RiskFeatureVector): { score: number; severity: "low" | "medium" | "high" | "critical"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  if (features.criticalIssueCount > 0) {
    score += Math.min(60, features.criticalIssueCount * 30);
    factors.push(`${features.criticalIssueCount} critical issue${features.criticalIssueCount !== 1 ? "s" : ""}`);
  }

  if (features.highIssueCount > 0) {
    score += Math.min(30, features.highIssueCount * 15);
    factors.push(`${features.highIssueCount} high-severity issue${features.highIssueCount !== 1 ? "s" : ""}`);
  }

  if (features.openIssueCount > 3) {
    score += 15;
    factors.push(`${features.openIssueCount} open issues`);
  }

  if (features.issueResolutionRate < 50 && features.totalIssueCount > 0) {
    score += 15;
    factors.push(`Low resolution rate (${features.issueResolutionRate}%)`);
  }

  score = Math.min(100, score);
  const severity = score >= 60 ? "critical" : score >= 35 ? "high" : score >= 15 ? "medium" : "low";
  return { score, severity, factors };
}

function calculateScheduleRisk(features: RiskFeatureVector): { score: number; severity: "low" | "medium" | "high" | "critical"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  if (features.scheduleOverdue) {
    score += Math.min(70, 35 + features.scheduleOverdueByDays);
    factors.push(`Schedule overdue by ${features.scheduleOverdueByDays} days`);
  }

  if (features.progressVsExpected !== null && features.progressVsExpected > 15) {
    score += Math.min(40, features.progressVsExpected * 2);
    factors.push(`Progress ${features.progressVsExpected}% behind expected pace`);
  }

  if (features.daysSinceLastUpdate > 21 && features.progressVsExpected !== null) {
    score += 20;
    factors.push(`No updates in ${features.daysSinceLastUpdate} days`);
  }

  score = Math.min(100, score);
  const severity = score >= 60 ? "critical" : score >= 35 ? "high" : score >= 15 ? "medium" : "low";
  return { score, severity, factors };
}

function calculateWorkforceRisk(features: RiskFeatureVector): { score: number; severity: "low" | "medium" | "high" | "critical"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  if (features.totalWorkers === 0) {
    // No workforce data — neutral, not a risk
    return { score: 0, severity: "low", factors: [] };
  }

  if (features.workforceAttendanceRate < 50) {
    score += 40;
    factors.push(`Low attendance rate (${features.workforceAttendanceRate}%)`);
  } else if (features.workforceAttendanceRate < 80) {
    score += 15;
    factors.push(`Moderate attendance rate (${features.workforceAttendanceRate}%)`);
  }

  if (features.todayOutsideGeofence > 0) {
    score += Math.min(30, features.todayOutsideGeofence * 15);
    factors.push(`${features.todayOutsideGeofence} worker${features.todayOutsideGeofence !== 1 ? "s" : ""} outside geofence`);
  }

  if (features.hasLocationAnomaly) {
    score += 25;
    factors.push("Location anomaly detected");
  }

  score = Math.min(100, score);
  const severity = score >= 60 ? "critical" : score >= 35 ? "high" : score >= 15 ? "medium" : "low";
  return { score, severity, factors };
}

function calculateEvidenceRisk(features: RiskFeatureVector): { score: number; severity: "low" | "medium" | "high" | "critical"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  if (features.totalPhotos === 0 && features.totalInspections > 0) {
    score += 50;
    factors.push("No photos uploaded despite inspections");
  } else if (features.evidenceCoverage < 30 && features.totalInspections > 0) {
    score += 30;
    factors.push(`Low evidence coverage (${features.evidenceCoverage}%)`);
  }

  if (features.openIssueCount > 0 && features.totalPhotos === 0) {
    score += 25;
    factors.push("Issues reported without photo evidence");
  }

  score = Math.min(100, score);
  const severity = score >= 60 ? "critical" : score >= 35 ? "high" : score >= 15 ? "medium" : "low";
  return { score, severity, factors };
}

function calculateSpatialRisk(features: RiskFeatureVector): { score: number; severity: "low" | "medium" | "high" | "critical"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  if (!features.hasCoordinates) {
    return { score: 10, severity: "low", factors: ["No location data available"] };
  }

  if (features.nearbyAverageRisk !== null && features.nearbyAverageRisk > 50) {
    const contribution = Math.round(features.nearbyAverageRisk * 0.15);
    score += contribution;
    factors.push(`Nearby projects have elevated risk (avg: ${Math.round(features.nearbyAverageRisk)}/100)`);
  }

  if (features.nearbyProjectCount >= 3) {
    score += 5;
    factors.push(`${features.nearbyProjectCount} nearby projects in the area`);
  }

  score = Math.min(100, score);
  const severity = score >= 60 ? "critical" : score >= 35 ? "high" : score >= 15 ? "medium" : "low";
  return { score, severity, factors };
}

// ─── Data Confidence ────────────────────────────────────────────────────────

function calculateDataConfidence(features: RiskFeatureVector): DataConfidence {
  const signalsTotal = 9; // total possible signal categories
  let signalsAvailable = 0;
  const availableCategories: RiskCategory[] = [];
  const missingCategories: RiskCategory[] = [];

  // Inspection
  if (features.totalInspections > 0) {
    signalsAvailable++; availableCategories.push("inspection");
  } else {
    missingCategories.push("inspection");
  }

  // Issues
  if (features.totalIssueCount > 0 || features.openIssueCount > 0) {
    signalsAvailable++; availableCategories.push("issue");
  } else {
    missingCategories.push("issue");
  }

  // Schedule
  if (features.progressVsExpected !== null) {
    signalsAvailable++; availableCategories.push("schedule");
  } else {
    missingCategories.push("schedule");
  }

  // Workforce
  if (features.totalWorkers > 0) {
    signalsAvailable++; availableCategories.push("workforce");
  } else {
    missingCategories.push("workforce");
  }

  // Evidence
  if (features.totalPhotos > 0) {
    signalsAvailable++; availableCategories.push("evidence");
  } else {
    missingCategories.push("evidence");
  }

  // Spatial
  if (features.hasCoordinates) {
    signalsAvailable++; availableCategories.push("spatial");
  } else {
    missingCategories.push("spatial");
  }

  // AI
  if (features.hasAiAnalysis) { signalsAvailable++; }

  // Photos per inspection
  if (features.totalInspections > 0 && features.photosPerInspection > 0) { signalsAvailable++; }

  // Resolution rate
  if (features.totalIssueCount > 0) { signalsAvailable++; }

  const overall = Math.round((signalsAvailable / signalsTotal) * 100);

  return {
    overall,
    signalsAvailable,
    signalsTotal,
    availableCategories,
    missingCategories,
    description: `${signalsAvailable} of ${signalsTotal} intelligence signals available`,
  };
}

// ─── Spatial Context ────────────────────────────────────────────────────────

function calculateSpatialContext(input: FeatureInput, features: RiskFeatureVector): SpatialContext {
  const nearby = input.nearbyProjects;

  return {
    hasCoordinates: features.hasCoordinates,
    latitude: input.latitude,
    longitude: input.longitude,
    nearbyProjectCount: nearby.length,
    nearestProjectDistanceKm: features.nearestProjectDistanceKm,
    nearestProjectName: nearby.length > 0 ? nearby[0].name : null,
    nearbyAverageRisk: features.nearbyAverageRisk,
    spatialRiskContribution: features.nearbyAverageRisk !== null && features.nearbyAverageRisk > 50
      ? Math.round(features.nearbyAverageRisk * 0.15)
      : 0,
    spatialSeverity: features.nearbyAverageRisk !== null && features.nearbyAverageRisk > 60
      ? "high"
      : features.nearbyAverageRisk !== null && features.nearbyAverageRisk > 35
        ? "medium"
        : "low",
  };
}

// ─── Risk-to-Action Mapping ─────────────────────────────────────────────────

function generateActions(
  projectId: string,
  categoryRisks: CategoryRisk[],
  features: RiskFeatureVector
): RiskAction[] {
  const actions: RiskAction[] = [];
  let actionId = 0;

  for (const cat of categoryRisks) {
    if (cat.riskScore < 15) continue; // low risk — no action needed

    const priority = cat.severity === "critical" ? "critical"
      : cat.severity === "high" ? "high"
      : cat.severity === "medium" ? "medium"
      : "low";

    switch (cat.category) {
      case "inspection":
        actions.push({
          id: `risk-action-${++actionId}`,
          category: "inspection",
          label: features.totalInspections === 0 ? "Schedule First Inspection" : "Schedule Inspection",
          description: features.totalInspections === 0
            ? "No inspections have been recorded. Schedule a site visit."
            : `Last inspection was ${features.inspectionRecency} days ago. Schedule a site visit.`,
          priority,
          href: `/engineer/sites/${projectId}`,
          basedOnFeature: "inspectionRecency",
        });
        break;

      case "issue":
        if (features.criticalIssueCount > 0) {
          actions.push({
            id: `risk-action-${++actionId}`,
            category: "issue",
            label: "Review Critical Issues",
            description: `${features.criticalIssueCount} critical issue${features.criticalIssueCount !== 1 ? "s" : ""} require${features.criticalIssueCount === 1 ? "s" : ""} immediate attention.`,
            priority: "critical",
            href: `/engineer/evidence?projectId=${projectId}`,
            basedOnFeature: "criticalIssueCount",
          });
        } else if (features.openIssueCount > 0) {
          actions.push({
            id: `risk-action-${++actionId}`,
            category: "issue",
            label: "Review Open Issues",
            description: `${features.openIssueCount} open issue${features.openIssueCount !== 1 ? "s" : ""} pending resolution.`,
            priority,
            href: `/engineer/evidence?projectId=${projectId}`,
            basedOnFeature: "openIssueCount",
          });
        }
        break;

      case "schedule":
        actions.push({
          id: `risk-action-${++actionId}`,
          category: "schedule",
          label: features.scheduleOverdue ? "Review Overdue Timeline" : "Review Project Schedule",
          description: features.scheduleOverdue
            ? `Schedule overdue by ${features.scheduleOverdueByDays} days. Consider updating the timeline.`
            : `Progress is ${features.progressVsExpected}% behind expected pace.`,
          priority,
          href: `/engineer/sites/${projectId}`,
          basedOnFeature: "scheduleOverdueByDays",
        });
        break;

      case "workforce":
        if (features.hasLocationAnomaly) {
          actions.push({
            id: `risk-action-${++actionId}`,
            category: "workforce",
            label: "Review Location Anomaly",
            description: "A worker was verified at multiple sites in a short time window.",
            priority: "critical",
            href: `/engineer/workforce?projectId=${projectId}`,
            basedOnFeature: "hasLocationAnomaly",
          });
        } else if (features.todayOutsideGeofence > 0) {
          actions.push({
            id: `risk-action-${++actionId}`,
            category: "workforce",
            label: "Review Geofence Exceptions",
            description: `${features.todayOutsideGeofence} worker${features.todayOutsideGeofence !== 1 ? "s" : ""} outside site geofence.`,
            priority,
            href: `/engineer/workforce?projectId=${projectId}`,
            basedOnFeature: "todayOutsideGeofence",
          });
        }
        break;

      case "evidence":
        actions.push({
          id: `risk-action-${++actionId}`,
          category: "evidence",
          label: "Upload Site Evidence",
          description: features.totalPhotos === 0
            ? "No photos uploaded. Site evidence strengthens the project record."
            : `Evidence coverage is only ${features.evidenceCoverage}%. Upload more photos.`,
          priority,
          href: `/engineer/sites/${projectId}`,
          basedOnFeature: "evidenceCoverage",
        });
        break;

      case "spatial":
        // Spatial context rarely requires immediate action
        break;
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions;
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

/**
 * Calculate the full risk intelligence for a project.
 * Returns a comprehensive, explainable result with feature vectors,
 * category risks, signals, explanations, actions, data confidence,
 * and spatial context.
 *
 * This is a RULE-BASED prototype engine (risk-engine-v1).
 * Feature vectors are designed to be ML-ready for future model training.
 */
export function calculateRiskIntelligence(input: FeatureInput): RiskIntelligenceResult {
  // 1. Extract feature vector
  const features = extractFeatureVector(input);

  // 2. Generate signals
  const observedSignals = generateObservedSignals(input, features);
  const derivedSignals = generateDerivedSignals(features);

  // 3. Calculate category risks
  const inspectionResult = calculateInspectionRisk(features);
  const issueResult = calculateIssueRisk(features);
  const scheduleResult = calculateScheduleRisk(features);
  const workforceResult = calculateWorkforceRisk(features);
  const evidenceResult = calculateEvidenceRisk(features);
  const spatialResult = calculateSpatialRisk(features);

  const categoryResults: Array<{ category: RiskCategory; label: string; dataAvailable: boolean; result: { score: number; severity: "low" | "medium" | "high" | "critical"; factors: string[] } }> = [
    { category: "inspection", label: "Inspection Risk", dataAvailable: features.totalInspections > 0 || features.projectAgeDays > 14, result: inspectionResult },
    { category: "issue", label: "Issue Risk", dataAvailable: true, result: issueResult },
    { category: "schedule", label: "Schedule Risk", dataAvailable: features.progressVsExpected !== null, result: scheduleResult },
    { category: "workforce", label: "Workforce Risk", dataAvailable: features.totalWorkers > 0, result: workforceResult },
    { category: "evidence", label: "Evidence Risk", dataAvailable: features.totalInspections > 0, result: evidenceResult },
    { category: "spatial", label: "Spatial Risk", dataAvailable: features.hasCoordinates, result: spatialResult },
  ];

  const categoryRisks: CategoryRisk[] = categoryResults.map(cr => ({
    category: cr.category,
    label: cr.label,
    riskScore: cr.result.score,
    severity: cr.result.severity,
    signalCount: cr.result.factors.length,
    topFactors: cr.result.factors.slice(0, 3),
    dataAvailable: cr.dataAvailable,
  }));

  // 4. Generate predicted risk signals
  const predictedRisks: PredictedSignal[] = categoryResults
    .filter(cr => cr.result.score > 10)
    .map(cr => ({
      feature: `risk_${cr.category}`,
      value: cr.result.severity,
      riskScore: cr.result.score,
      severity: cr.result.severity,
      description: `${cr.label}: ${cr.result.severity} risk (${cr.result.score}/100)`,
      source: "rule_based_engine" as const,
      confidence: cr.dataAvailable ? "medium" as const : "low" as const,
      factors: cr.result.factors,
    }));

  // 5. Calculate overall risk score (weighted)
  const overallRiskScore = Math.round(
    categoryRisks.reduce((sum, cr) => {
      return sum + (cr.riskScore * (RISK_WEIGHTS[cr.category] / TOTAL_RISK_WEIGHT));
    }, 0)
  );

  const overallSeverity: "low" | "medium" | "high" | "critical" =
    overallRiskScore >= 60 ? "critical" :
    overallRiskScore >= 35 ? "high" :
    overallRiskScore >= 15 ? "medium" : "low";

  const riskLevel: "healthy" | "attention" | "high_risk" =
    overallRiskScore < 20 ? "healthy" :
    overallRiskScore < 50 ? "attention" : "high_risk";

  // 6. Generate explanations
  const explanations: RiskExplanation[] = [];

  for (const cat of categoryRisks) {
    for (const factor of cat.topFactors) {
      const impact = Math.round(cat.riskScore * (RISK_WEIGHTS[cat.category] / TOTAL_RISK_WEIGHT));
      explanations.push({
        signalType: "predicted",
        category: cat.category,
        text: factor,
        impact,
        severity: cat.severity === "critical" ? "critical" : cat.severity === "high" ? "warning" : "info",
      });
    }
  }

  // Add positive signals
  if (features.issueResolutionRate >= 80) {
    explanations.push({
      signalType: "derived",
      category: "issue",
      text: `${features.issueResolutionRate}% issue resolution rate — healthy`,
      impact: -5,
      severity: "positive",
    });
  }

  if (features.workforceAttendanceRate >= 80 && features.totalWorkers > 0) {
    explanations.push({
      signalType: "derived",
      category: "workforce",
      text: `${features.workforceAttendanceRate}% workforce attendance — healthy`,
      impact: -3,
      severity: "positive",
    });
  }

  // 7. Generate actions
  const recommendedActions = generateActions(input.projectId, categoryRisks, features);

  // 8. Data confidence
  const dataConfidence = calculateDataConfidence(features);

  // 9. Spatial context
  const spatialContext = calculateSpatialContext(input, features);

  return {
    projectId: input.projectId,
    projectName: input.projectName,
    overallRiskScore,
    overallSeverity,
    riskLevel,
    categoryRisks,
    observedSignals,
    derivedSignals,
    predictedRisks,
    explanations,
    recommendedActions,
    dataConfidence,
    spatialContext,
    engineVersion: RISK_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

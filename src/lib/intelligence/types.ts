// ─── Risk Intelligence Types ─────────────────────────────────────────────────
// Central type definitions for the Construction Risk Intelligence Engine.
// This module is RULE-BASED — not an ML model.
// Designed so that feature vectors can later feed a real trained model.

// ─── Feature Vector ──────────────────────────────────────────────────────────
// Structured representation of all observable and derived features for a project.
// Each feature is inspectable and reusable later for real ML model input.

export interface RiskFeatureVector {
  // ── Inspection features ──
  inspectionRecency: number | null;      // days since last inspection (null = never)
  inspectionOverdue: boolean;
  overdueByDays: number;                  // 0 if not overdue
  totalInspections: number;
  inspectionFrequency: number | null;     // avg days between inspections (null if <2)
  photosPerInspection: number;

  // ── Issue features ──
  openIssueCount: number;
  criticalIssueCount: number;
  highIssueCount: number;
  issueResolutionRate: number;            // 0–100
  issuesWithoutPhotos: number;
  totalIssueCount: number;

  // ── Schedule features ──
  scheduleOverdue: boolean;
  scheduleOverdueByDays: number;
  progressVsExpected: number | null;     // expected progress minus actual (null if no expected)
  daysSinceLastUpdate: number;
  projectAgeDays: number;

  // ── Workforce features ──
  totalWorkers: number;
  activeWorkers: number;
  todayVerifiedCheckIns: number;
  todayOutsideGeofence: number;
  workforceAttendanceRate: number;        // 0–100
  hasLocationAnomaly: boolean;

  // ── Evidence features ──
  totalPhotos: number;
  daysSinceLastEvidence: number | null;  // null = never
  evidenceCoverage: number;              // 0–100 (photos relative to inspections)
  hasAiAnalysis: boolean;

  // ── Spatial features ──
  hasCoordinates: boolean;
  nearbyProjectCount: number;
  nearestProjectDistanceKm: number | null;
  nearbyAverageRisk: number | null;       // avg risk of nearby projects (null if none)
}

// ── Risk signal types ──

export interface ObservedSignal {
  feature: string;
  value: string | number | boolean;
  description: string;
  source: "database";
}

export interface DerivedSignal {
  feature: string;
  value: string | number | boolean;
  description: string;
  source: "computed";
  derivedFrom: string[];
}

export interface PredictedSignal {
  feature: string;
  value: string;
  riskScore: number;           // 0–100
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  source: "rule_based_engine";
  confidence: "low" | "medium" | "high";  // data quality, NOT model accuracy
  factors: string[];
}

// ── Category risk ──

export type RiskCategory = "inspection" | "issue" | "schedule" | "workforce" | "evidence" | "spatial";

export interface CategoryRisk {
  category: RiskCategory;
  label: string;
  riskScore: number;           // 0 = no risk, 100 = maximum risk
  severity: "low" | "medium" | "high" | "critical";
  signalCount: number;         // how many signals contributed
  topFactors: string[];
  dataAvailable: boolean;      // whether enough data exists for this category
}

// ── Explanation ──

export interface RiskExplanation {
  signalType: "observed" | "derived" | "predicted";
  category: RiskCategory;
  text: string;
  impact: number;              // +/- contribution to overall risk
  severity: "positive" | "info" | "warning" | "critical";
}

// ── Action recommendation ──

export interface RiskAction {
  id: string;
  category: RiskCategory;
  label: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  href: string;
  basedOnFeature: string;
}

// ── Data confidence ──

export interface DataConfidence {
  overall: number;             // 0–100
  signalsAvailable: number;
  signalsTotal: number;
  availableCategories: RiskCategory[];
  missingCategories: RiskCategory[];
  description: string;
}

// ── Spatial context ──

export interface SpatialContext {
  hasCoordinates: boolean;
  latitude: number | null;
  longitude: number | null;
  nearbyProjectCount: number;
  nearestProjectDistanceKm: number | null;
  nearestProjectName: string | null;
  nearbyAverageRisk: number | null;
  spatialRiskContribution: number;       // +/- to overall risk
  spatialSeverity: "low" | "medium" | "high";
}

// ── Final result ──

export const RISK_ENGINE_VERSION = "risk-engine-v1";

export interface RiskIntelligenceResult {
  projectId: string;
  projectName: string;

  // Overall
  overallRiskScore: number;    // 0–100
  overallSeverity: "low" | "medium" | "high" | "critical";
  riskLevel: "healthy" | "attention" | "high_risk";

  // Categories
  categoryRisks: CategoryRisk[];

  // Signals (separated by type)
  observedSignals: ObservedSignal[];
  derivedSignals: DerivedSignal[];
  predictedRisks: PredictedSignal[];

  // Explanations
  explanations: RiskExplanation[];

  // Actions
  recommendedActions: RiskAction[];

  // Data quality
  dataConfidence: DataConfidence;

  // Spatial
  spatialContext: SpatialContext;

  // Engine metadata
  engineVersion: string;
  generatedAt: string;
}

// ── Feature importance weights ──
// Centralized so they can be calibrated from pilot data later.

export const RISK_WEIGHTS: Record<RiskCategory, number> = {
  inspection: 28,
  issue: 25,
  schedule: 20,
  workforce: 12,
  evidence: 10,
  spatial: 5,
};

export const TOTAL_RISK_WEIGHT = Object.values(RISK_WEIGHTS).reduce((a, b) => a + b, 0);

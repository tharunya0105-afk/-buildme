// ─── Attention Score Engine ─────────────────────────────────────────────────
// This is a RULE-BASED scoring system, not an ML model.
// It uses transparent, explainable rules to calculate project attention scores.
// Later, this can be replaced with or augmented by trained ML models.

import { AttentionScore, AttentionReason, AttentionLevel } from "./types";

interface ScoreInput {
  projectStatus: string;
  currentStage: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  expectedCompletion: string | null;
  lastInspectionDate: string | null;
  openAlerts: number;
  totalInspections: number;
  totalPhotos: number;
  unresolvedAlerts: number;
  recentAiReviewRecommended: boolean;
}

const WEIGHTS = {
  inspectionUrgency: 30,
  unresolvedIssues: 25,
  delayIndicators: 20,
  recentRiskFlags: 15,
  progressStagnation: 10,
};

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateInspectionUrgency(input: ScoreInput): AttentionReason | null {
  const now = new Date().toISOString();

  if (!input.lastInspectionDate) {
    // Never inspected
    const daysSinceCreation = daysBetween(input.createdAt, now);
    if (daysSinceCreation > 14) {
      return {
        factor: "inspection_urgency",
        weight: WEIGHTS.inspectionUrgency,
        description: `No inspection recorded in ${daysSinceCreation} days since project creation`,
        severity: "warning",
      };
    }
    return {
      factor: "inspection_urgency",
      weight: Math.round((WEIGHTS.inspectionUrgency * daysSinceCreation) / 14),
      description: "New project — first inspection expected soon",
      severity: "info",
    };
  }

  const daysSinceInspection = daysBetween(input.lastInspectionDate, now);

  if (daysSinceInspection > 30) {
    return {
      factor: "inspection_urgency",
      weight: WEIGHTS.inspectionUrgency,
      description: `Inspection overdue by ${daysSinceInspection - 30} days (last: ${daysSinceInspection} days ago)`,
      severity: "critical",
    };
  }

  if (daysSinceInspection > 21) {
    return {
      factor: "inspection_urgency",
      weight: Math.round(WEIGHTS.inspectionUrgency * 0.7),
      description: `Inspection due soon (${daysSinceInspection} days since last inspection)`,
      severity: "warning",
    };
  }

  return null;
}

function calculateUnresolvedIssues(input: ScoreInput): AttentionReason | null {
  if (input.unresolvedAlerts === 0) return null;

  const weight = Math.min(
    WEIGHTS.unresolvedIssues,
    Math.round(WEIGHTS.unresolvedIssues * (input.unresolvedAlerts / 5))
  );

  const severity =
    input.unresolvedAlerts >= 3
      ? "critical"
      : input.unresolvedAlerts >= 2
        ? "warning"
        : "info";

  return {
    factor: "unresolved_issues",
    weight,
    description: `${input.unresolvedAlerts} unresolved issue${input.unresolvedAlerts !== 1 ? "s" : ""}`,
    severity,
  };
}

function calculateDelayIndicators(input: ScoreInput): AttentionReason | null {
  if (!input.expectedCompletion) return null;

  const now = new Date();
  const expected = new Date(input.expectedCompletion);
  const daysUntilCompletion = Math.floor(
    (expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If past expected completion
  if (daysUntilCompletion < 0) {
    return {
      factor: "delay_indicators",
      weight: WEIGHTS.delayIndicators,
      description: `Expected completion was ${Math.abs(daysUntilCompletion)} days ago`,
      severity: "critical",
    };
  }

  // If close to expected completion but low progress
  if (daysUntilCompletion < 30 && input.progress < 70) {
    return {
      factor: "delay_indicators",
      weight: Math.round(WEIGHTS.delayIndicators * 0.8),
      description: `Only ${input.progress}% complete with ${daysUntilCompletion} days until expected completion`,
      severity: "warning",
    };
  }

  // If progress seems behind schedule
  const daysSinceCreation = daysBetween(input.createdAt, now.toISOString());
  const totalExpectedDays = daysBetween(input.createdAt, input.expectedCompletion);
  const expectedProgress = Math.min(
    100,
    Math.round((daysSinceCreation / totalExpectedDays) * 100)
  );

  if (input.progress < expectedProgress - 15) {
    return {
      factor: "delay_indicators",
      weight: Math.round(WEIGHTS.delayIndicators * 0.6),
      description: `Progress (${input.progress}%) is behind expected pace (${expectedProgress}%)`,
      severity: "warning",
    };
  }

  return null;
}

function calculateRecentRiskFlags(input: ScoreInput): AttentionReason | null {
  if (!input.recentAiReviewRecommended) return null;

  return {
    factor: "recent_risk_flags",
    weight: WEIGHTS.recentRiskFlags,
    description: "AI analysis recommended engineer review",
    severity: "warning",
  };
}

function calculateProgressStagnation(input: ScoreInput): AttentionReason | null {
  if (input.totalInspections < 2) return null;

  const daysSinceUpdate = daysBetween(input.updatedAt, new Date().toISOString());

  if (daysSinceUpdate > 21 && input.progress < 100) {
    return {
      factor: "progress_stagnation",
      weight: WEIGHTS.progressStagnation,
      description: `No project updates in ${daysSinceUpdate} days`,
      severity: "info",
    };
  }

  return null;
}

function getAttentionLevel(score: number): AttentionLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function calculateAttentionScore(input: ScoreInput): AttentionScore {
  const reasons: AttentionReason[] = [];

  const inspectionUrgency = calculateInspectionUrgency(input);
  if (inspectionUrgency) reasons.push(inspectionUrgency);

  const unresolvedIssues = calculateUnresolvedIssues(input);
  if (unresolvedIssues) reasons.push(unresolvedIssues);

  const delayIndicators = calculateDelayIndicators(input);
  if (delayIndicators) reasons.push(delayIndicators);

  const recentRiskFlags = calculateRecentRiskFlags(input);
  if (recentRiskFlags) reasons.push(recentRiskFlags);

  const progressStagnation = calculateProgressStagnation(input);
  if (progressStagnation) reasons.push(progressStagnation);

  // Calculate total score
  const totalWeight = reasons.reduce((sum, r) => sum + r.weight, 0);
  const score = Math.min(100, totalWeight);

  return {
    score,
    level: getAttentionLevel(score),
    reasons,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Build score input from project data with related queries.
 */
export function buildScoreInput(project: {
  status: string;
  currentStage: string | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  expectedCompletion: Date | null;
  lastInspectionDate: Date | null;
  unresolvedAlerts: number;
  totalInspections: number;
  totalPhotos: number;
  recentAiReviewRecommended: boolean;
}): ScoreInput {
  return {
    projectStatus: project.status,
    currentStage: project.currentStage,
    progress: project.progress,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    expectedCompletion: project.expectedCompletion?.toISOString() || null,
    lastInspectionDate: project.lastInspectionDate?.toISOString() || null,
    openAlerts: project.unresolvedAlerts,
    totalInspections: project.totalInspections,
    totalPhotos: project.totalPhotos,
    unresolvedAlerts: project.unresolvedAlerts,
    recentAiReviewRecommended: project.recentAiReviewRecommended,
  };
}

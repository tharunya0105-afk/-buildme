// ─── Project Health Intelligence Engine ──────────────────────────────────────
// RULE-BASED scoring system — NOT machine learning.
// Transparent, explainable rules using real database records.
// Later, this can be augmented by trained ML models.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HealthCategoryScore {
  category: string;
  label: string;
  score: number;        // 0–100
  maxScore: number;     // always 100
  weight: number;       // contribution to overall
  reasons: HealthReason[];
}

export interface HealthReason {
  factor: string;
  impact: number;       // negative = penalty, positive = bonus
  description: string;
  severity: "positive" | "info" | "warning" | "critical";
}

export interface HealthAction {
  id: string;
  label: string;
  description: string;
  severity: "info" | "warning" | "critical";
  href: string;
  category: string;
}

export interface ProjectHealthResult {
  overallScore: number;           // 0–100
  riskLevel: "healthy" | "attention" | "high_risk";
  categories: HealthCategoryScore[];
  actions: HealthAction[];
  summary: string;
  calculatedAt: string;
}

// ─── Input Interface ─────────────────────────────────────────────────────────

export interface HealthInput {
  projectId: string;
  projectName: string;
  currentStage: string | null;
  progress: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  expectedCompletion: string | null;
  builtArea: number | null;

  // Inspection data
  lastInspectionDate: string | null;
  totalInspections: number;
  totalPhotos: number;

  // Issue data
  openIssues: number;
  highSeverityIssues: number;
  criticalIssues: number;
  issuesUnderReview: number;
  totalIssues: number;
  resolvedIssues: number;

  // Workforce data
  totalWorkers: number;
  activeWorkers: number;
  todayVerifiedCheckIns: number;
  todayOutsideGeofence: number;
  todayNotCheckedIn: number;
  hasAnomalies: boolean;

  // AI data
  totalAiAnalyses: number;
  latestAiAssessment: string | null;
  aiReviewRecommended: boolean;

  // Timeline
  daysSinceLastUpdate: number;
}

// ─── Category Weights ────────────────────────────────────────────────────────

const CATEGORY_WEIGHTS = {
  inspection: 30,
  issue: 25,
  schedule: 20,
  workforce: 15,
  evidence: 10,
};

// ─── Schedule Health ─────────────────────────────────────────────────────────

function calculateScheduleHealth(input: HealthInput): HealthCategoryScore {
  const reasons: HealthReason[] = [];
  let score = 100;

  // Check expected completion
  if (input.expectedCompletion) {
    const now = new Date();
    const expected = new Date(input.expectedCompletion);
    const daysUntil = Math.floor((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      const overdue = Math.abs(daysUntil);
      const penalty = Math.min(40, overdue * 2);
      score -= penalty;
      reasons.push({
        factor: "overdue",
        impact: -penalty,
        description: `Expected completion was ${overdue} days ago`,
        severity: "critical",
      });
    } else if (daysUntil < 30 && input.progress < 70) {
      const penalty = 25;
      score -= penalty;
      reasons.push({
        factor: "at_risk",
        impact: -penalty,
        description: `Only ${input.progress}% complete with ${daysUntil} days remaining`,
        severity: "warning",
      });
    }
  }

  // Check progress vs time
  const daysSinceCreation = daysBetween(input.createdAt, new Date().toISOString());
  if (daysSinceCreation > 0 && input.expectedCompletion) {
    const totalDays = daysBetween(input.createdAt, input.expectedCompletion);
    if (totalDays > 0) {
      const expectedProgress = Math.min(100, Math.round((daysSinceCreation / totalDays) * 100));
      if (input.progress < expectedProgress - 15) {
        const penalty = 15;
        score -= penalty;
        reasons.push({
          factor: "behind_schedule",
          impact: -penalty,
          description: `Progress (${input.progress}%) behind expected pace (${expectedProgress}%)`,
          severity: "warning",
        });
      } else if (input.progress >= expectedProgress) {
        reasons.push({
          factor: "on_track",
          impact: 5,
          description: `Progress on or ahead of schedule (${input.progress}%)`,
          severity: "positive",
        });
        score = Math.min(100, score + 5);
      }
    }
  }

  // Stagnation check
  if (input.daysSinceLastUpdate > 21 && input.progress < 100) {
    const penalty = 15;
    score -= penalty;
    reasons.push({
      factor: "stagnation",
      impact: -penalty,
      description: `No project updates in ${input.daysSinceLastUpdate} days`,
      severity: "warning",
    });
  }

  return {
    category: "schedule",
    label: "Schedule Health",
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    weight: CATEGORY_WEIGHTS.schedule,
    reasons,
  };
}

// ─── Inspection Health ───────────────────────────────────────────────────────

function calculateInspectionHealth(input: HealthInput): HealthCategoryScore {
  const reasons: HealthReason[] = [];
  let score = 100;

  // No inspections yet
  if (input.totalInspections === 0) {
    const daysSinceCreation = daysBetween(input.createdAt, new Date().toISOString());
    if (daysSinceCreation > 14) {
      score = 20;
      reasons.push({
        factor: "no_inspections",
        impact: -80,
        description: `No inspections recorded in ${daysSinceCreation} days since project creation`,
        severity: "critical",
      });
    } else {
      score = 60;
      reasons.push({
        factor: "new_project",
        impact: -40,
        description: "New project — first inspection expected soon",
        severity: "info",
      });
    }
  } else {
    // Inspection frequency
    if (input.lastInspectionDate) {
      const daysSince = daysBetween(input.lastInspectionDate, new Date().toISOString());

      if (daysSince > 30) {
        const penalty = Math.min(50, 30 + (daysSince - 30));
        score -= penalty;
        reasons.push({
          factor: "overdue_inspection",
          impact: -penalty,
          description: `Last inspection was ${daysSince} days ago — overdue`,
          severity: "critical",
        });
      } else if (daysSince > 21) {
        const penalty = 20;
        score -= penalty;
        reasons.push({
          factor: "inspection_due_soon",
          impact: -penalty,
          description: `Last inspection was ${daysSince} days ago — due soon`,
          severity: "warning",
        });
      } else {
        reasons.push({
          factor: "recent_inspection",
          impact: 0,
          description: `Last inspection ${daysSince} days ago`,
          severity: "positive",
        });
      }
    }

    // Photo evidence
    const photosPerInspection = input.totalPhotos / input.totalInspections;
    if (photosPerInspection < 2 && input.totalInspections > 0) {
      const penalty = 10;
      score -= penalty;
      reasons.push({
        factor: "low_photo_evidence",
        impact: -penalty,
        description: `Average ${photosPerInspection.toFixed(1)} photos per inspection — more evidence recommended`,
        severity: "info",
      });
    } else if (photosPerInspection >= 4) {
      reasons.push({
        factor: "good_photo_evidence",
        impact: 5,
        description: `Good photo evidence: ${photosPerInspection.toFixed(1)} photos per inspection`,
        severity: "positive",
      });
      score = Math.min(100, score + 5);
    }
  }

  return {
    category: "inspection",
    label: "Inspection Health",
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    weight: CATEGORY_WEIGHTS.inspection,
    reasons,
  };
}

// ─── Issue Health ────────────────────────────────────────────────────────────

function calculateIssueHealth(input: HealthInput): HealthCategoryScore {
  const reasons: HealthReason[] = [];
  let score = 100;

  if (input.totalIssues === 0) {
    reasons.push({
      factor: "no_issues",
      impact: 0,
      description: "No issues recorded",
      severity: "info",
    });
    return {
      category: "issue",
      label: "Issue Health",
      score: 100,
      maxScore: 100,
      weight: CATEGORY_WEIGHTS.issue,
      reasons,
    };
  }

  // Critical issues
  if (input.criticalIssues > 0) {
    const penalty = Math.min(40, input.criticalIssues * 20);
    score -= penalty;
    reasons.push({
      factor: "critical_issues",
      impact: -penalty,
      description: `${input.criticalIssues} critical issue${input.criticalIssues > 1 ? "s" : ""} require${input.criticalIssues === 1 ? "s" : ""} immediate attention`,
      severity: "critical",
    });
  }

  // High-severity issues
  if (input.highSeverityIssues > 0) {
    const penalty = Math.min(25, input.highSeverityIssues * 10);
    score -= penalty;
    reasons.push({
      factor: "high_severity_issues",
      impact: -penalty,
      description: `${input.highSeverityIssues} high-severity issue${input.highSeverityIssues > 1 ? "s" : ""}`,
      severity: "warning",
    });
  }

  // Open issues
  if (input.openIssues > 2) {
    const penalty = Math.min(20, (input.openIssues - 2) * 5);
    score -= penalty;
    reasons.push({
      factor: "many_open_issues",
      impact: -penalty,
      description: `${input.openIssues} open issues`,
      severity: "warning",
    });
  }

  // Under review
  if (input.issuesUnderReview > 0) {
    reasons.push({
      factor: "under_review",
      impact: 0,
      description: `${input.issuesUnderReview} issue${input.issuesUnderReview > 1 ? "s" : ""} under review`,
      severity: "info",
    });
  }

  // Resolution rate
  if (input.totalIssues > 0) {
    const resolutionRate = (input.resolvedIssues / input.totalIssues) * 100;
    if (resolutionRate >= 80) {
      reasons.push({
        factor: "good_resolution",
        impact: 10,
        description: `${Math.round(resolutionRate)}% issue resolution rate`,
        severity: "positive",
      });
      score = Math.min(100, score + 10);
    }
  }

  return {
    category: "issue",
    label: "Issue Health",
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    weight: CATEGORY_WEIGHTS.issue,
    reasons,
  };
}

// ─── Workforce Health ────────────────────────────────────────────────────────

function calculateWorkforceHealth(input: HealthInput): HealthCategoryScore {
  const reasons: HealthReason[] = [];
  let score = 100;

  if (input.totalWorkers === 0) {
    return {
      category: "workforce",
      label: "Workforce Health",
      score: 100,
      maxScore: 100,
      weight: CATEGORY_WEIGHTS.workforce,
      reasons: [{ factor: "no_workers", impact: 0, description: "No workers assigned", severity: "info" }],
    };
  }

  // Check-in rate
  if (input.activeWorkers > 0) {
    const checkInRate = (input.todayVerifiedCheckIns / input.activeWorkers) * 100;
    if (checkInRate < 50) {
      const penalty = 20;
      score -= penalty;
      reasons.push({
        factor: "low_checkin_rate",
        impact: -penalty,
        description: `Only ${input.todayVerifiedCheckIns}/${input.activeWorkers} workers verified today (${Math.round(checkInRate)}%)`,
        severity: "warning",
      });
    } else if (checkInRate >= 80) {
      reasons.push({
        factor: "good_checkin_rate",
        impact: 5,
        description: `${Math.round(checkInRate)}% workforce verification rate`,
        severity: "positive",
      });
      score = Math.min(100, score + 5);
    }
  }

  // Outside geofence
  if (input.todayOutsideGeofence > 0) {
    const penalty = Math.min(25, input.todayOutsideGeofence * 10);
    score -= penalty;
    reasons.push({
      factor: "outside_geofence",
      impact: -penalty,
      description: `${input.todayOutsideGeofence} worker${input.todayOutsideGeofence > 1 ? "s" : ""} outside site geofence`,
      severity: "warning",
    });
  }

  // Anomalies
  if (input.hasAnomalies) {
    const penalty = 15;
    score -= penalty;
    reasons.push({
      factor: "anomaly",
      impact: -penalty,
      description: "Location anomaly detected — review recommended",
      severity: "critical",
    });
  }

  return {
    category: "workforce",
    label: "Workforce Health",
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    weight: CATEGORY_WEIGHTS.workforce,
    reasons,
  };
}

// ─── Evidence Health ─────────────────────────────────────────────────────────

function calculateEvidenceHealth(input: HealthInput): HealthCategoryScore {
  const reasons: HealthReason[] = [];
  let score = 50; // start at 50 — no evidence is neutral

  // Photo evidence
  if (input.totalPhotos === 0) {
    score = 20;
    reasons.push({
      factor: "no_photos",
      impact: -30,
      description: "No site photos uploaded",
      severity: "warning",
    });
  } else if (input.totalPhotos >= 10) {
    score = 90;
    reasons.push({
      factor: "good_photo_evidence",
      impact: 40,
      description: `${input.totalPhotos} site photos uploaded`,
      severity: "positive",
    });
  } else {
    score = 50 + (input.totalPhotos * 4);
    reasons.push({
      factor: "some_photos",
      impact: 0,
      description: `${input.totalPhotos} site photos uploaded`,
      severity: "info",
    });
  }

  // AI analysis evidence
  if (input.totalAiAnalyses > 0) {
    score = Math.min(100, score + 10);
    reasons.push({
      factor: "ai_analysis",
      impact: 10,
      description: `${input.totalAiAnalyses} AI analysis completed`,
      severity: "positive",
    });
  }

  // Issues with evidence
  if (input.totalIssues > 0 && input.totalPhotos === 0) {
    score = Math.max(10, score - 15);
    reasons.push({
      factor: "issues_no_evidence",
      impact: -15,
      description: "Issues reported without photo evidence",
      severity: "warning",
    });
  }

  return {
    category: "evidence",
    label: "Evidence Health",
    score: Math.max(0, Math.min(100, score)),
    maxScore: 100,
    weight: CATEGORY_WEIGHTS.evidence,
    reasons,
  };
}

// ─── Main Calculation ────────────────────────────────────────────────────────

export function calculateProjectHealth(input: HealthInput): ProjectHealthResult {
  const categories = [
    calculateInspectionHealth(input),
    calculateIssueHealth(input),
    calculateScheduleHealth(input),
    calculateWorkforceHealth(input),
    calculateEvidenceHealth(input),
  ];

  // Weighted overall score
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  const overallScore = Math.round(
    categories.reduce((sum, c) => sum + (c.score * c.weight), 0) / totalWeight
  );

  // Risk level
  let riskLevel: ProjectHealthResult["riskLevel"];
  if (overallScore >= 75) {
    riskLevel = "healthy";
  } else if (overallScore >= 50) {
    riskLevel = "attention";
  } else {
    riskLevel = "high_risk";
  }

  // Generate actionable recommendations
  const actions = generateActions(input, categories);

  // Generate summary
  const summary = generateSummary(overallScore, riskLevel, categories, input);

  return {
    overallScore,
    riskLevel,
    categories,
    actions,
    summary,
    calculatedAt: new Date().toISOString(),
  };
}

// ─── Action Generation ──────────────────────────────────────────────────────

function generateActions(input: HealthInput, categories: HealthCategoryScore[]): HealthAction[] {
  const actions: HealthAction[] = [];
  let actionId = 0;

  // Inspection actions
  const inspectionCat = categories.find(c => c.category === "inspection");
  if (inspectionCat && inspectionCat.score < 60) {
    if (input.totalInspections === 0) {
      actions.push({
        id: `action-${++actionId}`,
        label: "Schedule First Inspection",
        description: `No inspections have been recorded for ${input.projectName}. Schedule a site visit to establish a baseline.`,
        severity: input.totalInspections === 0 && daysBetween(input.createdAt, new Date().toISOString()) > 14 ? "critical" : "warning",
        href: `/engineer/sites/${input.projectId}`,
        category: "inspection",
      });
    } else if (input.lastInspectionDate) {
      const daysSince = daysBetween(input.lastInspectionDate, new Date().toISOString());
      if (daysSince > 21) {
        actions.push({
          id: `action-${++actionId}`,
          label: "Schedule Inspection",
          description: `Last inspection was ${daysSince} days ago. Schedule a site visit.`,
          severity: daysSince > 30 ? "critical" : "warning",
          href: `/engineer/sites/${input.projectId}`,
          category: "inspection",
        });
      }
    }
  }

  // Issue actions
  if (input.criticalIssues > 0) {
    actions.push({
      id: `action-${++actionId}`,
      label: "Review Critical Issues",
      description: `${input.criticalIssues} critical issue${input.criticalIssues > 1 ? "s" : ""} require${input.criticalIssues === 1 ? "s" : ""} immediate attention.`,
      severity: "critical",
      href: `/engineer/evidence?projectId=${input.projectId}`,
      category: "issue",
    });
  } else if (input.highSeverityIssues > 0) {
    actions.push({
      id: `action-${++actionId}`,
      label: "Review Open Issues",
      description: `${input.highSeverityIssues} high-severity issue${input.highSeverityIssues > 1 ? "s" : ""} pending resolution.`,
      severity: "warning",
      href: `/engineer/evidence?projectId=${input.projectId}`,
      category: "issue",
    });
  }

  // Workforce actions
  if (input.todayOutsideGeofence > 0) {
    actions.push({
      id: `action-${++actionId}`,
      label: "Review Geofence Exceptions",
      description: `${input.todayOutsideGeofence} worker${input.todayOutsideGeofence > 1 ? "s" : ""} checked in outside the site geofence.`,
      severity: "warning",
      href: `/engineer/workforce?projectId=${input.projectId}`,
      category: "workforce",
    });
  }

  if (input.hasAnomalies) {
    actions.push({
      id: `action-${++actionId}`,
      label: "Review Location Anomaly",
      description: "A location sequence requires review — same worker verified at multiple sites in a short time window.",
      severity: "critical",
      href: `/engineer/workforce?projectId=${input.projectId}`,
      category: "workforce",
    });
  }

  // Schedule actions
  if (input.expectedCompletion) {
    const daysUntil = daysBetween(new Date().toISOString(), input.expectedCompletion);
    if (daysUntil < 0) {
      actions.push({
        id: `action-${++actionId}`,
        label: "Review Project Timeline",
        description: `Expected completion was ${Math.abs(daysUntil)} days ago. Consider updating the timeline or noting delays.`,
        severity: "critical",
        href: `/engineer/sites/${input.projectId}`,
        category: "schedule",
      });
    }
  }

  // Evidence actions
  if (input.totalIssues > 0 && input.totalPhotos === 0) {
    actions.push({
      id: `action-${++actionId}`,
      label: "Upload Site Evidence",
      description: "Issues have been reported but no site photos have been uploaded. Photo evidence strengthens the record.",
      severity: "warning",
      href: `/engineer/sites/${input.projectId}`,
      category: "evidence",
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return actions;
}

// ─── Summary Generation ─────────────────────────────────────────────────────

function generateSummary(
  overallScore: number,
  riskLevel: ProjectHealthResult["riskLevel"],
  categories: HealthCategoryScore[],
  input: HealthInput
): string {
  const weakest = [...categories].sort((a, b) => a.score - b.score)[0];
  const strongest = [...categories].sort((a, b) => b.score - a.score)[0];

  if (riskLevel === "healthy") {
    return `${input.projectName} is in good health (${overallScore}/100). ${strongest.label} is strong at ${strongest.score}/100.`;
  }

  if (riskLevel === "attention") {
    return `${input.projectName} needs attention (${overallScore}/100). ${weakest.label} is the weakest area at ${weakest.score}/100.`;
  }

  return `${input.projectName} has significant concerns (${overallScore}/100). ${weakest.label} is critical at ${weakest.score}/100. Immediate action recommended.`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

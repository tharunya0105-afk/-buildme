// ─── Property Condition Scoring Engine ──────────────────────────────────────
// RULE-BASED scoring system for property condition assessment.
// NOT an ML model — uses transparent, explainable rules.

import { PropertyConditionResult, PropertyConditionReason, PropertyConditionLevel } from "./types";

interface ConditionInput {
  propertyAge: number | null;
  totalPhotos: number;
  totalIssues: number;
  highSeverityIssues: number;
  mediumSeverityIssues: number;
  lowSeverityIssues: number;
  inspectionCategories: string[]; // which categories have been inspected
}

const ALL_CATEGORIES = [
  "exterior", "walls", "ceiling", "floor", "kitchen",
  "bathroom", "electrical", "plumbing", "windows", "roof", "structural",
];

const WEIGHTS = {
  issueSeverity: 35,
  inspectionCompleteness: 25,
  propertyAge: 20,
  issueCount: 20,
};

function calculateIssueSeverityScore(input: ConditionInput): PropertyConditionReason | null {
  if (input.totalIssues === 0) return null;

  const weight = Math.min(
    WEIGHTS.issueSeverity,
    Math.round(WEIGHTS.issueSeverity * (
      (input.highSeverityIssues * 3 + input.mediumSeverityIssues * 2 + input.lowSeverityIssues) /
      Math.max(1, input.totalIssues * 2)
    ))
  );

  const severity =
    input.highSeverityIssues > 0 ? "critical" :
    input.mediumSeverityIssues > 1 ? "warning" : "info";

  return {
    factor: "issue_severity",
    description: `${input.highSeverityIssues} high-severity, ${input.mediumSeverityIssues} medium-severity, ${input.lowSeverityIssues} low-severity visible concerns detected`,
    severity,
  };
}

function calculateInspectionCompleteness(input: ConditionInput): PropertyConditionReason | null {
  const inspected = input.inspectionCategories.length;
  const total = ALL_CATEGORIES.length;
  const completeness = Math.round((inspected / total) * 100);

  if (completeness >= 80) return null; // Good coverage

  const weight = Math.round(WEIGHTS.inspectionCompleteness * (1 - completeness / 100));

  const missing = ALL_CATEGORIES.filter(c => !input.inspectionCategories.includes(c));
  const missingLabels = missing.slice(0, 3).join(", ");

  return {
    factor: "inspection_completeness",
    description: `${completeness}% areas inspected. Missing: ${missingLabels}${missing.length > 3 ? "..." : ""}`,
    severity: completeness < 40 ? "warning" : "info",
  };
}

function calculatePropertyAgeScore(input: ConditionInput): PropertyConditionReason | null {
  if (!input.propertyAge) return null;

  if (input.propertyAge > 25) {
    return {
      factor: "property_age",
      description: `Property is approximately ${input.propertyAge} years old — older properties may have more wear`,
      severity: "warning",
    };
  }

  if (input.propertyAge > 15) {
    return {
      factor: "property_age",
      description: `Property is approximately ${input.propertyAge} years old`,
      severity: "info",
    };
  }

  return null;
}

function calculateIssueCountScore(input: ConditionInput): PropertyConditionReason | null {
  if (input.totalIssues === 0) return null;

  const weight = Math.min(
    WEIGHTS.issueCount,
    Math.round(WEIGHTS.issueCount * (input.totalIssues / 10))
  );

  return {
    factor: "issue_count",
    description: `${input.totalIssues} visible concern${input.totalIssues !== 1 ? "s" : ""} identified across inspected areas`,
    severity: input.totalIssues >= 5 ? "warning" : "info",
  };
}

function getConditionLevel(score: number): PropertyConditionLevel {
  if (score >= 60) return "poor";
  if (score >= 30) return "moderate";
  return "good";
}

export function calculateConditionScore(input: ConditionInput): PropertyConditionResult {
  const reasons: PropertyConditionReason[] = [];

  const issueSeverity = calculateIssueSeverityScore(input);
  if (issueSeverity) reasons.push(issueSeverity);

  const inspectionCompleteness = calculateInspectionCompleteness(input);
  if (inspectionCompleteness) reasons.push(inspectionCompleteness);

  const propertyAge = calculatePropertyAgeScore(input);
  if (propertyAge) reasons.push(propertyAge);

  const issueCount = calculateIssueCountScore(input);
  if (issueCount) reasons.push(issueCount);

  const totalWeight = reasons.reduce((sum, r) => sum + (
    r.severity === "critical" ? 25 :
    r.severity === "warning" ? 15 : 8
  ), 0);

  const score = Math.min(100, totalWeight);

  return {
    level: getConditionLevel(score),
    score,
    reasons,
  };
}

/**
 * Generate buyer questions based on property context.
 */
export function generateBuyerQuestions(property: {
  propertyType: string | null;
  propertyAge: number | null;
  constructionYear: number | null;
  floors: number | null;
  parking: string | null;
  conditionLevel: string;
  totalIssues: number;
  inspectedCategories: string[];
  documentsUploaded: number;
}): Array<{ category: string; question: string; reason: string }> {
  const questions: Array<{ category: string; question: string; reason: string }> = [];

  // Property basics
  if (!property.constructionYear) {
    questions.push({
      category: "Property",
      question: "When was this property originally constructed?",
      reason: "Construction year was not provided",
    });
  }

  if (!property.propertyAge) {
    questions.push({
      category: "Property",
      question: "How old is the property approximately?",
      reason: "Property age was not provided",
    });
  }

  // Structural
  if (property.totalIssues > 0) {
    questions.push({
      category: "Structural",
      question: "Have there been any previous structural repairs or renovations?",
      reason: `${property.totalIssues} visible concern(s) detected — repairs may have been done`,
    });
  }

  if (!property.inspectedCategories.includes("roof")) {
    questions.push({
      category: "Structural",
      question: "Can the roof/terrace area be inspected?",
      reason: "Roof area has not been inspected yet",
    });
  }

  if (!property.inspectedCategories.includes("structural")) {
    questions.push({
      category: "Structural",
      question: "Are there any visible structural cracks in load-bearing walls?",
      reason: "Structural areas have not been inspected",
    });
  }

  // Dampness/water
  const hasDampness = property.totalIssues > 0; // Simplified
  if (hasDampness) {
    questions.push({
      category: "Structural",
      question: "Have there been any previous water leakage or dampness problems?",
      reason: "Visible indicators may suggest moisture-related concerns",
    });
  }

  // Utilities
  if (!property.inspectedCategories.includes("electrical")) {
    questions.push({
      category: "Utilities",
      question: "When was the electrical system last upgraded or inspected?",
      reason: "Electrical areas have not been inspected",
    });
  }

  if (!property.inspectedCategories.includes("plumbing")) {
    questions.push({
      category: "Utilities",
      question: "What is the condition of the plumbing system?",
      reason: "Plumbing areas have not been inspected",
    });
  }

  questions.push({
    category: "Utilities",
    question: "Is the water supply reliable? Are there any water storage arrangements?",
    reason: "Water supply details are important for daily living",
  });

  // Legal
  if (property.documentsUploaded < 2) {
    questions.push({
      category: "Legal",
      question: "Are all required building approvals and occupancy certificates available?",
      reason: "Limited documentation has been uploaded for review",
    });
  }

  questions.push({
    category: "Legal",
    question: "Is the property title clear? Are there any encumbrances or disputes?",
    reason: "Legal verification is essential before purchase",
  });

  questions.push({
    category: "Legal",
    question: "Are there any outstanding property-related dues or taxes?",
    reason: "Outstanding dues can become the buyer's liability",
  });

  // Financial
  questions.push({
    category: "Financial",
    question: "What are the ongoing maintenance costs?",
    reason: "Understanding recurring expenses helps with financial planning",
  });

  if (property.floors && property.floors > 1) {
    questions.push({
      category: "Property",
      question: "Are all floors part of the same ownership? Is there a shared maintenance arrangement?",
      reason: "Multi-floor properties may have shared responsibilities",
    });
  }

  if (property.parking === "no" || !property.parking) {
    questions.push({
      category: "Property",
      question: "Is dedicated parking available? What are the parking arrangements?",
      reason: "Parking availability was not confirmed",
    });
  }

  return questions;
}

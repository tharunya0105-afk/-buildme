// ─── AI Analysis Types ──────────────────────────────────────────────────────

export type OverallAssessment =
  | "progress_detected"
  | "limited_visible_change"
  | "no_clear_change"
  | "insufficient_evidence"
  | "review_recommended";

export interface AiChange {
  category: string;
  description: string;
  confidence: number;
}

export interface AiAnalysisResult {
  overall_assessment: OverallAssessment;
  confidence: number;
  construction_stage_observed: string | null;
  changes: AiChange[];
  unchanged_observations: string[];
  uncertain_observations: string[];
  engineer_review_recommended: boolean;
  summary: string;
}

export interface InspectionImageContext {
  inspectionId: string;
  inspectionDate: string;
  stage: string | null;
  notes: string | null;
  imageUrls: string[];
}

export interface ProjectMetadata {
  projectId: string;
  projectName: string;
  constructionType: string | null;
  builtArea: number | null;
  currentStage: string | null;
}

export interface AiAnalysisInput {
  project: ProjectMetadata;
  previousInspection: InspectionImageContext;
  currentInspection: InspectionImageContext;
}

export interface AiAnalysisConfig {
  provider: string;
  model: string;
  apiKey: string;
  maxImagesPerInspection: number;
  imageMaxWidth: number;
  imageMaxHeight: number;
}

export const ASSESSMENT_LABELS: Record<OverallAssessment, string> = {
  progress_detected: "Progress Detected",
  limited_visible_change: "Limited Visible Change",
  no_clear_change: "No Clear Change",
  insufficient_evidence: "Insufficient Evidence",
  review_recommended: "Review Recommended",
};

export const ASSESSMENT_DESCRIPTIONS: Record<OverallAssessment, string> = {
  progress_detected:
    "Visible construction progress was detected between the two inspections.",
  limited_visible_change:
    "Some minor changes are visible, but significant progress is limited.",
  no_clear_change:
    "No clear visual change was identified between the inspections.",
  insufficient_evidence:
    "The available images are insufficient to make a reliable comparison.",
  review_recommended:
    "An observation was detected that may require engineer review.",
};

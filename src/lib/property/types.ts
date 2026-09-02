// ─── Property Evaluation Types ──────────────────────────────────────────────

export type PropertyType = "house" | "villa" | "apartment" | "independent";

export type PropertyConditionLevel = "good" | "moderate" | "poor" | "unknown";

export type PhotoCategory =
  | "exterior"
  | "walls"
  | "ceiling"
  | "floor"
  | "kitchen"
  | "bathroom"
  | "electrical"
  | "plumbing"
  | "windows"
  | "roof"
  | "structural";

export type DocumentType =
  | "ownership"
  | "approval"
  | "sale"
  | "inspection_report"
  | "maintenance"
  | "other";

export type IssueType =
  | "crack"
  | "dampness"
  | "stain"
  | "peeling_paint"
  | "corrosion"
  | "damage"
  | "uneven_surface";

export type IssueSeverity = "low" | "medium" | "high";

export interface PropertyConditionReason {
  factor: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface PropertyConditionResult {
  level: PropertyConditionLevel;
  score: number; // 0–100
  reasons: PropertyConditionReason[];
}

export interface PropertyIssue {
  id: string;
  issueType: IssueType;
  description: string;
  confidence: number;
  severity: IssueSeverity;
  recommendation: string | null;
  photoUrl: string | null;
  photoCategory: string | null;
}

export interface BuyerQuestion {
  category: string;
  question: string;
  reason: string;
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "house", label: "Individual House" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "independent", label: "Independent Floor" },
];

export const PHOTO_CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: "exterior", label: "Exterior" },
  { value: "walls", label: "Walls" },
  { value: "ceiling", label: "Ceiling" },
  { value: "floor", label: "Floor" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "windows", label: "Windows/Doors" },
  { value: "roof", label: "Roof/Terrace" },
  { value: "structural", label: "Structural Areas" },
];

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "ownership", label: "Ownership Document" },
  { value: "approval", label: "Building Approval" },
  { value: "sale", label: "Sale Agreement" },
  { value: "inspection_report", label: "Inspection Report" },
  { value: "maintenance", label: "Maintenance Record" },
  { value: "other", label: "Other" },
];

export const CONDITION_LEVEL_LABELS: Record<PropertyConditionLevel, string> = {
  good: "Lower Visible Concern",
  moderate: "Moderate Visible Concern",
  poor: "Higher Visible Concern",
  unknown: "Condition Unknown",
};

export const CONDITION_LEVEL_COLORS: Record<PropertyConditionLevel, string> = {
  good: "text-status-normal",
  moderate: "text-status-attention",
  poor: "text-status-review",
  unknown: "text-text-muted",
};

export const CONDITION_LEVEL_BG: Record<PropertyConditionLevel, string> = {
  good: "bg-status-normal-bg",
  moderate: "bg-status-attention-bg",
  poor: "bg-status-review-bg",
  unknown: "bg-surface-alt",
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  crack: "Visible Crack",
  dampness: "Dampness Indicator",
  stain: "Water Stain",
  peeling_paint: "Peeling Paint",
  corrosion: "Surface Corrosion",
  damage: "Physical Damage",
  uneven_surface: "Uneven/Damaged Surface",
};

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  low: "Low Severity",
  medium: "Medium Severity",
  high: "High Severity",
};

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  low: "text-status-normal",
  medium: "text-status-attention",
  high: "text-status-review",
};

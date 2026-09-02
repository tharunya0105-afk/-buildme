export type UserRole = "engineer" | "homeowner";

export type ProjectStatus = "normal" | "attention" | "review";

export type AlertSeverity = "info" | "warning" | "critical";

export type ConstructionType = "house" | "villa" | "apartment" | "renovation";

export type ConstructionStage =
  | "planning"
  | "foundation"
  | "structure"
  | "brickwork"
  | "roofing"
  | "electrical_plumbing"
  | "finishing"
  | "completed";

export type TimelineEventType =
  | "milestone"
  | "inspection"
  | "update"
  | "alert"
  | "photo";

export const CONSTRUCTION_TYPES: { value: ConstructionType; label: string }[] = [
  { value: "house", label: "Individual House" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "renovation", label: "Renovation" },
];

export const CONSTRUCTION_STAGES: { value: ConstructionStage; label: string; progress: number }[] = [
  { value: "planning", label: "Planning", progress: 5 },
  { value: "foundation", label: "Foundation", progress: 15 },
  { value: "structure", label: "Structure", progress: 30 },
  { value: "brickwork", label: "Brickwork", progress: 45 },
  { value: "roofing", label: "Roofing", progress: 60 },
  { value: "electrical_plumbing", label: "Electrical/Plumbing", progress: 75 },
  { value: "finishing", label: "Finishing", progress: 90 },
  { value: "completed", label: "Completed", progress: 100 },
];

export const STATUS_LABELS: Record<string, string> = {
  normal: "Normal",
  attention: "Attention",
  review: "Review Required",
};

export interface ProjectWithCounts {
  id: string;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  constructionType: string | null;
  builtArea: number | null;
  currentStage: string | null;
  status: string;
  progress: number;
  homeownerName: string | null;
  expectedCompletion: Date | null;
  estimatedCost: number | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    inspections: number;
    photos: number;
    alerts: number;
  };
}

export interface DashboardStats {
  totalActiveSites: number;
  normalSites: number;
  attentionSites: number;
  reviewSites: number;
  recentInspections: number;
}

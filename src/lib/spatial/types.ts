// ─── Spatial Intelligence Types ─────────────────────────────────────────────

export type AttentionLevel = "low" | "medium" | "high";

export interface AttentionScore {
  score: number; // 0–100
  level: AttentionLevel;
  reasons: AttentionReason[];
  calculatedAt: string;
}

export interface AttentionReason {
  factor: string;
  weight: number;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface SpatialProject {
  id: string;
  name: string;
  address: string;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  constructionType: string | null;
  builtArea: number | null;
  currentStage: string | null;
  status: string;
  progress: number;
  homeownerName: string | null;
  expectedCompletion: string | null;
  estimatedCost: number | null;
  createdAt: string;
  updatedAt: string;
  lastInspectionDate: string | null;
  openIssues: number;
  attentionScore: AttentionScore;
}

export interface SpatialAnalytics {
  totalProjects: number;
  projectsByDistrict: { district: string; count: number }[];
  projectsByStage: { stage: string; count: number }[];
  highAttentionSites: number;
  mediumAttentionSites: number;
  lowAttentionSites: number;
  overdueInspections: number;
}

// ─── Future Spatial Intelligence Placeholders ───────────────────────────────
// These data structures represent future external geospatial dataset integrations.
// They are NOT populated with fake data — they exist as architecture foundations.

export interface LocalCostIndex {
  district: string;
  state: string;
  constructionCostIndex: number | null; // relative to national average (1.0)
  materialPriceIndex: number | null;
  laborCostIndex: number | null;
  lastUpdated: string | null;
  source: string | null;
}

export interface WeatherClimateData {
  latitude: number;
  longitude: number;
  averageRainfall: number | null; // mm/year
  averageTemperature: number | null; // °C
  floodRisk: "low" | "medium" | "high" | null;
  cycloneRisk: "low" | "medium" | "high" | null;
  monsoonMonths: string[] | null;
  lastUpdated: string | null;
}

export interface TerrainRiskData {
  latitude: number;
  longitude: number;
  soilType: string | null;
  terrainType: string | null;
  elevationMeters: number | null;
  floodZone: boolean | null;
  seismicZone: string | null;
  lastUpdated: string | null;
}

export interface InfrastructureData {
  latitude: number;
  longitude: number;
  nearestHospital: number | null; // km
  nearestSchool: number | null; // km
  nearestMarket: number | null; // km
  nearestHighway: number | null; // km
  publicTransportAccess: "good" | "moderate" | "limited" | null;
  lastUpdated: string | null;
}

export interface SpatialFeatureVector {
  // Core project features
  latitude: number | null;
  longitude: number | null;
  district: string | null;
  state: string | null;
  constructionType: string | null;
  builtArea: number | null;
  currentStage: string | null;
  // Historical features
  totalInspections: number;
  totalPhotos: number;
  daysSinceCreation: number;
  daysSinceLastInspection: number | null;
  openAlerts: number;
  // Future external features (null until integrated)
  localCostIndex: number | null;
  weatherRisk: number | null;
  terrainRisk: number | null;
  infrastructureScore: number | null;
}

export const ATTENTION_LEVEL_LABELS: Record<AttentionLevel, string> = {
  low: "Low Attention",
  medium: "Medium Attention",
  high: "High Attention",
};

export const ATTENTION_LEVEL_COLORS: Record<AttentionLevel, string> = {
  low: "text-status-normal",
  medium: "text-status-attention",
  high: "text-status-review",
};

export const ATTENTION_LEVEL_BG: Record<AttentionLevel, string> = {
  low: "bg-status-normal-bg",
  medium: "bg-status-attention-bg",
  high: "bg-status-review-bg",
};

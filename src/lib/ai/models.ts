// ─── AI Model Registry ─────────────────────────────────────────────────────
// Central registry of all AI/ML models available in BuildMe.
// Each model has a version, status, input/output specification, and prediction interface.

export interface ModelDefinition {
  id: string;
  name: string;
  version: string;
  status: "active" | "prototype" | "data_collection" | "not_trained";
  description: string;
  inputDescription: string;
  outputDescription: string;
  features: string[];
}

export const MODEL_REGISTRY: ModelDefinition[] = [
  {
    id: "visual_analyzer",
    name: "Construction Visual Analyzer",
    version: "prototype-v1",
    status: "prototype",
    description: "Analyzes construction/property images for visible conditions and issues",
    inputDescription: "Construction or property inspection images",
    outputDescription: "Visible issue categories with confidence and severity",
    features: ["crack", "dampness", "stain", "peeling_paint", "corrosion", "damage", "uneven_surface"],
  },
  {
    id: "progress_analyzer",
    name: "Construction Progress Analyzer",
    version: "prototype-v1",
    status: "prototype",
    description: "Compares two inspection image sets to identify construction progress changes",
    inputDescription: "Previous and current inspection image sets with project context",
    outputDescription: "Progress assessment with change categories and confidence",
    features: ["masonry", "roofing", "flooring", "electrical", "plumbing", "painting", "foundation"],
  },
  {
    id: "project_risk",
    name: "Project Risk Indicator",
    version: "rule-based-v0",
    status: "prototype",
    description: "Calculates project attention score using transparent rule-based factors",
    inputDescription: "Project history, inspection data, alerts, progress",
    outputDescription: "Attention score (0-100) with explainable factors",
    features: ["inspection_urgency", "unresolved_issues", "delay_indicators", "risk_flags", "stagnation"],
  },
  {
    id: "cost_estimator",
    name: "Construction Cost Estimator",
    version: "not_trained",
    status: "data_collection",
    description: "Estimates construction costs based on location, type, and market data",
    inputDescription: "Location, built-up area, construction type, stage, material category",
    outputDescription: "Estimated cost range with confidence",
    features: ["location", "area", "type", "stage", "materials", "regional_prices"],
  },
  {
    id: "delay_predictor",
    name: "Construction Delay Predictor",
    version: "not_trained",
    status: "data_collection",
    description: "Predicts likelihood of construction delays based on project signals",
    inputDescription: "Project progress, inspection history, issues, milestones",
    outputDescription: "Delay risk level (low/medium/high) with contributing factors",
    features: ["progress", "inspections", "issues", "milestones", "materials"],
  },
  {
    id: "spatial_risk",
    name: "Spatial Risk Analyzer",
    version: "not_trained",
    status: "data_collection",
    description: "Combines location data with geographic features for spatial risk assessment",
    inputDescription: "Latitude, longitude, district, state, geographic features",
    outputDescription: "Location-based risk indicators",
    features: ["flood_risk", "terrain", "infrastructure", "environmental", "regional_patterns"],
  },
  {
    id: "property_condition",
    name: "Property Condition Assessor",
    version: "rule-based-v0",
    status: "prototype",
    description: "Evaluates property condition from visual observations and property data",
    inputDescription: "Property details, inspection photos, AI observations",
    outputDescription: "Condition level with explainable reasons",
    features: ["issue_severity", "inspection_completeness", "property_age", "issue_count"],
  },
];

// ─── Prediction Structure ──────────────────────────────────────────────────

export interface AiPrediction {
  id: string;
  projectId?: string;
  propertyId?: string;
  inspectionId?: string;
  photoId?: string;
  modelName: string;
  modelVersion: string;
  prediction: string;
  predictionCategory?: string;
  confidence: number;
  severity?: string;
  explanation?: string;
  inputMetadata?: string;
  status: "pending" | "confirmed" | "rejected" | "needs_inspection";
  engineerReview?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  evidenceId?: string;
  createdAt: string;
}

// ─── Feature Definitions ───────────────────────────────────────────────────

export interface FeatureDefinition {
  name: string;
  key: string;
  status: "available" | "missing" | "future";
  description: string;
}

export const FEATURE_SETS: Record<string, FeatureDefinition[]> = {
  project_risk: [
    { name: "Inspection Overdue", key: "inspection_overdue", status: "available", description: "Days since last inspection exceeds threshold" },
    { name: "Open Issues", key: "open_issues", status: "available", description: "Count of unresolved project issues" },
    { name: "AI Observations", key: "ai_observations", status: "available", description: "Count of AI-flagged observations" },
    { name: "Construction Progress", key: "progress", status: "available", description: "Current project progress percentage" },
    { name: "Days Since Inspection", key: "days_since_inspection", status: "available", description: "Number of days since last inspection" },
    { name: "Recent Issue Severity", key: "issue_severity", status: "available", description: "Severity of most recent issues" },
  ],
  property_condition: [
    { name: "Property Age", key: "property_age", status: "available", description: "Age of the property in years" },
    { name: "Visible Issue Count", key: "issue_count", status: "available", description: "Number of visible issues detected" },
    { name: "Issue Severity", key: "issue_severity", status: "available", description: "Maximum severity of detected issues" },
    { name: "Inspection Completeness", key: "inspection_completeness", status: "available", description: "Percentage of areas inspected" },
    { name: "Maintenance History", key: "maintenance_history", status: "future", description: "Historical maintenance records" },
  ],
  cost_estimation: [
    { name: "Location", key: "location", status: "available", description: "Property latitude/longitude" },
    { name: "Built-up Area", key: "area", status: "available", description: "Built-up area in sq ft" },
    { name: "Property Type", key: "property_type", status: "available", description: "Type of property" },
    { name: "Construction Type", key: "construction_type", status: "available", description: "Construction methodology" },
    { name: "Construction Stage", key: "stage", status: "available", description: "Current construction stage" },
    { name: "Historical Cost Data", key: "historical_costs", status: "future", description: "Past construction cost records" },
    { name: "Regional Material Prices", key: "material_prices", status: "future", description: "Local material price indices" },
  ],
  spatial_risk: [
    { name: "Latitude", key: "latitude", status: "available", description: "Property latitude" },
    { name: "Longitude", key: "longitude", status: "available", description: "Property longitude" },
    { name: "District", key: "district", status: "available", description: "Administrative district" },
    { name: "State", key: "state", status: "available", description: "State/region" },
    { name: "Flood Risk Data", key: "flood_risk", status: "future", description: "Verified flood zone data" },
    { name: "Terrain Data", key: "terrain", status: "future", description: "Elevation and terrain type" },
    { name: "Infrastructure Access", key: "infrastructure", status: "future", description: "Proximity to facilities" },
    { name: "Environmental Factors", key: "environmental", status: "future", description: "Climate and environmental data" },
  ],
};

// ─── Dataset Stats ─────────────────────────────────────────────────────────

export interface DatasetStats {
  totalImages: number;
  labeledImages: number;
  unlabeledImages: number;
  confirmedIssues: number;
  rejectedPredictions: number;
  pendingReviews: number;
  labelCoverage: number; // percentage
}

// ─── ML Pipeline Stages ────────────────────────────────────────────────────

export const ML_PIPELINE_STAGES = [
  { id: "raw_data", label: "Raw Data", description: "Inspection images, project data, spatial information", status: "active" as const },
  { id: "validation", label: "Data Validation", description: "Quality checks, deduplication, format validation", status: "active" as const },
  { id: "labeling", label: "Labeling", description: "Engineer-assigned labels and classifications", status: "active" as const },
  { id: "feature_eng", label: "Feature Engineering", description: "Visual, spatial, temporal, project features", status: "active" as const },
  { id: "split", label: "Train/Validation Split", description: "Data partitioning for model training", status: "future" as const },
  { id: "training", label: "Model Training", description: "Supervised ML model training", status: "future" as const },
  { id: "evaluation", label: "Evaluation", description: "Model performance assessment", status: "future" as const },
  { id: "engineer_val", label: "Engineer Validation", description: "Human verification of model outputs", status: "active" as const },
  { id: "registry", label: "Model Registry", description: "Versioned model deployment", status: "future" as const },
  { id: "prediction", label: "Prediction", description: "Live model inference", status: "future" as const },
];

// ─── Label Categories ──────────────────────────────────────────────────────

export const IMAGE_LABEL_CATEGORIES = [
  { value: "no_issue", label: "No Visible Issue" },
  { value: "crack", label: "Crack" },
  { value: "dampness", label: "Dampness" },
  { value: "stain", label: "Water Stain" },
  { value: "peeling_paint", label: "Peeling Paint" },
  { value: "corrosion", label: "Corrosion" },
  { value: "damage", label: "Physical Damage" },
  { value: "uneven_surface", label: "Uneven Surface" },
  { value: "other", label: "Other" },
];

export const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const REVIEW_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending Review", color: "text-status-attention", bg: "bg-status-attention-bg" },
  confirmed: { label: "Confirmed", color: "text-status-normal", bg: "bg-status-normal-bg" },
  rejected: { label: "Rejected", color: "text-text-muted", bg: "bg-surface-alt" },
  needs_inspection: { label: "Needs Inspection", color: "text-status-attention", bg: "bg-status-attention-bg" },
};

export const MODEL_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-status-normal", bg: "bg-status-normal-bg" },
  prototype: { label: "Prototype", color: "text-primary", bg: "bg-primary/10" },
  data_collection: { label: "Data Collection", color: "text-status-attention", bg: "bg-status-attention-bg" },
  not_trained: { label: "Not Trained", color: "text-text-muted", bg: "bg-surface-alt" },
};

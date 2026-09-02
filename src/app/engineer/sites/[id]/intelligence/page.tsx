"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Brain, MapPin, ClipboardCheck, Camera, Shield, AlertTriangle,
  CheckCircle, Clock, Activity, Eye, ChevronRight, Building2, User, Zap,
  TrendingUp, Globe, Sparkles, Target, Cpu, Database, GitBranch,
  ChevronDown, ChevronUp, Info, Map as MapIcon,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CONSTRUCTION_STAGES } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthCategory {
  category: string;
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  reasons: { factor: string; impact: number; description: string; severity: string }[];
}

interface HealthAction {
  id: string;
  label: string;
  description: string;
  severity: string;
  href: string;
  category: string;
}

interface HealthResult {
  overallScore: number;
  riskLevel: string;
  categories: HealthCategory[];
  actions: HealthAction[];
  summary: string;
  calculatedAt: string;
}

interface RiskCategory {
  category: string;
  label: string;
  riskScore: number;
  severity: string;
  signalCount: number;
  topFactors: string[];
  dataAvailable: boolean;
}

interface AiBrief {
  generatedFrom: string[];
  riskLevel: string;
  riskScore: number;
  summary: string;
  priorityActions: string[];
  dataConfidence: number;
  engineNote: string;
  disclaimer: string;
}

interface PipelineStage {
  id: string;
  label: string;
  status: "active" | "pending" | "future";
  detail: string;
  icon: string;
}

interface IntelligenceData {
  project: {
    id: string;
    name: string;
    address: string;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    currentStage: string | null;
    status: string;
    progress: number;
    constructionType: string | null;
    builtArea: number | null;
    homeownerName: string | null;
    engineerName: string;
    createdAt: string;
    updatedAt: string;
  };
  observed: {
    totalInspections: number;
    lastInspectionDate: string | null;
    totalPhotos: number;
    totalIssues: number;
    openIssues: number;
    criticalIssues: number;
    highSeverityIssues: number;
    resolvedIssues: number;
    totalWorkers: number;
    activeWorkers: number;
    verifiedCheckInsToday: number;
    outsideGeofenceToday: number;
    totalAiAnalyses: number;
    recentTimelineEvents: Array<{
      id: string;
      type: string;
      title: string;
      description: string | null;
      createdAt: string;
    }>;
  };
  risk: {
    overallRiskScore: number;
    overallSeverity: string;
    riskLevel: string;
    categoryRisks: RiskCategory[];
    observedSignals: Array<{ feature: string; value: string | number; description: string; source: string }>;
    derivedSignals: Array<{ feature: string; value: string | number; description: string; source: string }>;
    predictedRisks: Array<{ feature: string; value: string; riskScore: number; severity: string; description: string; factors: string[] }>;
    explanations: Array<{ signalType: string; category: string; text: string; impact: number; severity: string }>;
    recommendedActions: Array<{ id: string; category: string; label: string; description: string; priority: string; href: string; basedOnFeature: string }>;
    dataConfidence: { overall: number; signalsAvailable: number; signalsTotal: number; availableCategories: string[]; missingCategories: string[]; description: string };
    spatialContext: { hasCoordinates: boolean; latitude: number | null; longitude: number | null; nearbyProjectCount: number; nearestProjectDistanceKm: number | null; nearestProjectName: string | null; nearbyAverageRisk: number | null; spatialRiskContribution: number; spatialSeverity: string };
    engineVersion: string;
    generatedAt: string;
  };
  aiBrief: AiBrief;
  pipeline: PipelineStage[];
  layers: {
    observed: Array<{ feature: string; value: string | number; source: string }>;
    derived: Array<{ feature: string; value: string | number; source: string }>;
    predicted: Array<{ feature: string; value: string; source: string }>;
    aiInterpretation: { available: boolean; status: string };
    futureMl: Array<{ capability: string; status: string }>;
  };
  engineVersion: string;
  generatedAt: string;
}

// ─── Score Ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score, label, color, size = 88 }: { score: number; label: string; color: string; size?: number }) {
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} className="transition-all duration-1000" />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          className="text-lg font-bold fill-current text-text-primary">{score}</text>
      </svg>
      <span className="text-xs text-text-muted mt-1">{label}</span>
    </div>
  );
}

// ─── Severity Helpers ───────────────────────────────────────────────────────

function severityColor(s: string) {
  if (s === "critical") return "#ef4444";
  if (s === "high") return "#f59e0b";
  if (s === "medium") return "#eab308";
  return "#22c55e";
}

function severityBg(s: string) {
  if (s === "critical") return "bg-status-review-bg border-status-review-border";
  if (s === "high") return "bg-status-attention-bg border-status-attention-border";
  return "bg-status-normal-bg border-status-normal-border";
}

function severityText(s: string) {
  if (s === "critical") return "text-status-review";
  if (s === "high") return "text-status-attention";
  return "text-status-normal";
}

function severityBadge(s: string) {
  if (s === "critical") return "bg-status-review text-white";
  if (s === "high") return "bg-status-attention text-white";
  return "bg-status-normal text-white";
}

// ─── Pipeline Icon ──────────────────────────────────────────────────────────

function PipelineIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    Building2: <Building2 className="h-5 w-5" />,
    Cpu: <Cpu className="h-5 w-5" />,
    Activity: <Activity className="h-5 w-5" />,
    Map: <MapIcon className="h-5 w-5" />,
    Eye: <Eye className="h-5 w-5" />,
    Brain: <Brain className="h-5 w-5" />,
    Zap: <Zap className="h-5 w-5" />,
  };
  return <>{icons[name] || <Zap className="h-5 w-5" />}</>;
}

// ─── Risk Category Card (with expandable explanation) ───────────────────────

function RiskCategoryCard({ cat, expanded, onToggle }: {
  cat: RiskCategory; expanded: boolean; onToggle: () => void;
}) {
  const color = severityColor(cat.severity);
  return (
    <Card className="overflow-hidden">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h4 className="text-sm font-semibold text-text-primary">{cat.label}</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold" style={{ color }}>{cat.riskScore}</span>
            <span className="text-[10px] text-text-muted">/100</span>
          </div>
        </div>
        <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.riskScore}%`, backgroundColor: color }} />
        </div>
        {!cat.dataAvailable && <p className="text-[10px] text-text-muted mb-1">Limited data available</p>}
        {cat.topFactors.length > 0 && (
          <div className="space-y-1">
            {cat.topFactors.map((f, i) => (
              <p key={i} className="text-xs text-text-secondary flex items-start gap-1">
                <span className="mt-0.5">•</span> {f}
              </p>
            ))}
          </div>
        )}
        {cat.topFactors.length > 0 && (
          <button onClick={onToggle} className="text-[10px] text-primary hover:underline mt-2 flex items-center gap-1">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide" : "Show"} traceable factors
          </button>
        )}
        {expanded && (
          <div className="mt-3 p-3 rounded-lg bg-surface-alt border border-border space-y-2">
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide">How this score was calculated</p>
            {cat.topFactors.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{f}</span>
                <span className="font-mono text-text-muted">signal</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="font-medium text-text-primary">Category Risk Score</span>
              <span className="font-bold" style={{ color }}>{cat.riskScore}/100</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ProjectIntelligencePage() {
  const params = useParams();
  const projectId = params.id as string;
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSignals, setExpandedSignals] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<"brain" | "pipeline" | "layers" | "model">("brain");

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [intelRes, healthRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/intelligence`),
        fetch(`/api/projects/${projectId}/health`),
      ]);
      if (intelRes.ok) setIntelligence(await intelRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
    } catch {
      setError("Failed to load project intelligence");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-text-secondary">
        <Brain className="h-5 w-5 animate-pulse text-primary" />
        <span>Loading intelligence...</span>
      </div>
    </div>
  );

  if (error || !intelligence) return (
    <div className="text-center py-20">
      <p className="text-danger mb-4">{error || "Project not found"}</p>
      <Link href="/engineer/sites"><Button variant="secondary">Back to Sites</Button></Link>
    </div>
  );

  const { project, observed, risk, aiBrief, pipeline, layers } = intelligence;
  const stageLabel = CONSTRUCTION_STAGES.find(s => s.value === project.currentStage)?.label || project.currentStage || "Unknown";
  const rc = severityColor(risk.overallSeverity);

  return (
    <div className="space-y-6">
      {/* ─── HEADER ──────────────────────────────────────────────── */}
      <div>
        <Link href={`/engineer/sites/${project.id}`} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="h-4 w-4" />Back to {project.name}
        </Link>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-text-primary">AI Brain</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{risk.engineVersion}</span>
            </div>
            <p className="text-sm text-text-secondary">{project.name} — {project.city || project.address}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={project.status} />
            <span className="text-xs px-2 py-1 rounded bg-surface-alt text-text-muted">{stageLabel}</span>
            <span className="text-xs px-2 py-1 rounded bg-surface-alt text-text-muted">{project.progress}%</span>
          </div>
        </div>
      </div>

      {/* ─── MAIN RISK SCORE ────────────────────────────────────── */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreRing score={risk.overallRiskScore} label="Risk Score" color={rc} size={120} />
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold" style={{ color: rc }}>
                  {risk.overallSeverity.toUpperCase()} RISK
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge(risk.overallSeverity)}`}>
                  {risk.overallRiskScore}/100
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-1">{aiBrief.summary}</p>
              <p className="text-xs text-text-muted mt-2">
                Data confidence: {risk.dataConfidence.overall}% · {risk.dataConfidence.description}
              </p>
              <p className="text-[10px] text-text-muted mt-1">
                Rule-based prediction — not an ML model · Engine: {risk.engineVersion}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Inspections", value: observed.totalInspections },
                { label: "Photos", value: observed.totalPhotos },
                { label: "Open Issues", value: observed.openIssues },
                { label: "Workers", value: observed.totalWorkers },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── AI SITE BRIEF ──────────────────────────────────────── */}
      <Card className="border-primary/20">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-text-primary">AI Site Brief</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">DETERMINISTIC</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{aiBrief.summary}</p>
              {aiBrief.priorityActions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-text-muted mb-1">Highest priority:</p>
                  <div className="flex flex-wrap gap-2">
                    {aiBrief.priorityActions.map((action, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-status-attention-bg text-status-attention font-medium">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-text-muted mt-3 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Generated from: {aiBrief.generatedFrom.join(" · ")}
              </p>
              <p className="text-[10px] text-text-muted mt-1 italic">{aiBrief.disclaimer}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── SECTION NAV ─────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "brain" as const, label: "Risk Analysis", icon: Brain },
          { key: "pipeline" as const, label: "Pipeline", icon: GitBranch },
          { key: "layers" as const, label: "Intelligence Layers", icon: Database },
          { key: "model" as const, label: "Model & ML Path", icon: Cpu },
        ]).map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === s.key ? "bg-primary text-white" : "bg-surface-alt text-text-secondary hover:bg-border"
            }`}>
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── SECTION: RISK ANALYSIS ──────────────────────────────── */}
      {activeSection === "brain" && (
        <div className="space-y-6">
          {/* Category Risks */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">What's Driving the Risk?</h3>
            <p className="text-xs text-text-muted mb-3">Six risk categories scored by risk-engine-v1</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {risk.categoryRisks.map(cat => (
                <RiskCategoryCard
                  key={cat.category}
                  cat={cat}
                  expanded={!!expandedCategories[cat.category]}
                  onToggle={() => setExpandedCategories(prev => ({
                    ...prev,
                    [cat.category]: !prev[cat.category],
                  }))}
                />
              ))}
            </div>
          </div>

          {/* Why This Project Needs Attention */}
          {risk.explanations.filter(e => e.severity === "critical" || e.severity === "warning").length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-text-primary">Why This Project Needs Attention</h3>
                <p className="text-sm text-text-muted">Traceable risk factors from real project data</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {risk.explanations
                    .filter(e => e.severity === "critical" || e.severity === "warning")
                    .map((exp, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${severityBg(exp.severity)}`}>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{exp.text}</p>
                          <p className="text-[10px] text-text-muted">
                            {exp.signalType} · {exp.category} · impact: +{exp.impact}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge(exp.severity)}`}>
                          {exp.severity}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Positive Signals */}
          {risk.explanations.filter(e => e.severity === "positive").length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-status-normal">Positive Signals</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {risk.explanations
                    .filter(e => e.severity === "positive")
                    .map((exp, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-status-normal-border bg-status-normal-bg">
                        <CheckCircle className="h-4 w-4 text-status-normal flex-shrink-0" />
                        <p className="text-sm text-text-primary">{exp.text}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Actions */}
          {risk.recommendedActions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">Recommended Actions</h3>
              <p className="text-xs text-text-muted mb-3">Generated from actual risk signals</p>
              <div className="space-y-2">
                {risk.recommendedActions.map(action => {
                  const colors: Record<string, string> = {
                    critical: "border-l-4 border-status-review bg-status-review-bg",
                    high: "border-l-4 border-status-attention bg-status-attention-bg",
                    medium: "border-l-4 border-primary bg-primary/5",
                    low: "border-l-4 border-status-normal bg-status-normal-bg",
                  };
                  return (
                    <Link key={action.id} href={action.href}>
                      <div className={`p-3 rounded-r-lg cursor-pointer hover:shadow-sm transition-shadow ${colors[action.priority] || colors.low}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-text-primary">{action.label}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${severityBadge(action.priority)}`}>
                                {action.priority}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5">{action.description}</p>
                            <p className="text-[10px] text-text-muted mt-0.5">Triggered by: {action.basedOnFeature}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-text-muted mt-1 flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Confidence */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Data Confidence</h3>
              <p className="text-sm text-text-muted">Based on availability and recency of project signals — NOT model accuracy</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{risk.dataConfidence.overall}%</p>
                  <p className="text-xs text-text-muted">Data Confidence</p>
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 bg-surface-alt rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${risk.dataConfidence.overall}%` }} />
                  </div>
                  <p className="text-xs text-text-muted mt-1">{risk.dataConfidence.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {["inspection", "issue", "schedule", "workforce", "evidence", "spatial"].map(cat => (
                  <div key={cat} className={`text-center p-2 rounded-lg border ${
                    risk.dataConfidence.availableCategories.includes(cat)
                      ? "border-status-normal-border bg-status-normal-bg"
                      : "border-dashed border-border bg-surface-alt"
                  }`}>
                    <p className="text-xs font-medium text-text-primary capitalize">{cat}</p>
                    <p className={`text-[10px] ${
                      risk.dataConfidence.availableCategories.includes(cat) ? "text-status-normal" : "text-text-muted"
                    }`}>
                      {risk.dataConfidence.availableCategories.includes(cat) ? "Available" : "Missing"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Spatial Context */}
          {risk.spatialContext.hasCoordinates && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-text-primary">Spatial Context</h3>
                <p className="text-sm text-text-muted">Nearby project risk environment — contextual, not causal</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center p-3 rounded-lg bg-surface-alt">
                    <p className="text-2xl font-bold text-text-primary">{risk.spatialContext.nearbyProjectCount}</p>
                    <p className="text-xs text-text-muted">Nearby Projects</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-alt">
                    <p className="text-2xl font-bold text-text-primary">
                      {risk.spatialContext.nearestProjectDistanceKm ?? "—"} {risk.spatialContext.nearestProjectDistanceKm !== null ? "km" : ""}
                    </p>
                    <p className="text-xs text-text-muted">Nearest Project</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-alt">
                    <p className="text-2xl font-bold text-text-primary">
                      {risk.spatialContext.nearbyAverageRisk ? Math.round(risk.spatialContext.nearbyAverageRisk) : "—"}
                    </p>
                    <p className="text-xs text-text-muted">Avg Nearby Risk</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-alt">
                    <p className="text-2xl font-bold text-primary">+{risk.spatialContext.spatialRiskContribution}</p>
                    <p className="text-xs text-text-muted">Risk Contribution</p>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Contextual spatial signal — does not imply causation.
                  {risk.spatialContext.nearestProjectName && ` Nearest: ${risk.spatialContext.nearestProjectName} (${risk.spatialContext.nearestProjectDistanceKm}km)`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Data Provenance */}
          <div className="p-4 rounded-lg bg-surface-alt border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-text-primary">Data Provenance</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <span className="text-xs px-2 py-1 rounded bg-status-normal-bg text-status-normal font-medium">LIVE DATA</span>
                <p className="text-[10px] text-text-muted mt-1">Risk scores, feature vectors, project data</p>
              </div>
              <div className="text-center">
                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">PROTOTYPE</span>
                <p className="text-[10px] text-text-muted mt-1">Scoring weights, risk thresholds</p>
              </div>
              <div className="text-center">
                <span className="text-xs px-2 py-1 rounded bg-status-attention-bg text-status-attention font-medium">NOT CONFIGURED</span>
                <p className="text-[10px] text-text-muted mt-1">AI image analysis (requires API key)</p>
              </div>
              <div className="text-center">
                <span className="text-xs px-2 py-1 rounded bg-surface-alt text-text-muted font-medium">NOT YET VALIDATED</span>
                <p className="text-[10px] text-text-muted mt-1">ML model accuracy, time savings</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION: PIPELINE ───────────────────────────────────── */}
      {activeSection === "pipeline" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">BuildMe Intelligence Pipeline</h3>
              <p className="text-sm text-text-muted">How raw construction data becomes actionable intelligence</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pipeline.map((stage, i) => (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0 ${
                      stage.status === "active" ? "bg-primary/10 text-primary" :
                      stage.status === "pending" ? "bg-status-attention-bg text-status-attention" :
                      "bg-surface-alt text-text-muted"
                    }`}>
                      <PipelineIcon name={stage.icon} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{stage.label}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          stage.status === "active" ? "bg-status-normal-bg text-status-normal" :
                          stage.status === "pending" ? "bg-status-attention-bg text-status-attention" :
                          "bg-surface-alt text-text-muted"
                        }`}>{stage.status === "active" ? "ACTIVE" : stage.status === "pending" ? "PARTIAL" : "FUTURE"}</span>
                      </div>
                      <p className="text-xs text-text-muted">{stage.detail}</p>
                    </div>
                    {i < pipeline.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-text-muted flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-4 pt-3 border-t border-border">
                Each stage feeds real data into the next. No fabricated intelligence.
                Engine: {risk.engineVersion} · {risk.dataConfidence.overall}% data confidence.
              </p>
            </CardContent>
          </Card>

          {/* Observed Signals */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Observed Signals</h3>
              <p className="text-sm text-text-muted">Direct database facts — {risk.observedSignals.length} signals</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {risk.observedSignals.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border border-border bg-surface-alt">
                    <div>
                      <p className="text-xs font-medium text-text-primary">{s.feature.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-text-muted">{s.description}</p>
                    </div>
                    <span className="text-xs font-mono text-primary ml-2">{String(s.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Derived Signals */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Derived Signals</h3>
              <p className="text-sm text-text-muted">Calculated from observed data — {risk.derivedSignals.length} signals</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {risk.derivedSignals.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border border-status-normal-border bg-status-normal-bg">
                    <div>
                      <p className="text-xs font-medium text-text-primary">{s.feature.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-text-muted">{s.description}</p>
                    </div>
                    <span className="text-xs font-mono text-status-normal ml-2">{String(s.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── SECTION: INTELLIGENCE LAYERS ────────────────────────── */}
      {activeSection === "layers" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Intelligence Layers</h3>
              <p className="text-sm text-text-muted">Clear separation between observed, derived, predicted, and future</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Observed */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <h4 className="text-sm font-semibold text-text-primary">OBSERVED</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">DATABASE</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {layers.observed.slice(0, 8).map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border border-border text-xs">
                        <span className="text-text-secondary">{s.feature.replace(/_/g, " ")}</span>
                        <span className="font-mono text-primary">{String(s.value)}</span>
                      </div>
                    ))}
                  </div>
                  {layers.observed.length > 8 && (
                    <button
                      onClick={() => setExpandedSignals(prev => ({ ...prev, observed: !prev.observed }))}
                      className="text-[10px] text-primary hover:underline mt-2"
                    >
                      {expandedSignals.observed ? "Show fewer" : `Show all ${layers.observed.length}`}
                    </button>
                  )}
                  {expandedSignals.observed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {layers.observed.slice(8).map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded border border-border text-xs">
                          <span className="text-text-secondary">{s.feature.replace(/_/g, " ")}</span>
                          <span className="font-mono text-primary">{String(s.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Derived */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-status-normal" />
                    <h4 className="text-sm font-semibold text-text-primary">DERIVED</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-normal-bg text-status-normal">COMPUTED</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {layers.derived.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border border-status-normal-border bg-status-normal-bg text-xs">
                        <span className="text-text-secondary">{s.feature.replace(/_/g, " ")}</span>
                        <span className="font-mono text-status-normal">{String(s.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Predicted */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-status-attention" />
                    <h4 className="text-sm font-semibold text-text-primary">PROTOTYPE PREDICTION</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-attention-bg text-status-attention font-medium">RULE-BASED</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {layers.predicted.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border border-status-attention-border bg-status-attention-bg text-xs">
                        <span className="text-text-secondary">{s.feature.replace(/_/g, " ")}</span>
                        <span className="font-mono text-status-attention">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-text-muted mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Rule-based prototype prediction — not an ML model
                  </p>
                </div>

                {/* AI Interpretation */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <h4 className="text-sm font-semibold text-text-primary">AI INTERPRETATION</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">DETERMINISTIC</span>
                  </div>
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <p className="text-sm text-text-secondary leading-relaxed">{aiBrief.summary}</p>
                    <p className="text-[10px] text-text-muted mt-2">{aiBrief.engineNote}</p>
                    <p className="text-[10px] text-text-muted mt-1 italic">{aiBrief.disclaimer}</p>
                  </div>
                </div>

                {/* Future ML */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-text-muted border-2 border-text-muted border-dashed" />
                    <h4 className="text-sm font-semibold text-text-muted">FUTURE ML</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt text-text-muted">NOT YET BUILT</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {layers.futureMl.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border-dashed border-border bg-surface-alt text-xs">
                        <span className="text-text-muted">{s.capability}</span>
                        <span className="text-text-muted">{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── SECTION: MODEL & ML PATH ───────────────────────────── */}
      {activeSection === "model" && (
        <div className="space-y-6">
          {/* Model Readiness */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Model Readiness</h3>
              <p className="text-sm text-text-muted">Current intelligence engine status and ML evolution path</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[
                    { label: "Current Engine", value: "Prototype Rule-Based Risk Engine", detail: risk.engineVersion },
                    { label: "Status", value: "Operational", badge: "bg-status-normal-bg text-status-normal" },
                    { label: "Feature Signals", value: "24 features", detail: "Inspection, issue, schedule, workforce, evidence, spatial" },
                    { label: "Categories", value: "6 risk categories", detail: "Weighted by construction-management logic" },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-text-muted mb-1">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{item.value}</p>
                        {item.badge && <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${item.badge}`}>✓</span>}
                      </div>
                      {item.detail && <p className="text-[10px] text-text-muted">{item.detail}</p>}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Training Dataset", value: "Not yet available", detail: "Real pilot data will be collected through the platform" },
                    { label: "Validation", value: "Not yet performed", detail: "Requires real pilot data" },
                    { label: "ML Model", value: "Planned after pilot data", detail: "Feature vectors designed to be ML-ready" },
                    { label: "Engine Versioning", value: "Supported", badge: "bg-status-normal-bg text-status-normal", detail: "Each result includes version for comparison" },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-text-muted mb-1">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{item.value}</p>
                        {item.badge && <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${item.badge}`}>✓</span>}
                      </div>
                      {item.detail && <p className="text-[10px] text-text-muted">{item.detail}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ML Evolution Path */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">ML Evolution Path</h3>
              <p className="text-sm text-text-muted">From rule-based prototype to validated ML intelligence</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { phase: "1", title: "Current", desc: "Explainable Rule-Based Intelligence", status: "current", icon: Zap },
                  { phase: "2", title: "Pilot", desc: "Collect real project outcomes from construction sites", status: "next", icon: Target },
                  { phase: "3", title: "Dataset", desc: "Features + outcomes form training dataset", status: "future", icon: Database },
                  { phase: "4", title: "Validation", desc: "Measure predictive value against real outcomes", status: "future", icon: CheckCircle },
                  { phase: "5", title: "ML Model", desc: "Train and compare models (risk, cost, delay)", status: "future", icon: Cpu },
                  { phase: "6", title: "Production", desc: "Continuously validated predictions", status: "future", icon: TrendingUp },
                ].map((step, i) => (
                  <div key={step.phase} className={`flex items-start gap-4 p-4 rounded-lg border ${
                    step.status === "current" ? "border-primary bg-primary/5" :
                    step.status === "next" ? "border-status-attention-border bg-status-attention-bg" :
                    "border-border bg-surface-alt"
                  }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
                      step.status === "current" ? "bg-primary text-white" :
                      step.status === "next" ? "bg-status-attention text-white" :
                      "bg-surface-alt text-text-muted border border-border"
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-text-muted">PHASE {step.phase}</span>
                        <h4 className="text-sm font-semibold text-text-primary">{step.title}</h4>
                        {step.status === "current" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white">Active</span>}
                        {step.status === "next" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-attention text-white">Next</span>}
                      </div>
                      <p className="text-xs text-text-secondary">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evidence Trail */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Evidence Trail</h3>
              <p className="text-sm text-text-muted">BuildMe records evidence and creates a transparent timeline. Final decisions remain with the involved parties/professionals.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { icon: ClipboardCheck, title: "Inspections Recorded", detail: `${observed.totalInspections} inspection${observed.totalInspections !== 1 ? "s" : ""} with ${observed.totalPhotos} photo${observed.totalPhotos !== 1 ? "s" : ""}`, href: "/engineer/evidence" },
                  { icon: AlertTriangle, title: "Issues & Evidence", detail: `${observed.openIssues} open issue${observed.openIssues !== 1 ? "s" : ""} with evidence trail`, href: "/engineer/evidence" },
                  { icon: Eye, title: "AI Analysis", detail: observed.totalAiAnalyses > 0 ? `${observed.totalAiAnalyses} analyses completed` : "Decision-support only — does not replace a licensed engineer", href: "/engineer/ai-intelligence" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-muted">{item.detail}</p>
                    </div>
                    <Link href={item.href} className="text-xs font-medium text-primary hover:underline">View →</Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-xs text-text-muted">
          BuildMe AI Brain · {risk.engineVersion} · Generated at {new Date(intelligence.generatedAt).toLocaleString()}
        </p>
        <p className="text-[10px] text-text-muted mt-1">
          Intelligence derived from real project data · Rule-based scoring — not an ML prediction
        </p>
      </div>
    </div>
  );
}

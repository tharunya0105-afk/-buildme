"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Clock, DollarSign, MapPin, Camera, AlertTriangle,
  CheckCircle, FileText, TrendingUp, TrendingDown, Activity, Brain,
  Shield, Users, ChevronRight, Eye, Info, Layers, Target, Zap,
  ArrowUpRight, ArrowDownRight, Minus, CircleDot,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { CONSTRUCTION_STAGES } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface BudgetEvent {
  id: string;
  type: string;
  category: string | null;
  title: string;
  description: string | null;
  amount: number;
  cumulativeTotal: number | null;
  confidence: string;
  source: string;
  approved: boolean;
  createdAt: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  estimatedCostLow: number | null;
  estimatedCostHigh: number | null;
  actualCost: number | null;
  timelineImpactDays: number | null;
  rationale: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface SiteContext {
  roadAccess: string | null;
  vehicleAccess: string | null;
  waterAvailability: string | null;
  siteLevel: string | null;
  soilType: string | null;
  waterTableDepth: string | null;
  accessDistanceM: number | null;
  basementRequired: boolean;
  costRiskNotes: string | null;
}

interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string | null;
  amount?: number;
  confidence?: string;
  category?: string;
  status?: string;
}

interface ProjectTruth {
  project: {
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
    estimatedCost: number | null;
    expectedCompletion: string | null;
    createdAt: string;
    engineer: { name: string };
    homeowner: { name: string } | null;
  };
  truth: {
    originalEstimate: number | null;
    currentExpectedCost: number | null;
    totalPaid: number;
    budgetChangeFromOriginal: number | null;
    budgetChangePercentage: number | null;
    budgetChanges: Array<{
      id: string;
      type: string;
      title: string;
      amount: number;
      category: string | null;
      confidence: string;
      source: string;
      createdAt: string;
    }>;
    openAlerts: number;
  };
  workforce: {
    totalWorkers: number;
    checkedInToday: number;
    verifiedToday: number;
  };
  siteContext: SiteContext | null;
  latestRisk: {
    overallRisk: number;
    riskCategory: string;
    dataConfidence: number;
    explanation: string;
  } | null;
  attentionScore: {
    score: number;
    level: string;
    reasons: Array<{
      factor: string;
      weight: number;
      description: string;
      severity: string;
    }>;
  };
  changeRequests: ChangeRequest[];
  timeline: TimelineEvent[];
  counts: {
    inspections: number;
    photos: number;
    issues: number;
    workers: number;
  };
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function getEventIcon(type: string) {
  switch (type) {
    case "budget": return <DollarSign className="h-4 w-4" />;
    case "change": return <Layers className="h-4 w-4" />;
    case "inspection": return <CheckCircle className="h-4 w-4" />;
    case "issue": return <AlertTriangle className="h-4 w-4" />;
    case "evidence": return <Camera className="h-4 w-4" />;
    default: return <CircleDot className="h-4 w-4" />;
  }
}

function getEventColor(type: string) {
  switch (type) {
    case "budget": return "bg-blue-100 text-blue-700 border-blue-200";
    case "change": return "bg-amber-100 text-amber-700 border-amber-200";
    case "inspection": return "bg-green-100 text-green-700 border-green-200";
    case "issue": return "bg-red-100 text-red-700 border-red-200";
    case "evidence": return "bg-purple-100 text-purple-700 border-purple-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getTimelineIconColor(type: string) {
  switch (type) {
    case "budget": return "bg-blue-500";
    case "change": return "bg-amber-500";
    case "inspection": return "bg-green-500";
    case "issue": return "bg-red-500";
    case "evidence": return "bg-purple-500";
    default: return "bg-gray-500";
  }
}

// ─── Components ─────────────────────────────────────────────────────────────

function BudgetStoryCard({ truth, project }: { truth: ProjectTruth["truth"]; project: ProjectTruth["project"] }) {
  const hasBudget = truth.originalEstimate !== null;
  const hasChange = truth.budgetChangeFromOriginal !== null && truth.budgetChangeFromOriginal !== 0;
  const changeDirection = (truth.budgetChangeFromOriginal ?? 0) > 0 ? "increase" : "decrease";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Budget Story</h2>
        </div>
      </CardHeader>
      <CardContent>
        {!hasBudget ? (
          <div className="text-center py-6">
            <DollarSign className="h-10 w-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No budget estimate set for this project.</p>
            <p className="text-xs text-text-muted mt-1">Set an estimated cost to begin tracking the budget story.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Original → Current flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-surface-alt">
                <p className="text-xs text-text-muted mb-1">Original Estimate</p>
                <p className="text-xl font-bold text-text-primary">{formatCurrency(truth.originalEstimate!)}</p>
                <p className="text-xs text-text-muted">When project started</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-surface-alt relative">
                <p className="text-xs text-text-muted mb-1">Current Expected</p>
                <p className="text-xl font-bold text-text-primary">
                  {truth.currentExpectedCost ? formatCurrency(truth.currentExpectedCost) : "—"}
                </p>
                {hasChange && (
                  <div className={`flex items-center justify-center gap-1 text-xs font-medium mt-1 ${
                    changeDirection === "increase" ? "text-red-600" : "text-green-600"
                  }`}>
                    {changeDirection === "increase"
                      ? <ArrowUpRight className="h-3 w-3" />
                      : <ArrowDownRight className="h-3 w-3" />
                    }
                    {Math.abs(truth.budgetChangePercentage ?? 0)}% from original
                  </div>
                )}
              </div>
              <div className="text-center p-3 rounded-lg bg-surface-alt">
                <p className="text-xs text-text-muted mb-1">Total Paid</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(truth.totalPaid)}</p>
                {truth.currentExpectedCost && (
                  <p className="text-xs text-text-muted mt-1">
                    {Math.round((truth.totalPaid / truth.currentExpectedCost) * 100)}% of expected
                  </p>
                )}
              </div>
            </div>

            {/* Remaining expected */}
            {truth.currentExpectedCost && (
              <div className="p-3 rounded-lg bg-surface-alt">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Remaining expected</span>
                  <span className="text-lg font-bold text-text-primary">
                    {formatCurrency(truth.currentExpectedCost - truth.totalPaid)}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (truth.totalPaid / truth.currentExpectedCost) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Paid: {formatCurrency(truth.totalPaid)}</span>
                  <span>Remaining: {formatCurrency(truth.currentExpectedCost - truth.totalPaid)}</span>
                </div>
              </div>
            )}

            {/* Why Budget Changed */}
            {hasChange && truth.budgetChanges.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">Why the budget changed</h3>
                <div className="space-y-2">
                  {truth.budgetChanges.map(change => (
                    <div key={change.id} className="flex items-center justify-between p-2 rounded-md bg-surface-alt">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          change.type === "change_impact" ? "bg-amber-500"
                            : change.type === "escalation" ? "bg-red-500"
                              : change.type === "site_condition" ? "bg-orange-500"
                                : "bg-blue-500"
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{change.title}</p>
                          <p className="text-xs text-text-muted">
                            {change.confidence} confidence · {change.source}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-red-600">
                        +{formatCurrency(change.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasChange && truth.budgetChanges.length === 0 && (
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  Budget has changed by {formatCurrency(Math.abs(truth.budgetChangeFromOriginal!))} but no
                  budget events explain the change yet. Add budget events to explain why.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SiteContextCard({ siteContext }: { siteContext: SiteContext | null }) {
  if (!siteContext) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Site Context</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <MapPin className="h-10 w-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No site context recorded.</p>
            <p className="text-xs text-text-muted mt-1">Add site conditions to improve cost intelligence.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const factors = [
    { label: "Road Access", value: siteContext.roadAccess, icon: "🛣" },
    { label: "Vehicle Access", value: siteContext.vehicleAccess, icon: "🚚" },
    { label: "Water Supply", value: siteContext.waterAvailability, icon: "💧" },
    { label: "Site Level", value: siteContext.siteLevel, icon: "📐" },
    { label: "Soil Type", value: siteContext.soilType, icon: "🏗" },
    { label: "Water Table", value: siteContext.waterTableDepth, icon: "⬇️" },
  ].filter(f => f.value && f.value !== "unknown");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Site Context</h2>
        </div>
      </CardHeader>
      <CardContent>
        {factors.length === 0 ? (
          <p className="text-sm text-text-muted">No site conditions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {factors.map(f => (
                <div key={f.label} className="p-2 rounded-md bg-surface-alt">
                  <div className="flex items-center gap-1">
                    <span>{f.icon}</span>
                    <span className="text-xs text-text-muted">{f.label}</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary capitalize">
                    {(f.value ?? "").replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
            {siteContext.basementRequired && (
              <div className="p-2 rounded-md bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800 font-medium">⚠ Basement required — may affect foundation cost</p>
              </div>
            )}
            {siteContext.accessDistanceM && (
              <p className="text-xs text-text-muted">
                {siteContext.accessDistanceM}m from main road
              </p>
            )}
            {siteContext.costRiskNotes && (
              <div className="p-2 rounded-md bg-surface-alt">
                <p className="text-xs text-text-muted mb-1">Engineer notes:</p>
                <p className="text-sm text-text-primary">{siteContext.costRiskNotes}</p>
              </div>
            )}
            <p className="text-xs text-text-muted italic">
              Site conditions affect construction cost and risk. These are engineer-entered observations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeRequestCard({ changes }: { changes: ChangeRequest[] }) {
  const statusColors: Record<string, string> = {
    proposed: "bg-gray-100 text-gray-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Change Requests</h2>
          </div>
          <span className="text-sm text-text-muted">{changes.length} total</span>
        </div>
      </CardHeader>
      <CardContent>
        {changes.length === 0 ? (
          <div className="text-center py-6">
            <Layers className="h-10 w-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No change requests recorded yet.</p>
            <p className="text-xs text-text-muted mt-1">
              When design changes occur, record them here to track cost impact.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {changes.map(change => (
              <div key={change.id} className="p-3 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-text-primary">{change.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[change.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {change.status.replace(/_/g, " ")}
                  </span>
                </div>
                {change.description && (
                  <p className="text-xs text-text-secondary mb-2">{change.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  {change.estimatedCostLow && (
                    <span>
                      Est: {formatCurrency(change.estimatedCostLow)}
                      {change.estimatedCostHigh ? ` – ${formatCurrency(change.estimatedCostHigh)}` : ""}
                    </span>
                  )}
                  {change.timelineImpactDays && (
                    <span>⏱ +{change.timelineImpactDays} days</span>
                  )}
                  <span className="capitalize">{change.category.replace(/_/g, " ")}</span>
                </div>
                {change.rationale && (
                  <p className="text-xs text-text-muted mt-1 italic">Why: {change.rationale}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UnifiedTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Project Truth Timeline</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Clock className="h-10 w-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No events recorded yet.</p>
            <p className="text-xs text-text-muted mt-1">As inspections, evidence, issues, and budget events are recorded, they will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Project Truth Timeline</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {["budget", "change", "inspection", "issue", "evidence"].map(type => (
              <span key={type} className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getEventColor(type)}`}>
                {getEventIcon(type)}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getTimelineIconColor(event.type)} text-white`}>
                  {getEventIcon(event.type)}
                </div>

                {/* Event content */}
                <div className={`flex-1 p-3 rounded-lg border ${getEventColor(event.type)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs mt-1 opacity-80">{event.description}</p>
                      )}
                    </div>
                    <span className="text-xs opacity-70 whitespace-nowrap ml-2">
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs opacity-70">
                    {event.amount !== undefined && (
                      <span className="font-medium">
                        {event.amount >= 0 ? "+" : ""}{formatCurrency(event.amount)}
                      </span>
                    )}
                    {event.confidence && (
                      <span>{event.confidence} confidence</span>
                    )}
                    {event.category && (
                      <span className="capitalize">{event.category.replace(/_/g, " ")}</span>
                    )}
                    {event.status && (
                      <span className="capitalize">{event.status.replace(/_/g, " ")}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskIntelligenceCard({ risk, attentionScore }: { risk: ProjectTruth["latestRisk"]; attentionScore: ProjectTruth["attentionScore"] }) {
  const riskColor = risk
    ? risk.riskCategory === "low" ? "text-green-600"
      : risk.riskCategory === "medium" ? "text-amber-600"
        : risk.riskCategory === "high" ? "text-orange-600"
          : "text-red-600"
    : "text-text-muted";

  let explanations: Array<{ factor: string; description: string; severity: string }> = [];
  if (risk?.explanation) {
    try { explanations = JSON.parse(risk.explanation); } catch { /* ignore */ }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Risk Intelligence</h2>
          <span className="text-xs px-2 py-0.5 bg-surface-alt rounded-full text-text-muted">
            risk-engine-v1
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Risk Score</p>
            <p className={`text-2xl font-bold ${riskColor}`}>
              {risk ? `${risk.overallRisk}/100` : "—"}
            </p>
            {risk && <p className="text-xs text-text-muted capitalize">{risk.riskCategory} risk</p>}
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Attention</p>
            <p className={`text-2xl font-bold ${
              attentionScore.level === "high" ? "text-red-600"
                : attentionScore.level === "medium" ? "text-amber-600"
                  : "text-green-600"
            }`}>
              {attentionScore.score}/100
            </p>
            <p className="text-xs text-text-muted capitalize">{attentionScore.level}</p>
          </div>
        </div>

        {risk && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Data confidence</span>
              <span className="font-medium text-text-primary">{risk.dataConfidence}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-alt rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: `${risk.dataConfidence}%` }} />
            </div>
          </div>
        )}

        {attentionScore.reasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide">What needs attention</h4>
            {attentionScore.reasons.map((reason, i) => (
              <div key={i} className={`p-2 rounded-md text-xs ${
                reason.severity === "critical" ? "bg-red-50 text-red-800"
                  : reason.severity === "warning" ? "bg-amber-50 text-amber-800"
                    : "bg-blue-50 text-blue-800"
              }`}>
                {reason.description}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-text-muted italic mt-3">
          Rule-based prediction — not an ML model. Engine: risk-engine-v1
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ProjectTruthPage() {
  const [truth, setTruth] = useState<ProjectTruth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; status: string }>>([]);

  // Fetch projects list
  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch project truth when a project is selected
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetch(`/api/projects/${selectedProjectId}/truth`)
      .then(r => r.json())
      .then(data => {
        setTruth(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedProjectId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/engineer" className="flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Project Truth</h1>
            <p className="text-sm text-text-muted mt-1">
              Every important construction event — linked to evidence, progress, and money.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
              LIVE DATA
            </span>
          </div>
        </div>
      </div>

      {/* Project selector */}
      {projects.length > 1 && (
        <div className="mb-6">
          <label className="text-xs text-text-muted mb-1 block">Select project</label>
          <div className="flex gap-2 flex-wrap">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedProjectId === p.id
                    ? "bg-primary text-white"
                    : "bg-surface-alt text-text-primary hover:bg-surface"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-text-muted mt-3">Loading project truth...</p>
        </div>
      ) : !truth ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-10 w-10 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">Select a project to view its Project Truth.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Project header bar */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{truth.project.name}</h2>
                  <p className="text-sm text-text-muted flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {truth.project.address}{truth.project.city ? `, ${truth.project.city}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Stage: </span>
                    <span className="font-medium text-text-primary">
                      {CONSTRUCTION_STAGES.find(s => s.value === truth.project.currentStage)?.label ?? truth.project.currentStage ?? "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Progress: </span>
                    <span className="font-medium text-text-primary">{truth.project.progress}%</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Area: </span>
                    <span className="font-medium text-text-primary">{truth.project.builtArea ?? "—"} sq ft</span>
                  </div>
                  <StatusBadge status={truth.project.status} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── EVIDENCE CHAIN VISUALIZATION ─────────────────────────────── */}
          <Card>
            <CardContent className="py-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Evidence Chain</p>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {[
                  { label: "Plan", active: truth.truth.originalEstimate !== null, icon: "📋" },
                  { label: "Quote", active: truth.truth.originalEstimate !== null, icon: "📄" },
                  { label: "Site", active: truth.siteContext !== null, icon: "🏗" },
                  { label: "Evidence", active: truth.counts.photos > 0 || truth.counts.inspections > 0, icon: "📷" },
                  { label: "Change", active: truth.changeRequests.length > 0, icon: "🔄" },
                  { label: "Money", active: truth.truth.totalPaid > 0, icon: "💰" },
                  { label: "Truth", active: true, icon: "✅" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${
                      step.active ? "bg-primary/10" : "bg-surface-alt opacity-50"
                    }`}>
                      <span className="text-sm">{step.icon}</span>
                      <span className={`text-[10px] font-medium ${step.active ? "text-primary" : "text-text-muted"}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < 6 && (
                      <span className={`text-xs mx-0.5 ${step.active ? "text-primary" : "text-text-muted"}`}>→</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-1">Every linked event strengthens the evidence chain. Unlinked steps indicate data gaps.</p>
            </CardContent>
          </Card>

          {/* PLAN → PROGRESS → CHANGE → MONEY → RISK flow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Budget Story */}
              <BudgetStoryCard truth={truth.truth} project={truth.project} />

              {/* Change Requests */}
              <ChangeRequestCard changes={truth.changeRequests} />

              {/* Timeline */}
              <UnifiedTimeline events={truth.timeline} />
            </div>

            {/* Side column */}
            <div className="space-y-6">
              {/* Risk Intelligence */}
              <RiskIntelligenceCard risk={truth.latestRisk} attentionScore={truth.attentionScore} />

              {/* Site Context */}
              <SiteContextCard siteContext={truth.siteContext} />

              {/* Quick stats */}
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-text-primary">Project Evidence</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 rounded-md bg-surface-alt">
                      <p className="text-lg font-bold text-text-primary">{truth.counts.inspections}</p>
                      <p className="text-xs text-text-muted">Inspections</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-surface-alt">
                      <p className="text-lg font-bold text-text-primary">{truth.counts.photos}</p>
                      <p className="text-xs text-text-muted">Photos</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-surface-alt">
                      <p className="text-lg font-bold text-text-primary">{truth.counts.issues}</p>
                      <p className="text-xs text-text-muted">Issues</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-surface-alt">
                      <p className="text-lg font-bold text-text-primary">{truth.workforce.totalWorkers}</p>
                      <p className="text-xs text-text-muted">Workers</p>
                    </div>
                  </div>

                  {truth.project.homeownerName && (
                    <div className="mt-3 p-2 rounded-md bg-surface-alt">
                      <p className="text-xs text-text-muted">Homeowner</p>
                      <p className="text-sm font-medium text-text-primary">{truth.project.homeownerName}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* How this works */}
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-text-muted">
                      <p className="font-medium text-text-primary mb-1">How Project Truth works</p>
                      <p>Every inspection, evidence upload, budget event, and change request is recorded and linked. This creates an evidence trail connecting what was planned, what actually happened, and how it affected the budget.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

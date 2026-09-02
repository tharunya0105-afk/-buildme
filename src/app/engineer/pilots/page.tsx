"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Rocket, Plus, ChevronRight, Calendar, User, MapPin,
  BarChart3, CheckCircle, Clock, AlertTriangle, Target,
  TrendingUp, MessageSquare, Ruler, FileText, ArrowRight,
  Activity, Star, X, Brain, Database, Shield, Lightbulb,
  HelpCircle, Zap, Cpu, GitBranch, Award, Search,
  ClipboardCheck, Camera, Eye,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Pilot {
  id: string;
  projectId: string;
  participantName: string | null;
  participantRole: string | null;
  customerSegment: string | null;
  status: string;
  hypothesis: string | null;
  objectives: string;
  startDate: string | null;
  endDate: string | null;
  expectedEndDate: string | null;
  durationDays: number | null;
  baselineProcess: string | null;
  outcome: string | null;
  outcomeNotes: string | null;
  notes: string | null;
  createdAt: string;
  project: { id: string; name: string; city: string | null; status: string; progress: number; currentStage: string | null };
  measurements: { id: string; category: string; metricName: string; baselineValue: number | null; currentValue: number | null; unit: string | null; notes: string | null }[];
  feedback: { id: string; rating: number | null; category: string; feedback: string }[];
  _count: { measurements: number; feedback: number };
}

interface Analytics {
  featureUsage: Record<string, number>;
  totalEvents: number;
  activeProjects: number;
  pilotStats: { total: number; planned: number; active: number; completed: number };
  validation: { interviews: number; experiments: number; feedback: number; willingnessToTry: number; willingnessToPay: number; problemConfirmed: number };
}

interface Project { id: string; name: string; city: string | null; status: string; progress: number }

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const LIFECYCLE_STEPS = [
  { key: "prospect", label: "Prospect", icon: Search },
  { key: "selected", label: "Selected", icon: User },
  { key: "onboarding", label: "Onboarding", icon: ClipboardCheck },
  { key: "baseline", label: "Baseline", icon: Ruler },
  { key: "active", label: "Active Pilot", icon: Rocket },
  { key: "midpoint", label: "Midpoint Review", icon: Eye },
  { key: "completed", label: "Final Review", icon: CheckCircle },
  { key: "validated", label: "Validated", icon: Award },
];

const OBJECTIVES = [
  { key: "reporting", label: "Reduce reporting effort", icon: FileText },
  { key: "inspections", label: "Improve inspection tracking", icon: ClipboardCheck },
  { key: "evidence", label: "Improve evidence organization", icon: Camera },
  { key: "issues", label: "Improve issue follow-up", icon: AlertTriangle },
  { key: "visibility", label: "Improve project visibility", icon: Eye },
  { key: "recommendations", label: "Test recommendation usefulness", icon: Target },
  { key: "wtp", label: "Test willingness to pay", icon: TrendingUp },
];

const BASELINE_CATEGORIES = [
  { key: "reporting_time", label: "Reporting time", unit: "hours/week", category: "workflow" },
  { key: "inspection_time", label: "Inspection admin time", unit: "hours/week", category: "workflow" },
  { key: "issue_time", label: "Issue follow-up time", unit: "hours/week", category: "workflow" },
  { key: "communication_time", label: "Homeowner communication time", unit: "hours/week", category: "workflow" },
  { key: "active_projects", label: "Active projects managed", unit: "count", category: "operations" },
  { key: "inspections_per_week", label: "Inspections per week", unit: "count", category: "operations" },
  { key: "overdue_inspections", label: "Overdue inspections", unit: "count", category: "quality" },
  { key: "unresolved_issues", label: "Unresolved issues", unit: "count", category: "quality" },
  { key: "evidence_gaps", label: "Evidence gaps", unit: "count", category: "quality" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  prospect: { label: "Prospect", color: "text-text-muted", bg: "bg-surface-alt" },
  selected: { label: "Selected", color: "text-primary", bg: "bg-primary/10" },
  onboarding: { label: "Onboarding", color: "text-status-attention", bg: "bg-status-attention-bg" },
  baseline: { label: "Baseline", color: "text-status-attention", bg: "bg-status-attention-bg" },
  active: { label: "Active", color: "text-status-normal", bg: "bg-status-normal-bg" },
  midpoint: { label: "Midpoint", color: "text-status-attention", bg: "bg-status-attention-bg" },
  completed: { label: "Completed", color: "text-primary", bg: "bg-primary/10" },
  validated: { label: "Validated", color: "text-status-normal", bg: "bg-status-normal-bg" },
  paused: { label: "Paused", color: "text-text-muted", bg: "bg-surface-alt" },
  stopped: { label: "Stopped", color: "text-status-review", bg: "bg-status-review-bg" },
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function LifecycleProgress({ status }: { status: string }) {
  const currentIdx = LIFECYCLE_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-1">
      {LIFECYCLE_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium ${
              current ? "bg-primary text-white" : done ? "bg-status-normal-bg text-status-normal" : "bg-surface-alt text-text-muted"
            }`}>
              <step.icon className="h-2.5 w-2.5" />
              <span className="hidden md:inline">{step.label}</span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-text-muted mx-0.5 flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function BeforeAfterTable({ measurements }: { measurements: Pilot["measurements"] }) {
  if (measurements.length === 0) {
    return (
      <div className="p-4 rounded bg-surface-alt text-center">
        <Ruler className="h-6 w-6 text-text-muted mx-auto mb-2" />
        <p className="text-xs text-text-secondary">No measurements recorded yet.</p>
        <p className="text-[10px] text-text-muted">Baseline and current values will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 text-text-muted font-medium">Metric</th>
            <th className="text-right py-2 text-text-muted font-medium">Baseline</th>
            <th className="text-right py-2 text-text-muted font-medium">Current</th>
            <th className="text-right py-2 text-text-muted font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((m) => {
            const change = m.baselineValue != null && m.currentValue != null
              ? m.currentValue - m.baselineValue
              : null;
            const pctChange = m.baselineValue && m.baselineValue !== 0 && change !== null
              ? Math.round((change / m.baselineValue) * 100)
              : null;
            return (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="py-2 text-text-primary">{m.metricName.replace(/_/g, " ")}</td>
                <td className="py-2 text-right text-text-secondary">{m.baselineValue ?? "—"} {m.unit}</td>
                <td className="py-2 text-right text-text-secondary">{m.currentValue ?? "—"} {m.unit}</td>
                <td className={`py-2 text-right font-medium ${change !== null ? (change < 0 ? "text-status-normal" : change > 0 ? "text-status-review" : "text-text-muted") : "text-text-muted"}`}>
                  {change !== null ? `${change > 0 ? "+" : ""}${change}` : "—"}
                  {pctChange !== null && ` (${pctChange > 0 ? "+" : ""}${pctChange}%)`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function PilotsPage() {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeSection, setActiveSection] = useState<"dashboard" | "pilots" | "baseline" | "evidence" | "learning">("dashboard");
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);
  const [form, setForm] = useState({
    projectId: "", participantName: "", participantRole: "", customerSegment: "",
    hypothesis: "", objectives: [] as string[], startDate: "", expectedEndDate: "",
    durationDays: "", baselineProcess: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/pilots").then(r => r.json()),
      fetch("/api/analytics").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]).then(([pilotData, analyticsData, projectData]) => {
      setPilots(pilotData.pilots || []);
      setAnalytics(analyticsData);
      setProjects(Array.isArray(projectData) ? projectData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createPilot = async () => {
    if (!form.projectId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/pilots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId, participantName: form.participantName || null,
          participantRole: form.participantRole || null, customerSegment: form.customerSegment || null,
          hypothesis: form.hypothesis || null, objectives: JSON.stringify(form.objectives),
          startDate: form.startDate || null, expectedEndDate: form.expectedEndDate || null,
          durationDays: form.durationDays ? parseInt(form.durationDays) : null,
          baselineProcess: form.baselineProcess || null, notes: form.notes || null,
          status: "selected",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPilots(prev => [data.pilot, ...prev]);
        setShowCreate(false);
        setForm({ projectId: "", participantName: "", participantRole: "", customerSegment: "", hypothesis: "", objectives: [], startDate: "", expectedEndDate: "", durationDays: "", baselineProcess: "", notes: "" });
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const updatePilotStatus = async (pilotId: string, status: string) => {
    try {
      const res = await fetch(`/api/pilots/${pilotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPilots(prev => prev.map(p => p.id === pilotId ? { ...p, status } : p));
      }
    } catch { /* ignore */ }
  };

  const stats = useMemo(() => ({
    total: pilots.length,
    prospect: pilots.filter(p => p.status === "prospect").length,
    selected: pilots.filter(p => p.status === "selected").length,
    onboarding: pilots.filter(p => p.status === "onboarding").length,
    baseline: pilots.filter(p => p.status === "baseline").length,
    active: pilots.filter(p => p.status === "active").length,
    completed: pilots.filter(p => p.status === "completed").length,
    validated: pilots.filter(p => p.status === "validated").length,
    totalMeasurements: pilots.reduce((sum, p) => sum + p._count.measurements, 0),
    totalFeedback: pilots.reduce((sum, p) => sum + p._count.feedback, 0),
    withHypothesis: pilots.filter(p => p.hypothesis).length,
    withBaseline: pilots.filter(p => p.measurements.some(m => m.baselineValue != null)).length,
  }), [pilots]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-text-secondary">
        <Brain className="h-5 w-5 animate-pulse text-primary" />
        <span>Loading pilot control center...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Rocket className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-text-primary">Pilot Control Center</h2>
          </div>
          <p className="text-sm text-text-secondary">Recruit → Onboard → Baseline → Pilot → Measure → Learn</p>
          <p className="text-[10px] text-text-muted mt-1">
            {stats.total} pilots · {stats.active} active · {stats.totalMeasurements} measurements · {stats.totalFeedback} feedback
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />New Pilot</Button>
      </div>

      {/* Section Nav */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
          { key: "pilots" as const, label: "Pilots", icon: Rocket },
          { key: "baseline" as const, label: "Baseline", icon: Ruler },
          { key: "evidence" as const, label: "Evidence", icon: FileText },
          { key: "learning" as const, label: "Learning", icon: Brain },
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

      {/* ─── DASHBOARD ──────────────────────────────────────────── */}
      {activeSection === "dashboard" && (
        <div className="space-y-6">
          {/* Lifecycle Stats */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {LIFECYCLE_STEPS.map((step) => {
              const count = pilots.filter(p => p.status === step.key).length;
              return (
                <div key={step.key} className="text-center p-2 rounded border border-border bg-surface">
                  <step.icon className="h-4 w-4 text-text-muted mx-auto mb-1" />
                  <p className="text-lg font-bold text-text-primary">{count}</p>
                  <p className="text-[8px] text-text-muted">{step.label}</p>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                <p className="text-[9px] text-text-muted">Total Pilots</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold text-status-normal">{stats.active}</p>
                <p className="text-[9px] text-text-muted">Active Pilots</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalMeasurements}</p>
                <p className="text-[9px] text-text-muted">Measurements</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold text-status-attention">{stats.totalFeedback}</p>
                <p className="text-[9px] text-text-muted">Feedback</p>
              </CardContent>
            </Card>
          </div>

          {/* EIR Milestone Progress */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">EIR Milestone Progress</h3>
              <p className="text-[10px] text-text-muted">Stage 1 Targets (Months 1–3)</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: "Customer interviews", actual: analytics?.validation.problemConfirmed || 0, target: 10 },
                  { label: "Pilot engineers", actual: stats.total, target: 3 },
                  { label: "Active pilots", actual: stats.active, target: 2 },
                  { label: "Pilots with baseline", actual: stats.withBaseline, target: 2 },
                  { label: "Pilots with hypothesis", actual: stats.withHypothesis, target: 2 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-text-secondary">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (item.actual / item.target) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-medium text-text-primary w-12 text-right">{item.actual} / {item.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* First Pilot Checklist */}
          {pilots.length === 0 && (
            <Card className="border-primary/20">
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">First Pilot Checklist</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    "Recruit 2–3 civil engineers in Trichy",
                    "Define pilot hypothesis with each engineer",
                    "Select 3–5 active construction projects",
                    "Record baseline workflow metrics",
                    "Configure BuildMe for pilot projects",
                    "Run BuildMe for 14–21 days",
                    "Collect structured engineer feedback",
                    "Measure post-pilot outcomes",
                    "Compare before/after metrics",
                    "Document pilot evidence report",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded border border-border bg-surface-alt">
                      <span className="text-[10px] text-text-muted font-mono w-4">{i + 1}</span>
                      <span className="text-xs text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── PILOTS LIST ────────────────────────────────────────── */}
      {activeSection === "pilots" && (
        <div className="space-y-4">
          {pilots.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-text-primary mb-1">No pilots created yet.</p>
                <p className="text-xs text-text-muted mb-4">Create your first pilot to start measuring BuildMe&apos;s real-world impact.</p>
                <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Create First Pilot</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pilots.map(pilot => {
                const config = STATUS_CONFIG[pilot.status] || STATUS_CONFIG.prospect;
                const daysActive = pilot.startDate
                  ? Math.floor(((pilot.endDate ? new Date(pilot.endDate) : new Date()).getTime() - new Date(pilot.startDate).getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const objectives: string[] = (() => { try { return JSON.parse(pilot.objectives || "[]"); } catch { return []; } })();

                return (
                  <div key={pilot.id} className="cursor-pointer" onClick={() => setSelectedPilot(pilot)}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                            <h3 className="text-sm font-semibold text-text-primary">{pilot.project.name}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-text-muted">
                            {pilot.participantName && <span className="flex items-center gap-1"><User className="h-3 w-3" />{pilot.participantName}</span>}
                            {pilot.project.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{pilot.project.city}</span>}
                            {daysActive !== null && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{daysActive} days</span>}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      </div>
                      {pilot.hypothesis && (
                        <p className="text-[10px] text-primary mt-1 italic">&ldquo;{pilot.hypothesis}&rdquo;</p>
                      )}
                      {objectives.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {objectives.map((obj) => {
                            const objDef = OBJECTIVES.find(o => o.key === obj);
                            return (
                              <span key={obj} className="text-[8px] px-1.5 py-0.5 rounded bg-surface-alt text-text-muted">
                                {objDef?.label || obj}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <LifecycleProgress status={pilot.status} />
                    </CardContent>
                  </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── BASELINE ──────────────────────────────────────────── */}
      {activeSection === "baseline" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Baseline Collection</h3>
              <p className="text-[10px] text-text-muted">Record pre-BuildMe workflow metrics for each pilot</p>
            </CardHeader>
            <CardContent>
              {pilots.length === 0 ? (
                <div className="p-4 rounded bg-surface-alt text-center">
                  <p className="text-xs text-text-secondary">No pilots to collect baseline for.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pilots.filter(p => p.status !== "prospect").map(pilot => {
                    const baselineMeasurements = pilot.measurements.filter(m => m.baselineValue != null);
                    return (
                      <div key={pilot.id} className="p-3 rounded border border-border bg-surface">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-xs font-semibold text-text-primary">{pilot.project.name}</h4>
                            <p className="text-[9px] text-text-muted">{pilot.participantName || "Unknown participant"}</p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded ${
                            baselineMeasurements.length > 0 ? "bg-status-normal-bg text-status-normal" : "bg-status-attention-bg text-status-attention"
                          }`}>
                            {baselineMeasurements.length} / {BASELINE_CATEGORIES.length} metrics
                          </span>
                        </div>
                        {baselineMeasurements.length > 0 ? (
                          <div className="grid grid-cols-3 gap-1">
                            {baselineMeasurements.map((m) => (
                              <div key={m.id} className="text-[9px] p-1 rounded bg-surface-alt">
                                <span className="text-text-muted">{m.metricName.replace(/_/g, " ")}:</span>
                                <span className="font-medium text-text-primary ml-1">{m.baselineValue} {m.unit}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] text-text-muted">No baseline metrics recorded yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Baseline Categories Reference */}
          <Card>
            <CardHeader>
              <h3 className="text-xs font-semibold text-text-primary">Baseline Metrics Reference</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {BASELINE_CATEGORIES.map((cat) => (
                  <div key={cat.key} className="p-2 rounded border border-border bg-surface text-[9px]">
                    <span className="text-text-primary font-medium">{cat.label}</span>
                    <span className="text-text-muted ml-1">({cat.unit})</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-text-muted mt-2">
                Source types: measured, system-derived, self-reported, interview, estimate.
                Self-reported values are labelled accordingly.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── EVIDENCE ──────────────────────────────────────────── */}
      {activeSection === "evidence" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Before / After Dashboard</h3>
              <p className="text-[10px] text-text-muted">Measured changes from pilot participation</p>
            </CardHeader>
            <CardContent>
              {pilots.filter(p => p.measurements.length > 0).length === 0 ? (
                <div className="p-4 rounded bg-surface-alt text-center">
                  <BarChart3 className="h-6 w-6 text-text-muted mx-auto mb-2" />
                  <p className="text-xs text-text-secondary font-medium">NOT MEASURED</p>
                  <p className="text-[10px] text-text-muted">Before/after data will appear when pilots have baseline and current measurements.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pilots.filter(p => p.measurements.length > 0).map(pilot => (
                    <div key={pilot.id}>
                      <h4 className="text-xs font-semibold text-text-primary mb-2">{pilot.project.name}</h4>
                      <BeforeAfterTable measurements={pilot.measurements} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pilot Evidence Report */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Pilot Evidence Report</h3>
            </CardHeader>
            <CardContent>
              {pilots.length === 0 ? (
                <div className="p-4 rounded bg-surface-alt text-center">
                  <p className="text-xs text-text-secondary">No pilots to report on.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pilots.map(pilot => (
                    <div key={pilot.id} className="p-3 rounded border border-border bg-surface">
                      <h4 className="text-xs font-semibold text-text-primary mb-1">{pilot.project.name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        <div><span className="text-text-muted">Participant:</span> <span className="text-text-primary">{pilot.participantName || "—"}</span></div>
                        <div><span className="text-text-muted">Segment:</span> <span className="text-text-primary">{pilot.customerSegment || "—"}</span></div>
                        <div><span className="text-text-muted">Status:</span> <span className="text-text-primary">{STATUS_CONFIG[pilot.status]?.label || pilot.status}</span></div>
                        <div><span className="text-text-muted">Duration:</span> <span className="text-text-primary">{pilot.startDate ? `${Math.floor((Date.now() - new Date(pilot.startDate).getTime()) / 86400000)} days` : "—"}</span></div>
                        <div><span className="text-text-muted">Measurements:</span> <span className="text-text-primary">{pilot._count.measurements}</span></div>
                        <div><span className="text-text-muted">Feedback:</span> <span className="text-text-primary">{pilot._count.feedback}</span></div>
                        <div className="col-span-2"><span className="text-text-muted">Hypothesis:</span> <span className="text-text-primary italic">{pilot.hypothesis || "—"}</span></div>
                        <div className="col-span-2"><span className="text-text-muted">Outcome:</span> <span className="text-text-primary">{pilot.outcome || "—"}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── LEARNING ──────────────────────────────────────────── */}
      {activeSection === "learning" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Product Decision Framework</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { decision: "CONTINUE", desc: "Evidence shows meaningful value", color: "bg-status-normal-bg text-status-normal" },
                  { decision: "MODIFY", desc: "Problem exists but product needs changes", color: "bg-status-attention-bg text-status-attention" },
                  { decision: "STOP", desc: "Hypothesis not supported", color: "bg-status-review-bg text-status-review" },
                  { decision: "INCONCLUSIVE", desc: "Insufficient evidence", color: "bg-surface-alt text-text-muted" },
                ].map((d) => (
                  <div key={d.decision} className={`p-3 rounded border border-border ${d.color}`}>
                    <p className="text-xs font-semibold">{d.decision}</p>
                    <p className="text-[9px] opacity-75">{d.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-text-muted mt-2">Never force a positive result. Evidence determines the decision.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">BuildMe Learning Loop</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 overflow-x-auto py-2">
                {[
                  { label: "Interviews", icon: MessageSquare },
                  { label: "Pilot Selection", icon: User },
                  { label: "Onboarding", icon: ClipboardCheck },
                  { label: "Baseline", icon: Ruler },
                  { label: "Real Usage", icon: Activity },
                  { label: "Recommendations", icon: Target },
                  { label: "Outcomes", icon: TrendingUp },
                  { label: "Feedback", icon: Star },
                  { label: "Validation", icon: Award },
                  { label: "ML Data", icon: Database },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center gap-1 px-2 py-1.5 rounded bg-surface-alt border border-border min-w-[60px] text-center">
                      <step.icon className="h-3.5 w-3.5 text-text-muted" />
                      <span className="text-[7px] font-medium text-text-muted text-center">{step.label}</span>
                    </div>
                    {i < 9 && <ChevronRight className="h-2.5 w-2.5 text-text-muted mx-0.5" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── PILOT DETAIL MODAL ─────────────────────────────────── */}
      {selectedPilot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{selectedPilot.project.name}</h3>
                <p className="text-xs text-text-muted">{selectedPilot.participantName || "Unknown participant"}</p>
              </div>
              <button onClick={() => setSelectedPilot(null)} className="text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Lifecycle */}
              <LifecycleProgress status={selectedPilot.status} />

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                {["onboarding", "baseline", "active", "midpoint", "completed", "validated", "stopped"].map((s) => (
                  <button
                    key={s}
                    onClick={() => updatePilotStatus(selectedPilot.id, s)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                      selectedPilot.status === s
                        ? "border-primary bg-primary text-white"
                        : "border-border text-text-muted hover:border-primary hover:text-primary"
                    }`}
                  >
                    {STATUS_CONFIG[s]?.label || s}
                  </button>
                ))}
              </div>

              {/* Hypothesis */}
              <div className="p-3 rounded bg-primary/5 border border-primary/20">
                <p className="text-[10px] font-semibold text-primary mb-1">HYPOTHESIS</p>
                <p className="text-xs text-text-primary italic">{selectedPilot.hypothesis || "No hypothesis defined"}</p>
              </div>

              {/* Before/After */}
              <div>
                <h4 className="text-xs font-semibold text-text-primary mb-2">Before / After</h4>
                <BeforeAfterTable measurements={selectedPilot.measurements} />
              </div>

              {/* Feedback */}
              {selectedPilot.feedback.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-text-primary mb-2">Feedback ({selectedPilot.feedback.length})</h4>
                  <div className="space-y-2">
                    {selectedPilot.feedback.map((f) => (
                      <div key={f.id} className="p-2 rounded border border-border bg-surface text-[10px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary">{f.category}</span>
                          {f.rating && <span className="text-primary">{"/".repeat(f.rating)}</span>}
                        </div>
                        <p className="text-text-secondary">{f.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPilot.notes && (
                <div className="p-3 rounded bg-surface-alt">
                  <p className="text-[10px] font-semibold text-text-muted mb-1">NOTES</p>
                  <p className="text-xs text-text-secondary">{selectedPilot.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE PILOT MODAL ─────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Create New Pilot</h3>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Project *</label>
                <select value={form.projectId} onChange={e => setForm(prev => ({ ...prev, projectId: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value="">Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.city || "No city"})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Participant Name</label>
                  <input type="text" value={form.participantName} onChange={e => setForm(prev => ({ ...prev, participantName: e.target.value }))} placeholder="e.g., R. Kumar" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Role</label>
                  <select value={form.participantRole} onChange={e => setForm(prev => ({ ...prev, participantRole: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="">Select role</option>
                    <option value="civil_engineer">Civil Engineer</option>
                    <option value="contractor">Contractor</option>
                    <option value="site_supervisor">Site Supervisor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Customer Segment</label>
                <select value={form.customerSegment} onChange={e => setForm(prev => ({ ...prev, customerSegment: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value="">Select segment</option>
                  <option value="independent_engineer">Independent Engineer</option>
                  <option value="small_contractor">Small Contractor</option>
                  <option value="mid_size_firm">Mid-size Firm</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Primary Hypothesis *</label>
                <textarea value={form.hypothesis} onChange={e => setForm(prev => ({ ...prev, hypothesis: e.target.value }))} placeholder='e.g., "BuildMe reduces the time an engineer spends collecting project information."' rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <p className="text-[9px] text-text-muted mt-1">This remains HYPOTHESIS until measured during the pilot.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Objectives</label>
                <div className="grid grid-cols-2 gap-1">
                  {OBJECTIVES.map((obj) => (
                    <label key={obj.key} className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-[10px] ${
                      form.objectives.includes(obj.key) ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary"
                    }`}>
                      <input type="checkbox" checked={form.objectives.includes(obj.key)}
                        onChange={e => setForm(prev => ({
                          ...prev,
                          objectives: e.target.checked
                            ? [...prev.objectives, obj.key]
                            : prev.objectives.filter(o => o !== obj.key)
                        }))} className="rounded" />
                      {obj.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Duration (days)</label>
                  <input type="number" value={form.durationDays} onChange={e => setForm(prev => ({ ...prev, durationDays: e.target.value }))} placeholder="14" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Current Process (Before BuildMe)</label>
                <textarea value={form.baselineProcess} onChange={e => setForm(prev => ({ ...prev, baselineProcess: e.target.value }))} placeholder="How does the engineer currently manage this project?" rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional pilot context" rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={createPilot} disabled={!form.projectId || !form.hypothesis || creating}>
                {creating ? "Creating..." : "Create Pilot"}
              </Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

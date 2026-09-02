"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home, AlertTriangle, CheckCircle, Clock, Camera,
  MapPin, User, DollarSign, ArrowUpRight, Layers,
  Shield, Hammer, Info, MessageSquare, ChevronRight,
  TrendingUp, CircleDot,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
  progress: number;
  currentStage: string | null;
  updatedAt: string;
  engineer: { name: string; email: string };
  _count: { inspections: number; photos: number; issues: number; alerts: number };
  inspections: { inspectionDate: string; notes: string | null }[];
  photos: { id: string; fileUrl: string; createdAt: string }[];
  issues: { id: string; title: string; severity: string; status: string }[];
  timelineEvents: { id: string; type: string; title: string; description: string | null; createdAt: string }[];
  estimatedCost?: number | null;
}

interface BudgetData {
  originalEstimate: number | null;
  currentExpectedCost: number | null;
  totalPaid: number;
  budgetChangeFromOriginal: number | null;
  budgetChangePercentage: number | null;
  budgetChanges: Array<{
    id: string;
    title: string;
    amount: number;
    type: string;
    confidence: string;
    createdAt: string;
  }> | undefined;
  events: Array<{
    id: string;
    type: string;
    title: string;
    amount: number;
    createdAt: string;
  }> | undefined;
}

interface TruthData {
  project: {
    id: string;
    name: string;
    currentStage: string | null;
    progress: number;
    builtArea: number | null;
  };
  truth: {
    originalEstimate: number | null;
    currentExpectedCost: number | null;
    totalPaid: number;
    budgetChangeFromOriginal: number | null;
  };
  changeRequests: Array<{
    id: string;
    title: string;
    status: string;
    estimatedCostHigh: number | null;
    createdAt: string;
  }>;
  timeline: Array<{
    id: string;
    date: string;
    type: string;
    title: string;
    description: string | null;
  }>;
  workforce: {
    totalWorkers: number;
    checkedInToday: number;
    verifiedToday: number;
  };
}

const STAGE_LABELS: Record<string, string> = {
  planning: "Planning", foundation: "Foundation", structure: "Structure",
  brickwork: "Brickwork", roofing: "Roofing", electrical_plumbing: "Electrical/Plumbing",
  finishing: "Finishing", completed: "Completed",
};

const STAGE_EXPLANATIONS: Record<string, string> = {
  planning: "Your project is in the planning phase. Construction has not started yet.",
  foundation: "The foundation of your house is being built. This includes digging, concrete work, and base structure.",
  structure: "The main structure — columns, beams, and floor slabs — is being constructed.",
  brickwork: "Walls and partitions are being built with bricks or blocks.",
  roofing: "The roof slab and waterproofing work is in progress.",
  electrical_plumbing: "Electrical wiring and plumbing pipes are being installed.",
  finishing: "Flooring, painting, fixtures, and final touches are being completed.",
  completed: "Your house construction is complete!",
};

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ─── Question 1: How much was planned? ──────────────────────────────────────

function PlannedCostCard({ originalEstimate }: { originalEstimate: number | null }) {
  if (!originalEstimate) {
    return (
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg font-bold text-blue-700">1</span>
            </div>
            <h3 className="text-base font-semibold text-text-primary">How much was planned?</h3>
          </div>
          <p className="text-sm text-text-muted">Budget information not yet available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <span className="text-lg font-bold text-blue-700">1</span>
          </div>
          <h3 className="text-base font-semibold text-text-primary">How much was planned?</h3>
        </div>
        <p className="text-3xl font-bold text-text-primary">{formatCurrency(originalEstimate)}</p>
        <p className="text-xs text-text-muted mt-1">This was the original estimated cost when construction started.</p>
      </CardContent>
    </Card>
  );
}

// ─── Question 2: How much is expected now? ──────────────────────────────────

function ExpectedCostCard({ data }: { data: BudgetData }) {
  const hasChange = data.budgetChangeFromOriginal !== null && data.budgetChangeFromOriginal !== 0;
  const remaining = data.currentExpectedCost && data.totalPaid
    ? data.currentExpectedCost - data.totalPaid
    : null;

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <span className="text-lg font-bold text-amber-700">2</span>
          </div>
          <h3 className="text-base font-semibold text-text-primary">How much is expected now?</h3>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Planned</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(data.originalEstimate ?? 0)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Expected Now</p>
            <p className="text-lg font-bold text-text-primary">
              {data.currentExpectedCost ? formatCurrency(data.currentExpectedCost) : "—"}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Already Paid</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(data.totalPaid)}</p>
          </div>
        </div>

        {remaining !== null && remaining > 0 && (
          <div className="p-2 rounded-md bg-amber-50 border border-amber-200 mb-3">
            <p className="text-sm text-amber-800">
              <strong>Remaining expected:</strong> {formatCurrency(remaining)}
            </p>
          </div>
        )}

        {hasChange && (
          <div className="flex items-center gap-2 text-sm">
            <ArrowUpRight className="h-4 w-4 text-amber-600" />
            <span className="text-amber-700 font-medium">
              +{formatCurrency(Math.abs(data.budgetChangeFromOriginal!))} from original
              ({Math.abs(data.budgetChangePercentage ?? 0)}% increase)
            </span>
          </div>
        )}

        {!hasChange && data.originalEstimate && (
          <p className="text-sm text-green-700 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Budget is on track — no changes recorded.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Question 3: What changed? ──────────────────────────────────────────────

function WhatChangedCard({ data }: { data: BudgetData }) {
  const allEvents = data.events || data.budgetChanges || [];
  const changes = allEvents.filter((c: any) => c.type !== "payment" && c.amount > 0);

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
            <span className="text-lg font-bold text-orange-700">3</span>
          </div>
          <h3 className="text-base font-semibold text-text-primary">What changed?</h3>
        </div>

        {changes.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>No changes recorded yet. The project is following the original plan.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {changes.map(change => (
              <div key={change.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-alt border border-border">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    change.type === "change_impact" ? "bg-amber-500"
                      : change.type === "escalation" ? "bg-red-500"
                        : change.type === "site_condition" ? "bg-orange-500"
                          : "bg-blue-500"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{change.title}</p>
                    <p className="text-xs text-text-muted">
                      Reported by engineer
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-700">+{formatCurrency(change.amount)}</span>
              </div>
            ))}
            <p className="text-xs text-text-muted italic pt-1">
              Each change is linked to an engineer observation or request.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Question 4: What has actually been built? ──────────────────────────────

function ProgressCard({ project, truth }: { project: Project; truth: TruthData | null }) {
  const stage = project.currentStage || "planning";
  const explanation = STAGE_EXPLANATIONS[stage] || "Construction is in progress.";
  const recentPhotos = project.photos?.slice(0, 3) || [];
  const recentInspections = project.inspections?.slice(0, 2) || [];
  const todayCheckins = truth?.workforce?.checkedInToday ?? 0;

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <span className="text-lg font-bold text-green-700">4</span>
          </div>
          <h3 className="text-base font-semibold text-text-primary">What has actually been built?</h3>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-text-primary">
              {STAGE_LABELS[stage] || stage}
            </span>
            <span className="text-sm font-bold text-primary">{project.progress}%</span>
          </div>
          <div className="h-3 bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">{explanation}</p>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 rounded-md bg-surface-alt">
            <Camera className="h-4 w-4 text-text-muted mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{project._count.photos}</p>
            <p className="text-[10px] text-text-muted">Site Photos</p>
          </div>
          <div className="text-center p-2 rounded-md bg-surface-alt">
            <Hammer className="h-4 w-4 text-text-muted mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{todayCheckins}</p>
            <p className="text-[10px] text-text-muted">Workers Today</p>
          </div>
          <div className="text-center p-2 rounded-md bg-surface-alt">
            <Shield className="h-4 w-4 text-text-muted mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{project._count.inspections}</p>
            <p className="text-[10px] text-text-muted">Inspections</p>
          </div>
        </div>

        {/* Latest inspection */}
        {recentInspections.length > 0 && (
          <div className="p-2 rounded-md bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Latest inspection:</p>
            <p className="text-sm text-text-primary">
              {new Date(recentInspections[0].inspectionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {recentInspections[0].notes && ` — ${recentInspections[0].notes}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Question 5: What do I need to know today? ──────────────────────────────

function AttentionCard({ project, concerns }: { project: Project; concerns: Array<{ id: string; title: string; status: string; severity: string }> }) {
  const openIssues = (project.issues || []).filter(i => i.status !== "resolved");
  const unresolvedConcerns = concerns.filter(c => c.status !== "resolved");

  const items: Array<{ icon: React.ReactNode; text: string; color: string; action?: string }> = [];

  // Open issues
  openIssues.forEach(issue => {
    items.push({
      icon: <AlertTriangle className="h-4 w-4" />,
      text: issue.title,
      color: issue.severity === "critical" || issue.severity === "high"
        ? "bg-red-50 border-red-200 text-red-800"
        : "bg-amber-50 border-amber-200 text-amber-800",
    });
  });

  // Homeowner concerns
  unresolvedConcerns.forEach(concern => {
    items.push({
      icon: <MessageSquare className="h-4 w-4" />,
      text: `Your concern: ${concern.title}`,
      color: "bg-blue-50 border-blue-200 text-blue-800",
    });
  });

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <span className="text-lg font-bold text-red-700">5</span>
          </div>
          <h3 className="text-base font-semibold text-text-primary">What do I need to know today?</h3>
        </div>

        {items.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>Everything looks good. No immediate action needed.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${item.color}`}>
                {item.icon}
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function HomeownerHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [truthData, setTruthData] = useState<TruthData | null>(null);
  const [concerns, setConcerns] = useState<Array<{ id: string; title: string; status: string; severity: string }>>([]);
  const [showConcernForm, setShowConcernForm] = useState(false);
  const [concernForm, setConcernForm] = useState({ category: "other", title: "", description: "", severity: "medium" });
  const [submitting, setSubmitting] = useState(false);
  const [concernSuccess, setConcernSuccess] = useState(false);

  const CATEGORIES = [
    { value: "structural", label: "Structural" },
    { value: "water", label: "Water/Leakage" },
    { value: "electrical", label: "Electrical" },
    { value: "plumbing", label: "Plumbing" },
    { value: "material", label: "Material Quality" },
    { value: "delay", label: "Delay" },
    { value: "cost", label: "Cost" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch budget + truth for first project
  useEffect(() => {
    const project = projects[0];
    if (!project) return;

    fetch(`/api/projects/${project.id}/budget`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBudgetData(data); })
      .catch(() => {});

    fetch(`/api/projects/${project.id}/truth`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTruthData(data); })
      .catch(() => {});
  }, [projects]);

  // Fetch concerns
  useEffect(() => {
    fetch("/api/homeowner/concern")
      .then(r => r.json())
      .then(data => { if (data.issues) setConcerns(data.issues); })
      .catch(() => {});
  }, []);

  const submitConcern = async () => {
    const project = projects[0];
    if (!project || !concernForm.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/homeowner/concern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, ...concernForm }),
      });
      if (res.ok) {
        setConcernSuccess(true);
        setShowConcernForm(false);
        setConcernForm({ category: "other", title: "", description: "", severity: "medium" });
        const data = await fetch("/api/homeowner/concern").then(r => r.json());
        if (data.issues) setConcerns(data.issues);
        setTimeout(() => setConcernSuccess(false), 3000);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        <span className="ml-3 text-text-secondary">Loading your home...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-text-primary mb-1">My Home</h2>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Home className="h-8 w-8 text-text-muted" />}
              title="No projects assigned"
              description="Once your engineer assigns you to a construction project, it will appear here."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = projects[0]; // Primary project
  const stage = project.currentStage || "planning";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">My Home</h2>
          <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {project.name} — {project.address}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* 5-Question Truth Dashboard */}
      <PlannedCostCard originalEstimate={budgetData?.originalEstimate ?? project.estimatedCost ?? null} />

      {budgetData && <ExpectedCostCard data={budgetData} />}

      {budgetData && <WhatChangedCard data={budgetData} />}

      <ProgressCard project={project} truth={truthData} />

      <AttentionCard project={project} concerns={concerns} />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/homeowner/updates?projectId=${project.id}`}>
          <Button size="sm" variant="secondary">
            <Camera className="h-3 w-3 mr-1" />View Photos
          </Button>
        </Link>
        <Link href={`/homeowner/timeline?projectId=${project.id}`}>
          <Button size="sm" variant="secondary">
            <Clock className="h-3 w-3 mr-1" />Timeline
          </Button>
        </Link>
        <Button size="sm" variant="secondary" onClick={() => setShowConcernForm(true)}>
          <AlertTriangle className="h-3 w-3 mr-1" />Report a Concern
        </Button>
      </div>

      {/* Report Concern Modal */}
      {showConcernForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-1">Report a Concern</h3>
            <p className="text-sm text-text-muted mb-4">Project: {project.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                <select value={concernForm.category} onChange={e => setConcernForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">What is your concern? *</label>
                <input type="text" value={concernForm.title}
                  onChange={e => setConcernForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">More details</label>
                <textarea value={concernForm.description}
                  onChange={e => setConcernForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details"
                  rows={3}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">How serious?</label>
                <div className="flex gap-2">
                  {[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }].map(s => (
                    <button key={s.value} onClick={() => setConcernForm(prev => ({ ...prev, severity: s.value }))}
                      className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                        concernForm.severity === s.value ? "border-primary bg-primary/5 text-primary" : "border-border text-text-muted"
                      }`}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={submitConcern} disabled={!concernForm.title.trim() || submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              <Button variant="secondary" onClick={() => setShowConcernForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {concernSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Concern submitted. Your engineer will be notified.</span>
        </div>
      )}

      {/* Trust notice */}
      <div className="p-3 rounded-lg bg-surface-alt border border-border">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-text-muted">
            <strong>BuildMe</strong> records evidence and creates a transparent project story. Every budget change shows why it happened. GPS confirms device location — not physical work. Final decisions remain with your engineer and professionals.
          </p>
        </div>
      </div>
    </div>
  );
}

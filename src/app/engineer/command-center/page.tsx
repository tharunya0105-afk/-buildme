"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle, Clock, ChevronRight, ArrowRight, Brain,
  MapPin, Building2, Shield, Camera, Eye, FileText, Calendar,
  Target, Zap, BarChart3, Activity, Sparkles, X, ChevronDown,
  ChevronUp, ExternalLink, MessageSquare, ThumbsUp, ThumbsDown,
  Minus, TrendingUp, TrendingDown, RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface ProjectAttention {
  id: string;
  name: string;
  city: string | null;
  status: string;
  progress: number;
  currentStage: string | null;
  attentionScore: number;
  attentionLevel: "high" | "medium" | "low";
  reasons: string[];
  daysSinceInspection: number | null;
  openIssueCount: number;
  criticalIssueCount: number;
  hasPhotos: boolean;
  daysSincePhoto: number | null;
  updatedAt: string;
}

interface ActionItem {
  id: string;
  projectId: string;
  projectName: string;
  projectCity: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  signal: string;
  signalValue: string | null;
  source: string;
  href: string;
  status: string;
  outcome: string | null;
  completedNote: string | null;
  completedAt: string | null;
  dismissedReason: string | null;
  createdAt: string;
  hasFeedback: boolean;
}

interface CommandCenterData {
  date: string;
  engineer: string;
  summary: {
    totalProjects: number;
    projectsNeedingAttention: number;
    overdueInspections: number;
    criticalIssues: number;
    openIssues: number;
    evidenceGaps: number;
  };
  projects: ProjectAttention[];
  aiBrief: string;
  engineVersion: string;
  generatedAt: string;
}

interface ActionsData {
  actions: ActionItem[];
  todayCompleted: { id: string; title: string; outcome: string | null; completedAt: string | null }[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    dismissed: number;
    todayCompleted: number;
  };
  actionabilityRate: number | null;
  completionRate: number | null;
  feedbackCount: number;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  inspection: ClipboardCheck,
  issue: AlertTriangle,
  evidence: Camera,
  schedule: Calendar,
  workforce: Users,
  homeowner: MessageSquare,
};

const CATEGORY_LABELS: Record<string, string> = {
  inspection: "Inspection",
  issue: "Issue",
  evidence: "Evidence",
  schedule: "Schedule",
  workforce: "Workforce",
  homeowner: "Homeowner",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-status-review text-white",
  high: "bg-status-attention text-white",
  medium: "bg-primary/10 text-primary",
  low: "bg-status-normal-bg text-status-normal",
};

const PRIORITY_BORDER: Record<string, string> = {
  critical: "border-l-4 border-status-review",
  high: "border-l-4 border-status-attention",
  medium: "border-l-4 border-primary",
  low: "border-l-4 border-status-normal",
};

const OUTCOMES = [
  { value: "resolved", label: "Issue resolved" },
  { value: "completed", label: "Task completed" },
  { value: "no_issue", label: "No issue found" },
  { value: "escalated", label: "Escalated" },
  { value: "waiting", label: "Waiting for external party" },
  { value: "other", label: "Other" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ClipboardCheck(props: React.SVGProps<SVGSVGElement>) {
  return <FileText {...props} />;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Users(props: React.SVGProps<SVGSVGElement>) {
  return <Building2 {...props} />;
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}`}>
      {priority}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number | string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">{label}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectAttentionCard({ project }: { project: ProjectAttention }) {
  const levelColors = {
    high: "border-status-review-border bg-status-review-bg",
    medium: "border-status-attention-border bg-status-attention-bg",
    low: "border-status-normal-bg bg-status-normal-bg",
  };
  const levelIcons = { high: "🔴", medium: "🟡", low: "🟢" };

  return (
    <Link href={`/engineer/sites/${project.id}`}>
      <div className={`p-3 rounded-lg border ${levelColors[project.attentionLevel]} cursor-pointer hover:shadow-sm transition-shadow`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span>{levelIcons[project.attentionLevel]}</span>
            <div>
              <h4 className="text-sm font-semibold text-text-primary">{project.name}</h4>
              <p className="text-[10px] text-text-muted">{project.city || "No location"}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-text-primary">{project.attentionScore}</span>
            <p className="text-[9px] text-text-muted">attention</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {project.reasons.slice(0, 3).map((r, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/50 text-text-secondary">{r}</span>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span>{project.openIssueCount} open issues</span>
          <span>{project.daysSinceInspection !== null ? `${project.daysSinceInspection}d since inspection` : "No inspection"}</span>
        </div>
      </div>
    </Link>
  );
}

function ActionCard({
  action,
  onExpand,
  isExpanded,
  onRefresh,
}: {
  action: ActionItem;
  onExpand: () => void;
  isExpanded: boolean;
  onRefresh?: () => void;
}) {
  const Icon = CATEGORY_ICONS[action.category] || FileText;
  const timeAgo = getTimeAgo(action.createdAt);

  return (
    <div className={`rounded-lg border border-border bg-surface ${PRIORITY_BORDER[action.priority] || PRIORITY_BORDER.medium}`}>
      <div className="p-4 cursor-pointer" onClick={onExpand}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">
              <Icon className="h-4 w-4 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <PriorityBadge priority={action.priority} />
                <span className="text-[10px] text-text-muted uppercase">{CATEGORY_LABELS[action.category] || action.category}</span>
                {action.status !== "open" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt text-text-muted">
                    {action.status.replace("_", " ")}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-0.5">{action.title}</h4>
              <p className="text-xs text-text-secondary">{action.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                <span>{action.projectName}</span>
                <span>·</span>
                <span>Signal: {action.signal.replace(/_/g, " ")}</span>
                {action.signalValue && <><span>·</span><span>{action.signalValue}</span></>}
                <span>·</span>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {action.status === "completed" && <CheckCircle className="h-4 w-4 text-status-normal" />}
            {action.status === "dismissed" && <X className="h-4 w-4 text-text-muted" />}
            {action.status === "in_progress" && <Clock className="h-4 w-4 text-status-attention" />}
            {isExpanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
          </div>
        </div>
      </div>

      {isExpanded && <ActionDetail action={action} onRefresh={onRefresh} />}
    </div>
  );
}

function ActionDetail({ action, onRefresh }: { action: ActionItem; onRefresh?: () => void }) {
  const [status, setStatus] = useState(action.status);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(action.hasFeedback);

  const updateStatus = async (newStatus: string, extra: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/command-center/actions/${action.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.action.status);
        onRefresh?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedback) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/command-center/actions/${action.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useful: feedback,
          falsePositive: feedback === "no" ? true : false,
        }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        onRefresh?.();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
      {/* Traceability */}
      <div className="bg-surface-alt rounded-lg p-3">
        <h5 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
          <Eye className="h-3 w-3" /> Why this action?
        </h5>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-text-muted">Signal:</span>
            <span className="ml-1 text-text-primary font-medium">{action.signal.replace(/_/g, " ")}</span>
          </div>
          <div>
            <span className="text-text-muted">Value:</span>
            <span className="ml-1 text-text-primary font-medium">{action.signalValue || "N/A"}</span>
          </div>
          <div>
            <span className="text-text-muted">Source:</span>
            <span className="ml-1 text-text-primary font-medium">{action.source}</span>
          </div>
          <div>
            <span className="text-text-muted">Category:</span>
            <span className="ml-1 text-text-primary font-medium">{CATEGORY_LABELS[action.category] || action.category}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Link href={action.href}>
          <Button variant="secondary" size="sm">
            <ExternalLink className="h-3 w-3 mr-1" />View Project
          </Button>
        </Link>
      </div>

      {/* Action States */}
      {status === "open" && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => updateStatus("in_progress")} disabled={loading}>
            <Zap className="h-3 w-3 mr-1" />Start
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => updateStatus("dismissed", { dismissedReason: "Not applicable" })}
            disabled={loading}
          >
            <X className="h-3 w-3 mr-1" />Dismiss
          </Button>
        </div>
      )}

      {status === "in_progress" && (
        <div className="space-y-2">
          <textarea
            className="w-full p-2 text-xs border border-border rounded bg-surface text-text-primary"
            rows={2}
            placeholder="Completion note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <select
              className="text-xs border border-border rounded px-2 py-1 bg-surface text-text-primary"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="">Select outcome...</option>
              {OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={() => updateStatus("completed", { completedNote: note, outcome })}
              disabled={loading || !outcome}
            >
              <CheckCircle className="h-3 w-3 mr-1" />Complete
            </Button>
          </div>
        </div>
      )}

      {(status === "completed" || status === "dismissed") && !feedbackSubmitted && (
        <div className="bg-surface-alt rounded-lg p-3">
          <p className="text-[10px] text-text-muted mb-2">Was this recommendation useful?</p>
          <div className="flex items-center gap-2">
            {[
              { value: "yes", icon: ThumbsUp, label: "Yes" },
              { value: "partially", icon: Minus, label: "Partially" },
              { value: "no", icon: ThumbsDown, label: "No" },
            ].map(({ value, icon: FIcon, label }) => (
              <button
                key={value}
                onClick={() => { setFeedback(value); }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors ${
                  feedback === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-text-muted hover:border-primary/30"
                }`}
              >
                <FIcon className="h-3 w-3" />{label}
              </button>
            ))}
            {feedback && (
              <Button size="sm" onClick={submitFeedback} disabled={loading}>
                Submit
              </Button>
            )}
          </div>
        </div>
      )}

      {status === "completed" && (
        <div className="text-[10px] text-status-normal flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed{action.completedAt ? ` at ${new Date(action.completedAt).toLocaleTimeString()}` : ""}
          {action.outcome && ` · Outcome: ${action.outcome.replace(/_/g, " ")}`}
        </div>
      )}

      {status === "dismissed" && (
        <div className="text-[10px] text-text-muted flex items-center gap-1">
          <X className="h-3 w-3" />
          Dismissed{action.dismissedReason ? `: ${action.dismissedReason}` : ""}
        </div>
      )}
    </div>
  );
}

function LearningLoop() {
  const steps = [
    { label: "Project Data", icon: Building2, desc: "Real project records" },
    { label: "Intelligence", icon: Brain, desc: "24 feature signals" },
    { label: "Risk Score", icon: AlertTriangle, desc: "risk-engine-v1" },
    { label: "Recommendation", icon: Target, desc: "Action generated" },
    { label: "Engineer Action", icon: Zap, desc: "Action taken" },
    { label: "Outcome", icon: CheckCircle, desc: "Result recorded" },
    { label: "Validation Data", icon: Shield, desc: "Future ML training" },
  ];

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto py-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-surface-alt min-w-[100px] text-center border border-border">
            <step.icon className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-semibold text-text-primary">{step.label}</span>
            <span className="text-[9px] text-text-muted">{step.desc}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center px-1">
              <ArrowRight className="h-4 w-4 text-primary/40" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AttentionMatrix({ projects }: { projects: ProjectAttention[] }) {
  if (projects.length === 0) return null;

  const maxScore = Math.max(...projects.map((p) => p.attentionScore), 1);

  return (
    <div className="relative h-48 border border-border rounded-lg bg-surface overflow-hidden">
      {/* Axes */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border" />
        <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-border" />
      </div>

      {/* Labels */}
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] text-text-muted font-medium">HIGH ATTENTION</span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-text-muted font-medium">LOW ATTENTION</span>
      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-text-muted font-medium rotate-[-90deg]">LOW RISK</span>
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-text-muted font-medium rotate-90">HIGH RISK</span>

      {/* Project dots */}
      {projects.map((p) => {
        const x = 20 + (p.attentionScore / maxScore) * 60; // left 20%–80%
        const y = 80 - (p.attentionScore / maxScore) * 60; // top 20%–80% (inverted)
        const color =
          p.attentionLevel === "high"
            ? "bg-status-review"
            : p.attentionLevel === "medium"
            ? "bg-status-attention"
            : "bg-status-normal";

        return (
          <div
            key={p.id}
            className="absolute group cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className={`w-4 h-4 rounded-full ${color} shadow-md transition-transform hover:scale-150`} />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow-sm">
              {p.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [actionsData, setActionsData] = useState<ActionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"queue" | "matrix" | "analytics" | "loop">("queue");

  const fetchData = useCallback(async () => {
    try {
      const [centerRes, actionsRes] = await Promise.all([
        fetch("/api/command-center"),
        fetch("/api/command-center/actions"),
      ]);
      if (centerRes.ok) setData(await centerRes.json());
      if (actionsRes.ok) setActionsData(await actionsRes.json());
    } catch (err) {
      console.error("Failed to load command center:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateActions = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/command-center/actions", { method: "POST" });
      if (res.ok) {
        await fetchData(); // Refresh
      }
    } finally {
      setGenerating(false);
    }
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Priority actions (open/in_progress only)
  const priorityActions = useMemo(() => {
    if (!actionsData) return [];
    return actionsData.actions.filter((a) => a.status === "open" || a.status === "in_progress");
  }, [actionsData]);

  // Completed today
  const completedToday = useMemo(() => {
    if (!actionsData) return [];
    return actionsData.actions.filter((a) => a.status === "completed");
  }, [actionsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading command center...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting}, {data?.engineer || "Engineer"}
          </h1>
          <p className="text-sm text-text-secondary">
            Daily Construction Command Center · {dateStr}
          </p>
          {data && (
            <p className="text-[10px] text-text-muted mt-1">
              Engine: {data.engineVersion} · Generated: {new Date(data.generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={generateActions}
            disabled={generating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating..." : "Generate Actions"}
          </Button>
        </div>
      </div>

      {/* AI Daily Brief */}
      {data?.aiBrief && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">BuildMe Intelligence Brief</h3>
                <p className="text-xs text-text-secondary">{data.aiBrief}</p>
                <p className="text-[9px] text-text-muted mt-1">
                  Generated from project signals · {data.engineVersion} · Deterministic summary
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Priorities */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="Projects"
            value={data.summary.totalProjects}
            icon={Building2}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label="Need Attention"
            value={data.summary.projectsNeedingAttention}
            icon={AlertTriangle}
            color="bg-status-attention-bg text-status-attention"
            sub="requiring action"
          />
          <StatCard
            label="Overdue Inspections"
            value={data.summary.overdueInspections}
            icon={Clock}
            color="bg-status-review-bg text-status-review"
          />
          <StatCard
            label="Critical Issues"
            value={data.summary.criticalIssues}
            icon={AlertTriangle}
            color="bg-status-review-bg text-status-review"
          />
          <StatCard
            label="Evidence Gaps"
            value={data.summary.evidenceGaps}
            icon={Camera}
            color="bg-status-attention-bg text-status-attention"
          />
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {[
          { key: "queue" as const, label: "Priority Actions", icon: Zap, count: priorityActions.length },
          { key: "matrix" as const, label: "Project Attention", icon: Target },
          { key: "analytics" as const, label: "Analytics", icon: BarChart3 },
          { key: "loop" as const, label: "Learning Loop", icon: Brain },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
              activeSection === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-semibold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Priority Actions Queue */}
      {activeSection === "queue" && (
        <div className="space-y-3">
          {priorityActions.length === 0 && completedToday.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 text-status-normal mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text-primary mb-1">You&apos;re All Caught Up</h3>
                <p className="text-sm text-text-muted mb-3">No active recommendations require attention.</p>
                <p className="text-xs text-text-muted">
                  {data?.summary.totalProjects || 0} projects monitored · Last reviewed: just now
                </p>
                <Button className="mt-4" onClick={generateActions} disabled={generating}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                  Check for New Actions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {priorityActions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Priority Actions ({priorityActions.length})
                  </h3>
                  <div className="space-y-2">
                    {priorityActions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      isExpanded={expandedAction === action.id}
                      onExpand={() =>
                        setExpandedAction(expandedAction === action.id ? null : action.id)
                      }
                      onRefresh={fetchData}
                    />
                    ))}
                  </div>
                </div>
              )}

              {completedToday.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    Completed Today ({completedToday.length})
                  </h3>
                  <div className="space-y-1">
                    {completedToday.map((action) => (
                      <div key={action.id} className="flex items-center gap-2 p-2 rounded bg-status-normal-bg text-xs">
                        <CheckCircle className="h-3 w-3 text-status-normal" />
                        <span className="text-text-primary">{action.title}</span>
                        {action.outcome && (
                          <span className="text-text-muted">· {action.outcome.replace(/_/g, " ")}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Project Attention Matrix */}
      {activeSection === "matrix" && data && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Operational Prioritization View
          </h3>
          <p className="text-[10px] text-text-muted">
            Position based on attention score — not a statistical model
          </p>
          <AttentionMatrix projects={data.projects} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.projects.map((project) => (
              <ProjectAttentionCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Analytics */}
      {activeSection === "analytics" && actionsData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Actions"
              value={actionsData.stats.total}
              icon={Target}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              label="Completed"
              value={actionsData.stats.completed}
              icon={CheckCircle}
              color="bg-status-normal-bg text-status-normal"
            />
            <StatCard
              label="Dismissed"
              value={actionsData.stats.dismissed}
              icon={X}
              color="bg-surface-alt text-text-muted"
            />
            <StatCard
              label="Feedback"
              value={actionsData.feedbackCount}
              icon={MessageSquare}
              color="bg-primary/10 text-primary"
              sub="responses"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Actionability Rate</h3>
              </CardHeader>
              <CardContent>
                {actionsData.actionabilityRate !== null ? (
                  <div>
                    <p className="text-3xl font-bold text-text-primary">{actionsData.actionabilityRate}%</p>
                    <p className="text-[10px] text-text-muted">
                      Based on {actionsData.feedbackCount} feedback responses
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">Not enough data — designed for pilot measurement.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Completion Rate</h3>
              </CardHeader>
              <CardContent>
                {actionsData.completionRate !== null ? (
                  <div>
                    <p className="text-3xl font-bold text-text-primary">{actionsData.completionRate}%</p>
                    <p className="text-[10px] text-text-muted">
                      Based on {actionsData.stats.open + actionsData.stats.inProgress + actionsData.stats.completed} accepted actions
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No actions generated yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Action Status Breakdown</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: "Open", count: actionsData.stats.open, color: "bg-primary" },
                  { label: "In Progress", count: actionsData.stats.inProgress, color: "bg-status-attention" },
                  { label: "Completed", count: actionsData.stats.completed, color: "bg-status-normal" },
                  { label: "Dismissed", count: actionsData.stats.dismissed, color: "bg-text-muted" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-20">{item.label}</span>
                    <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${actionsData.stats.total > 0 ? (item.count / actionsData.stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-primary w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Learning Loop */}
      {activeSection === "loop" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Intelligence Learning Loop</h3>
              <p className="text-[10px] text-text-muted">Every action becomes structured outcome data for future model improvement</p>
            </CardHeader>
            <CardContent>
              <LearningLoop />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Data Flow</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-alt rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                    <Activity className="h-3 w-3 text-primary" /> Current
                  </h4>
                  <ul className="space-y-1 text-[10px] text-text-secondary">
                    <li>• 24 engineered features</li>
                    <li>• Rule-based risk scoring</li>
                    <li>• Explainable recommendations</li>
                    <li>• Action tracking</li>
                    <li>• Engineer feedback</li>
                  </ul>
                </div>
                <div className="bg-surface-alt rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-status-attention" /> During Pilot
                  </h4>
                  <ul className="space-y-1 text-[10px] text-text-secondary">
                    <li>• Real engineer interactions</li>
                    <li>• Action outcomes recorded</li>
                    <li>• Feedback on usefulness</li>
                    <li>• False positive tracking</li>
                    <li>• Outcome labels generated</li>
                  </ul>
                </div>
                <div className="bg-surface-alt rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-status-normal" /> Future ML
                  </h4>
                  <ul className="space-y-1 text-[10px] text-text-secondary">
                    <li>• Trained prediction model</li>
                    <li>• Calibrated risk weights</li>
                    <li>• Reduced false positives</li>
                    <li>• Higher actionability rate</li>
                    <li>• Continuous improvement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Recommendation Validation</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-secondary mb-3">
                Every completed action creates a structured validation record. This data eventually trains better models.
              </p>
              <div className="bg-surface-alt rounded-lg p-3 text-[10px] text-text-muted">
                <p><strong className="text-text-primary">Example flow:</strong></p>
                <p className="mt-1">Risk signal: inspectionOverdue = true</p>
                <p>→ Recommendation: &quot;Schedule inspection&quot;</p>
                <p>→ Engineer: Completed inspection</p>
                <p>→ Outcome: No issue found</p>
                <p>→ Feedback: Useful</p>
                <p className="mt-1 text-primary">→ This becomes future training data.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

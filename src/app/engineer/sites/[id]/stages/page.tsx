"use client";

/**
 * Stage Dashboard — Concealment-Aware Element Trajectory View
 *
 * This is the primary visual surface for Track 2.
 * It shows the three-way stage status (observed / inferred-concealed / unsupported)
 * for every structural element in the project, derived from the Viterbi trajectory fitter.
 *
 * Design intent (from build prompt §5):
 *   "Design the stage-status view as the primary visual language of the product —
 *    a distinct color/icon system, consistently used everywhere."
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Eye, EyeOff, HelpCircle, AlertCircle, Plus, RefreshCw,
  CheckCircle2, Clock, ChevronRight, Layers, Building2,
  ArrowLeft, Zap, Activity, Info, Shield,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type StageStatus = "observed" | "inferred_concealed" | "unsupported" | "abstained";

interface StructuralElement {
  id: string;
  elementType: string;
  label: string;
  floor: string | null;
  zone: string | null;
  currentStageId: string | null;
  currentStageLabel: string | null;
  currentStageStatus: StageStatus | null;
  trajectoryConfidence: number | null;
  lastFittedAt: string | null;
  abstained: boolean;
  abstentionReason: string | null;
  _count: { stageRecords: number; photoTags: number };
  abstentionEvents: { id: string }[];
}

// ─── Status Config ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  observed: {
    label: "Observed",
    description: "Directly seen in a site photo with sufficient confidence",
    icon: Eye,
    dotClass: "stage-dot-observed",
    badgeClass: "stage-badge-observed",
    cardClass: "stage-card-observed",
    color: "#059669",
    bg: "#d1fae5",
  },
  inferred_concealed: {
    label: "Inferred — Concealed",
    description: "Must have occurred (graph logic), but now physically buried under later work",
    icon: EyeOff,
    dotClass: "stage-dot-inferred",
    badgeClass: "stage-badge-inferred",
    cardClass: "stage-card-inferred",
    color: "#d97706",
    bg: "#fef3c7",
  },
  unsupported: {
    label: "Unsupported",
    description: "Not enough photo evidence to determine this stage's status",
    icon: HelpCircle,
    dotClass: "stage-dot-unsupported",
    badgeClass: "stage-badge-unsupported",
    cardClass: "stage-card-unsupported",
    color: "#9ca3af",
    bg: "#f3f4f6",
  },
  abstained: {
    label: "Needs Review",
    description: "System couldn't reach a confident verdict — engineer review required",
    icon: AlertCircle,
    dotClass: "stage-dot-abstained",
    badgeClass: "stage-badge-abstained",
    cardClass: "stage-card-abstained",
    color: "#7c3aed",
    bg: "#ede9fe",
  },
} as const;

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  footing: "Footing",
  column: "Column",
  beam_slab: "Beam & Slab",
  brickwork: "Brickwork",
  plaster: "Plastering",
  flooring: "Flooring",
  electrical: "Electrical",
  plumbing: "Plumbing",
  roofing: "Roofing",
  finishing: "Finishing",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getEffectiveStatus(el: StructuralElement): StageStatus {
  if (el.abstained) return "abstained";
  return (el.currentStageStatus as StageStatus) ?? "unsupported";
}

function StatusBadge({ status }: { status: StageStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`stage-badge ${cfg.badgeClass}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number | null }) {
  if (value === null) return null;
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "#059669" : pct >= 40 ? "#d97706" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-micro text-text-muted w-8">{pct}%</span>
    </div>
  );
}

function ElementCard({
  element,
  onRunTrajectory,
  running,
}: {
  element: StructuralElement;
  onRunTrajectory: (id: string) => void;
  running: boolean;
}) {
  const status = getEffectiveStatus(element);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const hasAbstentions = element.abstentionEvents.length > 0;
  const lastFitted = element.lastFittedAt
    ? new Date(element.lastFittedAt).toLocaleDateString("en-IN", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className={`stage-card ${cfg.cardClass} group`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-caption text-text-muted">
              {ELEMENT_TYPE_LABELS[element.elementType] ?? element.elementType}
            </span>
            {element.floor && (
              <span className="text-micro text-text-muted bg-gray-100 rounded px-1.5 py-0.5">
                {element.floor}
              </span>
            )}
          </div>
          <h3 className="text-subtitle text-text-primary font-semibold truncate">
            {element.label}
          </h3>
          {element.zone && (
            <p className="text-caption text-text-muted truncate">{element.zone}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className={`stage-dot ${cfg.dotClass}`} />
        </div>
      </div>

      {/* Current Stage */}
      <div className="mb-3">
        {element.currentStageLabel ? (
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} />
            <span className="text-caption text-text-secondary font-medium">
              {element.currentStageLabel}
            </span>
          </div>
        ) : (
          <span className="stage-badge stage-badge-unsupported">
            <HelpCircle className="h-3 w-3" />
            No stage data yet
          </span>
        )}
      </div>

      {/* Concealment note */}
      {status === "inferred_concealed" && (
        <div className="concealment-badge mb-3">
          <EyeOff className="h-2.5 w-2.5" />
          Physically covered — can&apos;t verify
        </div>
      )}

      {/* Abstention warning */}
      {status === "abstained" && (
        <div className="flex items-start gap-1.5 mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
          <AlertCircle className="h-3.5 w-3.5 text-purple-600 flex-shrink-0 mt-0.5 stage-abstained-pulse" />
          <p className="text-micro text-purple-700 line-clamp-2">
            {element.abstentionReason ?? "Engineer review needed"}
          </p>
        </div>
      )}

      {/* Confidence */}
      {element.trajectoryConfidence !== null && !element.abstained && (
        <div className="mb-3">
          <p className="text-micro text-text-muted mb-1">Trajectory confidence</p>
          <ConfidenceBar value={element.trajectoryConfidence} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-micro text-text-muted">
          <span>{element._count.stageRecords} records</span>
          {element._count.photoTags > 0 && <span>· {element._count.photoTags} photos</span>}
          {hasAbstentions && (
            <span className="text-purple-600 font-medium">· {element.abstentionEvents.length} pending</span>
          )}
        </div>
        <button
          onClick={() => onRunTrajectory(element.id)}
          disabled={running}
          className="flex items-center gap-1 text-micro text-accent hover:text-accent-dark transition-colors disabled:opacity-50"
          title="Re-run trajectory fitting"
        >
          <RefreshCw className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
          {running ? "Running…" : "Refit"}
        </button>
      </div>
      {lastFitted && (
        <p className="text-micro text-text-muted mt-1">
          Last fitted: {lastFitted}
        </p>
      )}
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function StatusLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-caption text-text-muted hover:text-text-primary transition-colors"
      >
        <Info className="h-3.5 w-3.5" />
        What do these mean?
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-10 bg-white border border-border rounded-xl shadow-lg p-4 w-80 animate-scale-in">
          <h4 className="text-subtitle font-semibold text-text-primary mb-3">Stage Status Explained</h4>
          <div className="space-y-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex gap-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="text-caption font-semibold text-text-primary">{cfg.label}</p>
                    <p className="text-micro text-text-muted leading-relaxed">{cfg.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-micro text-text-muted mt-3 pt-3 border-t border-border">
            The &apos;Inferred — Concealed&apos; and &apos;Needs Review&apos; states are what make this system different.
            Honest uncertainty is shown, not hidden.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Add Element Modal ────────────────────────────────────────────────────────

const ELEMENT_TYPES = Object.entries(ELEMENT_TYPE_LABELS);

function AddElementModal({
  projectId,
  onClose,
  onAdded,
}: {
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({ elementType: "column", label: "", floor: "", zone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/elements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elementType: form.elementType,
          label: form.label.trim(),
          floor: form.floor.trim() || null,
          zone: form.zone.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create element");
      }
      onAdded();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="p-6 border-b border-border">
          <h3 className="text-title font-semibold text-text-primary">Add Structural Element</h3>
          <p className="text-caption text-text-muted mt-1">
            Each element tracks its own stage trajectory independently.
          </p>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-caption font-medium text-text-secondary block mb-1.5">
              Element Type
            </label>
            <select
              value={form.elementType}
              onChange={(e) => setForm({ ...form, elementType: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              {ELEMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-caption font-medium text-text-secondary block mb-1.5">
              Label <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Column C1, Ground Floor Slab, North Wall"
              className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption font-medium text-text-secondary block mb-1.5">Floor</label>
              <input
                type="text"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
                placeholder="e.g. Ground, First"
                className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="text-caption font-medium text-text-secondary block mb-1.5">Zone</label>
              <input
                type="text"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                placeholder="e.g. Kitchen, North"
                className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>
          {error && (
            <div className="text-caption text-danger bg-danger-bg rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-premium btn-secondary px-4 py-2.5 text-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.label.trim()}
              className="flex-1 btn-premium btn-accent px-4 py-2.5 text-body font-medium disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add Element"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StageDashboard({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const { data: session } = useSession();
  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    params.then(({ id }) => setProjectId(id));
  }, [params]);

  const fetchElements = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/elements`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setElements(data.elements ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  const runTrajectory = async (elementId: string) => {
    setRunningIds((prev) => new Set(prev).add(elementId));
    try {
      const res = await fetch(`/api/trajectory/${elementId}`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Trajectory fitting failed");
        return;
      }
      // Refresh elements to show new result
      await fetchElements();
    } catch (err) {
      console.error(err);
    } finally {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(elementId);
        return next;
      });
    }
  };

  // Stats
  const observedCount = elements.filter((e) => !e.abstained && e.currentStageStatus === "observed").length;
  const inferredCount = elements.filter((e) => !e.abstained && e.currentStageStatus === "inferred_concealed").length;
  const unsupportedCount = elements.filter((e) => !e.abstained && (!e.currentStageStatus || e.currentStageStatus === "unsupported")).length;
  const abstainedCount = elements.filter((e) => e.abstained).length;

  // Filtered elements
  const filteredElements = elements.filter((el) => {
    if (filterType !== "all" && el.elementType !== filterType) return false;
    if (filterStatus !== "all") {
      const eff = getEffectiveStatus(el);
      if (filterStatus !== eff) return false;
    }
    return true;
  });

  // Group by element type
  const elementTypes = [...new Set(elements.map((e) => e.elementType))];

  if (!projectId) return null;

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/engineer/sites/${projectId}`}
                className="p-2 hover:bg-surface-alt rounded-lg transition-colors text-text-muted hover:text-text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  <h1 className="text-subtitle font-semibold text-text-primary">
                    Stage Dashboard
                  </h1>
                </div>
                <p className="text-micro text-text-muted">
                  Concealment-aware trajectory per structural element
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusLegend />
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 btn-premium btn-accent px-3 py-2 text-caption font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Element
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Observed", count: observedCount, icon: Eye, color: "#059669", bg: "#d1fae5", status: "observed" },
            { label: "Inferred Concealed", count: inferredCount, icon: EyeOff, color: "#d97706", bg: "#fef3c7", status: "inferred_concealed" },
            { label: "Unsupported", count: unsupportedCount, icon: HelpCircle, color: "#9ca3af", bg: "#f3f4f6", status: "unsupported" },
            { label: "Needs Review", count: abstainedCount, icon: AlertCircle, color: "#7c3aed", bg: "#ede9fe", status: "abstained" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.status}
                onClick={() => setFilterStatus(filterStatus === s.status ? "all" : s.status)}
                className={`card-premium p-4 text-left transition-all hover:shadow-md ${filterStatus === s.status ? "ring-2" : ""}`}
                style={filterStatus === s.status ? { borderColor: s.color } : {}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: s.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  {filterStatus === s.status && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  )}
                </div>
                <p className="text-financial-lg font-bold text-text-primary">{s.count}</p>
                <p className="text-micro text-text-muted">{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* Info Banner — Track 2 explainer */}
        <div className="card-premium p-4 border-l-4 border-l-accent bg-blue-50/50">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-caption font-semibold text-text-primary mb-0.5">
                Concealment-Aware Stage Tracking
              </p>
              <p className="text-micro text-text-muted leading-relaxed">
                The &ldquo;Inferred — Concealed&rdquo; status is derived from a stage-precedence graph and temporal trajectory model —
                not just from what&apos;s visible in photos. Stages that must have occurred (by graph logic) but are now
                physically covered are explicitly labeled, rather than silently omitted or incorrectly marked as unobserved.
                This is the differentiator.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-caption text-text-muted">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-lg text-caption text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All Types</option>
              {elementTypes.map((t) => (
                <option key={t} value={t}>{ELEMENT_TYPE_LABELS[t] ?? t}</option>
              ))}
            </select>
          </div>
          {filterStatus !== "all" && (
            <button
              onClick={() => setFilterStatus("all")}
              className="text-caption text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
            >
              Clear filter ×
            </button>
          )}
          <div className="ml-auto flex items-center gap-2 text-caption text-text-muted">
            <Activity className="h-3.5 w-3.5" />
            {filteredElements.length} of {elements.length} elements
          </div>
        </div>

        {/* Element Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="stage-card" style={{ minHeight: 180 }}>
                <div className="skeleton h-4 w-24 mb-2 rounded" />
                <div className="skeleton h-5 w-40 mb-4 rounded" />
                <div className="skeleton h-6 w-32 rounded-full mb-3" />
                <div className="skeleton h-2 w-full rounded" />
              </div>
            ))}
          </div>
        ) : filteredElements.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <Building2 className="h-12 w-12 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-title font-semibold text-text-primary mb-2">
              {elements.length === 0 ? "No structural elements yet" : "No elements match filter"}
            </h3>
            <p className="text-body text-text-muted mb-6 max-w-sm mx-auto">
              {elements.length === 0
                ? "Add structural elements (columns, slabs, walls…) to start tracking their construction stage over time."
                : "Try clearing the filter to see all elements."}
            </p>
            {elements.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-premium btn-accent px-6 py-3 text-body font-medium inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add First Element
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filteredElements.map((element) => (
              <ElementCard
                key={element.id}
                element={element}
                onRunTrajectory={runTrajectory}
                running={runningIds.has(element.id)}
              />
            ))}
          </div>
        )}

        {/* Abstention Queue */}
        {abstainedCount > 0 && (
          <div className="card-premium border-l-4 border-l-purple-500 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-purple-600 stage-abstained-pulse" />
                <h3 className="text-subtitle font-semibold text-text-primary">
                  {abstainedCount} element{abstainedCount > 1 ? "s" : ""} need engineer review
                </h3>
              </div>
              <Link
                href={`/engineer/sites/${projectId}/abstentions`}
                className="flex items-center gap-1 text-caption text-accent hover:text-accent-dark transition-colors"
              >
                Review queue
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-caption text-text-muted mt-1">
              The trajectory engine couldn&apos;t reach a confident verdict on these elements.
              Your confirmation becomes the authoritative record.
            </p>
          </div>
        )}

        {/* Quick Run All */}
        {elements.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => elements.forEach((e) => runTrajectory(e.id))}
              disabled={runningIds.size > 0}
              className="flex items-center gap-2 btn-premium btn-secondary px-4 py-2.5 text-caption font-medium disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              {runningIds.size > 0 ? "Running trajectories…" : "Refit All Elements"}
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddElementModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onAdded={fetchElements}
        />
      )}
    </div>
  );
}

"use client";

/**
 * Homeowner Stage View — Plain-language concealment status
 *
 * Design requirements (§5 of build prompt):
 * - Plain language, no engineering jargon
 * - Explicit and calm handling of "unsupported" / "can't verify" states
 * - Must NOT imply false confidence
 * - Shows the same three-way status system as engineer view
 */

import { useEffect, useState } from "react";
import { Eye, EyeOff, HelpCircle, AlertCircle, Home, ChevronRight, Info } from "lucide-react";

type StageStatus = "observed" | "inferred_concealed" | "unsupported" | "abstained";

interface StructuralElement {
  id: string;
  elementType: string;
  label: string;
  floor: string | null;
  currentStageLabel: string | null;
  currentStageStatus: StageStatus | null;
  abstained: boolean;
  abstentionReason: string | null;
  _count: { stageRecords: number };
}

// Plain-language descriptions for homeowners
const HOMEOWNER_STATUS_COPY = {
  observed: {
    shortLabel: "Verified ✓",
    longLabel: "We can see this in your photos",
    explanation: "Our system found clear photo evidence of this work being done.",
    icon: Eye,
    color: "#059669",
    bg: "#d1fae5",
    border: "#6ee7b7",
  },
  inferred_concealed: {
    shortLabel: "Completed (now covered)",
    longLabel: "Done, but now buried under later work",
    explanation:
      "This work must have been completed before the next stage could begin — but it's now physically covered and we can't photograph it anymore. This is expected and normal in construction.",
    icon: EyeOff,
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fcd34d",
  },
  unsupported: {
    shortLabel: "Not enough photos yet",
    longLabel: "We can't verify this yet",
    explanation:
      "We don't have enough site photos to confirm the status of this item. Your site engineer should upload more photos.",
    icon: HelpCircle,
    color: "#9ca3af",
    bg: "#f3f4f6",
    border: "#d1d5db",
  },
  abstained: {
    shortLabel: "Needs expert check",
    longLabel: "We flagged this for your engineer to review",
    explanation:
      "Our system wasn't confident enough to make a call on this item and has flagged it for your engineer to review. This is a safety feature — we'd rather ask than guess.",
    icon: AlertCircle,
    color: "#7c3aed",
    bg: "#ede9fe",
    border: "#c4b5fd",
  },
} as const;

const ELEMENT_TYPE_PLAIN: Record<string, string> = {
  footing: "Foundation",
  column: "Support Columns",
  beam_slab: "Floor & Roof Structure",
  brickwork: "Walls",
  plaster: "Wall Plastering",
  flooring: "Flooring",
  electrical: "Electrical Wiring",
  plumbing: "Plumbing",
  roofing: "Roof",
  finishing: "Interior Finishing",
};

function ElementCard({ element }: { element: StructuralElement }) {
  const status: StageStatus = element.abstained
    ? "abstained"
    : (element.currentStageStatus ?? "unsupported");
  const cfg = HOMEOWNER_STATUS_COPY[status];
  const Icon = cfg.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-white rounded-2xl border-2 overflow-hidden transition-all"
      style={{ borderColor: cfg.border }}
    >
      {/* Color-coded top bar */}
      <div className="h-1.5" style={{ backgroundColor: cfg.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-micro text-text-muted uppercase tracking-wide mb-0.5">
              {ELEMENT_TYPE_PLAIN[element.elementType] ?? element.elementType}
              {element.floor ? ` · ${element.floor}` : ""}
            </p>
            <h3 className="text-subtitle font-semibold text-text-primary">{element.label}</h3>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cfg.bg }}
          >
            <Icon className="h-5 w-5" style={{ color: cfg.color }} />
          </div>
        </div>

        {/* Status label */}
        <div className="mb-3">
          <span
            className="inline-block px-3 py-1 rounded-full text-caption font-semibold"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {cfg.shortLabel}
          </span>
        </div>

        {/* Current stage */}
        {element.currentStageLabel && (
          <p className="text-caption text-text-secondary mb-2">
            Current work: <span className="font-medium">{element.currentStageLabel}</span>
          </p>
        )}

        {/* Expandable explanation */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-micro text-text-muted hover:text-text-primary transition-colors"
        >
          <Info className="h-3 w-3" />
          {expanded ? "Hide explanation" : "What does this mean?"}
        </button>

        {expanded && (
          <div
            className="mt-3 p-3 rounded-xl text-caption text-text-secondary leading-relaxed"
            style={{ backgroundColor: cfg.bg }}
          >
            {cfg.explanation}
            {status === "inferred_concealed" && (
              <p className="mt-2 text-micro font-medium" style={{ color: cfg.color }}>
                ⚠ This was physically covered before photos could be taken — this is expected in all construction projects.
                Your engineer's on-site verification is the record for this item.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeownerStageView({ projectId }: { projectId: string }) {
  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/elements`)
      .then((r) => r.json())
      .then((d) => setElements(d.elements ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const observed = elements.filter((e) => !e.abstained && e.currentStageStatus === "observed").length;
  const concealed = elements.filter((e) => !e.abstained && e.currentStageStatus === "inferred_concealed").length;
  const needsCheck = elements.filter((e) => e.abstained).length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5">
            <div className="skeleton h-4 w-24 rounded mb-2" />
            <div className="skeleton h-5 w-40 rounded mb-4" />
            <div className="skeleton h-6 w-32 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (elements.length === 0) {
    return (
      <div className="text-center py-12">
        <Home className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-50" />
        <p className="text-body text-text-muted">
          Your engineer hasn't added structural elements yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h3 className="text-subtitle font-semibold text-text-primary mb-4">Your Build at a Glance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-financial-lg font-bold text-green-600">{observed}</p>
            <p className="text-micro text-text-muted">Verified in photos</p>
          </div>
          <div className="text-center">
            <p className="text-financial-lg font-bold text-amber-600">{concealed}</p>
            <p className="text-micro text-text-muted">Covered (expected)</p>
          </div>
          <div className="text-center">
            <p className="text-financial-lg font-bold text-purple-600">{needsCheck}</p>
            <p className="text-micro text-text-muted">Flagged for review</p>
          </div>
        </div>

        {/* Honest summary */}
        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-caption text-amber-800 leading-relaxed">
            <span className="font-semibold">About &ldquo;Covered (expected)&rdquo;:</span>{" "}
            In construction, foundational work like rebar and conduit gets buried under concrete or plaster —
            this is how buildings are built. These items appear as &ldquo;covered&rdquo; because they were completed
            before they could be photographed. This is normal, not a concern.
          </p>
        </div>
      </div>

      {/* Element cards */}
      {elements.map((el) => (
        <ElementCard key={el.id} element={el} />
      ))}
    </div>
  );
}

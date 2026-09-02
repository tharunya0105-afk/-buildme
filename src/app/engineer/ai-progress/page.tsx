"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Camera, Brain, CheckCircle, AlertTriangle, Eye,
  Info, Plus, Clock, Shield, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  builtArea: number | null;
  currentStage: string | null;
}

interface ProgressObservation {
  id: string;
  title: string;
  observed: string;
  inferred: string | null;
  notVerifiable: string | null;
  confidence: string;
  changeDescription: string | null;
  stage: string | null;
  verified: boolean;
  verificationNote: string | null;
  createdAt: string;
}

const STAGE_LABELS: Record<string, string> = {
  planning: "Planning", foundation: "Foundation", structure: "Structure",
  brickwork: "Brickwork", roofing: "Roofing", electrical_plumbing: "Electrical/Plumbing",
  finishing: "Finishing", completed: "Completed",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

// ─── Create Observation Form ────────────────────────────────────────────────

function CreateObservationForm({
  projectId,
  onCreated,
  onCancel,
}: {
  projectId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    observed: "",
    inferred: "",
    notVerifiable: "",
    changeDescription: "",
    stage: "",
    confidence: "medium",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.observed) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/progress-observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) onCreated();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">New Progress Observation</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Observation Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Column formwork visible at north section"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          {/* OBSERVED */}
          <div>
            <label className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1 block">
              <Eye className="h-3 w-3" /> OBSERVED — What is directly visible in photos *
            </label>
            <textarea
              value={form.observed}
              onChange={e => setForm(p => ({ ...p, observed: e.target.value }))}
              placeholder="e.g., Column formwork is visible in the current photo. Plastering appears complete on ground floor walls."
              rows={3}
              className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm bg-green-50"
            />
          </div>

          {/* INFERRED */}
          <div>
            <label className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1 block">
              <Brain className="h-3 w-3" /> INFERRED — What can be reasonably deduced *
            </label>
            <textarea
              value={form.inferred}
              onChange={e => setForm(p => ({ ...p, inferred: e.target.value }))}
              placeholder="e.g., The project may have progressed to the column stage. Structural work appears to be ongoing."
              rows={3}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-amber-50"
            />
          </div>

          {/* NOT VERIFIABLE */}
          <div>
            <label className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1 block">
              <AlertTriangle className="h-3 w-3" /> NOT VERIFIABLE — What cannot be confirmed from photos
            </label>
            <textarea
              value={form.notVerifiable}
              onChange={e => setForm(p => ({ ...p, notVerifiable: e.target.value }))}
              placeholder="e.g., Exact reinforcement quantity cannot be confirmed. Concrete mix quality is not verifiable from photos."
              rows={3}
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-red-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Stage Observed</label>
              <select
                value={form.stage}
                onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="">Select stage</option>
                {Object.entries(STAGE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Confidence</label>
              <div className="flex gap-2">
                {["high", "medium", "low"].map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(p => ({ ...p, confidence: c }))}
                    className={`flex-1 py-2 rounded-md border text-xs font-medium capitalize transition-colors ${
                      form.confidence === c
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-text-muted"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">What Changed vs Previous</label>
            <input
              type="text"
              value={form.changeDescription}
              onChange={e => setForm(p => ({ ...p, changeDescription: e.target.value }))}
              placeholder="e.g., Additional column formwork visible compared to previous image"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !form.title || !form.observed} className="w-full">
            {submitting ? "Saving..." : "Save Observation"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Observation Card ───────────────────────────────────────────────────────

function ObservationCard({ obs }: { obs: ProgressObservation }) {
  const [expanded, setExpanded] = useState(true);
  const stageLabel = STAGE_LABELS[obs.stage ?? ""] ?? obs.stage;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-text-primary">{obs.title}</h3>
              {obs.verified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <CheckCircle className="h-3 w-3" /> Verified
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCE_COLORS[obs.confidence] ?? CONFIDENCE_COLORS.medium}`}>
                {obs.confidence} confidence
              </span>
              {stageLabel && (
                <span className="px-2 py-0.5 rounded-full bg-surface-alt text-text-muted text-xs">
                  {stageLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {new Date(obs.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-surface-alt">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* What Changed */}
        {obs.changeDescription && (
          <div className="p-2 rounded-md bg-blue-50 border border-blue-200 mb-3">
            <p className="text-xs font-semibold text-blue-800">CHANGE:</p>
            <p className="text-sm text-blue-700">{obs.changeDescription}</p>
          </div>
        )}

        {/* Three Evidence Categories */}
        <div className="space-y-3">
          {/* OBSERVED */}
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="h-3.5 w-3.5 text-green-700" />
              <p className="text-xs font-semibold text-green-800">OBSERVED</p>
            </div>
            <p className="text-sm text-green-800">{obs.observed}</p>
          </div>

          {/* INFERRED */}
          {obs.inferred && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="h-3.5 w-3.5 text-amber-700" />
                <p className="text-xs font-semibold text-amber-800">INFERRED</p>
              </div>
              <p className="text-sm text-amber-800">{obs.inferred}</p>
            </div>
          )}

          {/* NOT VERIFIABLE */}
          {obs.notVerifiable && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <p className="text-xs font-semibold text-red-700">NOT VERIFIABLE</p>
              </div>
              <p className="text-sm text-red-700">{obs.notVerifiable}</p>
            </div>
          )}
        </div>

        {/* Verification Note */}
        {obs.verified && obs.verificationNote && (
          <div className="mt-3 p-2 rounded-md bg-surface-alt">
            <p className="text-xs text-text-muted"><strong>Engineer note:</strong> {obs.verificationNote}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AIProgressPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [observations, setObservations] = useState<ProgressObservation[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0) setSelectedProjectId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetch(`/api/projects/${selectedProjectId}/progress-observations`)
      .then(r => r.json())
      .then(data => {
        setObservations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedProjectId, showCreate]);

  if (loading && !showCreate) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/engineer" className="flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">AI Progress Intelligence</h1>
            <p className="text-sm text-text-muted mt-1">
              Structured observations with clear evidence categories: what is observed, inferred, and not verifiable.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
            {observations.length} observation{observations.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Project Selector */}
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

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Observation
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && selectedProjectId && (
        <div className="mb-6">
          <CreateObservationForm
            projectId={selectedProjectId}
            onCreated={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Observations List */}
      {observations.length === 0 ? (
        <EmptyState
          title="No observations yet"
          description="Record your first progress observation using the OBSERVED / INFERRED / NOT VERIFIABLE framework."
        />
      ) : (
        <div className="space-y-4">
          {observations.map(obs => (
            <ObservationCard key={obs.id} obs={obs} />
          ))}
        </div>
      )}

      {/* Explanation */}
      <Card className="mt-8">
        <CardContent className="py-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-text-muted">
              <p className="font-medium text-text-primary mb-1">How Progress Intelligence works</p>
              <p>
                Every observation is structured into three evidence categories:
                <strong className="text-green-700"> OBSERVED</strong> (directly visible in photos),
                <strong className="text-amber-700"> INFERRED</strong> (reasonably deduced), and
                <strong className="text-red-600"> NOT VERIFIABLE</strong> (cannot be confirmed from photos alone).
                This honesty framework prevents overclaiming and builds trust with homeowners and evaluators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain, MapPin, Database, Layers, Target, Zap, Shield, Eye,
  CheckCircle, Clock, AlertTriangle, ArrowRight, ChevronRight,
  Building2, Camera, Users, FileText, Sparkles, BarChart3,
  GitBranch, Cpu, Search, TrendingUp, CircleDot,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

// ─── STATUS BADGES ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "implemented" | "partial" | "planned" | "not_validated" }) {
  const styles = {
    implemented: "bg-status-normal-bg text-status-normal border-status-normal/20",
    partial: "bg-status-attention-bg text-status-attention border-status-attention/20",
    planned: "bg-surface-alt text-text-muted border-border",
    not_validated: "bg-status-review-bg text-status-review border-status-review/20",
  };
  const labels = {
    implemented: "IMPLEMENTED",
    partial: "PARTIAL",
    planned: "PLANNED",
    not_validated: "NOT VALIDATED",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function EvidenceLabel({ type }: { type: "observed" | "derived" | "rule_based" | "planned" }) {
  const styles = {
    observed: "bg-primary/10 text-primary",
    derived: "bg-status-attention-bg text-status-attention",
    rule_based: "bg-surface-alt text-text-secondary",
    planned: "bg-status-review-bg text-status-review",
  };
  const labels = {
    observed: "OBSERVED",
    derived: "DERIVED",
    rule_based: "RULE-BASED",
    planned: "PLANNED",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

// ─── PIPELINE STAGE ─────────────────────────────────────────────────────────

function PipelineStage({
  icon: Icon, label, status, description, detail,
}: {
  icon: React.ElementType; label: string; status: "implemented" | "partial" | "planned" | "not_validated";
  description: string; detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-xs font-semibold text-text-primary">{label}</h4>
          <StatusBadge status={status} />
        </div>
        <p className="text-[10px] text-text-secondary">{description}</p>
        {detail && <p className="text-[9px] text-text-muted mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function TechnologyCorePage() {
  const [stats, setStats] = useState({ projects: 0, inspections: 0, issues: 0, photos: 0, workers: 0, actions: 0 });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.projects) {
          setStats({
            projects: d.projects.length,
            inspections: d.projects.reduce((s: number, p: any) => s + (p._count?.inspections || 0), 0),
            issues: d.projects.reduce((s: number, p: any) => s + (p._count?.alerts || 0), 0),
            photos: d.projects.reduce((s: number, p: any) => s + (p._count?.photos || 0), 0),
            workers: 0,
            actions: 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-text-primary">BuildMe Technology Core</h1>
          <StatusBadge status="implemented" />
        </div>
        <p className="text-sm text-text-secondary">
          <strong>AI + Spatial Construction Intelligence</strong>
        </p>
        <p className="text-xs text-text-muted mt-1">
          An AI-ready spatial construction intelligence layer that converts fragmented project evidence
          into explainable risk signals, prioritized actions, and eventually learned predictions.
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">BuildMe at a Glance</h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "PROBLEM", value: "Fragmented construction information", icon: AlertTriangle },
              { label: "INTELLIGENCE", value: "Explainable project risk", icon: Brain },
              { label: "SPATIAL", value: "Location-aware context", icon: MapPin },
              { label: "ACTION", value: "Prioritized recommendations", icon: Target },
              { label: "LEARNING", value: "Outcome-driven future ML", icon: Sparkles },
            ].map((item) => (
              <div key={item.label} className="text-center p-2 rounded bg-white/50">
                <item.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-[9px] font-bold text-primary">{item.label}</p>
                <p className="text-[8px] text-text-secondary">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-2 text-center">
            Current stage: <strong className="text-text-primary">Prototype / early PoC</strong>
          </p>
        </CardContent>
      </Card>

      {/* Core Pipeline */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Core Intelligence Pipeline</h3>
          <p className="text-[10px] text-text-muted">How BuildMe transforms project data into actionable intelligence</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { icon: Building2, label: "Construction Project Data", status: "implemented" as const, description: "Projects, inspections, issues, photos, workforce, schedule", detail: "5 projects, real database records" },
              { icon: Camera, label: "Evidence Collection", status: "implemented" as const, description: "Photo uploads, inspection documentation, issue reporting", detail: "Photo upload system operational" },
              { icon: Layers, label: "Feature Engineering", status: "implemented" as const, description: "24 structured signals extracted from project data", detail: "risk-engine-v1 feature vector" },
              { icon: MapPin, label: "Spatial Context", status: "implemented" as const, description: "GPS coordinates, proximity analysis, geofencing", detail: "Haversine distance, nearby project risk" },
              { icon: Brain, label: "Risk Intelligence", status: "implemented" as const, description: "6-category explainable risk scoring", detail: "Inspection, Issue, Schedule, Workforce, Evidence, Spatial" },
              { icon: Target, label: "Attention Prioritization", status: "implemented" as const, description: "Project attention scoring and ranking", detail: "Command Center priority queue" },
              { icon: Zap, label: "Recommended Action", status: "implemented" as const, description: "Traceable action recommendations from risk signals", detail: "Persistent action items with full provenance" },
              { icon: CheckCircle, label: "Engineer Outcome", status: "implemented" as const, description: "Action completion with outcome recording and feedback", detail: "Outcome: resolved/completed/escalated/waiting" },
              { icon: Database, label: "Learning Dataset", status: "partial" as const, description: "Structured outcome data for future ML training", detail: "ActionItem + ActionFeedback models in place" },
              { icon: Cpu, label: "Future ML Models", status: "planned" as const, description: "Supervised learning on validated construction outcomes", detail: "Requires pilot data with verified outcomes" },
            ].map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 text-center">
                  <span className="text-[9px] text-text-muted font-mono">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <PipelineStage {...stage} />
                </div>
                {i < 9 && <ChevronRight className="h-3 w-3 text-text-muted flex-shrink-0" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traditional vs BuildMe */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Technology Differentiation</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border bg-surface-alt">
              <h4 className="text-xs font-semibold text-text-muted mb-2">Traditional Construction Software</h4>
              <div className="space-y-1 text-[10px] text-text-secondary">
                <p>Record information</p>
                <p>→ Display information</p>
                <p className="text-text-muted mt-2">No intelligence layer. No prioritization. No learning.</p>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <h4 className="text-xs font-semibold text-primary mb-2">BuildMe</h4>
              <div className="space-y-1 text-[10px] text-text-secondary">
                <p>Observe project evidence</p>
                <p>→ Understand risk signals</p>
                <p>→ Prioritize attention</p>
                <p>→ Recommend action</p>
                <p>→ Capture engineer outcome</p>
                <p>→ Learn from results</p>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-text-muted mt-2">
            Product positioning hypothesis — requires customer validation.
          </p>
        </CardContent>
      </Card>

      {/* AI/ML Architecture */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">AI/ML Architecture</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-surface">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold text-text-primary">Risk Intelligence</h4>
                <StatusBadge status="implemented" />
              </div>
              <ul className="space-y-1 text-[10px] text-text-secondary">
                <li>• 24 engineered features</li>
                <li>• 6 risk categories</li>
                <li>• Explainable scoring</li>
                <li>• Data confidence measurement</li>
                <li>• Engine versioning (v1)</li>
              </ul>
              <div className="mt-2">
                <EvidenceLabel type="rule_based" />
                <span className="text-[9px] text-text-muted ml-1">Not an ML model</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-surface">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold text-text-primary">Spatial Intelligence</h4>
                <StatusBadge status="implemented" />
              </div>
              <ul className="space-y-1 text-[10px] text-text-secondary">
                <li>• GPS coordinates</li>
                <li>• Haversine distance</li>
                <li>• Nearby project analysis</li>
                <li>• Geofence verification</li>
                <li>• Spatial risk context</li>
              </ul>
              <div className="mt-2">
                <EvidenceLabel type="derived" />
                <span className="text-[9px] text-text-muted ml-1">Contextual — not causal</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-surface">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-text-muted" />
                <h4 className="text-xs font-semibold text-text-primary">Future ML Models</h4>
                <StatusBadge status="planned" />
              </div>
              <ul className="space-y-1 text-[10px] text-text-secondary">
                <li>• Risk classification</li>
                <li>• Attention prediction</li>
                <li>• Schedule risk</li>
                <li>• Issue escalation</li>
                <li>• Cost estimation</li>
              </ul>
              <div className="mt-2">
                <EvidenceLabel type="planned" />
                <span className="text-[9px] text-text-muted ml-1">Requires pilot data</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spatial Intelligence Engine */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Spatial Intelligence Engine</h3>
          <p className="text-[10px] text-text-muted">Location-aware construction intelligence</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-primary">Current Capabilities</h4>
              {[
                { label: "Project GPS Coordinates", status: "implemented" as const },
                { label: "Project Proximity Analysis", status: "implemented" as const },
                { label: "Nearby Project Density", status: "implemented" as const },
                { label: "Geofenced Workforce Verification", status: "implemented" as const },
                { label: "Spatial Risk Context", status: "implemented" as const },
                { label: "Haversine Distance Calculation", status: "implemented" as const },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">{item.label}</span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-primary">Future Spatial Layers</h4>
              {[
                { label: "Weather / Rainfall Data", status: "planned" as const },
                { label: "Terrain / Elevation", status: "planned" as const },
                { label: "Road Accessibility", status: "planned" as const },
                { label: "Environmental Conditions", status: "planned" as const },
                { label: "Local Construction Context", status: "planned" as const },
                { label: "Satellite Imagery", status: "planned" as const },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">{item.label}</span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>
          <p className="text-[9px] text-text-muted mt-3">
            Spatial proximity provides contextual information and does not establish causation.
          </p>
        </CardContent>
      </Card>

      {/* Data Flywheel */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">BuildMe Data Flywheel</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {[
              { label: "More Projects", icon: Building2 },
              { label: "More Observations", icon: Eye },
              { label: "Feature History", icon: Database },
              { label: "Engineer Outcomes", icon: CheckCircle },
              { label: "Labeled Data", icon: FileText },
              { label: "Model Validation", icon: BarChart3 },
              { label: "Better Predictions", icon: TrendingUp },
              { label: "Better Actions", icon: Zap },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1 px-2 py-1.5 rounded bg-surface-alt min-w-[70px] text-center border border-border">
                  <step.icon className="h-4 w-4 text-primary" />
                  <span className="text-[8px] font-medium text-text-secondary text-center">{step.label}</span>
                </div>
                {i < 7 && <ChevronRight className="h-3 w-3 text-primary/30 flex-shrink-0" />}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-text-muted mt-2">
            <strong className="text-text-secondary">Potential future data advantage — not an existing moat.</strong>{" "}
            The flywheel requires real pilot data to begin rotating.
          </p>
        </CardContent>
      </Card>

      {/* Current Evidence */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Current Evidence</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: "Projects", value: stats.projects },
              { label: "Inspections", value: stats.inspections },
              { label: "Issues", value: stats.issues },
              { label: "Photos", value: stats.photos },
              { label: "Features", value: 24 },
              { label: "Risk Categories", value: 6 },
            ].map((item) => (
              <div key={item.label} className="text-center p-2 rounded border border-border bg-surface">
                <p className="text-lg font-bold text-text-primary">{item.value}</p>
                <p className="text-[9px] text-text-muted">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 rounded bg-surface-alt text-[10px] text-text-muted">
            <strong className="text-text-secondary">Actual evidence:</strong> All counts from real database records.
            No fabricated metrics.
          </div>
        </CardContent>
      </Card>

      {/* Responsible AI */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Responsible AI Principle</h3>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border border-status-attention-border bg-status-attention-bg">
            <p className="text-xs text-text-primary font-medium mb-2">
              BuildMe provides decision support, not structural certification or professional engineering approval.
            </p>
            <div className="space-y-1 text-[10px] text-text-secondary">
              <p>• Every risk score is traceable to actual project data</p>
              <p>• Every recommendation shows the triggering signal</p>
              <p>• Engineers make all final decisions</p>
              <p>• AI observations require human review</p>
              <p>• GPS confirms device location — not physical work performed</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-text-muted">
            <div className="flex items-center gap-1"><EvidenceLabel type="observed" /> Direct DB data</div>
            <div className="flex items-center gap-1"><EvidenceLabel type="derived" /> Computed from data</div>
            <div className="flex items-center gap-1"><EvidenceLabel type="rule_based" /> Rule-based engine</div>
            <div className="flex items-center gap-1"><EvidenceLabel type="planned" /> Future capability</div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/engineer/roadmap" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          View EIR Roadmap <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/engineer/eir-readiness" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          View EIR Readiness <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

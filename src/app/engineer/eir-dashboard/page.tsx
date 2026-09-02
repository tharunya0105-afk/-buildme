"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Rocket, Target, Brain, MapPin, CheckCircle, Clock, ArrowRight,
  AlertTriangle, Shield, Users, Building2, Zap, Sparkles, Eye,
  TrendingUp, DollarSign, Database, Cpu, Globe, Lightbulb,
  BarChart3, Activity, FileText, Camera, ClipboardCheck, Layers,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

function StatusDot({ status }: { status: "done" | "current" | "future" }) {
  const colors = { done: "bg-status-normal", current: "bg-primary animate-pulse", future: "bg-text-muted" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}

export default function EirDashboardPage() {
  const [stats, setStats] = useState({ projects: 0, inspections: 0, issues: 0, photos: 0, workers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/commercialization").then((r) => r.json()),
    ]).then(([dashboard, commercial]) => {
      if (dashboard.projects) {
        setStats({
          projects: dashboard.projects.length,
          inspections: dashboard.projects.reduce((s: number, p: any) => s + (p._count?.inspections || 0), 0),
          issues: dashboard.projects.reduce((s: number, p: any) => s + (p._count?.alerts || 0), 0),
          photos: dashboard.projects.reduce((s: number, p: any) => s + (p._count?.photos || 0), 0),
          workers: 0,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-secondary">Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-1">BuildMe</h1>
            <p className="text-sm text-text-secondary">Technology → Validation → Intelligence → Venture</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">TRL 3–4</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-status-attention-bg text-status-attention font-medium">MeitY GENESIS EiR 3.0</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-alt text-text-muted font-medium">CEDI, NIT Trichy</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5-Card Executive Summary */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "PROBLEM", value: "Fragmented construction information", icon: AlertTriangle, color: "text-status-review" },
          { label: "INTELLIGENCE", value: "Explainable project risk", icon: Brain, color: "text-primary" },
          { label: "SPATIAL", value: "Location-aware context", icon: MapPin, color: "text-status-attention" },
          { label: "ACTION", value: "Prioritized recommendations", icon: Target, color: "text-status-normal" },
          { label: "LEARNING", value: "Outcome-driven future ML", icon: Sparkles, color: "text-primary" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="py-3 text-center">
              <item.icon className={`h-5 w-5 ${item.color} mx-auto mb-1`} />
              <p className="text-[9px] font-bold text-text-primary">{item.label}</p>
              <p className="text-[8px] text-text-muted">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <Building2 className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-text-primary">{stats.projects}</p>
            <p className="text-[9px] text-text-muted">Projects</p>
            <p className="text-[8px] text-status-normal">IMPLEMENTED</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <Users className="h-5 w-5 text-text-muted mx-auto mb-1" />
            <p className="text-2xl font-bold text-text-primary">0</p>
            <p className="text-[9px] text-text-muted">Customer Interviews</p>
            <p className="text-[8px] text-status-review">NOT VALIDATED</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <Rocket className="h-5 w-5 text-text-muted mx-auto mb-1" />
            <p className="text-2xl font-bold text-text-primary">0</p>
            <p className="text-[9px] text-text-muted">Active Pilots</p>
            <p className="text-[8px] text-status-review">NOT VALIDATED</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <DollarSign className="h-5 w-5 text-text-muted mx-auto mb-1" />
            <p className="text-2xl font-bold text-text-primary">₹0</p>
            <p className="text-[9px] text-text-muted">Revenue</p>
            <p className="text-[8px] text-status-review">NOT VALIDATED</p>
          </CardContent>
        </Card>
      </div>

      {/* Core Technology Story */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Core Technology Pipeline</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {[
              { label: "Project Data", icon: Database, status: "done" as const },
              { label: "Feature Engineering", icon: Layers, status: "done" as const },
              { label: "Risk Intelligence", icon: Brain, status: "done" as const },
              { label: "Spatial Context", icon: MapPin, status: "done" as const },
              { label: "Attention", icon: Eye, status: "done" as const },
              { label: "Recommendation", icon: Target, status: "done" as const },
              { label: "Engineer Action", icon: Zap, status: "done" as const },
              { label: "Outcome", icon: CheckCircle, status: "done" as const },
              { label: "Validation Data", icon: Database, status: "current" as const },
              { label: "ML Model", icon: Cpu, status: "future" as const },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center flex-shrink-0">
                <div className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded border min-w-[65px] text-center ${
                  step.status === "done" ? "border-status-normal/30 bg-status-normal-bg" :
                  step.status === "current" ? "border-primary/30 bg-primary/5" :
                  "border-border bg-surface"
                }`}>
                  <step.icon className={`h-4 w-4 ${
                    step.status === "done" ? "text-status-normal" :
                    step.status === "current" ? "text-primary" : "text-text-muted"
                  }`} />
                  <span className="text-[8px] font-medium text-text-secondary text-center">{step.label}</span>
                  <StatusDot status={step.status} />
                </div>
                {i < 9 && <span className="mx-0.5 text-text-muted text-xs">→</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[9px] text-text-muted">
            <span className="flex items-center gap-1"><StatusDot status="done" /> IMPLEMENTED</span>
            <span className="flex items-center gap-1"><StatusDot status="current" /> COLLECTING DATA</span>
            <span className="flex items-center gap-1"><StatusDot status="future" /> PLANNED</span>
          </div>
        </CardContent>
      </Card>

      {/* Technology Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-text-primary">AI/ML</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {[
                { label: "Risk Engine (rule-based)", status: "IMPLEMENTED" },
                { label: "24 Feature Signals", status: "IMPLEMENTED" },
                { label: "6 Risk Categories", status: "IMPLEMENTED" },
                { label: "Explainable Scoring", status: "IMPLEMENTED" },
                { label: "ML Model Training", status: "NOT VALIDATED" },
                { label: "Model Evaluation", status: "PLANNED" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[10px]">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    item.status === "IMPLEMENTED" ? "bg-status-normal-bg text-status-normal" :
                    item.status === "NOT VALIDATED" ? "bg-status-review-bg text-status-review" :
                    "bg-surface-alt text-text-muted"
                  }`}>{item.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-text-primary">Spatial</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {[
                { label: "GPS Coordinates", status: "IMPLEMENTED" },
                { label: "Geofencing", status: "IMPLEMENTED" },
                { label: "Haversine Distance", status: "IMPLEMENTED" },
                { label: "Nearby Project Risk", status: "IMPLEMENTED" },
                { label: "Spatial Experiment", status: "NOT TESTED" },
                { label: "Weather/Terrain Layers", status: "PLANNED" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[10px]">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    item.status === "IMPLEMENTED" ? "bg-status-normal-bg text-status-normal" :
                    item.status === "NOT TESTED" ? "bg-status-attention-bg text-status-attention" :
                    "bg-surface-alt text-text-muted"
                  }`}>{item.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-text-primary">Validation</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {[
                { label: "Customer Interviews", status: "0 / 10" },
                { label: "Active Pilots", status: "0 / 3" },
                { label: "Measured Outcomes", status: "0 / 5" },
                { label: "WTP Responses", status: "0 / 5" },
                { label: "ML Models Trained", status: "0 / 1" },
                { label: "Pricing Experiments", status: "0 / 1" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[10px]">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-surface-alt text-text-muted">{item.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EIR Roadmap */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">12-Month EIR Roadmap</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                stage: "Stage 1", months: "Months 1–3", title: "Validate", status: "current" as const,
                targets: ["10+ customer interviews", "2–3 pilot engineers", "Baseline measurements", "First real project data"],
              },
              {
                stage: "Stage 2", months: "Months 4–6", title: "Dataset", status: "future" as const,
                targets: ["Longitudinal snapshots", "Action outcomes", "Recommendation feedback", "Labelled events"],
              },
              {
                stage: "Stage 3", months: "Months 7–9", title: "ML", status: "future" as const,
                targets: ["Baseline comparison", "First ML model", "Evaluation metrics", "Error analysis"],
              },
              {
                stage: "Stage 4", months: "Months 10–12", title: "Validate", status: "future" as const,
                targets: ["Pilot outcomes", "Time savings measured", "WTP evidence", "Commercial experiment"],
              },
            ].map((s) => (
              <div key={s.stage} className={`p-3 rounded border ${
                s.status === "current" ? "border-primary bg-primary/5" : "border-border bg-surface"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status={s.status} />
                  <span className="text-xs font-semibold text-text-primary">{s.stage} — {s.title}</span>
                  <span className="text-[9px] text-text-muted">{s.months}</span>
                </div>
                <div className="flex flex-wrap gap-1 ml-4">
                  {s.targets.map((t) => (
                    <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-surface-alt text-text-muted">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Why CEDI */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Why BuildMe Needs CEDI EiR</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { title: "Technical Mentorship", items: ["ML development", "Spatial architecture", "Model evaluation"], icon: Brain },
              { title: "Incubation", items: ["Pilot execution", "Engineer onboarding", "Product refinement"], icon: Rocket },
              { title: "Network", items: ["Civil engineers", "Contractors", "Construction ecosystem"], icon: Globe },
              { title: "Infrastructure", items: ["Computing", "Development", "Testing", "Data storage"], icon: Database },
            ].map((s) => (
              <div key={s.title} className="p-3 rounded border border-border bg-surface">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <s.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold text-text-primary">{s.title}</span>
                </div>
                <ul className="space-y-0.5">
                  {s.items.map((item) => (
                    <li key={item} className="text-[9px] text-text-secondary">• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-text-muted mt-2">
            CEDI should accelerate a validation process, not simply fund more coding.
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/engineer/validation" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Validation Command Center <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/engineer/technology" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Technology Core <ArrowRight className="h-3 w-3" />
        </Link>
        <Link href="/engineer/roadmap" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          EIR Roadmap <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}



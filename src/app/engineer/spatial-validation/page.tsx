"use client";

import Link from "next/link";
import {
  MapPin, ArrowRight, CheckCircle, Clock, AlertTriangle,
  Target, Database, BarChart3, Activity, Layers, Globe,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

function StatusBadge({ status }: { status: "implemented" | "not_tested" | "planned" }) {
  const config = {
    implemented: { bg: "bg-status-normal-bg text-status-normal", label: "IMPLEMENTED" },
    not_tested: { bg: "bg-status-attention-bg text-status-attention", label: "NOT TESTED" },
    planned: { bg: "bg-surface-alt text-text-muted", label: "PLANNED" },
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold ${config[status].bg}`}>{config[status].label}</span>;
}

export default function SpatialValidationPage() {
  const currentCapabilities = [
    { label: "GPS Coordinate Capture", desc: "Projects store latitude/longitude", status: "implemented" as const },
    { label: "Haversine Distance Calculation", desc: "Calculate real distance between coordinates", status: "implemented" as const },
    { label: "Project Proximity Analysis", desc: "Identify nearby projects and distances", status: "implemented" as const },
    { label: "Geofenced Workforce Verification", desc: "Verify worker device location near site", status: "implemented" as const },
    { label: "Spatial Risk Context", desc: "Nearby project risk contributes to context", status: "implemented" as const },
    { label: "Project Density Mapping", desc: "Show geographic distribution of projects", status: "implemented" as const },
  ];

  const futureCapabilities = [
    { label: "Weather / Rainfall Data", desc: "Construction-appropriate weather context", status: "planned" as const },
    { label: "Terrain / Elevation", desc: "Topographic construction context", status: "planned" as const },
    { label: "Road Accessibility", desc: "Site accessibility and logistics", status: "planned" as const },
    { label: "Satellite Imagery", desc: "Visual construction progress monitoring", status: "planned" as const },
    { label: "Regional Construction Patterns", desc: "Area-specific construction norms", status: "planned" as const },
    { label: "Environmental Context", desc: "Environmental risk factors", status: "planned" as const },
  ];

  const experiments = [
    {
      id: 1,
      title: "Does location improve construction risk estimation?",
      method: "Compare risk model without spatial features vs. risk model with spatial features",
      status: "not_tested" as const,
      required: "Labeled project outcomes with and without spatial features",
    },
    {
      id: 2,
      title: "Does spatial clustering reveal useful operational patterns?",
      method: "Analyze whether geographically clustered projects share risk characteristics",
      status: "not_tested" as const,
      required: "Multiple projects in same geographic area with outcome data",
    },
    {
      id: 3,
      title: "Does GPS verification improve workforce/project evidence reliability?",
      method: "Compare project outcomes with and without GPS-verified workforce presence",
      status: "not_tested" as const,
      required: "Pilot data comparing GPS-verified vs non-verified check-ins",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Spatial Validation</h1>
        <p className="text-sm text-text-secondary mt-1">How spatial intelligence contributes to construction risk assessment</p>
        <p className="text-[10px] text-text-muted mt-1">
          Spatial proximity provides contextual information and does not establish causation.
        </p>
      </div>

      {/* Current Capabilities */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Current Spatial Capabilities</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentCapabilities.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs text-text-primary">{item.label}</p>
                  <p className="text-[9px] text-text-muted">{item.desc}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spatial Pipeline */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Spatial Intelligence Pipeline</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {[
              { label: "Project Location", icon: MapPin },
              { label: "Spatial Features", icon: Layers },
              { label: "Contextual Risk", icon: Target },
              { label: "Decision Support", icon: CheckCircle },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1 px-3 py-2 rounded bg-primary/5 border border-primary/20 min-w-[80px] text-center">
                  <step.icon className="h-4 w-4 text-primary" />
                  <span className="text-[9px] font-medium text-text-secondary">{step.label}</span>
                </div>
                {i < 3 && <span className="mx-1 text-primary/40 text-sm">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spatial Experiments */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Spatial Validation Experiments</h3>
          <p className="text-[10px] text-text-muted">All currently NOT TESTED — require pilot data</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {experiments.map((exp) => (
              <div key={exp.id} className="p-3 rounded border border-border bg-surface">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-text-primary">Experiment {exp.id}</h4>
                  <StatusBadge status={exp.status} />
                </div>
                <p className="text-[10px] text-text-secondary mb-1">{exp.title}</p>
                <p className="text-[9px] text-text-muted">Method: {exp.method}</p>
                <p className="text-[9px] text-text-muted">Required: {exp.required}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future Spatial Layers */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Future Spatial Data Layers</h3>
          <p className="text-[10px] text-text-muted">PLANNED — no external data sources connected yet</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {futureCapabilities.map((item) => (
              <div key={item.label} className="p-2 rounded border border-border bg-surface">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-text-primary font-medium">{item.label}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-[9px] text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-text-muted mt-2">
            PLANNED DATA SOURCE — these capabilities require external data integration not yet implemented.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Link href="/engineer/ai-validation" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          <ArrowRight className="h-3 w-3 rotate-180" /> AI/ML Validation
        </Link>
        <Link href="/engineer/validation" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Validation Command Center <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

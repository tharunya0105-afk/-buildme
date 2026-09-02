"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Rocket, Target, Brain, MapPin, CheckCircle, Clock, ArrowRight,
  AlertTriangle, Shield, Users, Building2, Zap, Sparkles, Eye,
  TrendingUp, DollarSign, Database, Cpu, Globe, Lightbulb,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

function StatusBadge({ status }: { status: "ready" | "partial" | "not_ready" | "not_validated" }) {
  const styles = {
    ready: "bg-status-normal-bg text-status-normal",
    partial: "bg-status-attention-bg text-status-attention",
    not_ready: "bg-status-review-bg text-status-review",
    not_validated: "bg-surface-alt text-text-muted",
  };
  const labels = { ready: "READY", partial: "PARTIAL", not_ready: "NOT READY", not_validated: "NOT VALIDATED" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function MetricCard({ label, value, status }: { label: string; value: string | number; status: string }) {
  return (
    <div className="text-center p-3 rounded border border-border bg-surface">
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-[9px] text-text-muted mt-0.5">{label}</p>
      <p className="text-[8px] text-text-muted mt-0.5">{status}</p>
    </div>
  );
}

export default function EirReadinessPage() {
  const [stats, setStats] = useState({ projects: 0, inspections: 0, issues: 0, photos: 0, workers: 0 });

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
          <h1 className="text-2xl font-bold text-text-primary">CEDI EiR Readiness</h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
            MeitY GENESIS EiR Program
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          BuildMe — AI + Spatial Construction Intelligence Platform
        </p>
        <p className="text-[10px] text-text-muted mt-1">
          Technology Readiness Level: <strong className="text-text-primary">TRL 3–4</strong> (Proof of Concept / Early Prototype)
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">BuildMe at a Glance</h3>
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
        </CardContent>
      </Card>

      {/* Problem */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">1. Problem</h3>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-secondary mb-3">
            Construction project information is fragmented across multiple channels:
          </p>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {["WhatsApp", "Spreadsheets", "Photos", "Phone Calls", "Inspection Records"].map((tool) => (
              <div key={tool} className="text-center p-2 rounded bg-surface-alt text-[10px] text-text-secondary">
                {tool}
              </div>
            ))}
          </div>
          <div className="p-3 rounded bg-status-attention-bg border border-status-attention-border">
            <p className="text-xs text-text-primary font-medium">
              Core question: When an engineer manages multiple construction projects, how do they know what requires attention right now?
            </p>
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            <strong>Customer hypothesis:</strong> Independent civil engineers / small contractors managing multiple residential projects.
            Not yet validated.
          </p>
        </CardContent>
      </Card>

      {/* Solution */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">2. Solution</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {[
              { label: "Risk", icon: AlertTriangle },
              { label: "Attention", icon: Eye },
              { label: "Recommendation", icon: Target },
              { label: "Action", icon: Zap },
              { label: "Outcome", icon: CheckCircle },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center flex-shrink-0">
                <div className="flex items-center gap-1 px-3 py-2 rounded bg-primary/10 text-primary text-[10px] font-medium">
                  <step.icon className="h-3.5 w-3.5" />
                  {step.label}
                </div>
                {i < 4 && <span className="mx-1 text-text-muted">→</span>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            BuildMe transforms project evidence into prioritized engineer actions with traceable provenance.
          </p>
        </CardContent>
      </Card>

      {/* Technology */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">3. Technology</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded border border-border bg-surface">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold text-text-primary">AI/ML</h4>
              </div>
              <ul className="space-y-1 text-[10px] text-text-secondary">
                <li>• 24-engineer feature extraction</li>
                <li>• 6-category risk intelligence</li>
                <li>• Explainable rule-based scoring</li>
                <li>• Future supervised learning</li>
                <li>• Outcome-based validation</li>
              </ul>
              <p className="text-[9px] text-text-muted mt-1">Status: Rule-based engine operational. ML planned after pilot data.</p>
            </div>
            <div className="p-3 rounded border border-border bg-surface">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold text-text-primary">Spatial</h4>
              </div>
              <ul className="space-y-1 text-[10px] text-text-secondary">
                <li>• GPS coordinates and geofencing</li>
                <li>• Haversine proximity analysis</li>
                <li>• Nearby project risk context</li>
                <li>• Workforce location verification</li>
                <li>• Future geographic data layers</li>
              </ul>
              <p className="text-[9px] text-text-muted mt-1">Status: GPS, geofencing, and spatial context operational.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Prototype */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">4. Current Prototype</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Dashboard", status: "ready" as const },
              { label: "Sites", status: "ready" as const },
              { label: "Project Intelligence", status: "ready" as const },
              { label: "Risk Engine", status: "ready" as const },
              { label: "Spatial Intelligence", status: "ready" as const },
              { label: "Command Center", status: "ready" as const },
              { label: "GPS Verification", status: "ready" as const },
              { label: "Evidence Trail", status: "ready" as const },
              { label: "Inspections", status: "ready" as const },
              { label: "Photo Upload", status: "ready" as const },
              { label: "Cost Intelligence", status: "partial" as const },
              { label: "ML Models", status: "not_validated" as const },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded border border-border bg-surface">
                <span className="text-[10px] text-text-secondary">{item.label}</span>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">5. Current Evidence</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Projects" value={stats.projects} status="Real database records" />
            <MetricCard label="Customer Interviews" value={0} status="NOT VALIDATED" />
            <MetricCard label="Pilots" value={0} status="NOT VALIDATED" />
            <MetricCard label="Revenue" value="₹0" status="NOT VALIDATED" />
            <MetricCard label="Labeled Outcomes" value={0} status="Infrastructure ready" />
            <MetricCard label="ML Models Trained" value={0} status="Requires pilot data" />
            <MetricCard label="Features Engineered" value={24} status="Implemented" />
            <MetricCard label="Risk Categories" value={6} status="Implemented" />
          </div>
          <p className="text-[10px] text-text-muted mt-3 p-2 rounded bg-surface-alt">
            <strong className="text-text-secondary">Evidence principle:</strong> We do not count prototypes as customers,
            interest as revenue, or assumptions as validation.
          </p>
        </CardContent>
      </Card>

      {/* Why CEDI? */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">6. Why BuildMe Needs the EIR Program</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Technical Mentorship",
                icon: Brain,
                items: ["ML model development guidance", "Spatial intelligence architecture", "Model evaluation methodology", "Data architecture design"],
              },
              {
                title: "Incubation Support",
                icon: Rocket,
                items: ["Pilot execution framework", "Engineer onboarding", "Customer discovery", "Product refinement"],
              },
              {
                title: "Infrastructure",
                icon: Database,
                items: ["Computing resources", "Development environment", "Testing infrastructure", "Data storage"],
              },
              {
                title: "Network Access",
                icon: Globe,
                items: ["Civil engineers", "Contractors", "Construction ecosystem", "Industry validation"],
              },
            ].map((section) => (
              <div key={section.title} className="p-3 rounded border border-border bg-surface">
                <div className="flex items-center gap-2 mb-2">
                  <section.icon className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-semibold text-text-primary">{section.title}</h4>
                </div>
                <ul className="space-y-1 text-[10px] text-text-secondary">
                  {section.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* EIR Development Path */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">7. EIR Development Opportunity</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {[
              { label: "Prototype", sublabel: "Current", icon: Rocket, active: true },
              { label: "Pilot", sublabel: "Months 1-3", icon: Users, active: false },
              { label: "Dataset", sublabel: "Months 4-6", icon: Database, active: false },
              { label: "ML Model", sublabel: "Months 7-9", icon: Cpu, active: false },
              { label: "Validated", sublabel: "Months 10-12", icon: CheckCircle, active: false },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center flex-shrink-0">
                <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border min-w-[80px] text-center ${
                  step.active ? "border-primary bg-primary/10" : "border-border bg-surface"
                }`}>
                  <step.icon className={`h-5 w-5 ${step.active ? "text-primary" : "text-text-muted"}`} />
                  <span className={`text-[10px] font-semibold ${step.active ? "text-primary" : "text-text-secondary"}`}>{step.label}</span>
                  <span className="text-[8px] text-text-muted">{step.sublabel}</span>
                </div>
                {i < 4 && <span className="mx-1 text-text-muted">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded bg-primary/5 border border-primary/20">
            <p className="text-xs text-text-primary font-medium">
              The EIR period enables the critical transition from working prototype to validated intelligence product.
            </p>
            <p className="text-[10px] text-text-secondary mt-1">
              Without real pilot data, BuildMe cannot validate whether its intelligence engine actually helps engineers.
              The EIR program provides the infrastructure, mentorship, and network to execute this validation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CEDI Readiness Matrix */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">8. CEDI Readiness Assessment</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { criterion: "Technology-led", status: "ready" as const, detail: "AI/Spatial intelligence core" },
              { criterion: "AI/ML relevance", status: "partial" as const, detail: "Rule-based engine operational, ML planned" },
              { criterion: "Spatial relevance", status: "ready" as const, detail: "GPS, geofencing, spatial context operational" },
              { criterion: "Early-stage prototype", status: "ready" as const, detail: "Working prototype with real DB" },
              { criterion: "Clear problem", status: "ready" as const, detail: "Fragmented construction information" },
              { criterion: "Customer hypothesis", status: "partial" as const, detail: "Independent engineers — not yet validated" },
              { criterion: "Validation infrastructure", status: "ready" as const, detail: "Pilot, measurement, feedback systems" },
              { criterion: "Commercialization", status: "partial" as const, detail: "Business model hypotheses — not validated" },
              { criterion: "Technical roadmap", status: "ready" as const, detail: "12-month EIR roadmap defined" },
              { criterion: "EIR development potential", status: "ready" as const, detail: "Clear path from prototype → dataset → ML" },
              { criterion: "Defensibility", status: "not_validated" as const, detail: "Potential future data advantage — not established" },
              { criterion: "Responsible claims", status: "ready" as const, detail: "No fabricated data, honest empty states" },
            ].map((item) => (
              <div key={item.criterion} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-xs text-text-primary">{item.criterion}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-text-muted">{item.detail}</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Responsible AI */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">9. Responsible AI Principle</h3>
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
              <p>• No fabricated customers, revenue, or validation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/engineer/technology" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          <ArrowRight className="h-3 w-3 rotate-180" /> Technology Core
        </Link>
        <Link href="/engineer/roadmap" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          EIR Roadmap <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Rocket, Target, Database, Cpu, CheckCircle, Clock, ArrowRight,
  AlertTriangle, Eye, Zap, Brain, MapPin, Shield, TrendingUp,
  CircleDot,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

function StatusDot({ status }: { status: "done" | "current" | "future" }) {
  const colors = { done: "bg-status-normal", current: "bg-primary", future: "bg-text-muted" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}

function Milestone({ title, status, description }: { title: string; status: "done" | "current" | "future"; description: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <StatusDot status={status} />
      <div>
        <p className={`text-xs font-medium ${status === "future" ? "text-text-muted" : "text-text-primary"}`}>{title}</p>
        <p className="text-[10px] text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">BuildMe — 12 Month EIR Technology Roadmap</h1>
        <p className="text-sm text-text-secondary mt-1">
          From working prototype to validated construction intelligence
        </p>
        <p className="text-[10px] text-text-muted mt-1">
          Progression: Idea → PoC → Prototype → Pilot → Dataset → ML Model → Validated Intelligence
        </p>
      </div>

      {/* Current Position */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Current Position</h3>
              <p className="text-xs text-text-secondary">
                Working prototype with database-backed workflows, explainable risk engine, and spatial intelligence.
                Ready for pilot execution.
              </p>
              <p className="text-[10px] text-text-muted mt-1">
                Technology Readiness: <strong className="text-text-primary">TRL 3–4</strong> (Proof of concept / Early prototype)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage 1 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-normal-bg text-status-normal">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Stage 1 — Months 1–3</h3>
              <p className="text-[10px] text-text-muted">Pilot-Ready Prototype</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Deliverables</h4>
              <div className="space-y-0">
                <Milestone title="Onboard 2–3 civil engineers" status="current" description="Real engineers managing real residential projects" />
                <Milestone title="Collect structured project data" status="current" description="Inspections, issues, photos, workforce check-ins" />
                <Milestone title="Stabilize core workflows" status="done" description="Dashboard, Sites, Intelligence, Command Center" />
                <Milestone title="Validate core pain points" status="current" description="Customer discovery interviews" />
                <Milestone title="Collect structured outcomes" status="current" description="Action completion with outcomes and feedback" />
                <Milestone title="Improve spatial verification" status="done" description="GPS geofencing operational" />
                <Milestone title="Measure recommendation usefulness" status="current" description="Actionability rate from engineer feedback" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Success Metrics</h4>
              <div className="p-3 rounded bg-surface-alt text-[10px] text-text-secondary">
                <p className="font-medium text-text-primary mb-1">Validation target — to be measured during pilot</p>
                <ul className="space-y-1">
                  <li>• Engineer willingness to continue using BuildMe</li>
                  <li>• Recommendation actionability rate</li>
                  <li>• Workflow improvement (baseline vs. BuildMe)</li>
                  <li>• Homeowner satisfaction with transparency</li>
                </ul>
                <p className="text-text-muted mt-2">
                  Do NOT predefine success criteria before pilot begins. Measure actual outcomes.
                </p>
              </div>
              <div className="mt-3">
                <StatusDot status="current" /> <span className="text-[10px] text-text-muted">Current stage</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage 2 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-attention-bg text-status-attention">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Stage 2 — Months 4–6</h3>
              <p className="text-[10px] text-text-muted">Dataset Generation</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Deliverables</h4>
              <div className="space-y-0">
                <Milestone title="Longitudinal project snapshots" status="future" description="Regular risk/health snapshots per project over time" />
                <Milestone title="Outcome labels" status="future" description="Structured engineer responses to recommendations" />
                <Milestone title="Feature quality monitoring" status="future" description="Track which features contribute to useful recommendations" />
                <Milestone title="Recommendation evaluation" status="future" description="Systematic feedback on actionability" />
                <Milestone title="Baseline evaluation" status="future" description="Compare rule-based engine performance across projects" />
                <Milestone title="Spatial feature expansion" status="future" description="Add geographic context layers" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Goal</h4>
              <div className="p-3 rounded bg-surface-alt text-[10px] text-text-secondary">
                <p className="font-medium text-text-primary mb-1">Build sufficient structured data for meaningful evaluation</p>
                <ul className="space-y-1">
                  <li>• 50+ project snapshots</li>
                  <li>• 100+ action outcomes</li>
                  <li>• 50+ engineer feedback records</li>
                  <li>• Longitudinal feature history</li>
                </ul>
                <p className="text-text-muted mt-2">
                  These are targets, not achievements. Will be measured during pilot.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage 3 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Stage 3 — Months 7–9</h3>
              <p className="text-[10px] text-text-muted">First ML Prototype</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Potential Models</h4>
              <div className="space-y-0">
                <Milestone title="Risk classification" status="future" description="Predict project risk level from features" />
                <Milestone title="Attention prediction" status="future" description="Predict which projects will need attention" />
                <Milestone title="Schedule risk" status="future" description="Predict likelihood of schedule delay" />
                <Milestone title="Issue escalation" status="future" description="Predict which issues will escalate" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Critical Rule</h4>
              <div className="p-3 rounded bg-status-attention-bg border border-status-attention-border text-[10px] text-text-secondary">
                <p className="font-medium text-status-attention mb-1">ML model must beat risk-engine-v1 baseline</p>
                <p>
                  Only train models if dataset quality supports it. The ML model must outperform the
                  rule-based baseline before being considered useful. If it does not beat the baseline,
                  the rule-based engine remains the production system.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage 4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt text-text-secondary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Stage 4 — Months 10–12</h3>
              <p className="text-[10px] text-text-muted">Validated Intelligence Prototype</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Deliverables</h4>
              <div className="space-y-0">
                <Milestone title="Model evaluation" status="future" description="Precision, recall, calibration against real outcomes" />
                <Milestone title="Error analysis" status="future" description="Where does the model fail? What are false positives?" />
                <Milestone title="Spatial feature evaluation" status="future" description="Which spatial features actually improve predictions?" />
                <Milestone title="Pilot validation results" status="future" description="Measured outcomes from real engineer usage" />
                <Milestone title="Monitoring and deployment" status="future" description="Production-ready prototype with monitoring" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Success Criteria</h4>
              <div className="p-3 rounded bg-surface-alt text-[10px] text-text-secondary">
                <p className="font-medium text-text-primary mb-1">Must be evidence-based</p>
                <ul className="space-y-1">
                  <li>• ML model outperforms rule-based baseline</li>
                  <li>• Recommendation actionability rate &gt; 50%</li>
                  <li>• Engineer retention rate measured</li>
                  <li>• Spatial features show measurable value</li>
                  <li>• At least one measurable workflow improvement</li>
                </ul>
                <p className="text-text-muted mt-2">
                  None of these will be claimed without evidence.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Readiness */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Technology Readiness Assessment</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Currently Demonstrates</h4>
              <ul className="space-y-1 text-[10px] text-text-secondary">
                <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-status-normal" /> Working software prototype</li>
                <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-status-normal" /> Integrated database</li>
                <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-status-normal" /> Intelligence pipeline</li>
                <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-status-normal" /> Spatial features</li>
                <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-status-normal" /> Engineer workflow</li>
                <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-status-normal" /> Outcome capture</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-primary mb-2">Requires</h4>
              <ul className="space-y-1 text-[10px] text-text-secondary">
                <li className="flex items-center gap-1"><Clock className="h-3 w-3 text-status-attention" /> Real pilot validation</li>
                <li className="flex items-center gap-1"><Clock className="h-3 w-3 text-status-attention" /> Longitudinal data</li>
                <li className="flex items-center gap-1"><Clock className="h-3 w-3 text-status-attention" /> ML training</li>
                <li className="flex items-center gap-1"><Clock className="h-3 w-3 text-status-attention" /> Model evaluation</li>
                <li className="flex items-center gap-1"><Clock className="h-3 w-3 text-status-attention" /> Production deployment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/engineer/technology" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          <ArrowRight className="h-3 w-3 rotate-180" /> Technology Core
        </Link>
        <Link href="/engineer/eir-readiness" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          EIR Readiness <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

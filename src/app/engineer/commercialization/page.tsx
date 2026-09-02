"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Target, TrendingUp, DollarSign, Lightbulb, HelpCircle,
  CheckCircle, Clock, ArrowRight, Plus, X, Building2, Shield,
  Rocket, Brain, BarChart3, Star, MessageSquare, Zap, Award,
  AlertTriangle, Eye, Database,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Discovery {
  id: string;
  participantRef: string | null;
  role: string | null;
  organizationType: string | null;
  interviewDate: string | null;
  currentWorkflow: string | null;
  biggestPain: string | null;
  painSeverity: string | null;
  frequency: string | null;
  costOfProblem: string | null;
  currentTools: string | null;
  buildMeReaction: string | null;
  trustedIntelligence: boolean | null;
  mostValuableFeature: string | null;
  requestedFeature: string | null;
  willingnessToPilot: string | null;
  willingnessToPay: string | null;
  preferredPricingModel: string | null;
  biggestObjection: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface CommercialData {
  discoveries: Discovery[];
  funnel: { discovered: number; interviewed: number; interested: number; pilotCandidate: number; pilotActive: number; pilotCompleted: number; paying: number; retained: number };
  painCounts: Record<string, { count: number; severity: string }>;
  wtpCounts: Record<string, number>;
  pricingCounts: Record<string, number>;
  summary: { totalDiscoveries: number; totalInterviews: number; totalPricingExperiments: number; totalValueExperiments: number };
}

const STATUS_LABELS: Record<string, string> = {
  discovered: "Discovered", interviewed: "Interviewed", interested: "Interested",
  pilot_candidate: "Pilot Candidate", pilot_active: "Pilot Active",
  pilot_completed: "Pilot Completed", paying: "Paying", retained: "Retained",
};

const WTP_LABELS: Record<string, string> = {
  definitely: "Definitely", probably: "Probably", unsure: "Unsure",
  probably_not: "Probably not", definitely_not: "Definitely not",
};

const PRICING_LABELS: Record<string, string> = {
  per_project: "Per project", per_engineer: "Per engineer",
  monthly: "Monthly subscription", annual: "Annual subscription", enterprise: "Enterprise",
};

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function CommercializationPage() {
  const [data, setData] = useState<CommercialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"dashboard" | "discovery" | "canvas" | "value" | "pricing" | "evidence">("dashboard");
  const [showAddDiscovery, setShowAddDiscovery] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    participantRef: "", role: "civil_engineer", organizationType: "individual",
    interviewDate: "", currentWorkflow: "", biggestPain: "", painSeverity: "medium",
    frequency: "", costOfProblem: "", currentTools: "", buildMeReaction: "",
    mostValuableFeature: "", requestedFeature: "", willingnessToPilot: "maybe",
    willingnessToPay: "unsure", preferredPricingModel: "per_project",
    biggestObjection: "", notes: "",
  });

  useEffect(() => {
    fetch("/api/commercialization")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createDiscovery = async () => {
    if (!form.biggestPain.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/commercialization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          interviewDate: form.interviewDate || null,
          trustedIntelligence: null,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => prev ? {
          ...prev,
          discoveries: [result.discovery, ...prev.discoveries],
          summary: { ...prev.summary, totalDiscoveries: prev.summary.totalDiscoveries + 1 },
        } : prev);
        setShowAddDiscovery(false);
        setForm({
          participantRef: "", role: "civil_engineer", organizationType: "individual",
          interviewDate: "", currentWorkflow: "", biggestPain: "", painSeverity: "medium",
          frequency: "", costOfProblem: "", currentTools: "", buildMeReaction: "",
          mostValuableFeature: "", requestedFeature: "", willingnessToPilot: "maybe",
          willingnessToPay: "unsure", preferredPricingModel: "per_project",
          biggestObjection: "", notes: "",
        });
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-text-secondary">
        <Brain className="h-5 w-5 animate-pulse text-primary" />
        <span>Loading commercialization data...</span>
      </div>
    </div>
  );

  const d = data;
  const hasDiscovery = (d?.summary.totalDiscoveries ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Target className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-text-primary">Commercialization Command Center</h2>
          </div>
          <p className="text-sm text-text-secondary">Customer discovery, business model validation, and evidence tracking.</p>
        </div>
        <Button onClick={() => setShowAddDiscovery(true)}><Plus className="h-4 w-4 mr-2" />Record Interview</Button>
      </div>

      {/* Section Nav */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
          { key: "discovery" as const, label: "Customer Discovery", icon: Users },
          { key: "canvas" as const, label: "Business Model", icon: Building2 },
          { key: "value" as const, label: "Value Propositions", icon: Lightbulb },
          { key: "pricing" as const, label: "Pricing", icon: DollarSign },
          { key: "evidence" as const, label: "Evidence Over Claims", icon: Shield },
        ]).map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === s.key ? "bg-primary text-white" : "bg-surface-alt text-text-secondary hover:bg-border"
            }`}>
            <s.icon className="h-4 w-4" />{s.label}
          </button>
        ))}
      </div>

      {/* ─── DASHBOARD ──────────────────────────────────────────── */}
      {activeSection === "dashboard" && (
        <div className="space-y-6">
          {/* Funnel */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Customer Discovery Funnel</h3>
              <p className="text-sm text-text-muted">From first contact to retained customer — based on actual records</p>
            </CardHeader>
            <CardContent>
              {d && (
                <div className="space-y-3">
                  {[
                    { step: "Discovered", count: d.funnel.discovered, total: d.summary.totalDiscoveries, icon: Users },
                    { step: "Interviewed", count: d.funnel.interviewed, total: d.summary.totalDiscoveries, icon: MessageSquare },
                    { step: "Interested", count: d.funnel.interested, total: d.summary.totalDiscoveries, icon: Star },
                    { step: "Pilot Candidate", count: d.funnel.pilotCandidate, total: d.summary.totalDiscoveries, icon: Target },
                    { step: "Active Pilots", count: d.funnel.pilotActive, total: d.summary.totalDiscoveries, icon: Rocket },
                    { step: "Completed Pilots", count: d.funnel.pilotCompleted, total: d.summary.totalDiscoveries, icon: CheckCircle },
                    { step: "Paying", count: d.funnel.paying, total: null, icon: DollarSign },
                    { step: "Retained", count: d.funnel.retained, total: null, icon: Award },
                  ].map((s, i) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded flex-shrink-0 ${
                        s.count > 0 ? "bg-status-normal text-white" : "bg-surface-alt text-text-muted border border-border"
                      }`}>
                        <s.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{s.step}</span>
                          <span className="text-lg font-bold text-text-primary">{s.count}</span>
                        </div>
                      </div>
                      {i < 7 && <ArrowRight className="h-3 w-3 text-text-muted flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Interviews", value: d?.summary.totalDiscoveries ?? 0, icon: Users, color: "bg-primary/10 text-primary" },
              { label: "Pilot Candidates", value: d?.funnel.pilotCandidate ?? 0, icon: Target, color: "bg-status-normal-bg text-status-normal" },
              { label: "Pricing Experiments", value: d?.summary.totalPricingExperiments ?? 0, icon: DollarSign, color: "bg-status-attention-bg text-status-attention" },
              { label: "Value Experiments", value: d?.summary.totalValueExperiments ?? 0, icon: Lightbulb, color: "bg-surface-alt text-text-secondary" },
            ].map(card => (
              <Card key={card.label}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted">{card.label}</p>
                      <p className="text-2xl font-bold text-text-primary">{card.value}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Willingness to Pay */}
          {d && Object.keys(d.wtpCounts).length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Willingness to Pay</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(WTP_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-text-primary">{label}</span>
                      <span className="text-sm font-bold text-text-primary">{d.wtpCounts[key] || 0}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!hasDiscovery && (
            <Card className="border-primary/20">
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">First 10 Interviews</h3>
                <p className="text-xs text-text-muted">BuildMe has a working prototype but has not yet converted prototype usage into validated customer evidence.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    "Interview 10 civil engineers/contractors",
                    "Document current workflow",
                    "Identify recurring pain",
                    "Demonstrate Project Intelligence",
                    "Test pilot interest",
                    "Test willingness to pay",
                    "Record objections",
                    "Identify strongest use case",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded border border-border bg-surface-alt">
                      <div className="w-5 h-5 rounded border-2 border-border flex-shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-text-muted">{i + 1}</span>
                      </div>
                      <span className="text-sm text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── CUSTOMER DISCOVERY ─────────────────────────────────── */}
      {activeSection === "discovery" && (
        <div className="space-y-6">
          {/* Customer Hypothesis */}
          <Card className="border-primary/20">
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Primary Customer Hypothesis</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-semibold text-text-primary">Independent Civil Engineer / Small Contractor</p>
                  <p className="text-xs text-text-muted mt-1">Manages multiple residential projects, coordinates workers, conducts inspections, communicates with homeowners.</p>
                  <p className="text-[10px] text-primary mt-2 font-medium">HYPOTHESIS — not yet validated</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Current workflow (hypothesis):</p>
                  <p className="text-sm text-text-secondary">WhatsApp + Phone calls + Spreadsheets + Photos + Manual site visits + Verbal updates</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Job to be done:</p>
                  <p className="text-sm text-text-secondary italic">&ldquo;When I manage multiple construction projects, I need a reliable way to know what requires attention, maintain evidence, and communicate progress without manually checking every information source.&rdquo;</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">Discovery Interviews ({d?.discoveries.length ?? 0})</h3>
              <Button size="sm" onClick={() => setShowAddDiscovery(true)}><Plus className="h-3 w-3 mr-1" />Record Interview</Button>
            </div>
            {!hasDiscovery ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-text-primary mb-1">Customer discovery not started</p>
                  <p className="text-xs text-text-muted mb-4">Record your first interview to begin building customer evidence.</p>
                  <Button onClick={() => setShowAddDiscovery(true)}><Plus className="h-4 w-4 mr-2" />Record First Interview</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {d!.discoveries.map(discovery => (
                  <Card key={discovery.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-surface-alt px-2 py-0.5 rounded font-medium text-text-secondary">{STATUS_LABELS[discovery.status] || discovery.status}</span>
                            <span className="text-sm font-semibold text-text-primary">{discovery.participantRef || "Anonymous"}</span>
                          </div>
                          <p className="text-xs text-text-muted">{discovery.role || "Unknown role"} · {discovery.organizationType || "Unknown type"}</p>
                          {discovery.biggestPain && <p className="text-xs text-text-secondary mt-1">Pain: {discovery.biggestPain}</p>}
                          <div className="flex gap-3 mt-1 text-[10px] text-text-muted">
                            {discovery.willingnessToPilot && <span>Pilot: {discovery.willingnessToPilot}</span>}
                            {discovery.willingnessToPay && <span>WTP: {WTP_LABELS[discovery.willingnessToPay] || discovery.willingnessToPay}</span>}
                            {discovery.preferredPricingModel && <span>Pricing: {PRICING_LABELS[discovery.preferredPricingModel] || discovery.preferredPricingModel}</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-text-muted">{discovery.createdAt ? new Date(discovery.createdAt).toLocaleDateString() : ""}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pain Frequency */}
          {d && Object.keys(d.painCounts).length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Top Customer Pains</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(d.painCounts)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .map(([pain, info]) => (
                      <div key={pain} className="flex items-center justify-between p-2 rounded border border-border">
                        <div>
                          <span className="text-sm font-medium text-text-primary">{pain}</span>
                          <span className="text-xs text-text-muted ml-2">severity: {info.severity}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{info.count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {d && Object.keys(d.painCounts).length === 0 && hasDiscovery && (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-text-muted">Not enough discovery data to show pain frequency.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── BUSINESS MODEL CANVAS ──────────────────────────────── */}
      {activeSection === "canvas" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Business Model Canvas</h3>
              <p className="text-sm text-text-muted">Hypothesis — not yet validated</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Customer Segments", items: ["Primary: Independent civil engineers / small contractors", "Secondary: Construction firms, Developers", "Future: Engineering consultancies"], icon: Users },
                  { title: "Problem", items: ["Fragmented project information", "Manual evidence management", "Poor project visibility", "Communication overhead with homeowners"], icon: AlertTriangle },
                  { title: "Solution", items: ["Centralized project intelligence", "GPS workforce verification", "Risk-scored attention system", "Transparent evidence trail"], icon: Lightbulb },
                  { title: "Unique Value Prop", items: ["\"One intelligence layer for every active construction project.\"", "Spatial + risk + evidence in one platform", "Not a marketplace — a monitoring tool"], icon: Star },
                  { title: "Channels", items: ["Direct outreach", "Engineering networks", "Pilot programs", "Construction communities"], icon: ArrowRight },
                  { title: "Revenue", items: ["B2B SaaS", "Per-project or per-engineer pricing", "Hypothesis — not validated"], icon: DollarSign },
                  { title: "Key Metrics", items: ["Active projects", "Weekly active engineers", "Pilot conversion", "Retention", "Workflow improvement"], icon: BarChart3 },
                  { title: "Unfair Advantage", items: ["Potential future: structured construction dataset", "NOT an existing moat", "Requires pilot data to become defensible"], icon: Shield },
                ].map(section => (
                  <div key={section.title} className="p-4 rounded-lg border border-border bg-surface-alt">
                    <div className="flex items-center gap-2 mb-2">
                      <section.icon className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-text-primary">{section.title}</h4>
                    </div>
                    <ul className="space-y-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
                          <span className="text-primary mt-0.5">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitor Positioning */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Competitive Positioning — Hypothesis</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-text-muted">Capability</th>
                      <th className="text-center py-2 text-text-muted">Traditional</th>
                      <th className="text-center py-2 text-text-muted">PM Software</th>
                      <th className="text-center py-2 text-text-muted">BuildMe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cap: "Evidence-centric workflow", trad: "Basic", pm: "Partial", bm: "Full" },
                      { cap: "Spatial intelligence", trad: "None", pm: "None", bm: "Full" },
                      { cap: "Risk intelligence", trad: "None", pm: "None", bm: "Rule-based" },
                      { cap: "Workforce verification", trad: "Manual", pm: "None", bm: "GPS" },
                      { cap: "Homeowner visibility", trad: "Verbal", pm: "Partial", bm: "Portal" },
                      { cap: "AI interpretation", trad: "None", pm: "None", bm: "Prototype" },
                    ].map(row => (
                      <tr key={row.cap} className="border-b border-border">
                        <td className="py-2 text-text-primary font-medium">{row.cap}</td>
                        <td className="py-2 text-center text-text-muted">{row.trad}</td>
                        <td className="py-2 text-center text-text-muted">{row.pm}</td>
                        <td className="py-2 text-center text-primary font-medium">{row.bm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-text-muted mt-2">Current product hypothesis — not market-validated comparison.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── VALUE PROPOSITIONS ─────────────────────────────────── */}
      {activeSection === "value" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Value Proposition Experiments</h3>
              <p className="text-sm text-text-muted">Structured hypotheses about BuildMe&apos;s value — each requires evidence to validate</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { hypothesis: "BuildMe reduces the time engineers spend searching for project information", evidence: "Baseline workflow time vs. BuildMe workflow time", status: "not_tested" },
                  { hypothesis: "BuildMe improves project visibility for engineers managing multiple sites", evidence: "Engineer feedback on visibility before/after", status: "not_tested" },
                  { hypothesis: "BuildMe reduces reporting effort to homeowners", evidence: "Time spent on homeowner updates before/after", status: "not_tested" },
                  { hypothesis: "BuildMe improves evidence organization for dispute prevention", evidence: "Evidence completeness metrics during pilot", status: "not_tested" },
                  { hypothesis: "BuildMe helps engineers prioritize which projects need attention", evidence: "Risk intelligence usefulness feedback", status: "not_tested" },
                  { hypothesis: "BuildMe improves homeowner communication and trust", evidence: "Homeowner satisfaction scores", status: "not_tested" },
                ].map((v, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-text-primary flex-1">{v.hypothesis}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ml-2 flex-shrink-0 ${
                        v.status === "validated" ? "bg-status-normal-bg text-status-normal" :
                        v.status === "early_signal" ? "bg-status-attention-bg text-status-attention" :
                        "bg-surface-alt text-text-muted"
                      }`}>{v.status === "not_tested" ? "NOT TESTED" : v.status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-text-muted">Evidence required: {v.evidence}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-3">All value propositions are hypotheses. None are marked validated without evidence.</p>
            </CardContent>
          </Card>

          {/* Data Flywheel */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">BuildMe Data Flywheel — Potential Future Advantage</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  "Projects", "Inspections", "Issues", "Evidence", "Workforce activity",
                  "Spatial context", "Risk intelligence", "Pilot outcomes", "Validated labels",
                  "ML models", "Better intelligence", "More useful product", "More projects",
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <span className="text-xs text-text-secondary">{step}</span>
                    {i < 12 && <ArrowRight className="h-3 w-3 text-text-muted" />}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-2">Potential future data advantage — not an existing moat.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── PRICING ────────────────────────────────────────────── */}
      {activeSection === "pricing" && (
        <div className="space-y-6">
          {/* Pricing Model Hypotheses */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Pricing Model Hypotheses</h3>
              <p className="text-sm text-text-muted">Founder hypotheses — not validated</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { model: "Per Project / Month", desc: "Engineer pays per active project", target: "Small contractors", status: "hypothesis" },
                  { model: "Per Engineer / Month", desc: "Flat rate per team member", target: "Mid-size firms", status: "hypothesis" },
                  { model: "Contractor Subscription", desc: "Unlimited projects for a monthly fee", target: "Active contractors", status: "hypothesis" },
                  { model: "Enterprise", desc: "Custom pricing for large firms", target: "Construction companies", status: "hypothesis" },
                ].map(p => (
                  <div key={p.model} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-text-primary">{p.model}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-alt text-text-muted font-medium">{p.status.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{p.desc}</p>
                    <p className="text-[10px] text-text-muted mt-1">Target: {p.target}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-3">No pricing has been validated. All models are hypotheses.</p>
            </CardContent>
          </Card>

          {/* Pricing Preference */}
          {d && Object.keys(d.pricingCounts).length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Pricing Model Preference (from interviews)</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(PRICING_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-text-primary">{label}</span>
                      <span className="text-sm font-bold text-text-primary">{d.pricingCounts[key] || 0}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Value Calculator */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Illustrative Value Calculator</h3>
              <p className="text-xs text-text-muted">NOT actual savings — illustrative estimate only</p>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-surface-alt border border-border text-center">
                <p className="text-sm text-text-muted">Awaiting measured pilot data.</p>
                <p className="text-xs text-text-muted mt-1">This calculator will show illustrative ROI once baseline workflow measurements are recorded from real pilots.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── EVIDENCE OVER CLAIMS ───────────────────────────────── */}
      {activeSection === "evidence" && (
        <div className="space-y-6">
          {/* Validation Principle */}
          <Card className="border-primary/20">
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">BuildMe Validation Principle</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">&ldquo;We do not count prototypes as customers, interest as revenue, or assumptions as validation.&rdquo;</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What We Have Built */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-status-normal">What We Have Built</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "Database-backed project management",
                  "Engineer dashboard with real data",
                  "Site creation and management",
                  "Project Intelligence with health scoring",
                  "Risk engine with 24 features",
                  "GPS workforce verification",
                  "Evidence trail and dispute system",
                  "Homeowner portal",
                  "AI analysis pipeline (requires API key)",
                  "Pilot validation infrastructure",
                  "Customer discovery infrastructure",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 p-2 rounded border border-status-normal-border bg-status-normal-bg text-xs">
                    <CheckCircle className="h-3 w-3 text-status-normal flex-shrink-0" />
                    <span className="text-text-primary">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What We Have Tested */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-status-attention">What We Have Tested</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { item: "Customer discovery interviews", status: hasDiscovery ? `${d!.summary.totalDiscoveries} recorded` : "Not started" },
                  { item: "Pilot programs", status: "Not started" },
                  { item: "Willingness to pay", status: Object.keys(d?.wtpCounts ?? {}).length > 0 ? "Early signals" : "Not measured" },
                  { item: "Pricing model preference", status: Object.keys(d?.pricingCounts ?? {}).length > 0 ? "Early signals" : "Not measured" },
                  { item: "Retention", status: "Not measured" },
                  { item: "Revenue", status: "Not measured" },
                ].map(item => (
                  <div key={item.item} className="flex items-center justify-between p-2 rounded border border-status-attention-border bg-status-attention-bg text-xs">
                    <span className="text-text-primary font-medium">{item.item}</span>
                    <span className="text-text-muted">{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What Remains Unknown */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-status-review">What Remains Unknown</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "Real-world prediction accuracy",
                  "Actual time savings",
                  "Customer acquisition cost",
                  "Long-term retention",
                  "Revenue potential",
                  "Market size (validated)",
                  "Competitive differentiation (validated)",
                  "ML model usefulness (validated)",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 p-2 rounded border border-status-review-border bg-status-review-bg text-xs">
                    <HelpCircle className="h-3 w-3 text-status-review flex-shrink-0" />
                    <span className="text-text-primary">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Validation Checklist */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Market Validation Checklist</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { item: "Problem validated?", status: hasDiscovery ? "EARLY SIGNAL" : "NOT TESTED" },
                  { item: "Customer segment validated?", status: "NOT TESTED" },
                  { item: "Workflow validated?", status: "NOT TESTED" },
                  { item: "Pilot demand validated?", status: "NOT TESTED" },
                  { item: "Willingness to pay validated?", status: "NOT TESTED" },
                  { item: "Pricing validated?", status: "NOT TESTED" },
                  { item: "Retention validated?", status: "NOT TESTED" },
                  { item: "ML usefulness validated?", status: "NOT TESTED" },
                ].map(item => (
                  <div key={item.item} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-text-primary">{item.item}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.status === "VALIDATED" ? "bg-status-normal-bg text-status-normal" :
                      item.status === "EARLY SIGNAL" ? "bg-status-attention-bg text-status-attention" :
                      "bg-surface-alt text-text-muted"
                    }`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── ADD DISCOVERY MODAL ────────────────────────────────── */}
      {showAddDiscovery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Record Discovery Interview</h3>
              <button onClick={() => setShowAddDiscovery(false)} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Participant Reference</label>
                  <input type="text" value={form.participantRef} onChange={e => setForm(p => ({ ...p, participantRef: e.target.value }))} placeholder="e.g., Engineer #1" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="civil_engineer">Civil Engineer</option>
                    <option value="contractor">Contractor</option>
                    <option value="site_supervisor">Site Supervisor</option>
                    <option value="developer">Developer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Organization Type</label>
                  <select value={form.organizationType} onChange={e => setForm(p => ({ ...p, organizationType: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="individual">Individual</option>
                    <option value="small_firm">Small Firm</option>
                    <option value="mid_size">Mid-size</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Interview Date</label>
                  <input type="date" value={form.interviewDate} onChange={e => setForm(p => ({ ...p, interviewDate: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Current Workflow</label>
                <textarea value={form.currentWorkflow} onChange={e => setForm(p => ({ ...p, currentWorkflow: e.target.value }))} placeholder="How do they currently manage projects?" rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Biggest Pain *</label>
                <textarea value={form.biggestPain} onChange={e => setForm(p => ({ ...p, biggestPain: e.target.value }))} placeholder="What takes the most time / causes the most problems?" rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Pain Severity</label>
                  <select value={form.painSeverity} onChange={e => setForm(p => ({ ...p, painSeverity: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Current Tools</label>
                  <input type="text" value={form.currentTools} onChange={e => setForm(p => ({ ...p, currentTools: e.target.value }))} placeholder="WhatsApp, spreadsheets, etc." className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Willingness to Pilot</label>
                <div className="flex gap-2">
                  {["yes", "maybe", "no"].map(v => (
                    <button key={v} onClick={() => setForm(p => ({ ...p, willingnessToPilot: v }))}
                      className={`flex-1 px-3 py-2 rounded border text-sm font-medium ${form.willingnessToPilot === v ? "border-primary bg-primary/5 text-primary" : "border-border text-text-muted"}`}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Willingness to Pay</label>
                <select value={form.willingnessToPay} onChange={e => setForm(p => ({ ...p, willingnessToPay: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value="definitely">Definitely</option>
                  <option value="probably">Probably</option>
                  <option value="unsure">Unsure</option>
                  <option value="probably_not">Probably not</option>
                  <option value="definitely_not">Definitely not</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="Additional observations" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={createDiscovery} disabled={!form.biggestPain.trim() || creating}>{creating ? "Saving..." : "Save Interview"}</Button>
              <Button variant="secondary" onClick={() => setShowAddDiscovery(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

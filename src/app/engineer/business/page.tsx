"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, Users, DollarSign, Target, CheckCircle, Clock, AlertTriangle,
  ArrowRight, Plus, Search, ChevronDown, ChevronUp, X, Edit3, Trash2,
  BarChart3, Brain, MapPin, Shield, FileText, Home, Hammer, HardHat,
  Eye, ClipboardCheck, Sparkles, Zap, Package, Star, Phone, Mail,
  Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, CircleDot,
  Award, Briefcase, Building2, Globe, Lightbulb, Rocket, Flag, ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── TYPES ──────────────────────────────────────────────────────────────────

type CustomerSegment = "homeowner" | "engineer" | "enterprise";
type ValidationStage = "lead" | "interviewed" | "tested" | "active" | "paying" | "retained";
type ExperimentResult = "pending" | "success" | "partial" | "failed";
type FeedbackPriority = "low" | "medium" | "high" | "critical";
type FeedbackStatus = "new" | "reviewed" | "planned" | "implemented" | "rejected";
type PmfSignalStatus = "validated" | "partial" | "not_validated";

interface CustomerValidation {
  id: string;
  customerType: CustomerSegment;
  identifier: string;
  role: string;
  problemConfirmed: boolean;
  prototypeTested: boolean;
  wouldUse: boolean;
  wouldPay: boolean;
  amountWilling: number | null;
  actuallyPaid: boolean;
  feedback: string;
  stage: ValidationStage;
  date: string;
}

interface PricingExperiment {
  id: string;
  name: string;
  hypothesis: string;
  targetUsers: string;
  testPrice: string;
  startDate: string;
  endDate: string;
  result: ExperimentResult;
  decision: string;
  customersReached: number;
  conversions: number;
}

interface RevenueRecord {
  id: string;
  date: string;
  customer: string;
  plan: string;
  amount: number;
  status: "pending" | "paid" | "refunded";
  reference: string;
}

interface ProductFeedback {
  id: string;
  customerType: CustomerSegment;
  feature: string;
  problem: string;
  feedback: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  date: string;
}

// ─── DEMO DATA ──────────────────────────────────────────────────────────────

// Validation data is now fetched from the database API.
// No hardcoded fake data is used.

const STAGE_CONFIG: Record<ValidationStage, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  lead: { label: "Lead", color: "text-text-muted", bg: "bg-surface-alt", icon: Users },
  interviewed: { label: "Interviewed", color: "text-primary", bg: "bg-primary/10", icon: Phone },
  tested: { label: "Tested", color: "text-status-attention", bg: "bg-status-attention-bg", icon: Eye },
  active: { label: "Active", color: "text-status-normal", bg: "bg-status-normal-bg", icon: Rocket },
  paying: { label: "Paying", color: "text-status-normal", bg: "bg-status-normal-bg", icon: DollarSign },
  retained: { label: "Retained", color: "text-status-normal", bg: "bg-status-normal-bg", icon: Award },
};

const SEGMENT_CONFIG: Record<CustomerSegment, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  homeowner: { label: "Homeowner", color: "text-primary", bg: "bg-primary/10", icon: Home },
  engineer: { label: "Engineer/Contractor", color: "text-status-normal", bg: "bg-status-normal-bg", icon: HardHat },
  enterprise: { label: "Professional/Enterprise", color: "text-status-attention", bg: "bg-status-attention-bg", icon: Building2 },
};

const PMF_SIGNALS = [
  { label: "Problem Severity", status: "not_validated" as PmfSignalStatus, evidence: "Requires real user interviews" },
  { label: "User Activation", status: "not_validated" as PmfSignalStatus, evidence: "No real users yet" },
  { label: "Weekly Usage", status: "not_validated" as PmfSignalStatus, evidence: "No usage data" },
  { label: "Retention", status: "not_validated" as PmfSignalStatus, evidence: "No retention data" },
  { label: "Willingness to Pay", status: "not_validated" as PmfSignalStatus, evidence: "Requires real interviews" },
  { label: "Paid Conversion", status: "not_validated" as PmfSignalStatus, evidence: "No paying customers yet" },
  { label: "Referral", status: "not_validated" as PmfSignalStatus, evidence: "No referrals yet" },
  { label: "Customer Satisfaction", status: "not_validated" as PmfSignalStatus, evidence: "No NPS or satisfaction data" },
];

const VALIDATION_CHECKLIST = [
  { label: "Interview 30 target users", done: false },
  { label: "Test prototype with at least 10", done: false },
  { label: "Measure repeated usage", done: false },
  { label: "Obtain first paying customer", done: false },
  { label: "Measure retention", done: false },
  { label: "Test multiple price points", done: false },
  { label: "Measure time saved", done: false },
  { label: "Collect testimonials/feedback with permission", done: false },
  { label: "Identify strongest customer segment", done: false },
  { label: "Repeat payment experiment", done: false },
];
// NOTE: All items are currently uncompleted. This is an honest reflection of the prototype stage.

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: ValidationStage }) {
  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const config = SEGMENT_CONFIG[segment];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}

function PmfStatusBadge({ status }: { status: PmfSignalStatus }) {
  if (status === "validated") return <span className="text-[10px] font-semibold text-status-normal bg-status-normal-bg px-1.5 py-0.5 rounded">✓ Validated</span>;
  if (status === "partial") return <span className="text-[10px] font-semibold text-status-attention bg-status-attention-bg px-1.5 py-0.5 rounded">◐ Partial</span>;
  return <span className="text-[10px] font-semibold text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">○ Not Validated</span>;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function BusinessValidationPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "model" | "validation" | "pricing" | "revenue" | "feedback" | "pmf" | "roadmap" | "pilots" | "analytics">("overview");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddExperiment, setShowAddExperiment] = useState(false);
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Database-backed state
  const [dbInterviews, setDbInterviews] = useState<any[]>([]);
  const [dbExperiments, setDbExperiments] = useState<any[]>([]);
  const [dbFeedback, setDbFeedback] = useState<any[]>([]);
  const [loadingValidation, setLoadingValidation] = useState(true);

  useEffect(() => {
    fetch("/api/validation")
      .then(r => r.json())
      .then(data => {
        setDbInterviews(data.interviews || []);
        setDbExperiments(data.experiments || []);
        setDbFeedback(data.feedback || []);
      })
      .catch(() => {})
      .finally(() => setLoadingValidation(false));
  }, []);

  // Editable pricing
  const [engineerPrices, setEngineerPrices] = useState([
    { label: "Free Trial", amount: 0, period: "14 days" },
    { label: "Basic", amount: 499, period: "/month" },
    { label: "Professional", amount: 999, period: "/month" },
    { label: "Premium", amount: 1499, period: "/month" },
    { label: "Enterprise", amount: 2499, period: "/month" },
  ]);
  const [homeownerPrices, setHomeownerPrices] = useState([
    { label: "Free", amount: 0, period: "Basic info" },
    { label: "Standard Report", amount: 299, period: "/report" },
    { label: "Detailed Report", amount: 499, period: "/report" },
    { label: "Full Assessment", amount: 999, period: "/report" },
  ]);

  // Computed stats from database
  const stats = useMemo(() => {
    const total = dbInterviews.length;
    const interviewed = dbInterviews.length; // all stored are considered interviewed
    const wouldPay = dbInterviews.filter((v: any) => v.willingnessToPay === "yes").length;
    return {
      total,
      interviewed,
      tested: dbExperiments.length,
      wouldPay,
      confirmed: dbInterviews.filter((v: any) => v.problemExperienced).length,
      paying: 0, // no paying customers yet
      mrr: 0, // no revenue yet
      experiments: dbExperiments.length,
      activeExperiments: dbExperiments.filter((e: any) => e.result === "pending").length,
    };
  }, [dbInterviews, dbExperiments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">Business & Validation Center</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Track customer validation, pricing experiments, and revenue proof. We will not assume product-market fit — we will measure it.
        </p>
      </div>

      {/* Important Notice */}
      <div className="px-4 py-3 rounded-md bg-status-attention-bg border border-status-attention-border">
        <p className="text-xs text-status-attention">
          <span className="font-semibold">IMPORTANT:</span> BuildMe is pre-revenue. No revenue, customer, or PMF figures below are fabricated.
          All validation data represents actual interviews, tests, and experiments — not assumed traction.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-text-muted">Users Validated</p>
            <p className="text-2xl font-bold text-text-primary">{stats.confirmed}</p>
            <p className="text-[10px] text-text-muted">of {stats.total} interviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-text-muted">Paying Customers</p>
            <p className="text-2xl font-bold text-status-attention">{stats.paying}</p>
            <p className="text-[10px] text-status-attention font-medium">NOT YET VALIDATED</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-text-muted">MRR</p>
            <p className="text-2xl font-bold text-text-primary">₹{stats.mrr.toLocaleString()}</p>
            <p className="text-[10px] text-text-muted">No revenue yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-text-muted">Experiments</p>
            <p className="text-2xl font-bold text-primary">{stats.experiments}</p>
            <p className="text-[10px] text-text-muted">{stats.activeExperiments} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <p className="text-xs text-text-muted">PMF Signals</p>
            <p className="text-2xl font-bold text-status-attention">0/{PMF_SIGNALS.length}</p>
            <p className="text-[10px] text-status-attention font-medium">Pre-Validation</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {([
          { key: "overview" as const, label: "Overview", icon: Eye },
          { key: "model" as const, label: "Business Model", icon: Briefcase },
          { key: "validation" as const, label: "Customer Validation", icon: Users },
          { key: "pricing" as const, label: "Pricing", icon: DollarSign },
          { key: "revenue" as const, label: "Revenue", icon: TrendingUp },
          { key: "feedback" as const, label: "Feedback", icon: MessageSquare },
          { key: "pmf" as const, label: "PMF Signals", icon: Target },
          { key: "roadmap" as const, label: "Roadmap", icon: Rocket },
          { key: "pilots" as const, label: "Pilots", icon: Rocket },
          { key: "analytics" as const, label: "Analytics", icon: BarChart3 },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* OVERVIEW TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Validation Funnel */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Validation Funnel</h3></CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 overflow-x-auto pb-2">
                {[
                  { label: "Potential Users", value: 100, color: "bg-surface-alt" },
                  { label: "Interviews", value: stats.total, color: "bg-primary/20" },
                  { label: "Prototype Tests", value: stats.tested, color: "bg-primary/40" },
                  { label: "Problem Confirmed", value: stats.confirmed, color: "bg-primary/60" },
                  { label: "Would Pay", value: stats.wouldPay, color: "bg-primary/80" },
                  { label: "Paying", value: stats.paying, color: "bg-primary" },
                  { label: "Retained", value: 0, color: "bg-status-normal" },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center flex-shrink-0 w-24">
                    <span className="text-lg font-bold text-text-primary mb-1">{step.value}</span>
                    <div className={`w-full rounded-t ${step.color}`} style={{ height: `${Math.max(20, (step.value / 100) * 120)}px` }} />
                    <span className="text-[9px] text-text-muted text-center mt-1 leading-tight">{step.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-3">Note: Potential Users is an estimate. All other values are from actual validation activities.</p>
            </CardContent>
          </Card>

          {/* Key Evidence Panel */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">What We Need to Prove</h3></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Real users", status: "in_progress", icon: Users },
                  { label: "Repeated usage", status: "not_started", icon: RefreshCw },
                  { label: "Willingness to pay", status: "in_progress", icon: DollarSign },
                  { label: "First payment", status: "not_started", icon: CreditCard },
                  { label: "Retention", status: "not_started", icon: Award },
                  { label: "Measurable time saved", status: "not_started", icon: Clock },
                  { label: "Customer referrals", status: "not_started", icon: Star },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-2 rounded border border-border">
                    <item.icon className="h-4 w-4 text-text-muted flex-shrink-0" />
                    <span className="text-xs text-text-primary flex-1">{item.label}</span>
                    {item.status === "validated" && <CheckCircle className="h-4 w-4 text-status-normal" />}
                    {item.status === "in_progress" && <Clock className="h-4 w-4 text-status-attention" />}
                    {item.status === "not_started" && <CircleDot className="h-4 w-4 text-text-muted" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Founder Checklist */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Before Claiming Product-Market Fit</h3></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {VALIDATION_CHECKLIST.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-surface-alt transition-colors">
                    {item.done ? (
                      <CheckCircle className="h-4 w-4 text-status-normal" />
                    ) : (
                      <div className="h-4 w-4 rounded border-2 border-border" />
                    )}
                    <span className={`text-xs ${item.done ? "text-text-muted line-through" : "text-text-primary"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* BUSINESS MODEL TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "model" && (
        <div className="space-y-6">
          <div className="px-4 py-2 rounded-md bg-status-attention-bg border border-status-attention-border text-xs text-status-attention">
            <span className="font-semibold">PROPOSED BUSINESS MODEL</span> — Not yet validated with real customers.
          </div>

          {/* Three Segments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-text-primary">Homeowner</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-text-muted">Possible Services:</p>
                {["Basic project tracking", "Construction evidence", "Property evaluation", "Quotation comparison", "Advanced property reports"].map(s => (
                  <div key={s} className="flex items-center gap-2 text-xs text-text-secondary">
                    <CheckCircle className="h-3 w-3 text-status-normal flex-shrink-0" />{s}
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-text-muted">Revenue Model:</p>
                  <p className="text-xs font-medium text-primary">Per-report pricing</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HardHat className="h-5 w-5 text-status-normal" />
                  <h3 className="text-sm font-semibold text-text-primary">Engineer / Contractor</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-text-muted">Possible Services:</p>
                {["Multi-site management", "Inspection management", "AI-assisted reports", "Evidence management", "Client communication", "Workforce/site monitoring"].map(s => (
                  <div key={s} className="flex items-center gap-2 text-xs text-text-secondary">
                    <CheckCircle className="h-3 w-3 text-status-normal flex-shrink-0" />{s}
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-text-muted">Revenue Model:</p>
                  <p className="text-xs font-medium text-status-normal">Monthly subscription</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-status-attention" />
                  <h3 className="text-sm font-semibold text-text-primary">Professional / Enterprise</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-text-muted">Possible Services:</p>
                {["Multiple engineers", "Large project portfolios", "Analytics", "Centralized reporting", "API/integration capabilities"].map(s => (
                  <div key={s} className="flex items-center gap-2 text-xs text-text-secondary">
                    <CheckCircle className="h-3 w-3 text-status-normal flex-shrink-0" />{s}
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-text-muted">Revenue Model:</p>
                  <p className="text-xs font-medium text-status-attention">Enterprise subscription</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Beachhead Strategy */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Initial Beachhead Customer</h3></CardHeader>
            <CardContent>
              <div className="px-3 py-2 rounded bg-status-attention-bg border border-status-attention-border text-[10px] text-status-attention mb-3 font-medium">
                Initial Go-To-Market Hypothesis — not proven
              </div>
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {[
                  { icon: HardHat, label: "One Engineer", desc: "Independent residential construction engineer" },
                  { icon: MapPin, label: "Multiple Sites", desc: "Manages 3-10 construction sites" },
                  { icon: Users, label: "Multiple Homeowners", desc: "Each site has a homeowner client" },
                  { icon: Rocket, label: "Distribution", desc: "Engineer becomes distribution channel" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center text-center w-32">
                      <step.icon className="h-8 w-8 text-primary mb-1" />
                      <p className="text-xs font-semibold text-text-primary">{step.label}</p>
                      <p className="text-[9px] text-text-muted">{step.desc}</p>
                    </div>
                    {i < 3 && <ArrowRight className="h-4 w-4 text-text-muted mx-1" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform → Revenue Connection */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">BuildMe Platform → Revenue Connection</h3></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "AI Intelligence", value: "AI-assisted inspections", icon: Sparkles, color: "text-primary" },
                  { label: "Spatial Intelligence", value: "Location-aware intelligence", icon: MapPin, color: "text-status-attention" },
                  { label: "Quotation Intelligence", value: "Real quotation comparison", icon: FileText, color: "text-status-normal" },
                  { label: "Property Intelligence", value: "Property evaluation", icon: Home, color: "text-primary" },
                  { label: "Issues & Evidence", value: "Shared project records", icon: Shield, color: "text-status-normal" },
                  { label: "Cost Intelligence", value: "Construction cost estimation", icon: DollarSign, color: "text-status-attention" },
                ].map((item) => (
                  <div key={item.label} className="p-2 rounded border border-border">
                    <div className="flex items-center gap-1 mb-1">
                      <item.icon className={`h-3 w-3 ${item.color}`} />
                      <span className="text-[10px] font-semibold text-text-primary">{item.label}</span>
                    </div>
                    <p className="text-[9px] text-text-muted">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/10">
                <p className="text-xs text-primary font-medium">Together: Professional subscriptions + Property reports + Advanced services + Enterprise</p>
              </div>
            </CardContent>
          </Card>

          {/* Value Proposition */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Value Proposition Validation</h3></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { segment: "Homeowner", problem: "Low construction visibility", value: "Centralized progress/evidence", validation: "Validate with real users" },
                  { segment: "Engineer", problem: "Managing multiple sites and reporting", value: "Faster site updates and centralized records", validation: "Partial evidence from interviews" },
                  { segment: "Contractor", problem: "Miscommunication and disputes", value: "Shared work/evidence history", validation: "Validate with real users" },
                ].map((item) => (
                  <div key={item.segment} className="p-3 rounded border border-border">
                    <p className="text-xs font-semibold text-text-primary mb-1">{item.segment}</p>
                    <p className="text-[11px] text-text-secondary mb-1"><span className="font-medium">Problem:</span> {item.problem}</p>
                    <p className="text-[11px] text-text-secondary mb-2"><span className="font-medium">Value:</span> {item.value}</p>
                    <p className="text-[10px] text-status-attention italic">{item.validation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CUSTOMER VALIDATION TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "validation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Customer Validation Records</h3>
            <Button onClick={() => setShowAddCustomer(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Record
            </Button>
          </div>

          {/* Funnel Stages */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {(["lead", "interviewed", "tested", "active", "paying", "retained"] as const).map((stage, i) => {
              const config = STAGE_CONFIG[stage];
              const count = stage === "interviewed" ? dbInterviews.length : 0;
              return (
                <div key={stage} className="flex items-center flex-shrink-0">
                  <div className={`px-3 py-1.5 rounded text-xs font-medium ${count > 0 ? config.bg + " " + config.color : "bg-surface-alt text-text-muted"}`}>
                    {config.label}: {count}
                  </div>
                  {i < 5 && <ArrowRight className="h-3 w-3 text-text-muted mx-0.5" />}
                </div>
              );
            })}
          </div>

          {/* Customer Records */}
          {dbInterviews.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-secondary">No customer interviews recorded yet.</p>
              <p className="text-xs text-text-muted mt-1">Record your first real customer interview using the form above. This data is stored privately and is not fabricated.</p>
            </div>
          ) : dbInterviews.map((v: any) => {
            const isExpanded = expandedCustomer === v.id;
            return (
              <Card key={v.id}>
                <CardContent className="py-3">
                  <button onClick={() => setExpandedCustomer(isExpanded ? null : v.id)} className="w-full text-left">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-text-primary">{v.personName}</span>
                        <span className="text-xs text-text-muted">{v.role || ""}</span>
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Interviewed</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted flex-shrink-0">
                        <span>{v.interviewDate ? new Date(v.interviewDate).toLocaleDateString() : ""}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Problem", value: v.problemExperienced },
                          { label: "Current Solution", value: v.currentSolution },
                          { label: "Willingness to Try", value: v.willingnessToTry },
                          { label: "Willingness to Pay", value: v.willingnessToPay },
                        ].map((item) => (
                          <div key={item.label} className="p-2 rounded bg-surface-alt">
                            <p className="text-[10px] text-text-muted">{item.label}</p>
                            <p className="text-xs text-text-primary font-medium mt-0.5">{item.value || "Not recorded"}</p>
                          </div>
                        ))}
                      </div>
                      {v.companyProject && (
                        <p className="text-xs text-text-secondary">Company/Project: <span className="font-medium">{v.companyProject}</span></p>
                      )}
                      {v.notes && (
                        <div className="p-2 rounded bg-surface-alt">
                          <p className="text-[10px] text-text-muted mb-1">Notes:</p>
                          <p className="text-xs text-text-secondary">{v.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PRICING TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <div className="px-4 py-2 rounded-md bg-status-attention-bg border border-status-attention-border text-xs text-status-attention">
            <span className="font-semibold">PROPOSED TEST PRICES</span> — Not confirmed market prices. Edit to test different price points.
          </div>

          {/* Engineer Pricing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Engineer / Contractor Plans</h3>
                <span className="text-[10px] text-text-muted">PROPOSED — Edit to test</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {engineerPrices.map((price, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-center ${i === 2 ? "border-primary bg-primary/5" : "border-border"}`}>
                    <p className="text-xs font-semibold text-text-primary">{price.label}</p>
                    <p className="text-xl font-bold text-text-primary mt-1">
                      {price.amount === 0 ? "Free" : `₹${price.amount.toLocaleString()}`}
                    </p>
                    <p className="text-[10px] text-text-muted">{price.period}</p>
                    {i === 2 && <span className="text-[9px] text-primary font-medium mt-1 inline-block">PROPOSED</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Homeowner Pricing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Homeowner Plans</h3>
                <span className="text-[10px] text-text-muted">PROPOSED — Edit to test</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {homeownerPrices.map((price, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-center ${i === 2 ? "border-primary bg-primary/5" : "border-border"}`}>
                    <p className="text-xs font-semibold text-text-primary">{price.label}</p>
                    <p className="text-xl font-bold text-text-primary mt-1">
                      {price.amount === 0 ? "Free" : `₹${price.amount.toLocaleString()}`}
                    </p>
                    <p className="text-[10px] text-text-muted">{price.period}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Experiments */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Pricing Experiments</h3>
            <Button onClick={() => setShowAddExperiment(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Experiment
            </Button>
          </div>

          {dbExperiments.length === 0 ? (
            <div className="py-8 text-center">
              <Target className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-secondary">No pricing experiments yet.</p>
              <p className="text-xs text-text-muted mt-1">Record your first pricing hypothesis above.</p>
            </div>
          ) : dbExperiments.map((exp: any) => (
            <Card key={exp.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{exp.hypothesis}</h4>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${exp.result === "pending" ? "bg-status-attention-bg text-status-attention" : exp.result === "success" ? "bg-status-normal-bg text-status-normal" : "bg-surface-alt text-text-muted"}`}>
                    {exp.result === "pending" ? "Pending" : exp.result === "success" ? "Success" : exp.result === "inconclusive" ? "Inconclusive" : "Failed"}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-xs">
                  {exp.testPrice && <div><span className="text-text-muted">Test Price:</span> <span className="text-text-primary">₹{exp.testPrice}</span></div>}
                  {exp.sampleSize && <div><span className="text-text-muted">Sample:</span> <span className="text-text-primary">{exp.sampleSize}</span></div>}
                  {exp.startDate && <div><span className="text-text-muted">Start:</span> <span className="text-text-primary">{new Date(exp.startDate).toLocaleDateString()}</span></div>}
                </div>
                {exp.notes && (
                  <p className="text-xs text-text-secondary mt-2 p-2 rounded bg-surface-alt"><span className="font-medium">Notes:</span> {exp.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* REVENUE TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="px-4 py-2 rounded-md bg-status-attention-bg border border-status-attention-border text-xs text-status-attention">
            <span className="font-semibold">PRE-REVENUE</span> — No validated revenue yet. All figures below represent actual payment records, not projections.
          </div>

          {/* Revenue Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Customers", value: 0, note: "No paying customers" },
              { label: "Trial Users", value: 0, note: "No trial users yet" },
              { label: "MRR", value: "₹0", note: "No revenue" },
              { label: "Conversion Rate", value: "N/A", note: "Requires data" },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="py-3">
                  <p className="text-xs text-text-muted">{m.label}</p>
                  <p className="text-2xl font-bold text-text-primary">{m.value}</p>
                  <p className="text-[10px] text-text-muted">{m.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Unit Economics */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Unit Economics</h3></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Customer Acquisition Cost", value: "Requires real customer data" },
                  { label: "Average Revenue Per Customer", value: "Requires real customer data" },
                  { label: "Gross Margin", value: "Requires real customer data" },
                  { label: "Monthly Churn", value: "Requires real customer data" },
                  { label: "Lifetime Value", value: "Requires real customer data" },
                ].map((item) => (
                  <div key={item.label} className="p-2 rounded bg-surface-alt">
                    <p className="text-[10px] text-text-muted">{item.label}</p>
                    <p className="text-xs font-medium text-text-muted italic mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Gateway */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-alt">
                    <DollarSign className="h-5 w-5 text-text-muted" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">Payment Gateway</h3>
                    <p className="text-xs text-text-muted">Not Connected</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1" />Connect Gateway
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Evidence */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Revenue Evidence</h3></CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted text-center py-8">No payment records yet. Revenue evidence will appear here once customers make actual payments.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FEEDBACK TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "feedback" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Product Feedback</h3>
            <Button onClick={() => setShowAddFeedback(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Feedback
            </Button>
          </div>

          {dbFeedback.length === 0 ? (
            <div className="py-8 text-center">
              <Star className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-secondary">No product feedback yet.</p>
              <p className="text-xs text-text-muted mt-1">Record real user feedback above.</p>
            </div>
          ) : dbFeedback.map((fb: any) => (
            <Card key={fb.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{fb.source || "Unknown"}</span>
                    <span className="text-sm font-semibold text-text-primary">{fb.category || "General"}</span>
                    {fb.severity && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        fb.severity === "high" ? "bg-status-review-bg text-status-review" :
                        fb.severity === "medium" ? "bg-status-attention-bg text-status-attention" :
                        "bg-surface-alt text-text-muted"
                      }`}>{fb.severity}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-1">{fb.feedback}</p>
                <p className="text-[10px] text-text-muted mt-1">{fb.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PMF SIGNALS TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "pmf" && (
        <div className="space-y-6">
          <div className="px-4 py-2 rounded-md bg-status-attention-bg border border-status-attention-border text-xs text-status-attention">
            <span className="font-semibold">PRODUCT-MARKET FIT</span> — BuildMe has NOT achieved PMF. This panel tracks what needs to be proven.
          </div>

          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">PMF Signal Tracking</h3></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PMF_SIGNALS.map((signal) => (
                  <div key={signal.label} className="flex items-center gap-3 p-3 rounded border border-border">
                    <PmfStatusBadge status={signal.status} />
                    <span className="text-sm font-medium text-text-primary flex-1">{signal.label}</span>
                    <span className="text-xs text-text-muted">{signal.evidence}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded bg-surface-alt">
                <p className="text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">Summary:</span> 0 of {PMF_SIGNALS.length} PMF signals are validated.
                  BuildMe is in the early validation stage. No claims of product-market fit are made.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Homeowner vs Engineer Comparison */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Homeowner vs Engineer Value</h3></CardHeader>
            <CardContent>
              <div className="px-3 py-2 rounded bg-status-attention-bg border border-status-attention-border text-[10px] text-status-attention mb-3 font-medium">
                Proposed Model — Requires Validation
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-text-muted font-medium"></th>
                      <th className="text-left py-2 px-3 text-primary font-medium">Homeowner</th>
                      <th className="text-left py-2 px-3 text-status-normal font-medium">Engineer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { label: "Primary Problem", h: "Visibility & trust", e: "Multi-site management" },
                      { label: "BuildMe Value", h: "Evidence & transparency", e: "Efficiency & organization" },
                      { label: "Possible Revenue", h: "Reports/services", e: "Subscription" },
                      { label: "Adoption Driver", h: "Peace of mind", e: "Time saved" },
                      { label: "Validation", h: "Paid reports / usage", e: "Paid subscription" },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className="py-2 px-3 text-text-muted font-medium">{row.label}</td>
                        <td className="py-2 px-3 text-text-secondary">{row.h}</td>
                        <td className="py-2 px-3 text-text-secondary">{row.e}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Market Size */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Market Opportunity</h3></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "TAM", sublabel: "Total Addressable Market", value: "Not validated", note: "Market research required" },
                  { label: "SAM", sublabel: "Serviceable Addressable Market", value: "Not validated", note: "Market research required" },
                  { label: "SOM", sublabel: "Serviceable Obtainable Market", value: "Not validated", note: "Market research required" },
                ].map((m) => (
                  <div key={m.label} className="p-3 rounded border border-border text-center">
                    <p className="text-lg font-bold text-text-primary">{m.label}</p>
                    <p className="text-[10px] text-text-muted">{m.sublabel}</p>
                    <p className="text-sm font-medium text-text-muted italic mt-2">{m.value}</p>
                    <p className="text-[10px] text-status-attention mt-1">{m.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ROADMAP TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "roadmap" && (
        <div className="space-y-6">
          <div className="px-4 py-2 rounded-md bg-status-attention-bg border border-status-attention-border text-xs text-status-attention">
            <span className="font-semibold">PROPOSED ROADMAP</span> — Not yet executed. Timeline depends on validation results.
          </div>

          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Revenue Roadmap</h3></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    stage: "Stage 1 — Validation", status: "in_progress", color: "border-primary",
                    items: ["User interviews", "Prototype testing", "Pilot users", "Problem validation"],
                  },
                  {
                    stage: "Stage 2 — First Revenue", status: "not_started", color: "border-border",
                    items: ["First paying engineer", "First paid property report", "Payment gateway connected"],
                  },
                  {
                    stage: "Stage 3 — Repeat Revenue", status: "not_started", color: "border-border",
                    items: ["Monthly subscriptions", "Recurring customers", "Retention measurement"],
                  },
                  {
                    stage: "Stage 4 — Scale", status: "not_started", color: "border-border",
                    items: ["Multi-site professionals", "Enterprise customers", "Property ecosystem"],
                  },
                ].map((phase, i) => (
                  <div key={i} className={`p-4 rounded-lg border-l-4 ${phase.color} ${phase.status === "in_progress" ? "bg-primary/5" : "bg-surface-alt/50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-text-primary">{phase.stage}</span>
                      {phase.status === "in_progress" ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">In Progress</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt text-text-muted font-medium">Not Started</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phase.items.map((item) => (
                        <span key={item} className="text-xs text-text-secondary px-2 py-1 rounded bg-white border border-border">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CEDI Story */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">CEDI Demonstration Story</h3></CardHeader>
            <CardContent>
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {[
                  { icon: Lightbulb, label: "Problem", desc: "Construction visibility gap" },
                  { icon: Phone, label: "Interviews", desc: "Talk to target users" },
                  { icon: Eye, label: "Prototype", desc: "BuildMe MVP" },
                  { icon: Rocket, label: "Pilot", desc: "Test with real users" },
                  { icon: BarChart3, label: "Usage", desc: "Measure engagement" },
                  { icon: DollarSign, label: "Pricing", desc: "Test willingness to pay" },
                  { icon: CreditCard, label: "First Payment", desc: "Prove revenue" },
                  { icon: RefreshCw, label: "Retention", desc: "Measure stickiness" },
                  { icon: TrendingUp, label: "Revenue", desc: "Sustainable business" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center text-center w-24">
                      <step.icon className={`h-6 w-6 ${i <= 0 ? "text-primary" : "text-text-muted"} mb-1`} />
                      <p className="text-[10px] font-semibold text-text-primary">{step.label}</p>
                      <p className="text-[8px] text-text-muted">{step.desc}</p>
                    </div>
                    {i < 8 && <ArrowRight className="h-3 w-3 text-text-muted mx-0.5" />}
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/10">
                <p className="text-xs text-primary font-medium">
                  We will not assume product-market fit. We will measure it.
                  And we will not claim revenue until customers actually pay.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PILOTS TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "pilots" && (
        <PilotsTab />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ANALYTICS TAB */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <AnalyticsTab />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ADD CUSTOMER MODAL */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddCustomer(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Add Customer Validation Record</h3>
              <button onClick={() => setShowAddCustomer(false)}><X className="h-5 w-5 text-text-muted" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Customer Type *</label>
                  <select className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="engineer">Engineer/Contractor</option>
                    <option value="homeowner">Homeowner</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Name/Identifier *</label>
                  <input type="text" className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="e.g., Raj K." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Role</label>
                <input type="text" className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="e.g., Independent Civil Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Problem Confirmed?", key: "problem" },
                  { label: "Prototype Tested?", key: "tested" },
                  { label: "Would Use?", key: "use" },
                  { label: "Would Pay?", key: "pay" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-surface-alt">
                    <input type="checkbox" className="text-primary rounded" />
                    <span className="text-xs text-text-primary">{item.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Amount Willing to Pay (₹)</label>
                <input type="number" className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="e.g., 999" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Feedback</label>
                <textarea rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="What did the customer say?" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <Button variant="secondary" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
              <Button onClick={() => { setShowAddCustomer(false); alert("Record saved (demo)."); }}>Save Record</Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ADD EXPERIMENT MODAL */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showAddExperiment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddExperiment(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Add Pricing Experiment</h3>
              <button onClick={() => setShowAddExperiment(false)}><X className="h-5 w-5 text-text-muted" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Experiment Name *</label>
                <input type="text" className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="e.g., Engineer Free Trial" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Hypothesis *</label>
                <textarea rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="What do you expect to happen?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Target Users</label>
                <input type="text" className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="e.g., Independent civil engineers" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Test Price</label>
                <input type="text" className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="e.g., ₹999/month" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Start Date</label>
                  <input type="date" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">End Date</label>
                  <input type="date" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <Button variant="secondary" onClick={() => setShowAddExperiment(false)}>Cancel</Button>
              <Button onClick={() => { setShowAddExperiment(false); alert("Experiment created (demo)."); }}>Create Experiment</Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ADD FEEDBACK MODAL */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {showAddFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddFeedback(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Add Product Feedback</h3>
              <button onClick={() => setShowAddFeedback(false)}><X className="h-5 w-5 text-text-muted" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Customer Type</label>
                  <select className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="engineer">Engineer/Contractor</option>
                    <option value="homeowner">Homeowner</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Priority</label>
                  <select className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Feature</label>
                <input type="text" className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="Which feature?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Problem</label>
                <textarea rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="What problem does this address?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Feedback</label>
                <textarea rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="What did the customer say?" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <Button variant="secondary" onClick={() => setShowAddFeedback(false)}>Cancel</Button>
              <Button onClick={() => { setShowAddFeedback(false); alert("Feedback saved (demo)."); }}>Save Feedback</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PILOTS TAB ──────────────────────────────────────────────────────────────

function PilotsTab() {
  const [pilots, setPilots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [projects, setProjects] = useState<{id:string;name:string;city:string|null}[]>([]);
  const [form, setForm] = useState({ projectId: "", participantName: "", participantRole: "", startDate: "", notes: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/pilots").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]).then(([pilotData, projectData]) => {
      setPilots(pilotData.pilots || []);
      setProjects(Array.isArray(projectData) ? projectData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createPilot = async () => {
    if (!form.projectId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/pilots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: form.projectId, participantName: form.participantName || null, participantRole: form.participantRole || null, startDate: form.startDate || null, notes: form.notes || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setPilots(prev => [data.pilot, ...prev]);
        setShowCreate(false);
        setForm({ projectId: "", participantName: "", participantRole: "", startDate: "", notes: "" });
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const updateStatus = async (pilotId: string, status: string) => {
    try {
      const res = await fetch(`/api/pilots/${pilotId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (res.ok) setPilots(prev => prev.map(p => p.id === pilotId ? { ...p, status } : p));
    } catch { /* ignore */ }
  };

  const stats = {
    total: pilots.length, active: pilots.filter(p => p.status === "active").length,
    completed: pilots.filter(p => p.status === "completed").length,
    measurements: pilots.reduce((s, p) => s + (p._count?.measurements || 0), 0),
    feedback: pilots.reduce((s, p) => s + (p._count?.feedback || 0), 0),
  };

  if (loading) return <div className="py-8 text-center text-text-secondary">Loading pilots...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Pilot Programs</h3>
          <p className="text-xs text-text-muted">Track and measure BuildMe pilot programs with real data.</p>
        </div>
        <Link href="/engineer/pilots"><Button size="sm"><Plus className="h-3 w-3 mr-1" />Manage Pilots</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[{ label: "Total", value: stats.total }, { label: "Active", value: stats.active }, { label: "Completed", value: stats.completed }, { label: "Measurements", value: stats.measurements }, { label: "Feedback", value: stats.feedback }].map(s => (
          <Card key={s.label}><CardContent className="py-3"><p className="text-xs text-text-muted">{s.label}</p><p className="text-2xl font-bold text-text-primary">{s.value}</p></CardContent></Card>
        ))}
      </div>

      {pilots.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <Rocket className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm text-text-secondary">No pilots created yet.</p>
          <p className="text-xs text-text-muted mt-1">Create your first pilot to start measuring BuildMe real-world impact.</p>
          <Link href="/engineer/pilots"><Button size="sm" className="mt-3"><Plus className="h-3 w-3 mr-1" />Create Pilot</Button></Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {pilots.slice(0, 5).map((pilot: any) => (
            <Link key={pilot.id} href={`/engineer/pilots/${pilot.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer"><CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pilot.status === "active" ? "bg-status-normal-bg text-status-normal" : pilot.status === "completed" ? "bg-primary/10 text-primary" : "bg-surface-alt text-text-muted"}`}>{pilot.status}</span>
                    <span className="text-sm font-medium text-text-primary">{pilot.project?.name}</span>
                    {pilot.participantName && <span className="text-xs text-text-muted">{pilot.participantName}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {pilot.status === "planned" && <Button size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); updateStatus(pilot.id, "active"); }}>Start</Button>}
                    {pilot.status === "active" && <Button size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); updateStatus(pilot.id, "completed"); }}>Complete</Button>}
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </div>
                </div>
              </CardContent></Card>
            </Link>
          ))}
        </div>
      )}

      <div className="p-3 rounded bg-status-attention-bg border border-status-attention-border">
        <p className="text-xs text-status-attention"><span className="font-semibold">VALIDATION NOTE:</span> Pilot results are based on recorded observations. Metrics populate automatically when real pilot data is recorded.</p>
      </div>
    </div>
  );
}

// ─── ANALYTICS TAB ─────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(setAnalytics).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-text-secondary">Loading analytics...</div>;
  if (!analytics) return <div className="py-8 text-center text-text-secondary">Failed to load analytics.</div>;

  const featureLabels: Record<string, string> = {
    inspections: "Inspections", photos: "Photos Uploaded", issues: "Issues Created", evidence: "Evidence Added",
    workforce_checkins: "GPS Check-ins", cost_estimates: "Cost Estimates", homeowner_concerns: "Homeowner Concerns",
    projects_created: "Projects Created", ai_analyses: "AI Analyses", workers_added: "Workers Added", issue_resolved: "Issues Resolved",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Product Usage Analytics</h3>
        <p className="text-xs text-text-muted">Based on recorded BuildMe activity. All values computed from real ProductEvent database records.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total Events", value: analytics.totalEvents }, { label: "Active Projects", value: analytics.activeProjects },
          { label: "Interviews", value: analytics.validation?.interviews || 0 }, { label: "Feedback", value: analytics.validation?.feedback || 0 }].map(s => (
          <Card key={s.label}><CardContent className="py-3"><p className="text-xs text-text-muted">{s.label}</p><p className="text-2xl font-bold text-text-primary">{s.value}</p></CardContent></Card>
        ))}
      </div>

      {analytics.totalEvents > 0 ? (
        <Card>
          <CardHeader><h3 className="text-sm font-semibold text-text-primary">Feature Usage Ranking</h3><p className="text-xs text-text-muted">Based on recorded ProductEvent database records</p></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.featureUsage || {} as Record<string, number>)
                .filter(([, count]) => (count as number) > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([feature, count]) => (
                  <div key={feature} className="flex items-center gap-3">
                    <span className="text-xs text-text-primary w-32 truncate">{featureLabels[feature] || feature}</span>
                    <div className="flex-1 h-3 bg-surface-alt rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((count as number) / Math.max(1, analytics.totalEvents)) * 100)}%` }} /></div>
                    <span className="text-sm font-bold text-text-primary w-8 text-right">{String(count)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-12 text-center">
          <BarChart3 className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm text-text-secondary">No product activity recorded yet.</p>
          <p className="text-xs text-text-muted mt-1">Activity will be tracked as engineers use BuildMe features.</p>
        </CardContent></Card>
      )}

      <div className="p-3 rounded bg-status-attention-bg border border-status-attention-border">
        <p className="text-xs text-status-attention"><span className="font-semibold">ANALYTICS NOTE:</span> All metrics are computed from actual database records. No artificial or fabricated data is included.</p>
      </div>
    </div>
  );
}

// Missing import - CreditCard
function CreditCard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function MessageSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

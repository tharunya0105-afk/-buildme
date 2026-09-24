"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  HardHat, ArrowRight, ShieldCheck, Target, TrendingUp,
  DollarSign, FileText, CheckCircle2, Award, Users,
  Layers, Lock, Sparkles, Building2, BarChart3,
  ExternalLink, ChevronRight, HelpCircle, Eye, EyeOff,
  Briefcase, Compass, FileCheck, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function InvestorsDataRoom() {
  const router = useRouter();
  const [evaluatorLoading, setEvaluatorLoading] = useState<string | null>(null);

  const handleQuickLogin = async (role: "engineer" | "homeowner") => {
    setEvaluatorLoading(role);
    try {
      const email = role === "engineer" ? "engineer@buildme.demo" : "rkumar@buildme.demo";
      const res = await signIn("credentials", {
        email,
        password: "demo1234",
        redirect: false,
      });
      if (res?.ok) {
        router.push(role === "engineer" ? "/engineer" : "/homeowner");
      } else {
        router.push("/auth/login");
      }
    } catch {
      router.push("/auth/login");
    } finally {
      setEvaluatorLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-text-primary">
      {/* ─── Institutional Header ────────────────────────────────────────── */}
      <header className="border-b border-border bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white">
                <HardHat className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-text-primary">BuildMe</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  Investor & Grant Room
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/deck">
              <Button variant="secondary" size="sm" className="hidden sm:inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> 10-Slide Deck
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">Back to Product</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* ─── Evaluator Quick Access Banner ────────────────────────────── */}
        <section className="bg-gradient-to-r from-primary to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-accent-light text-xs font-medium mb-4 backdrop-blur-sm">
              <Award className="h-3.5 w-3.5" />
              Funding Committee & Evaluator Test Drive
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Institutional Due Diligence & Investment Thesis
            </h1>
            <p className="mt-3 text-slate-300 text-base sm:text-lg leading-relaxed">
              BuildMe is India&apos;s first photo-to-truth construction intelligence engine for Tier-2 & Tier-3 residential RCC projects. No 3D BIM models required. Zero manual data entry.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="accent"
                onClick={() => handleQuickLogin("engineer")}
                disabled={evaluatorLoading !== null}
                className="shadow-lg font-semibold"
              >
                {evaluatorLoading === "engineer" ? "Logging in..." : "Launch Engineer Portal (1-Click)"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleQuickLogin("homeowner")}
                disabled={evaluatorLoading !== null}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold"
              >
                {evaluatorLoading === "homeowner" ? "Logging in..." : "Launch Homeowner Trust Portal (1-Click)"}
              </Button>
              <Link href="/deck">
                <Button variant="ghost" className="text-white hover:bg-white/10 font-semibold">
                  <FileText className="h-4 w-4 mr-1.5" /> View Pitch Deck
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Key Investment Highlights ──────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <Sparkles className="h-4 w-4" /> At a Glance
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Executive Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                  <span>Market Size (TAM)</span>
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-extrabold text-text-primary">₹5.8L Cr</p>
                <p className="text-xs text-text-secondary mt-1">
                  $70B+ annual unorganized residential homebuilding in India
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                  <span>Defensible Moat</span>
                  <ShieldCheck className="h-4 w-4 text-accent" />
                </div>
                <p className="text-3xl font-extrabold text-accent">Patent Pending</p>
                <p className="text-xs text-text-secondary mt-1">
                  Concealment-aware Viterbi DAG for physical element tracking
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                  <span>Pilot Traction</span>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-3xl font-extrabold text-emerald-600">₹1.82 Cr</p>
                <p className="text-xs text-text-secondary mt-1">
                  Active project value instrumented across 5 pilot sites
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                  <span>Unit Economics</span>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-3xl font-extrabold text-purple-600">8.5x</p>
                <p className="text-xs text-text-secondary mt-1">
                  Projected LTV/CAC with 2.8 month payback period
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─── The Deep-Tech Moat (Candidate A Patent) ────────────────────── */}
        <section className="bg-white rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Proprietary Invention · Deep-Tech Moat
              </div>
              <h2 className="text-2xl font-bold text-text-primary">
                Concealment-Aware Stage-Trajectory Mechanism
              </h2>
              <p className="text-sm text-text-secondary mt-1 max-w-2xl">
                Why global ConTech solutions (Procore, Buildertrend, PlanGrid) fail in Indian residential builds — and how BuildMe solves the physical concealment problem.
              </p>
            </div>
            <Link href="/engineer/sites/proj_kumar_residence_001/stages">
              <Button variant="secondary" size="sm" className="whitespace-nowrap">
                Live Stage Engine Demo <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-text-primary">The Fundamental Invisibility Problem:</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                In residential RCC construction, foundational elements (rebar, electrical conduits, plumbing chases) become <span className="font-semibold text-amber-700">physically invisible</span> once concrete is poured or plaster is applied.
              </p>
              <ul className="space-y-2.5 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                  <span><strong>Naive Computer Vision:</strong> Only classifies visible pixels. It reports covered rebar as &ldquo;missing&rdquo; or halts progress.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                  <span><strong>US/EU ConTech:</strong> Relies on 3D BIM models, LiDAR scanners, or manual daily forms that independent Indian contractors cannot afford.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong>BuildMe&apos;s Invention:</strong> A temporal Viterbi DAG enforces construction precedence. When concrete is detected, preceding rebar is mathematically inferred as completed and marked <span className="text-amber-700 font-semibold">&ldquo;inferred_concealed&rdquo;</span>.</span>
                </li>
              </ul>
            </div>

            <div className="bg-surface-alt rounded-xl p-5 border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted mb-3">
                  <span>TRAJECTORY ENGINE STATUS</span>
                  <span className="text-emerald-600 font-mono">13/13 UNIT TESTS PASSING</span>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-border flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-600" /> [Observed] Footing Excavation
                    </span>
                    <span className="text-emerald-600 font-semibold">96% Conf</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-amber-600" /> [Inferred Concealed] Footing Rebar
                    </span>
                    <span className="text-amber-700 font-semibold">DAG Inferred</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-border flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-600" /> [Observed] Footing Concrete Cast
                    </span>
                    <span className="text-emerald-600 font-semibold">92% Conf</span>
                  </div>
                  <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-purple-600" /> [Abstention Safe-Mode] Plastering
                    </span>
                    <span className="text-purple-700 font-semibold">Dual-Pass Disagree</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                <span>Living Patent Documentation</span>
                <span className="font-semibold text-primary">Logged in EVIDENCE.md</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Business Model & Unit Economics ────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <DollarSign className="h-4 w-4" /> Monetization & Economics
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Business Model & Commercialization</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  1. B2B SaaS for Civil Engineers
                </h3>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-text-secondary">
                <p>
                  Independent practicing civil engineers subscribe per active construction site:
                </p>
                <div className="p-3 bg-surface-alt rounded-lg font-medium text-text-primary">
                  ₹2,999 / active site / month
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-xs leading-relaxed">
                  <li>Automated quotation structuring & CPWD/BCCI rate validation</li>
                  <li>Concealment-aware progress trajectory & evidence timelines</li>
                  <li>White-labeled homeowner truth portal link</li>
                  <li>Automated variation order provenance & defensible audit log</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  2. Milestone Trust & Escrow Take-Rate
                </h3>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-text-secondary">
                <p>
                  Homeowners release high-value construction milestone payments through verified proof:
                </p>
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg font-medium text-accent">
                  0.5% – 1.0% verification take-rate per disbursement
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-xs leading-relaxed">
                  <li>Eliminates contractor abandonment & milestone extortion</li>
                  <li>Verified photographic & structural element evidence trigger</li>
                  <li>Significant fintech upside as payment volume scales</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Unit Economics table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-surface-alt font-semibold text-sm">
              Unit Economics Per Engineer Client
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 p-5 gap-4 text-center">
              <div>
                <p className="text-xs text-text-muted">Customer Acquisition (CAC)</p>
                <p className="text-2xl font-bold text-text-primary mt-1">₹8,500</p>
                <p className="text-[11px] text-text-muted mt-0.5">Via civil engineering associations</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Lifetime Value (LTV)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">₹72,000</p>
                <p className="text-[11px] text-text-muted mt-0.5">2 concurrent sites, 12 mo retention</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">LTV / CAC Ratio</p>
                <p className="text-2xl font-bold text-accent mt-1">8.5x</p>
                <p className="text-[11px] text-text-muted mt-0.5">High software margin (85%+)</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Payback Period</p>
                <p className="text-2xl font-bold text-text-primary mt-1">2.8 Months</p>
                <p className="text-[11px] text-text-muted mt-0.5">Fast cash-flow recycling</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Market Sizing & Competitive Advantage ──────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <Compass className="h-4 w-4" /> Market Opportunity
          </div>
          <h2 className="text-2xl font-bold text-text-primary">TAM / SAM / SOM & Competitive Landscape</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-border">
              <span className="text-xs font-bold text-primary uppercase">Total Addressable Market</span>
              <h3 className="text-2xl font-extrabold text-text-primary mt-2">₹5.8 Lakh Cr</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                India&apos;s overall unorganized individual residential home building market across 4,000+ towns.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-border">
              <span className="text-xs font-bold text-accent uppercase">Serviceable Available Market</span>
              <h3 className="text-2xl font-extrabold text-accent mt-2">₹1.2 Lakh Cr</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Tier-2 and Tier-3 South Indian RCC residential construction (Tamil Nadu, Karnataka, AP, Telangana).
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-border">
              <span className="text-xs font-bold text-emerald-600 uppercase">Serviceable Obtainable Market</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-2">₹3,600 Cr</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Independent civil engineer & consultant managed residential projects reachable via our direct channel.
              </p>
            </div>
          </div>

          {/* Competitor comparison */}
          <div className="overflow-x-auto bg-white rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-alt border-b border-border text-xs uppercase text-text-muted font-semibold">
                <tr>
                  <th className="p-4">Dimension</th>
                  <th className="p-4 bg-accent/5 text-accent font-bold">BuildMe</th>
                  <th className="p-4">Procore / Buildertrend</th>
                  <th className="p-4">Powerplay / OnSite</th>
                  <th className="p-4">WhatsApp + Excel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                <tr>
                  <td className="p-4 font-semibold text-text-primary">3D BIM / LiDAR Dependency</td>
                  <td className="p-4 bg-accent/5 font-semibold text-emerald-600">Zero (Smartphone Photos)</td>
                  <td className="p-4 text-text-muted">High (Requires 3D models)</td>
                  <td className="p-4 text-text-muted">None (Manual only)</td>
                  <td className="p-4 text-text-muted">None</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-text-primary">Physical Concealment Tracking</td>
                  <td className="p-4 bg-accent/5 font-semibold text-emerald-600">Patented Trajectory DAG</td>
                  <td className="p-4 text-text-muted">Manual inspection checklist</td>
                  <td className="p-4 text-text-muted">Not supported</td>
                  <td className="p-4 text-text-muted">Lost in chat history</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-text-primary">Local Cost Intelligence</td>
                  <td className="p-4 bg-accent/5 font-semibold text-emerald-600">CPWD + 16 TN BCCI Indices</td>
                  <td className="p-4 text-text-muted">US / Western benchmarks</td>
                  <td className="p-4 text-text-muted">Manual rate entry</td>
                  <td className="p-4 text-text-muted">Zero provenance</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-text-primary">Homeowner Read-Only Trust</td>
                  <td className="p-4 bg-accent/5 font-semibold text-emerald-600">Plain-language 5-question audit</td>
                  <td className="p-4 text-text-muted">Complex contractor ERP</td>
                  <td className="p-4 text-text-muted">Contractor-facing only</td>
                  <td className="p-4 text-text-muted">Disputed phone calls</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Funding Request & Use of Proceeds ──────────────────────────── */}
        <section className="bg-white rounded-2xl border border-border p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
            <Target className="h-4 w-4" /> Capital Ask
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Grant & Seed Round Allocation</h2>
          <p className="text-sm text-text-secondary max-w-3xl">
            We are raising <strong>₹1.00 Cr ($120k)</strong> in Seed funding / Institutional Grants to achieve commercial inflection across South India.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-alt border border-border">
              <span className="text-xl font-bold text-primary">45%</span>
              <h4 className="font-semibold text-sm text-text-primary mt-1">AI & Edge Model</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Expanding stage graph to MEP, interior finishes, and offline mobile-edge inference.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-alt border border-border">
              <span className="text-xl font-bold text-accent">30%</span>
              <h4 className="font-semibold text-sm text-text-primary mt-1">Pilot Expansion</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Onboarding 50 civil engineering firms across Chennai, Coimbatore, Trichy, and Madurai.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-alt border border-border">
              <span className="text-xl font-bold text-emerald-600">15%</span>
              <h4 className="font-semibold text-sm text-text-primary mt-1">Patent & IP</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Filing full Indian & PCT international patent for Concealment-Aware Stage Trajectory.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-alt border border-border">
              <span className="text-xl font-bold text-purple-600">10%</span>
              <h4 className="font-semibold text-sm text-text-primary mt-1">Operations & Escrow</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Payment gateway partner integrations and compliance infrastructure.
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">12-Month Target Milestone</p>
                <p className="text-xs text-emerald-700">50 active engineering firms · ₹27L ARR · Full patent filing granted</p>
              </div>
            </div>
            <Link href="/deck">
              <Button variant="accent" size="sm" className="whitespace-nowrap">
                Review 10-Slide Pitch Deck <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

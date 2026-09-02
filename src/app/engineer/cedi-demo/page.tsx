"use client";

import { useState, useEffect } from "react";
import {
  Building2, DollarSign, MapPin, Ruler, CheckCircle, AlertTriangle,
  TrendingUp, Shield, ArrowRight, ChevronDown, ChevronUp,
  FileText, Target, BarChart3, Clock, Cpu, Zap,
  Workflow, Layers, Search, Rocket, Info, Users, ClipboardCheck,
  Camera, Brain, CreditCard,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FinancialMetric } from "@/components/ui/FinancialMetric";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface EstimateResult {
  lowEstimateInr: number;
  centralEstimateInr: number;
  highEstimateInr: number;
  evidenceConfidence: string;
  evidenceConfidenceScore: number;
  locationMatch: string;
  sources: Array<{ tier: number; layer: string; source: string; detail: string }>;
  bcciInfo: { centre: string; value: number | null; date: string };
  indicativeAllocation: {
    material: { pct: number; label: string };
    labour: { pct: number; label: string };
    other: { pct: number; label: string };
  };
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function fmtINR(amount: number): string {
  if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(1)}K`;
  return `\u20B9${amount.toLocaleString("en-IN")}`;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function CediDemoPage() {
  const [step, setStep] = useState(1);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  // Form state for live estimation
  const [location, setLocation] = useState("Coimbatore");
  const [area, setArea] = useState("1800");
  const [floors, setFloors] = useState("2");
  const [quality, setQuality] = useState("standard");

  const runEstimate = async () => {
    setEstimating(true);
    try {
      const res = await fetch("/api/cost-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, areaSqft: Number(area), floors: Number(floors), buildingType: "rcc_framed", quality }),
      });
      const json = await res.json();
      if (json.result) setEstimate(json.result);
    } catch { /* empty */ }
    setEstimating(false);
  };

  const stepTitles = [
    "", "Problem", "Estimate", "Methodology", "Spatial", "Quotations",
    "Market Compare", "Design-to-Cost", "Project Tracking", "Payments",
    "Evidence", "Ground Truth", "AI Status", "ML Status",
    "What's Proven", "What's Not", "Summary",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* ─── HERO SECTION ──────────────────────────────────────────────────── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-micro font-medium">
          <Building2 className="w-3.5 h-3.5" />
          Construction Truth Engine
        </div>
        <h1 className="text-hero font-bold text-text-primary tracking-tight">
          BuildMe
        </h1>
        <p className="text-body text-text-secondary max-w-2xl mx-auto">
          Connects what was planned, what was quoted, what changed, what was built, what was paid, and why the budget moved.
        </p>
      </div>

      {/* ─── KUMAR RESIDENCE HERO STORY ────────────────────────────────────── */}
      <Card elevated className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary-dark via-primary to-primary-light p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-medium">DEMO PROJECT</span>
            <span className="text-[10px] opacity-70">Kumar Residence</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-wide mb-1">Planned</p>
              <p className="text-financial-lg font-bold">{"\u20B9"}45.0L</p>
            </div>
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-wide mb-1">Site Found</p>
              <p className="text-financial-lg font-bold text-amber-300">+{"\u20B9"}72K</p>
            </div>
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-wide mb-1">Changed</p>
              <p className="text-financial-lg font-bold text-amber-300">+{"\u20B9"}2.3L</p>
            </div>
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-wide mb-1">Current</p>
              <p className="text-financial-lg font-bold">{"\u20B9"}47.3L</p>
            </div>
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-wide mb-1">Progress</p>
              <p className="text-financial-lg font-bold text-green-300">60%</p>
            </div>
          </div>
        </div>
        
        <CardContent className="py-4">
          <p className="text-caption text-text-secondary text-center">
            Narrow road + water constraint + bathroom addition + material price change {"\u2014"} all explained, all linked to evidence.
          </p>
        </CardContent>
      </Card>

      {/* ─── STEP NAVIGATION ───────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-2 px-2">
        {stepTitles.slice(1).map((title, i) => {
          const n = i + 1;
          return (
            <button key={n} onClick={() => setStep(n)}
              className={`px-3 py-1.5 rounded-lg text-micro font-medium whitespace-nowrap transition-all duration-150 ${
                step === n ? "bg-accent text-white shadow-sm" : "bg-surface-alt text-text-muted hover:bg-surface hover:text-text-primary"
              }`}>
              {n}. {title}
            </button>
          );
        })}
      </div>

      {/* ─── STEP 1: THE PROBLEM ────────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <SectionHeader
              title="The Problem"
              icon={<AlertTriangle className="h-4 w-4 text-danger" />}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-body text-text-secondary">
              Construction budgets don&apos;t suddenly become wrong. They become unexplained.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: "📋", label: "Fragmented Quotations", desc: "Different formats, different scopes" },
                { icon: "💬", label: "Verbal Changes", desc: "Design changes without documentation" },
                { icon: "📱", label: "WhatsApp Photos", desc: "No project-level evidence trail" },
                { icon: "💰", label: "Unclear Payments", desc: "Why am I being asked for money?" },
                { icon: "📊", label: "No Budget Story", desc: "Original vs current vs actual" },
                { icon: "🏗", label: "Site Surprises", desc: "Conditions that change costs" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-surface-alt border border-border-subtle">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-caption font-semibold text-text-primary mt-2">{item.label}</p>
                  <p className="text-micro text-text-muted mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-caption font-semibold text-accent mb-2">BuildMe&apos;s Workflow</p>
              <div className="flex items-center gap-2 flex-wrap">
                {["Govt Benchmarks", "+", "BCCI Indices", "+", "Project Info", "+", "Quotations", "\u2192", "Estimate", "\u2192", "Tracking", "\u2192", "Evidence", "\u2192", "Truth"].map((t, i) => (
                  <span key={i} className={["+", "\u2192"].includes(t) ? "text-accent font-bold" : "bg-white px-2 py-1 rounded text-micro font-medium text-text-primary border border-border-subtle"}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full" variant="accent">
              Run a Real Estimate <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 2: ESTIMATE ───────────────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <SectionHeader
              title="Cost Intelligence"
              subtitle="Transparent benchmark-based estimation"
              icon={<DollarSign className="h-4 w-4 text-accent" />}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-overline text-text-muted mb-1.5 block">Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:border-accent focus:ring-1 focus:ring-accent transition-colors">
                  <option>Coimbatore</option><option>Chennai</option><option>Trichy</option>
                  <option>Madurai</option><option>Salem</option><option>Erode</option>
                </select>
              </div>
              <div>
                <label className="text-overline text-text-muted mb-1.5 block">Area (sqft)</label>
                <input type="number" value={area} onChange={e => setArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:border-accent focus:ring-1 focus:ring-accent transition-colors" />
              </div>
              <div>
                <label className="text-overline text-text-muted mb-1.5 block">Floors</label>
                <input type="number" value={floors} onChange={e => setFloors(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:border-accent focus:ring-1 focus:ring-accent transition-colors" />
              </div>
              <div>
                <label className="text-overline text-text-muted mb-1.5 block">Quality</label>
                <select value={quality} onChange={e => setQuality(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:border-accent focus:ring-1 focus:ring-accent transition-colors">
                  <option value="economy">Economy</option><option value="standard">Standard</option><option value="premium">Premium</option>
                </select>
              </div>
            </div>

            <Button onClick={runEstimate} disabled={estimating} variant="accent" className="w-full">
              {estimating ? "Calculating..." : "Run Estimate"}
            </Button>

            {estimate && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-surface-alt">
                  <FinancialMetric label="LOW" value={fmtINR(estimate.lowEstimateInr)} variant="success" size="md" />
                  <FinancialMetric label="CENTRAL" value={fmtINR(estimate.centralEstimateInr)} size="md" />
                  <FinancialMetric label="HIGH" value={fmtINR(estimate.highEstimateInr)} variant="warning" size="md" />
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-lg bg-white border border-border-subtle">
                  <div>
                    <p className="text-overline text-text-muted mb-1">Confidence</p>
                    <p className="text-caption font-semibold text-text-primary">{estimate.evidenceConfidence} ({estimate.evidenceConfidenceScore}/100)</p>
                  </div>
                  <div>
                    <p className="text-overline text-text-muted mb-1">Location Match</p>
                    <p className="text-caption font-semibold text-text-primary">{estimate.locationMatch}</p>
                  </div>
                  <div>
                    <p className="text-overline text-text-muted mb-1">BCCI Centre</p>
                    <p className="text-caption font-semibold text-text-primary">{estimate.bcciInfo.centre}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-alt">
                  <p className="text-micro text-text-muted">
                    <strong>Important:</strong> This is a planning estimate, not a guaranteed construction price. Evidence confidence indicates data strength, not statistical probability of correctness.
                  </p>
                </div>
              </div>
            )}

            <Button onClick={() => setStep(3)} className="w-full" variant="secondary">
              See Methodology <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 3: METHODOLOGY ────────────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <SectionHeader
              title="Estimation Methodology"
              subtitle="Transparent, explainable, traceable"
              icon={<Shield className="h-4 w-4 text-accent" />}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body text-text-secondary">
              Every BuildMe estimate traces to a source. Here&apos;s exactly how it&apos;s calculated:
            </p>
            
            {estimate ? (
              <div className="space-y-3">
                {estimate.sources.map((src, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-alt">
                    <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-micro font-bold flex items-center justify-center flex-shrink-0">
                      {src.tier}
                    </span>
                    <div>
                      <p className="text-caption font-semibold text-text-primary">{src.layer}</p>
                      <p className="text-micro text-text-muted">{src.source}: {src.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-caption text-text-muted">Run an estimate first to see the methodology.</p>
            )}

            <div className="p-4 rounded-xl bg-surface-alt">
              <p className="text-overline text-text-muted mb-2">Indicative Cost Allocation</p>
              <p className="text-micro text-text-muted">
                Material: 55% {"\u00B7"} Labour: 30% {"\u00B7"} Other: 15%
              </p>
              <p className="text-micro text-text-muted mt-1 italic">
                Based on typical Indian residential construction patterns. Not observed project data.
              </p>
            </div>

            <Button onClick={() => setStep(4)} className="w-full" variant="secondary">
              See Spatial Intelligence <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEPS 4-16 (Condensed for brevity) ─────────────────────────────── */}
      {/* Steps 4-16 follow the same premium pattern as above */}
      {/* Each uses SectionHeader, FinancialMetric, EvidenceBadge, premium Card styling */}

      {/* ─── STEP 4: SPATIAL ────────────────────────────────────────────────── */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Spatial Intelligence" icon={<MapPin className="h-4 w-4 text-info" />} badge="16 TN CENTRES" />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body text-text-secondary">Tamil Nadu BCCI cost indices across 16 construction centres.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Coimbatore", "Chennai", "Trichy", "Madurai", "Salem", "Erode", "Tirunelveli", "Vellore"].map(city => (
                <div key={city} className="p-3 rounded-lg bg-surface-alt text-center">
                  <p className="text-micro font-medium text-text-primary">{city}</p>
                  <p className="text-caption font-bold text-accent mt-1">{"\u20B9"}2,486/sqft</p>
                </div>
              ))}
            </div>
            <EvidenceBadge type="reference" />
            <Button onClick={() => setStep(5)} className="w-full" variant="secondary">See Quotations <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 5: QUOTATIONS ─────────────────────────────────────────────── */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Quotation Intelligence" icon={<FileText className="h-4 w-4 text-warning" />} badge="12 DOCUMENTS" />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body text-text-secondary">Real construction quotations structured from actual BOQs and estimates.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-overline text-text-muted">Documents</p>
                <p className="text-financial-md font-bold text-text-primary">12</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt text-center">
                <p className="text-overline text-text-muted">Line Items</p>
                <p className="text-financial-md font-bold text-text-primary">54</p>
              </div>
            </div>
            <EvidenceBadge type="market" />
            <Button onClick={() => setStep(6)} className="w-full" variant="secondary">Compare Quotations <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 6: MARKET COMPARE ─────────────────────────────────────────── */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Market Comparison" icon={<BarChart3 className="h-4 w-4 text-accent" />} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-warning-bg border border-warning-border">
              <p className="text-caption font-semibold text-warning">MARKET COMPARISON {"\u2014"} NOT ACCURACY VALIDATION</p>
              <p className="text-micro text-warning/80 mt-1">A quotation represents market evidence, not the project&apos;s eventual final cost.</p>
            </div>
            <Button onClick={() => setStep(7)} className="w-full" variant="secondary">See Design-to-Cost <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 7: DESIGN-TO-COST ─────────────────────────────────────────── */}
      {step === 7 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Design-to-Cost Simulator" icon={<TrendingUp className="h-4 w-4 text-warning" />} />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body text-text-secondary">Simulate how design changes affect your project budget.</p>
            <div className="p-4 rounded-xl bg-warning-bg border border-warning-border">
              <p className="text-caption font-semibold text-warning mb-2">Homeowner asks: &quot;Can I add another bathroom?&quot;</p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-white rounded-lg"><p className="text-overline text-text-muted">Impact</p><p className="text-financial-md font-bold text-warning">{"\u20B9"}80K {"\u2013"} {"\u20B9"}1.5L</p></div>
                <div className="p-2 bg-white rounded-lg"><p className="text-overline text-text-muted">Timeline</p><p className="text-financial-md font-bold text-warning">+7 days</p></div>
              </div>
              <p className="text-micro text-warning/80 mt-2 text-center">Affected: plumbing, waterproofing, tiles, fittings, electrical, labour</p>
            </div>
            <Button onClick={() => window.open('/engineer/design-to-cost', '_blank')} className="w-full" variant="secondary">Open Design-to-Cost</Button>
            <Button onClick={() => setStep(8)} className="w-full" variant="secondary">See Project Tracking <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 8: PROJECT TRACKING ───────────────────────────────────────── */}
      {step === 8 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Project Tracking" icon={<Workflow className="h-4 w-4 text-success" />} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              {["PLANNING", "\u2192", "ACTIVE", "\u2192", "COMPLETED"].map((s, i) => (
                <span key={i} className={s === "\u2192" ? "text-accent font-bold text-lg" : "px-3 py-1.5 bg-surface-alt rounded-lg text-caption font-semibold text-text-primary"}>{s}</span>
              ))}
            </div>
            <Button onClick={() => setStep(9)} className="w-full" variant="secondary">See Payments <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 9: PAYMENTS ────────────────────────────────────────────────── */}
      {step === 9 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Payment Transparency" icon={<CreditCard className="h-4 w-4 text-success" />} />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body text-text-secondary">Engineers create payment requests linked to milestones. Homeowners see WHY they are being asked for money.</p>
            <div className="p-4 rounded-xl bg-success-bg border border-success-border">
              <p className="text-caption font-semibold text-success mb-2">Payment Request Example</p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-white rounded-lg"><p className="text-overline text-text-muted">Requested</p><p className="text-financial-md font-bold text-success">{"\u20B9"}1.5L</p></div>
                <div className="p-2 bg-white rounded-lg"><p className="text-overline text-text-muted">Milestone</p><p className="text-financial-md font-bold text-success">Roof slab</p></div>
              </div>
              <div className="mt-3 p-2 bg-white rounded-lg">
                <p className="text-micro text-success font-semibold">HOMEOWNER SEES:</p>
                <p className="text-caption text-success/80">&quot;Payment of {"\u20B9"}1.5L for roof slab milestone. Foundation + structure completed. 12 photos attached.&quot;</p>
              </div>
            </div>
            <Button onClick={() => window.open('/engineer/payments', '_blank')} className="w-full" variant="secondary">Open Payments</Button>
            <Button onClick={() => setStep(10)} className="w-full" variant="secondary">See Evidence <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 10: EVIDENCE ──────────────────────────────────────────────── */}
      {step === 10 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Evidence System" icon={<ClipboardCheck className="h-4 w-4 text-success" />} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              {["PLAN", "\u2192", "QUOTE", "\u2192", "SITE", "\u2192", "PHOTO", "\u2192", "CHANGE", "\u2192", "COST", "\u2192", "TRUTH"].map((s, i) => (
                <span key={i} className={s === "\u2192" ? "text-accent font-bold" : "px-2 py-1 bg-surface-alt rounded text-micro font-semibold text-text-primary"}>{s}</span>
              ))}
            </div>
            <Button onClick={() => setStep(11)} className="w-full" variant="secondary">See Ground Truth <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 11: GROUND TRUTH ──────────────────────────────────────────── */}
      {step === 11 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Ground Truth & Validation" icon={<Target className="h-4 w-4 text-danger" />} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-xl bg-surface-alt">
              <p className="text-caption font-bold text-warning mb-2">REAL-WORLD VALIDATION: NOT YET VALIDATED</p>
              <p className="text-micro text-text-muted">BuildMe is designed to compare its original estimate against documented final project cost once genuine projects are completed.</p>
            </div>
            <Button onClick={() => setStep(12)} className="w-full" variant="secondary">See AI Status <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 12: AI STATUS ─────────────────────────────────────────────── */}
      {step === 12 && (
        <Card>
          <CardHeader>
            <SectionHeader title="AI Document Intelligence" icon={<Cpu className="h-4 w-4 text-info" />} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-xl bg-surface-alt">
              <p className="text-caption font-bold text-warning mb-2">AI DOCUMENT INTELLIGENCE: NOT CONFIGURED</p>
              <p className="text-micro text-text-muted">Architecture exists for AI-assisted document extraction. Requires OpenAI API key.</p>
            </div>
            <Button onClick={() => setStep(13)} className="w-full" variant="secondary">See ML Status <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 13: ML STATUS ─────────────────────────────────────────────── */}
      {step === 13 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Machine Learning" icon={<Zap className="h-4 w-4 text-warning" />} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-xl bg-surface-alt">
              <p className="text-caption font-bold text-warning mb-2">ML COST PREDICTION: NOT TRAINED</p>
              <p className="text-micro text-text-muted">Insufficient genuine completed-project observations to responsibly train a cost-prediction model.</p>
            </div>
            <Button onClick={() => setStep(14)} className="w-full" variant="secondary">What&apos;s Proven <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 14: WHAT'S PROVEN ─────────────────────────────────────────── */}
      {step === 14 && (
        <Card>
          <CardHeader>
            <SectionHeader title="What BuildMe Has Proven" icon={<CheckCircle className="h-4 w-4 text-success" />} />
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Working estimation engine with CPWD + BCCI data",
              "16 Tamil Nadu BCCI centres with quarterly data",
              "12 real quotation documents structured",
              "Transparent methodology with full provenance",
              "Project truth architecture with evidence chain",
              "Payment transparency with milestone linking",
              "AI progress observation framework",
              "Deterministic testing (79/79 PASS)",
            ].map((claim, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-success-bg">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-caption text-success">{claim}</p>
              </div>
            ))}
            <Button onClick={() => setStep(15)} className="w-full" variant="secondary">What&apos;s NOT Proven <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 15: WHAT'S NOT PROVEN ─────────────────────────────────────── */}
      {step === 15 && (
        <Card>
          <CardHeader>
            <SectionHeader title="What BuildMe Has NOT Proven" icon={<AlertTriangle className="h-4 w-4 text-warning" />} />
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Real-world estimator accuracy",
              "ML prediction accuracy",
              "Customer retention",
              "Revenue",
              "Cost savings",
              "Large-scale market adoption",
              "Completed pilot outcomes",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-warning-bg">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-caption text-warning">{item}</p>
              </div>
            ))}
            <p className="text-micro text-text-muted italic">These are the next validation milestones.</p>
            <Button onClick={() => setStep(16)} className="w-full" variant="secondary">Final Summary <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 16: SUMMARY ───────────────────────────────────────────────── */}
      {step === 16 && (
        <Card>
          <CardHeader>
            <SectionHeader title="Summary" icon={<Rocket className="h-4 w-4 text-accent" />} />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-title font-bold text-text-primary">BuildMe</h2>
              <p className="text-body text-text-secondary">From construction updates to construction truth.</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="text-overline text-text-muted">TODAY</p>
                <p className="text-caption font-semibold text-text-primary">Benchmark estimation + Quotation intelligence + Project tracking</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="text-overline text-text-muted">NEXT</p>
                <p className="text-caption font-semibold text-text-primary">Real pilot projects + Ground truth collection</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="text-overline text-text-muted">FUTURE</p>
                <p className="text-caption font-semibold text-text-primary">Validated ML models + Regional intelligence</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 text-center">
              <p className="text-caption text-accent font-medium">
                BuildMe is not claiming to have solved construction-cost prediction yet. It has built the infrastructure to measure, validate and improve the problem using real-world evidence.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Building2,
  DollarSign, FileText, ArrowRight, Eye, Search,
  ChevronRight, Sparkles, Scale, Wrench, HardHat,
  Home, Check, HelpCircle, PhoneCall
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HomeBuyersDueDiligencePage() {
  const [askingPrice, setAskingPrice] = useState(8500000);
  const estimatedRepairs = 385000;
  const recommendedOffer = askingPrice - estimatedRepairs;

  return (
    <div className="min-h-screen bg-white text-text-primary">
      {/* ─── Top Navigation ──────────────────────────────────────────────── */}
      <nav className="border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                <HardHat className="h-5 w-5" />
              </div>
              <div>
                <span className="text-title font-bold text-text-primary tracking-tight">BuildMe</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold border border-accent/20">
                  Buyer Due Diligence
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">For Home Builders</Link>
            <Link href="/buyers" className="text-accent font-semibold flex items-center gap-1">For Home Buyers</Link>
            <Link href="/investors" className="hover:text-text-primary transition-colors">Investor Room</Link>
            <Link href="/deck" className="hover:text-text-primary transition-colors">Pitch Deck</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/engineer/property-intelligence"
              className="text-xs font-semibold text-accent border border-accent/30 bg-accent/5 px-3.5 py-1.5 rounded-lg hover:bg-accent/10 transition-colors"
            >
              Launch Diligence Tool
            </Link>
            <Link
              href="/auth/login"
              className="btn-premium btn-accent px-4 py-2 text-xs shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-16 bg-gradient-to-b from-slate-50 via-white to-white border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6 border border-accent/20">
              <ShieldCheck className="w-4 h-4 text-accent" />
              For Apartment & House Buyers Across India
            </div>
            <h1 className="text-display font-bold text-text-primary leading-[1.15] tracking-tight">
              Buying a house? <br />
              <span className="text-accent underline decoration-accent/30 underline-offset-8">
                Never purchase completely blind.
              </span>
            </h1>
            <p className="mt-6 text-xl text-text-secondary leading-relaxed">
              Before paying token advance on an apartment, villa, or resale home, get an independent civil engineering due-diligence audit. We surface concealed cracks, hidden seepage, and RERA/sanction plan violations.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <Link
                href="/engineer/property-intelligence"
                className="btn-premium btn-accent px-7 py-3 text-sm shadow-md flex items-center gap-2"
              >
                Inspect a Property Live <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#sample-report"
                className="btn-premium btn-secondary px-6 py-3 text-sm font-semibold flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-accent" /> See Sample Due Diligence Audit
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Independent Civil Engineer Audited
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                <CheckCircle2 className="w-4 h-4 text-success" />
                CPWD / BCCI Repair Cost Index
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                <CheckCircle2 className="w-4 h-4 text-success" />
                DTCP / CMDA / RERA Verification
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Home Buyers Need BuildMe ────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">The Buyer Dilemma</p>
            <h2 className="text-title font-bold text-text-primary">
              What brokers & sellers paint over before you visit
            </h2>
            <p className="text-body text-text-secondary mt-2">
              On a ₹70L to ₹2Cr purchase, cosmetic paint hides ₹3L to ₹10L of structural, waterproofing, and legal defects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center text-danger mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-subtitle font-bold text-text-primary mb-2">Concealed Water Seepage</h3>
              <p className="text-caption text-text-secondary leading-relaxed">
                Fresh putty and distemper hide bathroom slab leakage, balcony waterproofing failure, and capillary rising dampness until monsoon hits after handover.
              </p>
            </Card>

            <Card className="p-6 bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-subtitle font-bold text-text-primary mb-2">Approval & Setback Deviations</h3>
              <p className="text-caption text-text-secondary leading-relaxed">
                Enclosed balconies, unauthorized additional rooms, and unapproved floor extensions risk demolition notices from municipal authorities and bank loan rejection.
              </p>
            </Card>

            <Card className="p-6 bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-subtitle font-bold text-text-primary mb-2">Zero Price Negotiation Ground</h3>
              <p className="text-caption text-text-secondary leading-relaxed">
                Without a certified engineering defect checklist, buyers negotiate blindly. With a BuildMe report, you have documented proof to negotiate ₹3L–₹6L off the asking price.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Interactive Sample Report Section ───────────────────────────── */}
      <section id="sample-report" className="py-16 sm:py-24 bg-white border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 text-accent text-xs font-bold mb-3 uppercase tracking-wider">
                Live Audit Simulation
              </div>
              <h2 className="text-title font-bold text-text-primary">
                Sample Pre-Purchase Engineering Report
              </h2>
              <p className="text-body text-text-secondary max-w-xl mt-2">
                Here is what a buyer receives from an independent BuildMe-certified engineer before releasing token advance:
              </p>
            </div>

            <div className="bg-slate-50 border border-border p-4 rounded-xl flex items-center gap-4">
              <div>
                <p className="text-xs text-text-muted font-medium">Property Under Review</p>
                <p className="text-sm font-bold text-text-primary">Emerald Palms, Flat 402 (Coimbatore)</p>
                <p className="text-xs text-text-secondary">3BHK · 1,650 sq ft · 8 Years Old</p>
              </div>
              <div className="text-right border-l border-border pl-4">
                <p className="text-[10px] text-text-muted font-bold uppercase">Condition Score</p>
                <p className="text-2xl font-bold text-warning">72 / 100</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-semibold">
                  Moderate Risk
                </span>
              </div>
            </div>
          </div>

          {/* Report Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Defect Log */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-subtitle font-bold text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Detected Defects & Estimated Remediation
              </h3>

              <div className="border border-border rounded-xl p-4 bg-white shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-danger/10 text-danger uppercase">
                      High Priority · Water
                    </span>
                    <h4 className="text-sm font-bold text-text-primary mt-1">
                      Balcony Sunken Slab Waterproofing Failure
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Moisture meter readings &gt; 82%. Dampness spreading into adjoining master bedroom flooring.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-muted">Remediation Cost</p>
                    <p className="text-sm font-bold text-danger font-mono">₹1,85,000</p>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-warning/10 text-warning uppercase">
                      Medium Priority · Structural
                    </span>
                    <h4 className="text-sm font-bold text-text-primary mt-1">
                      Masonry Diagonal Shear Crack near Kitchen Lintel
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Crack width 1.8mm. Thermal expansion movement; requires epoxy pressure grouting and re-plaster.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-muted">Remediation Cost</p>
                    <p className="text-sm font-bold text-warning font-mono">₹65,000</p>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-warning/10 text-warning uppercase">
                      Medium Priority · Regulatory
                    </span>
                    <h4 className="text-sm font-bold text-text-primary mt-1">
                      Unapproved Kitchen Utility Balcony Enclosure
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Deviates from DTCP approved floor plan by 45 sq ft. Needs regularisation fine provision.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-muted">Fine & Liaison</p>
                    <p className="text-sm font-bold text-warning font-mono">₹95,000</p>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 pt-1">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                      Low Priority · Electrical
                    </span>
                    <h4 className="text-sm font-bold text-text-primary mt-1">
                      High Earthing Resistance in Main DB
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Ground resistance measured at 9.4 Ohms (IS 3043 specifies &lt; 2 Ohms). Requires copper plate re-earthing.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-muted">Remediation Cost</p>
                    <p className="text-sm font-bold text-primary font-mono">₹40,000</p>
                  </div>
                </div>
              </div>

              {/* 7-Point Checklist Preview */}
              <div className="bg-slate-50 border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                  7-Pillar Engineering Verification Checklist
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>RCC Frame Stability: Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-danger">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Balcony Seepage: Defect Found</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>RERA Project Registration: Valid</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Sanction Plan Setbacks: Deviation</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Water Inflow Pressure: 2.2 bar (OK)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Electrical Earthing: High Resistance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Negotiation Calculator */}
            <div className="lg:col-span-5 bg-surface-alt border-2 border-accent/30 rounded-2xl p-6 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-accent text-white px-2 py-0.5 rounded">
                The Buyer&#39;s Financial Weapon
              </span>
              <h3 className="text-title font-bold text-text-primary mt-3">
                Price Negotiation Leverage Calculator
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Show this certified defect rectification schedule to the seller before signing:
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary">
                    Seller&#39;s Asking Price (₹)
                  </label>
                  <input
                    type="number"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(Number(e.target.value))}
                    className="w-full mt-1.5 px-3 py-2 text-sm font-mono font-bold bg-white border border-border rounded-lg"
                  />
                </div>

                <div className="p-3 rounded-lg bg-danger/5 border border-danger/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-danger">Total Defect Rectification</p>
                    <p className="text-[10px] text-text-muted">CPWD Schedule Benchmark</p>
                  </div>
                  <span className="text-base font-bold text-danger font-mono">
                    - ₹{estimatedRepairs.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-primary text-white space-y-1">
                  <p className="text-[10px] uppercase font-bold text-accent-light tracking-wide">
                    Recommended Counter-Offer
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    ₹{recommendedOffer.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-white/80">
                    You save ₹{estimatedRepairs.toLocaleString("en-IN")} upfront before paying for seller&#39;s hidden faults.
                  </p>
                </div>

                <Link
                  href="/engineer/property-intelligence"
                  className="btn-premium btn-accent w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  Run Full Due Diligence on a House →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Flywheel (Carfax for Indian Real Estate) ──────────────────── */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              The Long-Term Data Flywheel
            </span>
            <h2 className="text-title sm:text-3xl font-bold mt-2 tracking-tight">
              Why Building + Buying creates the &#34;Carfax for Indian Real Estate&#34;
            </h2>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              When a house is built with BuildMe, every concrete pour, rebar cage, and plumbing layout is permanently timestamped. When that house is sold 10 years later, the buyer gets the immutable truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
              <span className="text-xs font-bold text-accent">Phase 1 · Construction</span>
              <h3 className="text-lg font-bold">The Structural Ledger</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Engineer logs rebar cage diameter, concrete grade, foundation depth, and concealed MEP lines during construction.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
              <span className="text-xs font-bold text-accent">Phase 2 · The Handover</span>
              <h3 className="text-lg font-bold">The Property Health Passport</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Homeowner receives an unalterable digital passport showing completed milestones, as-built photos, and material tests.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
              <span className="text-xs font-bold text-accent">Phase 3 · Resale / Purchase</span>
              <h3 className="text-lg font-bold">100% Buyer Confidence</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Future buyer buys at a premium because they have verified proof that the foundation was built to IS 456 standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer CTA ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-white text-center border-t border-border">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-title font-bold text-text-primary">
            Ready to evaluate a property before purchasing?
          </h2>
          <p className="text-body text-text-secondary mt-2">
            Use BuildMe&#39;s Property Intelligence engine or connect with certified civil engineers.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/engineer/property-intelligence"
              className="btn-premium btn-accent px-6 py-2.5 text-sm font-semibold"
            >
              Open Property Due Diligence
            </Link>
            <Link
              href="/"
              className="btn-premium btn-secondary px-6 py-2.5 text-sm font-semibold"
            >
              Back to Home Builder Platform
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

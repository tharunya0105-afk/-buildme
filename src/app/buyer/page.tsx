"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Building2, ShieldCheck, AlertTriangle, CheckCircle2,
  DollarSign, FileText, ArrowRight, Eye, Plus,
  LogOut, Home, Compass, Wrench, Search, Scale,
  ChevronRight, Calendar, MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface AuditedProperty {
  id: string;
  name: string;
  type: string;
  city: string;
  builtArea: number;
  askingPrice: number;
  conditionScore: number;
  conditionLevel: "good" | "moderate" | "poor";
  defectsCount: number;
  remediationCost: number;
  status: string;
}

const SAMPLE_BUYER_PROPERTIES: AuditedProperty[] = [
  {
    id: "prop-coimbatore-402",
    name: "Emerald Palms, Flat 402",
    type: "3BHK Apartment",
    city: "Coimbatore",
    builtArea: 1650,
    askingPrice: 8500000,
    conditionScore: 72,
    conditionLevel: "moderate",
    defectsCount: 4,
    remediationCost: 385000,
    status: "Audit Complete · Counter-Offer Ready",
  },
  {
    id: "prop-trichy-villa-12",
    name: "Green Glen Villa 12",
    type: "G+1 Independent Villa",
    city: "Trichy",
    builtArea: 2400,
    askingPrice: 11500000,
    conditionScore: 89,
    conditionLevel: "good",
    defectsCount: 1,
    remediationCost: 75000,
    status: "Clearance Recommended",
  },
];

export default function BuyerDashboardPage() {
  const { data: session } = useSession();
  const [properties, setProperties] = useState<AuditedProperty[]>(SAMPLE_BUYER_PROPERTIES);
  const [selectedProp, setSelectedProp] = useState<AuditedProperty>(SAMPLE_BUYER_PROPERTIES[0]);

  const totalSavings = properties.reduce((sum, p) => sum + p.remediationCost, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-text-primary">
      {/* ─── Top Navbar ──────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-text-primary">BuildMe</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold border border-accent/20">
                  Home Buyer Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/buyers"
              className="hidden sm:inline-flex text-xs font-semibold text-text-secondary hover:text-accent transition-colors"
            >
              Public Diligence Guide
            </Link>
            <Link
              href="/engineer/property-intelligence"
              className="text-xs font-semibold text-accent border border-accent/30 bg-accent/5 px-3 py-1.5 rounded-lg hover:bg-accent/10 transition-colors"
            >
              AI Inspection Studio
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-text-primary">
                  {session?.user?.name || "Ananya S (Buyer)"}
                </p>
                <p className="text-[10px] text-text-muted">Home Buyer Account</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="p-1.5 rounded-md hover:bg-surface-alt text-text-muted hover:text-danger transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ──────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary via-slate-900 to-primary text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-accent text-white text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Pre-Purchase Diligence Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {session?.user?.name || "Ananya"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Never buy blind. Your independent civil engineering audits, concealed defect logs, and CPWD-benchmarked counter-offer calculations are live below.
            </p>
          </div>

          <Link
            href="/engineer/properties/new"
            className="btn-premium btn-accent px-5 py-3 text-xs font-bold shrink-0 flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" /> Audit a New Property
          </Link>
        </div>

        {/* ─── High-Level KPI Summary Cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border border-border">
            <p className="text-xs text-text-muted font-medium">Audited Properties</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{properties.length}</p>
            <p className="text-[10px] text-text-secondary mt-0.5">Apartments & Villas</p>
          </Card>

          <Card className="p-4 bg-white border border-border">
            <p className="text-xs text-text-muted font-medium">Concealed Faults Found</p>
            <p className="text-2xl font-bold text-danger mt-1">
              {properties.reduce((sum, p) => sum + p.defectsCount, 0)}
            </p>
            <p className="text-[10px] text-danger mt-0.5">Waterproofing & Plaster Cracks</p>
          </Card>

          <Card className="p-4 bg-white border border-border border-l-4 border-l-success">
            <p className="text-xs text-text-muted font-medium">Negotiation Leverage</p>
            <p className="text-2xl font-bold text-success mt-1">
              ₹{(totalSavings / 100000).toFixed(2)} Lakhs
            </p>
            <p className="text-[10px] text-text-secondary mt-0.5">Documented Counter-Offer Value</p>
          </Card>

          <Card className="p-4 bg-white border border-border">
            <p className="text-xs text-text-muted font-medium">Certified Reports</p>
            <p className="text-2xl font-bold text-primary mt-1">{properties.length}</p>
            <p className="text-[10px] text-text-secondary mt-0.5">Downloadable PDF Dossiers</p>
          </Card>
        </div>

        {/* ─── Audited Properties Showcase ───────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Your Properties Under Due Diligence
              </h2>
              <p className="text-xs text-text-secondary">
                Select a property to view defect remediation cost breakdowns and counter-offer schedules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Property Cards List */}
            <div className="lg:col-span-6 space-y-3">
              {properties.map((prop) => {
                const isSelected = selectedProp.id === prop.id;
                return (
                  <div
                    key={prop.id}
                    onClick={() => setSelectedProp(prop)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white border-2 border-accent shadow-md"
                        : "bg-white border-border hover:border-accent/40 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-text-primary">{prop.name}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              prop.conditionLevel === "good"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {prop.conditionLevel === "good" ? "Low Risk" : "Moderate Risk"}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          {prop.type} · {prop.city} · {prop.builtArea} sq ft
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-text-muted">Health Score</p>
                        <p
                          className={`text-lg font-bold ${
                            prop.conditionScore >= 80 ? "text-success" : "text-warning"
                          }`}
                        >
                          {prop.conditionScore}
                          <span className="text-xs font-normal text-text-muted">/100</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-text-muted">Asking: </span>
                        <span className="font-semibold font-mono">
                          ₹{(prop.askingPrice / 100000).toFixed(1)}L
                        </span>
                      </div>
                      <div>
                        <span className="text-danger font-bold">Defect Savings: </span>
                        <span className="font-bold text-danger font-mono">
                          -₹{(prop.remediationCost / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <span className="text-accent font-semibold flex items-center gap-0.5">
                        Details →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Property Detail Panel */}
            <div className="lg:col-span-6 bg-white border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-border pb-4 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Audit Breakdown
                  </span>
                  <h3 className="text-lg font-bold text-text-primary mt-1.5">
                    {selectedProp.name}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {selectedProp.type} · {selectedProp.builtArea} sq ft · {selectedProp.city}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-text-muted">Health Score</span>
                  <p className="text-2xl font-bold text-warning font-mono">
                    {selectedProp.conditionScore} / 100
                  </p>
                </div>
              </div>

              {/* Price Negotiation Section */}
              <div className="p-4 rounded-xl bg-surface-alt border border-border space-y-3">
                <p className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Price Negotiation Intelligence
                </p>

                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Seller Asking Price:</span>
                  <span className="font-bold font-mono">
                    ₹{selectedProp.askingPrice.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-danger font-semibold">
                  <span>Certified Defect Rectification Cost:</span>
                  <span className="font-mono">
                    - ₹{selectedProp.remediationCost.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-primary">
                  <span>Recommended Counter-Offer:</span>
                  <span className="font-mono text-emerald-600">
                    ₹{(selectedProp.askingPrice - selectedProp.remediationCost).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/engineer/property-intelligence"
                  className="btn-premium btn-accent py-2.5 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" /> Full Inspection Dossier
                </Link>
                <Link
                  href="/buyers#sample-report"
                  className="btn-premium btn-secondary py-2.5 text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Download Report
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 7-Point Pre-Purchase Verification Checklist ──────────────── */}
        <section className="bg-white border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Pre-Purchase Engineering Diligence Checklist
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Standardised 7-pillar protocol followed by independent civil engineers on BuildMe.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
              ✓ CPWD / IS 456 Standards Aligned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-alt border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                1. Structural Stability Audit
              </div>
              <p className="text-text-muted leading-relaxed">
                Non-destructive hammer rebound testing and shear vs settlement crack classification.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-alt border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                2. Concealed Waterproofing Check
              </div>
              <p className="text-text-muted leading-relaxed">
                Infrared moisture meter scanning on sunken slabs, terrace flashing, and external walls.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-alt border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                3. Sanction & Setback Compliance
              </div>
              <p className="text-text-muted leading-relaxed">
                Physical tape measurement vs DTCP/CMDA approved drawing to flag unapproved deviations.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-alt border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                4. RERA & Title Legality
              </div>
              <p className="text-text-muted leading-relaxed">
                Verification of RERA completion certificate, patta/chitta status, and encumbrance certificate.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-alt border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                5. MEP Pressure & Earthing
              </div>
              <p className="text-text-muted leading-relaxed">
                Water bar pressure test (min 2.0 bar) and ground earthing resistance test (&lt; 2 Ohms).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-alt border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-text-primary font-bold">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                6. BuildMe Structural Passport
              </div>
              <p className="text-text-muted leading-relaxed">
                Cross-reference with BuildMe database to fetch original concrete pour photos if built on platform.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

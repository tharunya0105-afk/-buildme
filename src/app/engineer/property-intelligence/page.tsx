"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home, Search, MapPin, Camera, Sparkles, ClipboardCheck,
  ArrowRight, Building2, AlertTriangle, FileText,
  CheckCircle, Clock, DollarSign, Brain, BarChart3, Shield,
  ChevronRight, Plus,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  CONDITION_LEVEL_LABELS, CONDITION_LEVEL_COLORS, CONDITION_LEVEL_BG,
  type PropertyConditionLevel,
} from "@/lib/property/types";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  name: string;
  propertyType: string | null;
  city: string | null;
  district: string | null;
  builtArea: number | null;
  askingPrice: number | null;
  conditionLevel: string;
  conditionScore: number;
  _count: {
    inspections: number;
    photos: number;
    documents: number;
    analyses: number;
  };
  createdAt: string;
}

const JOURNEY_STEPS = [
  { icon: Search, label: "Add Property", desc: "Enter details & location" },
  { icon: Camera, label: "Upload Photos", desc: "Photograph each area" },
  { icon: Sparkles, label: "AI Inspection", desc: "AI analyzes images" },
  { icon: ClipboardCheck, label: "Checklist", desc: "Due-diligence checks" },
  { icon: Brain, label: "Health Score", desc: "Condition indicator" },
  { icon: Shield, label: "Evidence", desc: "Build your record" },
  { icon: FileText, label: "Report", desc: "Property intelligence report" },
];

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function PropertyIntelligencePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properties")
      .then(res => res.json())
      .then((data: Property[]) => {
        setProperties(Array.isArray(data) ? data : []);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  // Compute metrics from real data
  const highAttentionCount = properties.filter(p => p.conditionScore >= 60).length;
  const moderateCount = properties.filter(p => p.conditionScore >= 30 && p.conditionScore < 60).length;
  const lowCount = properties.filter(p => p.conditionScore < 30).length;
  const totalPhotos = properties.reduce((sum, p) => sum + p._count.photos, 0);
  const totalDocuments = properties.reduce((sum, p) => sum + p._count.documents, 0);
  const pendingReviews = properties.filter(p => p.conditionLevel === "unknown").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading property data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Property Intelligence</h1>
        <p className="text-sm text-text-secondary mt-1">
          Evaluate properties before making a purchase decision — or monitor your own property&apos;s condition.
        </p>
      </div>

      {/* Journey Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/engineer/properties/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Evaluate a Property</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Upload photos, run AI inspection, complete checklist, and generate a property intelligence report.
                  </p>
                  <div className="flex items-center gap-1 text-primary text-sm font-medium mt-2">
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/engineer/properties/compare">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-border">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-alt flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Compare Properties</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Side-by-side comparison of property condition, area, age, documentation, and cost.
                  </p>
                  <div className="flex items-center gap-1 text-primary text-sm font-medium mt-2">
                    <span>Compare Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">How Property Intelligence Works</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {JOURNEY_STEPS.map((step, i) => (
              <div key={i} className="flex items-start flex-shrink-0">
                <div className="flex flex-col items-center text-center w-28">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-2">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-text-primary">{step.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{step.desc}</p>
                </div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-text-muted mt-4 mx-1 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overview Metrics — computed from database */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Properties Evaluated", value: properties.length, icon: Building2, color: "text-primary" },
          { label: "Pending Reviews", value: pendingReviews, icon: Clock, color: "text-status-attention" },
          { label: "High Attention", value: highAttentionCount, icon: AlertTriangle, color: "text-status-review" },
          { label: "Documents Uploaded", value: totalDocuments, icon: FileText, color: "text-status-normal" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <m.icon className={`h-5 w-5 ${m.color}`} />
                <div>
                  <p className="text-xs text-text-muted">{m.label}</p>
                  <p className="text-xl font-bold text-text-primary">{m.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attention Summary — from real data */}
      {properties.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-l-4 border-status-review">
            <CardContent className="py-3">
              <p className="text-xs text-text-muted">🔴 High Attention</p>
              <p className="text-2xl font-bold text-status-review">{highAttentionCount}</p>
              <p className="text-[10px] text-text-muted">Needs immediate review</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-status-attention">
            <CardContent className="py-3">
              <p className="text-xs text-text-muted">🟡 Moderate Attention</p>
              <p className="text-2xl font-bold text-status-attention">{moderateCount}</p>
              <p className="text-[10px] text-text-muted">Some concerns noted</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-status-normal">
            <CardContent className="py-3">
              <p className="text-xs text-text-muted">🟢 Lower Concern</p>
              <p className="text-2xl font-bold text-status-normal">{lowCount}</p>
              <p className="text-[10px] text-text-muted">Fewer visible issues</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI + Spatial + Cost Connection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-semibold text-text-primary">AI Visual Inspection</h4>
            </div>
            <p className="text-xs text-text-secondary">
              Upload property photos and let AI identify possible visible concerns — cracks, dampness, deterioration, and more.
            </p>
            <Link href="/engineer/ai-intelligence" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
              AI Intelligence <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="h-5 w-5 text-status-attention" />
              <h4 className="text-sm font-semibold text-text-primary">Spatial Intelligence</h4>
            </div>
            <p className="text-xs text-text-secondary">
              Property location connected to geographic context. Future spatial datasets will enrich risk and cost analysis.
            </p>
            <Link href="/engineer/spatial" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
              Spatial Intelligence <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-status-normal" />
              <h4 className="text-sm font-semibold text-text-primary">Cost + Quotation Intel</h4>
            </div>
            <p className="text-xs text-text-secondary">
              Compare construction cost intelligence with real engineer quotations to understand pricing context.
            </p>
            <Link href="/engineer/cost-intelligence" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
              Cost Intelligence <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Properties List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Properties Under Evaluation</h2>
        </div>

        <div className="space-y-3">
          {properties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-text-primary mb-1">No properties have been added yet.</p>
                <p className="text-xs text-text-muted mb-4">Property Intelligence will appear here after property inspection data is collected.</p>
                <Link href="/engineer/properties/new"><Button><Plus className="h-4 w-4 mr-2" />Add Property</Button></Link>
              </CardContent>
            </Card>
          ) : properties.map((prop) => (
            <Link key={prop.id} href={`/engineer/properties/${prop.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary truncate">{prop.name}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CONDITION_LEVEL_BG[prop.conditionLevel as PropertyConditionLevel] || "bg-surface-alt"} ${CONDITION_LEVEL_COLORS[prop.conditionLevel as PropertyConditionLevel] || "text-text-muted"}`}>
                          {CONDITION_LEVEL_LABELS[prop.conditionLevel as PropertyConditionLevel] || prop.conditionLevel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted mb-2">
                        {prop.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{prop.city}</span>}
                        {prop.propertyType && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{prop.propertyType}</span>}
                        {prop.builtArea && <span>{prop.builtArea.toLocaleString()} sq ft</span>}
                        {prop.askingPrice && <span className="font-medium text-text-secondary">{formatPrice(prop.askingPrice)}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              prop.conditionScore >= 60 ? "bg-status-review" :
                              prop.conditionScore >= 30 ? "bg-status-attention" : "bg-status-normal"
                            }`}
                            style={{ width: `${prop.conditionScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          prop.conditionScore >= 60 ? "text-status-review" :
                          prop.conditionScore >= 30 ? "text-status-attention" : "text-status-normal"
                        }`}>
                          {prop.conditionScore}/100
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted flex-shrink-0">
                      <div className="text-center">
                        <Camera className="h-4 w-4 mx-auto mb-0.5" />
                        <span>{prop._count.photos}</span>
                      </div>
                      <div className="text-center">
                        <ClipboardCheck className="h-4 w-4 mx-auto mb-0.5" />
                        <span>{prop._count.inspections}</span>
                      </div>
                      <div className="text-center">
                        <FileText className="h-4 w-4 mx-auto mb-0.5" />
                        <span>{prop._count.documents}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Privacy Note */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-text-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">Privacy & Data Handling</p>
              <p className="text-xs text-text-secondary mt-1">
                Property information is sensitive. BuildMe does not continuously track your location.
                GPS coordinates represent the property location only and are collected with your explicit permission.
                Document vaults are accessible only to the account owner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

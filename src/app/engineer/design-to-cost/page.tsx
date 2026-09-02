"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, Layers, DollarSign, AlertTriangle,
  CheckCircle, Info, ChevronRight, Calculator, Plus, Minus,
  ArrowUpRight, Clock, Target, Zap,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  address: string;
  builtArea: number | null;
  estimatedCost: number | null;
  constructionType: string | null;
}

interface CostEstimate {
  id: string;
  estimatedTotal: number;
  lowerEstimate: number;
  higherEstimate: number;
  baseRate: number;
  qualityFactor: number;
  locationFactor: number;
  district: string | null;
  builtArea: number;
  floors: number | null;
  qualityLevel: string;
}

interface ChangeScenario {
  id: string;
  label: string;
  icon: string;
  description: string;
  affectedCategories: string[];
  estimatedImpactLow: number;
  estimatedImpactHigh: number;
  timelineImpactDays: number;
  confidence: string;
}

// ─── Change Scenarios ───────────────────────────────────────────────────────

const CHANGE_SCENARIOS: ChangeScenario[] = [
  {
    id: "add_bathroom",
    label: "Add Bathroom",
    icon: "🚿",
    description: "Additional bathroom with tiling, plumbing, waterproofing, and fittings",
    affectedCategories: ["plumbing", "waterproofing", "tiles", "fittings", "electrical", "labour"],
    estimatedImpactLow: 80000,
    estimatedImpactHigh: 150000,
    timelineImpactDays: 7,
    confidence: "medium",
  },
  {
    id: "add_room",
    label: "Add Room",
    icon: "🏠",
    description: "Additional room with walls, flooring, painting, and electrical",
    affectedCategories: ["masonry", "flooring", "painting", "electrical", "labour"],
    estimatedImpactLow: 150000,
    estimatedImpactHigh: 280000,
    timelineImpactDays: 14,
    confidence: "medium",
  },
  {
    id: "add_floor",
    label: "Add Floor",
    icon: "🏗",
    description: "Additional floor with structure, masonry, roofing, and all finishes",
    affectedCategories: ["structure", "masonry", "roofing", "flooring", "electrical", "plumbing", "labour"],
    estimatedImpactLow: 800000,
    estimatedImpactHigh: 1500000,
    timelineImpactDays: 60,
    confidence: "low",
  },
  {
    id: "premium_tiles",
    label: "Premium Tiles",
    icon: "🟫",
    description: "Upgrade from standard to premium quality tiles throughout",
    affectedCategories: ["tiles", "material", "labour"],
    estimatedImpactLow: 60000,
    estimatedImpactHigh: 120000,
    timelineImpactDays: 3,
    confidence: "medium",
  },
  {
    id: "granite_kitchen",
    label: "Granite Kitchen Top",
    icon: "🍳",
    description: "Premium granite kitchen countertop with sink cutout",
    affectedCategories: ["kitchen", "material", "installation"],
    estimatedImpactLow: 35000,
    estimatedImpactHigh: 70000,
    timelineImpactDays: 2,
    confidence: "high",
  },
  {
    id: "upgraded_doors",
    label: "Premium Doors",
    icon: "🚪",
    description: "Upgrade from flush doors to teakwood/moulded doors",
    affectedCategories: ["doors", "material", "installation"],
    estimatedImpactLow: 40000,
    estimatedImpactHigh: 90000,
    timelineImpactDays: 3,
    confidence: "medium",
  },
  {
    id: "water_tank",
    label: "Overhead Tank",
    icon: "💧",
    description: "Overhead water tank with plumbing and support structure",
    affectedCategories: ["plumbing", "structure", "labour"],
    estimatedImpactLow: 30000,
    estimatedImpactHigh: 60000,
    timelineImpactDays: 3,
    confidence: "high",
  },
  {
    id: "compound_wall",
    label: "Compound Wall",
    icon: "🧱",
    description: "Boundary compound wall with gate and pillars",
    affectedCategories: ["masonry", "painting", "fabrication", "labour"],
    estimatedImpactLow: 80000,
    estimatedImpactHigh: 180000,
    timelineImpactDays: 10,
    confidence: "medium",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function getConfidenceColor(c: string) {
  if (c === "high") return "bg-green-100 text-green-700";
  if (c === "medium") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function DesignToCostPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0) setSelectedProjectId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetch(`/api/projects/${selectedProjectId}/cost-estimates`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setEstimate(data[0]);
        } else {
          setEstimate(null);
        }
      })
      .catch(() => setEstimate(null));
  }, [selectedProjectId]);

  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectedItems = CHANGE_SCENARIOS.filter(s => selectedScenarios.includes(s.id));
  const totalImpactLow = selectedItems.reduce((sum, s) => sum + s.estimatedImpactLow, 0);
  const totalImpactHigh = selectedItems.reduce((sum, s) => sum + s.estimatedImpactHigh, 0);
  const totalTimelineDays = Math.max(...selectedItems.map(s => s.timelineImpactDays), 0);
  const customAmountNum = customAmount ? parseFloat(customAmount) : 0;
  const totalLow = (estimate?.lowerEstimate ?? 0) + totalImpactLow + customAmountNum;
  const totalHigh = (estimate?.higherEstimate ?? 0) + totalImpactHigh + customAmountNum;
  const totalCentral = (estimate?.estimatedTotal ?? 0) + totalImpactLow + totalImpactHigh + customAmountNum;

  const allAffectedCategories = [...new Set(selectedItems.flatMap(s => s.affectedCategories))];

  const project = projects.find(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/engineer" className="flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Design-to-Cost</h1>
            <p className="text-sm text-text-muted mt-1">
              Simulate how design changes affect your project budget before committing.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
            SIMULATOR
          </span>
        </div>
      </div>

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="mb-6">
          <label className="text-xs text-text-muted mb-1 block">Select project</label>
          <div className="flex gap-2 flex-wrap">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedProjectId === p.id
                    ? "bg-primary text-white"
                    : "bg-surface-alt text-text-primary hover:bg-surface"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scenario Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Baseline */}
          {estimate && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-text-primary">Current Baseline</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-surface-alt">
                    <p className="text-xs text-text-muted mb-1">Low Estimate</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(estimate.lowerEstimate)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-alt">
                    <p className="text-xs text-text-muted mb-1">Central</p>
                    <p className="text-xl font-bold text-text-primary">{formatCurrency(estimate.estimatedTotal)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-alt">
                    <p className="text-xs text-text-muted mb-1">High Estimate</p>
                    <p className="text-xl font-bold text-amber-600">{formatCurrency(estimate.higherEstimate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                  <span>Area: {estimate.builtArea} sqft</span>
                  <span>Floors: {estimate.floors ?? "—"}</span>
                  <span>Quality: {estimate.qualityLevel}</span>
                  {estimate.district && <span>Location: {estimate.district}</span>}
                </div>
              </CardContent>
            </Card>
          )}

          {!estimate && (
            <Card>
              <CardContent className="py-8 text-center">
                <Calculator className="h-10 w-10 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">No cost estimate found for this project.</p>
                <Link href="/engineer/cost-intelligence" className="text-sm text-primary hover:underline mt-1 inline-block">
                  Create an estimate first
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Change Scenarios */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Design Changes</h2>
              </div>
              <p className="text-xs text-text-muted mt-1">Select changes to see combined cost impact</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CHANGE_SCENARIOS.map(scenario => {
                  const isSelected = selectedScenarios.includes(scenario.id);
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => toggleScenario(scenario.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{scenario.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-text-primary">{scenario.label}</h4>
                            {isSelected && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">{scenario.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-semibold text-amber-700">
                              {formatCurrency(scenario.estimatedImpactLow)} – {formatCurrency(scenario.estimatedImpactHigh)}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getConfidenceColor(scenario.confidence)}`}>
                              {scenario.confidence}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-text-muted" />
                            <span className="text-[10px] text-text-muted">+{scenario.timelineImpactDays} days</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Custom Change */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Custom Change</h2>
              </div>
              <p className="text-xs text-text-muted mt-1">Enter a custom cost impact amount</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1 block">Amount (₹)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="e.g., 50000"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1 block">Description</label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={e => setCustomDescription(e.target.value)}
                    placeholder="e.g., Extra electrical work"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Impact Summary */}
        <div className="space-y-6">
          {/* Budget Impact */}
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Budget Impact</h2>
              </div>
            </CardHeader>
            <CardContent>
              {selectedScenarios.length === 0 && !customAmountNum ? (
                <div className="text-center py-6">
                  <Calculator className="h-8 w-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">Select changes to see impact</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Change Impact */}
                  {selectedItems.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-2">SELECTED CHANGES</p>
                      <div className="space-y-2">
                        {selectedItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-surface-alt">
                            <span className="text-xs font-medium text-text-primary">
                              {item.icon} {item.label}
                            </span>
                            <span className="text-xs font-semibold text-amber-700">
                              +{formatCurrency(item.estimatedImpactLow)}–{formatCurrency(item.estimatedImpactHigh)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {customAmountNum > 0 && (
                    <div className="p-2 rounded-md bg-surface-alt">
                      <span className="text-xs font-medium text-text-primary">Custom: {customDescription || "Custom change"}</span>
                      <span className="text-xs font-semibold text-amber-700 ml-2">+{formatCurrency(customAmountNum)}</span>
                    </div>
                  )}

                  {/* Total Impact */}
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 mb-1">TOTAL CHANGE IMPACT</p>
                    <p className="text-lg font-bold text-amber-700">
                      +{formatCurrency(totalImpactLow + customAmountNum)} – {formatCurrency(totalImpactHigh + customAmountNum)}
                    </p>
                    {totalTimelineDays > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Timeline impact: +{totalTimelineDays} days
                      </p>
                    )}
                  </div>

                  {/* Affected Categories */}
                  {allAffectedCategories.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-1">AFFECTED CATEGORIES</p>
                      <div className="flex flex-wrap gap-1">
                        {allAffectedCategories.map(cat => (
                          <span key={cat} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium capitalize">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projected Total */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-2">PROJECTED TOTAL COST</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-text-muted">Low</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(totalLow)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted">Central</p>
                        <p className="text-sm font-bold text-text-primary">{formatCurrency(totalCentral)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted">High</p>
                        <p className="text-sm font-bold text-amber-600">{formatCurrency(totalHigh)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Notice */}
                  <div className="p-2 rounded-md bg-surface-alt">
                    <div className="flex items-start gap-1.5">
                      <Info className="h-3 w-3 text-text-muted mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-text-muted">
                        These are indicative estimates based on typical construction cost ranges.
                        Final amounts require engineer confirmation after detailed assessment.
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  {selectedScenarios.length > 0 && (
                    <Button className="w-full" onClick={() => {
                      // Store selected scenarios for potential change request creation
                      alert(`Change request would be created with ${selectedScenarios.length} scenarios. Total impact: ${formatCurrency(totalImpactLow)} – ${formatCurrency(totalImpactHigh)}`);
                    }}>
                      <Plus className="h-4 w-4 mr-1" /> Create Change Request
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Explanation */}
      <Card className="mt-8">
        <CardContent className="py-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-text-muted">
              <p className="font-medium text-text-primary mb-1">How Design-to-Cost works</p>
              <p>
                Select design changes to see their estimated impact on your project budget.
                Each scenario shows affected construction categories, estimated cost range, and timeline impact.
                These are indicative estimates — actual costs depend on site conditions, material choices, and contractor pricing.
                Always confirm with your engineer before making changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  DollarSign, MapPin, Building2, Ruler, Calculator, TrendingUp,
  Info, Database, CheckCircle, AlertTriangle, Clock, FileText,
  ChevronDown, ChevronUp, Shield,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface EstimateResult {
  lowEstimateInr: number;
  centralEstimateInr: number;
  highEstimateInr: number;
  lowRatePerSqft: number;
  centralRatePerSqft: number;
  highRatePerSqft: number;
  evidenceConfidence: string;
  evidenceConfidenceScore: number;
  evidenceConfidenceExplanation: string;
  evidenceConfidenceDisclaimer: string;
  locationMatch: "DIRECT" | "PROXY" | "UNAVAILABLE";
  locationNote: string;
  planningRangeNote: string;
  sources: Array<{ tier: number; layer: string; source: string; detail: string }>;
  assumptions: string[];
  limitations: string[];
  bcciInfo: { centre: string; value: number | null; date: string };
  indicativeAllocation: {
    material: { pct: number; label: string };
    labour: { pct: number; label: string };
    other: { pct: number; label: string };
    source: string;
    note: string;
  };
  provenance: Record<string, unknown>;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  input: { location: string; areaSqft: number; floors: number; quality: string };
  result: EstimateResult;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatLakhs(amount: number): string {
  return `₹${(amount / 100000).toFixed(1)}L`;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function CostIntelligencePage() {
  // Form state
  const [location, setLocation] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  const [floors, setFloors] = useState("2");
  const [buildingType, setBuildingType] = useState("residential_rcc");
  const [quality, setQuality] = useState("standard");

  // Result state
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Historical simulator
  const [simLocation, setSimLocation] = useState("Coimbatore");
  const [simArea, setSimArea] = useState("1500");
  const [simResult, setSimResult] = useState<Array<{ year: string; bcci: number; change: number; rate: number; total: number }>>([]);

  // ─── ESTIMATE ───────────────────────────────────────────────────────────

  const handleEstimate = async () => {
    if (!location.trim()) { setError("Please enter a location"); return; }
    if (!areaSqft || Number(areaSqft) <= 0) { setError("Please enter a valid area"); return; }
    if (Number(areaSqft) > 50000) { setError("Area exceeds reasonable range (>50,000 sqft)"); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/cost-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.trim(),
          areaSqft: Number(areaSqft),
          floors: Number(floors) || 2,
          buildingType,
          quality,
          referenceDate: "2025-03-31",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Estimation failed");
      setResult(data.result);
      setSaveStatus(null);

      // Add to history
      setHistory(prev => [{
        id: `est_${Date.now()}`,
        timestamp: new Date().toISOString(),
        input: { location: location.trim(), areaSqft: Number(areaSqft), floors: Number(floors), quality },
        result: data.result,
      }, ...prev].slice(0, 20));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── SAVE ESTIMATE TO PROJECT ─────────────────────────────────────────

  const handleSaveToProject = async () => {
    if (!result) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      // Get projects list
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      const projects = Array.isArray(projectsData) ? projectsData : projectsData.projects || [];
      if (projects.length === 0) {
        setSaveStatus("No projects found. Create a project first.");
        setSaving(false);
        return;
      }
      // Save to first project (in production, show a project selector)
      const project = projects[0];
      const trackRes = await fetch(`/api/projects/${project.id}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodologyVersion: "1.0",
          centralEstimate: result.centralEstimateInr,
        }),
      });
      if (trackRes.ok) {
        setSaveStatus(`Estimate saved to project: ${project.name}`);
      } else {
        setSaveStatus("Failed to save estimate");
      }
    } catch {
      setSaveStatus("Failed to save estimate");
    }
    setSaving(false);
  };

  // ─── HISTORICAL SIMULATOR ─────────────────────────────────────────────

  const handleSimulate = () => {
    const historicalBCCI: Record<string, number> = {
      "2022-Q4": 200.10, "2023-Q1": 212.91, "2023-Q2": 218.25,
      "2023-Q3": 202.36, "2024-Q1": 217.22, "2024-Q2": 229.20,
      "2024-Q3": 238.88, "2025-Q4": 248.60,
    };
    const baseRate = 2369.03;
    const baseBCCI = 170.0;
    const area = Number(simArea) || 1500;
    const prevVals = Object.values(historicalBCCI);

    setSimResult(Object.entries(historicalBCCI).map(([period, bcci], i) => {
      const rate = Math.round(baseRate * (bcci / baseBCCI));
      const total = rate * area;
      const change = i === 0 ? 0 : Math.round(((bcci - prevVals[i - 1]) / prevVals[i - 1]) * 1000) / 10;
      return { year: period, bcci, change, rate, total };
    }));
  };

  // ─── RENDER ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calculator className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Construction Cost Intelligence</h1>
            <p className="text-sm text-gray-500">Data-backed benchmark estimation — not an ML prediction</p>
          </div>
        </div>

        {/* Data Source Banner */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-blue-800 bg-blue-50 rounded-lg p-3">
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Engine v1.0</strong> — CPWD Government Benchmarks (2019), TN BCCI Index (2022–2025),
                59 real quotation line items, Kerala DES reference data.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Input Form */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Project Details
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" /> Location / District
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Coimbatore, Chennai, Madurai"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Supported: 16 TN districts with BCCI data
                  </p>
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Ruler className="w-4 h-4 inline mr-1" /> Built-up Area (sqft)
                  </label>
                  <input
                    type="number"
                    value={areaSqft}
                    onChange={e => setAreaSqft(e.target.value)}
                    placeholder="e.g. 1500"
                    min="100"
                    max="50000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Floors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floors</label>
                  <select
                    value={floors}
                    onChange={e => setFloors(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="1">1 Floor</option>
                    <option value="2">2 Floors</option>
                    <option value="3">3 Floors</option>
                    <option value="4">4+ Floors</option>
                  </select>
                </div>

                {/* Building Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building Type</label>
                  <select
                    value={buildingType}
                    onChange={e => setBuildingType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="residential_rcc">RCC Framed Structure</option>
                    <option value="load_bearing">Load-Bearing / Brick</option>
                  </select>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Construction Quality</label>
                  <select
                    value={quality}
                    onChange={e => setQuality(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="economy">Economy</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                  </div>
                )}

                <Button
                  onClick={handleEstimate}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Calculating..." : "Calculate Estimate"}
                </Button>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="font-medium text-gray-600">Important Disclaimer</p>
                  <p>BuildMe provides a preliminary planning estimate based on available government benchmarks,
                    construction-cost indices and market quotation evidence. It is not a final contractor quotation.
                    Actual costs vary with design, specifications, materials, labour, site conditions and market changes.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Results */}
          <div className="lg:col-span-2 space-y-4">
            {result ? (
              <>
                {/* Main Estimate */}
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-500 uppercase tracking-wide">Planning Estimate Range</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {formatLakhs(result.lowEstimateInr)} — {formatLakhs(result.highEstimateInr)}
                      </p>
                      <p className="text-lg text-blue-600 font-semibold mt-1">
                        Central: {formatLakhs(result.centralEstimateInr)}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium">Low</p>
                        <p className="text-sm font-bold">{formatINR(result.lowRatePerSqft)}/sqft</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium">Central</p>
                        <p className="text-sm font-bold">{formatINR(result.centralRatePerSqft)}/sqft</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs text-orange-600 font-medium">High</p>
                        <p className="text-sm font-bold">{formatINR(result.highRatePerSqft)}/sqft</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Evidence Confidence */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        result.evidenceConfidence === "HIGH" ? "bg-green-100" :
                        result.evidenceConfidence === "MEDIUM" ? "bg-yellow-100" : "bg-red-100"
                      }`}>
                        {result.evidenceConfidence === "HIGH" ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Info className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">Evidence Confidence: {result.evidenceConfidence}</p>
                          <span className="text-xs text-gray-400">(score: {result.evidenceConfidenceScore}/100)</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{result.evidenceConfidenceExplanation}</p>
                        <p className="text-xs text-gray-400 mt-1 italic">{result.evidenceConfidenceDisclaimer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Match */}
                {result.locationMatch !== "DIRECT" && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm bg-yellow-50 rounded-lg p-3">
                        <MapPin className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-yellow-800">Location: {result.locationMatch}</span>
                          <p className="text-xs text-yellow-600 mt-0.5">{result.locationNote}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Planning Range Note */}
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-gray-500">
                      <strong>Range methodology:</strong> {result.planningRangeNote}
                    </p>
                  </CardContent>
                </Card>

                {/* BCCI Info */}
                {result.bcciInfo.value !== null && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">BCCI Reference:</span>
                        <span>{result.bcciInfo.centre} — Index {result.bcciInfo.value} ({result.bcciInfo.date})</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Indicative Cost Allocation */}
                {result.indicativeAllocation && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Indicative Cost Allocation
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{result.indicativeAllocation.material.label} ({result.indicativeAllocation.material.pct}%)</span>
                          <span className="font-medium">{formatINR(result.centralRatePerSqft * result.indicativeAllocation.material.pct / 100)}/sqft</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{result.indicativeAllocation.labour.label} ({result.indicativeAllocation.labour.pct}%)</span>
                          <span className="font-medium">{formatINR(result.centralRatePerSqft * result.indicativeAllocation.labour.pct / 100)}/sqft</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{result.indicativeAllocation.other.label} ({result.indicativeAllocation.other.pct}%)</span>
                          <span className="font-medium">{formatINR(result.centralRatePerSqft * result.indicativeAllocation.other.pct / 100)}/sqft</span>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-500">
                        <p><strong>Source:</strong> {result.indicativeAllocation.source}</p>
                        <p className="mt-0.5 italic">{result.indicativeAllocation.note}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* How Calculated */}
                <Card>
                  <CardHeader>
                    <button
                      onClick={() => setShowSources(!showSources)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Database className="w-4 h-4" /> How BuildMe calculated this
                      </h3>
                      {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </CardHeader>
                  {showSources && (
                    <CardContent>
                      <div className="space-y-2">
                        {result.sources.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600 font-mono text-xs mt-0.5">{i + 1}.</span>
                            <div>
                              <span className="font-medium">{s.layer}:</span> {s.source}
                              <p className="text-xs text-gray-500">{s.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Assumptions & Limitations */}
                <Card>
                  <CardHeader>
                    <button
                      onClick={() => setShowAssumptions(!showAssumptions)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Assumptions & Limitations
                      </h3>
                      {showAssumptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </CardHeader>
                  {showAssumptions && (
                    <CardContent>
                      <div className="space-y-1">
                        {result.limitations.map((l, i) => (
                          <p key={i} className="text-xs text-orange-700 bg-orange-50 rounded p-2">• {l}</p>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Save to Project */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Save this estimate to a project for tracking</p>
                        <p className="text-xs text-gray-400">Enables budget tracking and ground-truth collection</p>
                      </div>
                      <Button onClick={handleSaveToProject} disabled={saving} size="sm" variant="secondary">
                        {saving ? "Saving..." : "Save to Project"}
                      </Button>
                    </div>
                    {saveStatus && (
                      <p className={`text-xs mt-2 ${saveStatus.includes("saved") ? "text-green-600" : "text-red-600"}`}>
                        {saveStatus}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Provenance */}
                <Card>
                  <CardHeader>
                    <button
                      onClick={() => setShowProvenance(!showProvenance)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Full Provenance
                      </h3>
                      {showProvenance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </CardHeader>
                  {showProvenance && (
                    <CardContent>
                      <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(result.provenance, null, 2)}
                      </pre>
                    </CardContent>
                  )}
                </Card>
              </>
            ) : (
              /* Empty State */
              <Card>
                <CardContent className="p-12 text-center">
                  <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">Enter project details to estimate</h3>
                  <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                    BuildMe uses government benchmarks (CPWD), construction cost indices (BCCI),
                    and real quotation data to produce a preliminary cost estimate.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600">Data Sources</p>
                      <p className="text-sm font-bold">4 datasets</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600">TN Coverage</p>
                      <p className="text-sm font-bold">16 districts</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600">BCCI Periods</p>
                      <p className="text-sm font-bold">10 quarters</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600">Quotation Items</p>
                      <p className="text-sm font-bold">59 real items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historical Cost Simulator */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Construction Cost Through Time
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={simLocation}
                    onChange={e => setSimLocation(e.target.value)}
                    placeholder="Location"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={simArea}
                    onChange={e => setSimArea(e.target.value)}
                    placeholder="Area (sqft)"
                    className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <Button onClick={handleSimulate} variant="secondary" size="sm">
                    <TrendingUp className="w-4 h-4 mr-1" /> Simulate
                  </Button>
                </div>

                {simResult.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Period</th>
                          <th className="text-right py-2">BCCI</th>
                          <th className="text-right py-2">Change</th>
                          <th className="text-right py-2">Rate/sqft</th>
                          <th className="text-right py-2">Total ({simArea || 1500} sqft)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simResult.map((row, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="py-2 font-medium">{row.year}</td>
                            <td className="text-right py-2">{row.bcci.toFixed(1)}</td>
                            <td className={`text-right py-2 ${row.change > 0 ? "text-red-600" : row.change < 0 ? "text-green-600" : "text-gray-400"}`}>
                              {i === 0 ? "—" : `${row.change > 0 ? "+" : ""}${row.change}%`}
                            </td>
                            <td className="text-right py-2">{formatINR(row.rate)}</td>
                            <td className="text-right py-2 font-medium">{formatLakhs(row.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-400 mt-2">
                      Based on CPWD 2019 benchmark adjusted by TN BCCI index (Coimbatore reference).
                      This is an index-based simulation, not a prediction of actual costs.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Click &ldquo;Simulate&rdquo; to see how construction costs have moved over time
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Estimation History */}
            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Recent Estimates
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium">{h.input.location} — {h.input.areaSqft} sqft</p>
                          <p className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatLakhs(h.result.centralEstimateInr)}</p>
                          <p className="text-xs text-gray-400">Evidence: {h.result.evidenceConfidence}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

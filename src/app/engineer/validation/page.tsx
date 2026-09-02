"use client";

import { useState, useEffect } from "react";
import {
  Target, CheckCircle, AlertTriangle, ArrowRight, TrendingUp,
  Database, Shield, Eye, FileText, BarChart3, ChevronDown, ChevronUp,
  ClipboardCheck, Rocket, XCircle, Clock,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface FunnelData {
  totalProjects: number;
  estimatesGenerated: number;
  projectsTracked: number;
  expenditureRecorded: number;
  projectsCompleted: number;
  finalCostCaptured: number;
  documentSupported: number;
  independentlyVerified: number;
}

interface ProjectDetail {
  id: string;
  name: string;
  location: string | null;
  area: number | null;
  buildingType: string | null;
  quality: string | null;
  trackingStatus: string;
  validationStatus: string;
  methodologyVersion: string | null;
  createdAt: string;
  completionDate: string | null;
  estimate: { low: number; central: number; high: number; ratePerSqft: number; locationMatch: string | null; evidenceConfidence: string | null } | null;
  recordedSpend: number;
  finalCost: number | null;
  evidenceCount: number;
}

interface ValidationMetrics {
  sampleSize: number;
  sufficientForStatistics: boolean;
  meanBias: number;
  medianAbsolutePercentageError: number;
  maxAbsoluteError: number;
  biasDirection: string;
  errors: Array<{ projectId: string; location: string; estimated: number; actual: number; variance: number; variancePct: number }>;
  note: string;
}

interface RangeCoverage {
  insideRange: number;
  total: number;
  percentage: number;
  note: string;
}

interface DataQuality {
  totalProjects: number;
  eligibleForValidation: number;
  notEligible: number;
  missingFinalCost: number;
  missingArea: number;
  missingLocation: number;
  missingEstimate: number;
  incompleteProjects: number;
  exclusionReasons: string[];
}

interface PilotReadiness {
  product: Record<string, boolean>;
  evidence: Record<string, boolean>;
  validation: Record<string, boolean>;
}

interface ValidationData {
  validationStatus: string;
  funnel: FunnelData;
  projectDetails: ProjectDetail[];
  validationMetrics: ValidationMetrics | null;
  rangeCoverage: RangeCoverage | null;
  estimatorBias: { meanBias: number; direction: string; note: string } | null;
  dataQuality: DataQuality;
  pilotReadiness: PilotReadiness;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatLakhs(amount: number): string {
  return `₹${(amount / 100000).toFixed(1)}L`;
}

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const VALIDATION_COLORS: Record<string, string> = {
  unverified: "bg-gray-100 text-gray-600",
  user_reported: "bg-yellow-100 text-yellow-700",
  document_supported: "bg-blue-100 text-blue-700",
  independently_verified: "bg-green-100 text-green-700",
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function ValidationPage() {
  const [data, setData] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"funnel" | "projects" | "analytics" | "quality" | "readiness" | "cedi">("funnel");
  const [showDetail, setShowDetail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/validation")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-400">Loading validation data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-400">Failed to load validation data</p>
      </div>
    );
  }

  const f = data.funnel;
  const tabs = [
    { id: "funnel" as const, label: "Evidence Funnel" },
    { id: "projects" as const, label: "Projects" },
    { id: "analytics" as const, label: "Analytics" },
    { id: "quality" as const, label: "Data Quality" },
    { id: "readiness" as const, label: "Pilot Readiness" },
    { id: "cedi" as const, label: "CEDI View" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <Target className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pilot & Validation Center</h1>
            <p className="text-sm text-gray-500">BuildMe evidence dashboard — real projects, real data, real validation</p>
          </div>
        </div>

        {/* Validation Status Banner */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">BuildMe Validation Status</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.validationStatus.replace(/_/g, " ")}
                </p>
              </div>
              <div className="text-right">
                {f.finalCostCaptured === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                    <p className="text-sm font-medium text-yellow-800">External validation not yet available</p>
                    <p className="text-xs text-yellow-600">No completed projects with final cost data</p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                    <p className="text-sm font-medium text-green-800">{f.finalCostCaptured} completed observation(s)</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === t.id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── FUNNEL TAB ────────────────────────────────────────────────── */}
        {activeTab === "funnel" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Evidence Funnel</h3>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-4">How BuildMe turns real projects into validation evidence</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {[
                    { label: "Real Projects", count: f.totalProjects, color: "bg-blue-50 border-blue-200" },
                    { label: "Estimates Generated", count: f.estimatesGenerated, color: "bg-blue-50 border-blue-200" },
                    { label: "Projects Tracked", count: f.projectsTracked, color: "bg-indigo-50 border-indigo-200" },
                    { label: "Expenditure Recorded", count: f.expenditureRecorded, color: "bg-purple-50 border-purple-200" },
                    { label: "Projects Completed", count: f.projectsCompleted, color: "bg-green-50 border-green-200" },
                    { label: "Final Cost Captured", count: f.finalCostCaptured, color: "bg-green-50 border-green-200" },
                    { label: "Document Supported", count: f.documentSupported, color: "bg-emerald-50 border-emerald-200" },
                    { label: "Independently Verified", count: f.independentlyVerified, color: "bg-green-100 border-green-300" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`border rounded-lg px-4 py-3 text-center min-w-[120px] ${step.color}`}>
                        <p className="text-2xl font-bold text-gray-900">{step.count}</p>
                        <p className="text-[10px] text-gray-500">{step.label}</p>
                      </div>
                      {i < 7 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What we've proven vs not proven */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> What BuildMe Has Proven
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600">
                    {[
                      "Government/public benchmark integration (CPWD PAR 2019)",
                      "Regional construction-cost index adjustment (TN BCCI)",
                      "Transparent estimation methodology with full provenance",
                      "16-centre Tamil Nadu geographic coverage",
                      "Real quotation evidence (59 line items from 9 documents)",
                      "Deterministic, reproducible estimation engine",
                      "Ground-truth tracking infrastructure",
                      "Privacy-aware validation pipeline",
                      "E2E tested: 79/79 tests passing",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> What BuildMe Has Not Yet Proven
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600">
                    {[
                      "External estimator accuracy against real project outcomes",
                      "Cost-overrun prediction capability",
                      "Large-scale project outcome performance",
                      "Statistical validation (requires 3+ completed projects)",
                      "Real pilot participant feedback",
                      "Actual time/cost savings from using BuildMe",
                      "Comparative advantage over existing tools",
                      "ML-based prediction (not yet implemented)",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ─── PROJECTS TAB ──────────────────────────────────────────────── */}
        {activeTab === "projects" && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Tracked Projects</h3>
            </CardHeader>
            <CardContent>
              {data.projectDetails.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No projects yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2 pr-4">Project</th>
                        <th className="py-2 pr-4">Location</th>
                        <th className="py-2 pr-4">Area</th>
                        <th className="py-2 pr-4">Estimate</th>
                        <th className="py-2 pr-4">Recorded</th>
                        <th className="py-2 pr-4">Final Cost</th>
                        <th className="py-2 pr-4">Tracking</th>
                        <th className="py-2 pr-4">Validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projectDetails.map(p => (
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 pr-4 font-medium">{p.name}</td>
                          <td className="py-2 pr-4">{p.location || "—"}</td>
                          <td className="py-2 pr-4">{p.area ? `${p.area}` : "—"} sqft</td>
                          <td className="py-2 pr-4">{p.estimate ? formatLakhs(p.estimate.central) : "—"}</td>
                          <td className="py-2 pr-4">{p.recordedSpend > 0 ? formatLakhs(p.recordedSpend) : "—"}</td>
                          <td className="py-2 pr-4">{p.finalCost ? formatLakhs(p.finalCost) : "—"}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[p.trackingStatus] || ""}`}>
                              {p.trackingStatus}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${VALIDATION_COLORS[p.validationStatus] || ""}`}>
                              {p.validationStatus.replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── ANALYTICS TAB ─────────────────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            {!data.validationMetrics ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">Insufficient Data for Analytics</h3>
                  <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                    No completed projects with final cost data exist yet.
                    Analytics will appear automatically when genuine project outcomes are recorded.
                  </p>
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 max-w-sm mx-auto text-left">
                    <p className="text-xs font-medium text-gray-600">Required for analytics:</p>
                    <ul className="text-xs text-gray-500 mt-1 space-y-1">
                      <li>• 1+ completed projects with final cost</li>
                      <li>• 3+ projects for statistical reliability</li>
                      <li>• All data from real project outcomes</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Sample Size Warning */}
                {!data.validationMetrics.sufficientForStatistics && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm bg-yellow-50 text-yellow-800 rounded-lg p-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>
                          <strong>Sample size: {data.validationMetrics.sampleSize}</strong> —
                          Results are observational, not statistically reliable.
                          Minimum 3 completed projects required for preliminary analysis.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Range Coverage */}
                {data.rangeCoverage && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4" /> Planning Range Coverage
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-600">{data.rangeCoverage.insideRange}</p>
                          <p className="text-xs text-gray-500">Inside range</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-400">{data.rangeCoverage.total}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-600">{data.rangeCoverage.percentage}%</p>
                          <p className="text-xs text-gray-500">Coverage</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">{data.rangeCoverage.note}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Bias */}
                {data.estimatorBias && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Estimator Bias
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Mean Bias</p>
                          <p className={`text-2xl font-bold ${data.estimatorBias.meanBias > 0 ? "text-orange-600" : data.estimatorBias.meanBias < 0 ? "text-blue-600" : "text-green-600"}`}>
                            {data.estimatorBias.meanBias > 0 ? "+" : ""}{data.estimatorBias.meanBias}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Direction</p>
                          <p className="text-sm font-medium">{data.estimatorBias.direction}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{data.estimatorBias.note}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Error Detail */}
                {data.validationMetrics.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-semibold">Project-Level Variance</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-left text-gray-500">
                              <th className="py-2 pr-4">Project</th>
                              <th className="py-2 pr-4">Location</th>
                              <th className="py-2 pr-4 text-right">Estimated</th>
                              <th className="py-2 pr-4 text-right">Actual</th>
                              <th className="py-2 pr-4 text-right">Variance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.validationMetrics.errors.map(e => (
                              <tr key={e.projectId} className="border-b">
                                <td className="py-2 pr-4 font-medium">{e.projectId.slice(0, 12)}...</td>
                                <td className="py-2 pr-4">{e.location || "—"}</td>
                                <td className="py-2 pr-4 text-right">{formatLakhs(e.estimated)}</td>
                                <td className="py-2 pr-4 text-right">{formatLakhs(e.actual)}</td>
                                <td className={`py-2 pr-4 text-right font-medium ${e.variancePct > 0 ? "text-orange-600" : "text-green-600"}`}>
                                  {e.variancePct > 0 ? "+" : ""}{e.variancePct}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{data.validationMetrics.note}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── DATA QUALITY TAB ──────────────────────────────────────────── */}
        {activeTab === "quality" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4" /> Data Quality Overview
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{data.dataQuality.eligibleForValidation}</p>
                    <p className="text-xs text-gray-500">Eligible for validation</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-700">{data.dataQuality.notEligible}</p>
                    <p className="text-xs text-gray-500">Not eligible</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-700">{data.dataQuality.incompleteProjects}</p>
                    <p className="text-xs text-gray-500">Still active (incomplete)</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-700">{data.dataQuality.missingEstimate}</p>
                    <p className="text-xs text-gray-500">Missing estimate</p>
                  </div>
                </div>

                {data.dataQuality.exclusionReasons.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-orange-800 mb-2">Exclusion Reasons:</p>
                    {data.dataQuality.exclusionReasons.map((reason, i) => (
                      <p key={i} className="text-xs text-orange-700">• {reason}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Status Definitions */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Validation Status Definitions</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { status: "unverified", color: "bg-gray-100", label: "Unverified", desc: "Project information exists but has not been independently supported." },
                    { status: "user_reported", color: "bg-yellow-100", label: "User Reported", desc: "Actual cost was reported by the project participant." },
                    { status: "document_supported", color: "bg-blue-100", label: "Document Supported", desc: "Relevant cost information is supported by documentation (invoices, bills)." },
                    { status: "independently_verified", color: "bg-green-100", label: "Independently Verified", desc: "A legitimate independent verification process has confirmed the outcome." },
                  ].map(v => (
                    <div key={v.status} className="flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-medium ${v.color} flex-shrink-0 mt-0.5`}>{v.label}</span>
                      <p className="text-xs text-gray-600">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── PILOT READINESS TAB ───────────────────────────────────────── */}
        {activeTab === "readiness" && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Rocket className="w-4 h-4" /> Pilot Readiness Checklist
              </h3>
            </CardHeader>
            <CardContent>
              {[
                { category: "Product", items: data.pilotReadiness.product, descriptions: {
                  estimateGeneration: "Estimate generation from benchmark + BCCI",
                  estimatePersistence: "Estimates saved to project records",
                  projectTracking: "Project lifecycle tracking (planning/active/completed)",
                  expenseTracking: "Record expenditure against estimates",
                  finalCostCapture: "Capture actual final project cost",
                  export: "JSON/CSV export of ground-truth data",
                }},
                { category: "Evidence", items: data.pilotReadiness.evidence, descriptions: {
                  groundTruthSchema: "Database schema for ground-truth collection",
                  validationStatuses: "4-level validation status system",
                  evidenceTracking: "Document/evidence attachment to projects",
                  methodologyVersioning: "Every estimate linked to methodology version",
                  privacyControls: "PII excluded from analytics and exports",
                }},
                { category: "Validation", items: data.pilotReadiness.validation, descriptions: {
                  completedProjects: "At least one completed project",
                  finalCostObservations: "At least one final cost recorded",
                  documentSupportedOutcomes: "At least one document-supported outcome",
                  independentVerification: "At least one independently verified outcome",
                  estimatorAccuracy: "3+ completed projects for statistical analysis",
                }},
              ].map(section => (
                <div key={section.category} className="mb-6">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">{section.category}</h4>
                  <div className="space-y-2">
                    {Object.entries(section.items).map(([key, done]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {done ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        )}
                        <span className={done ? "text-gray-700" : "text-gray-400"}>
                          {(section.descriptions as unknown as Record<string, string>)[key] || key}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ─── CEDI VIEW TAB ─────────────────────────────────────────────── */}
        {activeTab === "cedi" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4">BuildMe — CEDI Evidence Summary</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-gray-600 mb-4">
                    BuildMe is a construction cost intelligence platform that combines government benchmarks,
                    regional construction-cost indices and market quotation evidence to produce transparent
                    preliminary estimates. The platform includes a ground-truth tracking layer that preserves
                    the original estimate, project expenditure and eventual final cost, enabling progressive
                    real-world validation.
                  </p>

                  <h3 className="text-sm font-semibold text-green-700 mt-6">Current Evidence Base</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {[
                      { label: "Data Sources", value: "4", detail: "CPWD, BCCI, Quotations, Kerala DES" },
                      { label: "TN BCCI Records", value: "160", detail: "16 centres, 10 quarters" },
                      { label: "Quotation Items", value: "59", detail: "From 9 real construction documents" },
                      { label: "Tracked Projects", value: String(f.totalProjects), detail: "Real project records" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                        <p className="text-[10px] text-gray-400">{stat.detail}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-sm font-semibold text-green-700 mt-6">Technology Core</h3>
                  <ul className="text-sm text-gray-600 space-y-1 mt-2">
                    <li>• <strong>Database:</strong> SQLite with Prisma ORM (production-ready schema)</li>
                    <li>• <strong>Estimation Engine:</strong> 8-layer rule-based benchmark system (NOT ML)</li>
                    <li>• <strong>Spatial:</strong> Leaflet + GPS + Haversine geofencing</li>
                    <li>• <strong>AI Pipeline:</strong> Architecture ready, requires API key for activation</li>
                    <li>• <strong>Ground Truth:</strong> Estimate → Track → Expense → Complete → Validate → Export</li>
                    <li>• <strong>Testing:</strong> 79/79 E2E tests passing, deterministic across 3 runs</li>
                  </ul>

                  <h3 className="text-sm font-semibold text-orange-700 mt-6">Honest Limitations</h3>
                  <ul className="text-sm text-gray-600 space-y-1 mt-2">
                    <li>• No completed-project final-cost data yet (0 observations)</li>
                    <li>• No external accuracy validation possible</li>
                    <li>• No real pilot participants yet</li>
                    <li>• BCCI 2019 base value is estimated (not directly observed)</li>
                    <li>• Component breakdown uses standard ratios (not observed project data)</li>
                    <li>• Kerala data used as reference (not Tamil Nadu-specific)</li>
                    <li>• Planning range is geographic dispersion, not statistical prediction interval</li>
                  </ul>

                  <h3 className="text-sm font-semibold text-blue-700 mt-6">Next Steps for Validation</h3>
                  <ol className="text-sm text-gray-600 space-y-1 mt-2 list-decimal pl-4">
                    <li>Onboard 2–3 real civil engineers for pilot projects</li>
                    <li>Record estimates for genuine construction projects</li>
                    <li>Track actual expenditure during construction</li>
                    <li>Capture final cost upon project completion</li>
                    <li>Collect supporting documentation (invoices, bills)</li>
                    <li>Calculate estimator accuracy once 3+ outcomes exist</li>
                    <li>Iterate on methodology based on real-world evidence</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Methodology Version */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Methodology: BuildMe Estimator v1.0</span>
                  <span className="text-gray-400">— All project outcomes linked to this version</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

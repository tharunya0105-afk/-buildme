"use client";

import { useState, useEffect } from "react";
import {
  Target, DollarSign, TrendingUp, CheckCircle, AlertTriangle,
  Database, Download, Clock, Building2, ChevronDown, ChevronUp,
  ArrowRight, FileText, BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Estimate {
  id: string;
  central: number;
  low: number;
  high: number;
  ratePerSqft: number;
  methodologyVersion: string | null;
  locationMatch: string | null;
  evidenceConfidence: string | null;
}

interface Budget {
  totalRecordedSpend: number;
  centralEstimate: number;
  percentConsumed: number;
  varianceFromEstimate: number;
  categoryBreakdown: Record<string, number>;
  totalChangeImpact: number;
  expenseCount: number;
}

interface GroundTruth {
  finalCostInr: number | null;
  completionDate: string | null;
  initialEstimateInr: number;
  absoluteVariance: number | null;
  percentageVariance: number | null;
}

interface ProjectTracking {
  projectId: string;
  projectName: string;
  trackingStatus: string;
  validationStatus: string;
  estimate: Estimate | null;
  area: number | null;
  location: string | null;
  quality: string | null;
  buildingType: string | null;
  budget: Budget;
  groundTruth: GroundTruth | null;
  expenseCount: number;
  changeRequestCount: number;
}

interface Expense {
  id: string;
  type: string;
  category: string | null;
  title: string;
  description: string | null;
  amount: number;
  source: string;
  confidence: string;
  approved: boolean;
  createdAt: string;
}

interface ProjectListItem {
  id: string;
  name: string;
  trackingStatus: string | null;
  builtArea: number | null;
  estimatedCost: number | null;
}

interface ValidationMetrics {
  sampleSize: number;
  mape: number | null;
  medianAbsolutePercentageError: number | null;
  meanError: number | null;
  maxAbsoluteError: number | null;
  bias: string | null;
  note: string;
}

interface ExportAnalytics {
  totalProjects: number;
  trackingStatus: { planning: number; active: number; completed: number; cancelled: number };
  completedWithFinalCost: number;
  userReported: number;
  documentSupported: number;
  independentlyVerified: number;
  totalRecordedSpend: number;
  validationMetrics: ValidationMetrics | null;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatLakhs(amount: number): string {
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return formatINR(amount);
}

const TRACKING_COLORS: Record<string, string> = {
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

const EXPENSE_LABELS: Record<string, string> = {
  material_cost: "Materials",
  labour_cost: "Labour",
  professional_fees: "Professional Fees",
  equipment: "Equipment",
  approvals: "Approvals",
  transportation: "Transportation",
  other: "Other",
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function GroundTruthPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [tracking, setTracking] = useState<ProjectTracking | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<ExportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // New expense form
  const [newExpense, setNewExpense] = useState({
    type: "material_cost", category: "other", title: "", description: "", amount: "",
  });
  const [finalCost, setFinalCost] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── LOAD DATA ────────────────────────────────────────────────────────

  useEffect(() => {
    loadProjects();
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (selectedProject) loadProjectDetail(selectedProject);
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch { /* empty */ }
    setLoading(false);
  };

  const loadProjectDetail = async (projectId: string) => {
    setDetailLoading(true);
    try {
      const [trackRes, expRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/track`),
        fetch(`/api/projects/${projectId}/expenses`),
      ]);
      const trackData = await trackRes.json();
      const expData = await expRes.json();
      setTracking(trackData);
      setExpenses(expData.expenses || []);
    } catch { /* empty */ }
    setDetailLoading(false);
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch("/api/ground-truth/export");
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch { /* empty */ }
  };

  // ─── ACTIONS ──────────────────────────────────────────────────────────

  const handleActivateTracking = async (projectId: string) => {
    setSubmitting(true);
    try {
      await fetch(`/api/projects/${projectId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methodologyVersion: "1.0" }),
      });
      if (selectedProject === projectId) loadProjectDetail(projectId);
      loadAnalytics();
    } catch { /* empty */ }
    setSubmitting(false);
  };

  const handleAddExpense = async () => {
    if (!selectedProject || !newExpense.title.trim() || !newExpense.amount) return;
    setSubmitting(true);
    try {
      await fetch(`/api/projects/${selectedProject}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExpense,
          amount: Number(newExpense.amount),
        }),
      });
      setNewExpense({ type: "material_cost", category: "other", title: "", description: "", amount: "" });
      setShowAddExpense(false);
      loadProjectDetail(selectedProject);
      loadAnalytics();
    } catch { /* empty */ }
    setSubmitting(false);
  };

  const handleCompleteProject = async () => {
    if (!selectedProject || !finalCost) return;
    setSubmitting(true);
    try {
      await fetch(`/api/projects/${selectedProject}/track`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingStatus: "completed",
          finalCostInr: Number(finalCost),
          validationStatus: "user_reported",
        }),
      });
      setFinalCost("");
      setShowCompleteDialog(false);
      loadProjectDetail(selectedProject);
      loadAnalytics();
    } catch { /* empty */ }
    setSubmitting(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedProject || !confirm("Delete this expense record?")) return;
    try {
      await fetch(`/api/projects/${selectedProject}/expenses?expenseId=${expenseId}`, {
        method: "DELETE",
      });
      loadProjectDetail(selectedProject);
      loadAnalytics();
    } catch { /* empty */ }
  };

  const handleExportCSV = () => {
    window.open("/api/ground-truth/export?format=csv", "_blank");
  };

  // ─── RENDER ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Target className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ground Truth & Budget Tracking</h1>
              <p className="text-sm text-gray-500">Track real projects to validate BuildMe estimates</p>
            </div>
          </div>
          <Button onClick={handleExportCSV} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        {/* Status Banner */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-green-800 bg-green-50 rounded-lg p-3">
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Ground Truth Infrastructure</strong> — BuildMe is designed to improve its estimation methodology
                as verified project outcomes become available. Currently {analytics?.completedWithFinalCost || 0} completed
                project(s) with final cost data.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{analytics.totalProjects}</p>
                <p className="text-xs text-gray-500">Total Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics.trackingStatus.active}</p>
                <p className="text-xs text-gray-500">Active Tracking</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{analytics.completedWithFinalCost}</p>
                <p className="text-xs text-gray-500">Completed with Final Cost</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-400">{analytics.independentlyVerified}</p>
                <p className="text-xs text-gray-500">Independently Verified</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Validation Metrics (only shown when sufficient data) */}
        {analytics?.validationMetrics && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Validation Metrics
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Sample Size</p>
                  <p className="text-lg font-bold">{analytics.validationMetrics.sampleSize}</p>
                </div>
                {analytics.validationMetrics.mape != null && (
                  <div>
                    <p className="text-xs text-gray-500">Mean Error</p>
                    <p className="text-lg font-bold">{analytics.validationMetrics.mape}%</p>
                  </div>
                )}
                {analytics.validationMetrics.medianAbsolutePercentageError != null && (
                  <div>
                    <p className="text-xs text-gray-500">Median Absolute Error</p>
                    <p className="text-lg font-bold">{analytics.validationMetrics.medianAbsolutePercentageError}%</p>
                  </div>
                )}
                {analytics.validationMetrics.bias && (
                  <div>
                    <p className="text-xs text-gray-500">Bias</p>
                    <p className="text-lg font-bold capitalize">{analytics.validationMetrics.bias}</p>
                  </div>
                )}
                {analytics.validationMetrics.maxAbsoluteError != null && (
                  <div>
                    <p className="text-xs text-gray-500">Max Error</p>
                    <p className="text-lg font-bold">{analytics.validationMetrics.maxAbsoluteError}%</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">{analytics.validationMetrics.note}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Project List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold">Projects</h2>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No projects yet</p>
                ) : (
                  <div className="space-y-2">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProject(p.id)}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          selectedProject === p.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-gray-400">
                              {p.builtArea ? `${p.builtArea} sqft` : "No area"} • {p.estimatedCost ? formatLakhs(p.estimatedCost) : "No estimate"}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${TRACKING_COLORS[p.trackingStatus || "planning"]}`}>
                            {(p.trackingStatus || "planning").charAt(0).toUpperCase() + (p.trackingStatus || "planning").slice(1)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Estimate → Actual Loop
                </h3>
                <div className="space-y-2 text-xs text-gray-600">
                  {["BuildMe generates estimate", "Track real expenditure", "Complete project", "Record final cost", "Calculate variance", "Validate & improve"].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Project Detail */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedProject ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">Select a project to track</h3>
                  <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                    Track real construction projects to collect ground-truth data.
                    This data will validate and improve BuildMe&apos;s estimation methodology.
                  </p>
                </CardContent>
              </Card>
            ) : detailLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-gray-400">Loading project data...</p>
                </CardContent>
              </Card>
            ) : tracking ? (
              <>
                {/* Project Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold">{tracking.projectName}</h2>
                        <p className="text-sm text-gray-500">
                          {tracking.area ? `${tracking.area} sqft` : ""} • {tracking.location || "Location not set"} • {tracking.quality || "Standard"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${TRACKING_COLORS[tracking.trackingStatus]}`}>
                          {tracking.trackingStatus.charAt(0).toUpperCase() + tracking.trackingStatus.slice(1)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full ${VALIDATION_COLORS[tracking.validationStatus]}`}>
                          {tracking.validationStatus.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </div>
                    </div>

                    {/* Estimate vs Budget */}
                    {tracking.estimate && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-xs text-blue-600 font-medium">BuildMe Estimate</p>
                          <p className="text-lg font-bold text-blue-700">{formatLakhs(tracking.estimate.central)}</p>
                          <p className="text-xs text-gray-400">{formatINR(tracking.estimate.ratePerSqft)}/sqft</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-xs text-green-600 font-medium">Recorded Spend</p>
                          <p className="text-lg font-bold text-green-700">{formatLakhs(tracking.budget.totalRecordedSpend)}</p>
                          <p className="text-xs text-gray-400">{tracking.budget.expenseCount} expenses</p>
                        </div>
                        <div className={`rounded-lg p-4 text-center ${
                          tracking.budget.percentConsumed > 100 ? "bg-red-50" :
                          tracking.budget.percentConsumed > 80 ? "bg-yellow-50" : "bg-gray-50"
                        }`}>
                          <p className="text-xs text-gray-600 font-medium">Budget Consumed</p>
                          <p className={`text-lg font-bold ${
                            tracking.budget.percentConsumed > 100 ? "text-red-700" :
                            tracking.budget.percentConsumed > 80 ? "text-yellow-700" : "text-gray-700"
                          }`}>{tracking.budget.percentConsumed}%</p>
                          <p className="text-xs text-gray-400">of central estimate</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ground Truth (completed projects only) */}
                {tracking.groundTruth && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" /> Ground Truth
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Initial Estimate</p>
                          <p className="font-bold">{formatLakhs(tracking.groundTruth.initialEstimateInr)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Final Cost</p>
                          <p className="font-bold">{tracking.groundTruth.finalCostInr ? formatLakhs(tracking.groundTruth.finalCostInr) : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Variance</p>
                          <p className={`font-bold ${(tracking.groundTruth.percentageVariance || 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                            {tracking.groundTruth.percentageVariance != null
                              ? `${tracking.groundTruth.percentageVariance > 0 ? "+" : ""}${tracking.groundTruth.percentageVariance}%`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="font-bold text-sm">
                            {tracking.groundTruth.completionDate
                              ? new Date(tracking.groundTruth.completionDate).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                {tracking.trackingStatus === "planning" && (
                  <Card>
                    <CardContent className="p-4">
                      <Button onClick={() => handleActivateTracking(selectedProject)} disabled={submitting}>
                        <TrendingUp className="w-4 h-4 mr-1" /> Start Tracking This Project
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Expense Recording */}
                {tracking.trackingStatus === "active" && (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Recorded Expenses
                          </h3>
                          <Button onClick={() => setShowAddExpense(!showAddExpense)} size="sm" variant="secondary">
                            + Add Expense
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {showAddExpense && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={newExpense.type}
                                onChange={e => setNewExpense(p => ({ ...p, type: e.target.value }))}
                                className="border rounded-lg px-3 py-2 text-sm"
                              >
                                {Object.entries(EXPENSE_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newExpense.title}
                                onChange={e => setNewExpense(p => ({ ...p, title: e.target.value }))}
                                placeholder="Description (e.g., Cement purchase)"
                                className="border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="number"
                                value={newExpense.amount}
                                onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                                placeholder="Amount (₹)"
                                className="border rounded-lg px-3 py-2 text-sm"
                              />
                              <input
                                type="text"
                                value={newExpense.description}
                                onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))}
                                placeholder="Notes (optional)"
                                className="border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleAddExpense} disabled={submitting} size="sm">
                                {submitting ? "Saving..." : "Record Expense"}
                              </Button>
                              <Button onClick={() => setShowAddExpense(false)} variant="secondary" size="sm">Cancel</Button>
                            </div>
                          </div>
                        )}

                        {expenses.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">No expenses recorded yet</p>
                        ) : (
                          <div className="space-y-2">
                            {expenses.map(e => (
                              <div key={e.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                                <div>
                                  <p className="text-sm font-medium">{e.title}</p>
                                  <p className="text-xs text-gray-400">
                                    {EXPENSE_LABELS[e.type] || e.type} • {new Date(e.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-sm">{formatINR(e.amount)}</span>
                                  <button
                                    onClick={() => handleDeleteExpense(e.id)}
                                    className="text-xs text-red-400 hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Complete Project */}
                    <Card>
                      <CardContent className="p-4">
                        {!showCompleteDialog ? (
                          <Button onClick={() => setShowCompleteDialog(true)} variant="secondary">
                            <CheckCircle className="w-4 h-4 mr-1" /> Mark Project as Completed
                          </Button>
                        ) : (
                          <div className="bg-green-50 rounded-lg p-4 space-y-3">
                            <p className="text-sm font-medium text-green-800">Record Final Project Cost</p>
                            <p className="text-xs text-green-700">
                              Enter the actual final construction cost. This creates a ground-truth record for validating BuildMe estimates.
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={finalCost}
                                onChange={e => setFinalCost(e.target.value)}
                                placeholder="Final cost (₹)"
                                className="border rounded-lg px-3 py-2 text-sm flex-1"
                              />
                              <Button onClick={handleCompleteProject} disabled={submitting} size="sm">
                                {submitting ? "Saving..." : "Save & Complete"}
                              </Button>
                              <Button onClick={() => setShowCompleteDialog(false)} variant="secondary" size="sm">Cancel</Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Category Breakdown */}
                {Object.keys(tracking.budget.categoryBreakdown).length > 0 && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Expense by Category
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(tracking.budget.categoryBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .map(([cat, amount]) => (
                            <div key={cat} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                              <span className="font-medium">{formatINR(amount)}</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-gray-400">Could not load project data</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-600">Privacy & Data Handling</p>
                <p className="mt-1">
                  Ground-truth records store only project-level financial data and location (district/city level).
                  No personal information, home addresses, phone numbers, or financial account details are stored in analytics or exports.
                  All records are owned by the creating engineer and isolated by project.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

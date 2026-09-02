"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Rocket, CheckCircle, Clock, AlertTriangle, Plus,
  Ruler, MessageSquare, TrendingUp, TrendingDown, FileText,
  User, MapPin, Calendar, Activity, Star, X, Download,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PilotDetail {
  id: string;
  projectId: string;
  participantName: string | null;
  participantRole: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  expectedEndDate: string | null;
  baselineProcess: string | null;
  currentProcess: string | null;
  problemsObserved: string | null;
  outcome: string | null;
  notes: string | null;
  createdAt: string;
  project: { id: string; name: string; city: string | null; currentStage: string | null; progress: number };
  measurements: { id: string; category: string; metricName: string; baselineValue: number | null; currentValue: number | null; unit: string | null; notes: string | null; measurementDate: string; createdAt: string }[];
  feedback: { id: string; category: string; rating: number | null; feedback: string; feature: string | null; severity: string | null; createdAt: string; user: { name: string; role: string } }[];
  _count: { measurements: number; feedback: number };
}

interface Analytics {
  featureUsage: Record<string, number>;
  totalEvents: number;
  pilotStats: { total: number; active: number; completed: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  planned: { label: "Planned", color: "text-text-muted", bg: "bg-surface-alt", icon: Clock },
  active: { label: "Active", color: "text-status-normal", bg: "bg-status-normal-bg", icon: Rocket },
  completed: { label: "Completed", color: "text-primary", bg: "bg-primary/10", icon: CheckCircle },
  paused: { label: "Paused", color: "text-status-attention", bg: "bg-status-attention-bg", icon: AlertTriangle },
};

const CATEGORIES = [
  { value: "inspection_coordination", label: "Inspection Coordination" },
  { value: "issue_tracking", label: "Issue Tracking" },
  { value: "evidence_collection", label: "Evidence Collection" },
  { value: "workforce_verification", label: "Workforce Verification" },
  { value: "homeowner_communication", label: "Homeowner Communication" },
  { value: "overall", label: "Overall" },
];

const UNITS = [
  { value: "hours_per_week", label: "Hours/week" },
  { value: "minutes_per_inspection", label: "Minutes/inspection" },
  { value: "count", label: "Count" },
  { value: "percentage", label: "Percentage" },
  { value: "hours_per_month", label: "Hours/month" },
  { value: "days", label: "Days" },
];

const FEATURE_LABELS: Record<string, string> = {
  inspections: "Inspections", photos: "Photos", issues: "Issues", evidence: "Evidence",
  workforce_checkins: "Workforce Check-ins", cost_estimates: "Cost Estimates",
  homeowner_concerns: "Homeowner Concerns", projects_created: "Projects Created",
};

export default function PilotDetailPage() {
  const params = useParams();
  const pilotId = params.id as string;
  const [pilot, setPilot] = useState<PilotDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "measurements" | "feedback" | "usage" | "export">("overview");

  // Measurement form
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [measForm, setMeasForm] = useState({ category: "inspection_coordination", metricName: "", baselineValue: "", currentValue: "", unit: "hours_per_week", notes: "" });
  const [savingMeas, setSavingMeas] = useState(false);

  // Feedback form
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbForm, setFbForm] = useState({ category: "usability", rating: "3", feedback: "", feature: "", severity: "low" });
  const [savingFb, setSavingFb] = useState(false);

  // Pilot update
  const [updating, setUpdating] = useState(false);
  const [editNotes, setEditNotes] = useState({ baselineProcess: "", currentProcess: "", problemsObserved: "", outcome: "" });

  useEffect(() => {
    if (!pilotId) return;
    Promise.all([
      fetch(`/api/pilots/${pilotId}`).then(r => r.json()),
      fetch("/api/analytics").then(r => r.json()),
    ]).then(([pilotData, analyticsData]) => {
      if (pilotData.pilot) {
        setPilot(pilotData.pilot);
        setEditNotes({
          baselineProcess: pilotData.pilot.baselineProcess || "",
          currentProcess: pilotData.pilot.currentProcess || "",
          problemsObserved: pilotData.pilot.problemsObserved || "",
          outcome: pilotData.pilot.outcome || "",
        });
      }
      setAnalytics(analyticsData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [pilotId]);

  const saveMeasurement = async () => {
    if (!measForm.metricName.trim()) return;
    setSavingMeas(true);
    try {
      const res = await fetch(`/api/pilots/${pilotId}/measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: measForm.category,
          metricName: measForm.metricName.trim(),
          baselineValue: measForm.baselineValue || null,
          currentValue: measForm.currentValue || null,
          unit: measForm.unit,
          notes: measForm.notes || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPilot(prev => prev ? { ...prev, measurements: [data.measurement, ...prev.measurements], _count: { ...prev._count, measurements: prev._count.measurements + 1 } } : prev);
        setShowMeasurement(false);
        setMeasForm({ category: "inspection_coordination", metricName: "", baselineValue: "", currentValue: "", unit: "hours_per_week", notes: "" });
      }
    } catch { /* ignore */ }
    setSavingMeas(false);
  };

  const saveFeedback = async () => {
    if (!fbForm.feedback.trim()) return;
    setSavingFb(true);
    try {
      const res = await fetch(`/api/pilots/${pilotId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: fbForm.category,
          rating: fbForm.rating,
          feedback: fbForm.feedback.trim(),
          feature: fbForm.feature || null,
          severity: fbForm.severity,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPilot(prev => prev ? { ...prev, feedback: [data.feedback, ...prev.feedback], _count: { ...prev._count, feedback: prev._count.feedback + 1 } } : prev);
        setShowFeedback(false);
        setFbForm({ category: "usability", rating: "3", feedback: "", feature: "", severity: "low" });
      }
    } catch { /* ignore */ }
    setSavingFb(false);
  };

  const updatePilot = async (updates: Record<string, string>) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/pilots/${pilotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setPilot(prev => prev ? { ...prev, ...data.pilot } : prev);
      }
    } catch { /* ignore */ }
    setUpdating(false);
  };

  const exportReport = async () => {
    try {
      const res = await fetch(`/api/pilots/${pilotId}/export`);
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pilot-report-${pilotId.slice(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-text-secondary">Loading pilot...</div></div>;
  }

  if (!pilot) {
    return (
      <div className="space-y-6">
        <Link href="/engineer/pilots" className="flex items-center gap-2 text-sm text-primary hover:underline"><ArrowLeft className="h-4 w-4" />Back to Pilots</Link>
        <Card><CardContent className="py-12 text-center"><p className="text-text-secondary">Pilot not found.</p></CardContent></Card>
      </div>
    );
  }

  const config = STATUS_CONFIG[pilot.status] || STATUS_CONFIG.planned;
  const StatusIcon = config.icon;
  const duration = pilot.startDate ? Math.floor(((pilot.endDate ? new Date(pilot.endDate) : new Date()).getTime() - new Date(pilot.startDate).getTime()) / (1000 * 60 * 60 * 24)) : null;

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: FileText },
    { key: "measurements" as const, label: `Measurements (${pilot._count.measurements})`, icon: Ruler },
    { key: "feedback" as const, label: `Feedback (${pilot._count.feedback})`, icon: MessageSquare },
    { key: "usage" as const, label: "Usage", icon: Activity },
    { key: "export" as const, label: "Export", icon: Download },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/engineer/pilots" className="flex items-center gap-2 text-sm text-primary hover:underline mb-3"><ArrowLeft className="h-4 w-4" />Back to Pilots</Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${config.bg} ${config.color}`}><StatusIcon className="h-3 w-3" />{config.label}</span>
              <h2 className="text-xl font-bold text-text-primary">{pilot.project.name}</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              {pilot.participantName && <span className="flex items-center gap-1"><User className="h-3 w-3" />{pilot.participantName}</span>}
              {pilot.project.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{pilot.project.city}</span>}
              {duration !== null && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{duration} days</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {pilot.status === "planned" && <Button size="sm" onClick={() => updatePilot({ status: "active" })} disabled={updating}><Rocket className="h-3 w-3 mr-1" />Start Pilot</Button>}
            {pilot.status === "active" && <Button size="sm" onClick={() => updatePilot({ status: "completed", endDate: new Date().toISOString() })} disabled={updating}><CheckCircle className="h-3 w-3 mr-1" />Complete</Button>}
            {pilot.status === "completed" && <Button size="sm" variant="secondary" onClick={() => updatePilot({ status: "active", endDate: "" })} disabled={updating}>Reopen</Button>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-primary text-white" : "bg-surface-alt text-text-secondary hover:bg-border"}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-text-primary">Pilot Information</h3></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Project</span><span className="text-text-primary">{pilot.project.name}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Participant</span><span className="text-text-primary">{pilot.participantName || "Not specified"}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Role</span><span className="text-text-primary">{pilot.participantRole || "Not specified"}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Start Date</span><span className="text-text-primary">{pilot.startDate ? new Date(pilot.startDate).toLocaleDateString() : "Not set"}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">End Date</span><span className="text-text-primary">{pilot.endDate ? new Date(pilot.endDate).toLocaleDateString() : "Not set"}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Stage</span><span className="text-text-primary">{pilot.project.currentStage || "Unknown"}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Progress</span><span className="text-text-primary">{pilot.project.progress}%</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-text-primary">Process Notes</h3></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Baseline Process (Before BuildMe)</p>
                  <p className="text-sm text-text-secondary">{pilot.baselineProcess || <span className="italic text-text-muted">Not recorded</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Current Process (With BuildMe)</p>
                  <p className="text-sm text-text-secondary">{pilot.currentProcess || <span className="italic text-text-muted">Not recorded</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Problems Observed</p>
                  <p className="text-sm text-text-secondary">{pilot.problemsObserved || <span className="italic text-text-muted">Not recorded</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted mb-1">Outcome</p>
                  <p className="text-sm text-text-secondary">{pilot.outcome || <span className="italic text-text-muted">Not recorded</span>}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => {
                  const newProcess = prompt("Current process with BuildMe:", editNotes.currentProcess);
                  if (newProcess !== null) updatePilot({ currentProcess: newProcess });
                }}>Update Process Notes</Button>
              </CardContent>
            </Card>
          </div>

          {/* Validation Label */}
          <div className="p-3 rounded-md bg-status-attention-bg border border-status-attention-border">
            <p className="text-xs text-status-attention"><span className="font-semibold">PILOT NOTE:</span> Pilot results are based on recorded observations and are not independently verified. Measurements reflect the participant&apos;s reported experience.</p>
          </div>
        </div>
      )}

      {/* Measurements Tab */}
      {activeTab === "measurements" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Before / After Measurements</h3>
            <Button size="sm" onClick={() => setShowMeasurement(true)}><Plus className="h-3 w-3 mr-1" />Add Measurement</Button>
          </div>

          {pilot.measurements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Ruler className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text-secondary">No measurements recorded yet.</p>
                <p className="text-xs text-text-muted mt-1">Record baseline and current values to measure observed change.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pilot.measurements.map(m => {
                const hasBaseline = m.baselineValue !== null;
                const hasCurrent = m.currentValue !== null;
                const improvement = hasBaseline && hasCurrent && m.baselineValue! !== 0
                  ? Math.round(((m.baselineValue! - m.currentValue!) / m.baselineValue!) * 100)
                  : null;
                return (
                  <Card key={m.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{m.metricName}</p>
                          <p className="text-xs text-text-muted">{CATEGORIES.find(c => c.value === m.category)?.label || m.category}</p>
                        </div>
                        <div className="text-right">
                          {improvement !== null ? (
                            <span className={`text-sm font-bold flex items-center gap-1 ${improvement > 0 ? "text-status-normal" : improvement < 0 ? "text-status-review" : "text-text-muted"}`}>
                              {improvement > 0 ? <TrendingDown className="h-4 w-4" /> : improvement < 0 ? <TrendingUp className="h-4 w-4" /> : null}
                              {improvement > 0 ? `${improvement}% less` : improvement < 0 ? `${Math.abs(improvement)}% more` : "No change"}
                            </span>
                          ) : hasBaseline && !hasCurrent ? (
                            <span className="text-xs text-status-attention">Awaiting post-pilot measurement</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="p-2 rounded bg-surface-alt">
                          <p className="text-[10px] text-text-muted">Baseline</p>
                          <p className="text-sm font-medium text-text-primary">{hasBaseline ? `${m.baselineValue} ${m.unit || ""}` : "—"}</p>
                        </div>
                        <div className="p-2 rounded bg-surface-alt">
                          <p className="text-[10px] text-text-muted">Current</p>
                          <p className="text-sm font-medium text-text-primary">{hasCurrent ? `${m.currentValue} ${m.unit || ""}` : "—"}</p>
                        </div>
                      </div>
                      {m.notes && <p className="text-xs text-text-muted mt-1">{m.notes}</p>}
                    </CardContent>
                  </Card>
                );
              })}
              <p className="text-[10px] text-text-muted">All measurements are labeled: Observed pilot measurement — not independently verified.</p>
            </div>
          )}

          {/* Add Measurement Modal */}
          {showMeasurement && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Add Measurement</h3>
                  <button onClick={() => setShowMeasurement(false)} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                    <select value={measForm.category} onChange={e => setMeasForm(prev => ({ ...prev, category: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Metric Name *</label>
                    <input type="text" value={measForm.metricName} onChange={e => setMeasForm(prev => ({ ...prev, metricName: e.target.value }))} placeholder="e.g., Hours per week on inspection coordination" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Baseline Value (Before)</label>
                      <input type="number" step="0.1" value={measForm.baselineValue} onChange={e => setMeasForm(prev => ({ ...prev, baselineValue: e.target.value }))} placeholder="e.g., 8" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Current Value (After)</label>
                      <input type="number" step="0.1" value={measForm.currentValue} onChange={e => setMeasForm(prev => ({ ...prev, currentValue: e.target.value }))} placeholder="e.g., 3" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Unit</label>
                    <select value={measForm.unit} onChange={e => setMeasForm(prev => ({ ...prev, unit: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                      {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
                    <textarea value={measForm.notes} onChange={e => setMeasForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="Context for this measurement" />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button onClick={saveMeasurement} disabled={!measForm.metricName.trim() || savingMeas}>{savingMeas ? "Saving..." : "Save Measurement"}</Button>
                  <Button variant="secondary" onClick={() => setShowMeasurement(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Pilot Feedback</h3>
            <Button size="sm" onClick={() => setShowFeedback(true)}><Plus className="h-3 w-3 mr-1" />Add Feedback</Button>
          </div>

          {pilot.feedback.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text-secondary">No feedback collected yet.</p>
                <p className="text-xs text-text-muted mt-1">Collect structured feedback from pilot participants.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pilot.feedback.map(fb => (
                <Card key={fb.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{fb.category}</span>
                        {fb.rating && (
                          <span className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < fb.rating! ? "text-status-attention fill-status-attention" : "text-text-muted"}`} />
                            ))}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">{new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{fb.feedback}</p>
                    {fb.feature && <p className="text-xs text-text-muted mt-1">Feature: {fb.feature}</p>}
                    <p className="text-[10px] text-text-muted mt-1">Submitted by: {fb.user.name} ({fb.user.role})</p>
                  </CardContent>
                </Card>
              ))}
              <p className="text-[10px] text-text-muted">Feedback is collected from pilot participants and stored as-is.</p>
            </div>
          )}

          {/* Add Feedback Modal */}
          {showFeedback && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Add Feedback</h3>
                  <button onClick={() => setShowFeedback(false)} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                    <select value={fbForm.category} onChange={e => setFbForm(prev => ({ ...prev, category: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                      {["usability", "usefulness", "bug", "missing_feature", "pricing", "trust", "other"].map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Rating (1-5)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button key={r} onClick={() => setFbForm(prev => ({ ...prev, rating: String(r) }))} className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium ${fbForm.rating === String(r) ? "bg-primary text-white border-primary" : "border-border text-text-muted hover:bg-surface-alt"}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Feedback *</label>
                    <textarea value={fbForm.feedback} onChange={e => setFbForm(prev => ({ ...prev, feedback: e.target.value }))} rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="What worked? What was difficult?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Feature (optional)</label>
                    <select value={fbForm.feature} onChange={e => setFbForm(prev => ({ ...prev, feature: e.target.value }))} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                      <option value="">General</option>
                      {["Dashboard", "Sites", "Spatial Intelligence", "Inspections", "Evidence", "Workforce GPS", "Cost Intelligence", "AI Analysis", "Homeowner Portal"].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button onClick={saveFeedback} disabled={!fbForm.feedback.trim() || savingFb}>{savingFb ? "Saving..." : "Save Feedback"}</Button>
                  <Button variant="secondary" onClick={() => setShowFeedback(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-text-primary">Product Usage (All Projects)</h3>
          {analytics && analytics.totalEvents > 0 ? (
            <Card>
              <CardContent className="py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(analytics.featureUsage)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([feature, count]) => (
                      <div key={feature} className="p-3 rounded-lg bg-surface-alt">
                        <p className="text-xs text-text-muted">{FEATURE_LABELS[feature] || feature}</p>
                        <p className="text-lg font-bold text-text-primary">{count}</p>
                      </div>
                    ))}
                </div>
                <p className="text-[10px] text-text-muted mt-3">Based on recorded BuildMe activity · {analytics.totalEvents} total events</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text-secondary">No product activity recorded yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-text-primary">Pilot Report Export</h3>
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-text-secondary mb-4">Export a comprehensive pilot report as JSON. The report includes all measurements, feedback, usage data, and explicit evidence labels.</p>
              <Button onClick={exportReport}><Download className="h-4 w-4 mr-2" />Export Pilot Report</Button>
              <div className="mt-4 p-3 rounded bg-surface-alt">
                <p className="text-xs text-text-muted">The exported report will contain:</p>
                <ul className="text-xs text-text-muted mt-1 space-y-0.5">
                  <li>• Pilot information (project, participant, status, dates)</li>
                  <li>• Features tested</li>
                  <li>• Usage evidence (actual ProductEvent counts)</li>
                  <li>• Before/after measurements</li>
                  <li>• User feedback responses</li>
                  <li>• Outcome notes</li>
                  <li>• Commercial validation status</li>
                  <li>• Limitations disclaimer</li>
                </ul>
              </div>
              <p className="text-[10px] text-text-muted mt-3">Every data point in the report is explicitly labeled as observed, reported, calculated, or not measured.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

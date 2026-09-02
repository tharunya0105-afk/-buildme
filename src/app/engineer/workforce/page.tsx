"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HardHat, Plus, MapPin, CheckCircle, XCircle, AlertTriangle,
  Clock, Users, ChevronDown, ChevronUp, Navigation, Shield,
  Radio, X, Loader2, User, Phone, Briefcase, Info,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { haversineDistance, formatDistance } from "@/lib/spatial/geo-utils";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  workerType: string | null;
  active: boolean;
  projectId: string;
  checkIns: { verificationStatus: string; checkInTime: string }[];
}

interface CheckIn {
  id: string;
  workerId: string;
  workerName: string;
  workerType: string | null;
  latitude: number;
  longitude: number;
  distanceFromSite: number;
  verificationStatus: string;
  checkInTime: string;
}

interface ProjectSummary {
  projectId: string;
  projectName: string;
  city: string | null;
  totalWorkers: number;
  verifiedOnSite: number;
  outsideGeofence: number;
  notCheckedIn: number;
  verificationRate: number;
}

interface ProjectDetailSummary {
  projectId: string;
  projectName: string;
  totalWorkers: number;
  verifiedOnSite: number;
  outsideGeofence: number;
  lowAccuracy: number;
  pending: number;
  notCheckedIn: number;
  verificationRate: number;
  checkIns: CheckIn[];
}

interface ProjectOption {
  id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

// ─── Worker Type Options ────────────────────────────────────────────────────

const WORKER_TYPES = [
  { value: "mason", label: "Mason" },
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "carpenter", label: "Carpenter" },
  { value: "helper", label: "Helper" },
  { value: "other", label: "Other" },
];

// ─── Status Helpers ─────────────────────────────────────────────────────────

function getStatusConfig(status: string) {
  switch (status) {
    case "verified":
      return { label: "Verified", icon: CheckCircle, color: "text-status-normal", bg: "bg-status-normal-bg", border: "border-status-normal" };
    case "outside_geofence":
      return { label: "Outside Geofence", icon: XCircle, color: "text-status-review", bg: "bg-status-review-bg", border: "border-status-review" };
    case "low_accuracy":
      return { label: "Low Accuracy", icon: AlertTriangle, color: "text-status-attention", bg: "bg-status-attention-bg", border: "border-status-attention" };
    default:
      return { label: "Pending", icon: Clock, color: "text-text-muted", bg: "bg-surface-alt", border: "border-border" };
  }
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function WorkforcePage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [summary, setSummary] = useState<ProjectDetailSummary | null>(null);
  const [allSummaries, setAllSummaries] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInWorkerId, setCheckInWorkerId] = useState<string>("");
  const [checkInResult, setCheckInResult] = useState<{
    verification: { status: string; distanceFormatted: string; accuracyFormatted: string };
    location: { distanceMetres: number; geofenceRadius: number };
    anomaly: { message: string } | null;
    worker: { name: string };
  } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Add worker form
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerType, setNewWorkerType] = useState("");
  const [newWorkerPhone, setNewWorkerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded worker state
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);

  // ─── Fetch projects ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(data => {
        if (data.projects) {
          const opts: ProjectOption[] = data.projects.map((p: ProjectOption) => ({
            id: p.id,
            name: p.name,
            city: p.city,
            latitude: p.latitude,
            longitude: p.longitude,
          }));
          setProjects(opts);
          if (opts.length > 0) setSelectedProjectId(opts[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ─── Fetch all summaries ────────────────────────────────────────────────
  const fetchAllSummaries = useCallback(async () => {
    try {
      const res = await fetch("/api/workforce/summary");
      const data = await res.json();
      if (data.summaries) setAllSummaries(data.summaries);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchAllSummaries(); }, [fetchAllSummaries]);

  // ─── Fetch workers + summary for selected project ───────────────────────
  const fetchProjectData = useCallback(async (projectId: string) => {
    if (!projectId) return;
    try {
      const [workersRes, summaryRes] = await Promise.all([
        fetch(`/api/workers?projectId=${projectId}`),
        fetch(`/api/workforce/summary?projectId=${projectId}`),
      ]);
      const workersData = await workersRes.json();
      const summaryData = await summaryRes.json();
      if (workersData.workers) setWorkers(workersData.workers);
      if (summaryData.totalWorkers !== undefined) setSummary(summaryData);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchProjectData(selectedProjectId); }, [selectedProjectId, fetchProjectData]);

  // ─── Add Worker ─────────────────────────────────────────────────────────
  const handleAddWorker = async () => {
    if (!newWorkerName.trim() || !selectedProjectId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          name: newWorkerName.trim(),
          phone: newWorkerPhone.trim() || null,
          workerType: newWorkerType || null,
        }),
      });
      if (res.ok) {
        setNewWorkerName("");
        setNewWorkerType("");
        setNewWorkerPhone("");
        setShowAddWorker(false);
        fetchProjectData(selectedProjectId);
        fetchAllSummaries();
      }
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };

  // ─── GPS Check-In ───────────────────────────────────────────────────────
  const handleCheckIn = async (workerId: string) => {
    setCheckInWorkerId(workerId);
    setShowCheckIn(true);
    setCheckInResult(null);
    setIsCheckingIn(true);

    // Request browser geolocation
    if (!navigator.geolocation) {
      setCheckInResult({
        verification: { status: "error", distanceFormatted: "N/A", accuracyFormatted: "N/A" },
        location: { distanceMetres: 0, geofenceRadius: 100 },
        anomaly: null,
        worker: { name: "Unknown" },
      });
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          const res = await fetch("/api/workforce/checkins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workerId,
              latitude,
              longitude,
              accuracy,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setCheckInResult(data);
          } else {
            setCheckInResult({
              verification: { status: "error", distanceFormatted: data.error || "Failed", accuracyFormatted: "N/A" },
              location: { distanceMetres: 0, geofenceRadius: 100 },
              anomaly: null,
              worker: { name: "Unknown" },
            });
          }
        } catch (e) {
          console.error(e);
          setCheckInResult({
            verification: { status: "error", distanceFormatted: "Network error", accuracyFormatted: "N/A" },
            location: { distanceMetres: 0, geofenceRadius: 100 },
            anomaly: null,
            worker: { name: "Unknown" },
          });
        }
        setIsCheckingIn(false);
      },
      (error) => {
        let msg = "Location access denied";
        if (error.code === 1) msg = "Location permission denied — please allow location access";
        else if (error.code === 2) msg = "Location unavailable";
        else if (error.code === 3) msg = "Location request timed out";
        setCheckInResult({
          verification: { status: "error", distanceFormatted: msg, accuracyFormatted: "N/A" },
          location: { distanceMetres: 0, geofenceRadius: 100 },
          anomaly: null,
          worker: { name: "Unknown" },
        });
        setIsCheckingIn(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ─── Deactivate Worker ──────────────────────────────────────────────────
  const handleDeactivateWorker = async (workerId: string) => {
    try {
      await fetch(`/api/workers/${workerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      fetchProjectData(selectedProjectId);
      fetchAllSummaries();
    } catch (e) { console.error(e); }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading workforce data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <HardHat className="h-6 w-6 text-primary" />
            Workforce Verification
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            GPS-based location verification for construction site attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-status-attention bg-status-attention-bg px-2 py-0.5 rounded">
            DEMO DATA — from database
          </span>
        </div>
      </div>

      {/* Privacy Notice */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">Location Verification Notice</p>
              <p className="text-xs text-text-secondary mt-1">
                BuildMe uses your location only to verify that the check-in occurred near the assigned construction site.
                GPS verification confirms that the worker&apos;s device reported a location within the site geofence.
                It does not independently prove work performed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Site Overview */}
      {allSummaries.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              My Sites — Workforce Overview
            </h3>
            <p className="text-xs text-text-muted mt-1">All counts computed from database records</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSummaries.map(s => (
                <button
                  key={s.projectId}
                  onClick={() => setSelectedProjectId(s.projectId)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    selectedProjectId === s.projectId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-text-primary">{s.projectName}</p>
                    {s.city && <p className="text-xs text-text-muted">{s.city}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{s.verifiedOnSite}/{s.totalWorkers}</p>
                      <p className="text-[10px] text-text-muted">Verified on site</p>
                    </div>
                    {s.totalWorkers > 0 && (
                      <div className="flex-1">
                        <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              s.verificationRate >= 80 ? "bg-status-normal" :
                              s.verificationRate >= 50 ? "bg-status-attention" :
                              "bg-status-review"
                            }`}
                            style={{ width: `${s.verificationRate}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-text-muted mt-1">{s.verificationRate}% verification rate</p>
                      </div>
                    )}
                  </div>
                  {s.outsideGeofence > 0 && (
                    <p className="text-[10px] text-status-review mt-2">
                      ⚠ {s.outsideGeofence} worker{s.outsideGeofence !== 1 ? "s" : ""} outside geofence
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Worker Management */}
      {selectedProjectId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workers List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {selectedProject?.name || "Project"} — Workers
                    </h3>
                    <p className="text-xs text-text-muted mt-1">{workers.length} worker{workers.length !== 1 ? "s" : ""} assigned</p>
                  </div>
                  <Button onClick={() => setShowAddWorker(!showAddWorker)} size="sm">
                    <Plus className="h-4 w-4 mr-1" />Add Worker
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {workers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-text-muted mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">No workers have been assigned to this project.</p>
                    <Button onClick={() => setShowAddWorker(true)} size="sm" className="mt-3">
                      <Plus className="h-4 w-4 mr-1" />Add First Worker
                    </Button>
                  </div>
                ) : (
                  workers.filter(w => w.active).map(worker => {
                    const latestCheckIn = worker.checkIns[0];
                    const status = latestCheckIn?.verificationStatus || "pending";
                    const statusConfig = getStatusConfig(status);

                    return (
                      <div
                        key={worker.id}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-alt/50"
                          onClick={() => setExpandedWorker(expandedWorker === worker.id ? null : worker.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                              <User className={`h-5 w-5 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{worker.name}</p>
                              <p className="text-xs text-text-muted">
                                {worker.workerType ? WORKER_TYPES.find(t => t.value === worker.workerType)?.label || worker.workerType : "Unspecified type"}
                                {worker.phone && ` • ${worker.phone}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                              <statusConfig.icon className="h-3 w-3" />
                              {statusConfig.label}
                            </span>
                            {expandedWorker === worker.id ? (
                              <ChevronUp className="h-4 w-4 text-text-muted" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-text-muted" />
                            )}
                          </div>
                        </div>

                        {expandedWorker === worker.id && (
                          <div className="border-t border-border p-4 bg-surface-alt/30 space-y-3">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleCheckIn(worker.id)}
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <Radio className="h-4 w-4" />Check In (GPS)
                              </Button>
                              <Button
                                onClick={() => handleDeactivateWorker(worker.id)}
                                variant="danger"
                                size="sm"
                              >
                                Deactivate
                              </Button>
                            </div>
                            {latestCheckIn && (
                              <div className="text-xs text-text-muted space-y-1">
                                <p>Last check-in: {new Date(latestCheckIn.checkInTime).toLocaleString()}</p>
                                <p>Status: {getStatusConfig(latestCheckIn.verificationStatus).label}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Today's Check-ins */}
            {summary && summary.checkIns.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Check-ins</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-xs font-medium text-text-muted">Worker</th>
                          <th className="text-left py-2 text-xs font-medium text-text-muted">Type</th>
                          <th className="text-left py-2 text-xs font-medium text-text-muted">Distance</th>
                          <th className="text-left py-2 text-xs font-medium text-text-muted">Status</th>
                          <th className="text-left py-2 text-xs font-medium text-text-muted">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.checkIns.map(ci => {
                          const cfg = getStatusConfig(ci.verificationStatus);
                          return (
                            <tr key={ci.id} className="border-b border-border">
                              <td className="py-2 font-medium text-text-primary">{ci.workerName}</td>
                              <td className="py-2 text-text-secondary">{ci.workerType || "—"}</td>
                              <td className="py-2 text-text-secondary">{ci.distanceFromSite < 1000 ? `${Math.round(ci.distanceFromSite)}m` : `${(ci.distanceFromSite / 1000).toFixed(1)} km`}</td>
                              <td className="py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                                  <cfg.icon className="h-3 w-3" />
                                  {cfg.label}
                                </span>
                              </td>
                              <td className="py-2 text-text-muted text-xs">{new Date(ci.checkInTime).toLocaleTimeString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Today's Workforce Summary */}
            {summary && (
              <Card>
                <CardHeader>
                  <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Workforce</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg bg-surface-alt">
                      <p className="text-2xl font-bold text-text-primary">{summary.totalWorkers}</p>
                      <p className="text-[10px] text-text-muted">Expected</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-status-normal-bg">
                      <p className="text-2xl font-bold text-status-normal">{summary.verifiedOnSite}</p>
                      <p className="text-[10px] text-text-muted">Verified on site</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-status-review-bg">
                      <p className="text-2xl font-bold text-status-review">{summary.outsideGeofence}</p>
                      <p className="text-[10px] text-text-muted">Outside geofence</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-surface-alt">
                      <p className="text-2xl font-bold text-text-primary">{summary.notCheckedIn}</p>
                      <p className="text-[10px] text-text-muted">Not checked in</p>
                    </div>
                  </div>

                  {/* Verification Rate */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-text-muted">Verification Rate</p>
                      <p className={`text-sm font-bold ${
                        summary.verificationRate >= 80 ? "text-status-normal" :
                        summary.verificationRate >= 50 ? "text-status-attention" :
                        "text-status-review"
                      }`}>
                        {summary.verificationRate}%
                      </p>
                    </div>
                    <div className="h-3 bg-surface-alt rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          summary.verificationRate >= 80 ? "bg-status-normal" :
                          summary.verificationRate >= 50 ? "bg-status-attention" :
                          "bg-status-review"
                        }`}
                        style={{ width: `${summary.verificationRate}%` }}
                      />
                    </div>
                  </div>

                  {summary.lowAccuracy > 0 && (
                    <div className="flex items-center gap-2 text-xs text-status-attention">
                      <AlertTriangle className="h-3 w-3" />
                      {summary.lowAccuracy} check-in{summary.lowAccuracy !== 1 ? "s" : ""} with low GPS accuracy
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verification Explainer */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">How Verification Works</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Radio, text: "Worker checks in via browser GPS" },
                  { icon: MapPin, text: "Server calculates distance from construction site" },
                  { icon: Shield, text: "Geofence radius checked (default 100m)" },
                  { icon: CheckCircle, text: "Status determined server-side — not by client" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <step.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-text-secondary">{step.text}</p>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-text-muted">
                    <Info className="h-3 w-3 inline mr-1" />
                    GPS confirms device location — not physical work performed.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-text-primary">Privacy</p>
                    <p className="text-[10px] text-text-muted mt-1">
                      Location is requested only during check-in. No continuous background tracking.
                      Worker personal data is stored only for project management purposes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Add Worker Modal ─────────────────────────────────────────── */}
      {showAddWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Add Worker</h3>
              <button onClick={() => setShowAddWorker(false)} className="text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Worker Name *</label>
                <input
                  type="text"
                  value={newWorkerName}
                  onChange={e => setNewWorkerName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Worker Type</label>
                <select
                  value={newWorkerType}
                  onChange={e => setNewWorkerType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select type...</option>
                  {WORKER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={newWorkerPhone}
                  onChange={e => setNewWorkerPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleAddWorker} disabled={!newWorkerName.trim() || isSubmitting} className="flex-1">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-1" />}
                  Add Worker
                </Button>
                <Button variant="secondary" onClick={() => setShowAddWorker(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Check-In Modal ───────────────────────────────────────────── */}
      {showCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">GPS Check-In</h3>
              <button onClick={() => { setShowCheckIn(false); setCheckInResult(null); }} className="text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isCheckingIn && !checkInResult && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm text-text-secondary">Requesting GPS location...</p>
                <p className="text-xs text-text-muted mt-1">Please allow location access when prompted</p>
              </div>
            )}

            {checkInResult && (
              <div className="space-y-4">
                {/* Status Banner */}
                <div className={`p-4 rounded-lg ${
                  checkInResult.verification.status === "verified" ? "bg-status-normal-bg border border-status-normal" :
                  checkInResult.verification.status === "outside_geofence" ? "bg-status-review-bg border border-status-review" :
                  checkInResult.verification.status === "low_accuracy" ? "bg-status-attention-bg border border-status-attention" :
                  "bg-surface-alt border border-border"
                }`}>
                  <div className="flex items-center gap-2">
                    {checkInResult.verification.status === "verified" ? (
                      <CheckCircle className="h-6 w-6 text-status-normal" />
                    ) : checkInResult.verification.status === "outside_geofence" ? (
                      <XCircle className="h-6 w-6 text-status-review" />
                    ) : checkInResult.verification.status === "low_accuracy" ? (
                      <AlertTriangle className="h-6 w-6 text-status-attention" />
                    ) : (
                      <Info className="h-6 w-6 text-text-muted" />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${
                        checkInResult.verification.status === "verified" ? "text-status-normal" :
                        checkInResult.verification.status === "outside_geofence" ? "text-status-review" :
                        checkInResult.verification.status === "low_accuracy" ? "text-status-attention" :
                        "text-text-muted"
                      }`}>
                        {checkInResult.verification.status === "verified" ? "✓ Location Verified" :
                         checkInResult.verification.status === "outside_geofence" ? "⚠ Outside Site Geofence" :
                         checkInResult.verification.status === "low_accuracy" ? "⚠ Low GPS Accuracy" :
                         checkInResult.verification.status === "error" ? checkInResult.verification.distanceFormatted :
                         "Pending"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">Worker</span><span className="text-text-primary font-medium">{checkInResult.worker?.name}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Site</span><span className="text-text-primary">{selectedProject?.name}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Distance from site</span><span className="text-text-primary">{checkInResult.verification.distanceFormatted}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Allowed radius</span><span className="text-text-primary">{checkInResult.location.geofenceRadius}m</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">GPS accuracy</span><span className="text-text-primary">{checkInResult.verification.accuracyFormatted}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Time</span><span className="text-text-primary">{new Date().toLocaleTimeString()}</span></div>
                </div>

                {/* Anomaly Warning */}
                {checkInResult.anomaly && (
                  <div className="p-3 rounded-lg bg-status-attention-bg border border-status-attention">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-status-attention mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-status-attention">Location Sequence Requires Review</p>
                        <p className="text-[10px] text-text-secondary mt-1">{checkInResult.anomaly.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-3 rounded-lg bg-surface-alt border border-border">
                  <p className="text-[10px] text-text-muted">
                    GPS verification confirms the device reported a location near the construction site.
                    It does not independently prove physical work was performed.
                  </p>
                </div>

                <Button
                  onClick={() => { setShowCheckIn(false); setCheckInResult(null); fetchProjectData(selectedProjectId); fetchAllSummaries(); }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            )}

            {checkInResult && checkInResult.verification.status === "error" && (
              <div className="mt-4">
                <Button variant="secondary" onClick={() => { setCheckInResult(null); handleCheckIn(checkInWorkerId); }} className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

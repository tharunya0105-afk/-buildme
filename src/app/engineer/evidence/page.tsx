"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Shield, AlertTriangle, CheckCircle, Clock, Plus, Eye,
  Camera, MessageSquare, FileText, ChevronDown, ChevronUp,
  ArrowRight, Search, X, Building2, Filter,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface ApiProject {
  id: string;
  name: string;
  city: string | null;
  status: string;
}

interface EvidenceItem {
  id: string;
  type: string;
  description: string | null;
  trustLabel: string;
  createdAt: string;
  uploadedBy: { id: string; name: string; role: string };
  photo: { id: string; fileUrl: string; fileName: string | null } | null;
}

interface TimelineEvent {
  id: string;
  action: string;
  description: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  createdAt: string;
  performedBy: { id: string; name: string; role: string } | null;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reportedBy: { id: string; name: string; role: string };
  evidence: EvidenceItem[];
  timelineEvents: TimelineEvent[];
  _count: { evidence: number };
  project?: { id: string; name: string };
}

const TRUST_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  self_reported: { label: "SELF-REPORTED", color: "text-text-muted", bg: "bg-surface-alt" },
  photo_supported: { label: "PHOTO-SUPPORTED", color: "text-primary", bg: "bg-primary/10" },
  ai_assisted: { label: "AI-ASSISTED", color: "text-status-attention", bg: "bg-status-attention-bg" },
  engineer_reviewed: { label: "ENGINEER-REVIEWED", color: "text-status-normal", bg: "bg-status-normal-bg" },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  low: { color: "text-status-normal", bg: "bg-status-normal-bg", icon: "🟢" },
  medium: { color: "text-status-attention", bg: "bg-status-attention-bg", icon: "🟡" },
  high: { color: "text-status-review", bg: "bg-status-review-bg", icon: "🔴" },
  critical: { color: "text-status-review", bg: "bg-status-review-bg", icon: "🔴" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: "text-status-attention", bg: "bg-status-attention-bg" },
  under_review: { label: "Under Review", color: "text-primary", bg: "bg-primary/10" },
  resolved: { label: "Resolved", color: "text-status-normal", bg: "bg-status-normal-bg" },
  dismissed: { label: "Dismissed", color: "text-text-muted", bg: "bg-surface-alt" },
};

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: "", description: "", category: "other", severity: "medium" });
  const [submitting, setSubmitting] = useState(false);

  // Fetch projects
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

  // Fetch issues when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    fetch(`/api/issues?projectId=${selectedProjectId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setIssues(data);
      })
      .catch(() => {});
  }, [selectedProjectId]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    let result = issues;
    if (statusFilter !== "all") result = result.filter(i => i.status === statusFilter);
    if (severityFilter !== "all") result = result.filter(i => i.severity === severityFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return result;
  }, [issues, statusFilter, severityFilter, searchQuery]);

  // Stats from real data
  const stats = useMemo(() => ({
    open: issues.filter(i => i.status === "open").length,
    underReview: issues.filter(i => i.status === "under_review").length,
    resolved: issues.filter(i => i.status === "resolved").length,
    totalEvidence: issues.reduce((sum, i) => sum + i._count.evidence, 0),
  }), [issues]);

  // Create issue
  const handleCreateIssue = async () => {
    if (!newIssue.title.trim() || !selectedProjectId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId, ...newIssue }),
      });
      if (res.ok) {
        const issue = await res.json();
        setIssues(prev => [issue, ...prev]);
        setShowNewIssue(false);
        setNewIssue({ title: "", description: "", category: "other", severity: "medium" });
      }
    } catch {}
    setSubmitting(false);
  };

  // Update issue status
  const handleUpdateStatus = async (issueId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: updated.status, resolvedAt: updated.resolvedAt } : i));
      }
    } catch {}
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-text-secondary">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Evidence & Collaboration Center</h2>
          <p className="text-sm text-text-secondary">A shared evidence-based record for homeowners, engineers and contractors.</p>
        </div>
        <Button onClick={() => setShowNewIssue(true)} disabled={!selectedProjectId}>
          <Plus className="h-4 w-4 mr-2" />Report an Issue
        </Button>
      </div>

      {/* Trust Rule */}
      <div className="p-3 rounded-md bg-surface-alt border border-border">
        <p className="text-xs text-text-secondary"><strong className="text-text-primary">BuildMe Trust Rule:</strong> BuildMe does not decide who is right. It creates a shared, evidence-based record that helps people resolve disagreements. Every piece of information clearly indicates its source.</p>
      </div>

      {/* Project Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-primary">Project:</label>
        <select
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-text-muted">Open Issues</p>
          <p className="text-2xl font-bold text-status-attention">{stats.open}</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-text-muted">Under Review</p>
          <p className="text-2xl font-bold text-primary">{stats.underReview}</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-text-muted">Resolved</p>
          <p className="text-2xl font-bold text-status-normal">{stats.resolved}</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-text-muted">Evidence Items</p>
          <p className="text-2xl font-bold text-text-primary">{stats.totalEvidence}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input type="text" placeholder="Search issues..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="all">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium text-text-primary mb-1">No disputes or issues have been recorded yet.</p>
            <p className="text-xs text-text-muted mb-4">Report an issue to start tracking construction concerns.</p>
            <Button onClick={() => setShowNewIssue(true)} disabled={!selectedProjectId}>
              <Plus className="h-4 w-4 mr-2" />Report an Issue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map(issue => {
            const sev = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.medium;
            const sts = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
            const isExpanded = expandedIssue === issue.id;

            return (
              <Card key={issue.id} className="overflow-hidden">
                {/* Issue Header */}
                <button onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                  className="w-full text-left p-4 hover:bg-surface-alt transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{sev.icon}</span>
                        <h3 className="text-sm font-semibold text-text-primary">{issue.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${sts.bg} ${sts.color}`}>{sts.label}</span>
                        <span className={`px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>{issue.severity.toUpperCase()}</span>
                        <span>{issue.category}</span>
                        <span>by {issue.reportedBy.name}</span>
                        <span>{formatDate(issue.createdAt)}</span>
                        {issue._count.evidence > 0 && <span>{issue._count.evidence} evidence</span>}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-text-muted" /> : <ChevronDown className="h-5 w-5 text-text-muted" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* Description */}
                    {issue.description && (
                      <div className="p-3 rounded-lg bg-surface-alt">
                        <p className="text-xs font-medium text-text-muted mb-1">Description</p>
                        <p className="text-sm text-text-secondary">{issue.description}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {issue.status === "open" && (
                        <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(issue.id, "under_review")}>
                          Mark Under Review
                        </Button>
                      )}
                      {issue.status === "under_review" && (
                        <Button size="sm" onClick={() => handleUpdateStatus(issue.id, "resolved")}>
                          <CheckCircle className="h-3 w-3 mr-1" />Resolve
                        </Button>
                      )}
                      {issue.status !== "dismissed" && issue.status !== "resolved" && (
                        <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(issue.id, "dismissed")}>
                          Dismiss
                        </Button>
                      )}
                    </div>

                    {/* Evidence */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Evidence ({issue.evidence.length})</h4>
                      {issue.evidence.length === 0 ? (
                        <p className="text-xs text-text-muted">No evidence attached yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {issue.evidence.map(ev => {
                            const tl = TRUST_LABELS[ev.trustLabel] || TRUST_LABELS.self_reported;
                            return (
                              <div key={ev.id} className="flex items-start gap-3 p-3 rounded border border-border">
                                {ev.type === "photo" && ev.photo ? (
                                  <Camera className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                ) : ev.type === "comment" ? (
                                  <MessageSquare className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
                                ) : (
                                  <FileText className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tl.bg} ${tl.color}`}>{tl.label}</span>
                                    <span className="text-xs text-text-muted">{ev.uploadedBy.name} ({ev.uploadedBy.role})</span>
                                    <span className="text-[10px] text-text-muted">{formatDate(ev.createdAt)} {formatTime(ev.createdAt)}</span>
                                  </div>
                                  {ev.description && <p className="text-xs text-text-secondary">{ev.description}</p>}
                                  {ev.photo && <p className="text-[10px] text-text-muted mt-1">📎 {ev.photo.fileName || "Photo"}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Timeline</h4>
                      <div className="space-y-2">
                        {issue.timelineEvents.map(te => (
                          <div key={te.id} className="flex items-start gap-3 text-xs">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-text-secondary">
                                <span className="font-medium text-text-primary">{te.description || te.action}</span>
                                {te.performedBy && <span className="text-text-muted"> — {te.performedBy.name}</span>}
                              </p>
                              <p className="text-text-muted">{formatDate(te.createdAt)} {formatTime(te.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Issue Modal */}
      {showNewIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewIssue(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Report an Issue</h3>
              <button onClick={() => setShowNewIssue(false)} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title *</label>
                <input type="text" value={newIssue.title} onChange={e => setNewIssue(p => ({ ...p, title: e.target.value }))}
                  placeholder="Brief description of the issue" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea value={newIssue.description} onChange={e => setNewIssue(p => ({ ...p, description: e.target.value }))}
                  placeholder="Detailed description" rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                  <select value={newIssue.category} onChange={e => setNewIssue(p => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="structural">Structural</option>
                    <option value="water">Water/Dampness</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="material">Material Quality</option>
                    <option value="workmanship">Workmanship</option>
                    <option value="delay">Delay</option>
                    <option value="cost">Cost</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Severity</label>
                  <select value={newIssue.severity} onChange={e => setNewIssue(p => ({ ...p, severity: e.target.value }))}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowNewIssue(false)}>Cancel</Button>
                <Button onClick={handleCreateIssue} disabled={!newIssue.title.trim() || submitting}>
                  {submitting ? "Creating..." : "Report Issue"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

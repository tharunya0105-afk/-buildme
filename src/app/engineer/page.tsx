"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  MapPin, AlertTriangle, CheckCircle, ClipboardCheck, Plus, ArrowRight,
  Camera, Clock, Sparkles, Home, Search, Bell, Building2, Eye,
  Shield, Map, Brain, Activity, FileText, ChevronRight, X, Calendar,
  User, DollarSign, Zap, BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CONSTRUCTION_STAGES } from "@/lib/types";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface ApiProject {
  id: string;
  name: string;
  address: string;
  city: string | null;
  district: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  constructionType: string | null;
  builtArea: number | null;
  currentStage: string | null;
  status: string;
  progress: number;
  homeownerName: string | null;
  estimatedCost: number | null;
  createdAt: string;
  updatedAt: string;
  lastInspectionDate: string | null;
  attentionScore: {
    score: number;
    level: string;
    reasons: { factor: string; weight: number; description: string; severity: string }[];
  } | null;
  _count: { inspections: number; photos: number; alerts: number };
  alerts: { id: string; severity: string; title: string }[];
  timelineEvents: { id: string; type: string; title: string; description: string | null; createdAt: string }[];
  inspections: { inspectionDate: string }[];
  engineer?: { id: string; name: string; email: string };
  homeowner?: { id: string; name: string; email: string };
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color, href }: { label: string; value: number | string; icon: React.ElementType; color: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-overline text-text-muted mb-1">{label}</p>
              <p className="text-financial-lg font-bold text-text-primary group-hover:text-accent transition-colors">{value}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color} group-hover:scale-105 transition-transform`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}function ProjectCard({ project }: { project: ApiProject }) {
  const stageLabel = CONSTRUCTION_STAGES.find(s => s.value === project.currentStage)?.label || project.currentStage || "Unknown";
  const lastInspection = project.lastInspectionDate
    ? new Date(project.lastInspectionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : project.inspections?.[0]?.inspectionDate
      ? new Date(project.inspections[0].inspectionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Never";

  return (
    <Link href={`/engineer/sites/${project.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer h-full group">
        <CardContent className="py-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-subtitle font-semibold text-text-primary group-hover:text-accent transition-colors">{project.name}</h3>
            <StatusBadge status={project.status} size="sm" />
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-micro text-text-muted"><MapPin className="h-3 w-3" />{project.city || "Location not set"}</div>
            <div className="flex items-center justify-between"><span className="text-micro text-text-muted">Stage</span><span className="text-caption font-medium text-text-primary">{stageLabel}</span></div>
            <div className="flex items-center justify-between"><span className="text-micro text-text-muted">Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-surface-alt rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} /></div>
                <span className="text-caption font-semibold text-text-primary">{project.progress}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between"><span className="text-micro text-text-muted">Last Inspection</span><span className="text-caption text-text-primary">{lastInspection}</span></div>
            <div className="flex items-center justify-between"><span className="text-micro text-text-muted">Open Issues</span>
              <span className={project._count.alerts > 0 ? "text-danger font-semibold" : "text-success"}>{project._count.alerts}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AttentionItem({ project, reason, level, actionLabel, href }: { project: string; reason: string; level: "high" | "medium" | "low"; actionLabel: string; href: string }) {
  const colors = { high: "border-l-4 border-danger bg-danger-bg", medium: "border-l-4 border-warning bg-warning-bg", low: "border-l-4 border-success bg-success-bg" };
  const icons = { high: "🔴", medium: "🟡", low: "🟢" };
  return (
    <Link href={href}>
      <div className={`p-4 rounded-r-lg cursor-pointer hover:shadow-sm transition-all duration-200 ${colors[level]} group`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span>{icons[level]}</span>
              <h4 className="text-caption font-semibold text-text-primary group-hover:text-accent transition-colors">{project}</h4>
            </div>
            <p className="text-micro text-text-secondary">{reason}</p>
          </div>
          <span className="text-micro font-medium text-accent whitespace-nowrap ml-4 opacity-0 group-hover:opacity-100 transition-opacity">{actionLabel} →</span>
        </div>
      </div>
    </Link>
  );
}

const STAGE_ORDER = ["planning", "foundation", "structure", "brickwork", "roofing", "electrical_plumbing", "finishing", "completed"];

function ProgressBar({ currentStage }: { currentStage: string }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {STAGE_ORDER.map((stage, i) => {
          const label = CONSTRUCTION_STAGES.find(s => s.value === stage)?.label?.slice(0, 3) || stage.slice(0, 3);
          const isComplete = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={stage} className="flex-1 text-center">
              <div className={`h-2 rounded-full mb-1 ${isComplete ? "bg-primary" : "bg-surface-alt"} ${isCurrent ? "ring-2 ring-primary ring-offset-1" : ""}`} />
              <span className={`text-[9px] ${isCurrent ? "text-primary font-semibold" : isComplete ? "text-text-secondary" : "text-text-muted"}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────────

export default function EngineerDashboard() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: session } = useSession();
  const engineerName = (session?.user as any)?.name || "Engineer";

  // Fetch projects from database via dashboard API (includes attention scores)
  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(data => {
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      })
      .catch(err => console.error("Failed to fetch dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const total = projects.length;
    const normal = projects.filter(p => p.status === "normal").length;
    const attention = projects.filter(p => p.status === "attention").length;
    const review = projects.filter(p => p.status === "review").length;
    const totalAlerts = projects.reduce((sum, p) => sum + p._count.alerts, 0);
    const totalInspections = projects.reduce((sum, p) => sum + p._count.inspections, 0);
    return { total, normal, attention, review, totalAlerts, totalInspections };
  }, [projects]);

  // Get projects needing attention (using real attention scores)
  const attentionProjects = useMemo(() =>
    projects
      .filter(p => p.attentionScore && (p.attentionScore.level === "high" || p.attentionScore.level === "medium" || p.status === "review" || p.status === "attention"))
      .sort((a, b) => {
        const aScore = a.attentionScore?.score ?? 0;
        const bScore = b.attentionScore?.score ?? 0;
        return bScore - aScore;
      })
      .slice(0, 3),
    [projects]
  );

  // Action queue state
  const [actionQueue, setActionQueue] = useState<{ id: string; type: string; severity: string; title: string; description: string; projectId: string; href: string }[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/actions")
      .then(r => r.json())
      .then(data => {
        if (data.actions && Array.isArray(data.actions)) {
          setActionQueue(data.actions.slice(0, 8));
        }
      })
      .catch(() => {});
  }, []);

  // Get latest project for progress display
  const latestProject = projects[0];

  // Date
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-hero font-bold text-text-primary tracking-tight">
            {greeting}, {engineerName}
          </h1>
          <p className="text-body text-text-secondary mt-1">
            Here&apos;s what needs your attention across your active sites.
          </p>
          <p className="text-micro text-text-muted mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/engineer/sites/new">
            <Button variant="accent"><Plus className="h-4 w-4 mr-2" />New Project</Button>
          </Link>
        </div>
      </div>

      {/* Today's Action Queue */}
      {actionQueue.length > 0 && (
        <div>
          <h2 className="text-title font-semibold text-text-primary mb-2">Today&apos;s Action Queue</h2>
          <p className="text-micro text-text-muted mb-3">Generated from real project data</p>
          <div className="space-y-2">
            {actionQueue.map(action => {
              const severityConfig = {
                critical: "border-l-4 border-status-review bg-status-review-bg",
                warning: "border-l-4 border-status-attention bg-status-attention-bg",
                info: "border-l-4 border-primary bg-primary/5",
              };
              const severityIcon = {
                critical: "🔴",
                warning: "🟡",
                info: "🟢",
              };
              return (
                <Link key={action.id} href={action.href}>
                  <div className={`p-3 rounded-r-lg cursor-pointer hover:shadow-sm transition-shadow ${severityConfig[action.severity as keyof typeof severityConfig] || severityConfig.info}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="text-sm mt-0.5">{severityIcon[action.severity as keyof typeof severityIcon] || "🟢"}</span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{action.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{action.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-text-muted mt-1 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-alt border border-border-subtle">
        <span className="text-overline text-text-muted">DEMO</span>
        <p className="text-micro text-text-muted">Seeded project data demonstrates system capabilities. No real customer data.</p>
      </div>

      {/* Summary Cards — operational metrics from real data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Active Projects" value={stats.total} icon={Building2} color="bg-primary/10 text-primary" href="/engineer/sites" />
        <SummaryCard label="Need Attention" value={stats.attention + stats.review} icon={AlertTriangle} color="bg-status-attention-bg text-status-attention" href="/engineer/command-center" />
        <SummaryCard label="Overdue Inspections" value={actionQueue.filter(a => a.type === "inspection").length} icon={Clock} color="bg-status-review-bg text-status-review" href="/engineer/command-center" />
        <SummaryCard label="Evidence Gaps" value={actionQueue.filter(a => a.type === "evidence").length} icon={Camera} color="bg-status-attention-bg text-status-attention" href="/engineer/command-center" />
      </div>

      {/* Needs Attention */}
      {attentionProjects.length > 0 && (
        <div>
          <h2 className="text-title font-semibold text-text-primary mb-2">Needs Your Attention</h2>
          <p className="text-micro text-text-muted mb-3">Priority items requiring action</p>
          <div className="space-y-3">
            {attentionProjects.map(p => {
              const score = p.attentionScore?.score ?? 0;
              const level = p.attentionScore?.level ?? "low";
              const reasons = p.attentionScore?.reasons ?? [];
              const reasonText = reasons.length > 0
                ? reasons.map(r => r.description).join(" · ")
                : p.status === "review" ? "Requires review" : "Needs attention";
              return (
                <AttentionItem
                  key={p.id}
                  project={p.name}
                  reason={`${reasonText} (Score: ${score}/100)`}
                  level={level === "high" ? "high" : level === "medium" ? "medium" : "low"}
                  actionLabel="Review Project"
                  href={`/engineer/sites/${p.id}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-title font-semibold text-text-primary">My Projects</h2>
          <Link href="/engineer/sites" className="text-caption font-medium text-accent hover:underline flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary mb-1">No construction sites yet</p>
              <p className="text-xs text-text-muted mb-3">Add your first site to start monitoring your projects.</p>
              <Link href="/engineer/sites/new"><Button><Plus className="h-4 w-4 mr-2" />Add Construction Site</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>

      {/* Project Progress (first project) */}
      {latestProject && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Project Progress</h3>
            <p className="text-sm text-text-muted">{latestProject.name} — Current Stage: {CONSTRUCTION_STAGES.find(s => s.value === latestProject.currentStage)?.label || "Unknown"}</p>
          </CardHeader>
          <CardContent>
            <ProgressBar currentStage={latestProject.currentStage || "planning"} />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-text-muted">Overall Progress</span>
              <span className="text-lg font-bold text-primary">{latestProject.progress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Map Overview */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Project Map</h3>
          </CardHeader>
          <CardContent>
            {projects.filter(p => p.latitude && p.longitude).length > 0 ? (
              <>
                <div className="space-y-2 mb-4">
                  {projects.filter(p => p.latitude && p.longitude).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded border border-border">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${p.status === "review" ? "bg-status-review" : p.status === "attention" ? "bg-status-attention" : "bg-status-normal"}`} />
                        <span className="text-xs font-medium text-text-primary">{p.name}</span>
                      </div>
                      <span className="text-xs text-text-muted">{p.city}</span>
                    </div>
                  ))}
                </div>
                <Link href="/engineer/spatial" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  Open Spatial Intelligence <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            ) : (
              <p className="text-sm text-text-muted">No projects with location data. Add site coordinates to see them on the map.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Inspections */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 5).map(p => {
                  const lastInspection = p.inspections?.[0];
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{p.name}</p>
                        <p className="text-xs text-text-muted">{p.city} · {p.currentStage || "Unknown stage"}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={p.status} size="sm" />
                        <p className="text-[10px] text-text-muted mt-1">
                          {lastInspection ? `Inspected ${new Date(lastInspection.inspectionDate).toLocaleDateString()}` : "No inspections yet"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-4">No activity yet. Add a project to get started.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/engineer/sites/new"><Button variant="secondary" className="w-full justify-start"><Plus className="h-4 w-4 mr-2" />New Project</Button></Link>
            <Link href="/engineer/inspections"><Button variant="secondary" className="w-full justify-start"><ClipboardCheck className="h-4 w-4 mr-2" />Inspections</Button></Link>
            <Link href="/engineer/spatial"><Button variant="secondary" className="w-full justify-start"><MapPin className="h-4 w-4 mr-2" />View Map</Button></Link>
            <Link href="/engineer/ai-intelligence"><Button variant="secondary" className="w-full justify-start"><Sparkles className="h-4 w-4 mr-2" />AI Intelligence</Button></Link>
          </div>
        </CardContent>
      </Card>

      {/* Product Positioning */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-subtitle font-bold text-text-primary">Construction Intelligence</h3>
              <p className="text-caption text-text-secondary mt-1">BuildMe converts project data into risk signals, prioritized actions, and evidence — so you know exactly what needs attention.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <Brain className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-micro font-medium text-text-secondary">Risk Engine</p>
                <p className="text-[9px] text-text-muted">rule-based</p>
              </div>
              <div className="text-center">
                <MapPin className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-micro font-medium text-text-secondary">Spatial</p>
                <p className="text-[9px] text-text-muted">GPS + proximity</p>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-micro font-medium text-text-secondary">Evidence</p>
                <p className="text-[9px] text-text-muted">audit trail</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

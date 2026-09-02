"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  User,
  ClipboardCheck,
  Clock,
  FileText,
  Ruler,
  Building,
  Camera,
  Crosshair,
  Brain,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { PhotoComparison } from "@/components/photos/PhotoComparison";
import { AiAnalysisHistory } from "@/components/ai/AiAnalysisHistory";
import {
  CONSTRUCTION_TYPES,
  CONSTRUCTION_STAGES,
} from "@/lib/types";
import type { OverallAssessment } from "@/lib/ai/types";

interface InspectionPhoto {
  id: string;
  fileUrl: string;
  fileName: string | null;
}

interface Inspection {
  id: string;
  inspectionDate: string;
  stage: string | null;
  notes: string | null;
  createdAt: string;
  photos: InspectionPhoto[];
  _count: {
    photos: number;
  };
}

interface AiAnalysisItem {
  id: string;
  overallAssessment: string;
  confidence: number;
  summary: string | null;
  createdAt: string;
  previousInspection: {
    id: string;
    inspectionDate: string;
    stage: string | null;
  };
  currentInspection: {
    id: string;
    inspectionDate: string;
    stage: string | null;
  };
}

interface ProjectDetail {
  id: string;
  name: string;
  address: string;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string | null;
  constructionType: string | null;
  builtArea: number | null;
  currentStage: string | null;
  status: string;
  progress: number;
  homeownerName: string | null;
  homeownerId: string | null;
  expectedCompletion: string | null;
  estimatedCost: number | null;
  engineerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  engineer: { id: string; name: string; email: string };
  homeowner: { id: string; name: string; email: string } | null;
  photos: Array<{
    id: string;
    fileUrl: string;
    fileName: string | null;
    timestamp: string;
  }>;
  alerts: Array<{
    id: string;
    severity: string;
    title: string;
    description: string | null;
    resolved: boolean;
    createdAt: string;
  }>;
  timelineEvents: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
  _count: {
    inspections: number;
    photos: number;
    alerts: number;
  };
}

export default function SiteDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [aiAnalyses, setAiAnalyses] = useState<AiAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      fetch(`/api/projects/${params.id}`),
      fetch(`/api/inspections?projectId=${params.id}&limit=50`),
      fetch(`/api/ai/analysis?projectId=${params.id}`),
    ])
      .then(async ([projectRes, inspectionsRes, analysesRes]) => {
        if (!projectRes.ok) throw new Error("Failed to load project");
        const projectData = await projectRes.json();
        setProject(projectData);

        if (inspectionsRes.ok) {
          const inspectionsData = await inspectionsRes.json();
          setInspections(inspectionsData);
        }

        if (analysesRes.ok) {
          const analysesData = await analysesRes.json();
          setAiAnalyses(analysesData);
        }
      })
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageLabel = (stage: string | null) => {
    if (!stage) return "—";
    return CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage;
  };

  const getTypeLabel = (type: string | null) => {
    if (!type) return "—";
    return CONSTRUCTION_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "milestone":
        return <Building className="h-4 w-4" />;
      case "inspection":
        return <ClipboardCheck className="h-4 w-4" />;
      case "alert":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const lastInspection = inspections.length > 0 ? inspections[0] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading site details...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-20">
        <p className="text-danger mb-4">{error || "Site not found"}</p>
        <Link href="/engineer/sites">
          <Button variant="secondary">Back to Sites</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/engineer/sites"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-text-primary">
                {project.name}
              </h2>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <MapPin className="h-4 w-4" />
              <span>
                {project.address}
                {project.city ? `, ${project.city}` : ""}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/engineer/sites/${project.id}/intelligence`}>
              <Button variant="secondary">
                <Brain className="h-4 w-4 mr-2" />
                Intelligence
              </Button>
            </Link>
            <Link href={`/engineer/sites/${project.id}/inspect`}>
              <Button>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                New Inspection
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress overview */}
      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-text-muted mb-1">Current Stage</p>
              <p className="text-lg font-semibold text-text-primary">
                {getStageLabel(project.currentStage)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Progress</p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-text-primary">
                  {project.progress}%
                </p>
                <div className="flex-1 h-2 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Last Updated</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(project.updatedAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Created</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(project.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last inspection */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">
            Last Inspection
          </h3>
        </CardHeader>
        <CardContent>
          {lastInspection ? (
            <Link
              href={`/engineer/inspections/${lastInspection.id}`}
              className="block p-4 rounded-lg border border-border hover:bg-surface-alt transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {formatShortDate(lastInspection.inspectionDate)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {getStageLabel(lastInspection.stage)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    {lastInspection._count.photos} photo
                    {lastInspection._count.photos !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {lastInspection.notes && (
                <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                  {lastInspection.notes}
                </p>
              )}
              {/* Photo thumbnails */}
              {lastInspection.photos.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {lastInspection.photos.slice(0, 4).map((photo) => (
                    <div
                      key={photo.id}
                      className="h-12 w-12 rounded-md overflow-hidden border border-border bg-surface-alt"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.fileUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {lastInspection.photos.length > 4 && (
                    <div className="h-12 w-12 rounded-md bg-surface-alt border border-border flex items-center justify-center text-xs text-text-muted">
                      +{lastInspection.photos.length - 4}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ) : (
            <div className="text-center py-6">
              <Camera className="h-8 w-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm font-medium text-text-primary mb-1">
                No inspections yet
              </p>
              <p className="text-xs text-text-muted mb-4">
                Start your first inspection to begin building the site&apos;s
                visual history.
              </p>
              <Link href={`/engineer/sites/${project.id}/inspect`}>
                <Button size="sm">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  New Inspection
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">
                Overview
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-alt">
                    <Building className="h-5 w-5 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Type</p>
                    <p className="text-sm font-medium text-text-primary">
                      {getTypeLabel(project.constructionType)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-alt">
                    <Ruler className="h-5 w-5 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Built-up Area</p>
                    <p className="text-sm font-medium text-text-primary">
                      {project.builtArea
                        ? `${project.builtArea.toLocaleString()} sq ft`
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-alt">
                    <Calendar className="h-5 w-5 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">
                      Expected Completion
                    </p>
                    <p className="text-sm font-medium text-text-primary">
                      {project.expectedCompletion
                        ? formatDate(project.expectedCompletion)
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-alt">
                    <DollarSign className="h-5 w-5 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">
                      Estimated Cost
                    </p>
                    <p className="text-sm font-medium text-text-primary">
                      {project.estimatedCost
                        ? formatCurrency(project.estimatedCost)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {project.engineerNotes && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-text-primary mb-2">
                    Engineer Notes
                  </p>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {project.engineerNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location / Map */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">
                Location
              </h3>
            </CardHeader>
            <CardContent>
              {project.latitude && project.longitude ? (
                <div className="space-y-3">
                  <div className="h-64 rounded-lg overflow-hidden border border-border">
                    <SiteMap
                      latitude={project.latitude}
                      longitude={project.longitude}
                      status={
                        project.status as "normal" | "attention" | "review"
                      }
                    />
                  </div>
                  <p className="text-sm text-text-secondary">
                    {project.formattedAddress || project.address}
                  </p>
                </div>
              ) : (
                <EmptyState
                  icon={<MapPin className="h-8 w-8 text-text-muted" />}
                  title="No location set"
                  description="Edit this site to add a geographic location."
                />
              )}
            </CardContent>
          </Card>

          {/* Visual History / Comparison */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">
                Visual History
              </h3>
              <p className="text-sm text-text-muted">
                Compare photos from different inspections
              </p>
            </CardHeader>
            <CardContent>
              <PhotoComparison inspections={inspections} projectId={project.id} />
            </CardContent>
          </Card>

          {/* AI Analysis History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  AI Analysis History
                </h3>
                <span className="text-sm text-text-muted">
                  {aiAnalyses.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <AiAnalysisHistory analyses={aiAnalyses} />
            </CardContent>
          </Card>

          {/* Inspections list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  Inspection History
                </h3>
                <span className="text-sm text-text-muted">
                  {inspections.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {inspections.length === 0 ? (
                <EmptyState
                  icon={
                    <ClipboardCheck className="h-8 w-8 text-text-muted" />
                  }
                  title="No inspections yet"
                  description="Record your first site inspection to start documenting progress."
                  action={
                    <Link href={`/engineer/sites/${project.id}/inspect`}>
                      <Button>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        New Inspection
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {inspections.map((inspection) => (
                    <Link
                      key={inspection.id}
                      href={`/engineer/inspections/${inspection.id}`}
                      className="block p-4 rounded-lg border border-border hover:bg-surface-alt transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt">
                            <ClipboardCheck className="h-4 w-4 text-text-muted" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {formatShortDate(inspection.inspectionDate)}
                            </p>
                            <p className="text-xs text-text-muted">
                              {getStageLabel(inspection.stage)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-text-muted" />
                          <span className="text-sm text-text-secondary">
                            {inspection._count.photos} photo
                            {inspection._count.photos !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {inspection.notes && (
                        <p className="text-sm text-text-secondary line-clamp-2 ml-11">
                          {inspection.notes}
                        </p>
                      )}

                      {/* Photo thumbnails */}
                      {inspection.photos.length > 0 && (
                        <div className="flex gap-2 mt-3 ml-11">
                          {inspection.photos.slice(0, 4).map((photo) => (
                            <div
                              key={photo.id}
                              className="h-10 w-10 rounded-md overflow-hidden border border-border bg-surface-alt"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.fileUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {inspection.photos.length > 4 && (
                            <div className="h-10 w-10 rounded-md bg-surface-alt border border-border flex items-center justify-center text-xs text-text-muted">
                              +{inspection.photos.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">
                Timeline
              </h3>
            </CardHeader>
            <CardContent>
              {project.timelineEvents.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-8 w-8 text-text-muted" />}
                  title="No timeline events"
                  description="Project events will appear here as the project progresses."
                />
              ) : (
                <div className="space-y-4">
                  {project.timelineEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 pb-4 border-b border-border last:border-0"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt flex-shrink-0 mt-0.5">
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-medium text-text-primary">
                            {event.title}
                          </h4>
                          <span className="text-xs text-text-muted whitespace-nowrap">
                            {formatShortDate(event.createdAt)}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-text-secondary mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Homeowner info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">
                Homeowner
              </h3>
            </CardHeader>
            <CardContent>
              {project.homeownerName ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {project.homeownerName}
                      </p>
                      {project.homeowner?.email && (
                        <p className="text-xs text-text-muted">
                          {project.homeowner.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  No homeowner assigned
                </p>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  Alerts
                </h3>
                <span className="text-sm text-text-muted">
                  {project.alerts.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {project.alerts.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-8 w-8 text-text-muted" />}
                  title="No alerts"
                  description="Alerts will appear here when issues are detected."
                />
              ) : (
                <div className="space-y-3">
                  {project.alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-md border ${
                        alert.severity === "critical"
                          ? "border-status-review-border bg-status-review-bg"
                          : alert.severity === "warning"
                          ? "border-status-attention-border bg-status-attention-bg"
                          : "border-border bg-surface-alt"
                      }`}
                    >
                      <p className="text-sm font-medium text-text-primary">
                        {alert.title}
                      </p>
                      {alert.description && (
                        <p className="text-xs text-text-secondary mt-1">
                          {alert.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">
                Quick Stats
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Total Inspections
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {inspections.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Total Photos
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {project._count.photos}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Active Alerts
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {project.alerts.filter((a) => !a.resolved).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  AI Analyses
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {aiAnalyses.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Site Intelligence */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  Site Intelligence
                </h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Location
                </p>
                <div className="space-y-1.5 text-sm">
                  {project.latitude && project.longitude && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Coordinates</span>
                      <span className="text-text-primary font-mono text-xs">
                        {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Address</span>
                    <span className="text-text-primary text-right text-xs max-w-[180px] truncate">
                      {project.address}
                    </span>
                  </div>
                  {project.city && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">City</span>
                      <span className="text-text-primary">{project.city}</span>
                    </div>
                  )}
                  {project.district && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">District</span>
                      <span className="text-text-primary">{project.district}</span>
                    </div>
                  )}
                  {project.state && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">State</span>
                      <span className="text-text-primary">{project.state}</span>
                    </div>
                  )}
                  {project.pincode && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Pincode</span>
                      <span className="text-text-primary">{project.pincode}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Project */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Project
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Stage</span>
                    <span className="text-text-primary">{getStageLabel(project.currentStage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Start Date</span>
                    <span className="text-text-primary">{formatShortDate(project.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Expected Completion</span>
                    <span className="text-text-primary">
                      {project.expectedCompletion ? formatShortDate(project.expectedCompletion) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Last Inspection</span>
                    <span className="text-text-primary">
                      {lastInspection ? formatShortDate(lastInspection.inspectionDate) : "Never"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Site Health */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Site Health
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Open Issues</span>
                    <span className={`${project.alerts.filter((a) => !a.resolved).length > 0 ? "text-status-review font-medium" : "text-text-primary"}`}>
                      {project.alerts.filter((a) => !a.resolved).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Inspection Status</span>
                    <span className="text-text-primary">
                      {lastInspection ? "Recorded" : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">AI Flags</span>
                    <span className="text-text-primary">
                      {aiAnalyses.filter((a) => a.overallAssessment === "review_recommended").length > 0
                        ? `${aiAnalyses.filter((a) => a.overallAssessment === "review_recommended").length} review(s)`
                        : "None"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/engineer/spatial"
                  className="text-xs font-medium text-primary hover:text-primary-dark"
                >
                  View on Spatial Map →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Dynamic map import
import dynamic from "next/dynamic";

const LeafletMap = dynamic(
  () =>
    import("@/components/maps/LeafletMap").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-text-muted">
        Loading map...
      </div>
    ),
  }
);

function SiteMap({
  latitude,
  longitude,
  status,
}: {
  latitude: number;
  longitude: number;
  status: "normal" | "attention" | "review";
}) {
  return (
    <LeafletMap
      latitude={latitude}
      longitude={longitude}
      onMapClick={() => {}}
      markerColor={status}
    />
  );
}

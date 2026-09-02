"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Eye,
  HelpCircle,
  ThumbsDown,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CONSTRUCTION_STAGES } from "@/lib/types";
import {
  ASSESSMENT_LABELS,
  type OverallAssessment,
  type AiChange,
} from "@/lib/ai/types";

interface AiAnalysisDetail {
  id: string;
  projectId: string;
  overallAssessment: string;
  confidence: number;
  constructionStageObserved: string | null;
  summary: string | null;
  structuredResult: {
    overall_assessment: string;
    confidence: number;
    construction_stage_observed: string | null;
    changes: AiChange[];
    unchanged_observations: string[];
    uncertain_observations: string[];
    engineer_review_recommended: boolean;
    summary: string;
  } | null;
  model: string | null;
  provider: string | null;
  createdAt: string;
  project: { id: string; name: string; status: string };
  previousInspection: {
    id: string;
    inspectionDate: string;
    stage: string | null;
    photos: Array<{ id: string; fileUrl: string; fileName: string | null }>;
  };
  currentInspection: {
    id: string;
    inspectionDate: string;
    stage: string | null;
    photos: Array<{ id: string; fileUrl: string; fileName: string | null }>;
  };
  engineer: { id: string; name: string };
}

export default function AiAnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AiAnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/ai/analysis/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analysis");
        return res.json();
      })
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
      })
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

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStageLabel = (stage: string | null) => {
    if (!stage) return "—";
    return CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage;
  };

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case "progress_detected":
        return "text-status-normal";
      case "limited_visible_change":
        return "text-status-attention";
      case "no_clear_change":
        return "text-text-secondary";
      case "insufficient_evidence":
        return "text-text-muted";
      case "review_recommended":
        return "text-status-review";
      default:
        return "text-text-secondary";
    }
  };

  const getAssessmentBg = (assessment: string) => {
    switch (assessment) {
      case "progress_detected":
        return "bg-status-normal-bg border-status-normal-border";
      case "limited_visible_change":
        return "bg-status-attention-bg border-status-attention-border";
      case "no_clear_change":
        return "bg-surface-alt border-border";
      case "insufficient_evidence":
        return "bg-surface-alt border-border";
      case "review_recommended":
        return "bg-status-review-bg border-status-review-border";
      default:
        return "bg-surface-alt border-border";
    }
  };

  const getAssessmentIcon = (assessment: string) => {
    switch (assessment) {
      case "progress_detected":
        return <CheckCircle className="h-5 w-5" />;
      case "limited_visible_change":
        return <Eye className="h-5 w-5" />;
      case "no_clear_change":
        return <Eye className="h-5 w-5" />;
      case "insufficient_evidence":
        return <HelpCircle className="h-5 w-5" />;
      case "review_recommended":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Eye className="h-5 w-5" />;
    }
  };

  const handleAction = async (action: string, note?: string) => {
    setActionLoading(true);
    setActionMessage("");

    try {
      const response = await fetch(`/api/ai/analysis/${params.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });

      if (response.ok) {
        setActionMessage(
          action === "dismiss"
            ? "Review recommendation dismissed."
            : "Analysis marked as reviewed."
        );
      } else {
        setActionMessage("Action failed. Please try again.");
      }
    } catch {
      setActionMessage("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading analysis...</div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="text-center py-20">
        <p className="text-danger mb-4">{error || "Analysis not found"}</p>
        <Link href={`/engineer/sites`}>
          <Button variant="secondary">Back to Sites</Button>
        </Link>
      </div>
    );
  }

  const result = analysis.structuredResult;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/engineer/sites/${analysis.projectId}`}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Site
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">
            AI Progress Analysis
          </h2>
        </div>

        <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(analysis.createdAt)}</span>
          </div>
          <span className="text-text-muted">•</span>
          <span>{analysis.project.name}</span>
          {analysis.model && (
            <>
              <span className="text-text-muted">•</span>
              <span className="text-xs bg-surface-alt px-2 py-0.5 rounded">
                {analysis.provider}/{analysis.model}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-md bg-surface-alt border border-border p-3">
        <p className="text-xs text-text-muted">
          AI-assisted observation — final engineering decisions remain with the
          qualified engineer.
        </p>
      </div>

      {/* Overall Assessment */}
      <Card>
        <CardContent className="py-6">
          <div className={`rounded-lg border p-6 ${getAssessmentBg(analysis.overallAssessment)}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={getAssessmentColor(analysis.overallAssessment)}>
                {getAssessmentIcon(analysis.overallAssessment)}
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${getAssessmentColor(analysis.overallAssessment)}`}>
                  {ASSESSMENT_LABELS[analysis.overallAssessment as OverallAssessment] || analysis.overallAssessment}
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-text-secondary">
                    AI confidence: {Math.round(analysis.confidence * 100)}%
                  </span>
                  {result?.construction_stage_observed && (
                    <span className="text-sm text-text-secondary">
                      Stage observed: {getStageLabel(result.construction_stage_observed)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {result?.summary && (
              <p className="text-sm text-text-secondary mt-3">{result.summary}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Engineer Review */}
      {result?.engineer_review_recommended && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-status-review" />
              <div className="flex-1">
                <p className="text-sm font-medium text-status-review">
                  Engineer review recommended
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  The AI identified an observation that may require your attention.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAction("reviewed")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <ThumbsUp className="h-3 w-3 mr-1" />
                )}
                Mark as Reviewed
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAction("dismiss")}
                disabled={actionLoading}
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            </div>

            {actionMessage && (
              <p className="text-xs text-status-normal mt-2">{actionMessage}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Changes */}
      {result?.changes && result.changes.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              What Changed
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.changes.map((change, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-surface-alt"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-text-primary capitalize">
                      {change.category}
                    </h4>
                    <span className="text-xs text-text-muted">
                      {Math.round(change.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{change.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unchanged observations */}
      {result?.unchanged_observations && result.unchanged_observations.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              What Appears Unchanged
            </h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.unchanged_observations.map((obs, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-text-muted mt-0.5">•</span>
                  {obs}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Uncertain observations */}
      {result?.uncertain_observations && result.uncertain_observations.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Uncertain Observations
            </h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.uncertain_observations.map((obs, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                  <HelpCircle className="h-4 w-4 text-text-muted mt-0.5 flex-shrink-0" />
                  {obs}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Side-by-side evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Previous inspection */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-text-primary">
              Previous Inspection
            </h3>
            <p className="text-xs text-text-muted">
              {formatDate(analysis.previousInspection.inspectionDate)} · {getStageLabel(analysis.previousInspection.stage)}
            </p>
          </CardHeader>
          <CardContent>
            {analysis.previousInspection.photos.length === 0 ? (
              <div className="aspect-video bg-surface-alt rounded-lg flex items-center justify-center text-text-muted text-sm">
                No photos
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {analysis.previousInspection.photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() =>
                      setLightboxPhoto({
                        url: photo.fileUrl,
                        label: `Previous — ${formatDate(analysis.previousInspection.inspectionDate)}`,
                      })
                    }
                    className="aspect-square rounded-lg overflow-hidden border border-border bg-surface-alt hover:ring-2 hover:ring-primary transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.fileUrl}
                      alt={photo.fileName || "Photo"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted mt-2">
              {analysis.previousInspection.photos.length} photo
              {analysis.previousInspection.photos.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Current inspection */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-text-primary">
              Current Inspection
            </h3>
            <p className="text-xs text-text-muted">
              {formatDate(analysis.currentInspection.inspectionDate)} · {getStageLabel(analysis.currentInspection.stage)}
            </p>
          </CardHeader>
          <CardContent>
            {analysis.currentInspection.photos.length === 0 ? (
              <div className="aspect-video bg-surface-alt rounded-lg flex items-center justify-center text-text-muted text-sm">
                No photos
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {analysis.currentInspection.photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() =>
                      setLightboxPhoto({
                        url: photo.fileUrl,
                        label: `Current — ${formatDate(analysis.currentInspection.inspectionDate)}`,
                      })
                    }
                    className="aspect-square rounded-lg overflow-hidden border border-border bg-surface-alt hover:ring-2 hover:ring-primary transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.fileUrl}
                      alt={photo.fileName || "Photo"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted mt-2">
              {analysis.currentInspection.photos.length} photo
              {analysis.currentInspection.photos.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300"
            >
              Close ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.label}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white text-sm text-center mt-2">
              {lightboxPhoto.label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

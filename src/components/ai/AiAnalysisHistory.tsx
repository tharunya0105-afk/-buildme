"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle, AlertTriangle, Eye, HelpCircle } from "lucide-react";
import type { OverallAssessment } from "@/lib/ai/types";
import { ASSESSMENT_LABELS } from "@/lib/ai/types";

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

interface AiAnalysisHistoryProps {
  analyses: AiAnalysisItem[];
}

function getAssessmentColor(assessment: string) {
  switch (assessment) {
    case "progress_detected":
      return "text-status-normal";
    case "limited_visible_change":
      return "text-status-attention";
    case "review_recommended":
      return "text-status-review";
    default:
      return "text-text-secondary";
  }
}

function getAssessmentBg(assessment: string) {
  switch (assessment) {
    case "progress_detected":
      return "bg-status-normal-bg";
    case "limited_visible_change":
      return "bg-status-attention-bg";
    case "review_recommended":
      return "bg-status-review-bg";
    default:
      return "bg-surface-alt";
  }
}

function getAssessmentIcon(assessment: string) {
  switch (assessment) {
    case "progress_detected":
      return <CheckCircle className="h-4 w-4" />;
    case "limited_visible_change":
      return <Eye className="h-4 w-4" />;
    case "insufficient_evidence":
      return <HelpCircle className="h-4 w-4" />;
    case "review_recommended":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
}

export function AiAnalysisHistory({ analyses }: AiAnalysisHistoryProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (analyses.length === 0) {
    return (
      <div className="text-center py-6">
        <Sparkles className="h-8 w-8 text-text-muted mx-auto mb-2" />
        <p className="text-sm font-medium text-text-primary mb-1">
          No AI analyses yet
        </p>
        <p className="text-xs text-text-muted">
          Select two inspections in the Visual History section to run an AI analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => (
        <Link
          key={analysis.id}
          href={`/engineer/ai-analysis/${analysis.id}`}
          className="block p-4 rounded-lg border border-border hover:bg-surface-alt transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${getAssessmentBg(analysis.overallAssessment)} ${getAssessmentColor(analysis.overallAssessment)}`}>
                {getAssessmentIcon(analysis.overallAssessment)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-text-primary truncate">
                    {ASSESSMENT_LABELS[analysis.overallAssessment as OverallAssessment] || analysis.overallAssessment}
                  </h4>
                  <span className="text-xs text-text-muted">
                    {Math.round(analysis.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  {formatDate(analysis.previousInspection.inspectionDate)} → {formatDate(analysis.currentInspection.inspectionDate)}
                </p>
                {analysis.summary && (
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                    {analysis.summary}
                  </p>
                )}
                <p className="text-xs text-text-muted mt-1">
                  {formatDate(analysis.createdAt)}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted flex-shrink-0 mt-1" />
          </div>
        </Link>
      ))}
    </div>
  );
}

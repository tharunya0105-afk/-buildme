"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Photo {
  id: string;
  fileUrl: string;
  fileName: string | null;
  createdAt?: string;
}

interface Inspection {
  id: string;
  inspectionDate: string;
  stage: string | null;
  photos: Photo[];
}

interface PhotoComparisonProps {
  inspections: Inspection[];
  projectId: string;
}

export function PhotoComparison({ inspections, projectId }: PhotoComparisonProps) {
  const router = useRouter();
  const [previousIndex, setPreviousIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, inspections.length - 1)
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  if (inspections.length < 2) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p>Need at least 2 inspections to compare photos.</p>
        <p className="text-xs mt-1">
          Complete more inspections to enable visual comparison.
        </p>
      </div>
    );
  }

  const previousInspection = inspections[previousIndex];
  const currentInspection = inspections[currentIndex];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAnalyze = async () => {
    if (previousIndex === currentIndex) {
      setAnalysisError("Please select two different inspections to compare.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError("");

    try {
      const response = await fetch("/api/ai/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousInspectionId: previousInspection.id,
          currentInspectionId: currentInspection.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "NO_AI_CONFIGURED") {
          setAnalysisError(
            "AI analysis is not configured. Please set the AI_API_KEY environment variable to enable this feature."
          );
        } else {
          setAnalysisError(data.error || "Analysis could not be completed. Please try again.");
        }
        return;
      }

      // Navigate to the analysis results page
      router.push(`/engineer/ai-analysis/${data.id}`);
    } catch {
      setAnalysisError("Network error. Please check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze = previousIndex !== currentIndex && !analyzing;

  return (
    <div className="space-y-4">
      {/* Inspection selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Previous Inspection
          </label>
          <div className="relative">
            <select
              value={previousIndex}
              onChange={(e) => setPreviousIndex(parseInt(e.target.value))}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {inspections.map((insp, index) => (
                <option key={insp.id} value={index}>
                  {formatDate(insp.inspectionDate)} - {insp.stage || "Unknown"} ({insp.photos.length} photos)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Current Inspection
          </label>
          <select
            value={currentIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {inspections.map((insp, index) => (
              <option key={insp.id} value={index}>
                {formatDate(insp.inspectionDate)} - {insp.stage || "Unknown"} ({insp.photos.length} photos)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analyze with AI button */}
      <div className="flex items-center gap-3 py-2">
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          variant={canAnalyze ? "primary" : "secondary"}
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Progress with AI
            </>
          )}
        </Button>

        {previousIndex === currentIndex && (
          <p className="text-xs text-text-muted">
            Select two different inspections to enable analysis
          </p>
        )}
      </div>

      {/* Analysis error */}
      {analysisError && (
        <div className="rounded-md bg-status-review-bg border border-status-review-border p-3">
          <p className="text-sm text-status-review">{analysisError}</p>
        </div>
      )}

      {/* Side by side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Previous */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">
              {formatDate(previousInspection.inspectionDate)}
            </span>
            <span className="text-xs text-text-muted">
              ({previousInspection.stage})
            </span>
          </div>

          {previousInspection.photos.length === 0 ? (
            <div className="aspect-video bg-surface-alt rounded-lg flex items-center justify-center text-text-muted text-sm">
              No photos
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {previousInspection.photos.slice(0, 4).map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden border border-border bg-surface-alt"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.fileUrl}
                    alt={photo.fileName || "Photo"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-text-muted mt-2">
            {previousInspection.photos.length} photo
            {previousInspection.photos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Current */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {formatDate(currentInspection.inspectionDate)}
            </span>
            <span className="text-xs text-text-muted">
              ({currentInspection.stage})
            </span>
          </div>

          {currentInspection.photos.length === 0 ? (
            <div className="aspect-video bg-surface-alt rounded-lg flex items-center justify-center text-text-muted text-sm">
              No photos
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {currentInspection.photos.slice(0, 4).map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden border border-border bg-surface-alt"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.fileUrl}
                    alt={photo.fileName || "Photo"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-text-muted mt-2">
            {currentInspection.photos.length} photo
            {currentInspection.photos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

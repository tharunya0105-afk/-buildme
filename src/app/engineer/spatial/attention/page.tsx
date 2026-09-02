"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Crosshair,
  AlertTriangle,
  Clock,
  Camera,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { CONSTRUCTION_STAGES } from "@/lib/types";
import { ATTENTION_LEVEL_LABELS, ATTENTION_LEVEL_COLORS, ATTENTION_LEVEL_BG } from "@/lib/spatial/types";
import type { SpatialProject, AttentionLevel } from "@/lib/spatial/types";

export default function AttentionCenterPage() {
  const [projects, setProjects] = useState<SpatialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<AttentionLevel | "all">("all");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spatial/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = levelFilter === "all"
    ? projects
    : projects.filter((p) => p.attentionScore.level === levelFilter);

  const highCount = projects.filter((p) => p.attentionScore.level === "high").length;
  const mediumCount = projects.filter((p) => p.attentionScore.level === "medium").length;
  const lowCount = projects.filter((p) => p.attentionScore.level === "low").length;

  const getStageLabel = (stage: string | null) => {
    if (!stage) return "—";
    return CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage;
  };

  const getAttentionIcon = (level: AttentionLevel) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-status-review" />;
      case "medium":
        return <Clock className="h-5 w-5 text-status-attention" />;
      case "low":
        return <CheckCircle className="h-5 w-5 text-status-normal" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading attention data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-text-primary">
              Attention Center
            </h2>
          </div>
          <p className="text-sm text-text-secondary">
            Projects ranked by attention score — understand what needs your focus
          </p>
        </div>
        <Link href="/engineer/spatial">
          <Button variant="secondary">View Map</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setLevelFilter(levelFilter === "high" ? "all" : "high")}
          className={`text-left p-4 rounded-lg border transition-colors ${
            levelFilter === "high"
              ? "border-status-review bg-status-review-bg"
              : "border-border hover:bg-surface-alt"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">High Attention</span>
            <AlertTriangle className="h-5 w-5 text-status-review" />
          </div>
          <p className="text-3xl font-bold text-status-review">{highCount}</p>
          <p className="text-xs text-text-muted mt-1">Score 60–100</p>
        </button>

        <button
          onClick={() => setLevelFilter(levelFilter === "medium" ? "all" : "medium")}
          className={`text-left p-4 rounded-lg border transition-colors ${
            levelFilter === "medium"
              ? "border-status-attention bg-status-attention-bg"
              : "border-border hover:bg-surface-alt"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Medium Attention</span>
            <Clock className="h-5 w-5 text-status-attention" />
          </div>
          <p className="text-3xl font-bold text-status-attention">{mediumCount}</p>
          <p className="text-xs text-text-muted mt-1">Score 30–59</p>
        </button>

        <button
          onClick={() => setLevelFilter(levelFilter === "low" ? "all" : "low")}
          className={`text-left p-4 rounded-lg border transition-colors ${
            levelFilter === "low"
              ? "border-status-normal bg-status-normal-bg"
              : "border-border hover:bg-surface-alt"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Low Attention</span>
            <CheckCircle className="h-5 w-5 text-status-normal" />
          </div>
          <p className="text-3xl font-bold text-status-normal">{lowCount}</p>
          <p className="text-xs text-text-muted mt-1">Score 0–29</p>
        </button>
      </div>

      {/* Project list */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<CheckCircle className="h-8 w-8 text-status-normal" />}
              title="No projects in this category"
              description="All projects are well-monitored."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Attention indicator */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0 ${ATTENTION_LEVEL_BG[project.attentionScore.level]}`}>
                    {getAttentionIcon(project.attentionScore.level)}
                  </div>

                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link
                        href={`/engineer/sites/${project.id}`}
                        className="text-sm font-semibold text-text-primary hover:text-primary"
                      >
                        {project.name}
                      </Link>
                      <StatusBadge status={project.status} size="sm" />
                      <span className={`text-lg font-bold font-mono ${ATTENTION_LEVEL_COLORS[project.attentionScore.level]}`}>
                        {project.attentionScore.score}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted mb-2">
                      {getStageLabel(project.currentStage)} · {project.city || project.address}
                    </p>

                    {/* Attention reasons */}
                    {project.attentionScore.reasons.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {project.attentionScore.reasons.map((reason, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              reason.severity === "critical"
                                ? "bg-status-review-bg text-status-review"
                                : reason.severity === "warning"
                                ? "bg-status-attention-bg text-status-attention"
                                : "bg-surface-alt text-text-secondary"
                            }`}
                          >
                            {reason.severity === "critical" && <AlertTriangle className="h-3 w-3" />}
                            {reason.severity === "warning" && <Clock className="h-3 w-3" />}
                            {reason.description}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-status-normal">
                        No urgent issues detected
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <Link
                    href={`/engineer/sites/${project.id}`}
                    className="flex-shrink-0"
                  >
                    <ArrowRight className="h-5 w-5 text-text-muted hover:text-primary transition-colors" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Explanation card */}
      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            How Attention Scores Work
          </h3>
          <p className="text-xs text-text-secondary mb-3">
            Attention scores are calculated using transparent, rule-based factors.
            They help you identify which sites may need your focus.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Camera className="h-4 w-4 text-text-muted mt-0.5" />
              <div>
                <p className="font-medium text-text-primary">Inspection Urgency</p>
                <p className="text-text-muted">How overdue is the last inspection?</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-text-muted mt-0.5" />
              <div>
                <p className="font-medium text-text-primary">Unresolved Issues</p>
                <p className="text-text-muted">Number of open alerts and warnings</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-text-muted mt-0.5" />
              <div>
                <p className="font-medium text-text-primary">Delay Indicators</p>
                <p className="text-text-muted">Progress vs expected completion timeline</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Crosshair className="h-4 w-4 text-text-muted mt-0.5" />
              <div>
                <p className="font-medium text-text-primary">Recent Risk Flags</p>
                <p className="text-text-muted">AI analyses recommending review</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

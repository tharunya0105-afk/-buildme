"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { LayoutStudio, LayoutPlanRecord } from "@/components/layout/LayoutStudio";
import { EmptyState } from "@/components/layout/EmptyState";

interface ProjectOption {
  id: string;
  name: string;
  address: string;
}

export default function EngineerLayoutsPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [plans, setPlans] = useState<LayoutPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0) setProjectId(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load your projects.");
        setLoading(false);
      });
  }, []);

  const loadPlans = useCallback(() => {
    if (!projectId) return;
    fetch(`/api/layouts?projectId=${projectId}`)
      .then(r => (r.ok ? r.json() : []))
      .then((data) => { if (Array.isArray(data)) setPlans(data); })
      .catch(() => {});
  }, [projectId]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
        <span className="ml-3 text-text-secondary">Loading Layout Studio…</span>
      </div>
    );
  }

  const project = projects.find(p => p.id === projectId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Layers className="h-6 w-6 text-accent" />
            Layout Studio
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Upload a floor plan — the AI extracts rooms and builds a virtual tour of your client&apos;s future home.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Brain className="h-8 w-8 text-text-muted" />}
              title="No projects yet"
              description="Create a project first — layouts are attached to your construction sites."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project selector */}
          <Card>
            <CardContent className="py-3">
              <label className="text-xs font-medium text-text-muted block mb-1.5">Project</label>
              <select
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setPlans([]); }}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.address}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {error && (
            <div className="p-3 rounded-lg bg-danger-bg border border-danger-border text-sm">{error}</div>
          )}

          {project && (
            <LayoutStudio
              projectId={projectId}
              projectName={project.name}
              plans={plans}
              onPlansChanged={loadPlans}
            />
          )}
        </>
      )}
    </div>
  );
}

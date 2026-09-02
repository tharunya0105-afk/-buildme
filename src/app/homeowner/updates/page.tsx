"use client";

import { useEffect, useState } from "react";
import { Bell, Camera, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/layout/EmptyState";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  timelineEvents: TimelineEvent[];
  inspections: { inspectionDate: string; stage: string | null; notes: string | null }[];
  _count: { photos: number; inspections: number };
}

export default function UpdatesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading updates...</div>
      </div>
    );
  }

  // Gather all timeline events from all projects
  const allEvents: (TimelineEvent & { projectName: string })[] = [];
  projects.forEach(p => {
    p.timelineEvents?.forEach(e => {
      allEvents.push({ ...e, projectName: p.name });
    });
  });
  allEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Gather inspection info
  const allInspections: Array<{ projectName: string; date: string; stage: string | null; notes: string | null }> = [];
  projects.forEach(p => {
    p.inspections?.forEach(insp => {
      allInspections.push({
        projectName: p.name,
        date: insp.inspectionDate,
        stage: insp.stage,
        notes: insp.notes,
      });
    });
  });
  allInspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Updates</h2>
        <p className="text-sm text-text-secondary mt-1">
          Latest updates from your construction project
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<Bell className="h-8 w-8 text-text-muted" />}
              title="No projects assigned"
              description="Once your engineer assigns you to a project, updates will appear here."
            />
          </CardContent>
        </Card>
      ) : allEvents.length === 0 && allInspections.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<Bell className="h-8 w-8 text-text-muted" />}
              title="No updates yet"
              description="When your engineer records inspections or uploads new photos, you'll see updates here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Recent Inspections */}
          {allInspections.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Recent Inspections</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {allInspections.slice(0, 5).map((insp, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Camera className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{insp.projectName}</p>
                      <p className="text-xs text-text-muted">
                        Inspection on {new Date(insp.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        {insp.stage ? ` — Stage: ${insp.stage}` : ""}
                      </p>
                      {insp.notes && <p className="text-xs text-text-secondary mt-1">{insp.notes}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timeline Events */}
          {allEvents.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-text-primary">Project Activity</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allEvents.slice(0, 10).map((event) => {
                    const iconMap: Record<string, React.ElementType> = {
                      milestone: CheckCircle,
                      inspection: Camera,
                      update: Bell,
                      alert: AlertTriangle,
                      photo: Camera,
                    };
                    const Icon = iconMap[event.type] || Clock;
                    return (
                      <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-surface-alt flex-shrink-0 mt-0.5">
                          <Icon className="h-3 w-3 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-sm text-text-primary">{event.title}</p>
                          <p className="text-xs text-text-muted">{event.projectName} · {new Date(event.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</p>
                          {event.description && <p className="text-xs text-text-secondary mt-0.5">{event.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Stats */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <span className="text-sm text-text-primary">Total site photos: {projects.reduce((sum, p) => sum + (p._count?.photos || 0), 0)}</span>
                </div>
                <span className="text-xs text-text-muted">Across {projects.length} project{projects.length > 1 ? "s" : ""}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

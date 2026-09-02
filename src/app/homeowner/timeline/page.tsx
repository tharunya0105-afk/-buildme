"use client";

import { useEffect, useState } from "react";
import { Clock, Camera, CheckCircle, AlertTriangle, Bell, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
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
  currentStage: string | null;
  progress: number;
  status: string;
  createdAt: string;
  timelineEvents: TimelineEvent[];
  inspections: { inspectionDate: string; stage: string | null }[];
  issues: { id: string; title: string; status: string; createdAt: string }[];
}

const STAGE_LABELS: Record<string, string> = {
  planning: "Planning", foundation: "Foundation", structure: "Structure",
  brickwork: "Brickwork", roofing: "Roofing", electrical_plumbing: "Electrical/Plumbing",
  finishing: "Finishing", completed: "Completed",
};

export default function TimelinePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading timeline...</div>
      </div>
    );
  }

  // Build chronological timeline from all data sources
  interface TimelineEntry {
    id: string;
    date: string;
    type: string;
    title: string;
    description: string | null;
    projectName: string;
  }

  const allEntries: TimelineEntry[] = [];

  projects.forEach(project => {
    // Project creation
    allEntries.push({
      id: `created-${project.id}`,
      date: project.createdAt,
      type: "milestone",
      title: `Project created — ${project.name}`,
      description: `Construction stage: ${STAGE_LABELS[project.currentStage || ""] || project.currentStage || "Planning"}`,
      projectName: project.name,
    });

    // Timeline events
    project.timelineEvents?.forEach(e => {
      allEntries.push({
        id: e.id,
        date: e.createdAt,
        type: e.type,
        title: e.title,
        description: e.description,
        projectName: project.name,
      });
    });

    // Inspections
    project.inspections?.forEach((insp, i) => {
      allEntries.push({
        id: `inspection-${project.id}-${i}`,
        date: insp.inspectionDate,
        type: "inspection",
        title: `Site inspection`,
        description: insp.stage ? `Stage: ${STAGE_LABELS[insp.stage] || insp.stage}` : null,
        projectName: project.name,
      });
    });

    // Issues
    project.issues?.forEach(issue => {
      allEntries.push({
        id: `issue-${issue.id}`,
        date: issue.createdAt,
        type: issue.status === "resolved" ? "resolved" : "alert",
        title: issue.title,
        description: `Status: ${issue.status}`,
        projectName: project.name,
      });
    });
  });

  allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const iconMap: Record<string, React.ElementType> = {
    milestone: CheckCircle,
    inspection: Camera,
    update: Bell,
    alert: AlertTriangle,
    photo: Camera,
    resolved: CheckCircle,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Timeline</h2>
        <p className="text-sm text-text-secondary mt-1">
          Chronological history of your project
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<Clock className="h-8 w-8 text-text-muted" />}
              title="No projects assigned"
              description="Project timeline will appear here once you are assigned to a construction project."
            />
          </CardContent>
        </Card>
      ) : allEntries.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<Clock className="h-8 w-8 text-text-muted" />}
              title="No timeline events yet"
              description="Timeline events will appear as your engineer records inspections, updates, and milestones."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {allEntries.map((entry) => {
                  const Icon = iconMap[entry.type] || Clock;
                  const colorMap: Record<string, string> = {
                    milestone: "bg-status-normal text-white",
                    inspection: "bg-primary text-white",
                    update: "bg-surface-alt text-text-secondary",
                    alert: "bg-status-review text-white",
                    resolved: "bg-status-normal text-white",
                  };
                  return (
                    <div key={entry.id} className="flex items-start gap-4 pl-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 z-10 ${colorMap[entry.type] || "bg-surface-alt text-text-secondary"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-text-primary">{entry.title}</p>
                          <span className="text-[10px] text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">{entry.projectName}</span>
                        </div>
                        <p className="text-xs text-text-muted">
                          {new Date(entry.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {entry.description && (
                          <p className="text-xs text-text-secondary mt-1">{entry.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map as MapIcon, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { CONSTRUCTION_STAGES } from "@/lib/types";

interface Project {
  id: string;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  currentStage: string | null;
  status: string;
  progress: number;
  updatedAt: string;
}

export default function MapPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(
          data.filter((p: Project) => p.latitude && p.longitude)
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStageLabel = (stage: string | null) => {
    if (!stage) return "—";
    return (
      CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Project Map
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Geographic overview of all your construction sites
          </p>
        </div>
        <Link href="/engineer/sites/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<MapIcon className="h-8 w-8 text-text-muted" />}
              title="No sites with location data"
              description="Add construction sites with location data to see them on the map."
              action={
                <Link href="/engineer/sites/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Construction Site
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <MapWithMarkers
                    projects={projects}
                    onSelectProject={setSelectedProject}
                    selectedProjectId={selectedProject?.id}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent>
                <h3 className="text-sm font-medium text-text-secondary mb-4">
                  Sites with location ({projects.length})
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedProject?.id === project.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-surface-alt"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-text-primary truncate">
                          {project.name}
                        </h4>
                        <StatusBadge
                          status={project.status}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-text-muted">
                        {getStageLabel(project.currentStage)} ·{" "}
                        {project.progress}%
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected project details */}
            {selectedProject && (
              <Card>
                <CardContent className="py-4">
                  <h3 className="text-sm font-medium text-text-primary mb-2">
                    {selectedProject.name}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-text-secondary">
                      {selectedProject.address}
                      {selectedProject.city
                        ? `, ${selectedProject.city}`
                        : ""}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={selectedProject.status}
                        size="sm"
                      />
                      <span className="text-text-muted">
                        {getStageLabel(selectedProject.currentStage)}
                      </span>
                    </div>
                    <p className="text-text-muted">
                      Last updated:{" "}
                      {formatDate(selectedProject.updatedAt)}
                    </p>
                    <Link
                      href={`/engineer/sites/${selectedProject.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark mt-2"
                    >
                      Open Site →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Dynamic map import
import dynamic from "next/dynamic";

const MapWithMarkers = dynamic(
  () =>
    import("@/components/maps/MapWithMarkers").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-text-muted">
        Loading map...
      </div>
    ),
  }
);

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { CONSTRUCTION_STAGES, STATUS_LABELS } from "@/lib/types";

interface Project {
  id: string;
  name: string;
  address: string;
  city: string | null;
  status: string;
  progress: number;
  currentStage: string | null;
  constructionType: string | null;
  homeownerName: string | null;
  updatedAt: string;
  createdAt: string;
  inspections: { inspectionDate: string }[];
  _count: {
    inspections: number;
    photos: number;
    alerts: number;
  };
}

type SortField = "updatedAt" | "name" | "progress" | "status";

export default function SitesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.homeownerName && p.homeownerName.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Stage filter
    if (stageFilter !== "all") {
      result = result.filter((p) => p.currentStage === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "updatedAt":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "progress":
          comparison = a.progress - b.progress;
          break;
        case "status": {
          const statusOrder = { normal: 0, attention: 1, review: 2 };
          comparison =
            (statusOrder[a.status as keyof typeof statusOrder] || 0) -
            (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
        }
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    return result;
  }, [
    projects,
    searchQuery,
    statusFilter,
    stageFilter,
    sortField,
    sortDirection,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStageLabel = (stage: string | null) => {
    if (!stage) return "—";
    return CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage;
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
        <div className="text-text-secondary">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Sites</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage your construction sites
          </p>
        </div>
        <Link href="/engineer/sites/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Construction Site
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<MapPin className="h-8 w-8 text-text-muted" />}
              title="No construction sites yet"
              description="Add your first site to start monitoring your projects."
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
        <>
          {/* Search and Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search sites by name, address, city, or homeowner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-text-muted" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="normal">Normal</option>
                    <option value="attention">Attention</option>
                    <option value="review">Review Required</option>
                  </select>
                </div>

                {/* Stage filter */}
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Stages</option>
                  {CONSTRUCTION_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-text-muted" />
                  <select
                    value={`${sortField}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, dir] = e.target.value.split("-");
                      setSortField(field as SortField);
                      setSortDirection(dir as "asc" | "desc");
                    }}
                    className="rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="updatedAt-desc">Last Updated (Newest)</option>
                    <option value="updatedAt-asc">Last Updated (Oldest)</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="progress-desc">Progress (High to Low)</option>
                    <option value="progress-asc">Progress (Low to High)</option>
                    <option value="status-desc">Status (Review First)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <p className="text-sm text-text-muted">
            Showing {filteredAndSorted.length} of {projects.length} sites
          </p>

          {/* Sites list */}
          {filteredAndSorted.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={<Search className="h-8 w-8 text-text-muted" />}
                  title="No sites match your filters"
                  description="Try adjusting your search or filter criteria."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSorted.map((project) => (
                <Link key={project.id} href={`/engineer/sites/${project.id}`}>
                  <Card hover>
                    <CardContent className="py-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-semibold text-text-primary truncate">
                          {project.name}
                        </h3>
                        <StatusBadge status={project.status} size="sm" />
                      </div>

                      <p className="text-sm text-text-muted mb-1 truncate">
                        {project.address}
                        {project.city ? `, ${project.city}` : ""}
                      </p>

                      {project.homeownerName && (
                        <p className="text-xs text-text-muted mb-3">
                          Homeowner: {project.homeownerName}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-text-secondary font-medium">
                          {getStageLabel(project.currentStage)}
                        </span>
                        <span className="text-text-primary font-semibold">
                          {project.progress}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>
                          {project._count.inspections} inspection
                          {project._count.inspections !== 1 ? "s" : ""}
                        </span>
                        <span>Updated {formatDate(project.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

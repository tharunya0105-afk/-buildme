"use client";

import { useEffect, useState } from "react";
import { Box, Loader2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/layout/EmptyState";
import { VirtualTour } from "@/components/layout/VirtualTour";
import type { LayoutPlanGeometry, Room, Wall, Opening } from "@/lib/ai/layout/types";

interface ProjectOption {
  id: string;
  name: string;
  address: string;
}

interface PlanRow {
  id: string;
  title: string;
  floorLabel: string;
  fileUrl: string;
  rooms: string;
  walls: string;
  openings: string;
  stats: string | null;
  scaleFeetPerPx: number | null;
  correctionsCount: number;
  createdAt: string;
}

export default function HomeownerTourPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [planId, setPlanId] = useState<string>("");
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
        setError("Could not load your home.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/layouts?projectId=${projectId}`)
      .then(r => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
          setPlanId(data[0].id);
        } else {
          setPlans([]);
          setPlanId("");
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);

  const plan = plans.find(p => p.id === planId) ?? null;

  const geometry: LayoutPlanGeometry | null = plan
    ? {
        rooms: parseJson<Room[]>(plan.rooms, []),
        walls: parseJson<Wall[]>(plan.walls, []),
        openings: parseJson<Opening[]>(plan.openings, []),
      }
    : null;

  const stats = plan?.stats
    ? parseJson<{ totalAreaSqFt?: number; roomCount?: number; doorCount?: number; windowCount?: number }>(plan.stats, {})
    : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <span className="ml-3 text-text-secondary">Loading your tour…</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Box className="h-8 w-8 text-text-muted" />}
              title="No home assigned yet"
              description="When your engineer adds you to a project, the virtual tour of your future home will appear here."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Virtual Tour</h1>
        <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Walk through your future home before it is built
        </p>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Box className="h-8 w-8 text-text-muted" />}
              title="No layouts yet"
              description="Your engineer hasn't uploaded a floor plan for this project yet. Once they do, you'll be able to walk through every room in 3D."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Plan picker + project context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-3">
                <label className="text-xs font-medium text-text-muted block mb-1.5">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <label className="text-xs font-medium text-text-muted block mb-1.5">Layout</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  {plans.map(p => <option key={p.id} value={p.id}>{p.title} · {p.floorLabel}</option>)}
                </select>
              </CardContent>
            </Card>
          </div>

          {/* Tour */}
          {geometry && (
            <Card>
              <CardContent className="py-4">
                <VirtualTour
                  geometry={geometry}
                  scaleFeetPerPx={plan?.scaleFeetPerPx ?? 0.08}
                  floorLabel={plan?.floorLabel}
                />
                <p className="text-xs text-text-muted mt-3 flex items-center gap-1.5">
                  <Box className="h-3 w-3" />
                  Tip: choose <strong>Walk through</strong>, then use W A S D to move and Q / E to turn.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Room summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Total area" value={stats.totalAreaSqFt ? `${Math.round(stats.totalAreaSqFt)} sq ft` : "—"} />
            <Stat label="Rooms" value={String(stats.roomCount ?? geometry?.rooms.length ?? 0)} />
            <Stat label="Doors" value={String(stats.doorCount ?? 0)} />
            <Stat label="Windows" value={String(stats.windowCount ?? 0)} />
          </div>

          {/* Room list */}
          {geometry && geometry.rooms.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Rooms in this layout</h3>
                <div className="flex flex-wrap gap-2">
                  {geometry.rooms.map((room) => (
                    <span key={room.id} className="px-3 py-1.5 rounded-full bg-surface-alt border border-border text-sm text-text-secondary">
                      {room.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {error && <div className="p-3 rounded-lg bg-danger-bg border border-danger-border text-sm">{error}</div>}

          <div className="p-3 rounded-lg bg-surface-alt border border-border">
            <p className="text-[11px] text-text-muted">
              The 3D model is generated from your uploaded floor plan. Room shapes and sizes are
              AI-extracted and engineer-verified — treat them as a preview, not a construction document.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-3 text-center">
        <p className="text-xl font-bold text-text-primary">{value}</p>
        <p className="text-[11px] text-text-muted">{label}</p>
      </CardContent>
    </Card>
  );
}

function parseJson<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

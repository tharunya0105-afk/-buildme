"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Map as MapIcon, Plus, Filter, Crosshair, Calendar, AlertTriangle,
  ChevronDown, ChevronUp, Search, Layers, Eye, Building2, MapPin,
  ArrowRight, CheckCircle, Clock, Home, Ruler, DollarSign, X,
  Navigation, BarChart3, Target, Zap, Info,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import "leaflet/dist/leaflet.css";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { CONSTRUCTION_STAGES } from "@/lib/types";
import { ATTENTION_LEVEL_LABELS, ATTENTION_LEVEL_COLORS, ATTENTION_LEVEL_BG } from "@/lib/spatial/types";
import { haversineDistance, formatDistance, findNearby, clusterByRegion } from "@/lib/spatial/geo-utils";
import type { AttentionLevel } from "@/lib/spatial/types";

// ─── DEMO DATA ──────────────────────────────────────────────────────────────

interface SpatialProject {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  constructionType: string;
  builtArea: number | null;
  currentStage: string;
  status: "normal" | "attention" | "review";
  progress: number;
  homeownerName: string;
  lastInspection: string;
  openIssues: number;
  attentionScore: number;
  attentionLevel: AttentionLevel;
  attentionReasons: string[];
}

// Database projects are fetched from /api/dashboard — no hardcoded arrays

const ATTENTION_COLORS: Record<string, string> = { normal: "#16a34a", attention: "#d97706", review: "#dc2626" };
const ATTENTION_BG_COLORS: Record<string, string> = { normal: "#f0fdf4", attention: "#fffbeb", review: "#fef2f2" };

function getStageLabel(stage: string) {
  return CONSTRUCTION_STAGES.find(s => s.value === stage)?.label || stage;
}

type FilterType = "all" | "high" | "medium" | "low";
type SpatialView = "map" | "analytics" | "comparison" | "planning";

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function SpatialDashboardPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProject, setSelectedProject] = useState<SpatialProject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<SpatialView>("map");
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState({ properties: true, projects: true, attention: true, flood: false, terrain: false, weather: false, infrastructure: false, cost: false });
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(50);
  const [selectedForPlanning, setSelectedForPlanning] = useState<string[]>([]);
  const [allProjects, setAllProjects] = useState<SpatialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthScores, setHealthScores] = useState<Record<string, { overallScore: number; riskLevel: string }>>({});

  // Fetch projects from database via dashboard API
  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(data => {
        if (data.projects && Array.isArray(data.projects)) {
          const mapped: SpatialProject[] = data.projects
            .filter((p: { latitude: number | null; longitude: number | null }) => p.latitude && p.longitude)
            .map((p: {
              id: string; name: string; address: string; city: string | null; district: string | null;
              state: string | null; pincode: string | null; latitude: number; longitude: number;
              constructionType: string | null; builtArea: number | null; currentStage: string | null;
              status: string; progress: number; homeownerName: string | null;
              lastInspectionDate: string | null; attentionScore: { score: number; level: string; reasons: { description: string }[] };
              alerts: { id: string }[];
            }) => ({
              id: p.id,
              name: p.name,
              address: p.address,
              city: p.city || "Unknown",
              district: p.district || "Unknown",
              state: p.state || "Unknown",
              pincode: p.pincode || "",
              lat: p.latitude,
              lng: p.longitude,
              constructionType: p.constructionType || "house",
              builtArea: p.builtArea,
              currentStage: p.currentStage || "planning",
              status: p.status as "normal" | "attention" | "review",
              progress: p.progress,
              homeownerName: p.homeownerName || "Not assigned",
              lastInspection: p.lastInspectionDate ? new Date(p.lastInspectionDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "Never",
              openIssues: p.alerts.length,
              attentionScore: p.attentionScore.score,
              attentionLevel: p.attentionScore.level as AttentionLevel,
              attentionReasons: p.attentionScore.reasons.map(r => r.description),
            }));
          setAllProjects(mapped);
        }
      })
      .catch(err => console.error("Failed to fetch spatial data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch health scores for all projects
  useEffect(() => {
    if (allProjects.length === 0) return;
    allProjects.forEach(p => {
      fetch(`/api/projects/${p.id}/health`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setHealthScores(prev => ({ ...prev, [p.id]: { overallScore: data.overallScore, riskLevel: data.riskLevel } }));
          }
        })
        .catch(() => {});
    });
  }, [allProjects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let result = allProjects;
    if (filter === "high") result = result.filter(p => p.attentionLevel === "high");
    else if (filter === "medium") result = result.filter(p => p.attentionLevel === "medium");
    else if (filter === "low") result = result.filter(p => p.attentionLevel === "low");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.pincode.includes(q));
    }
    return result;
  }, [filter, searchQuery, allProjects]);

  // Nearby projects
  const nearbyProjects = useMemo(() => {
    if (!selectedProject) return [];
    const withLatLon = allProjects.map(p => ({ ...p, latitude: p.lat, longitude: p.lng }));
    const center = { latitude: selectedProject.lat, longitude: selectedProject.lng };
    return findNearby(withLatLon, center.latitude, center.longitude, radiusKm)
      .filter((p: SpatialProject & { distance: number }) => p.id !== selectedProject.id)
      .slice(0, 5) as (SpatialProject & { distance: number })[];
  }, [selectedProject, radiusKm, allProjects]);

  // Clusters
  const clusters = useMemo(() => clusterByRegion(allProjects), [allProjects]);

  // Compare data
  const compareProjects = useMemo(() =>
    allProjects.filter(p => compareSelection.includes(p.id)),
    [compareSelection, allProjects]
  );

  const toggleCompare = (id: string) => {
    setCompareSelection(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const togglePlanning = (id: string) => {
    setSelectedForPlanning(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const planningProjects = useMemo(() =>
    allProjects.filter(p => selectedForPlanning.includes(p.id)),
    [selectedForPlanning, allProjects]
  );

  const focusOnProject = useCallback((project: SpatialProject) => {
    setSelectedProject(project);
    setActiveView("map");
  }, []);

  // Stats (computed from database)
  const highCount = allProjects.filter(p => p.attentionLevel === "high").length;
  const mediumCount = allProjects.filter(p => p.attentionLevel === "medium").length;
  const lowCount = allProjects.filter(p => p.attentionLevel === "low").length;
  const districts = [...new Set(allProjects.map(p => p.district))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading spatial data from database...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Spatial Intelligence</h2>
          <p className="text-sm text-text-secondary">Understand your properties through location, geographic context and project activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-status-attention bg-status-attention-bg px-2 py-0.5 rounded">DEMO DATA — from database</span>
          <Link href="/engineer/sites/new"><Button><Plus className="h-4 w-4 mr-2" />Add Site</Button></Link>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "map" as const, label: "Project Map", icon: MapIcon },
          { key: "analytics" as const, label: "Spatial Analytics", icon: BarChart3 },
          { key: "comparison" as const, label: "Compare Properties", icon: Target },
          { key: "planning" as const, label: "Site Planning", icon: Navigation },
        ]).map(v => (
          <button key={v.key} onClick={() => setActiveView(v.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === v.key ? "bg-primary text-white" : "bg-surface-alt text-text-secondary hover:bg-border"}`}>
            <v.icon className="h-4 w-4" />{v.label}
          </button>
        ))}
      </div>

      {/* ─── MAP VIEW ──────────────────────────────────────────────────── */}
      {activeView === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0 relative">
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <SpatialMap projects={filteredProjects} onSelect={setSelectedProject} selectedId={selectedProject?.id} />
                </div>
                {/* Risk Legend */}
                <div className="absolute bottom-3 left-3 z-10 bg-white/95 rounded-lg shadow-md border border-border p-2">
                  <p className="text-[10px] font-semibold text-text-primary mb-1">Risk Level</p>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-normal" /><span className="text-[10px] text-text-muted">Healthy</span></div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-attention" /><span className="text-[10px] text-text-muted">Attention</span></div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-review" /><span className="text-[10px] text-text-muted">High Risk</span></div>
                  </div>
                </div>
                {/* Layer Toggle */}
                <button onClick={() => setShowLayers(!showLayers)}
                  className="absolute top-3 right-3 z-10 flex items-center gap-1 px-3 py-1.5 rounded-md bg-white shadow-md border border-border text-xs font-medium hover:bg-surface-alt">
                  <Layers className="h-3.5 w-3.5" />Layers
                </button>
                {showLayers && (
                  <div className="absolute top-12 right-3 z-10 w-56 bg-white rounded-lg shadow-lg border border-border p-3">
                    <p className="text-xs font-semibold text-text-primary mb-2">Map Layers</p>
                    {([
                      { key: "properties", label: "Properties" },
                      { key: "projects", label: "Construction Projects" },
                      { key: "attention", label: "Attention Level" },
                      { key: "flood", label: "Flood Risk" },
                      { key: "terrain", label: "Terrain" },
                      { key: "weather", label: "Weather" },
                      { key: "infrastructure", label: "Infrastructure" },
                      { key: "cost", label: "Local Cost Index" },
                    ] as const).map(layer => (
                      <label key={layer.key} className="flex items-center gap-2 py-1 text-xs">
                        <input type="checkbox" checked={layers[layer.key]} onChange={() => setLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key] }))}
                          disabled={["flood", "terrain", "weather", "infrastructure", "cost"].includes(layer.key)} />
                        <span className={["flood", "terrain", "weather", "infrastructure", "cost"].includes(layer.key) ? "text-text-muted" : "text-text-primary"}>
                          {layer.label}
                          {["flood", "terrain", "weather", "infrastructure", "cost"].includes(layer.key) && " — Coming Soon"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="py-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input type="text" placeholder="Search by name, city, district..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  {([
                    { key: "all" as const, label: "All Sites", count: allProjects.length },
                    { key: "high" as const, label: "🔴 High Attention", count: highCount },
                    { key: "medium" as const, label: "🟡 Medium Attention", count: mediumCount },
                    { key: "low" as const, label: "🟢 Low Attention", count: lowCount },
                  ]).map(opt => (
                    <button key={opt.key} onClick={() => setFilter(opt.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${filter === opt.key ? "bg-primary/10 text-primary font-medium" : "text-text-secondary hover:bg-surface-alt"}`}>
                      <span>{opt.label}</span>
                      <span className="text-xs bg-surface-alt px-2 py-0.5 rounded-full">{opt.count}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Project Panel */}
            {selectedProject ? (
              <Card>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{selectedProject.name}</h3>
                      <p className="text-xs text-text-muted">{selectedProject.address}, {selectedProject.city}</p>
                    </div>
                    <StatusBadge status={selectedProject.status} size="sm" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-text-muted">Stage</span><span className="text-text-primary">{getStageLabel(selectedProject.currentStage)}</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">Progress</span><span className="text-text-primary">{selectedProject.progress}%</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">Client</span><span className="text-text-primary">{selectedProject.homeownerName}</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">Last Inspection</span><span className="text-text-primary">{selectedProject.lastInspection}</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">Open Issues</span><span className={selectedProject.openIssues > 0 ? "text-status-review font-medium" : "text-status-normal"}>{selectedProject.openIssues}</span></div>
                    <div className="flex justify-between"><span className="text-text-muted">Attention</span><span className={`font-bold ${ATTENTION_LEVEL_COLORS[selectedProject.attentionLevel]}`}>{selectedProject.attentionScore}/100</span></div>
                    {healthScores[selectedProject.id] && (
                      <div className="flex justify-between"><span className="text-text-muted">Health Score</span><span className={`font-bold ${
                        healthScores[selectedProject.id].riskLevel === "healthy" ? "text-status-normal" :
                        healthScores[selectedProject.id].riskLevel === "attention" ? "text-status-attention" : "text-status-review"
                      }`}>{healthScores[selectedProject.id].overallScore}/100</span></div>
                    )}
                  </div>

                  {selectedProject.attentionReasons.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-text-muted mb-1">Attention Reasons</p>
                      {selectedProject.attentionReasons.map((r, i) => (
                        <p key={i} className="text-xs text-text-secondary">• {r}</p>
                      ))}
                    </div>
                  )}

                  {/* Nearby Projects */}
                  {nearbyProjects.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-text-muted mb-1">Nearby Projects ({radiusKm} km)</p>
                      {nearbyProjects.map(p => (
                        <button key={p.id} onClick={() => focusOnProject(p)}
                          className="w-full text-left flex items-center justify-between py-1 text-xs hover:text-primary">
                          <span className="text-text-secondary">{p.name}</span>
                          <span className="text-text-muted">{formatDistance(p.distance)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link href={`/engineer/sites/${selectedProject.id}`} className="flex-1"><Button size="sm" className="w-full">Open Property</Button></Link>
                    <Link href={`/engineer/sites/${selectedProject.id}`} className="flex-1"><Button size="sm" variant="secondary" className="w-full">Inspections</Button></Link>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/engineer/ai-intelligence" className="flex-1"><Button size="sm" variant="secondary" className="w-full">AI Insights</Button></Link>
                    <Link href="/engineer/evidence" className="flex-1"><Button size="sm" variant="secondary" className="w-full">Evidence</Button></Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="py-6 text-center"><p className="text-sm text-text-muted">Click a property marker on the map to view details</p></CardContent></Card>
            )}

            {/* Location Profile */}
            {selectedProject && (
              <Card>
                <CardHeader><h3 className="text-sm font-semibold text-text-primary">Location Profile</h3></CardHeader>
                <CardContent className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-text-muted">Country</span><span className="text-text-primary">India</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">State</span><span className="text-text-primary">{selectedProject.state}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">District</span><span className="text-text-primary">{selectedProject.district}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">City</span><span className="text-text-primary">{selectedProject.city}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Pincode</span><span className="text-text-primary">{selectedProject.pincode}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Latitude</span><span className="text-text-primary font-mono">{selectedProject.lat.toFixed(4)}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Longitude</span><span className="text-text-primary font-mono">{selectedProject.lng.toFixed(4)}</span></div>
                </CardContent>
              </Card>
            )}

            {/* Spatial Features */}
            {selectedProject && (
              <Card>
                <CardHeader><h3 className="text-sm font-semibold text-text-primary">Spatial Features</h3></CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <p className="font-medium text-text-muted mb-1">Location</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-text-muted">Coordinates</span><span className="text-text-primary font-mono">{selectedProject.lat.toFixed(4)}, {selectedProject.lng.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Administrative Region</span><span className="text-text-primary">{selectedProject.district}</span></div>
                    </div>
                  </div>
                  {([
                    { category: "Environment", items: [{ name: "Weather", status: "unavailable" }, { name: "Terrain", status: "unavailable" }, { name: "Flood Data", status: "unavailable" }] },
                    { category: "Infrastructure", items: [{ name: "Road Access", status: "unavailable" }, { name: "Nearby Facilities", status: "unavailable" }] },
                    { category: "Construction", items: [{ name: "Local Cost Index", status: "unavailable" }, { name: "Regional Data", status: "unavailable" }] },
                  ]).map(cat => (
                    <div key={cat.category}>
                      <p className="font-medium text-text-muted mb-1">{cat.category}</p>
                      <div className="space-y-1">
                        {cat.items.map(item => (
                          <div key={item.name} className="flex justify-between">
                            <span className="text-text-muted">{item.name}</span>
                            <span className="text-text-muted italic">Not connected</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-text-muted pt-1 border-t border-border">Additional spatial features: awaiting verified external datasets</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ─── ANALYTICS VIEW ──────────────────────────────────────────── */}
      {activeView === "analytics" && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Properties Mapped", value: allProjects.length, icon: MapPin, color: "bg-primary/10 text-primary" },
              { label: "High Attention", value: highCount, icon: AlertTriangle, color: "bg-status-review-bg text-status-review" },
              { label: "Districts Covered", value: districts.length, icon: Building2, color: "bg-status-normal-bg text-status-normal" },
              { label: "Total Area", value: "~45,000 km²", icon: MapIcon, color: "bg-surface-alt text-text-secondary" },
            ].map(card => (
              <Card key={card.label}><CardContent className="py-4"><div className="flex items-center justify-between"><div><p className="text-xs text-text-muted">{card.label}</p><p className="text-2xl font-bold text-text-primary">{card.value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}><card.icon className="h-5 w-5" /></div></div></CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By District */}
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-text-primary">Projects by District</h3></CardHeader>
              <CardContent className="space-y-3">
                {clusters.map(c => (
                  <div key={c.region}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-text-primary font-medium">{c.region}</span><span className="text-text-muted">{c.count}</span></div>
                    <div className="h-2 bg-surface-alt rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(c.count / allProjects.length) * 100}%` }} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* By Stage */}
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-text-primary">By Construction Stage</h3></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(allProjects.reduce((acc, p) => { acc[p.currentStage] = (acc[p.currentStage] || 0) + 1; return acc; }, {} as Record<string, number>))
                  .sort((a, b) => b[1] - a[1])
                  .map(([stage, count]) => (
                    <div key={stage}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-text-primary font-medium">{getStageLabel(stage)}</span><span className="text-text-muted">{count}</span></div>
                      <div className="h-2 bg-surface-alt rounded-full overflow-hidden"><div className="h-full bg-primary-light rounded-full" style={{ width: `${(count / allProjects.length) * 100}%` }} /></div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Attention Distribution */}
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-text-primary">Attention Distribution</h3></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "High Attention", count: highCount, color: "bg-status-review" },
                  { label: "Medium Attention", count: mediumCount, color: "bg-status-attention" },
                  { label: "Low Attention", count: lowCount, color: "bg-status-normal" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-text-primary font-medium">{item.label}</span><span className="text-text-muted">{item.count}</span></div>
                    <div className="h-2 bg-surface-alt rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.count / allProjects.length) * 100}%` }} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Property Clusters */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Property Distribution</h3><p className="text-xs text-text-muted">Geographic clustering of projects by region</p></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {clusters.map(c => (
                  <div key={c.region} className="p-3 rounded-lg border border-border bg-surface-alt">
                    <div className="flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-primary" /><h4 className="text-sm font-semibold text-text-primary">{c.region}</h4></div>
                    <p className="text-xs text-text-muted mb-2">{c.count} propert{c.count !== 1 ? "ies" : "y"}</p>
                    <div className="space-y-1">{c.items.map(p => (
                      <button key={p.id} onClick={() => focusOnProject(p)} className="w-full text-left text-xs text-text-secondary hover:text-primary flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${p.status === "review" ? "bg-status-review" : p.status === "attention" ? "bg-status-attention" : "bg-status-normal"}`} />
                        {p.name}
                      </button>
                    ))}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Spatial AI Foundation */}
          <Card>
            <CardHeader><h3 className="text-sm font-semibold text-text-primary">Spatial AI Foundation</h3></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {["Property Location", "+", "Property Features", "+", "Construction Data", "+", "Inspection History", "+", "Geographic Data"].map((item, i) => (
                  <span key={i} className={`text-xs px-3 py-1.5 rounded-md ${item === "+" ? "text-text-muted font-bold" : "bg-surface-alt border border-border text-text-secondary"}`}>{item}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-4"><Zap className="h-4 w-4 text-primary" /><span className="text-sm font-semibold text-primary">Spatial Feature Engine</span></div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {["Regional Cost", "Property Risk", "Environmental Risk", "Construction Delay", "Market Intelligence"].map(m => (
                  <div key={m} className="p-2 rounded border border-dashed border-border text-center"><p className="text-xs text-text-muted">{m}</p><p className="text-[10px] text-status-attention">Future ML</p></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── COMPARISON VIEW ────────────────────────────────────────── */}
      {activeView === "comparison" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Compare Properties by Location</h3>
              <p className="text-sm text-text-muted">Select up to 3 properties to compare</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {allProjects.map(p => (
                  <button key={p.id} onClick={() => toggleCompare(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${compareSelection.includes(p.id) ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-text-secondary hover:bg-surface-alt"}`}>
                    <span className={`h-2 w-2 rounded-full ${p.status === "review" ? "bg-status-review" : p.status === "attention" ? "bg-status-attention" : "bg-status-normal"}`} />
                    {p.name}
                    {compareSelection.includes(p.id) && <X className="h-3 w-3" />}
                  </button>
                ))}
              </div>
              {compareProjects.length >= 2 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 text-xs font-medium text-text-muted">Property</th>
                      <th className="text-left py-2 text-xs font-medium text-text-muted">City</th>
                      <th className="text-left py-2 text-xs font-medium text-text-muted">District</th>
                      <th className="text-left py-2 text-xs font-medium text-text-muted">Area</th>
                      <th className="text-left py-2 text-xs font-medium text-text-muted">Stage</th>
                      <th className="text-left py-2 text-xs font-medium text-text-muted">Attention</th>
                      <th className="text-left py-2 text-xs font-medium text-text-muted">Issues</th>
                    </tr></thead>
                    <tbody>
                      {compareProjects.map(p => (
                        <tr key={p.id} className="border-b border-border">
                          <td className="py-3 font-medium text-text-primary">{p.name}</td>
                          <td className="py-3 text-text-secondary">{p.city}</td>
                          <td className="py-3 text-text-secondary">{p.district}</td>
                          <td className="py-3 text-text-secondary">{p.builtArea?.toLocaleString() || "—"} sq ft</td>
                          <td className="py-3 text-text-secondary">{getStageLabel(p.currentStage)}</td>
                          <td className="py-3"><span className={`font-bold ${ATTENTION_LEVEL_COLORS[p.attentionLevel]}`}>{p.attentionScore}</span></td>
                          <td className="py-3 text-text-secondary">{p.openIssues}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {compareProjects.length >= 2 && (
                <div className="p-3 rounded-lg bg-surface-alt border border-border">
                  <p className="text-xs font-medium text-text-primary mb-1">Spatial Context</p>
                  {compareProjects.length === 2 && (
                    <p className="text-xs text-text-secondary">Distance between {compareProjects[0].name} and {compareProjects[1].name}: {formatDistance(haversineDistance(compareProjects[0].lat, compareProjects[0].lng, compareProjects[1].lat, compareProjects[1].lng))}</p>
                  )}
                  {compareProjects.length === 3 && (
                    <p className="text-xs text-text-secondary">Geographic spread: {formatDistance(Math.max(haversineDistance(compareProjects[0].lat, compareProjects[0].lng, compareProjects[1].lat, compareProjects[1].lng), haversineDistance(compareProjects[0].lat, compareProjects[0].lng, compareProjects[2].lat, compareProjects[2].lng), haversineDistance(compareProjects[1].lat, compareProjects[1].lng, compareProjects[2].lat, compareProjects[2].lng)))}</p>
                  )}
                  <p className="text-[10px] text-text-muted mt-1">Distance is for reference only and does not imply property quality or value.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── PLANNING VIEW ──────────────────────────────────────────── */}
      {activeView === "planning" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">Engineer Site Planning</h3>
              <p className="text-sm text-text-muted">Select sites to plan your visit route</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {allProjects.map(p => (
                  <button key={p.id} onClick={() => togglePlanning(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${selectedForPlanning.includes(p.id) ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-text-secondary hover:bg-surface-alt"}`}>
                    <span className={`h-2 w-2 rounded-full ${p.status === "review" ? "bg-status-review" : p.status === "attention" ? "bg-status-attention" : "bg-status-normal"}`} />
                    {p.name}
                  </button>
                ))}
              </div>
              {planningProjects.length > 0 && (
                <div className="p-4 rounded-lg border border-border bg-surface-alt">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Selected Sites: {planningProjects.length}</p>
                      <p className="text-xs text-text-muted">Approximate geographic spread: {planningProjects.length >= 2 ? formatDistance(Math.max(...planningProjects.flatMap((a, i) => planningProjects.slice(i + 1).map(b => haversineDistance(a.lat, a.lng, b.lat, b.lng))))) : "Single site"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {planningProjects.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-1 text-xs">
                        <span className="text-text-primary">{p.name}</span>
                        <span className="text-text-muted">{p.city}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 rounded bg-surface-alt border border-border">
                    <p className="text-xs text-text-muted"><Info className="h-3 w-3 inline mr-1" />Route optimization requires a routing service. Current display shows selected sites and their geographic spread.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── SPATIAL MAP COMPONENT ──────────────────────────────────────────────────

function SpatialMap({ projects, onSelect, selectedId }: { projects: SpatialProject[]; onSelect: (p: SpatialProject) => void; selectedId?: string }) {
  return <SpatialMapInner projects={projects} onSelect={onSelect} selectedId={selectedId} />;
}

const SpatialMapInner = dynamic(
  () => Promise.resolve(({ projects, onSelect, selectedId }: { projects: SpatialProject[]; onSelect: (p: SpatialProject) => void; selectedId?: string }) => {
    const [ready, setReady] = useState(false);
    const mapRef = React.useRef<any>(null);

    useEffect(() => {
      let cancelled = false;
      const init = async () => {
        const L = (await import("leaflet")).default;
        const container = document.getElementById("spatial-main-map");
        if (!container || cancelled) return;

        // Clean up previous map instance
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = L.map(container, { scrollWheelZoom: true, zoomControl: true }).setView([10.8, 78.7], 7);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).addTo(map);
        mapRef.current = map;

        if (!cancelled) {
          setReady(true);
        }
      };

      init();
      return () => { cancelled = true; };
    }, []);

    // Update markers when projects or selectedId change
    useEffect(() => {
      if (!ready || !mapRef.current) return;
      const map = mapRef.current;
      const L = (window as any).L;
      if (!L) return;

      // Remove old markers (keep tile layer)
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.DivIcon) {
          map.removeLayer(layer);
        }
      });

      projects.forEach(p => {
        if (!p.lat || !p.lng) return;
        const color = ATTENTION_COLORS[p.status];
        const bgColor = ATTENTION_BG_COLORS[p.status];
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="position:relative;width:36px;height:36px"><div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:${bgColor};border:3px solid ${color};transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2)"><span style="transform:rotate(45deg);font-size:11px;font-weight:bold;color:${color}">${p.attentionScore}</span></div>${p.id===selectedId?`<div style="position:absolute;top:-6px;left:-6px;width:48px;height:48px;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:pulse 1.5s infinite"></div>`:""}</div>`,
          iconSize: [36, 36], iconAnchor: [18, 36],
        });
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        marker.bindPopup(`<div style="min-width:180px;font-family:system-ui"><div style="font-weight:600;font-size:13px;margin-bottom:2px">${p.name}</div><div style="font-size:11px;color:#64748b;margin-bottom:6px">${p.city}</div><div style="font-size:11px"><b>Stage:</b> ${getStageLabel(p.currentStage)}<br/><b>Attention:</b> <span style="color:${color}">${p.attentionScore}/100</span><br/><b>Issues:</b> ${p.openIssues}</div><div style="margin-top:6px"><a href="/engineer/sites/${p.id}" style="display:inline-block;padding:3px 10px;background:#1a56db;color:white;border-radius:3px;text-decoration:none;font-size:11px">Open Site</a></div></div>`);
        marker.on("click", () => onSelect(p));
      });

      const bounds = projects.filter(p => p.lat && p.lng).map(p => [p.lat, p.lng] as [number, number]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      }
    }, [ready, projects, selectedId, onSelect]);

    return <div id="spatial-main-map" className="h-full w-full" style={{ minHeight: '400px' }} />;
  }),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-text-muted">Loading map...</div> }
);

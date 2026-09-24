"use client";

// ─── Layout Studio ──────────────────────────────────────────────────────────
// Upload a floor-plan/layout image → Hugging Face model analyzes it in the
// browser → human corrects the extracted rooms → corrections train the
// layout head → plan saved → 3D virtual tour rendered.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, Brain, Loader2, CheckCircle2, AlertTriangle, Box,
  Trash2, DoorOpen, Ruler, Save, Eye, RefreshCw, Info, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VirtualTour } from "@/components/layout/VirtualTour";
import {
  analyzeLayoutImage, getHeadInfo, trainFromCorrection, unionAreaSqFt,
} from "@/lib/ai/layout/analyze";
import type {
  LayoutAnalysis, LayoutCorrectionKind, LayoutPlanGeometry, Room, Wall, Opening,
} from "@/lib/ai/layout/types";

export interface LayoutPlanRecord {
  id: string;
  title: string;
  floorLabel: string;
  fileUrl: string;
  fileName: string | null;
  widthPx: number | null;
  heightPx: number | null;
  scaleFeetPerPx: number | null;
  rooms: string;
  walls: string;
  openings: string;
  stats: string | null;
  correctionsCount: number;
  createdAt: string;
}

interface LayoutStudioProps {
  projectId: string;
  projectName: string;
  plans: LayoutPlanRecord[];
  onPlansChanged: () => void;
}

type Phase = "idle" | "analyzing" | "review" | "saved";

export function LayoutStudio({ projectId, projectName, plans, onPlansChanged }: LayoutStudioProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<{ msg: string; pct: number }>({ msg: "", pct: 0 });
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LayoutAnalysis | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState("");
  const [scaleFt, setScaleFt] = useState<string>("80");
  const [imgWidth, setImgWidth] = useState<number>(1000);
  const [imgHeight, setImgHeight] = useState<number>(750);
  const [headInfo, setHeadInfo] = useState<{ samples: number; lossHistory: number[] }>(() => getHeadInfo());
  const [deviceInfo, setDeviceInfo] = useState<string>("");
  const [activePlan, setActivePlan] = useState<LayoutPlanRecord | null>(null);

  // ─── Geometry editing primitives ────────────────────────────────────────
  const currentGeometry = useCallback((): LayoutPlanGeometry => {
    if (!analysis) return { rooms: [], walls: [], openings: [] };
    return { rooms: analysis.rooms, walls: analysis.walls, openings: analysis.openings };
  }, [analysis]);

  const runAnalysis = useCallback(async (file: File) => {
    setError(null);
    setPhase("analyzing");
    setProgress({ msg: "Loading image…", pct: 2 });

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.src = url;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Could not read that image file"));
    });
    imgRef.current = img;
    setImgWidth(img.naturalWidth || 1000);
    setImgHeight(img.naturalHeight || 750);

    try {
      const { analysis: result, depth } = await analyzeLayoutImage(img, {
        onProgress: (msg, pct) => setProgress({ msg, pct: pct ?? 0 }),
      });
      setAnalysis(result);
      setDeviceInfo(`${depth.modelId.split("/")[1]} · ${depth.device} · load ${depth.loadMs}ms · infer ${depth.inferMs}ms`);
      setPhase("review");
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Analysis failed. WebGPU/WASM may be unavailable in this browser.");
      setPhase("idle");
    }
  }, []);

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void runAnalysis(file);
    e.target.value = "";
  };

  // ─── Corrections (each one trains the head) ─────────────────────────────
  const applyCorrection = (kind: string, mutate: (g: LayoutPlanGeometry) => LayoutPlanGeometry) => {
    if (!analysis) return;
    const before = currentGeometry();
    const after = mutate({
      rooms: [...analysis.rooms],
      walls: [...analysis.walls],
      openings: [...analysis.openings],
    });
    const update = trainFromCorrection(before, after, kind as LayoutCorrectionKind);
    setHeadInfo({ samples: update.samplesAfter, lossHistory: getHeadInfo().lossHistory });
    setAnalysis({
      ...analysis,
      rooms: after.rooms,
      walls: after.walls,
      openings: after.openings,
      stats: {
        ...analysis.stats,
        roomCount: after.rooms.length,
        doorCount: after.openings.filter(o => o.kind !== "window").length,
        windowCount: after.openings.filter(o => o.kind === "window").length,
        totalAreaSqFt: computeTotalArea(after.rooms),
        trainingSamples: update.samplesAfter,
      },
    });
  };

  const deleteRoom = (roomId: string) =>
    applyCorrection("delete_room", (g) => ({
      ...g,
      rooms: g.rooms.filter(r => r.id !== roomId),
      openings: g.openings.filter((_, i) => i < g.rooms.length), // rough reindex
    }));

  const renameRoom = (roomId: string, label: string) =>
    applyCorrection("rename_room", (g) => ({
      ...g,
      rooms: g.rooms.map(r => (r.id === roomId ? { ...r, label, confirmed: true } : r)),
    }));

  const toggleDoor = (roomId: string) =>
    applyCorrection("set_door", (g) => {
      const room = g.rooms.find(r => r.id === roomId);
      if (!room) return g;
      const existing = g.openings.find(o => o.kind === "door" && Math.abs(o.t - 0.35) < 0.001 && o.id.endsWith(roomId));
      if (existing) {
        return { ...g, openings: g.openings.filter(o => o.id !== existing.id) };
      }
      const opening: Opening = {
        id: `door-${roomId}`,
        kind: "door",
        t: 0.35,
        widthFt: 3,
        sillFt: 0,
        headFt: 7,
      };
      return { ...g, openings: [...g.openings, opening] };
    });

  const mergeWithNext = (roomId: string) =>
    applyCorrection("merge_rooms", (g) => {
      const idx = g.rooms.findIndex(r => r.id === roomId);
      if (idx === -1 || idx + 1 >= g.rooms.length) return g;
      const a = g.rooms[idx];
      const b = g.rooms[idx + 1];
      const merged: Room = {
        id: a.id,
        label: a.label,
        polygon: [
          { x: Math.min(a.polygon[0].x, b.polygon[0].x), y: Math.min(a.polygon[0].y, b.polygon[0].y) },
          { x: Math.max(a.polygon[1].x, b.polygon[1].x), y: Math.min(a.polygon[1].y, b.polygon[1].y) },
          { x: Math.max(a.polygon[2].x, b.polygon[2].x), y: Math.max(a.polygon[2].y, b.polygon[2].y) },
          { x: Math.min(a.polygon[3].x, b.polygon[3].x), y: Math.max(a.polygon[3].y, b.polygon[3].y) },
        ],
        confirmed: true,
      };
      const rooms = [...g.rooms];
      rooms.splice(idx, 2, merged);
      return { ...g, rooms };
    });

  const retrainPreview = () => {
    // Re-run just the vectorizer on the same depth/image — cheap, shows learning.
    if (!imgRef.current || !analysis) return;
    void runAnalysisSilent();
  };

  const runAnalysisSilent = async () => {
    if (!imgRef.current) return;
    try {
      const { analysis: result } = await analyzeLayoutImage(imgRef.current);
      setAnalysis(result);
    } catch { /* keep current */ }
  };

  // ─── Canvas preview: image + room overlay ───────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !analysis) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxW = 560;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#65a30d"];
    analysis.rooms.forEach((room, i) => {
      ctx.beginPath();
      room.polygon.forEach((p, j) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      const color = COLORS[i % COLORS.length];
      ctx.fillStyle = `${color}22`;
      ctx.fill();
      ctx.lineWidth = selectedRoom === room.id ? 4 : 2.5;
      ctx.strokeStyle = color;
      ctx.stroke();
      const cx = room.polygon.reduce((s, p) => s + p.x, 0) / room.polygon.length;
      const cy = room.polygon.reduce((s, p) => s + p.y, 0) / room.polygon.length;
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText(room.label, cx * canvas.width, cy * canvas.height);
    });
  }, [analysis, selectedRoom, previewUrl]);

  // ─── Save to server ─────────────────────────────────────────────────────
  const savePlan = async () => {
    if (!analysis || !imgRef.current || !previewUrl) return;
    setError(null);
    try {
      const blob = await (await fetch(previewUrl)).blob();
      const file = new File([blob], "layout.jpg", { type: "image/jpeg" });
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", projectId);
      form.append("title", `Layout — ${projectName}`);
      form.append("floorLabel", "Ground Floor");
      form.append("width", String(imgRef.current.naturalWidth));
      form.append("height", String(imgRef.current.naturalHeight));
      form.append("scaleFeetPerPx", String(Number(scaleFt || 80) / imgRef.current.naturalWidth));
      form.append("rooms", JSON.stringify(analysis.rooms));
      form.append("walls", JSON.stringify(analysis.walls));
      form.append("openings", JSON.stringify(analysis.openings));
      form.append("stats", JSON.stringify({ ...analysis.stats, totalAreaSqFt: computeTotalArea(analysis.rooms) }));

      const res = await fetch("/api/layouts", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setPhase("saved");
      onPlansChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save layout");
    }
  };

  const openPlanForEdit = async (plan: LayoutPlanRecord) => {
    setActivePlan(plan);
    try {
      const res = await fetch(`/api/layouts/${plan.id}`);
      const data = await res.json();
      if (res.ok) {
        const geo: LayoutPlanGeometry = {
          rooms: safeParse<Room[]>(data.rooms, []),
          walls: safeParse<Wall[]>(data.walls, []),
          openings: safeParse<Opening[]>(data.openings, []),
        };
        setPreviewUrl(data.fileUrl);
        setAnalysis({
          ...geo,
          stats: safeParse(data.stats, {
            totalAreaSqFt: 0, roomCount: geo.rooms.length, doorCount: 0, windowCount: 0,
            wallCount: geo.walls.length, extractionConfidence: 1, trainingSamples: data.correctionsCount,
          }),
        });
        setPhase("review");
        // Load the stored image so edits render on top of it.
        const img = new Image();
        img.src = data.fileUrl;
        await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); });
        imgRef.current = img;
        setImgWidth(img.naturalWidth || 1000);
        setImgHeight(img.naturalHeight || 750);
      }
    } catch { /* keep previous state */ }
  };

  /** Total floor area in sq ft as the UNION of room polygons — overlap-safe
   * (naive per-room summation double-counts rooms that share edges). */
  const computeTotalArea = (rooms: Room[]): number => {
    const planW = Number(scaleFt || 80);
    const aspect = imgWidth > 0 ? imgHeight / imgWidth : 0.75;
    return unionAreaSqFt(rooms, planW, aspect);
  };

  const stats = analysis?.stats;

  return (
    <div className="space-y-5">
      {/* Model / head status strip */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5 font-medium text-text-secondary">
              <Brain className="h-3.5 w-3.5 text-accent" />
              Hugging Face · Depth Anything V2 (in-browser)
            </span>
            {deviceInfo && <span>· {deviceInfo}</span>}
            <span>· head training samples: <strong className="text-text-primary">{headInfo.samples}</strong></span>
            {headInfo.lossHistory.length > 1 && (
              <span>· last loss: <strong className="text-text-primary">{headInfo.lossHistory.at(-1)}</strong></span>
            )}
            <button
              onClick={() => setHeadInfo(getHeadInfo())}
              className="ml-auto inline-flex items-center gap-1 hover:text-text-primary"
            >
              <RefreshCw className="h-3 w-3" /> refresh
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Upload zone */}
      {phase === "idle" && (
        <Card>
          <CardContent className="py-6 sm:py-10">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border-strong rounded-xl px-4 py-10 sm:py-12 text-center cursor-pointer hover:border-accent hover:bg-accent/5 active:bg-accent/10 transition-colors"
            >
              <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary">Upload a floor plan or layout image</p>
              <p className="text-xs text-text-muted mt-1">
                JPEG / PNG / WebP · analyzed privately on your device — nothing leaves your phone
              </p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePick} />
            </div>
            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-danger-bg border border-danger-border text-sm text-text-primary">
                <AlertTriangle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analyzing */}
      {phase === "analyzing" && (
        <Card>
          <CardContent className="py-12">
            <div className="max-w-md mx-auto text-center">
              <Loader2 className="h-8 w-8 text-accent animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-text-primary">{progress.msg}</p>
              <div className="h-2 bg-surface-alt rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress.pct}%` }} />
              </div>
              <p className="text-xs text-text-muted mt-3">
                First run downloads the model (~50 MB) and caches it in your browser.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review / correct */}
      {(phase === "review" || phase === "saved") && analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-w-0">
          {/* Plan + overlay */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Extracted layout</h3>
                <span className="text-xs text-text-muted">
                  {stats?.roomCount ?? 0} rooms · {stats?.doorCount ?? 0} doors · {stats?.windowCount ?? 0} windows
                </span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-border bg-surface-alt">
                <canvas ref={canvasRef} className="w-full h-auto" />
                {!previewUrl && <div className="absolute inset-0 grid place-items-center text-xs text-text-muted">No image</div>}
              </div>

              {/* Correction tools */}
              {phase === "review" && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-text-muted flex items-center gap-1">
                    <Info className="h-3 w-3" /> Select a room, then correct it — every correction trains the model.
                  </p>                  <div className="flex flex-wrap gap-2">
                    {analysis.rooms.map((room, i) => (
                      <button
                        key={room.id}
                        onClick={() => { setSelectedRoom(room.id); setPendingLabel(room.label); }}
                        className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors min-h-[36px] ${
                          selectedRoom === room.id
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-text-secondary hover:bg-surface-alt"
                        }`}>
                        {room.label || `Room ${i + 1}`}
                      </button>
                    ))}
                  </div>
                  {selectedRoom && (
                    <div className="p-3 rounded-lg bg-surface-alt border border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={pendingLabel}
                          onChange={(e) => setPendingLabel(e.target.value)}
                          className="flex-1 rounded-md border border-border px-2 py-1.5 text-sm"
                          placeholder="Room name (Kitchen, Bedroom 1…)"
                        />
                        <Button size="sm" onClick={() => { if (selectedRoom) renameRoom(selectedRoom, pendingLabel || "Room"); }}>
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => selectedRoom && toggleDoor(selectedRoom)}>
                          <DoorOpen className="h-3.5 w-3.5 mr-1" /> Toggle door
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => selectedRoom && mergeWithNext(selectedRoom)}>
                          <Box className="h-3.5 w-3.5 mr-1" /> Merge with next
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => selectedRoom && deleteRoom(selectedRoom)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete room
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedRoom(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Ruler className="h-3.5 w-3.5 text-text-muted" />
                    <label className="text-xs text-text-muted whitespace-nowrap">Plan width (ft):</label>
                    <input
                      value={scaleFt}
                      onChange={(e) => setScaleFt(e.target.value)}
                      className="w-20 rounded-md border border-border px-2 py-1 text-xs"
                    />
                    <Button size="sm" variant="secondary" onClick={retrainPreview}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Re-run extraction
                    </Button>
                  </div>
                </div>
              )}

              {/* Save bar */}
              {phase === "review" && (
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Button onClick={savePlan} className="flex-1 w-full sm:w-auto">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save layout & open tour
                  </Button>
                  <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { setPhase("idle"); setAnalysis(null); setPreviewUrl(null); }}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats + tour */}
          <div className="space-y-5">
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Plan metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Metric label="Total area" value={`${stats?.totalAreaSqFt?.toFixed(0) ?? 0} sq ft`} />
                  <Metric label="Rooms" value={String(stats?.roomCount ?? 0)} />
                  <Metric label="Doors" value={String(stats?.doorCount ?? 0)} />
                  <Metric label="Windows" value={String(stats?.windowCount ?? 0)} />
                  <Metric label="Confidence" value={`${Math.round((stats?.extractionConfidence ?? 0) * 100)}%`} />
                  <Metric label="Training samples" value={String(stats?.trainingSamples ?? headInfo.samples)} />
                </div>
                {headInfo.lossHistory.length > 2 && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="text-[11px] text-text-muted mb-1">Head training loss (lower = better):</p>
                    <Sparkline values={headInfo.lossHistory} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Virtual tour of your future home</h3>
                <VirtualTour
                  geometry={currentGeometry()}
                  scaleFeetPerPx={Number(scaleFt || 80) / imgWidth}
                  floorLabel={activePlan?.floorLabel ?? "Ground Floor"}
                />
                <p className="text-xs text-text-muted mt-2">
                  Drag to orbit · pinch or scroll to zoom · on phones use the touch pad in walk mode.
                </p>
                {phase === "saved" && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { setPhase("idle"); setAnalysis(null); setPreviewUrl(null); setActivePlan(null); }}>
                      <Upload className="h-3.5 w-3.5 mr-1" /> Upload another layout
                    </Button>
                    <Button variant="ghost" className="w-full sm:w-auto" onClick={() => fileRef.current?.click()}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Re-analyze new file
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePick} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Saved plans */}
      {plans.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Saved layouts ({plans.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => openPlanForEdit(plan)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    activePlan?.id === plan.id ? "border-accent bg-accent/5" : "border-border hover:border-border-strong hover:bg-surface-alt"
                  }`}
                >
                  <p className="text-sm font-medium text-text-primary truncate">{plan.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">{plan.floorLabel} · {plan.correctionsCount} corrections</p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {new Date(plan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && phase !== "idle" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-bg border border-danger-border text-sm">
          <AlertTriangle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-surface-alt text-center">
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 0.001);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" className="w-full h-8">
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

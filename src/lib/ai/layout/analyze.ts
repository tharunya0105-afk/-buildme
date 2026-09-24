// ─── Layout Analysis Pipeline ───────────────────────────────────────────────

import { estimateDepth } from "./depth";
import { extractLayoutFromDepth } from "./head";
import type { DepthResult, LayoutAnalysis } from "./types";

export { DEPTH_MODEL_ID, isModelReady, getLoadedDevice } from "./depth";
export { getHeadInfo, trainFromCorrection, resetHead } from "./head";
export type { TrainingUpdate } from "./head";

export interface AnalyzeOptions {
  onProgress?: (msg: string, pct?: number) => void;
}

/**
 * Full pipeline: draw the image to a canvas, run the Hugging Face depth
 * model, then extract a vector floor plan with the trainable head.
 */
export async function analyzeLayoutImage(
  img: HTMLImageElement,
  opts: AnalyzeOptions = {}
): Promise<{ analysis: LayoutAnalysis; depth: DepthResult }> {
  const { onProgress } = opts;
  onProgress?.("Preparing image…", 5);

  // Draw to canvas at a sane working resolution (depth model downsamples anyway).
  const maxDim = 1024;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(64, Math.round(img.naturalWidth * scale));
  const h = Math.max(64, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);

  onProgress?.("Running Hugging Face depth model…", 25);
  const depth = await estimateDepth(canvas, (p) => {
    if (p.status === "progress" && p.file && typeof p.progress === "number") {
      onProgress?.(`Downloading model (${p.file})`, Math.round(p.progress));
    } else if (p.status === "ready") {
      onProgress?.("Model ready — analyzing…", 45);
    }
  });

  onProgress?.("Extracting floor plan…", 75);
  const analysis = extractLayoutFromDepth(imageData, depth.depth, depth.width, depth.height);
  analysis.stats.depthError = depth.error;
  analysis.stats.extractionConfidence = Math.max(
    0.05,
    Math.min(1, analysis.stats.extractionConfidence * (1 - depth.error * 0.5))
  );

  onProgress?.("Done", 100);
  return { analysis, depth };
}

/**
 * Total floor area in sq ft as the UNION of room polygons (overlap-safe).
 * Naive per-polygon summation double-counts adjacent rooms that share edges
 * or overlap; rasterizing the union fixes that.
 */
export function unionAreaSqFt(
  rooms: Array<{ polygon: Array<{ x: number; y: number }> }>,
  planWidthFt: number,
  planAspect: number
): number {
  const N = 220;
  const grid = new Uint8Array(N * N);
  for (const room of rooms) {
    const poly = room.polygon ?? [];
    if (poly.length < 3) continue;
    for (let gy = 0; gy < N; gy++) {
      for (let gx = 0; gx < N; gx++) {
        const x = (gx + 0.5) / N;
        const y = (gy + 0.5) / N;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const yi = poly[i].y, yj = poly[j].y;
          if ((yi > y) !== (yj > y)) {
            const xi = poly[i].x + ((y - yi) / (yj - yi)) * (poly[j].x - poly[i].x);
            if (x < xi) inside = !inside;
          }
        }
        if (inside) grid[gy * N + gx] = 1;
      }
    }
  }
  let cells = 0;
  for (let i = 0; i < grid.length; i++) cells += grid[i];
  return Math.round((cells / (N * N)) * planWidthFt * (planWidthFt * planAspect) * 10) / 10;
}

/** Compute a data-URL thumbnail for previews. */
export function imageToDataUrl(img: HTMLImageElement, maxDim = 512): string {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

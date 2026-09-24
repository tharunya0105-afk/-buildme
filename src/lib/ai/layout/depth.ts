"use client";

// ─── Hugging Face Model Wrapper (client-side, Transformers.js) ─────────────
// Imports Depth Anything V2 (small) from the Hugging Face Hub and runs it
// entirely in the browser via WebGPU when available, falling back to WASM.
// The model is downloaded once and cached by the browser Cache API, so
// subsequent visits load instantly with zero server cost.

import type { DepthEstimationPipeline } from "@huggingface/transformers";
import type { DepthResult } from "./types";

export const DEPTH_MODEL_ID = "onnx-community/depth-anything-v2-small";

type ProgressCallback = (p: {
  status: string;
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}) => void;

// Minimal structural type for the version-dependent model output (RawImage or Tensor).
type RawDepthOutput = {
  width: number;
  height: number;
  channels?: number;
  data: Uint8Array | Uint8ClampedArray | Float32Array;
  dims?: number[];
};

let pipelinePromise: Promise<DepthEstimationPipeline> | null = null;
let loadedDevice: string = "unknown";

/**
 * Lazy-load the HF depth-estimation pipeline.
 * WebGPU first (fast), graceful fallback to WASM.
 */
async function getPipeline(onProgress?: ProgressCallback): Promise<DepthEstimationPipeline> {
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    // Bundled workers can break under Next's dev compiler; run on the main thread.
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    const devices = ["webgpu", "wasm"];
    let lastErr: unknown = null;
    for (const device of devices) {
      try {
        const pipe = await pipeline("depth-estimation", DEPTH_MODEL_ID, {
          device: device as "webgpu" | "wasm",
          dtype: device === "webgpu" ? { encoder_model: "fp32", decoder_model_merged: "fp32" } : "q8",
          progress_callback: onProgress,
        });
        loadedDevice = device;
        return pipe;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Failed to load depth model");
  })();

  return pipelinePromise;
}

/** True once a pipeline has been successfully created this session. */
export function isModelReady(): boolean {
  return pipelinePromise !== null;
}

export function getLoadedDevice(): string {
  return loadedDevice;
}

/**
 * Run monocular depth estimation on an HTMLImageElement / canvas.
 */
export async function estimateDepth(
  image: HTMLImageElement | HTMLCanvasElement,
  onProgress?: ProgressCallback
): Promise<DepthResult> {
  const t0 = performance.now();
  const pipe = await getPipeline(onProgress);
  const loadMs = Math.round(performance.now() - t0);

  const t1 = performance.now();
  const outRaw = await pipe(image as HTMLCanvasElement);
  const out = outRaw as unknown as {
    depth?: RawDepthOutput | RawDepthOutput[];
    predicted_depth?: RawDepthOutput;
  };
  const inferMs = Math.round(performance.now() - t1);

  // Transformers.js returns different shapes depending on version:
  //  - out.depth: RawImage (data Uint8Array, width, height, channels) or Tensor
  //  - out.predicted_depth: Tensor [B,H,W] or [H,W]
  // Normalize everything to a single-channel Float32Array 0..1 (1 = nearest).
  let w: number;
  let h: number;
  let mono: Float32Array;

  const raw = (Array.isArray(out.depth) ? out.depth[0] : (out.depth ?? out.predicted_depth)) as unknown as RawDepthOutput | undefined;

  if (raw && typeof raw.width === "number" && raw.data && !(raw.dims)) {
    // RawImage path
    w = raw.width;
    h = raw.height;
    const channels = typeof raw.channels === "number" ? raw.channels : 1;
    const src = raw.data as Uint8Array | Uint8ClampedArray | Float32Array;
    mono = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const v = src[i * channels];
      mono[i] = channels >= 1 && v <= 1 ? v : v / 255;
    }
  } else if (raw && Array.isArray(raw.dims) && raw.data) {
    // Tensor path
    const dims: number[] = raw.dims;
    const src = raw.data as Float32Array;
    if (dims.length === 3) {
      [, h, w] = dims;
    } else if (dims.length === 2) {
      [h, w] = dims;
    } else {
      h = Math.round(Math.sqrt(src.length));
      w = h;
    }
    mono = new Float32Array(w * h);
    mono.set(src.subarray(0, Math.min(src.length, w * h)));
  } else {
    throw new Error("Depth model returned an unexpected output format");
  }

  // Normalize to 0..1 with 1 = nearest (HF convention: higher = closer).
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < mono.length; i++) {
    if (mono[i] < min) min = mono[i];
    if (mono[i] > max) max = mono[i];
  }
  const range = max - min || 1;
  const norm = new Float32Array(mono.length);
  let errSum = 0;
  for (let i = 0; i < mono.length; i++) {
    norm[i] = (mono[i] - min) / range;
    // Depth-gradient magnitude as a local "uncertainty" proxy.
    if (i >= w) errSum += Math.abs(norm[i] - norm[i - w]);
  }
  const error = errSum / Math.max(1, mono.length - w);

  return {
    depth: norm,
    width: w,
    height: h,
    error: Math.min(1, error * 4),
    modelId: DEPTH_MODEL_ID,
    device: loadedDevice,
    loadMs,
    inferMs,
  };
}

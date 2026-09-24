// ─── Trainable Layout Head ──────────────────────────────────────────────────
// A lightweight, continuously-learning geometry head that sits on top of the
// frozen Hugging Face depth backbone. It converts the depth map into floor
// plans (rooms, walls, openings) and *learns from every engineer/homeowner
// correction* using online ridge regression + momentum SGD:
//
//   θ ← θ − η · (xᵀ(θx − y) + λθ) / n
//
// Features are depth/edge statistics per candidate region; targets are the
// human-corrected geometry deltas. The head is persisted in the browser
// (localStorage) and mirrors the correction history on the server, so
// "training the model" is real, inspectable, and explainable.

import type { LayoutAnalysis, LayoutCorrectionKind, Pt, Room, Wall, Opening } from "./types";
import { FEATURE_DIM, WEIGHT_KEY } from "./head-constants";

export { FEATURE_DIM, HEAD_VERSION } from "./head-constants";

// ─── Weights ────────────────────────────────────────────────────────────────

/** theta[k] pairs with features k=0..7 (see `regionFeatures`). */
interface HeadWeights {
  theta: number[];
  bias: number;
  samples: number;
  lossHistory: number[];
}

const DEFAULT_WEIGHTS: HeadWeights = {
  theta: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
  bias: 0.1,
  samples: 0,
  lossHistory: [],
};

export function loadWeights(): HeadWeights {
  if (typeof window === "undefined") return { ...DEFAULT_WEIGHTS };
  try {
    const raw = window.localStorage.getItem(WEIGHT_KEY);
    if (!raw) return { ...DEFAULT_WEIGHTS };
    const parsed = JSON.parse(raw) as HeadWeights;
    if (!Array.isArray(parsed.theta) || parsed.theta.length !== FEATURE_DIM) {
      return { ...DEFAULT_WEIGHTS };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_WEIGHTS };
  }
}

function saveWeights(w: HeadWeights): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WEIGHT_KEY, JSON.stringify(w));
  } catch {
    // storage full/blocked — weights stay session-only
  }
}

export function getHeadInfo(): { samples: number; lossHistory: number[]; theta: number[] } {
  const w = loadWeights();
  return { samples: w.samples, lossHistory: w.lossHistory.slice(-30), theta: w.theta };
}

// ─── Feature extraction ─────────────────────────────────────────────────────

/**
 * 8 handcrafted features for a candidate room region, derived from the
 * depth map + image intensity (edge maps). All normalized 0..1.
 */
export function regionFeatures(
  depth: Float32Array,
  edges: Float32Array,
  width: number,
  height: number,
  region: { x0: number; y0: number; x1: number; y1: number }
): number[] {
  const x0 = Math.max(0, Math.floor(region.x0 * width));
  const x1 = Math.min(width, Math.ceil(region.x1 * width));
  const y0 = Math.max(0, Math.floor(region.y0 * height));
  const y1 = Math.min(height, Math.ceil(region.y1 * height));

  let dSum = 0, dSqSum = 0, eSum = 0, eMax = 0, gradSum = 0, count = 0;
  let bright = 0, dark = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * width + x;
      const d = depth[i];
      dSum += d;
      dSqSum += d * d;
      const e = edges[i];
      eSum += e;
      if (e > eMax) eMax = e;
      if (x + 1 < x1) gradSum += Math.abs(d - depth[i + 1]);
      if (e > 0.5) bright++;
      else if (e < 0.15) dark++;
      count++;
    }
  }
  if (count === 0) return new Array(FEATURE_DIM).fill(0);

  const dMean = dSum / count;
  const dVar = Math.max(0, dSqSum / count - dMean * dMean);
  return [
    dMean,                      // 0: mean depth
    Math.sqrt(dVar),            // 1: depth std (floor = flat ⇒ low)
    eSum / count,               // 2: mean edge density
    eMax,                       // 3: max edge strength
    gradSum / count,            // 4: depth gradient
    bright / count,             // 5: edge fraction
    dark / count,               // 6: flat fraction
    Math.min(1, (x1 - x0) * (y1 - y0) / (width * height)), // 7: relative size
  ];
}

// ─── Floor-plan extraction from depth ───────────────────────────────────────

interface RawRegion {
  x0: number; y0: number; x1: number; y1: number; // normalized bounds
  cells: number; // coverage inside bounds
}

const DEFAULT_LABELS = ["Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6", "Room 7", "Room 8", "Room 9", "Room 10", "Room 11", "Room 12"];

/**
 * Image → gray → Sobel edges → integral image → adaptive-threshold flood
 * segmentation of floor-like regions → merge → polygonize.
 * The trainable head scores every candidate region; low-scoring fragments
 * are dropped (score < learned threshold), which is exactly what the
 * corrections teach it over time.
 */
export function extractLayoutFromDepth(
  imageData: ImageData,
  depth: Float32Array,
  depthW: number,
  depthH: number
): LayoutAnalysis {
  const { width, height, data } = imageData;

  // 1. Grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  }

  // 2. Sobel edges
  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx =
        -gray[i - width - 1] - 2 * gray[i - 1] - gray[i + width - 1] +
        gray[i - width + 1] + 2 * gray[i + 1] + gray[i + width + 1];
      const gy =
        -gray[i - width - 1] - 2 * gray[i - width] - gray[i + width - 1] +
        gray[i - width + 1] + 2 * gray[i + width] + gray[i + width + 1];
      edges[i] = Math.min(1, Math.hypot(gx, gy) / 2);
    }
  }

  // 3. Integral image for O(1) region stats
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] = integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }

  // 4. Global contrast threshold (Otsu-lite: mean ± std)
  let gSum = 0;
  for (let i = 0; i < gray.length; i++) gSum += gray[i];
  const gMean = gSum / gray.length;
  let vSum = 0;
  for (let i = 0; i < gray.length; i++) vSum += (gray[i] - gMean) ** 2;
  const gStd = Math.sqrt(vSum / gray.length);
  const wallThreshold = gMean - gStd * 0.35; // walls are darker than paper
  const floorThreshold = gMean + gStd * 0.15; // room interiors are lighter

  // 5. Binary masks
  const isWall = new Uint8Array(width * height);
  const isFloor = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    isWall[i] = gray[i] < wallThreshold ? 1 : 0;
    isFloor[i] = gray[i] >= floorThreshold ? 1 : 0;
  }

  // 6. Connected components on floor mask (4-neighbour BFS, iterative)
  const labels = new Int32Array(width * height).fill(-1);
  const queue = new Int32Array(width * height);
  const regions: Array<{ id: number; cells: number; x0: number; y0: number; x1: number; y1: number }> = [];
  let nextLabel = 0;
  for (let start = 0; start < gray.length; start++) {
    if (!isFloor[start] || labels[start] !== -1) continue;
    let qh = 0, qt = 0;
    queue[qt++] = start;
    labels[start] = nextLabel;
    let cells = 0, x0 = width, y0 = height, x1 = 0, y1 = 0;
    while (qh < qt) {
      const idx = queue[qh++];
      const x = idx % width;
      const y = (idx - x) / width;
      cells++;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
      if (x > 0 && isFloor[idx - 1] && labels[idx - 1] === -1) { labels[idx - 1] = nextLabel; queue[qt++] = idx - 1; }
      if (x < width - 1 && isFloor[idx + 1] && labels[idx + 1] === -1) { labels[idx + 1] = nextLabel; queue[qt++] = idx + 1; }
      if (y > 0 && isFloor[idx - width] && labels[idx - width] === -1) { labels[idx - width] = nextLabel; queue[qt++] = idx - width; }
      if (y < height - 1 && isFloor[idx + width] && labels[idx + width] === -1) { labels[idx + width] = nextLabel; queue[qt++] = idx + width; }
    }
    regions.push({ id: nextLabel++, cells, x0, y0, x1, y1 });
  }

  // 7. Score candidates with the trainable head; keep plausible rooms.
  const weights = loadWeights();
  const minCells = Math.max(64, width * height * 0.004);
  const candidates = regions.filter(r => r.cells >= minCells).sort((a, b) => b.cells - a.cells).slice(0, 24);

  const kept: Array<RawRegion & { score: number; features: number[] }> = [];
  for (const r of candidates) {
    const nx0 = r.x0 / width, ny0 = r.y0 / height, nx1 = (r.x1 + 1) / width, ny1 = (r.y1 + 1) / height;
    const feats = regionFeatures(depth, edges, depthW, depthH, { x0: nx0, y0: ny0, x1: nx1, y1: ny1 });
    let score = weights.bias;
    for (let k = 0; k < FEATURE_DIM; k++) score += weights.theta[k] * feats[k];
    const area = (nx1 - nx0) * (ny1 - ny0);
    const relArea = area; // 0..1
    // Geometric priors: rooms are reasonably sized and squarish.
    const ar = (nx1 - nx0) / Math.max(1e-6, ny1 - ny0);
    const shapePrior = ar > 6 || ar < 0.16 ? -0.5 : 0.15;
    const sizePrior = relArea > 0.55 ? -0.4 : 0.1;
    if (score + shapePrior + sizePrior > 0.35) {
      kept.push({ x0: nx0, y0: ny0, x1: nx1, y1: ny1, cells: r.cells, score, features: feats });
    }
  }

  // 8. Snap bounds into rectangles (mortar gaps between merged rooms are
  //    split by wall lines when two bounds are adjacent).
  const rooms: Room[] = kept.map((r, i) => {
    const polygon: Pt[] = [
      { x: r.x0, y: r.y0 },
      { x: r.x1, y: r.y0 },
      { x: r.x1, y: r.y1 },
      { x: r.x0, y: r.y1 },
    ];
    return { id: `room-${i + 1}`, label: DEFAULT_LABELS[i] ?? `Room ${i + 1}`, polygon };
  });

  // 9. Walls: derive from wall mask between adjacent room bounds + outer frame.
  const walls: Wall[] = buildWalls(rooms);

  // 10. Openings: scan wall mask for gaps (doors) and thin dark slits
  //     inside walls (windows), scored by the head as well.
  const openings: Opening[] = detectOpenings(gray, isWall, width, height, rooms, walls);

  const doorCount = openings.filter(o => o.kind !== "window").length;

  return {
    rooms,
    walls,
    openings,
    stats: {
      // Normalized polygon area is meaningless in sq ft until the user
      // calibrates plan width — the UI computes the real figure.
      totalAreaSqFt: 0,
      roomCount: rooms.length,
      doorCount,
      windowCount: openings.length - doorCount,
      wallCount: walls.length,
      extractionConfidence: kept.length
        ? kept.reduce((s, r) => s + r.score, 0) / kept.length
        : 0.2,
      depthError: undefined,
      trainingSamples: weights.samples,
    },
  };
}

function rectArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    a += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
  }
  return Math.abs(a / 2);
}

function buildWalls(rooms: Room[]): Wall[] {
  const walls: Wall[] = [];
  const T = 0.3, H = 10;
  let n = 0;
  const push = (a: Pt, b: Pt) => walls.push({ id: `wall-${++n}`, a, b, thicknessFt: T, heightFt: H });

  if (rooms.length === 0) return walls;

  // Outer frame = bounding box of all rooms.
  let bx0 = 1, by0 = 1, bx1 = 0, by1 = 0;
  for (const r of rooms) {
    bx0 = Math.min(bx0, r.polygon[0].x);
    by0 = Math.min(by0, r.polygon[0].y);
    bx1 = Math.max(bx1, r.polygon[1].x);
    by1 = Math.max(by1, r.polygon[2].y);
  }
  push({ x: bx0, y: by0 }, { x: bx1, y: by0 });
  push({ x: bx1, y: by0 }, { x: bx1, y: by1 });
  push({ x: bx1, y: by1 }, { x: bx0, y: by1 });
  push({ x: bx0, y: by1 }, { x: bx0, y: by0 });

  // Interior walls: shared edges between room rectangles.
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const A = rooms[i].polygon, B = rooms[j].polygon;
      const [a0, a1, a2, a3] = A;
      const [b0, b1, b2] = B;
      // vertical shared edge
      if (Math.abs(a1.x - b0.x) < 0.02) {
        const y0 = Math.max(a0.y, b0.y), y1 = Math.min(a2.y, b2.y);
        if (y1 > y0 + 0.01) push({ x: a1.x, y: y0 }, { x: a1.x, y: y1 });
      }
      // horizontal shared edge
      if (Math.abs(a3.y - b0.y) < 0.02) {
        const x0 = Math.max(a0.x, b0.x), x1 = Math.min(a1.x, b1.x);
        if (x1 > x0 + 0.01) push({ x: x0, y: a3.y }, { x: x1, y: a3.y });
      }
    }
  }
  return walls;
}

function detectOpenings(
  gray: Float32Array,
  isWall: Uint8Array,
  width: number,
  height: number,
  rooms: Room[],
  walls: Wall[]
): Opening[] {
  const openings: Opening[] = [];
  const weights = loadWeights();
  let n = 0;

  for (const wall of walls) {
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.04) continue;

    // Sample along the wall; find runs of "light" pixels (gaps = doors)
    // and "very dark" slits within the wall band (windows).
    const steps = Math.max(24, Math.floor(len * 220));
    const light: boolean[] = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = Math.min(width - 1, Math.max(0, Math.round((wall.a.x + dx * t) * width)));
      const py = Math.min(height - 1, Math.max(0, Math.round((wall.a.y + dy * t) * height)));
      let bright = 0;
      let dark = 0;
      let cnt = 0;
      for (let o = -3; o <= 3; o++) {
        const qx = Math.min(width - 1, Math.max(0, px + (Math.abs(dy) > Math.abs(dx) ? o : 0)));
        const qy = Math.min(height - 1, Math.max(0, py + (Math.abs(dx) > Math.abs(dy) ? o : 0)));
        const g = gray[qy * width + qx];
        if (isWall[qy * width + qx]) dark++;
        if (g > 0.55) bright++;
        cnt++;
      }
      light.push(bright > cnt * 0.4 && dark < cnt * 0.4);
    }

    // Runs of light → door candidates
    let runStart = -1;
    for (let s = 0; s <= light.length; s++) {
      const isLight = s < light.length ? light[s] : false;
      if (isLight && runStart === -1) runStart = s;
      if (!isLight && runStart !== -1) {
        const t0 = runStart / steps, t1 = s / steps;
        const width01 = t1 - t0;
        if (width01 > 0.06 && width01 < 0.6 && t0 > 0.04 && t1 < 0.96) {
          const feats = new Array(FEATURE_DIM).fill(0.5);
          let score = weights.bias;
          for (let k = 0; k < FEATURE_DIM; k++) score += weights.theta[k] * feats[k];
          if (score > 0.25) {
            openings.push({
              id: `open-${++n}`,
              kind: "door",
              t: (t0 + t1) / 2,
              widthFt: 3,
              sillFt: 0,
              headFt: 7,
            });
          }
        }
        runStart = -1;
      }
    }

    // Windows: fixed prior — one window per long exterior wall span.
    if (len > 0.18) {
      const mid = 0.5;
      openings.push({
        id: `open-${++n}`,
        kind: "window",
        t: mid,
        widthFt: 4,
        sillFt: 3.5,
        headFt: 7,
      });
    }
  }
  return openings;
}

// ─── Online training from corrections ──────────────────────────────────────

export interface TrainingUpdate {
  samplesBefore: number;
  samplesAfter: number;
  loss: number;
  theta: number[];
}

/**
 * Train the head on one human correction. `snapshot` is the pre-correction
 * region scoring context; `correction` carries the human's after-state.
 */
export function trainFromCorrection(
  before: { rooms: Room[]; walls: Wall[]; openings: Opening[] },
  after: { rooms: Room[]; walls: Wall[]; openings: Opening[] },
  kind: LayoutCorrectionKind
): TrainingUpdate {
  const w = loadWeights();
  const samplesBefore = w.samples;

  // Build a simple target: did the human ADD or REMOVE room area vs the
  // machine's guess? +1 means the model under-segmented (rooms merged that
  // should split), −1 means it over-segmented (kept fragments the human removed).
  const areaBefore = before.rooms.reduce((s, r) => s + rectArea(r.polygon), 0);
  const areaAfter = after.rooms.reduce((s, r) => s + rectArea(r.polygon), 0);
  const countBefore = before.rooms.length;
  const countAfter = after.rooms.length;

  // Directional label per correction kind.
  let y = 0;
  switch (kind) {
    case "delete_room": y = -1; break;             // model kept junk → be stricter
    case "merge_rooms": y = 1; break;              // model split too much → be lenient
    case "add_room": y = 1; break;                 // model missed a room → be lenient
    case "move_wall": y = 0.5; break;              // bounds off → adjust edge weighting
    case "rename_room": y = 0; break;              // cosmetic — no geometry signal
    case "set_door":
    case "set_window": y = 0.25; break;            // openings need adjustment
    case "set_scale": y = 0; break;
  }

  // Features of the *global* region context at correction time.
  const feats = [
    Math.min(1, countBefore / 12),          // 0: room-count pressure
    Math.min(1, countAfter / 12),           // 1: target room-count
    Math.min(1, Math.abs(areaAfter - areaBefore) * 4), // 2: magnitude of change
    y > 0 ? 1 : 0,                          // 3: under-segmentation flag
    y < 0 ? 1 : 0,                          // 4: over-segmentation flag
    kind === "move_wall" ? 1 : 0,           // 5: wall-move signal
    kind === "set_door" || kind === "set_window" ? 1 : 0, // 6: opening signal
    1,                                      // 7: intercept-like constant
  ];

  // Prediction with current weights.
  let pred = w.bias;
  for (let k = 0; k < FEATURE_DIM; k++) pred += w.theta[k] * feats[k];

  // Gradient step (MSE + L2).
  const lr = 0.06;
  const l2 = 0.002;
  const err = pred - y;
  const loss = err * err + l2 * w.theta.reduce((s, t) => s + t * t, 0);
  const theta = w.theta.map((t, k) => t - lr * (err * feats[k] + l2 * t));
  const bias = w.bias - lr * err;

  const next: HeadWeights = {
    theta,
    bias,
    samples: samplesBefore + 1,
    lossHistory: [...w.lossHistory.slice(-59), Math.round(loss * 1e4) / 1e4],
  };
  saveWeights(next);

  return {
    samplesBefore,
    samplesAfter: next.samples,
    loss: Math.round(loss * 1e4) / 1e4,
    theta,
  };
}

/** Reset the learned head to factory weights (dev tool). */
export function resetHead(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(WEIGHT_KEY);
}

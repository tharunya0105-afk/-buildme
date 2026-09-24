// ─── Layout Intelligence Types ──────────────────────────────────────────────
// Geometry shared between the AI analyzer, the correction editor, the API,
// and the Three.js virtual tour renderer.

export interface Pt {
  x: number; // normalized 0..1 in image space
  y: number;
}

/** A room: closed polygon in normalized image coordinates. */
export interface Room {
  id: string;
  label: string;
  polygon: Pt[];
  /** Height of this room's walls in feet (null = building default). */
  ceilingFt?: number | null;
  /** Set when the human confirmed/renamed it. */
  confirmed?: boolean;
}

/** A wall segment, optionally bound to a room edge. */
export interface Wall {
  id: string;
  a: Pt;
  b: Pt;
  thicknessFt: number;
  heightFt: number;
}

/** Door or window opening placed on a wall. */
export interface Opening {
  id: string;
  kind: "door" | "window" | "archway";
  /** Position along the wall, normalized 0..1 from a→b. */
  t: number;
  widthFt: number;
  /** Bottom edge height above floor, feet. Windows ~4. */
  sillFt: number;
  /** Top edge height above floor, feet. Doors ~7, windows ~7. */
  headFt: number;
}

export interface LayoutStats {
  totalAreaSqFt: number;
  roomCount: number;
  doorCount: number;
  windowCount: number;
  wallCount: number;
  /** Model self-reported quality of the extraction, 0..1. */
  extractionConfidence: number;
  /** Mean absolute error of the depth net on this image, 0..1 (lower is better). */
  depthError?: number;
  /** How many corrections the trainable head has absorbed for this account. */
  trainingSamples: number;
}

export interface LayoutAnalysis {
  rooms: Room[];
  walls: Wall[];
  openings: Opening[];
  stats: LayoutStats;
}

/** Payload stored in LayoutPlan.rooms / walls / openings columns. */
export interface LayoutPlanGeometry {
  rooms: Room[];
  walls: Wall[];
  openings: Opening[];
}

/** A single human correction used to train the layout head. */
export interface CorrectionSample {
  kind: LayoutCorrectionKind;
  before: { rooms: Room[]; walls: Wall[]; openings: Opening[] };
  after: { rooms: Room[]; walls: Wall[]; openings: Opening[] };
  createdAt: string;
}

export type LayoutCorrectionKind =
  | "merge_rooms"
  | "delete_room"
  | "move_wall"
  | "add_room"
  | "rename_room"
  | "set_door"
  | "set_window"
  | "set_scale";

/** Result of the Hugging Face depth model on one image. */
export interface DepthResult {
  /** Depth map, normalized 0..1 (1 = nearest), at the given dimensions. */
  depth: Float32Array;
  width: number;
  height: number;
  /** Mean normalized inverse-depth error proxy, 0..1. */
  error: number;
  modelId: string;
  device: string;
  loadMs: number;
  inferMs: number;
}

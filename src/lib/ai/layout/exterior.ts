// ─── Exterior / Site Elements ───────────────────────────────────────────────
// Everything outside the walls so the tour shows how the house looks from
// the street: roof, parapet, compound wall, gate, pathway, lawn, carport,
// overhead tank — the "owner's eyes" view of the finished home.

import type { Room } from "./types";

export interface RoofSpec {
  /** "flat" concrete slab with parapet (typical TN residential). */
  kind: "flat";
  heightFt: number; // wall top
  parapetFt: number; // parapet extra height
  overhangFt: number;
}

export interface SiteElement {
  id: string;
  kind:
    | "compoundWall" | "gate" | "pathway" | "lawn"
    | "carport" | "waterTank" | "driveway" | "steps"
    | "gatePillar";
  x: number; // plan-normalized center
  y: number;
  w: number; // feet
  d: number; // feet
  h: number; // feet
  rot?: number;
  color: number;
  label: string;
}

export const DEFAULT_ROOF: RoofSpec = {
  kind: "flat",
  heightFt: 10,
  parapetFt: 3,
  overhangFt: 1.2,
};

/**
 * Site layout around the plan footprint. The house sits centered; the plot
 * extends to the south (bottom of plan) with gate + driveway + pathway.
 */
export function buildSiteElements(
  rooms: Room[],
  planSpanFeet: number,
  planAspect: number
): SiteElement[] {
  if (rooms.length === 0) return [];

  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const r of rooms) {
    x0 = Math.min(x0, ...r.polygon.map(p => p.x));
    x1 = Math.max(x1, ...r.polygon.map(p => p.x));
    y0 = Math.min(y0, ...r.polygon.map(p => p.y));
    y1 = Math.max(y1, ...r.polygon.map(p => p.y));
  }

  const W = (x1 - x0) * planSpanFeet; // house width ft
  const D = (y1 - y0) * planSpanFeet * planAspect;

  const elements: SiteElement[] = [];
  // Coordinates here are in "house-relative feet", converted by the caller:
  // x: -W/2..W/2 around house center; y: -D/2..D/2 (negative = front/south).
  const add = (
    id: string, kind: SiteElement["kind"],
    hx: number, hy: number, w: number, d: number, h: number,
    color: number, label: string, rot = 0
  ) => elements.push({ id, kind, x: hx, y: hy, w, d, h, rot, color, label });

  // Compound wall around a plot ~ (W+16) × (D+16)
  const PW = W + 16;
  const PD = D + 16;
  const wallH = 5;
  const t = 0.6;
  add("cw-n", "compoundWall", 0, -PD / 2, PW, t, wallH, 0xd9cfc0, "Compound Wall");
  add("cw-s", "compoundWall", 0, PD / 2, PW, t, wallH, 0xd9cfc0, "Compound Wall");
  add("cw-w", "compoundWall", -PW / 2, 0, t, PD, wallH, 0xd9cfc0, "Compound Wall");
  add("cw-e", "compoundWall", PW / 2, 0, t, PD, wallH, 0xd9cfc0, "Compound Wall");

  // Gate (front = negative y side) + pillars
  add("gate", "gate", 0, -PD / 2, 10, 0.4, 5.5, 0x445566, "Main Gate");
  add("gp-l", "gatePillar", -5.6, -PD / 2, 1.2, 1.2, 6, 0xcfc5b4, "Gate Pillar");
  add("gp-r", "gatePillar", 5.6, -PD / 2, 1.2, 1.2, 6, 0xcfc5b4, "Gate Pillar");

  // Driveway + carport (left of path)
  add("driveway", "driveway", -W / 2 - 4.5, -PD / 2 + 12, 9, 20, 0.15, 0x9a9a9a, "Driveway");
  add("carport", "carport", -W / 2 - 4.5, -PD / 2 + 12, 9, 18, 8.5, 0x8899a5, "Car Porch");

  // Pathway from gate to entrance
  add("path", "pathway", 0, -PD / 2 + 10, 4, 18, 0.12, 0xbfae97, "Walkway");

  // Entrance steps
  add("steps", "steps", 0, -D / 2 - 1.2, 6, 2.4, 1.2, 0xcabfa9, "Entrance Steps");

  // Lawn strips
  add("lawn-l", "lawn", -W / 2 - 5.5, -2, 8, D, 0.1, 0x4e8c4a, "Lawn");
  add("lawn-r", "lawn", W / 2 + 5.5, 2, 8, D, 0.1, 0x4e8c4a, "Lawn");
  add("lawn-back", "lawn", 0, D / 2 + 5, W + 6, 8, 0.1, 0x4e8c4a, "Backyard");

  // Overhead water tank on the roof is rendered by the tour itself.
  return elements;
}

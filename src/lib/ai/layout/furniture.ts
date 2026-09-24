// ─── Furniture Catalog & Placement ──────────────────────────────────────────
// Deterministic furnishing of AI-extracted rooms. Every item carries a real
// product link (IKEA India / Amazon India search) and an indicative price so
// homeowners can click any piece of furniture in the 3D tour and see where
// to buy it.

import type { Room } from "./types";

export type FurnitureKind =
  | "bed" | "singleBed" | "bedside" | "wardrobe"
  | "sofa" | "sofaL" | "coffeeTable" | "tvUnit"
  | "diningTable" | "fridge" | "kitchenCounter"
  | "toilet" | "washbasin" | "shower"
  | "desk" | "chair" | "bookshelf"
  | "pooja" | "plant" | "rug";

export interface FurnitureItem {
  kind: FurnitureKind;
  /** Center position in plan-normalized coords (0..1). */
  x: number;
  y: number;
  /** Rotation around Y, radians. */
  rot: number;
  /** Footprint in feet (w × d), h = height. */
  w: number;
  d: number;
  h: number;
  label: string;
  priceInr: number;
  store: string;
  url: string;
  color: number;
}

const AMZ = (q: string) =>
  `https://www.amazon.in/s?k=${encodeURIComponent(q)}`;
const IKEA = (q: string) =>
  `https://www.ikea.com/in/en/search/?q=${encodeURIComponent(q)}`;

// Deterministic furnishing so the same plan always produces the same furniture.
/** Classify a room by its (user-corrected) label, falling back to area. */
export function classifyRoom(room: Room, areaFt: number): string {
  const label = room.label.toLowerCase();
  if (/bed/.test(label)) return "bedroom";
  if (/kitchen/.test(label)) return "kitchen";
  if (/liv|hall|living/.test(label)) return "living";
  if (/din/.test(label)) return "dining";
  if (/bath|toilet|wash/.test(label)) return "bathroom";
  if (/study|office|work/.test(label)) return "study";
  if (/pooja|prayer|temple/.test(label)) return "pooja";
  if (/balcony|terrace|deck/.test(label)) return "balcony";
  if (/garage|park/.test(label)) return "garage";
  // Fallback by size
  if (areaFt >= 120) return "living";
  if (areaFt >= 70) return "bedroom";
  if (areaFt >= 30) return "study";
  return "balcony";
}

/**
 * Furnish one room. Positions stay inside the room's bounding box with a
 * margin so nothing pokes through walls.
 */
export function furnishRoom(
  room: Room,
  planAspect: number,
  planSpanFeet: number
): FurnitureItem[] {
  const poly = room.polygon;
  const x0 = Math.min(...poly.map(p => p.x));
  const x1 = Math.max(...poly.map(p => p.x));
  const y0 = Math.min(...poly.map(p => p.y));
  const y1 = Math.max(...poly.map(p => p.y));

  // Room size in feet
  const wFt = (x1 - x0) * planSpanFeet;
  const dFt = (y1 - y0) * planSpanFeet * planAspect;
  const areaFt = wFt * dFt;
  const kind = classifyRoom(room, areaFt);

  const mx = (x1 - x0) * 0.22; // x margin
  const my = (y1 - y0) * 0.22; // y margin
  const items: FurnitureItem[] = [];
  const put = (it: Omit<FurnitureItem, "x" | "y" | "rot">, fx: number, fy: number, rot = 0) => {
    items.push({ ...it, x: x0 + mx + fx * (x1 - x0 - 2 * mx), y: y0 + my + fy * (y1 - y0 - 2 * my), rot });
  };

  switch (kind) {
    case "bedroom": {
      const single = wFt < 9;
      put(
        single
          ? { kind: "singleBed", w: 3.2, d: 6.2, h: 1.8, label: "Single Bed", priceInr: 12499, store: "Amazon", url: AMZ("single bed wooden"), color: 0x8a6a4f }
          : { kind: "bed", w: 6.2, d: 6.6, h: 1.8, label: "Queen Bed", priceInr: 24999, store: "IKEA", url: IKEA("queen bed frame"), color: 0x8a6a4f },
        0.18, 0.22, Math.PI
      );
      put({ kind: "bedside", w: 1.5, d: 1.5, h: 1.7, label: "Bedside Table", priceInr: 2999, store: "IKEA", url: IKEA("bedside table"), color: 0x6f5138 }, 0.02, 0.08);
      put({ kind: "wardrobe", w: 4.5, d: 2, h: 7, label: "Wardrobe", priceInr: 32990, store: "IKEA", url: IKEA("wardrobe 3 door"), color: 0xa3866b }, 0.98, 0.75, Math.PI / 2);
      if (areaFt > 110) put({ kind: "desk", w: 4, d: 2, h: 2.5, label: "Study Desk", priceInr: 7999, store: "Amazon", url: AMZ("study table wooden"), color: 0x9a7b56 }, 0.85, 0.18);
      put({ kind: "rug", w: 5, d: 3.5, h: 0.08, label: "Area Rug", priceInr: 3499, store: "Amazon", url: AMZ("area rug 5x7"), color: 0xb56576 }, 0.55, 0.72);
      break;
    }
    case "living": {
      put({ kind: "sofa", w: 7, d: 3, h: 2.5, label: "3-Seater Sofa", priceInr: 42990, store: "IKEA", url: IKEA("3 seater sofa fabric"), color: 0x5b7c99 }, 0.5, 0.12);
      put({ kind: "coffeeTable", w: 3.6, d: 2, h: 1.4, label: "Coffee Table", priceInr: 8999, store: "IKEA", url: IKEA("coffee table"), color: 0x7a5c3e }, 0.5, 0.48);
      put({ kind: "tvUnit", w: 5.5, d: 1.5, h: 1.8, label: "TV Unit", priceInr: 15499, store: "Amazon", url: AMZ("tv unit cabinet"), color: 0x4a4a4a }, 0.5, 0.95);
      put({ kind: "plant", w: 1.6, d: 1.6, h: 4.5, label: "Indoor Plant", priceInr: 1299, store: "Amazon", url: AMZ("indoor live plant pot"), color: 0x3f7d44 }, 0.06, 0.9);
      put({ kind: "rug", w: 6, d: 4, h: 0.08, label: "Carpet", priceInr: 5499, store: "Amazon", url: AMZ("living room carpet large"), color: 0x8d99ae }, 0.5, 0.5);
      break;
    }
    case "kitchen": {
      put({ kind: "kitchenCounter", w: Math.max(4, wFt - 3), d: 2, h: 3, label: "Kitchen Platform", priceInr: 45000, store: "Amazon", url: AMZ("kitchen modular platform"), color: 0xc9b99b }, 0.05, 0.06);
      put({ kind: "fridge", w: 2.5, d: 2.3, h: 5.8, label: "Refrigerator", priceInr: 26990, store: "Amazon", url: AMZ("double door refrigerator"), color: 0xb8c4cc }, 0.94, 0.1);
      if (areaFt > 60) put({ kind: "diningTable", w: 4.5, d: 3, h: 2.5, label: "Breakfast Table", priceInr: 12999, store: "IKEA", url: IKEA("dining table 4 seater"), color: 0x8a6a4f }, 0.55, 0.7);
      break;
    }
    case "dining": {
      put({ kind: "diningTable", w: 5.5, d: 3.2, h: 2.5, label: "6-Seater Dining", priceInr: 21999, store: "IKEA", url: IKEA("dining table 6 seater"), color: 0x8a6a4f }, 0.5, 0.4);
      put({ kind: "plant", w: 1.6, d: 1.6, h: 4.5, label: "Plant", priceInr: 1299, store: "Amazon", url: AMZ("indoor plant tall"), color: 0x3f7d44 }, 0.92, 0.9);
      break;
    }
    case "bathroom": {
      put({ kind: "toilet", w: 1.5, d: 2.2, h: 1.4, label: "WC", priceInr: 8499, store: "Amazon", url: AMZ("western toilet seat ceramic"), color: 0xf2f2f0 }, 0.15, 0.15);
      put({ kind: "washbasin", w: 1.8, d: 1.4, h: 2.6, label: "Wash Basin", priceInr: 5499, store: "Amazon", url: AMZ("table top wash basin"), color: 0xf2f2f0 }, 0.8, 0.1);
      if (areaFt > 35) put({ kind: "shower", w: 2.5, d: 2.5, h: 0.05, label: "Shower Area", priceInr: 3200, store: "Amazon", url: AMZ("shower head set"), color: 0x9fc5e3 }, 0.75, 0.8);
      break;
    }
    case "study": {
      put({ kind: "desk", w: 4.5, d: 2.2, h: 2.5, label: "Desk", priceInr: 8999, store: "Amazon", url: AMZ("office table wooden"), color: 0x9a7b56 }, 0.5, 0.15);
      put({ kind: "chair", w: 1.8, d: 1.8, h: 3, label: "Chair", priceInr: 4499, store: "Amazon", url: AMZ("ergonomic office chair"), color: 0x37474f }, 0.5, 0.45);
      put({ kind: "bookshelf", w: 3, d: 1.2, h: 6, label: "Bookshelf", priceInr: 9999, store: "IKEA", url: IKEA("bookshelf"), color: 0x8a6a4f }, 0.95, 0.75, Math.PI / 2);
      break;
    }
    case "pooja": {
      put({ kind: "pooja", w: 2.5, d: 1.8, h: 4.5, label: "Pooja Mandir", priceInr: 15999, store: "Amazon", url: AMZ("wooden pooja mandir home temple"), color: 0xb98a44 }, 0.5, 0.2);
      break;
    }
    case "balcony":
    default: {
      put({ kind: "chair", w: 1.8, d: 1.8, h: 2.6, label: "Balcony Chair", priceInr: 2999, store: "Amazon", url: AMZ("outdoor balcony chair"), color: 0x607d8b }, 0.3, 0.3);
      put({ kind: "plant", w: 1.6, d: 1.6, h: 4, label: "Potted Plant", priceInr: 999, store: "Amazon", url: AMZ("outdoor plant pot"), color: 0x3f7d44 }, 0.75, 0.7);
      break;
    }
  }
  return items;
}

/** Furnish every room (deterministic per plan). */
export function furnishPlan(
  rooms: Room[],
  planAspect: number,
  planSpanFeet: number
): FurnitureItem[] {
  return rooms.flatMap(r => furnishRoom(r, planAspect, planSpanFeet));
}

/** Build a store search URL for arbitrary queries. */
export { AMZ as amazonSearch, IKEA as ikeaSearch };

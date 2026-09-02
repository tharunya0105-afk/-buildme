// ─── Geographic Utility Functions ───────────────────────────────────────────
// Reusable spatial calculations for BuildMe.

/**
 * Calculate distance between two geographic points using the Haversine formula.
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Find properties within a given radius (km) of a point.
 */
export function findNearby<T extends { latitude: number | null; longitude: number | null }>(
  properties: T[],
  centerLat: number,
  centerLon: number,
  radiusKm: number
): Array<T & { distance: number }> {
  return properties
    .filter(p => p.latitude !== null && p.longitude !== null)
    .map(p => ({
      ...p,
      distance: haversineDistance(centerLat, centerLon, p.latitude!, p.longitude!),
    }))
    .filter(p => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate the geographic center of a set of coordinates.
 */
export function geoCenter(
  points: Array<{ lat: number; lon: number }>
): { lat: number; lon: number } {
  if (points.length === 0) return { lat: 10.8, lon: 78.5 };
  const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const avgLon = points.reduce((s, p) => s + p.lon, 0) / points.length;
  return { lat: avgLat, lon: avgLon };
}

/**
 * Calculate geographic spread of a set of points (max distance between any two).
 */
export function geoSpread(
  points: Array<{ lat: number; lon: number }>
): number {
  if (points.length < 2) return 0;
  let maxDist = 0;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = haversineDistance(points[i].lat, points[i].lon, points[j].lat, points[j].lon);
      if (d > maxDist) maxDist = d;
    }
  }
  return maxDist;
}

/**
 * Group properties by proximity (simple clustering by city/district).
 */
export function clusterByRegion<T extends { city?: string | null; district?: string | null }>(
  properties: T[]
): Array<{ region: string; count: number; items: T[] }> {
  const groups = new Map<string, T[]>();
  for (const p of properties) {
    const key = p.district || p.city || "Unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return Array.from(groups.entries())
    .map(([region, items]) => ({ region, count: items.length, items }))
    .sort((a, b) => b.count - a.count);
}

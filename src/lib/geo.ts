import type { Coords, Dhaba, RankedDhaba } from "./types";

const EARTH_RADIUS_KM = 6371;

// Haversine distance between two lat/lng points, in kilometers.
// Plenty accurate for "which dhaba is closer" decisions.
export function distanceKm(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Human-friendly distance string. Drivers in the US expect miles.
export function formatDistance(km: number): string {
  const miles = km * 0.621371;
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

// Rank dhabas by proximity to the user, attaching a `distanceKm` field.
// Dhabas without coords are pushed to the end with no distance.
export function rankByDistance(
  dhabas: Dhaba[],
  from: Coords | null,
): RankedDhaba[] {
  if (!from) return dhabas.map((d) => ({ ...d }));
  return [...dhabas]
    .map((d) => {
      if (typeof d.lat !== "number" || typeof d.lng !== "number") {
        return { ...d } as RankedDhaba;
      }
      return {
        ...d,
        distanceKm: distanceKm(from, { lat: d.lat, lng: d.lng }),
      };
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

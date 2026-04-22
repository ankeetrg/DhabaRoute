// data/dhabas.json is generated from data/dhabas.csv by `npm run build:data`
// (also runs automatically as the `predev` / `prebuild` hook).
//
// We read via fs rather than a static import so that running
// `npm run build:data` while the dev server is up is enough to get fresh
// data on the next request — no full server restart required.
//
// The mtime-based cache means subsequent requests are as fast as a
// static import; the file is only re-parsed when the JSON changes on disk.

// SERVER ONLY — uses node:fs. Client components must NOT import this file.
// Map constants that client components need live in @/lib/map-config instead.
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Dhaba, DhabaPayload, Tag } from "./types";

const DATA_PATH = join(process.cwd(), "data", "dhabas.json");

let _cache: { mtime: number; payload: DhabaPayload } | null = null;
// Track the last generatedAt we logged so the debug line only fires
// when new JSON is actually built — not on every module reload in dev.
let _lastLoggedAt = "";

function loadPayload(): DhabaPayload {
  const mtime = statSync(DATA_PATH).mtimeMs;
  if (_cache && _cache.mtime === mtime) return _cache.payload;

  const payload = JSON.parse(readFileSync(DATA_PATH, "utf8")) as DhabaPayload;
  _cache = { mtime, payload };

  // Debug: only log when the JSON was rebuilt (new generatedAt), so the
  // terminal isn't flooded on every HMR reload in dev.
  if (process.env.NODE_ENV !== "production" && payload.generatedAt !== _lastLoggedAt) {
    _lastLoggedAt = payload.generatedAt;
    const first = payload.dhabas[0] ?? null;
    console.log(
      `[DhabaRoute] data reloaded — ${payload.count} dhabas (built ${payload.generatedAt}). First record:`,
      JSON.stringify({
        id: first?.id,
        title: first?.title,
        lat: first?.lat,
        lng: first?.lng,
        routeHint: first?.routeHint,
        description: first?.description,
        tags: first?.tags,
      }),
    );
  }

  return payload;
}

// Curated amenity tags that make sense as filter chips.
// State names, highway numbers, and place names are intentionally excluded —
// those work better as search-bar terms. Only tags that describe what a
// dhaba *has* (not where it *is*) belong here.
// Order determines chip order in the UI; more common amenities go first.
const AMENITY_FILTER_TAGS: Tag[] = [
  "Truck Parking",
  "Seating",
  "Gas",
  "Bathrooms",
  "Showers",
  "Takeout",
  "Liquor Store",
  "Hotel",
  "Food Truck",
];

// Returns only the amenity filter chips that actually have matching dhabas
// in the current dataset, preserving the order from AMENITY_FILTER_TAGS.
// This guarantees no dead filters — every chip will always return results.
export function getAllUsedTags(): Tag[] {
  const inData = new Set<string>();
  for (const d of loadPayload().dhabas) {
    for (const t of d.tags) inData.add(t);
  }
  return AMENITY_FILTER_TAGS.filter((t) => inData.has(t));
}

// Re-exported for server-side callers; client components should import
// directly from "@/lib/map-config" to avoid pulling node:fs into the bundle.
export { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "./map-config";

export function getAllDhabas(): Dhaba[] {
  return loadPayload().dhabas;
}

export function getDhabasWithCoords(): Dhaba[] {
  return loadPayload().dhabas.filter(
    (d) => typeof d.lat === "number" && typeof d.lng === "number",
  );
}

export function getFeaturedDhabas(): Dhaba[] {
  return loadPayload().dhabas.filter((d) => d.featured);
}

// Used internally for the "Built for the rig" row — not rendered as UI text.
export function getHighPriorityDhabas(): Dhaba[] {
  return loadPayload().dhabas.filter((d) => d.priority === "High");
}

export function getDhabaBySlug(slug: string): Dhaba | undefined {
  return loadPayload().dhabas.find((d) => d.slug === slug);
}

export function getAllSlugs(): string[] {
  return loadPayload().dhabas.map((d) => d.slug);
}

export function getDataMeta() {
  const p = loadPayload();
  return {
    generatedAt: p.generatedAt,
    count: p.count,
    withCoords: p.dhabas.filter(
      (d) => typeof d.lat === "number" && typeof d.lng === "number",
    ).length,
  };
}

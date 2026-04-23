#!/usr/bin/env tsx
// DhabaRoute — Places API photo enrichment.
//
// Run: npx tsx scripts/fetch-photos.ts
//
// Reads data/dhabas.json, and for every dhaba that doesn't yet have an
// imageUrl:
//   1. Resolve a placeId (via Text Search, same shape used by
//      scripts/enrich-places.mjs) — our dataset doesn't persist placeIds so
//      we re-resolve on demand.
//   2. Call Place Details (New) with fields=photos to get the first photo
//      reference (photos[0].name = "places/XXX/photos/YYY").
//   3. Call the media endpoint with skipHttpRedirect=true so we get back a
//      JSON payload containing `photoUri` (a direct googleusercontent URL)
//      instead of following the redirect to the actual image bytes.
//   4. Save the googleusercontent URL as imageUrl on the record.
//
// Writes the updated records back to data/dhabas.json. A companion change
// in scripts/build-data.mjs preserves imageUrl across CSV rebuilds so
// photos aren't wiped next time someone runs `npm run build:data`.
//
// ts-node note: this project's tsconfig is module:esnext + bundler
// resolution, which ts-node can't run without extra ESM adapter config.
// We use `tsx` (installed as a devDependency) which is a drop-in ESM
// TypeScript runner — invoke via `npx tsx scripts/fetch-photos.ts`.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const JSON_PATH = join(ROOT, "data", "dhabas.json");
const ENV_PATH = join(ROOT, ".env.local");

// ── API key ───────────────────────────────────────────────────────────────
function loadEnv(path: string): string | null {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (key === "GOOGLE_PLACES_API_KEY") return line.slice(eq + 1).trim();
    }
  } catch {
    // .env.local may not exist in CI — fall through to process.env.
  }
  return null;
}

const API_KEY = loadEnv(ENV_PATH) ?? process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("❌  GOOGLE_PLACES_API_KEY not found in .env.local");
  process.exit(1);
}

// ── Types (local, narrow) ─────────────────────────────────────────────────
interface DhabaRecord {
  id: string;
  slug: string;
  title: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  imageUrl?: string;
  // other fields are preserved verbatim on the record
  [key: string]: unknown;
}

interface DhabaPayloadShape {
  generatedAt: string;
  count: number;
  dhabas: DhabaRecord[];
}

// ── Places API helpers ────────────────────────────────────────────────────
const BASE = "https://places.googleapis.com/v1";

// "https://www.google.com/maps/place/Fort+Amargosa+%7C+Punjabi+Dhaba/…"
// → "Fort Amargosa | Punjabi Dhaba"
function placeNameFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/maps\/place\/([^/?#]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1].replace(/\+/g, " "));
    } catch {
      return null;
    }
  }
  return null;
}

// Text Search → first matching placeId. Adds a location bias when we know
// the dhaba's coords so generic names ("Indian Kitchen") still return the
// right place.
async function searchPlace(
  query: string,
  lat?: number,
  lng?: number,
): Promise<string | null> {
  const body: Record<string, unknown> = { textQuery: query, maxResultCount: 1 };
  if (lat != null && lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 50000,
      },
    };
  }
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY as string,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    places?: { id?: string }[];
    error?: { message?: string };
  };
  if (data.error) throw new Error(data.error.message ?? "Places searchText error");
  return data.places?.[0]?.id ?? null;
}

// Place Details with fields=photos → returns the first photo's `name`
// (shape: "places/XXX/photos/YYY") or null.
async function firstPhotoReference(placeId: string): Promise<string | null> {
  const url = `${BASE}/places/${placeId}?fields=photos&key=${API_KEY}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    photos?: { name?: string }[];
    error?: { message?: string };
  };
  if (data.error) throw new Error(data.error.message ?? "Places details error");
  return data.photos?.[0]?.name ?? null;
}

// Media endpoint with skipHttpRedirect=true → returns a JSON payload with
// a `photoUri` pointing at lh3.googleusercontent.com. We store that URL as
// imageUrl so the client can load the image directly (no runtime API call).
async function resolvePhotoUri(photoReference: string): Promise<string | null> {
  const url = `${BASE}/${photoReference}/media?maxWidthPx=800&key=${API_KEY}&skipHttpRedirect=true`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    photoUri?: string;
    error?: { message?: string };
  };
  if (data.error) throw new Error(data.error.message ?? "Photo media error");
  return data.photoUri ?? null;
}

// ── Main ──────────────────────────────────────────────────────────────────
const SLEEP_MS = 200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const raw = readFileSync(JSON_PATH, "utf8");
  const payload = JSON.parse(raw) as DhabaPayloadShape;

  let saved = 0;
  let missing = 0;
  let already = 0;

  for (const d of payload.dhabas) {
    // Skip dhabas already enriched — script is safe to re-run.
    if (d.imageUrl) {
      already++;
      continue;
    }

    try {
      // Resolve placeId. Dataset doesn't persist it; mirror the approach
      // in enrich-places.mjs and do a Text Search bounded by coords.
      let placeId = d.placeId;
      if (!placeId) {
        const query = placeNameFromUrl(d.mapsUrl) ?? d.title;
        placeId = (await searchPlace(query, d.lat, d.lng)) ?? undefined;
      }
      if (!placeId) {
        console.log(`${d.title} — no photo found`);
        missing++;
        await sleep(SLEEP_MS);
        continue;
      }
      // Cache the resolved placeId for future runs so we don't re-search.
      d.placeId = placeId;

      const photoRef = await firstPhotoReference(placeId);
      if (!photoRef) {
        console.log(`${d.title} — no photo found`);
        missing++;
        await sleep(SLEEP_MS);
        continue;
      }

      const photoUri = await resolvePhotoUri(photoRef);
      if (!photoUri) {
        console.log(`${d.title} — no photo found`);
        missing++;
        await sleep(SLEEP_MS);
        continue;
      }

      d.imageUrl = photoUri;
      saved++;
      console.log(`${d.title} — photo saved`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`${d.title} — no photo found (${message})`);
      missing++;
    }

    // Stay well under the per-second quota. One dhaba = up to 3 calls,
    // so 200 ms between dhabas keeps us at ~15 calls/s worst-case.
    await sleep(SLEEP_MS);
  }

  // Refresh top-level metadata and persist.
  payload.generatedAt = new Date().toISOString();
  payload.count = payload.dhabas.length;
  writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const withPhotos = payload.dhabas.filter((d) => d.imageUrl).length;
  console.log(
    `\n${withPhotos} of ${payload.dhabas.length} dhabas now have photos ` +
      `(saved this run: ${saved}, already had: ${already}, missing: ${missing})`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});

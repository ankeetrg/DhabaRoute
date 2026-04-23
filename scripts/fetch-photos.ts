#!/usr/bin/env tsx
// DhabaRoute — Places API photo enrichment (legacy endpoints).
//
// Run: npx tsx scripts/fetch-photos.ts
//
// Reads data/dhabas.json and, for every dhaba without an imageUrl:
//   1. Find Place from Text (legacy) with `{title}, {city}` to resolve a
//      place_id + photo refs in one call.
//   2. Take candidates[0].photos[0].photo_reference.
//   3. Fetch place/photo?maxwidth=800&photoreference=... with
//      `redirect: "manual"` so we capture the 302 Location header instead
//      of following it. The Location points at a clean
//      lh3.googleusercontent.com URL with no API key, which is what we
//      persist as imageUrl.
//   4. Store `imageUrl` on the record. When no photo is available we
//      write `imageUrl: null` so downstream code can distinguish "not yet
//      enriched" from "confirmed no photo".
//
// Why legacy endpoints: today's API key is scoped for the legacy Places
// surface. The media URL from the new v1 endpoint embeds the API key in
// the HTML, which we'd rather not ship. Following the 302 manually gives
// us a key-free googleusercontent URL.
//
// Writes updated records back to data/dhabas.json. scripts/build-data.mjs
// already preserves imageUrl + placeId across CSV rebuilds.

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
  console.error("GOOGLE_PLACES_API_KEY not found in .env.local");
  process.exit(1);
}

// ── Types (local, narrow) ─────────────────────────────────────────────────
interface DhabaRecord {
  id: string;
  slug: string;
  title: string;
  mapsUrl?: string;
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  imageUrl?: string | null;
  [key: string]: unknown;
}

interface DhabaPayloadShape {
  generatedAt: string;
  count: number;
  dhabas: DhabaRecord[];
}

// ── Helpers ───────────────────────────────────────────────────────────────
const BASE = "https://maps.googleapis.com/maps/api/place";

// Pull the city out of an address like
// "5317 US-95 E Highway 95, Amargosa Valley, NV 89020, USA"
// We take the comma-separated block before the "ST ZIP" one.
function cityFromAddress(address?: string): string | null {
  if (!address) return null;
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  // Look backwards for the "State ZIP" slot and take the one before it.
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^[A-Z]{2}\s+\d{5}/.test(parts[i])) {
      return parts[i - 1] ?? null;
    }
  }
  return parts.length >= 3 ? parts[parts.length - 3] : null;
}

interface FindPlaceResult {
  placeId: string | null;
  photoReference: string | null;
}

// Legacy Find Place from Text returns place_id + photos in one shot when
// we ask for the right fields, which saves us a Details round-trip.
async function findPlace(query: string): Promise<FindPlaceResult> {
  const url =
    `${BASE}/findplacefromtext/json` +
    `?input=${encodeURIComponent(query)}` +
    `&inputtype=textquery` +
    `&fields=place_id,photos` +
    `&key=${API_KEY}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    status?: string;
    error_message?: string;
    candidates?: {
      place_id?: string;
      photos?: { photo_reference?: string }[];
    }[];
  };
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`${data.status}: ${data.error_message ?? "findplacefromtext error"}`);
  }
  const top = data.candidates?.[0];
  return {
    placeId: top?.place_id ?? null,
    photoReference: top?.photos?.[0]?.photo_reference ?? null,
  };
}

// Follow the 302 manually so we get the key-free googleusercontent URL
// and never embed the API key in HTML we serve to users.
async function resolvePhotoUrl(photoReference: string): Promise<string | null> {
  const url =
    `${BASE}/photo` +
    `?maxwidth=800` +
    `&photoreference=${encodeURIComponent(photoReference)}` +
    `&key=${API_KEY}`;
  const res = await fetch(url, { redirect: "manual" });
  // Expected: 302 with a Location header pointing at lh3.googleusercontent.com
  const location = res.headers.get("location");
  if (location) return location;
  // Some runtimes transparently follow; fall back to res.url if it ended
  // up on googleusercontent anyway.
  if (res.url && res.url.includes("googleusercontent.com")) return res.url;
  return null;
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
    // Skip dhabas already enriched with a real URL. We still want to retry
    // records explicitly marked `imageUrl: null` in case Google now has a
    // photo — but for safety in this first run, treat null as "confirmed
    // missing" and skip. Delete the field by hand to force re-fetch.
    if (typeof d.imageUrl === "string" && d.imageUrl.length > 0) {
      already++;
      continue;
    }
    if (d.imageUrl === null) {
      // Previously confirmed missing — skip.
      continue;
    }

    const city = cityFromAddress(d.address);
    const query = city ? `${d.title}, ${city}` : d.title;

    try {
      const { placeId, photoReference } = await findPlace(query);
      if (placeId) d.placeId = placeId;

      if (!photoReference) {
        d.imageUrl = null;
        console.log(`${d.title} — no photo found`);
        missing++;
        await sleep(SLEEP_MS);
        continue;
      }

      const photoUrl = await resolvePhotoUrl(photoReference);
      if (!photoUrl) {
        d.imageUrl = null;
        console.log(`${d.title} — no photo found`);
        missing++;
        await sleep(SLEEP_MS);
        continue;
      }

      d.imageUrl = photoUrl;
      saved++;
      console.log(`${d.title} — photo saved`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`${d.title} — no photo found (${message})`);
      missing++;
    }

    // Stay comfortably under the legacy per-second quota. One dhaba is up
    // to 2 calls, so 200 ms between dhabas puts us at ~10 calls/s.
    await sleep(SLEEP_MS);
  }

  payload.generatedAt = new Date().toISOString();
  payload.count = payload.dhabas.length;
  writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const withPhotos = payload.dhabas.filter(
    (d) => typeof d.imageUrl === "string" && d.imageUrl.length > 0,
  ).length;
  console.log(
    `\n${withPhotos} of ${payload.dhabas.length} dhabas now have photos ` +
      `(saved this run: ${saved}, already had: ${already}, missing: ${missing})`,
  );
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});

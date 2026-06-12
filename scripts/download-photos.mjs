/**
 * scripts/download-photos.mjs
 *
 * PURPOSE
 * -------
 * Permanently stores all dhaba photos in Vercel Blob so the site never
 * depends on the Google Places API at runtime. Run this once (or whenever
 * new dhabas are added) to populate the `storedImageUrl` field in
 * data/dhabas.json.
 *
 * HOW IT FITS INTO THE PHOTO PIPELINE
 * ------------------------------------
 * Google Places API (placeId)
 *   → /api/place-photo/[placeId]  (proxy route, needs GOOGLE_PLACES_API_KEY)
 *     → this script fetches from that proxy
 *       → uploads to Vercel Blob
 *         → writes `storedImageUrl` back to dhabas.json
 *
 * At runtime, getDhabaPhotoSrc() in src/lib/photo-url.ts uses:
 *   1. storedImageUrl  (Vercel Blob — permanent, no API key needed)
 *   2. /api/place-photo/{placeId}  (live Google proxy — fallback for new dhabas)
 *   3. imageUrl  (legacy lh3 URL — last resort, may expire)
 *
 * PREREQUISITES
 * -------------
 *   - npm install @vercel/blob  (run once before this script)
 *   - BLOB_READ_WRITE_TOKEN in .env.local  (from Vercel Dashboard → Storage → Blob)
 *   - GOOGLE_PLACES_API_KEY in .env.local  (already set up)
 *   - The Next.js dev server must NOT be running (this script calls the
 *     production Vercel deployment's API route directly, not localhost)
 *
 * USAGE
 * -----
 *   node scripts/download-photos.mjs
 *
 * The script is safe to re-run. It skips dhabas that already have a
 * `storedImageUrl` unless you pass --force:
 *   node scripts/download-photos.mjs --force
 *
 * OUTPUT
 * ------
 * Writes updated storedImageUrl fields to data/dhabas.json in place.
 * Prints a summary at the end: how many succeeded, skipped, and failed.
 * Failed dhabas are listed by slug so you can investigate manually.
 *
 * HANDOFF NOTES FOR DEVELOPERS
 * -----------------------------
 * - Vercel Blob URLs are permanent and CDN-cached globally.
 * - The free Vercel Blob tier covers ~1 GB — more than enough for 157 photos.
 * - To refresh a photo (e.g. restaurant changed), delete the old Blob entry
 *   in the Vercel dashboard and re-run with --force for that slug, or just
 *   run the full script with --force to refresh everything.
 * - If Google Places API returns no photo for a placeId, the dhaba is skipped
 *   and its existing imageUrl (lh3) remains as the fallback.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { put, head } from "@vercel/blob";
import { config } from "dotenv";

// ── Setup ─────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Load .env.local so BLOB_READ_WRITE_TOKEN and GOOGLE_PLACES_API_KEY are
// available without needing to export them in the shell.
config({ path: join(ROOT, ".env.local") });

const FORCE = process.argv.includes("--force");
const DATA_PATH = join(ROOT, "data", "dhabas.json");

// The live production URL — the script fetches photos via the deployed API
// proxy so it reuses the same Google Places logic already in production.
// Change this if you're deploying to a different domain.
const PRODUCTION_URL = "https://www.dhabaroute.com";

// ── Validation ────────────────────────────────────────────────────────────

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "❌  BLOB_READ_WRITE_TOKEN is not set.\n" +
      "    Add it to .env.local — find it in Vercel Dashboard → Storage → your Blob store → .env.local tab."
  );
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const raw = readFileSync(DATA_PATH, "utf8");
  const payload = JSON.parse(raw);
  const dhabas = payload.dhabas;

  console.log(`\n📸  DhabaRoute photo download — ${dhabas.length} dhabas\n`);
  if (FORCE) console.log("⚠️   --force: re-downloading all photos\n");

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < dhabas.length; i++) {
    const dhaba = dhabas[i];
    const progress = `[${String(i + 1).padStart(3, " ")}/${dhabas.length}]`;

    // Skip if already stored unless --force
    if (dhaba.storedImageUrl && !FORCE) {
      console.log(`${progress} ⏭️   ${dhaba.slug} — already stored, skipping`);
      skipped++;
      continue;
    }

    // Need either placeId or imageUrl to fetch a photo
    if (!dhaba.placeId && !dhaba.imageUrl) {
      console.log(`${progress} ⚠️   ${dhaba.slug} — no placeId or imageUrl, skipping`);
      skipped++;
      continue;
    }

    try {
      // Fetch via the production API proxy (uses placeId → Google Places)
      // or fall back to the stored imageUrl
      const photoUrl = dhaba.placeId
        ? `${PRODUCTION_URL}/api/place-photo/${encodeURIComponent(dhaba.placeId)}`
        : dhaba.imageUrl;

      const res = await fetch(photoUrl);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${photoUrl}`);
      }

      const filename = `dhabas/${dhaba.slug}.jpg`;

      // Check if the blob already exists — if so, just grab its URL without
      // re-uploading. This handles the case where storedImageUrl was wiped
      // from dhabas.json but the photos are still safely in Vercel Blob.
      let blobUrl;
      try {
        const existing = await head(filename, { token: process.env.BLOB_READ_WRITE_TOKEN });
        blobUrl = existing.url;
        console.log(`${progress} ♻️  ${dhaba.slug} — already in Blob, reusing URL`);
      } catch {
        // Blob doesn't exist — fetch photo and upload it
        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        const buffer = await res.arrayBuffer();
        const blob = await put(filename, buffer, {
          access: "public",
          contentType,
          addRandomSuffix: false,
        });
        blobUrl = blob.url;
        console.log(`${progress} ✅  ${dhaba.slug}`);
        console.log(`          → ${blobUrl}`);
      }

      dhabas[i] = { ...dhaba, storedImageUrl: blobUrl };
      succeeded++;

      // Small delay to avoid hammering the Google Places API
      await sleep(300);
    } catch (err) {
      console.error(`${progress} ❌  ${dhaba.slug} — ${err.message}`);
      failed++;
      failures.push(dhaba.slug);
    }
  }

  // Write updated JSON back to disk
  const updated = { ...payload, dhabas };
  writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");

  // Summary
  console.log("\n─────────────────────────────────────────");
  console.log(`✅  Succeeded: ${succeeded}`);
  console.log(`⏭️   Skipped:   ${skipped}`);
  console.log(`❌  Failed:    ${failed}`);
  if (failures.length > 0) {
    console.log("\nFailed slugs (investigate manually):");
    failures.forEach((s) => console.log(`  - ${s}`));
  }
  console.log("\n📝  data/dhabas.json updated with storedImageUrl fields.");
  console.log(
    "    Next step: commit dhabas.json and deploy so the site uses Blob URLs.\n"
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

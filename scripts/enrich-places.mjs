#!/usr/bin/env node
// DhabaRoute — Google Places API enrichment script
// Run: node scripts/enrich-places.mjs
//
// Reads dhabas.csv, fetches phone / hours / address from Google Places API
// (New), and writes Phone, Hours, Address columns back to the CSV.
//
// Safe to re-run: rows that already have all three fields are skipped.
// Unpublished rows are also skipped.
//
// After running, rebuild the JSON:
//   npm run build:data

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = join(__dirname, "..");
const CSV_PATH = join(ROOT, "data", "dhabas.csv");
const ENV_PATH = join(ROOT, ".env.local");

// ── Load API key ──────────────────────────────────────────────────────────────
function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (key === "GOOGLE_PLACES_API_KEY") return line.slice(eq + 1).trim();
    }
  } catch {}
  return null;
}

const API_KEY = loadEnv(ENV_PATH) ?? process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("❌  GOOGLE_PLACES_API_KEY not found in .env.local");
  console.error("    Add it: echo 'GOOGLE_PLACES_API_KEY=your_key' >> .env.local");
  process.exit(1);
}

// ── Minimal RFC-4180 CSV parser ───────────────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let field = "", row = [], i = 0, inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"')  { inQ = true; i++; continue; }
    if (c === ',')  { row.push(field); field = ""; i++; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = ""; i++; continue;
    }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function csvField(val) {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("|")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(rows) {
  return rows.map((r) => r.map(csvField).join(",")).join("\n") + "\n";
}

// ── Places API helpers ────────────────────────────────────────────────────────
const BASE = "https://places.googleapis.com/v1";

// Extract the human-readable place name from a Google Maps URL.
// e.g. "https://www.google.com/maps/place/Fort+Amargosa+%7C+Punjabi+Dhaba/..."
// → "Fort Amargosa | Punjabi Dhaba"
function placeNameFromUrl(url) {
  try {
    const m = url.match(/\/maps\/place\/([^/?#]+)/);
    if (m) return decodeURIComponent(m[1].replace(/\+/g, " "));
  } catch {}
  return null;
}

// Text Search → returns the first matching place_id.
// Adds a location bias circle when lat/lng are available so the right
// dhaba is returned even when the name is generic (e.g. "Indian Kitchen").
async function searchPlace(query, lat, lng) {
  const body = { textQuery: query, maxResultCount: 1 };
  if (lat != null && lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 50000, // 50 km — wide enough for rural spots
      },
    };
  }
  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.places?.[0]?.id ?? null;
}

// Place Details → returns { phone, hours, address }.
// hours is stored as a pipe-delimited string of the 7 weekday descriptions
// so it survives the CSV round-trip without quoting issues.
async function placeDetails(placeId) {
  const res = await fetch(`${BASE}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "nationalPhoneNumber,regularOpeningHours,formattedAddress",
    },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return {
    phone  : data.nationalPhoneNumber ?? "",
    hours  : (data.regularOpeningHours?.weekdayDescriptions ?? []).join(" | "),
    address: data.formattedAddress ?? "",
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const text = readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim().length > 0));
  if (rows.length < 2) throw new Error("CSV appears empty or header-only");

  const headers = rows[0];

  // Ensure the three new columns exist at the end of the header row.
  for (const col of ["Phone", "Hours", "Address"]) {
    if (!headers.map((h) => h.trim()).includes(col)) headers.push(col);
  }

  // Column index helpers — case-insensitive, whitespace-tolerant.
  function ci(name) {
    return headers.findIndex(
      (h) => h.trim().toLowerCase().replace(/[\s_-]/g, "") ===
             name.toLowerCase().replace(/[\s_-]/g, "")
    );
  }

  const COL = {
    title    : ci("title"),
    maps     : ci("mapsurl"),
    lat      : ci("lat"),
    lng      : ci("lng"),
    published: ci("published"),
    phone    : ci("phone"),
    hours    : ci("hours"),
    address  : ci("address"),
  };

  let enriched = 0, skipped = 0, failed = 0, total = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Pad row to match header length so new columns have an index to write to.
    while (row.length < headers.length) row.push("");

    const title = row[COL.title]?.trim();
    if (!title) continue;

    // Skip unpublished rows.
    if (COL.published !== -1 && row[COL.published]?.trim().toLowerCase() !== "yes") continue;

    total++;

    // Skip if already fully enriched — makes re-runs fast.
    const hasPhone   = row[COL.phone]?.trim().length > 0;
    const hasHours   = row[COL.hours]?.trim().length > 0;
    const hasAddress = row[COL.address]?.trim().length > 0;
    if (hasPhone && hasHours && hasAddress) {
      skipped++;
      continue;
    }

    const mapsUrl = row[COL.maps]?.trim();
    const lat     = parseFloat(row[COL.lat]) || null;
    const lng     = parseFloat(row[COL.lng]) || null;
    const query   = placeNameFromUrl(mapsUrl) ?? title;

    process.stdout.write(`[${r}/${rows.length - 1}] ${title.slice(0, 50)}... `);

    try {
      const placeId = await searchPlace(query, lat, lng);
      if (!placeId) {
        console.log("⚠  not found in Places");
        failed++;
        continue;
      }

      const { phone, hours, address } = await placeDetails(placeId);
      row[COL.phone]   = phone;
      row[COL.hours]   = hours;
      row[COL.address] = address;

      const summary = [
        phone   || "no phone",
        address ? address.split(",")[0] : "no address",
      ].join(" · ");
      console.log(`✓  ${summary}`);
      enriched++;
    } catch (e) {
      console.log(`✗  error: ${e.message}`);
      failed++;
    }

    // Stay well under the 10 req/s default quota: one request every 250 ms.
    await new Promise((res) => setTimeout(res, 250));
  }

  // Write updated CSV back to disk.
  writeFileSync(CSV_PATH, rowsToCsv(rows), "utf8");

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Enrichment complete
   Published rows  : ${total}
   Enriched        : ${enriched}
   Already done    : ${skipped}
   Not found       : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next step: npm run build:data
`);
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });

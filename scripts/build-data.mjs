#!/usr/bin/env node
// Transforms data/dhabas.csv -> data/dhabas.json
// Run: npm run build:data   (also fires automatically via predev / prebuild)
//
// Header matching is case-insensitive. Supported column name variants:
//   Title          : title
//   Slug           : slug
//   Maps URL       : maps url, mapsurl, mapsURL, maps_url
//   Description    : description, desc
//   Tags           : tags, tag
//   Priority       : priority
//   Route Hint     : route hint, routehint, routeHint, route_hint
//   Featured       : featured
//   Needs Review   : needs review, needsreview, needs_review
//   Published      : published
//   Source         : source
//   Lat            : lat, latitude
//   Lng            : lng, longitude, long
//   Combined       : "lat, lng" — one column with values like "34.05, -118.24"

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const CSV_PATH  = join(ROOT, "data", "dhabas.csv");
const OUT_PATH  = join(ROOT, "data", "dhabas.json");

// ── Minimal RFC-4180 CSV parser ──────────────────────────────────────────────
// Handles quoted fields, embedded commas, escaped double-quotes, \r\n endings.
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row   = [];
  let i     = 0;
  let inQ   = false;

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

// ── Header resolution ────────────────────────────────────────────────────────
// Normalise: lowercase + strip spaces, underscores, hyphens so that
// "Route Hint", "routehint", "route_hint", "route-hint" all → "routehint".
function normalise(s) {
  return s.toLowerCase().replace(/[\s_\-]/g, "");
}

// Returns the first index in `headers` whose normalised form matches any
// of the supplied aliases.  Returns -1 if none found.
function findCol(headers, ...aliases) {
  const targets = aliases.map(normalise);
  for (let i = 0; i < headers.length; i++) {
    if (targets.includes(normalise(headers[i]))) return i;
  }
  return -1;
}

// ── Field helpers ────────────────────────────────────────────────────────────
function isYes(v) {
  return typeof v === "string" && v.trim().toLowerCase() === "yes";
}

// "truck parking" → "Truck Parking", "I-40" stays "I-40"
function toTitleCase(s) {
  return s.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );
}

function cleanTitle(t) {
  return (t || "").replace(/\s+/g, " ").trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Returns a finite number or undefined — never throws.
function parseFloat_(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

// Infer a route hint from the title when the CSV has none.
// Matches "I-80", "I 80", "Exit 42" etc.
function inferRouteHint(title) {
  const parts = [];
  const hw   = title.match(/\bI[-\s]?(\d{1,3})\b/i);
  if (hw)   parts.push(`I-${hw[1]}`);
  const exit = title.match(/\bExit\s*(\d{1,4})\b/i);
  if (exit) parts.push(`Exit ${exit[1]}`);
  return parts.join(" · ") || undefined;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const text = readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, ""); // strip BOM
  const rows = parseCsv(text).filter((r) => r.some((c) => c && c.length > 0));
  if (rows.length < 2) throw new Error("CSV appears empty or header-only");

  const rawHeader = rows[0];

  // ── Locate columns (case-insensitive, multi-alias) ───────────────────────
  const COL = {
    title       : findCol(rawHeader, "Title"),
    slug        : findCol(rawHeader, "Slug"),
    maps        : findCol(rawHeader, "Maps URL", "mapsURL", "maps url", "maps_url"),
    desc        : findCol(rawHeader, "Description", "desc"),
    tags        : findCol(rawHeader, "Tags", "Tag"),
    priority    : findCol(rawHeader, "Priority"),
    routeHint   : findCol(rawHeader, "Route Hint", "routeHint", "route hint", "route_hint"),
    featured    : findCol(rawHeader, "Featured"),
    review      : findCol(rawHeader, "Needs Review", "needsreview", "needs review"),
    published   : findCol(rawHeader, "Published"),
    source      : findCol(rawHeader, "Source"),
    lat         : findCol(rawHeader, "Lat", "Latitude"),
    lng         : findCol(rawHeader, "Lng", "Longitude", "Long"),
    // Combined "lat, lng" column — header literally contains a comma.
    // We look for any column whose normalised name is "latlng".
    combined    : findCol(rawHeader, "lat, lng", "lat,lng", "latlng", "lat/lng"),
    // Places API enriched columns (added by scripts/enrich-places.mjs)
    phone       : findCol(rawHeader, "Phone"),
    hours       : findCol(rawHeader, "Hours"),
    address     : findCol(rawHeader, "Address"),
  };

  // Report which columns were found / missing (helps diagnose header drift).
  const missing = Object.entries(COL)
    .filter(([k, v]) => v === -1 && !["combined"].includes(k))
    .map(([k]) => k);
  if (missing.length > 0) {
    console.warn(`[build-data] Columns not found in CSV: ${missing.join(", ")}`);
    console.warn(`[build-data] Actual headers: ${rawHeader.map(h => JSON.stringify(h)).join(", ")}`);
  }

  const used = new Map();
  const out  = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (idx) => (idx !== -1 && idx < row.length ? row[idx] : "");

    const title = cleanTitle(get(COL.title));
    if (!title) continue;

    // Skip unpublished rows (only when Published column exists).
    if (COL.published !== -1 && !isYes(get(COL.published))) continue;

    // ── Slug ────────────────────────────────────────────────────────────────
    const rawSlug  = get(COL.slug).trim() || slugify(title);
    const baseSlug = slugify(rawSlug);
    const n        = (used.get(baseSlug) || 0) + 1;
    used.set(baseSlug, n);
    const slug = n === 1 ? baseSlug : `${baseSlug}-${n}`;

    // ── Coordinates ─────────────────────────────────────────────────────────
    // Priority: separate Lat + Lng columns.
    // Fallback: combined "lat, lng" column with value "34.05, -118.24".
    let lat, lng;

    if (COL.lat !== -1 && COL.lng !== -1) {
      const rawLat = parseFloat_(get(COL.lat));
      const rawLng = parseFloat_(get(COL.lng));
      if (rawLat != null && rawLng != null) { lat = rawLat; lng = rawLng; }
    }

    if (lat == null && COL.combined !== -1) {
      const val   = get(COL.combined).trim();
      const parts = val.split(",").map((s) => s.trim());
      if (parts.length === 2) {
        const a = parseFloat_(parts[0]);
        const b = parseFloat_(parts[1]);
        if (a != null && b != null) { lat = a; lng = b; }
      }
    }

    const coordAccuracy = lat != null ? "csv" : undefined;

    // ── Enriched fields ──────────────────────────────────────────────────────
    // description: verbatim from CSV; omit if blank.
    const description = get(COL.desc).trim() || undefined;

    // tags: comma-separated in CSV → trimmed Title Case string array; empty → [].
    // Title-case normalisation ensures "gas", "Gas", "GAS" all become "Gas" so
    // filter chips (which are Title Case) match consistently.
    const rawTags = get(COL.tags).trim();
    const tags    = rawTags
      ? rawTags.split(/[,|]/).map((s) => toTitleCase(s.trim())).filter(Boolean)
      : [];

    // routeHint: CSV value takes precedence; infer from title only when absent.
    const csvRouteHint = get(COL.routeHint).trim();
    const routeHint    = csvRouteHint || inferRouteHint(title) || undefined;

    // priority: kept for internal sorting; never rendered in the UI.
    const priorityRaw = get(COL.priority).trim().toLowerCase();
    const priority    = priorityRaw === "high" ? "High"
                      : priorityRaw === "low"  ? "Low"
                      : "Medium";

    // ── Places-enriched fields ───────────────────────────────────────────────
    // phone: raw string from CSV, e.g. "(661) 555-1234"
    const phone = COL.phone !== -1 ? get(COL.phone).trim() || undefined : undefined;

    // hours: pipe-delimited weekday strings written by enrich-places.mjs
    // e.g. "Monday: 6:00 AM – 10:00 PM | Tuesday: ..."
    // Split back into an array; omit if empty.
    const rawHours = COL.hours !== -1 ? get(COL.hours).trim() : "";
    const hours = rawHours
      ? rawHours.split("|").map((s) => s.trim()).filter(Boolean)
      : undefined;

    // address: formatted address string from Places API
    const address = COL.address !== -1 ? get(COL.address).trim() || undefined : undefined;

    out.push({
      id           : `d${String(r).padStart(4, "0")}`,
      slug,
      title,
      mapsUrl      : get(COL.maps).trim(),
      description,
      tags,
      priority,               // internal only — not rendered
      routeHint    : routeHint || undefined,
      featured     : isYes(get(COL.featured)),
      needsReview  : isYes(get(COL.review)),
      published    : isYes(get(COL.published)),
      source       : get(COL.source).trim() || undefined,
      lat,
      lng,
      coordAccuracy,
      phone,
      hours,
      address,
    });
  }

  // ── Write output ─────────────────────────────────────────────────────────
  const payload = {
    generatedAt : new Date().toISOString(),
    count       : out.length,
    dhabas      : out,
  };
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");

  // ── Report ───────────────────────────────────────────────────────────────
  const total      = out.length;
  const withCoords = out.filter((d) => d.lat != null).length;
  const withRH     = out.filter((d) => d.routeHint).length;
  const withDesc   = out.filter((d) => d.description).length;
  const withTags   = out.filter((d) => d.tags.length > 0).length;

  console.log(`Wrote ${total} dhabas → ${OUT_PATH}`);
  console.log(`  Coordinates (lat+lng) : ${withCoords} / ${total}`);
  console.log(`  Route hint            : ${withRH} / ${total}`);
  console.log(`  Description           : ${withDesc} / ${total}`);
  console.log(`  Tags                  : ${withTags} / ${total}`);

  // Log one enriched record so changes are easy to spot at a glance.
  const sample = out.find((d) => d.lat != null) ?? out[0];
  if (sample) {
    console.log("\n  Sample record (first with coords, else first row):");
    console.log(JSON.stringify({
      id          : sample.id,
      title       : sample.title,
      lat         : sample.lat,
      lng         : sample.lng,
      routeHint   : sample.routeHint,
      description : sample.description,
      tags        : sample.tags,
    }, null, 4));
  }
}

main();

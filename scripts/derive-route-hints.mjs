#!/usr/bin/env node
// Derives the "Route Hint" column for dhabas in data/dhabas.csv that don't
// have one yet, then runs scripts/build-data.mjs to refresh data/dhabas.json
// in one pass — same pattern as scripts/update-coords.mjs.
//
// Method
// ──────
// Two-stage derivation, in priority order. Existing routeHints are NEVER
// overwritten (preserves the 18 hand-written ones).
//
//   1. Parser  — regex over the Address and Tags columns. Matches:
//        I-NN              → "I-NN · ST"
//        Interstate (Hwy)? NN → "I-NN · ST"
//        US-NN / US Hwy NN → "US-NN · ST"
//      Catches the ~23% of dhabas whose street address literally names
//      a highway. Output has NO "Near" prefix — these are factually on
//      the route.
//
//   2. Geo     — for the rest, project (lat, lng) onto each Interstate
//      polyline in data/interstates.json (anchor-city waypoints) and pick
//      the nearest one within --max-mi (default 25). Output is prefixed
//      with "Near " to signal it's a derived attribution rather than a
//      literal address claim.
//
// Format
// ──────
//   "I-40 · TX"        when the highway appears in the address/tags
//   "Near I-40 · TX"   when derived from coordinates
// The card's CSS uppercases the route line, so case here is for readability
// of the underlying data only.
//
// CSV write-back
// ──────────────
// Only rows whose Route Hint cell changes get re-emitted. Unchanged rows
// keep their original raw text byte-for-byte so the diff stays minimal and
// readable. Quoting follows RFC-4180 (quote on demand, escape internal ").
//
// Flags
// ─────
//   --dry-run     : print a coverage report + sample without writing.
//   --max-mi N    : "near" threshold for the geo lookup. Default 25.
//   --no-rebuild  : skip running scripts/build-data.mjs at the end.
//   --verbose     : print every row's decision (parser/geo/skip).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const CSV_PATH  = join(ROOT, "data", "dhabas.csv");
const HW_PATH   = join(ROOT, "data", "interstates.json");

// ── Args ──────────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const DRY        = args.has("--dry-run");
const NO_REBUILD = args.has("--no-rebuild");
const VERBOSE    = args.has("--verbose");
const MAX_MI = (() => {
  const i = process.argv.indexOf("--max-mi");
  if (i < 0) return 25;
  const n = Number(process.argv[i + 1]);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("--max-mi expects a positive number");
    process.exit(1);
  }
  return n;
})();

// ── Highway parser ────────────────────────────────────────────────────
// Returns a normalised highway label like "I-40", "US-95", or null.
function extractHighwayFromAddress(addr) {
  if (!addr) return null;
  // 1. "I-NN" — most explicit
  let m = addr.match(/\bI-(\d{1,3})\b/);
  if (m) return `I-${m[1]}`;
  // 2. "Interstate (Hwy)? NN"
  m = addr.match(/\bInterstate(?:\s+(?:Hwy|Highway))?\s+(\d{1,3})\b/i);
  if (m) return `I-${m[1]}`;
  // 3. "US-NN" / "US NN" / "US Hwy NN" / "US Highway NN"
  m = addr.match(/\bUS[-\s]?(?:Hwy\s+|Highway\s+)?(\d{1,3})\b/);
  if (m) return `US-${m[1]}`;
  return null;
}

function extractHighwayFromTags(tagsStr) {
  if (!tagsStr) return null;
  // tagsStr is the raw cell, e.g. "Truck Parking, I-40, Bathrooms"
  for (const t of tagsStr.split(",").map((s) => s.trim())) {
    const m = t.match(/^(I-\d{1,3})$/) || t.match(/^(US-\d{1,3})$/);
    if (m) return m[1];
  }
  return null;
}

// ── Geo: nearest-Interstate lookup ────────────────────────────────────
const HW = JSON.parse(readFileSync(HW_PATH, "utf8")).interstates;

const R_MI = 3958.8;
const toRad = (d) => (d * Math.PI) / 180;
function haversineMi(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MI * Math.asin(Math.sqrt(a));
}

// Distance from point P to line segment AB (in miles). Projects in
// degree-space — exact would use a great-circle projection, but at the
// scales of one Interstate segment (≤ a few hundred miles) the deviation
// is well under our tolerance. We measure the projected closest point's
// haversine distance, not the projection distance itself.
function distToSegmentMi(plat, plng, alat, alng, blat, blng) {
  const ax = alng, ay = alat, bx = blng, by = blat;
  const px = plng, py = plat;
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return haversineMi(plat, plng, alat, alng);
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return haversineMi(plat, plng, cy, cx);
}

// Strip the "-W"/"-E" disambiguation suffix from internal Interstate names
// (we use "I-84-W" to distinguish western I-84 from eastern; users see "I-84").
function displayName(name) {
  return name.replace(/-[WE]$/, "");
}

function nearestInterstate(lat, lng) {
  let best = null;
  for (const hw of HW) {
    let minD = Infinity;
    for (let i = 0; i < hw.points.length - 1; i++) {
      const a = hw.points[i], b = hw.points[i + 1];
      const d = distToSegmentMi(lat, lng, a.lat, a.lng, b.lat, b.lng);
      if (d < minD) minD = d;
    }
    if (minD <= MAX_MI && (!best || minD < best.dist)) {
      best = { name: displayName(hw.name), dist: minD };
    }
  }
  return best;
}

// ── State extraction ──────────────────────────────────────────────────
function stateFromAddress(addr) {
  if (!addr) return null;
  const cleaned = addr.replace(/,\s*(USA|Canada)$/i, "");
  const parts = cleaned.split(",");
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1].trim();
  const m = last.match(/^([A-Z]{2})\b/);
  return m ? m[1] : null;
}

// ── CSV (RFC-4180, multi-line aware) ──────────────────────────────────
// Returns rows as { fields: string[], raw: string } so unchanged rows can
// be re-emitted byte-identical to the source. Handles fields with embedded
// commas, double-quote escapes, AND embedded newlines (one record in the
// dataset has \n inside a quoted Title).
function parseCsv(text) {
  const rows = [];
  let fields = [];
  let f = "";
  let i = 0;
  let inQ = false;
  let rowStart = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { f += '"'; i += 2; continue; }
      if (c === '"') { inQ = false; i++; continue; }
      f += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { fields.push(f); f = ""; i++; continue; }
    if (c === '\n' || c === '\r') {
      // Capture this row, then absorb the line ending.
      fields.push(f);
      const eolStart = i;
      if (c === '\r' && text[i + 1] === '\n') i += 2;
      else i++;
      const raw = text.slice(rowStart, eolStart);
      rows.push({ fields, raw });
      fields = [];
      f = "";
      rowStart = i;
      continue;
    }
    f += c; i++;
  }
  // Trailing row without a final newline
  if (f.length > 0 || fields.length > 0) {
    fields.push(f);
    rows.push({ fields, raw: text.slice(rowStart) });
  }
  return rows;
}

function quoteIfNeeded(value) {
  if (value === "" || value == null) return "";
  if (/[",\n\r]/.test(value)) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }
  return String(value);
}

function emitLine(fields) {
  return fields.map(quoteIfNeeded).join(",");
}

function normalize(s) {
  return s.toLowerCase().replace(/[\s_\-]/g, "");
}

// ── Main ──────────────────────────────────────────────────────────────
const raw = readFileSync(CSV_PATH, "utf8");
// Detect line ending — preserve whatever the file uses.
const eol = raw.includes("\r\n") ? "\r\n" : "\n";

const rows = parseCsv(raw);
if (rows.length < 2) {
  console.error("CSV has no data rows");
  process.exit(1);
}

const header = rows[0];
const colIdx = (name) =>
  header.fields.findIndex((h) => normalize(h) === normalize(name));

const idxRouteHint = colIdx("Route Hint");
const idxAddress   = colIdx("Address");
const idxTags      = colIdx("Tags");
const idxLat       = colIdx("Lat");
const idxLng       = colIdx("Lng");
const idxTitle     = colIdx("Title");

if (idxRouteHint < 0) {
  console.error("CSV is missing a 'Route Hint' column");
  process.exit(1);
}

const stats = { existing: 0, parsed: 0, parsedTag: 0, geo: 0, none: 0, total: 0 };
const samples = { parsed: [], geo: [], none: [] };
const outRaws = [header.raw]; // unchanged header passes through

for (let ri = 1; ri < rows.length; ri++) {
  const { fields: f, raw: rowRaw } = rows[ri];
  // Skip empty trailing record (rare, only if the file ends without a row)
  if (f.length === 1 && f[0] === "") { outRaws.push(rowRaw); continue; }

  stats.total++;

  const existing = (f[idxRouteHint] || "").trim();
  if (existing) {
    stats.existing++;
    outRaws.push(rowRaw); // unchanged
    continue;
  }

  const title = f[idxTitle] || "";
  const addr  = f[idxAddress] || "";
  const tags  = f[idxTags] || "";
  const lat   = parseFloat(f[idxLat] || "");
  const lng   = parseFloat(f[idxLng] || "");
  const state = stateFromAddress(addr);

  // Stage 1: parser
  let hint = null;
  let source = null;
  const fromAddr = extractHighwayFromAddress(addr);
  if (fromAddr) { hint = fromAddr; source = "addr"; }
  else {
    const fromTag = extractHighwayFromTags(tags);
    if (fromTag) { hint = fromTag; source = "tag"; }
  }

  // Stage 2: geo
  if (!hint && Number.isFinite(lat) && Number.isFinite(lng)) {
    const near = nearestInterstate(lat, lng);
    if (near) { hint = near.name; source = "geo"; }
  }

  if (!hint) {
    stats.none++;
    if (samples.none.length < 12) samples.none.push(`  ${title}  (${addr.slice(0, 80)})`);
    outRaws.push(rowRaw); // unchanged
    continue;
  }

  // Format
  const prefix = source === "geo" ? "Near " : "";
  const formatted = state ? `${prefix}${hint} · ${state}` : `${prefix}${hint}`;

  if (source === "addr" || source === "tag") {
    stats[source === "tag" ? "parsedTag" : "parsed"]++;
    if (samples.parsed.length < 8) samples.parsed.push(`  ${formatted}  ← ${title}`);
  } else {
    stats.geo++;
    if (samples.geo.length < 12) samples.geo.push(`  ${formatted}  ← ${title}  (${addr.slice(0, 60)}…)`);
  }

  if (VERBOSE) console.log(`[${source}] ${formatted}  ← ${title}`);

  // Re-emit row with the new Route Hint cell
  const newFields = f.slice();
  newFields[idxRouteHint] = formatted;
  outRaws.push(emitLine(newFields));
}

// ── Report ────────────────────────────────────────────────────────────
console.log("─── Route Hint derivation ───");
console.log(`  Total dhabas        : ${stats.total}`);
console.log(`  Existing (kept)     : ${stats.existing}`);
console.log(`  Parsed from address : ${stats.parsed}`);
console.log(`  Parsed from tag     : ${stats.parsedTag}`);
console.log(`  Derived from coords : ${stats.geo}  (within ${MAX_MI} mi)`);
console.log(`  No signal (blank)   : ${stats.none}`);
const filled = stats.existing + stats.parsed + stats.parsedTag + stats.geo;
console.log(`  Coverage            : ${filled}/${stats.total}  (${Math.round(filled/stats.total*100)}%)`);
console.log();

console.log("Sample — parsed:");
samples.parsed.forEach((s) => console.log(s));
console.log();
console.log("Sample — geo-derived:");
samples.geo.forEach((s) => console.log(s));
console.log();
if (samples.none.length) {
  console.log("Sample — left blank (no Interstate within threshold):");
  samples.none.forEach((s) => console.log(s));
}

// ── Write ─────────────────────────────────────────────────────────────
if (DRY) {
  console.log("\n(dry-run — no files written)");
  process.exit(0);
}

// Preserve the source's trailing-newline convention.
const out = outRaws.join(eol) + (raw.endsWith("\n") ? eol : "");
writeFileSync(CSV_PATH, out);
console.log(`\nWrote ${CSV_PATH}`);

if (NO_REBUILD) {
  console.log("(--no-rebuild — skipping build-data)");
  process.exit(0);
}

console.log("Rebuilding data/dhabas.json…");
execSync("node scripts/build-data.mjs", { cwd: ROOT, stdio: "inherit" });

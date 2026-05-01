#!/usr/bin/env node
// Fills the blank-Description rows in data/dhabas.csv with content sourced
// from the Google Places Details API. Strict-mode (option C):
//
//   1. Editorial summary, ONLY when not duplicated across other places we
//      process. Some Google editorials are templated by category (e.g. 3
//      different "Punjabi Dhaba" listings share the same blurb) — those
//      get filtered out so we don't trade one boilerplate for another.
//
//   2. Verbatim review excerpt, but ONLY for reviews that meet a high bar:
//        - rating exactly 5
//        - sentence length 50–180 chars
//        - ≥ 2 distinct food keywords mentioned
//        - English (≥ 80% ASCII letters)
//        - no URLs, phone numbers, dates, ellipsis fragments, or shouting
//      Picks the highest-scoring sentence per place. Reviews that don't
//      clear the bar are skipped entirely — better blank than mediocre.
//
//   3. If neither applies, the row stays blank. The card hides the line.
//
// Output formats (visually distinct on the card):
//   editorial → plain text, third-person ("A casual roadside spot...")
//   review    → typographic quotes ("…") signaling customer voice
//   none      → cell stays empty
//
// API economics
// ─────────────
// Place Details (Pro + Atmosphere) ≈ $0.022/call. ~135 candidate rows ≈
// $3 gross. Google Maps Platform's $200/mo free credit absorbs that with
// huge margin. The .cache/places-details.json file persists API responses
// for 7 days — re-running the picker (different format, different rules)
// costs $0 within that window.
//
// Flags
// ─────
//   --dry-run       Print picks without writing CSV or rebuilding.
//   --no-rebuild    Skip running build-data after writing CSV.
//   --force-fetch   Ignore the response cache, hit API for every row.
//   --max-cost N    Hard cap on this run's API spend in USD (default 10).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, "..");
const CSV_PATH   = join(ROOT, "data", "dhabas.csv");
const JSON_PATH  = join(ROOT, "data", "dhabas.json");
const ENV_PATH   = join(ROOT, ".env.local");
const CACHE_DIR  = join(ROOT, ".cache");
const CACHE_PATH = join(CACHE_DIR, "places-details.json");

const COST_PER_CALL = 0.022; // Place Details Pro + Atmosphere SKU
const CACHE_TTL_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Args ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const arg = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const DRY         = has("--dry-run");
const NO_REBUILD  = has("--no-rebuild");
const FORCE_FETCH = has("--force-fetch");
const MAX_COST    = arg("--max-cost") ? parseFloat(arg("--max-cost")) : 10;

// ── API key ───────────────────────────────────────────────────────────
function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      if (key === "GOOGLE_PLACES_API_KEY") return line.slice(eq + 1).trim();
    }
  } catch { /* fall through */ }
  return null;
}
const API_KEY = loadEnv(ENV_PATH) ?? process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("GOOGLE_PLACES_API_KEY not found in .env.local or env");
  process.exit(1);
}

// ── CSV (RFC-4180, multi-line aware) ──────────────────────────────────
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
      fields.push(f);
      const eolStart = i;
      if (c === '\r' && text[i + 1] === '\n') i += 2;
      else i++;
      rows.push({ fields, raw: text.slice(rowStart, eolStart) });
      fields = [];
      f = "";
      rowStart = i;
      continue;
    }
    f += c; i++;
  }
  if (f.length > 0 || fields.length > 0) {
    fields.push(f);
    rows.push({ fields, raw: text.slice(rowStart) });
  }
  return rows;
}
function quoteIfNeeded(value) {
  if (value === "" || value == null) return "";
  if (/[",\n\r]/.test(value)) return `"${String(value).replace(/"/g, '""')}"`;
  return String(value);
}
const emitLine = (fields) => fields.map(quoteIfNeeded).join(",");
const norm = (s) => s.toLowerCase().replace(/[\s_\-]/g, "");

// ── Sentence extraction + scoring ─────────────────────────────────────
// Distinct food / dish keywords. Generic terms ("food", "curry", "punjabi",
// "indian") are excluded — they don't add specificity. We need ≥ 2 of these
// in the same sentence for a review excerpt to clear the bar.
const FOOD_KEYWORDS = [
  "butter chicken", "paneer", "paratha", "biryani", "naan", "samosa", "tikka",
  "dal", "chai", "lassi", "tandoor", "chana", "saag", "aloo", "roti", "kulfi",
  "chaat", "gulab", "jalebi", "kabab", "kebab", "kheer", "sabzi", "pakora",
  "bhindi", "vindaloo", "korma", "rogan", "shahi", "matar", "rajma", "kadhai",
  "kadhi", "dosa", "idli", "uttapam", "rasam", "sambar", "bhel", "papdi",
  "tikki", "dahi", "raita", "barfi", "mithai", "chapati", "kulcha", "puri",
  "thali", "masala", "vindaloo", "korma", "amritsari", "ghee",
];

function countDistinctFoodKeywords(s) {
  const lower = s.toLowerCase();
  const seen = new Set();
  for (const kw of FOOD_KEYWORDS) {
    if (lower.includes(kw)) seen.add(kw);
  }
  return seen.size;
}

function asciiRatio(s) {
  if (!s) return 0;
  const letters = s.replace(/[^A-Za-zÀ-ɏ]/g, "").length;
  const ascii = s.replace(/[^A-Za-z]/g, "").length;
  return letters > 0 ? ascii / letters : 0;
}

function trimLeadingNoise(s) {
  return s.replace(/^[^A-Za-z0-9“"']+/u, "").trim();
}
function trimTrailingNoise(s) {
  let out = s.replace(/[^A-Za-z0-9.!?"”'’)\]]+$/u, "").trim();
  if (!/[.!?"”'’)\]]$/u.test(out)) out += ".";
  return out;
}
function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => trimTrailingNoise(trimLeadingNoise(s.trim())))
    .filter(Boolean);
}

function scoreExcerptStrict(s) {
  let pts = 0;
  const len = s.length;
  // Hard length cutoffs
  if (len < 50 || len > 180) return -Infinity;
  // Length sweet spot
  if (len >= 70 && len <= 140) pts += 5;
  else if (len >= 60 && len <= 160) pts += 3;
  // Distinct food keywords: ≥ 2 required
  const foodCount = countDistinctFoodKeywords(s);
  if (foodCount < 2) return -Infinity;
  pts += foodCount * 3;
  // Quality words (mild bonus)
  if (/\b(best|delicious|authentic|favorite|amazing|incredible|outstanding|excellent|loved|fresh|homemade|tender|flavorful)\b/i.test(s)) pts += 1;
  // Hard rejects
  if (/https?:\/\//i.test(s)) return -Infinity;
  if (/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(s)) return -Infinity;
  if (/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(s)) return -Infinity;
  if (/\.{3,}|…/.test(s)) return -Infinity;
  // Soft penalties
  if (/\b[A-Z]{4,}\b/.test(s)) pts -= 3;
  if (s === s.toUpperCase() && s.length > 20) pts -= 5;
  if (/!{2,}/.test(s)) pts -= 2;
  if (/[*$#@]/g.test(s)) pts -= 2;
  return pts;
}

function pickBestExcerptStrict(reviews) {
  if (!Array.isArray(reviews)) return null;
  const candidates = [];
  for (const r of reviews) {
    if (!r.text || r.rating !== 5) continue; // 5★ only
    if (asciiRatio(r.text) < 0.8) continue;
    for (const sent of splitSentences(r.text)) {
      const score = scoreExcerptStrict(sent);
      if (score === -Infinity) continue;
      candidates.push({ sent, score });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

// ── Places Details + cache ────────────────────────────────────────────
const BASE = "https://maps.googleapis.com/maps/api/place/details/json";

function loadCache() {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}
function saveCache(cache) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

let cache = loadCache();
let apiCallsThisRun = 0;
let costThisRun = 0;

async function placeDetails(placeId) {
  const now = Date.now();
  const cached = cache[placeId];
  if (!FORCE_FETCH && cached && cached.fetchedAt && (now - cached.fetchedAt) < CACHE_TTL_MS) {
    return cached.result;
  }
  // Cost guard before each call.
  if (costThisRun + COST_PER_CALL > MAX_COST) {
    throw new Error(`would exceed --max-cost (${MAX_COST}) — stopping`);
  }
  const url = new URL(BASE);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,editorial_summary,reviews,rating,user_ratings_total");
  url.searchParams.set("language", "en");
  url.searchParams.set("key", API_KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  if (j.status !== "OK") {
    if (j.status === "ZERO_RESULTS" || j.status === "NOT_FOUND") {
      cache[placeId] = { result: null, fetchedAt: now };
      saveCache(cache);
      return null;
    }
    throw new Error(`${j.status}: ${j.error_message || ""}`);
  }
  apiCallsThisRun++;
  costThisRun += COST_PER_CALL;
  cache[placeId] = { result: j.result, fetchedAt: now };
  // Persist the cache after every call so a mid-run crash doesn't lose work.
  saveCache(cache);
  return j.result;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Identify candidate rows ───────────────────────────────────────────
const csvText = readFileSync(CSV_PATH, "utf8");
const eol = csvText.includes("\r\n") ? "\r\n" : "\n";
const rows = parseCsv(csvText);
if (rows.length < 2) { console.error("CSV has no data rows"); process.exit(1); }

const header = rows[0];
const colIdx = (name) => header.fields.findIndex((h) => norm(h) === norm(name));
const idxDesc    = colIdx("Description");
const idxTitle   = colIdx("Title");
const idxMapsUrl = colIdx("Maps URL");
if (idxDesc < 0) { console.error("CSV missing 'Description' column"); process.exit(1); }
if (idxMapsUrl < 0) { console.error("CSV missing 'Maps URL' column"); process.exit(1); }

// PlaceId from JSON, keyed by Maps URL (CSV slugs are not unique).
const j = JSON.parse(readFileSync(JSON_PATH, "utf8"));
const dhabas = j.dhabas || j;
const placeIdByMapsUrl = Object.fromEntries(
  dhabas.filter((d) => d.placeId && d.mapsUrl).map((d) => [d.mapsUrl, d.placeId]),
);

// Walk CSV, identify candidates (Description currently blank).
const candidates = [];
for (let ri = 1; ri < rows.length; ri++) {
  const { fields: f } = rows[ri];
  if (f.length === 1 && f[0] === "") continue;
  const desc = (f[idxDesc] || "").trim();
  if (desc) continue; // hand-written, leave alone
  const mapsUrl = f[idxMapsUrl] || "";
  const placeId = placeIdByMapsUrl[mapsUrl];
  candidates.push({ ri, title: f[idxTitle] || "", placeId });
}

console.log(`Candidates with blank descriptions: ${candidates.length}`);
console.log(`Cost cap                          : $${MAX_COST}`);
console.log(`Projected cost (uncached)         : $${(candidates.length * COST_PER_CALL).toFixed(2)}`);
console.log();

// ── Pass 1: fetch all (or read from cache) ────────────────────────────
const responses = [];
let fetched = 0, errors = 0, missing = 0;
for (const c of candidates) {
  if (!c.placeId) { missing++; responses.push({ c, result: null, err: "no placeId" }); continue; }
  let result, err;
  try {
    result = await placeDetails(c.placeId);
  } catch (e) {
    err = e.message;
    errors++;
  }
  if (!result) errors++;
  else fetched++;
  responses.push({ c, result, err });
  // Polite delay only when we actually hit the API.
  if (apiCallsThisRun > 0 && !FORCE_FETCH) await sleep(60);
}
console.log(`Fetched (from API or cache): ${fetched}/${candidates.length}`);
console.log(`API calls this run         : ${apiCallsThisRun}  (≈ $${costThisRun.toFixed(2)} this run)`);
console.log(`Cache hits                 : ${fetched - apiCallsThisRun}`);
console.log(`Errors / null              : ${errors}`);
console.log(`Missing placeId            : ${missing}`);
console.log();

// ── Editorial dedup pass ──────────────────────────────────────────────
const editorialFreq = {};
for (const { result } of responses) {
  const ed = result?.editorial_summary?.overview?.trim();
  if (ed) editorialFreq[ed] = (editorialFreq[ed] || 0) + 1;
}

// ── Pass 2: pick description per row ──────────────────────────────────
const stats = { editorialUnique: 0, editorialDup: 0, reviewKept: 0, reviewRejected: 0, blank: 0 };
const samples = { editorial: [], review: [], blank: [] };
const picks = []; // { ri, chosen, source }

for (const { c, result } of responses) {
  if (!result) {
    stats.blank++;
    if (samples.blank.length < 6) samples.blank.push(`  ${c.title}`);
    continue;
  }
  const ed = result.editorial_summary?.overview?.trim();
  if (ed && ed.length >= 20 && ed.length <= 220) {
    if (editorialFreq[ed] === 1) {
      stats.editorialUnique++;
      picks.push({ ri: c.ri, chosen: ed, source: "editorial" });
      if (samples.editorial.length < 8) samples.editorial.push({ title: c.title, text: ed });
      continue;
    } else {
      stats.editorialDup++; // reject duplicate, fall through to review
    }
  }
  const ex = pickBestExcerptStrict(result.reviews);
  if (ex) {
    stats.reviewKept++;
    const wrapped = `“${ex.sent.replace(/^["“]|["”]$/g, "").trim()}”`;
    picks.push({ ri: c.ri, chosen: wrapped, source: "review" });
    if (samples.review.length < 12) samples.review.push({ title: c.title, text: wrapped, score: ex.score });
  } else {
    stats.reviewRejected++;
    stats.blank++;
    if (samples.blank.length < 6) samples.blank.push(`  ${c.title}`);
  }
}

// ── Report ────────────────────────────────────────────────────────────
const filled = stats.editorialUnique + stats.reviewKept;
console.log("─── Picker (option C: strict mode) ───");
console.log(`  Editorial summary (unique) : ${stats.editorialUnique}`);
console.log(`  Editorial rejected (dup)   : ${stats.editorialDup}`);
console.log(`  Review excerpt (passed)    : ${stats.reviewKept}`);
console.log(`  Review rejected (low qual) : ${stats.reviewRejected}`);
console.log(`  Left blank                 : ${stats.blank}`);
console.log(`  Filled                     : ${filled}/${candidates.length}  (${Math.round(filled/candidates.length*100)}%)`);
console.log();

if (samples.editorial.length) {
  console.log("Sample — editorial summaries (unique across run):");
  samples.editorial.forEach((s) => {
    console.log(`  ─ ${s.title}`);
    console.log(`    ${s.text}`);
  });
  console.log();
}
if (samples.review.length) {
  console.log("Sample — review excerpts (rating ★5, ≥2 dishes):");
  samples.review.forEach((s) => {
    console.log(`  ─ ${s.title}  [score ${s.score}]`);
    console.log(`    ${s.text}`);
  });
  console.log();
}
if (samples.blank.length) {
  console.log("Sample — kept blank (no usable signal):");
  samples.blank.forEach((s) => console.log(s));
}

// ── Write ─────────────────────────────────────────────────────────────
if (DRY) {
  console.log("\n(dry-run — no CSV writes)");
  process.exit(0);
}

const pickByRi = Object.fromEntries(picks.map((p) => [p.ri, p]));
const outRaws = [header.raw];
for (let ri = 1; ri < rows.length; ri++) {
  const { fields: f, raw: rowRaw } = rows[ri];
  if (f.length === 1 && f[0] === "") { outRaws.push(rowRaw); continue; }
  const pick = pickByRi[ri];
  if (!pick) { outRaws.push(rowRaw); continue; }
  const newFields = f.slice();
  newFields[idxDesc] = pick.chosen;
  outRaws.push(emitLine(newFields));
}
const out = outRaws.join(eol) + (csvText.endsWith("\n") ? eol : "");
writeFileSync(CSV_PATH, out);
console.log(`\nWrote ${CSV_PATH} (${picks.length} cells filled)`);

if (NO_REBUILD) { console.log("(--no-rebuild — skipping build-data)"); process.exit(0); }
console.log("Rebuilding data/dhabas.json…");
execSync("node scripts/build-data.mjs", { cwd: ROOT, stdio: "inherit" });

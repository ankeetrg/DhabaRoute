#!/usr/bin/env node
// Clears auto-generated boilerplate descriptions from data/dhabas.csv,
// leaving hand-written ones intact. Detects template output by matching
// against telltale phrases lifted from scripts/enrich-data.mjs's
// generateDescription() — every branch of that function emits one of
// these phrases, so any description containing one is template-derived.
//
// Why
// ───
// generateDescription was a stop-gap that wrote ~135 dhabas the same
// uniform boilerplate ("Punjabi dhaba in Texas serving authentic Indian
// road food for truckers and travelers"). On the v2 card grid this reads
// as AI-uniform across the entire home page. Better to show no description
// at all on those cards (the route line, name, status + hours, amenities,
// and city already carry the signal) and let only genuinely hand-written
// descriptions appear.
//
// Method
// ──────
// Walks data/dhabas.csv. For each row, if the Description matches any
// telltale phrase, the cell is cleared to empty. If the description is
// genuinely hand-written (none of the phrases match), it's preserved.
// Then runs scripts/build-data.mjs to refresh data/dhabas.json.
//
// Re-pollution risk
// ─────────────────
// scripts/enrich-data.mjs's generateDescription() is the source of these
// templates. It's not run automatically (only build-data is via predev/
// prebuild). If you ever re-run enrich-data.mjs, it will refill blanks
// with templates — comment out the generateDescription call there if you
// want to prevent that permanently.
//
// Flags
// ─────
//   --dry-run     Print the count + samples; don't write or rebuild.
//   --no-rebuild  Skip running scripts/build-data.mjs after writing.
//   --verbose     Print every cleared row.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const CSV_PATH  = join(ROOT, "data", "dhabas.csv");

const argv = process.argv.slice(2);
const DRY        = argv.includes("--dry-run");
const NO_REBUILD = argv.includes("--no-rebuild");
const VERBOSE    = argv.includes("--verbose");

// ── Telltale template phrases ────────────────────────────────────────
// Lifted from scripts/enrich-data.mjs's generateDescription template
// branches. Each is unique enough that any description containing one is
// known to be template output. If new templates are added there, list
// them here too.
const TELLTALE_PHRASES = [
  /serving authentic Indian road food for truckers and travelers/i,
  /serving fresh Punjabi food — curries, breads, and chai for the road/i,
  /serving Punjabi food for drivers and highway travelers/i,
  /serving classic North Indian homestyle food/i,
  /serving Punjabi comfort food with a roadside vibe/i,
  /with truck parking, fuel, and showers/i,
  /with parking and amenities for long-haul drivers/i,
  /Punjabi dhaba at a truck stop/i,
  /Indian kitchen inside Akal Travel Center/i,
  /hot meals around the clock/i,
  /serving freshly made Punjabi dishes and chaats/i,
  /pick up fresh Indian food alongside pantry staples/i,
  /with a menu that mixes Indian classics and pizza/i,
  /with a relaxed atmosphere and a full Punjabi menu/i,
  /serving aromatic Punjabi curries and fresh breads/i,
  /Quick-service curry spot/i,
  /quick hot meals for drivers without the wait/i,
  /known for rich curries and freshly made breads/i,
  /Bollywood-themed dhaba/i,
  /with a full menu of curries, biryanis, and tandoor dishes/i,
  /with hearty home-style cooking and generous portions/i,
  /the kind of food your nani would make/i,
  /named after the master — expect no-frills, all-flavor cooking/i,
  /known for fresh naan and classic curry combos/i,
  /curries, dals, and tandoor breads made fresh daily/i,
  /everyday Indian food drivers keep coming back for/i,
  /wide menu of regional Indian flavors and daily specials/i,
  /welcome break for drivers crossing the high plains/i,
  /with tandoor specialties and a full Punjabi menu/i,
  /catering to truckers and travelers with fresh daily-cooked meals/i,
  /serving Punjabi classics with a focus on truckers and highway travelers/i,
  /authentic North Indian food made fresh for drivers on the move/i,
  /fuel, food, and rest stop all in one/i,
  /Indian restaurant in Buffalo/i,
];

const isTemplate = (s) => TELLTALE_PHRASES.some((re) => re.test(s));

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

// ── Main ──────────────────────────────────────────────────────────────
const csvText = readFileSync(CSV_PATH, "utf8");
const eol = csvText.includes("\r\n") ? "\r\n" : "\n";
const rows = parseCsv(csvText);
if (rows.length < 2) { console.error("CSV has no data rows"); process.exit(1); }

const header = rows[0];
const colIdx = (name) => header.fields.findIndex((h) => norm(h) === norm(name));
const idxDesc  = colIdx("Description");
const idxTitle = colIdx("Title");
if (idxDesc < 0) { console.error("CSV missing 'Description' column"); process.exit(1); }

const stats = { cleared: 0, kept: 0, blank: 0, total: 0 };
const samples = { kept: [], cleared: [] };
const outRaws = [header.raw];

for (let ri = 1; ri < rows.length; ri++) {
  const { fields: f, raw: rowRaw } = rows[ri];
  if (f.length === 1 && f[0] === "") { outRaws.push(rowRaw); continue; }

  stats.total++;
  const desc = (f[idxDesc] || "").trim();
  const title = f[idxTitle] || "";

  if (!desc) { stats.blank++; outRaws.push(rowRaw); continue; }

  if (isTemplate(desc)) {
    stats.cleared++;
    if (samples.cleared.length < 5) samples.cleared.push(`  ${title}: ${JSON.stringify(desc.slice(0, 80) + "…")}`);
    if (VERBOSE) console.log(`[clear] ${title}`);
    const newFields = f.slice();
    newFields[idxDesc] = "";
    outRaws.push(emitLine(newFields));
  } else {
    stats.kept++;
    if (samples.kept.length < 10) samples.kept.push(`  ${title}: ${JSON.stringify(desc.slice(0, 80) + (desc.length > 80 ? "…" : ""))}`);
    outRaws.push(rowRaw);
  }
}

console.log("─── Templated description cleanup ───");
console.log(`  Total rows           : ${stats.total}`);
console.log(`  Cleared (templated)  : ${stats.cleared}`);
console.log(`  Kept (hand-written)  : ${stats.kept}`);
console.log(`  Already blank        : ${stats.blank}`);
console.log();
console.log(`Sample of CLEARED descriptions:`);
samples.cleared.forEach((s) => console.log(s));
console.log();
console.log(`Sample of KEPT descriptions:`);
samples.kept.forEach((s) => console.log(s));

if (DRY) { console.log("\n(dry-run — no files written)"); process.exit(0); }

const out = outRaws.join(eol) + (csvText.endsWith("\n") ? eol : "");
writeFileSync(CSV_PATH, out);
console.log(`\nWrote ${CSV_PATH}`);

if (NO_REBUILD) { console.log("(--no-rebuild — skipping build-data)"); process.exit(0); }
console.log("Rebuilding data/dhabas.json…");
execSync("node scripts/build-data.mjs", { cwd: ROOT, stdio: "inherit" });

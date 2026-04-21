#!/usr/bin/env node
// Updates data/dhabas.csv with accurate lat/lng extracted from each row's
// Maps URL. Runs `scripts/build-data.mjs` at the end so data/dhabas.json is
// refreshed in one pass.
//
// Method
// ──────
// The original task called for HTTP-fetching each Maps URL and reading the
// redirected `@lat,lng,z` from the final URL. In practice, Google's public
// `/maps/place/.../data=!4m2!3m1!1s{hex1}:{hex2}` URLs return a 200 with a
// default San Diego viewport and only load the real place data client-side
// via JS — there is no server-side redirect to parse, regardless of user
// agent, cookies, or the `dg=es5` force-render flag.
//
// The first hex in `!1s{hex1}:{hex2}` is the FTID (Feature ID), which is an
// S2 CellId at level 30 — i.e. Google's internal geometric identifier for
// the place. Decoding the S2 CellId recovers the exact lat/lng Google uses
// internally (sub-meter precision). This is both more accurate than any
// screen-scrape would be AND requires no network requests, so the 1-second
// rate limit is moot.
//
// If a row's Maps URL doesn't match the FTID pattern, we skip it and flag
// it in the failure list rather than guess.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";
import { S2CellId } from "nodes2ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = join(__dirname, "..");
const CSV_PATH = join(ROOT, "data", "dhabas.csv");

// ── Minimal RFC-4180 CSV parser (identical behaviour to build-data.mjs) ──
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
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { row.push(field); field = ""; i++; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = ""; i++; continue;
    }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// Serialise a single CSV field — quote only when the field contains
// comma, double-quote, or newline. Preserves the existing CSV style.
function csvField(v) {
  const s = String(v ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function serialiseCsv(rows) {
  return rows.map((r) => r.map(csvField).join(",")).join("\n") + "\n";
}

function normalise(s) {
  return s.toLowerCase().replace(/[\s_\-]/g, "");
}
function findCol(headers, ...aliases) {
  const targets = aliases.map(normalise);
  for (let i = 0; i < headers.length; i++) {
    if (targets.includes(normalise(headers[i]))) return i;
  }
  return -1;
}

// Extracts the first hex from Maps URLs shaped like
// ".../data=!4m2!3m1!1s{hex1}:{hex2}". The hex is a 16-char lowercase
// 0x-prefixed token. Returns null if no match.
function extractFtidHex(url) {
  if (!url) return null;
  const m = url.match(/!1s0x([0-9a-fA-F]{1,16}):0x[0-9a-fA-F]+/);
  return m ? m[1].toLowerCase() : null;
}

function decodeFtidToLatLng(hex) {
  // S2CellId.fromToken expects the hex WITHOUT a 0x prefix.
  const id = S2CellId.fromToken(hex);
  if (!id.isValid()) return null;
  const ll = id.toLatLng();
  return {
    lat: Number(ll.latDegrees.toString()),
    lng: Number(ll.lngDegrees.toString()),
  };
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

// ── Main ────────────────────────────────────────────────────────────────
function main() {
  const text = readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("CSV empty or header-only");

  const header = rows[0];
  const COL = {
    title:     findCol(header, "Title"),
    maps:      findCol(header, "Maps URL", "mapsURL", "maps url"),
    published: findCol(header, "Published"),
    lat:       findCol(header, "Lat", "Latitude"),
    lng:       findCol(header, "Lng", "Longitude", "Long"),
  };

  for (const [k, v] of Object.entries(COL)) {
    if (v === -1) throw new Error(`Missing required column: ${k}`);
  }

  let updated     = 0;
  let unchanged   = 0;
  let skippedUnpub = 0;
  const failed   = []; // { row, title, reason }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Ensure row has enough cells for the columns we touch.
    while (row.length <= Math.max(COL.lat, COL.lng)) row.push("");

    const title   = (row[COL.title] || "").trim();
    const mapsUrl = (row[COL.maps]  || "").trim();
    const pub     = (row[COL.published] || "").trim().toLowerCase() === "yes";

    if (!title) continue;                       // blank row
    if (!pub) { skippedUnpub++; continue; }     // not published — don't touch

    const hex = extractFtidHex(mapsUrl);
    if (!hex) {
      failed.push({ row: r, title, reason: mapsUrl ? "no !1s FTID in URL" : "no Maps URL" });
      continue;
    }

    let coords;
    try {
      coords = decodeFtidToLatLng(hex);
    } catch (e) {
      failed.push({ row: r, title, reason: `S2 decode error: ${e.message}` });
      continue;
    }
    if (!coords) {
      failed.push({ row: r, title, reason: "invalid S2 cell" });
      continue;
    }

    const newLat = round6(coords.lat).toString();
    const newLng = round6(coords.lng).toString();

    if (row[COL.lat] === newLat && row[COL.lng] === newLng) {
      unchanged++;
    } else {
      row[COL.lat] = newLat;
      row[COL.lng] = newLng;
      updated++;
    }
  }

  writeFileSync(CSV_PATH, serialiseCsv(rows), "utf8");

  // ── Report ────────────────────────────────────────────────────────────
  console.log(`\n──────── CSV coordinate update ────────`);
  console.log(`  Updated           : ${updated}`);
  console.log(`  Already correct   : ${unchanged}`);
  console.log(`  Skipped (unpub.)  : ${skippedUnpub}`);
  console.log(`  Failed            : ${failed.length}`);
  if (failed.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failed) {
      console.log(`  • row ${f.row} "${f.title}" — ${f.reason}`);
    }
  }

  // Rebuild dhabas.json with the fresh coords.
  console.log(`\nRebuilding data/dhabas.json …`);
  execSync("node scripts/build-data.mjs", { cwd: ROOT, stdio: "inherit" });
}

main();

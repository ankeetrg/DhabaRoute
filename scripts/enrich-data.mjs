#!/usr/bin/env node
// Enriches data/dhabas.csv with descriptions and tags for rows that are missing them.
// Run: node scripts/enrich-data.mjs
// Safe to re-run — only fills blank fields, never overwrites existing content.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_PATH = join(ROOT, "data", "dhabas.csv");

// ── State lookup from lat/lng bounding boxes ──────────────────────────────────
// Returns abbreviation like "CA", "TX", "OR", etc.
function getState(lat, lng) {
  if (lat == null || lng == null) return null;
  const boxes = [
    ["WA", 45.5, 49.0, -124.7, -116.9],
    ["OR", 41.9, 46.3, -124.5, -116.5],
    ["CA", 32.5, 42.0, -124.5, -114.1],
    ["NV", 35.0, 42.0, -120.0, -114.0],
    ["AZ", 31.3, 37.0, -114.8, -109.0],
    ["MT", 44.4, 49.0, -116.0, -104.0],
    ["WY", 40.9, 45.0, -111.1, -104.0],
    ["CO", 36.9, 41.0, -109.1, -102.0],
    ["NM", 31.3, 37.0, -109.1, -103.0],
    ["TX", 25.8, 36.5, -106.6, -93.5],
    ["ID", 42.0, 49.0, -117.2, -111.0],
    ["UT", 36.9, 42.0, -114.1, -109.0],
    ["ND", 45.9, 49.0, -104.1, -96.5],
    ["SD", 42.5, 45.9, -104.1, -96.4],
    ["NE", 40.0, 43.0, -104.1, -95.3],
    ["KS", 36.9, 40.0, -102.1, -94.6],
    ["OK", 33.6, 37.0, -103.0, -94.4],
    ["MN", 43.5, 49.4, -97.2, -89.5],
    ["IA", 40.3, 43.5, -96.6, -90.1],
    ["MO", 36.0, 40.6, -95.8, -89.1],
    ["AR", 33.0, 36.5, -94.6, -89.6],
    ["LA", 28.9, 33.0, -94.0, -88.8],
    ["WI", 42.5, 47.1, -92.9, -86.8],
    ["MI", 41.7, 48.3, -90.4, -82.4],
    ["IL", 36.9, 42.5, -91.5, -87.0],
    ["IN", 37.8, 41.8, -88.1, -84.8],
    ["OH", 38.4, 42.3, -84.8, -80.5],
    ["KY", 36.5, 39.1, -89.6, -81.9],
    ["TN", 34.9, 36.7, -90.3, -81.6],
    ["MS", 30.2, 35.0, -91.7, -88.1],
    ["AL", 30.1, 35.0, -88.5, -84.9],
    ["GA", 30.4, 35.0, -85.6, -80.8],
    ["FL", 24.5, 31.0, -87.6, -80.0],
    ["SC", 32.0, 35.2, -83.4, -78.5],
    ["NC", 33.8, 36.6, -84.3, -75.5],
    ["VA", 36.5, 39.5, -83.7, -75.2],
    ["WV", 37.2, 40.6, -82.6, -77.7],
    ["MD", 37.9, 39.7, -79.5, -75.1],
    ["NJ", 38.9, 41.4, -75.6, -73.9],
    ["NY", 40.5, 45.0, -79.8, -71.9],
    ["PA", 39.7, 42.3, -80.5, -74.7],
    ["CT", 40.9, 42.1, -73.7, -71.8],
    ["MA", 41.2, 42.9, -73.5, -69.9],
  ];
  for (const [st, latMin, latMax, lngMin, lngMax] of boxes) {
    if (lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax) return st;
  }
  return null;
}

const STATE_NAMES = {
  WA: "Washington", OR: "Oregon", CA: "California", NV: "Nevada", AZ: "Arizona",
  MT: "Montana", WY: "Wyoming", CO: "Colorado", NM: "New Mexico", TX: "Texas",
  ID: "Idaho", UT: "Utah", ND: "North Dakota", SD: "South Dakota", NE: "Nebraska",
  KS: "Kansas", OK: "Oklahoma", MN: "Minnesota", IA: "Iowa", MO: "Missouri",
  AR: "Arkansas", LA: "Louisiana", WI: "Wisconsin", MI: "Michigan", IL: "Illinois",
  IN: "Indiana", OH: "Ohio", KY: "Kentucky", TN: "Tennessee", MS: "Mississippi",
  AL: "Alabama", GA: "Georgia", FL: "Florida", SC: "South Carolina", NC: "North Carolina",
  VA: "Virginia", WV: "West Virginia", MD: "Maryland", NJ: "New Jersey", NY: "New York",
  PA: "Pennsylvania", CT: "Connecticut", MA: "Massachusetts",
};

// ── Description generator ─────────────────────────────────────────────────────
function generateDescription(title, routeHint, lat, lng) {
  const t = title.toLowerCase();
  const state = getState(lat, lng);
  const stateName = state ? STATE_NAMES[state] : null;
  const routeStr = routeHint ? ` off ${routeHint}` : (stateName ? ` in ${stateName}` : "");

  // Travel centers / plazas / truck stops
  if (t.includes("travel center") || t.includes("travel plaza"))
    return `Indian food inside a travel center${routeStr} with truck parking, fuel, and showers.`;
  if (t.includes("truck stop") || t.includes("truckstop"))
    return `Punjabi dhaba at a truck stop${routeStr} with parking and amenities for long-haul drivers.`;
  if (t.includes("akal"))
    return `Indian kitchen inside Akal Travel Center${routeStr} serving fresh Punjabi food for truckers.`;
  if (t.includes("24 seven") || t.includes("24seven") || t.includes("24/7"))
    return `Indian food counter inside a 24-hour travel plaza${routeStr} — hot meals around the clock.`;
  if (t.includes("san simon"))
    return `Punjabi food inside San Simon Travel Center${routeStr} — fuel, food, and rest stop all in one.`;

  // Food trucks
  if (t.includes("food truck") || t.includes("rosies") || t.includes("truck"))
    return `Indian food truck${routeStr} serving freshly made Punjabi dishes and chaats.`;

  // Specific identifiers in name
  if (t.includes("grocery") || t.includes("market") || t.includes("groceries"))
    return `Dhaba and grocery store${routeStr} — pick up fresh Indian food alongside pantry staples.`;
  if (t.includes("pizza"))
    return `Dhaba${routeStr} with a menu that mixes Indian classics and pizza — a roadside original.`;
  if (t.includes("diner"))
    return `Indian-American diner${routeStr} serving Punjabi comfort food with a roadside vibe.`;
  if (t.includes("cafe") || t.includes("great indian cafe"))
    return `Sit-down Indian café${routeStr} with a relaxed atmosphere and a full Punjabi menu.`;
  if (t.includes("spice"))
    return `Indian spice kitchen${routeStr} serving aromatic Punjabi curries and fresh breads.`;
  if (t.includes("curry hub") || t.includes("curry express") || t.includes("curry bai"))
    return `Quick-service curry spot${routeHint ? ` at ${routeHint}` : (stateName ? ` in ${stateName}` : "")} — fast, affordable Punjabi food for drivers on the move.`;
  if (t.includes("express"))
    return `Express Punjabi dhaba${routeStr} — quick hot meals for drivers without the wait.`;
  if (t.includes("zaika") || t.includes("ambarsari"))
    return `Authentic North Indian dhaba${routeStr} known for rich curries and freshly made breads.`;
  if (t.includes("bollywood"))
    return `Bollywood-themed dhaba${routeStr} serving homestyle Punjabi food with a fun atmosphere.`;
  if (t.includes("royal") || t.includes("maharaja") || t.includes("kohinoor"))
    return `Upscale Punjabi dhaba${routeStr} with a full menu of curries, biryanis, and tandoor dishes.`;
  if (t.includes("brothers"))
    return `Family-run Punjabi dhaba${routeStr} with hearty home-style cooking and generous portions.`;
  if (t.includes("ghar di roti") || t.includes("home"))
    return `Home-style Punjabi dhaba${routeStr} — the kind of food your nani would make.`;
  if (t.includes("ustaad") || t.includes("sardarji") || t.includes("kake") || t.includes("chacha"))
    return `Traditional Punjabi dhaba${routeStr} named after the master — expect no-frills, all-flavor cooking.`;
  if (t.includes("mangi") || t.includes("kamal") || t.includes("kaler") || t.includes("sandhu") || t.includes("sidhu"))
    return `Family-run Punjabi dhaba${routeStr} serving classic North Indian homestyle food.`;
  if (t.includes("naan house"))
    return `Punjabi dhaba${routeStr} known for fresh naan and classic curry combos.`;
  if (t.includes("taste of punjab") || t.includes("taste of pakistan"))
    return `Authentic Punjabi flavors${routeStr} — curries, dals, and tandoor breads made fresh daily.`;
  if (t.includes("desi dhaba") || t.includes("desi vibes"))
    return `No-frills desi dhaba${routeStr} with the kind of everyday Indian food drivers keep coming back for.`;
  if (t.includes("flavors of india") || t.includes("flavor of india"))
    return `Indian restaurant${routeStr} with a wide menu of regional Indian flavors and daily specials.`;
  if (t.includes("buffalo"))
    return `Indian restaurant in Buffalo${routeStr} serving Punjabi staples with quick service.`;
  if (t.includes("antelope"))
    return `Roadside Indian restaurant${routeStr} — a welcome break for drivers crossing the high plains.`;
  if (t.includes("india grill") || t.includes("indian grill"))
    return `Indian grill${routeStr} with tandoor specialties and a full Punjabi menu.`;
  if (t.includes("food hub") || t.includes("indian food hub"))
    return `Indian food stop${routeStr} catering to truckers and travelers with fresh daily-cooked meals.`;
  if (t.includes("punjabi dhaba") || t.includes("panjabi dhaba"))
    return `Punjabi dhaba${routeStr} serving authentic Indian road food for truckers and travelers.`;
  if (t.includes("dhaba"))
    return `Dhaba${routeStr} serving fresh Punjabi food — curries, breads, and chai for the road.`;
  if (t.includes("indian cuisine") || t.includes("indian food") || t.includes("indian kitchen"))
    return `Indian restaurant${routeStr} serving Punjabi classics with a focus on truckers and highway travelers.`;
  if (t.includes("punjabi"))
    return `Punjabi cuisine${routeStr} — authentic North Indian food made fresh for drivers on the move.`;

  // Generic fallback
  return `Indian restaurant${routeStr} serving Punjabi food for drivers and highway travelers.`;
}

// ── Tag generator ─────────────────────────────────────────────────────────────
function generateTags(title, routeHint, lat, lng) {
  const t = title.toLowerCase();
  const tags = [];

  // Truck parking — nearly universal for dhabas
  const isFoodTruck = t.includes("food truck");
  if (!isFoodTruck) tags.push("Truck Parking");
  else tags.push("Food Truck");

  // Travel center amenities
  if (t.includes("travel center") || t.includes("travel plaza") ||
      t.includes("truck stop") || t.includes("akal") ||
      t.includes("24 seven") || t.includes("san simon") ||
      t.includes("punj truck")) {
    tags.push("Gas", "Showers");
  }

  // Seating
  if (t.includes("cafe") || t.includes("restaurant") || t.includes("grill") ||
      t.includes("royal") || t.includes("maharaja") || t.includes("cuisine")) {
    tags.push("Seating");
  }

  // Highway tag from routeHint
  if (routeHint) {
    const hw = routeHint.match(/\b(I-\d+|US-\d+|Hwy\s*\d+|Exit\s*\d+)\b/gi);
    if (hw) hw.forEach(h => tags.push(h.replace(/\s+/g, " ").trim()));
  }

  // State tag
  const state = getState(lat, lng);
  const stateName = state ? STATE_NAMES[state] : null;
  if (stateName) tags.push(stateName);

  // Dedup while preserving order
  return [...new Set(tags)];
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

function csvQuote(s) {
  if (s == null) return "";
  const str = String(s);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function serializeRow(fields) {
  return fields.map(csvQuote).join(",");
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const text = readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text).filter(r => r.some(c => c && c.length > 0));
  if (rows.length < 2) throw new Error("CSV appears empty");

  const header = rows[0];
  const norm = s => s.toLowerCase().replace(/[\s_\-]/g, "");
  const findCol = (...aliases) => {
    const targets = aliases.map(norm);
    for (let i = 0; i < header.length; i++) {
      if (targets.includes(norm(header[i]))) return i;
    }
    return -1;
  };

  const C = {
    title:     findCol("Title"),
    desc:      findCol("Description", "desc"),
    tags:      findCol("Tags", "Tag"),
    routeHint: findCol("Route Hint", "routehint", "route_hint"),
    published: findCol("Published"),
    lat:       findCol("Lat", "Latitude"),
    lng:       findCol("Lng", "Longitude", "Long"),
  };

  let enriched = 0;
  const updated = [header];

  for (let r = 1; r < rows.length; r++) {
    const row = [...rows[r]];
    const get = idx => (idx !== -1 && idx < row.length ? row[idx] : "");
    const set = (idx, val) => { while (row.length <= idx) row.push(""); row[idx] = val; };

    const title = get(C.title).trim();
    if (!title) { updated.push(row); continue; }

    const currentDesc = get(C.desc).trim();
    const currentTags = get(C.tags).trim();
    const routeHint = get(C.routeHint).trim() || undefined;
    const lat = parseFloat(get(C.lat)) || null;
    const lng = parseFloat(get(C.lng)) || null;

    let changed = false;

    if (!currentDesc) {
      const desc = generateDescription(title, routeHint, lat, lng);
      set(C.desc, desc);
      changed = true;
    }

    if (!currentTags) {
      const tags = generateTags(title, routeHint, lat, lng);
      set(C.tags, tags.join(", "));
      changed = true;
    }

    if (changed) enriched++;
    updated.push(row);
  }

  const out = updated.map(serializeRow).join("\n") + "\n";
  writeFileSync(CSV_PATH, out, "utf8");

  console.log(`Enriched ${enriched} rows with descriptions and/or tags.`);
  console.log(`Total rows: ${updated.length - 1}`);
}

main();

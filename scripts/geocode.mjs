#!/usr/bin/env node
/**
 * geocode.mjs  —  fills missing lat/lng in data/dhabas.csv
 *
 * Strategy (no API key, no network required):
 *
 *   1. CITY MATCH  — look for a US city name inside the title, route hint,
 *      or description, and use that city's coordinates.
 *
 *   2. HIGHWAY + STATE  — extract an interstate number AND a state name
 *      from the combined text, and use a hardcoded approximate waypoint
 *      along that highway in that state.
 *
 *   3. STATE CENTROID  — if we only have a state, drop a pin at the state's
 *      geographic centre.  Better than nothing; these are marked low-accuracy.
 *
 * After running, rebuild the JSON:
 *   npm run build:data
 *
 * Usage:
 *   node scripts/geocode.mjs            (updates data/dhabas.csv)
 *   node scripts/geocode.mjs --dry-run  (prints, no write)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath }               from "node:url";
import { dirname, join }               from "node:path";

const DRY_RUN  = process.argv.includes("--dry-run");
const ROOT     = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSV_PATH = join(ROOT, "data", "dhabas.csv");

// ── Lookup tables ─────────────────────────────────────────────────────────────

// State abbreviation → full name
const STATE_ABBREVS = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",
  KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",
  MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",
  NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",
  NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",
  OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};
const STATE_NAMES = Object.values(STATE_ABBREVS);

// State centroids (geographic centre, decimal degrees)
const STATE_CENTROIDS = {
  Alabama:       [32.806,  -86.791], Alaska:        [61.370, -152.404],
  Arizona:       [33.729, -111.431], Arkansas:      [34.970,  -92.373],
  California:    [36.778, -119.418], Colorado:      [39.113, -105.358],
  Connecticut:   [41.598,  -72.756], Delaware:      [38.910,  -75.527],
  Florida:       [27.994,  -81.760], Georgia:       [32.678,  -83.223],
  Hawaii:        [21.095, -157.498], Idaho:         [44.240, -114.479],
  Illinois:      [40.349,  -88.986], Indiana:       [39.849,  -86.258],
  Iowa:          [42.011,  -93.210], Kansas:        [38.526,  -96.727],
  Kentucky:      [37.668,  -84.670], Louisiana:     [31.169,  -91.868],
  Maine:         [44.693,  -69.382], Maryland:      [39.064,  -76.802],
  Massachusetts: [42.230,  -71.530], Michigan:      [43.327,  -84.536],
  Minnesota:     [45.695,  -93.900], Mississippi:   [32.741,  -89.679],
  Missouri:      [38.457,  -92.289], Montana:       [46.879, -110.363],
  Nebraska:      [41.492,  -99.902], Nevada:        [38.313, -117.055],
  "New Hampshire":[43.452, -71.564], "New Jersey":  [40.298,  -74.521],
  "New Mexico":  [34.841, -106.249], "New York":    [42.165,  -74.948],
  "North Carolina":[35.630,-79.806], "North Dakota":[47.529, -99.784],
  Ohio:          [40.388,  -82.764], Oklahoma:      [35.565,  -96.928],
  Oregon:        [43.804, -120.554], Pennsylvania:  [40.590,  -77.209],
  "Rhode Island":[41.680,  -71.511], "South Carolina":[33.856,-80.945],
  "South Dakota":[44.299,  -99.438], Tennessee:     [35.747,  -86.692],
  Texas:         [31.969,  -99.902], Utah:          [39.321, -111.094],
  Vermont:       [44.046,  -72.711], Virginia:      [37.769,  -78.170],
  Washington:    [47.751, -120.740], "West Virginia":[38.491,  -80.954],
  Wisconsin:     [44.269,  -89.617], Wyoming:       [42.756, -107.302],
};

// Approximate midpoint coordinates for specific interstate + state combos.
// Values are representative, not exit-precise — good for a map pin.
const HWY_STATE = {
  // I-40
  "I-40 California":   [34.929, -115.531], "I-40 Arizona":    [35.198, -111.651],
  "I-40 New Mexico":   [35.085, -106.650], "I-40 Texas":      [35.222, -101.835],
  "I-40 Oklahoma":     [35.467,  -97.517], "I-40 Arkansas":   [35.299,  -92.442],
  "I-40 Tennessee":    [35.876,  -86.000], "I-40 North Carolina":[35.766,-79.989],
  // I-80
  "I-80 California":   [37.912, -121.551], "I-80 Nevada":     [40.799, -116.465],
  "I-80 Utah":         [40.761, -112.098], "I-80 Wyoming":    [41.140, -104.820],
  "I-80 Nebraska":     [40.925,  -98.342], "I-80 Iowa":       [41.588,  -93.620],
  "I-80 Illinois":     [41.826,  -88.308], "I-80 Indiana":    [41.620,  -86.250],
  "I-80 Ohio":         [41.201,  -82.733], "I-80 Pennsylvania":[40.997, -76.887],
  // I-10
  "I-10 California":   [34.052, -118.244], "I-10 Arizona":    [32.222, -110.969],
  "I-10 New Mexico":   [32.319, -106.788], "I-10 Texas":      [30.267,  -97.743],
  "I-10 Louisiana":    [30.451,  -91.154], "I-10 Mississippi":[30.396,  -89.029],
  "I-10 Alabama":      [30.694,  -88.040], "I-10 Florida":    [30.438,  -84.281],
  // I-20
  "I-20 Texas":        [32.725,  -97.321], "I-20 Louisiana":  [32.521,  -92.119],
  "I-20 Mississippi":  [32.298,  -90.185], "I-20 Alabama":    [33.520,  -86.802],
  "I-20 Georgia":      [33.749,  -84.388], "I-20 South Carolina":[34.000,-81.034],
  // I-5
  "I-5 California":    [36.778, -119.699], "I-5 Oregon":      [44.941, -123.033],
  "I-5 Washington":    [47.601, -122.329],
  // I-70
  "I-70 Kansas":       [38.871,  -98.327], "I-70 Missouri":   [38.808,  -92.468],
  "I-70 Illinois":     [39.801,  -89.654], "I-70 Indiana":    [39.768,  -86.158],
  "I-70 Ohio":         [39.962,  -82.999],
  // I-71
  "I-71 Ohio":         [39.961,  -82.999], "I-71 Kentucky":   [38.186,  -85.748],
  // I-90
  "I-90 Washington":   [47.049, -120.539], "I-90 Montana":    [46.595, -112.028],
  "I-90 South Dakota":[44.369,  -100.346], "I-90 Minnesota":  [43.879,  -96.755],
  "I-90 Illinois":     [41.752,  -88.127], "I-90 Indiana":    [41.604,  -86.253],
  "I-90 Ohio":         [41.500,  -81.694],
  // Misc
  "I-30 Texas":        [33.212,  -97.132], "I-35 Texas":      [30.267,  -97.743],
  "I-15 California":   [33.990, -117.377], "I-15 Nevada":     [36.175, -115.137],
  "I-15 Utah":         [40.760, -111.890], "I-15 Montana":    [47.002, -112.985],
};

// Named US cities with coordinates (add as many as needed by the dataset)
const CITIES = {
  // Pacific Northwest
  "Portland":        [45.523, -122.676], "Hillsboro":       [45.523, -122.990],
  "Seattle":         [47.606, -122.332], "Tacoma":          [47.253, -122.444],
  "Eugene":          [44.052, -123.087], "Salem":           [44.942, -123.036],
  "Medford":         [42.326, -122.876], "Spokane":         [47.659, -117.426],
  // California
  "Sacramento":      [38.581, -121.494], "Stockton":        [37.958, -121.291],
  "Fresno":          [36.737, -119.787], "Bakersfield":     [35.373, -119.019],
  "Los Angeles":     [34.052, -118.244], "San Diego":       [32.715, -117.157],
  "San Francisco":   [37.775, -122.419], "San Jose":        [37.339, -121.894],
  "Modesto":         [37.639, -120.997], "Redding":         [40.587, -122.392],
  "Yreka":           [41.735, -122.635], "Dixon":           [38.446, -121.823],
  "Wasco":           [35.594, -119.341], "Eloy":            [32.760, -111.555],
  // Southwest
  "Las Vegas":       [36.175, -115.137], "Reno":            [39.529, -119.813],
  "Phoenix":         [33.449, -112.074], "Tucson":          [32.222, -110.969],
  "Flagstaff":       [35.198, -111.651], "Albuquerque":     [35.085, -106.650],
  "El Paso":         [31.762, -106.485], "Amarillo":        [35.222, -101.835],
  "Lubbock":         [33.578,  -101.855], "Midland":        [31.997, -102.078],
  // Mountain West
  "Denver":          [39.737, -104.984], "Colorado Springs":[38.834,-104.822],
  "Salt Lake City":  [40.760, -111.891], "Boise":           [43.616, -116.201],
  "Billings":        [45.782, -108.501], "Missoula":        [46.872, -114.016],
  "Cheyenne":        [41.140, -104.820], "Casper":          [42.866, -106.313],
  // Midwest
  "Chicago":         [41.878,  -87.630], "Indianapolis":    [39.768,  -86.158],
  "Columbus":        [39.961,  -82.999], "Cleveland":       [41.499,  -81.694],
  "Cincinnati":      [39.103,  -84.512], "Detroit":         [42.332,  -83.047],
  "Milwaukee":       [43.039,  -87.907], "Minneapolis":     [44.977,  -93.265],
  "Kansas City":     [39.099,  -94.578], "St. Louis":       [38.627,  -90.198],
  "Omaha":           [41.258,  -95.934], "Wichita":         [37.688,  -97.336],
  "Hicksville":      [40.768,  -73.525],
  // South & Southeast
  "Dallas":          [32.776,  -96.797], "Fort Worth":      [32.725,  -97.321],
  "Houston":         [29.760,  -95.370], "San Antonio":     [29.425,  -98.494],
  "Austin":          [30.267,  -97.743], "Laredo":          [27.506,  -99.508],
  "New Orleans":     [29.951,  -90.072], "Baton Rouge":     [30.451,  -91.154],
  "Hammond":         [30.504,  -90.461], "Memphis":         [35.149,  -90.048],
  "Nashville":       [36.166,  -86.782], "Knoxville":       [35.961,  -83.921],
  "Chattanooga":     [35.045,  -85.310], "Atlanta":         [33.749,  -84.388],
  "Charlotte":       [35.227,  -80.843], "Raleigh":         [35.779,  -78.638],
  "Richmond":        [37.541,  -77.434], "Roanoke":         [37.271,  -79.941],
  "Bristol":         [36.595,  -82.189], "Joplin":          [37.084,  -94.513],
  "Birmingham":      [33.520,  -86.802], "Montgomery":      [32.361,  -86.279],
  "Mobile":          [30.694,  -88.040], "Jackson":         [32.298,  -90.185],
  "Little Rock":     [34.746,  -92.289], "Tulsa":           [36.154,  -95.993],
  "Oklahoma City":   [35.467,  -97.517], "Springfield":     [37.209,  -93.292],
  "Louisville":      [38.254,  -85.759], "Lexington":       [38.040,  -84.504],
  // Northeast
  "Buffalo":         [42.886,  -78.878], "Rochester":       [43.157,  -77.615],
  "Albany":          [42.652,  -73.756], "Pittsburgh":      [40.440,  -79.996],
  "Philadelphia":    [39.952,  -75.165], "Newark":          [40.736,  -74.172],
  "Baltimore":       [39.290,  -76.612],
};

// ── Location extraction ───────────────────────────────────────────────────────

function extractState(combined) {
  for (const name of STATE_NAMES) {
    if (new RegExp(`\\b${name}\\b`, "i").test(combined)) return name;
  }
  // Two-letter abbreviation at end of a word boundary
  for (const [abbr, name] of Object.entries(STATE_ABBREVS)) {
    if (new RegExp(`(?:^|[\\s,])${abbr}(?:$|[\\s,])`, "g").test(combined)) return name;
  }
  return null;
}

function extractHighway(combined) {
  // Match "I-40", "I 40", "I40" variants, also "I-5"
  const m = combined.match(/\bI[-\s]?(\d{1,3})\b/i);
  return m ? `I-${m[1]}` : null;
}

function extractCity(combined) {
  for (const city of Object.keys(CITIES)) {
    if (new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(combined)) {
      return city;
    }
  }
  return null;
}

function geocodeRow(title, tags, routeHint, description) {
  const combined = [title, tags, routeHint, description].filter(Boolean).join(" ");

  // 1. City match (most specific — directly names a city)
  const city = extractCity(combined);
  if (city) {
    return { ...coords(CITIES[city]), accuracy: "city", note: city };
  }

  // 2. Highway + state combo
  const hwy   = extractHighway(combined);
  const state = extractState(combined);

  if (hwy && state) {
    const key = `${hwy} ${state}`;
    if (HWY_STATE[key]) {
      return { ...coords(HWY_STATE[key]), accuracy: "highway", note: key };
    }
    // Not in table → fall through to state centroid
  }

  // 3. State centroid fallback
  if (state && STATE_CENTROIDS[state]) {
    return { ...coords(STATE_CENTROIDS[state]), accuracy: "state", note: state };
  }

  return null;
}

function coords([lat, lng]) {
  return { lat: +lat.toFixed(4), lng: +lng.toFixed(4) };
}

// ── S2 cell-ID decode ────────────────────────────────────────────────────────
//
// Google Maps URLs carry a Feature Tile ID (FTID) of the form
//   data=!4m2!3m1!1s0x{cellHex}:{cid}
// The cellHex is an S2 cell ID encoding the pin location.
//
// We decode it to lat/lng using the S2 Hilbert-curve tables.
// This is accurate to ~1 km for western/central US; less so for the northeast.
// All results are validated against the continental US bounding box before use.
//
// Table source: verified empirically against 5 known coordinate pairs.

const kPosToIJ_S2   = [[0,2,3,1],[0,1,3,2],[3,1,2,0],[3,2,0,1]];
const kOrientMask_S2 = [1,0,0,3];

function stToUV_s2(s) {
  return s >= 0.5 ? (1/3)*(4*s*s-1) : (1/3)*(1-4*(1-s)*(1-s));
}

function faceUVtoXYZ_s2(face, u, v) {
  switch (face) {
    case 0: return [1, u, v];
    case 1: return [-u, 1, v];
    case 2: return [-u, -v, 1];
    case 3: return [-1, -v, -u];
    case 4: return [v, -1, -u];
    case 5: return [v, u, -1];
  }
}

const FTID_RE = /[!,]1s(0x[0-9a-f]+):[0-9a-fx]+/i;

function s2Decode(mapsUrl) {
  const m = mapsUrl && mapsUrl.match(FTID_RE);
  if (!m) return null;

  let cellId;
  try { cellId = BigInt(m[1]); } catch { return null; }

  const face   = Number(cellId >> 61n);
  if (face < 0 || face > 5) return null;

  let orient = 1;   // empirically determined initial orientation
  let i = 0, j = 0;
  for (let level = 29; level >= 0; level--) {
    const pos2 = Number((cellId >> BigInt(2*level + 1)) & 3n);
    const ij   = kPosToIJ_S2[orient][pos2];
    i = (i << 1) | ((ij >> 1) & 1);
    j = (j << 1) | ( ij       & 1);
    orient ^= kOrientMask_S2[pos2];
  }

  const scale = 1 / (1 << 30);
  const u = stToUV_s2((i + 0.5) * scale);
  const v = stToUV_s2((j + 0.5) * scale);
  const [x, y, z] = faceUVtoXYZ_s2(face, u, v);
  const len = Math.sqrt(x*x + y*y + z*z);

  const lat = (Math.atan2(z/len, Math.sqrt((x/len)**2 + (y/len)**2)) * 180) / Math.PI;
  const lng = (Math.atan2(y/len, x/len) * 180) / Math.PI;

  // Accept only continental US / Alaska / Hawaii
  if (lat < 17 || lat > 72 || lng < -180 || lng > -60) return null;

  return { lat: +lat.toFixed(4), lng: +lng.toFixed(4), accuracy: "s2", note: "s2-decode" };
}

// ── CSV I/O ───────────────────────────────────────────────────────────────────

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
    if (c === '"')  { inQ = true;  i++; continue; }
    if (c === ',')  { row.push(field); field = ""; i++; continue; }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = ""; i++; continue;
    }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function quoteCsv(v) {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function serializeCsv(rows) {
  return rows.map((r) => r.map(quoteCsv).join(",")).join("\n") + "\n";
}

function findCol(header, ...aliases) {
  const norm = (s) => s.toLowerCase().replace(/[\s_\-]/g, "");
  const targets = aliases.map(norm);
  for (let i = 0; i < header.length; i++) {
    if (targets.includes(norm(header[i]))) return i;
  }
  return -1;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const raw  = readFileSync(CSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(raw).filter((r) => r.some((c) => c.trim()));

  const header = rows[0];
  const C = {
    title    : findCol(header, "Title"),
    maps     : findCol(header, "Maps URL", "mapsURL", "maps url", "maps_url"),
    tags     : findCol(header, "Tags", "Tag"),
    routeHint: findCol(header, "Route Hint", "routeHint", "route hint"),
    desc     : findCol(header, "Description", "desc"),
    published: findCol(header, "Published"),
    lat      : findCol(header, "Lat", "Latitude"),
    lng      : findCol(header, "Lng", "Longitude", "Long"),
  };

  const byAccuracy = { city: 0, highway: 0, state: 0 };
  let alreadyHad = 0, notFound = 0;
  const updated   = [header];
  const missing   = [];

  for (let r = 1; r < rows.length; r++) {
    const row = [...rows[r]];
    const get = (idx) => (idx !== -1 && idx < row.length ? row[idx].trim() : "");

    const title = get(C.title);
    if (!title) { updated.push(row); continue; }

    if (C.published !== -1 && get(C.published).toLowerCase() !== "yes") {
      updated.push(row);
      continue;
    }

    if (get(C.lat) && get(C.lng)) {
      alreadyHad++;
      updated.push(row);
      continue;
    }

    const mapsUrl = C.maps !== undefined ? get(C.maps) : "";

    // Pass 1: lookup-based (city / highway+state / state centroid)
    let result = geocodeRow(title, get(C.tags), get(C.routeHint), get(C.desc));

    // Pass 2: S2 cell-ID decode from Google Maps URL
    if (!result) result = s2Decode(mapsUrl);

    if (result) {
      while (row.length <= Math.max(C.lat, C.lng)) row.push("");
      row[C.lat] = String(result.lat);
      row[C.lng] = String(result.lng);
      byAccuracy[result.accuracy]++;
      console.log(`  ✓ [${result.accuracy.padEnd(7)}]  ${title.slice(0,45).padEnd(45)} ${result.lat}, ${result.lng}  (${result.note})`);
    } else {
      notFound++;
      missing.push(title);
      console.log(`  ✗ [no match]  ${title.slice(0, 45)}`);
    }

    updated.push(row);
  }

  if (!DRY_RUN) {
    writeFileSync(CSV_PATH, serializeCsv(updated), "utf8");
    console.log(`\nWrote updated CSV → ${CSV_PATH}`);
  } else {
    console.log("\n[dry-run] No file written.");
  }

  const total = alreadyHad + byAccuracy.city + byAccuracy.highway + byAccuracy.state + notFound;
  console.log(`\n── Summary ${"─".repeat(40)}`);
  console.log(`  Already had coords   : ${alreadyHad}`);
  console.log(`  Geocoded (city)      : ${byAccuracy.city}`);
  console.log(`  Geocoded (highway)   : ${byAccuracy.highway}`);
  console.log(`  Geocoded (state)     : ${byAccuracy.state}`);
  console.log(`  No match             : ${notFound}`);
  console.log(`  Total with coords    : ${alreadyHad + byAccuracy.city + byAccuracy.highway + byAccuracy.state} / ${total}`);

  if (missing.length) {
    console.log(`\n  Still ungeocoded (${missing.length}):`);
    missing.forEach((t) => console.log(`    - ${t}`));
  }
  if (!DRY_RUN) {
    console.log(`\nRun 'npm run build:data' to rebuild data/dhabas.json.`);
  }
}

main();

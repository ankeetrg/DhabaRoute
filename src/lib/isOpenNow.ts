// Parses hours strings like "Monday: 9:00 AM – 8:30 PM" and returns
// whether the place is currently open based on the user's local clock.
//
// Note: this uses the viewer's device timezone, not the dhaba's — good
// enough for a driver who is in or near the same timezone. Crossing
// timezones is a known limitation; we'd need to store a timezone per
// listing to fix it correctly, which isn't worth the data cost yet.
//
// Real-world formats we handle (all from Places API output on our dataset):
//   "Monday: 9:00 AM – 8:30 PM"                       single range
//   "Monday: 11:00 AM – 2:00 PM, 4:00 – 9:00 PM"      lunch+dinner split
//   "Monday: 12:00 – 10:00 PM"                        noon start (no AM/PM)
//   "Monday: 5:00 – 9:00 PM"                          PM inferred from close
//   "Monday: 11:00 AM – 12:00 AM"                     closes at midnight
//   "Monday: Closed"                                  closed all day
//   "Monday: Open 24 hours"                           always open

export type OpenStatus = "open" | "closed" | "unknown";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Parse "9:00 AM" → minutes since midnight. meridiemHint is used when
// the time itself has no AM/PM marker (e.g. "12:00" in "12:00 – 10:00 PM"),
// which is common in the Google Places output for our listings.
function parseTime(str: string, meridiemHint?: "AM" | "PM"): number {
  const m = str.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!m) return -1;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const meridiem = (m[3] || meridiemHint || "").toUpperCase();
  if (!meridiem) return -1;
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

// Pulls the meridiem (AM/PM) from a time string, if present.
function extractMeridiem(str: string): "AM" | "PM" | undefined {
  const m = str.match(/(AM|PM)/i);
  return m ? (m[1].toUpperCase() as "AM" | "PM") : undefined;
}

// Turn "11:00 AM – 2:00 PM" into [openMin, closeMin].
// If close <= open we treat it as wrapping past midnight (close + 24h).
function parseRange(range: string): [number, number] | null {
  const parts = range.split("–").map((s) => s.trim());
  if (parts.length !== 2) return null;

  const openHint = extractMeridiem(parts[0]);
  const closeHint = extractMeridiem(parts[1]);
  // If the open side lacks a meridiem, inherit from close; vice versa.
  const openMin = parseTime(parts[0], openHint ?? closeHint);
  const closeMin = parseTime(parts[1], closeHint ?? openHint);
  if (openMin === -1 || closeMin === -1) return null;

  // "11:00 AM – 12:00 AM" → 11:00 – 24:00 (660 – 1440). Google renders
  // midnight as "12:00 AM" which parses to 0; if close is 0, treat as 1440.
  let close = closeMin;
  if (close <= openMin) close = closeMin === 0 ? 1440 : closeMin + 1440;
  return [openMin, close];
}

export function getOpenStatus(hours: string[] | undefined): OpenStatus {
  if (!hours || hours.length === 0) return "unknown";

  const now = new Date();
  const dayName = DAYS[now.getDay()];
  const todayLine = hours.find((h) => h.startsWith(dayName));
  if (!todayLine) return "unknown";

  const lower = todayLine.toLowerCase();
  if (lower.includes("closed")) return "closed";
  if (lower.includes("open 24") || lower.includes("24 hours")) return "open";

  // Strip "Monday: " prefix, then split on comma for multi-range days.
  const timePart = todayLine.split(":").slice(1).join(":").trim();
  const ranges = timePart.split(",").map((s) => s.trim()).filter(Boolean);
  if (ranges.length === 0) return "unknown";

  const nowMin = now.getHours() * 60 + now.getMinutes();

  let parsedAny = false;
  for (const range of ranges) {
    const parsed = parseRange(range);
    if (!parsed) continue;
    parsedAny = true;
    const [openMin, closeMin] = parsed;
    if (nowMin >= openMin && nowMin < closeMin) return "open";
    // Also check the past-midnight wrap: if current time is in the
    // "morning" of a range that opened yesterday, still consider open.
    // Done by shifting now +1440 and re-testing.
    if (nowMin + 1440 >= openMin && nowMin + 1440 < closeMin) return "open";
  }

  return parsedAny ? "closed" : "unknown";
}

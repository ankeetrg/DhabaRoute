// Extracts highway and state from the freeform routeHint field.
// The field has 4 formats accumulated over time — all handled here
// so highway and state pages can group dhabas consistently.
// Unparseable entries (e.g. "Takeout") return nulls and are skipped.

const STATE_NAMES: Record<string, string> = {
  arizona: "AZ", florida: "FL", nebraska: "NE", ohio: "OH",
  texas: "TX", "new mexico": "NM", california: "CA", oregon: "OR",
  washington: "WA", tennessee: "TN", arkansas: "AR", oklahoma: "OK",
  alabama: "AL", indiana: "IN", missouri: "MO", louisiana: "LA",
  nevada: "NV", utah: "UT", wyoming: "WY", iowa: "IA",
  pennsylvania: "PA", virginia: "VA", "west virginia": "WV",
  "north carolina": "NC", illinois: "IL", montana: "MT",
  minnesota: "MN", "new jersey": "NJ", "new york": "NY",
  mississippi: "MS", michigan: "MI", georgia: "GA",
  ontario: "ON",
};

export function parseRoute(routeHint: string | undefined | null): {
  highway: string | null;
  state: string | null;
} {
  if (!routeHint) return { highway: null, state: null };

  // Extract highway: I-XX or US-XX
  const hwMatch = routeHint.match(/\b(I-\d+|US-\d+)\b/i);
  const highway = hwMatch ? hwMatch[1].toUpperCase() : null;

  // State abbreviation after · separator
  const abbrMatch = routeHint.match(/·\s*([A-Z]{2})\b/);
  if (abbrMatch) return { highway, state: abbrMatch[1] };

  // Full state name anywhere in the string
  const lower = routeHint.toLowerCase();
  for (const [name, abbr] of Object.entries(STATE_NAMES)) {
    if (lower.includes(name)) return { highway, state: abbr };
  }

  return { highway, state: null };
}

export function highwaySlug(highway: string): string {
  return highway.toLowerCase().replace(/\s+/g, "-");
}

export function stateSlug(state: string): string {
  return state.toLowerCase();
}

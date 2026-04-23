export type Priority = "High" | "Medium" | "Low";

export type Tag =
  | "Truck Parking"
  | "Vegetarian"
  | "Late Night"
  | "Fuel Stop"
  | "Restrooms"
  | "Quick Stop"
  | "Buffet"
  | (string & {});

// How the coordinates were obtained — informs display precision.
// 'csv' is hand-verified, 'city' is centroid of a named city,
// 'state' is state centroid (low precision, use sparingly).
export type CoordAccuracy = "csv" | "city" | "state";

export interface Dhaba {
  id: string;
  slug: string;
  title: string;
  mapsUrl: string;
  description?: string;
  tags: Tag[];
  priority: Priority;
  routeHint?: string;
  featured: boolean;
  needsReview: boolean;
  published: boolean;
  source?: string;
  lat?: number;
  lng?: number;
  coordAccuracy?: CoordAccuracy;
  // Places API enriched fields
  phone?: string;
  // hours: array of 7 strings, one per weekday e.g. "Monday: 6:00 AM – 10:00 PM"
  hours?: string[];
  address?: string;
  // Populated by scripts/fetch-photos.ts — the first photo returned by
  // Places Details (New) for the resolved placeId, resolved to a direct
  // lh3.googleusercontent.com URL via the media endpoint with
  // skipHttpRedirect=true. Optional; layouts fall back to a gradient
  // placeholder when absent so the grid never looks misaligned.
  imageUrl?: string;
}

// Dhaba augmented with user-relative data (distance from current location).
export interface RankedDhaba extends Dhaba {
  distanceKm?: number;
}

export interface DhabaPayload {
  generatedAt: string;
  count: number;
  dhabas: Dhaba[];
}

export interface Coords {
  lat: number;
  lng: number;
}

// Display fallback for dhabas that don't yet have a curator-written blurb.
// Kept short + action-oriented: it signals what kind of place this is and
// redirects users to Maps where the authoritative info (hours, reviews,
// photos) lives. Centralised so the card + detail page never drift.
export const DEFAULT_DHABA_DESCRIPTION =
  "Authentic Punjabi dhaba. Open in Maps for hours and details.";

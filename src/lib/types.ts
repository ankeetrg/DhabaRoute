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
  // Places (legacy) Find Place from Text, resolved to a key-free
  // lh3.googleusercontent.com URL by following the 302 from place/photo
  // manually. `null` means we checked and Google had no photo (distinct
  // from undefined = not yet enriched). DhabaPhoto falls back to a warm
  // gradient + utensil glyph when null or missing.
  imageUrl?: string | null;
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


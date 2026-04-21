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

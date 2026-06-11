import type { Dhaba } from "@/lib/types";

export function getDhabaPhotoSrc(
  dhaba: Pick<Dhaba, "placeId" | "imageUrl">,
): string | undefined {
  // Use the stored Google Maps photo URL as the primary source — no API key
  // needed, works immediately for all 157 dhabas.
  if (dhaba.imageUrl) {
    return dhaba.imageUrl;
  }

  // Fall back to the live Google Places API proxy for dhabas added without
  // an imageUrl (requires GOOGLE_PLACES_API_KEY in Vercel env vars).
  if (dhaba.placeId) {
    return `/api/place-photo/${encodeURIComponent(dhaba.placeId)}`;
  }

  return undefined;
}

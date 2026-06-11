import type { Dhaba } from "@/lib/types";

export function getDhabaPhotoSrc(
  dhaba: Pick<Dhaba, "placeId" | "imageUrl">,
): string | undefined {
  // Use the Google Places API proxy as primary — fetches a fresh photo by
  // placeId so images never expire (requires GOOGLE_PLACES_API_KEY in Vercel).
  if (dhaba.placeId) {
    return `/api/place-photo/${encodeURIComponent(dhaba.placeId)}`;
  }

  // Fallback for dhabas without a placeId (stored lh3 URL — may expire over time).
  return dhaba.imageUrl ?? undefined;
}

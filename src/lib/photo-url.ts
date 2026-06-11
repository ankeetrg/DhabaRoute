/**
 * src/lib/photo-url.ts
 *
 * PURPOSE
 * -------
 * Single function that decides which image URL to use for a dhaba card or
 * detail page. Centralising this logic here means the rest of the app never
 * has to think about the photo pipeline — they just call getDhabaPhotoSrc().
 *
 * PHOTO PIPELINE (priority order)
 * --------------------------------
 * 1. storedImageUrl  — Vercel Blob URL, permanent, CDN-cached, no API key
 *                      needed at runtime. Populated by running:
 *                        node scripts/download-photos.mjs
 *
 * 2. /api/place-photo/{placeId}  — Live proxy to Google Places API.
 *                      Used for new dhabas added before the download script
 *                      is re-run. Requires GOOGLE_PLACES_API_KEY in Vercel
 *                      environment variables.
 *
 * 3. imageUrl  — Legacy lh3.googleusercontent.com URL stored in dhabas.json.
 *                These can expire over time (return 403). Last resort only.
 *
 * HANDOFF NOTES FOR DEVELOPERS
 * -----------------------------
 * - Run `node scripts/download-photos.mjs` after adding new dhabas to
 *   populate storedImageUrl for them.
 * - DhabaPhoto (src/components/DhabaPhoto.tsx) handles the loading skeleton,
 *   fade-in, and the warm-gradient fallback glyph when all sources fail.
 */

import type { Dhaba } from "@/lib/types";

export function getDhabaPhotoSrc(
  dhaba: Pick<Dhaba, "storedImageUrl" | "placeId" | "imageUrl">,
): string | undefined {
  // 1. Vercel Blob — permanent, no API key needed
  if (dhaba.storedImageUrl) {
    return dhaba.storedImageUrl;
  }

  // 2. Google Places API proxy — fresh photo, requires GOOGLE_PLACES_API_KEY
  if (dhaba.placeId) {
    return `/api/place-photo/${encodeURIComponent(dhaba.placeId)}`;
  }

  // 3. Legacy lh3 URL — may expire, last resort
  return dhaba.imageUrl ?? undefined;
}

const PLACE_ID_RE = /^[A-Za-z0-9_-]{8,256}$/;
const PHOTO_MAX_WIDTH_PX = "1000";
const SUCCESS_CACHE_CONTROL =
  "public, s-maxage=604800, stale-while-revalidate=2592000";

type RouteContext = {
  params: Promise<{ placeId: string }>;
};

type LegacyPlaceDetailsResponse = {
  status?: string;
  error_message?: string;
  result?: {
    photos?: Array<{
      photo_reference?: string;
    }>;
  };
};

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

// Temporary cached Google photo route.
//
// Why this exists:
// - Stored lh3.googleusercontent.com URLs can expire or start returning 403.
// - Calling Google Places directly from every card would expose the API key
//   and can become expensive.
// - This server route keeps the key private and lets Vercel/CDN cache photo
//   bytes for repeated page views.
//
// Long term, replace this with persistent storage such as Vercel Blob,
// Cloudflare R2, or S3 so Google is only used during an explicit refresh job.
export async function GET(_request: Request, { params }: RouteContext) {
  const { placeId } = await params;

  if (!PLACE_ID_RE.test(placeId)) {
    return jsonError("Invalid placeId", 400);
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return jsonError("Google Places API key is not configured", 500);
  }

  const detailsUrl = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  detailsUrl.searchParams.set("place_id", placeId);
  detailsUrl.searchParams.set("fields", "photos");
  detailsUrl.searchParams.set("key", apiKey);

  const detailsRes = await fetch(detailsUrl, { cache: "no-store" });

  if (!detailsRes.ok) {
    return jsonError("Unable to retrieve place photo metadata", 502);
  }

  const details = (await detailsRes.json()) as LegacyPlaceDetailsResponse;

  if (details.status && details.status !== "OK") {
    return jsonError("Unable to retrieve place photo metadata", 502);
  }

  const photoReference = details.result?.photos?.find(
    (photo) => photo.photo_reference,
  )?.photo_reference;

  if (!photoReference) {
    return jsonError("No Google place photo available", 404);
  }

  const mediaUrl = new URL("https://maps.googleapis.com/maps/api/place/photo");
  mediaUrl.searchParams.set("maxwidth", PHOTO_MAX_WIDTH_PX);
  mediaUrl.searchParams.set("photoreference", photoReference);
  mediaUrl.searchParams.set("key", apiKey);

  const mediaRes = await fetch(mediaUrl, { cache: "no-store", redirect: "follow" });

  if (!mediaRes.ok || !mediaRes.body) {
    return jsonError("Unable to retrieve place photo", 502);
  }

  return new Response(mediaRes.body, {
    status: 200,
    headers: {
      "Content-Type": mediaRes.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": SUCCESS_CACHE_CONTROL,
      "X-DhabaRoute-Photo-Source": "google-places",
    },
  });
}

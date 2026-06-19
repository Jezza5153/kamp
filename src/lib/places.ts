import { getGoogleMapsKey } from "@/lib/settings";

/**
 * Google Places API (New) — Place Details for review DISPLAY. Needs only a Maps
 * API key (no OAuth, no approval). ToS: at most 5 reviews per call, the content
 * must NOT be persisted (callers serve it `no-store`), and display requires
 * attribution + a link back to Google Maps. No self-serving AggregateRating
 * JSON-LD is emitted anywhere. (Owner REPLIES need the separate GBP API.)
 */

export interface PlaceReview {
  author: string;
  authorUrl?: string;
  photoUrl?: string;
  rating: number;
  text: string;
  relativeTime?: string;
}

export interface PlaceReviews {
  rating: number | null;
  total: number | null;
  reviews: PlaceReview[];
  mapsUrl: string | null;
}

// Shape of the fields we request from Place Details (New).
interface RawReview {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  relativePublishTimeDescription?: string;
}
interface RawPlace {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: RawReview[];
}

/** Pure parser for a Place Details (New) response — unit-testable, caps at 5. */
export function parsePlaceDetails(data: RawPlace): PlaceReviews {
  const reviews: PlaceReview[] = Array.isArray(data.reviews)
    ? data.reviews.slice(0, 5).map((r) => ({
        author: r.authorAttribution?.displayName ?? "Google-gebruiker",
        authorUrl: r.authorAttribution?.uri,
        photoUrl: r.authorAttribution?.photoUri,
        rating: typeof r.rating === "number" ? r.rating : 0,
        text: r.text?.text ?? r.originalText?.text ?? "",
        relativeTime: r.relativePublishTimeDescription,
      }))
    : [];
  return {
    rating: typeof data.rating === "number" ? data.rating : null,
    total: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
    reviews,
    mapsUrl: typeof data.googleMapsUri === "string" ? data.googleMapsUri : null,
  };
}

/** Live fetch. Returns null on no key / error / unknown place. Never cache the result. */
export async function fetchPlaceReviews(placeId: string): Promise<PlaceReviews | null> {
  const key = await getGoogleMapsKey();
  if (!key || !placeId) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
    });
    if (!res.ok) return null;
    return parsePlaceDetails((await res.json()) as RawPlace);
  } catch {
    return null;
  }
}

import { getDB } from "@/lib/cf";
import { logModeration } from "@/lib/audit";

/**
 * Google reviews — buildable slice (Backend Master Plan, Step 3). This module
 * handles the place_id seam + the review-ACQUISITION funnel only. It never
 * fetches, stores, or renders Google review text/ratings — that (and the
 * AggregateRating self-serving caveat) belongs to the GBP-OAuth flow, which is
 * gated on Google Business Profile API access approval.
 */

const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;

/** Loose structural check for a Google place_id (e.g. "ChIJ…"). Pure/testable. */
export function validatePlaceId(placeId: string): boolean {
  return PLACE_ID_RE.test(placeId.trim());
}

/** Google's canonical "write a review" deep link — no API or credentials needed. */
export function writeReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

function randomToken(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface BusinessGoogle {
  business_id: string;
  place_id: string | null;
  gbp_connected: number;
  cached_rating: number | null;
  cached_count: number | null;
  review_link_override: string | null;
}

export async function getBusinessGoogle(businessId: string): Promise<BusinessGoogle | null> {
  const db = await getDB();
  if (!db) return null;
  try {
    return await db
      .prepare(
        `SELECT business_id, place_id, gbp_connected, cached_rating, cached_count, review_link_override
         FROM business_google WHERE business_id = ?`
      )
      .bind(businessId)
      .first<BusinessGoogle>();
  } catch {
    return null;
  }
}

/** Admin links a business to its Google place_id (the only persisted Google value). */
export async function setPlaceId(businessId: string, placeId: string, adminId: string): Promise<boolean> {
  const db = await getDB();
  if (!db) return false;
  const clean = placeId.trim();
  if (!businessId || !validatePlaceId(clean)) return false;
  try {
    await db
      .prepare(
        `INSERT INTO business_google (business_id, place_id, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(business_id) DO UPDATE SET place_id = excluded.place_id, updated_at = excluded.updated_at`
      )
      .bind(businessId, clean, Date.now())
      .run();
    await logModeration({
      actorId: adminId,
      action: "set_place_id",
      targetType: "business",
      targetId: businessId,
      businessId,
      detail: { place_id: clean },
    });
    return true;
  } catch {
    return false;
  }
}

/** Mint an opaque review-request token (printed on a counter QR card). */
export async function createReviewRequest(businessId: string): Promise<string | null> {
  const db = await getDB();
  if (!db || !businessId) return null;
  const token = randomToken();
  try {
    await db
      .prepare(`INSERT INTO review_requests (token, business_id, created_at) VALUES (?, ?, ?)`)
      .bind(token, businessId, Date.now())
      .run();
    return token;
  } catch {
    return null;
  }
}

/** Stamp a scan and resolve where to send the visitor (the write-review deep link). */
export async function resolveReviewRequest(
  token: string
): Promise<{ businessId: string; placeId: string | null } | null> {
  const db = await getDB();
  if (!db || !token) return null;
  try {
    const row = await db
      .prepare(`SELECT business_id FROM review_requests WHERE token = ?`)
      .bind(token)
      .first<{ business_id: string }>();
    if (!row) return null;
    await db
      .prepare(`UPDATE review_requests SET scanned_at = ? WHERE token = ? AND scanned_at IS NULL`)
      .bind(Date.now(), token)
      .run();
    const g = await getBusinessGoogle(row.business_id);
    return { businessId: row.business_id, placeId: g?.place_id ?? null };
  } catch {
    return null;
  }
}

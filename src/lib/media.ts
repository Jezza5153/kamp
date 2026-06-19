import { getDB, getPhotos } from "@/lib/cf";
import { setApprovedImage } from "@/lib/overrides";

/**
 * Owner photo uploads on R2 with admin moderation.
 *
 * Photos land PRIVATE + pending in the single PHOTOS bucket and are served only
 * through the access-gated /media/[...key] route. Approval flips status and
 * writes a system-managed imageUrl override (see setApprovedImage) — no object
 * copy, no second bucket. Every accessor degrades safely off-Workers.
 */

export type MediaStatus = "pending" | "approved" | "rejected" | "superseded";
export type MediaKind = "hero" | "gallery";

/** MIME allowlist → file extension. The ext is derived from the DETECTED type
 *  (magic bytes), never from the client filename or claimed Content-Type. */
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export interface MediaRow {
  id: string;
  business_id: string;
  kind: MediaKind;
  r2_key: string;
  status: MediaStatus;
  public_url: string | null;
  submitted_at: number;
}

function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

type DB = NonNullable<Awaited<ReturnType<typeof getDB>>>;
type Photos = Awaited<ReturnType<typeof getPhotos>>;

/** Retire every other row of this business+kind currently at `fromStatus`
 *  (keeping `keepId`): mark superseded and reclaim its R2 object. Keeps exactly
 *  one live row per (business, kind) and prevents orphaned objects. */
async function supersede(
  db: DB,
  photos: Photos,
  businessId: string,
  kind: MediaKind,
  keepId: string,
  fromStatus: MediaStatus
): Promise<void> {
  const { results } = await db
    .prepare(
      "SELECT r2_key FROM business_media WHERE business_id = ? AND kind = ? AND status = ? AND id <> ?"
    )
    .bind(businessId, kind, fromStatus, keepId)
    .all<{ r2_key: string }>();
  if (results.length === 0) return;
  await db
    .prepare(
      "UPDATE business_media SET status = 'superseded' WHERE business_id = ? AND kind = ? AND status = ? AND id <> ?"
    )
    .bind(businessId, kind, fromStatus, keepId)
    .run();
  if (photos) for (const r of results) await photos.delete(r.r2_key).catch(() => {});
}

/** Identify an image by its magic bytes; returns a MIME in the allowlist or null. */
function sniff(b: Uint8Array): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  )
    return "image/png";
  // RIFF....WEBP
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "image/webp";
  // ....ftyp<brand> with an AVIF brand
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand === "avif" || brand === "avis" || brand === "mif1" || brand === "msf1")
      return "image/avif";
  }
  return null;
}

export type UploadResult =
  | { ok: true; mediaId: string; key: string }
  | { ok: false; error: "unavailable" | "empty" | "too_large" | "bad_type" | "db" };

/** Validate (size + magic bytes), store in R2, record a pending row. */
export async function uploadMedia(
  businessId: string,
  file: File,
  uploaderId: string,
  kind: MediaKind = "hero"
): Promise<UploadResult> {
  const db = await getDB();
  const photos = await getPhotos();
  if (!db || !photos) return { ok: false, error: "unavailable" };
  if (file.size === 0) return { ok: false, error: "empty" };
  if (file.size > MAX_BYTES) return { ok: false, error: "too_large" };

  const buf = await file.arrayBuffer();
  const detected = sniff(new Uint8Array(buf.slice(0, 16)));
  if (!detected || !(detected in MIME_EXT)) return { ok: false, error: "bad_type" };
  const ext = MIME_EXT[detected];

  const mediaId = crypto.randomUUID();
  const key = `business/${businessId}/${mediaId}-${randomHex(4)}.${ext}`;

  await photos.put(key, buf, {
    httpMetadata: { contentType: detected, cacheControl: "public, max-age=31536000, immutable" },
  });

  try {
    await db
      .prepare(
        `INSERT INTO business_media (id, business_id, kind, r2_key, status, submitted_by, submitted_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)`
      )
      .bind(mediaId, businessId, kind, key, uploaderId, Date.now())
      .run();
  } catch {
    await photos.delete(key).catch(() => {});
    return { ok: false, error: "db" };
  }
  // A re-upload replaces the owner's previous still-pending photo of this kind,
  // so the moderation queue and R2 stay bounded (one pending per business+kind).
  await supersede(db, photos, businessId, kind, mediaId, "pending");
  return { ok: true, mediaId, key };
}

/**
 * Store a PUBLIC image (no moderation row) under `keyPrefix` in R2 and return its
 * key. Used for admin-authored editorial assets (story heroes) that are public by
 * definition. Same magic-byte validation + 5 MB cap as owner uploads.
 */
export async function uploadPublicImage(
  keyPrefix: string,
  file: File
): Promise<{ ok: true; key: string } | { ok: false; error: "unavailable" | "empty" | "too_large" | "bad_type" }> {
  const photos = await getPhotos();
  if (!photos) return { ok: false, error: "unavailable" };
  if (file.size === 0) return { ok: false, error: "empty" };
  if (file.size > MAX_BYTES) return { ok: false, error: "too_large" };
  const buf = await file.arrayBuffer();
  const detected = sniff(new Uint8Array(buf.slice(0, 16)));
  if (!detected || !(detected in MIME_EXT)) return { ok: false, error: "bad_type" };
  const key = `${keyPrefix}/${crypto.randomUUID()}-${randomHex(4)}.${MIME_EXT[detected]}`;
  await photos.put(key, buf, {
    httpMetadata: { contentType: detected, cacheControl: "public, max-age=31536000, immutable" },
  });
  return { ok: true, key };
}

/** Latest hero photo to show in the owner form: approved first, else pending. */
export async function currentMediaFor(businessId: string): Promise<MediaRow | null> {
  const db = await getDB();
  if (!db) return null;
  return await db
    .prepare(
      `SELECT id, business_id, kind, r2_key, status, public_url, submitted_at
       FROM business_media
       WHERE business_id = ? AND kind = 'hero' AND status IN ('approved','pending')
       ORDER BY (status = 'pending') DESC, submitted_at DESC LIMIT 1`
    )
    .bind(businessId)
    .first<MediaRow>();
}

/** Look up the access-control facts for a key (used by the serving route). */
export async function mediaByKey(
  key: string
): Promise<{ business_id: string; status: MediaStatus } | null> {
  const db = await getDB();
  if (!db) return null;
  return await db
    .prepare("SELECT business_id, status FROM business_media WHERE r2_key = ?")
    .bind(key)
    .first<{ business_id: string; status: MediaStatus }>();
}

export async function listPendingMedia(): Promise<MediaRow[]> {
  const db = await getDB();
  if (!db) return [];
  const { results } = await db
    .prepare(
      `SELECT id, business_id, kind, r2_key, status, public_url, submitted_at
       FROM business_media WHERE status = 'pending' ORDER BY submitted_at ASC`
    )
    .all<MediaRow>();
  return results;
}

/** Approve a hero photo: flip status, set the public serving URL, and push it
 *  onto the business via the system imageUrl override. Returns business_id. */
export async function approveMedia(id: string, reviewerId: string): Promise<string | null> {
  const db = await getDB();
  const photos = await getPhotos();
  if (!db) return null;
  // Only a pending row can be approved — makes the action idempotent and stops
  // a replayed/stale POST from re-publishing a rejected or superseded row.
  const row = await db
    .prepare("SELECT business_id, r2_key, kind, status FROM business_media WHERE id = ?")
    .bind(id)
    .first<{ business_id: string; r2_key: string; kind: MediaKind; status: MediaStatus }>();
  if (!row || row.status !== "pending") return null;

  const url = `/media/${row.r2_key}`;
  await db
    .prepare(
      "UPDATE business_media SET status = 'approved', public_url = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?"
    )
    .bind(url, reviewerId, Date.now(), id)
    .run();

  if (row.kind === "hero") {
    // Retire the previous approved hero (and reclaim its R2 object) so exactly
    // one approved hero exists and its bytes aren't orphaned.
    await supersede(db, photos, row.business_id, "hero", id, "approved");
    await setApprovedImage(row.business_id, url);
  }
  return row.business_id;
}

/** Reject: flip status and reclaim the R2 object. */
export async function rejectMedia(id: string, reviewerId: string): Promise<string | null> {
  const db = await getDB();
  const photos = await getPhotos();
  if (!db) return null;
  // Only a pending row can be rejected — so rejection can never delete the bytes
  // of a currently-live approved photo (closes the stale-override hazard).
  const row = await db
    .prepare("SELECT business_id, r2_key, status FROM business_media WHERE id = ?")
    .bind(id)
    .first<{ business_id: string; r2_key: string; status: MediaStatus }>();
  if (!row || row.status !== "pending") return null;

  await db
    .prepare(
      "UPDATE business_media SET status = 'rejected', reviewed_by = ?, reviewed_at = ? WHERE id = ?"
    )
    .bind(reviewerId, Date.now(), id)
    .run();
  if (photos) await photos.delete(row.r2_key).catch(() => {});
  return row.business_id;
}

import { revalidatePath } from "next/cache";
import { getDB, getPhotos } from "@/lib/cf";

/**
 * GDPR / data-erasure helpers.
 *
 * Businesses live in the static seed; D1 only holds owner-submitted data
 * (overrides, uploaded media) and accounts. These purges remove that submitted
 * data so a delisted business reverts to its seed values and an erasure request
 * can be honoured. Safe no-ops off-Workers.
 */

/** Erase everything D1/R2 holds for one business: uploaded photos (R2 + rows),
 *  text/image overrides, and owner links. The listing reverts to the seed. */
export async function purgeBusiness(
  businessId: string
): Promise<{ ok: boolean; photos: number }> {
  const db = await getDB();
  const photos = await getPhotos();
  if (!db) return { ok: false, photos: 0 };

  const { results } = await db
    .prepare("SELECT r2_key FROM business_media WHERE business_id = ?")
    .bind(businessId)
    .all<{ r2_key: string }>();
  if (photos) for (const r of results) await photos.delete(r.r2_key).catch(() => {});

  await db.prepare("DELETE FROM business_media WHERE business_id = ?").bind(businessId).run();
  await db.prepare("DELETE FROM business_overrides WHERE business_id = ?").bind(businessId).run();
  await db.prepare("DELETE FROM owner_business WHERE business_id = ?").bind(businessId).run();

  revalidatePath("/");
  revalidatePath("/kaart");
  revalidatePath(`/ondernemers/${businessId}`);
  return { ok: true, photos: results.length };
}

/** Erase a person: their account, sessions, business links, and the photos they
 *  uploaded (R2 + rows). Approved photos that are now the live image are also
 *  removed; affected businesses fall back to the seed image on next revalidate. */
export async function purgeProfile(
  profileId: string
): Promise<{ ok: boolean; photos: number; businesses: string[] }> {
  const db = await getDB();
  const photos = await getPhotos();
  if (!db) return { ok: false, photos: 0, businesses: [] };

  const media = await db
    .prepare("SELECT r2_key, business_id FROM business_media WHERE submitted_by = ?")
    .bind(profileId)
    .all<{ r2_key: string; business_id: string }>();
  if (photos) for (const r of media.results) await photos.delete(r.r2_key).catch(() => {});
  await db.prepare("DELETE FROM business_media WHERE submitted_by = ?").bind(profileId).run();

  // profiles cascade to sessions + owner_business (FK ON DELETE CASCADE)
  await db.prepare("DELETE FROM profiles WHERE id = ?").bind(profileId).run();

  const businesses = [...new Set(media.results.map((r) => r.business_id))];
  for (const id of businesses) revalidatePath(`/ondernemers/${id}`);
  revalidatePath("/");
  return { ok: true, photos: media.results.length, businesses };
}

/**
 * Single data-access seam for business data.
 *
 * Today it returns the static seed (src/data/businesses.ts). Once the Cloudflare
 * backend is provisioned, getOverrides() will read APPROVED owner edits from D1
 * and they are merged on top of the seed here — so every page/component that
 * reads through this module automatically reflects approved changes, while the
 * seed remains the permanent fallback and the param set for SSG.
 *
 * Rule: server code (pages, route handlers, sitemap, server components) reads via
 * the async getters below. The raw `businesses` array stays the build-time seed.
 */

import { businesses as seed, type Business } from "@/data/businesses";

/**
 * Approved owner edits keyed by business id, read from D1.
 *
 * Returns {} when not running on Workers (plain `next build` / `next dev`) or
 * when the table is empty/unreachable — so the static seed is always a safe
 * fallback and the build never depends on the database being present.
 */
export async function getOverrides(): Promise<Record<string, Partial<Business>>> {
  // Keep the production build hermetic: prerender from the seed only. Overrides
  // are applied at runtime / ISR regeneration. (Also avoids parallel SSG workers
  // contending on the local D1 file during `next build`.)
  if (process.env.NEXT_PHASE === "phase-production-build") return {};
  try {
    const { getDB } = await import("@/lib/cf");
    const db = await getDB();
    if (!db) return {};
    const { results } = await db
      .prepare(
        "SELECT business_id, fields FROM business_overrides WHERE status = 'approved' ORDER BY reviewed_at ASC, submitted_at ASC"
      )
      .all<{ business_id: string; fields: string }>();
    const map: Record<string, Partial<Business>> = {};
    for (const row of results) {
      try {
        map[row.business_id] = { ...(map[row.business_id] ?? {}), ...JSON.parse(row.fields) };
      } catch {
        // skip a malformed override row rather than failing the whole page
      }
    }
    return map;
  } catch {
    return {};
  }
}

function applyOverride(b: Business, ov?: Partial<Business>): Business {
  return ov ? { ...b, ...ov } : b;
}

/** All businesses (seed + approved overrides), including closed. */
export async function getBusinesses(): Promise<Business[]> {
  const ov = await getOverrides();
  return seed.map((b) => applyOverride(b, ov[b.id]));
}

/** Active (non-closed) businesses, merged with approved overrides. */
export async function getActiveBusinesses(): Promise<Business[]> {
  return (await getBusinesses()).filter((b) => b.status !== "closed");
}

/** One business by id, merged with its approved override. */
export async function getBusiness(id: string): Promise<Business | undefined> {
  const b = seed.find((x) => x.id === id);
  if (!b) return undefined;
  const ov = await getOverrides();
  return applyOverride(b, ov[id]);
}

/** Synchronous seed access — for build-time param sets and client fallbacks only. */
export const allBusinessesSeed: Business[] = seed;

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

/** Approved overrides keyed by business id. Stub until D1 is wired (Phase 1). */
export async function getOverrides(): Promise<Record<string, Partial<Business>>> {
  // Phase 1 (Cloudflare): read approved rows from D1 via getCloudflareContext().env.DB
  // and return { [businessId]: { ...changedFields } }. Until then, no overrides.
  return {};
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

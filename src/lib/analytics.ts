import { getDB } from "@/lib/cf";

/**
 * Cookieless analytics (migration 0010). No cookies, no cross-day identifiers →
 * no consent banner required. The visitor hash is a daily-salted HMAC so the same
 * person is unlinkable from one day to the next; no IP/UA is ever stored.
 */

const EVENT_TYPES = [
  "pageview",
  "action_click",
  "claim",
  "newsletter_confirm",
  "giftcard_paid",
  "review_scan",
  "story_view",
  "search",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function isEventType(t: string): t is EventType {
  return (EVENT_TYPES as readonly string[]).includes(t);
}

async function hmacHex(keyData: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyData),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Salt that rotates every day → visitors aren't linkable across days. */
export async function dailySalt(secret: string, dateKey: string): Promise<string> {
  return hmacHex(secret, `salt:${dateKey}`);
}

export async function visitorHash(salt: string, ipUa: string): Promise<string> {
  return (await hmacHex(salt, ipUa)).slice(0, 32);
}

export async function recordEvent(
  type: EventType,
  opts: { businessId?: string; detail?: unknown; visitorHash?: string }
): Promise<void> {
  const db = await getDB();
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT INTO analytics_events (id, type, business_id, visitor_hash, detail, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        type,
        opts.businessId ?? null,
        opts.visitorHash ?? null,
        opts.detail === undefined ? null : JSON.stringify(opts.detail),
        Date.now()
      )
      .run();
  } catch {
    // analytics must never break a request
  }
}

/** No-throw server-side event (call from server actions: claim, newsletter, etc.). */
export async function logServerEvent(type: EventType, businessId?: string, detail?: unknown): Promise<void> {
  if (!isEventType(type)) return;
  try {
    await recordEvent(type, { businessId, detail });
  } catch {
    /* never throw */
  }
}

export async function getAnalyticsSummary(days = 30): Promise<{ byType: Record<string, number>; total: number }> {
  const db = await getDB();
  if (!db) return { byType: {}, total: 0 };
  try {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const { results } = await db
      .prepare(`SELECT type, COUNT(*) AS n FROM analytics_events WHERE created_at >= ? GROUP BY type`)
      .bind(since)
      .all<{ type: string; n: number }>();
    const byType: Record<string, number> = {};
    let total = 0;
    for (const r of results) {
      byType[r.type] = r.n;
      total += r.n;
    }
    return { byType, total };
  } catch {
    return { byType: {}, total: 0 };
  }
}

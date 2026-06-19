import type { D1Database } from "@/lib/cf";

/**
 * Sliding-window rate limiter backed by the D1 `rate_limit` table (migration
 * 0003). This is *defence in depth* alongside Turnstile + the Cloudflare WAF, so
 * it deliberately FAILS OPEN: when D1 is unbound (plain `next build` / `next dev`)
 * or a query errors, the caller is allowed through rather than locked out — the
 * same degrade-to-functional contract the rest of the codebase uses.
 */

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterMs: number;
}

/**
 * Pure window arithmetic — the single source of truth the SQL below mirrors and
 * the unit tests cover. A window resets once it is older than `windowMs`.
 */
export function nextWindow(
  prev: { count: number; window_start: number } | null,
  now: number,
  windowMs: number
): { count: number; window_start: number } {
  if (!prev || prev.window_start <= now - windowMs) {
    return { count: 1, window_start: now };
  }
  return { count: prev.count + 1, window_start: prev.window_start };
}

/**
 * Atomically count this hit against `key` and report whether it is within
 * `limit` per `windowMs`. One statement (UPSERT … RETURNING) so concurrent hits
 * can't race a read-then-write.
 */
export async function rateLimit(
  db: D1Database | null,
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): Promise<RateLimitResult> {
  if (!db) return { allowed: true, count: 0, limit, retryAfterMs: 0 };
  const threshold = now - windowMs; // windows at/older than this reset
  try {
    const row = await db
      .prepare(
        `INSERT INTO rate_limit (key, count, window_start) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN window_start <= ? THEN 1 ELSE count + 1 END,
           window_start = CASE WHEN window_start <= ? THEN ? ELSE window_start END
         RETURNING count, window_start`
      )
      .bind(key, now, threshold, threshold, now)
      .first<{ count: number; window_start: number }>();
    const count = row?.count ?? 1;
    const allowed = count <= limit;
    const retryAfterMs = allowed ? 0 : (row?.window_start ?? now) + windowMs - now;
    return { allowed, count, limit, retryAfterMs };
  } catch {
    return { allowed: true, count: 0, limit, retryAfterMs: 0 }; // fail open
  }
}

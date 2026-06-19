import type { D1Database, D1Stmt } from "@/lib/cf";

/**
 * Nightly maintenance prune (Backend Master Plan, §6 cron job — the cron *entry*
 * is wired at deploy time; this is the reusable logic it calls). Keeping the
 * statement list pure makes it unit-testable without a live D1.
 */
export function maintenanceStatements(now: number): { sql: string; params: unknown[] }[] {
  const DAY_MS = 24 * 60 * 60 * 1000;
  return [
    // Consumed or expired magic-link tokens.
    { sql: "DELETE FROM auth_tokens WHERE used = 1 OR expires_at < ?", params: [now] },
    // Expired sessions (the 30-day cookie's server-side record).
    { sql: "DELETE FROM sessions WHERE expires_at < ?", params: [now] },
    // Stale rate-limit windows (longest window in use is far under a day).
    { sql: "DELETE FROM rate_limit WHERE window_start < ?", params: [now - DAY_MS] },
  ];
}

export interface MaintenanceReport {
  ok: boolean;
  ran: number;
}

/** Run the prune as a single D1 batch. No-ops (ok:false) when D1 is unbound. */
export async function runMaintenance(
  db: D1Database | null,
  now: number = Date.now()
): Promise<MaintenanceReport> {
  if (!db) return { ok: false, ran: 0 };
  try {
    const prepared: D1Stmt[] = maintenanceStatements(now).map((s) =>
      db.prepare(s.sql).bind(...s.params)
    );
    await db.batch(prepared);
    return { ok: true, ran: prepared.length };
  } catch {
    return { ok: false, ran: 0 };
  }
}

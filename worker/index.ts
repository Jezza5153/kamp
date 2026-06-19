// @ts-nocheck
/**
 * Custom Cloudflare Worker entry that adds a scheduled() (cron) handler on top of
 * the OpenNext-built fetch handler (the generated `.open-next/worker.js` exports
 * only `fetch`). Self-contained — it talks to env.DB directly so the wrangler
 * bundle doesn't need the app's `@/` path alias.
 *
 * ACTIVATION (do on your first deploy, then verify):
 *   1. In wrangler.jsonc set  "main": "worker/index.ts"  (was ".open-next/worker.js")
 *   2. In wrangler.jsonc add   "triggers": { "crons": ["0 3 * * *"] }
 *   3. Run `npm run preview:cf` and confirm the generated worker still serves +
 *      that `GET /cdn-cgi/handler/scheduled` triggers runScheduled (check wrangler tail).
 * Kept inactive by default so the standard deploy can never break on an unverified wrapper.
 */
import openNextWorker from "../.open-next/worker.js";

export default {
  fetch: openNextWorker.fetch,
  async scheduled(_controller: unknown, env: { DB?: KampD1 }, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(runScheduled(env));
  },
};

interface KampStmt {
  bind(...args: unknown[]): KampStmt;
  run(): Promise<unknown>;
}
interface KampD1 {
  prepare(q: string): KampStmt;
  batch(stmts: KampStmt[]): Promise<unknown>;
}

/** Nightly housekeeping. Mirrors src/lib/maintenance.ts (kept inline to avoid the
 *  `@/` alias in the worker bundle) + analytics retention. */
async function runScheduled(env: { DB?: KampD1 }): Promise<void> {
  const db = env.DB;
  if (!db) return;
  const now = Date.now();
  const DAY = 86_400_000;
  try {
    await db.batch([
      db.prepare("DELETE FROM auth_tokens WHERE used = 1 OR expires_at < ?").bind(now),
      db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now),
      db.prepare("DELETE FROM rate_limit WHERE window_start < ?").bind(now - DAY),
      db.prepare("DELETE FROM leads WHERE confirmed_at IS NULL AND status = 'new' AND created_at < ?").bind(now - 30 * DAY),
      db.prepare("DELETE FROM owner_invites WHERE claimed_at IS NULL AND expires_at < ?").bind(now),
      db.prepare("DELETE FROM newsletter_subscribers WHERE status = 'pending' AND created_at < ?").bind(now - 30 * DAY),
      db.prepare("DELETE FROM analytics_events WHERE created_at < ?").bind(now - 35 * DAY),
    ]);
  } catch (e) {
    console.error("scheduled maintenance failed", e);
  }
  // TODO when those features go live: GBP review-aggregate refresh, newsletter
  // digest assembly, analytics daily rollup, gift-card expiry sweep, D1→R2 backup.
}

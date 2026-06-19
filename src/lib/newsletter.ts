import { getDB, type D1Database } from "@/lib/cf";

/**
 * Newsletter subscriptions (migration 0007). Self-hosted: capture → double-opt-in
 * confirm → (later) send via Resend. GDPR-correct — stores the consent copy +
 * timestamp, never resurrects a bounced address, and supports one-click
 * unsubscribe. All public entry points behave the same regardless of whether the
 * address exists (no enumeration).
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase());
}

function token(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function logSubEvent(db: D1Database, subscriberId: string, event: string): Promise<void> {
  try {
    await db
      .prepare(`INSERT INTO subscriber_events (id, subscriber_id, event, created_at) VALUES (?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), subscriberId, event, Date.now())
      .run();
  } catch {
    // audit is best-effort
  }
}

/** Capture an opt-in. Returns a confirmToken to email ONLY when a confirmation
 *  is actually needed (new / pending / re-opt-in) — never for already-confirmed
 *  or bounced addresses. Always reports ok to the caller (anti-enumeration). */
export async function subscribe(
  email: string,
  source: string,
  consentText: string
): Promise<{ ok: boolean; confirmToken?: string }> {
  const clean = email.trim().toLowerCase();
  if (!validateEmail(clean)) return { ok: false };
  const db = await getDB();
  if (!db) return { ok: true };
  try {
    const existing = await db
      .prepare(`SELECT id, status FROM newsletter_subscribers WHERE email = ?`)
      .bind(clean)
      .first<{ id: string; status: string }>();

    if (existing) {
      if (existing.status === "confirmed" || existing.status === "bounced") return { ok: true };
      const t = token();
      await db
        .prepare(`UPDATE newsletter_subscribers SET status = 'pending', confirm_token = ? WHERE id = ?`)
        .bind(t, existing.id)
        .run();
      await logSubEvent(db, existing.id, "subscribe");
      return { ok: true, confirmToken: t };
    }

    const id = crypto.randomUUID();
    const confirmToken = token();
    const now = Date.now();
    await db
      .prepare(
        `INSERT INTO newsletter_subscribers
           (id, email, status, confirm_token, unsub_token, consent_text, consent_at, source, created_at)
         VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, clean, confirmToken, token(), consentText, now, source, now)
      .run();
    await logSubEvent(db, id, "subscribe");
    return { ok: true, confirmToken };
  } catch {
    return { ok: true };
  }
}

/** Double-opt-in confirm. Idempotent. Won't re-activate a bounced/unsubscribed row. */
export async function confirmSubscriber(t: string): Promise<boolean> {
  const db = await getDB();
  if (!db || !t) return false;
  try {
    const row = await db
      .prepare(`SELECT id, status FROM newsletter_subscribers WHERE confirm_token = ?`)
      .bind(t)
      .first<{ id: string; status: string }>();
    if (!row) return false;
    if (row.status === "confirmed") return true; // idempotent
    if (row.status === "unsubscribed" || row.status === "bounced") return false;
    await db
      .prepare(`UPDATE newsletter_subscribers SET status = 'confirmed', confirmed_at = ? WHERE id = ?`)
      .bind(Date.now(), row.id)
      .run();
    await logSubEvent(db, row.id, "confirm");
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribe(t: string): Promise<boolean> {
  const db = await getDB();
  if (!db || !t) return false;
  try {
    const row = await db
      .prepare(`SELECT id FROM newsletter_subscribers WHERE unsub_token = ?`)
      .bind(t)
      .first<{ id: string }>();
    if (!row) return false;
    await db
      .prepare(`UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE id = ?`)
      .bind(row.id)
      .run();
    await logSubEvent(db, row.id, "unsubscribe");
    return true;
  } catch {
    return false;
  }
}

export interface SubscriberRow {
  id: string;
  email: string;
  status: string;
  source: string | null;
  created_at: number;
  confirmed_at: number | null;
}

export async function listSubscribers(status?: string): Promise<SubscriberRow[]> {
  const db = await getDB();
  if (!db) return [];
  try {
    const stmt = status
      ? db.prepare(`SELECT id, email, status, source, created_at, confirmed_at FROM newsletter_subscribers WHERE status = ? ORDER BY created_at DESC`).bind(status)
      : db.prepare(`SELECT id, email, status, source, created_at, confirmed_at FROM newsletter_subscribers ORDER BY created_at DESC`);
    const { results } = await stmt.all<SubscriberRow>();
    return results;
  } catch {
    return [];
  }
}

export async function subscriberCounts(): Promise<Record<string, number>> {
  const db = await getDB();
  if (!db) return {};
  try {
    const { results } = await db
      .prepare(`SELECT status, COUNT(*) AS n FROM newsletter_subscribers GROUP BY status`)
      .all<{ status: string; n: number }>();
    const m: Record<string, number> = {};
    for (const r of results) m[r.status] = r.n;
    return m;
  } catch {
    return {};
  }
}

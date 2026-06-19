import { getDB, type D1Database } from "@/lib/cf";
import { sendEmail } from "@/lib/email";

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

// ---------------------------------------------------------------------------
// Campaign sending (issues + idempotent, resumable delivery)
// ---------------------------------------------------------------------------

export interface IssueRow {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: number;
  sent_at: number | null;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Plain-text body → safe HTML paragraphs + the required unsubscribe footer. Pure. */
export function renderIssueHtml(bodyText: string, unsubUrl: string): string {
  const paras = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:600px;color:#1f2937">${paras}<hr style="border:none;border-top:1px solid #ddd;margin:24px 0"><p style="color:#888;font-size:12px">Je ontvangt deze mail omdat je bent ingeschreven voor de nieuwsbrief van Ondernemers van de Kamp. <a href="${escapeHtml(unsubUrl)}">Uitschrijven</a>.</p></div>`;
}

export async function createIssue(subject: string, body: string, adminId: string): Promise<{ ok: boolean; id?: string }> {
  const db = await getDB();
  if (!db) return { ok: false };
  if (!subject.trim() || !body.trim()) return { ok: false };
  const id = crypto.randomUUID();
  try {
    await db
      .prepare(`INSERT INTO newsletter_issues (id, subject, body, status, created_by, created_at) VALUES (?, ?, ?, 'draft', ?, ?)`)
      .bind(id, subject.trim(), body.trim(), adminId, Date.now())
      .run();
    return { ok: true, id };
  } catch {
    return { ok: false };
  }
}

export async function listIssues(): Promise<(IssueRow & { sent: number })[]> {
  const db = await getDB();
  if (!db) return [];
  try {
    const { results } = await db.prepare(`SELECT * FROM newsletter_issues ORDER BY created_at DESC`).all<IssueRow>();
    const out: (IssueRow & { sent: number })[] = [];
    for (const i of results) {
      const c = await db
        .prepare(`SELECT COUNT(*) AS n FROM newsletter_deliveries WHERE issue_id = ? AND status = 'sent'`)
        .bind(i.id)
        .first<{ n: number }>();
      out.push({ ...i, sent: c?.n ?? 0 });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Send one batch of an issue to confirmed subscribers who haven't received it yet.
 * Idempotent + resumable: re-running skips already-sent recipients, so the admin
 * can click "send next batch" until remaining hits 0 (keeps each call under the
 * Worker time budget). Sets List-Unsubscribe headers for one-click unsubscribe.
 */
export async function sendIssueBatch(
  issueId: string,
  baseUrl: string,
  limit = 100
): Promise<{ sent: number; remaining: number }> {
  const db = await getDB();
  if (!db) return { sent: 0, remaining: 0 };
  const issue = await db
    .prepare(`SELECT subject, body FROM newsletter_issues WHERE id = ?`)
    .bind(issueId)
    .first<{ subject: string; body: string }>();
  if (!issue) return { sent: 0, remaining: 0 };

  await db.prepare(`UPDATE newsletter_issues SET status = 'sending' WHERE id = ? AND status = 'draft'`).bind(issueId).run();

  const { results: subs } = await db
    .prepare(
      `SELECT s.id AS id, s.email AS email, s.unsub_token AS unsub_token
       FROM newsletter_subscribers s
       WHERE s.status = 'confirmed'
         AND NOT EXISTS (SELECT 1 FROM newsletter_deliveries d WHERE d.issue_id = ? AND d.subscriber_id = s.id AND d.status = 'sent')
       LIMIT ?`
    )
    .bind(issueId, limit)
    .all<{ id: string; email: string; unsub_token: string }>();

  let sent = 0;
  for (const sub of subs) {
    const unsubUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${sub.unsub_token}`;
    await sendEmail(sub.email, issue.subject, renderIssueHtml(issue.body, unsubUrl), {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
    await db
      .prepare(`INSERT OR REPLACE INTO newsletter_deliveries (issue_id, subscriber_id, status, sent_at) VALUES (?, ?, 'sent', ?)`)
      .bind(issueId, sub.id, Date.now())
      .run();
    sent++;
  }

  const rem = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM newsletter_subscribers s
       WHERE s.status = 'confirmed'
         AND NOT EXISTS (SELECT 1 FROM newsletter_deliveries d WHERE d.issue_id = ? AND d.subscriber_id = s.id AND d.status = 'sent')`
    )
    .bind(issueId)
    .first<{ n: number }>();
  const remaining = rem?.n ?? 0;
  if (remaining === 0) {
    await db.prepare(`UPDATE newsletter_issues SET status = 'sent', sent_at = ? WHERE id = ?`).bind(Date.now(), issueId).run();
  }
  return { sent, remaining };
}

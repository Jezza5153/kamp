import { getDB, type D1Database } from "@/lib/cf";
import { moderationStmt } from "@/lib/audit";

/**
 * Owner invites (migration 0004) — the keystone that gives owner_business a UI
 * writer. An admin links an email to a business; ownership is NOT granted yet.
 * It binds only when that exact email logs in (claimInvitesForEmail), so the
 * magic link proves control of the address. This is the core isolation property.
 */

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Admin issues an invite. Atomic: invite row + audit entry in one batch. */
export async function inviteOwner(
  email: string,
  businessId: string,
  adminId: string
): Promise<{ ok: boolean; token?: string }> {
  const db = await getDB();
  if (!db) return { ok: false };
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean) || !businessId) return { ok: false };
  const token = randomToken();
  const now = Date.now();
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO owner_invites (token, email, business_id, expires_at, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(token, clean, businessId, now + INVITE_TTL_MS, adminId, now),
      moderationStmt(
        db,
        { actorId: adminId, action: "invite", targetType: "business", targetId: businessId, businessId, detail: { email: clean } },
        now
      ),
    ]);
    return { ok: true, token };
  } catch {
    return { ok: false };
  }
}

/**
 * On login, bind every unexpired, unclaimed invite for THIS exact email to the
 * profile (idempotent), mark each claimed, flip any matching lead to converted,
 * and audit. Returns the number of businesses newly linked. Email-match is the
 * security boundary: an invite for a@x can never be claimed by b@y.
 */
export async function claimInvitesForEmail(
  db: D1Database,
  profileId: string,
  email: string
): Promise<number> {
  const clean = email.trim().toLowerCase();
  const now = Date.now();
  try {
    const { results } = await db
      .prepare(
        `SELECT token, business_id FROM owner_invites
         WHERE email = ? AND claimed_at IS NULL AND expires_at > ?`
      )
      .bind(clean, now)
      .all<{ token: string; business_id: string }>();
    if (results.length === 0) return 0;

    const stmts = results.flatMap((inv) => [
      db
        .prepare(`INSERT OR IGNORE INTO owner_business (profile_id, business_id, created_at) VALUES (?, ?, ?)`)
        .bind(profileId, inv.business_id, now),
      db.prepare(`UPDATE owner_invites SET claimed_at = ? WHERE token = ?`).bind(now, inv.token),
      db
        .prepare(`UPDATE leads SET status = 'converted' WHERE email = ? AND business_id = ? AND status != 'rejected'`)
        .bind(clean, inv.business_id),
      moderationStmt(
        db,
        { actorId: profileId, action: "claim", targetType: "business", targetId: inv.business_id, businessId: inv.business_id, detail: { email: clean } },
        now
      ),
    ]);
    await db.batch(stmts);
    return results.length;
  } catch {
    return 0;
  }
}

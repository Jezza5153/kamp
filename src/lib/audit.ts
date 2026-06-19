import { getDB, type D1Database, type D1Stmt } from "@/lib/cf";

/**
 * Immutable moderation audit (moderation_log, migration 0004). Every approve /
 * reject / invite / claim / purge appends one row. `moderationStmt` returns a
 * prepared statement so callers can fold the audit into the same `db.batch([...])`
 * as the action it records (atomic), while `logModeration` is the fire-and-forget
 * convenience used when atomicity isn't required.
 */

export interface ModerationEntry {
  actorId: string; // profile id or 'system'
  action: string;
  targetType: string;
  targetId: string;
  businessId?: string | null;
  detail?: unknown;
}

export function moderationStmt(db: D1Database, e: ModerationEntry, now: number): D1Stmt {
  return db
    .prepare(
      `INSERT INTO moderation_log (id, actor_id, action, target_type, target_id, business_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      e.actorId,
      e.action,
      e.targetType,
      e.targetId,
      e.businessId ?? null,
      e.detail === undefined ? null : JSON.stringify(e.detail),
      now
    );
}

export async function logModeration(e: ModerationEntry): Promise<void> {
  const db = await getDB();
  if (!db) return;
  try {
    await moderationStmt(db, e, Date.now()).run();
  } catch {
    // Audit is best-effort — never fail the user action because logging failed.
  }
}

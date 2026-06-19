import { getDB } from "@/lib/cf";
import { logModeration } from "@/lib/audit";

/**
 * Inbound listing applications (leads, migration 0004). The public /aanmelden
 * form writes a `new` lead + emails a double-opt-in link; confirming flips it to
 * `confirmed`; an admin approves/rejects; and claiming an invite converts it.
 */

export interface LeadInput {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  story?: string;
  instagram?: string;
  businessId?: string;
  consentText: string;
  source?: string;
}

export interface LeadRow {
  id: string;
  business_id: string | null;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  story: string | null;
  instagram: string | null;
  status: string;
  confirmed_at: number | null;
  created_at: number;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Pure validation so the rules are unit-testable without a DB. */
export function validateLead(input: LeadInput): boolean {
  return (
    input.businessName.trim() !== "" &&
    input.contactName.trim() !== "" &&
    EMAIL_RE.test(input.email.trim().toLowerCase()) &&
    input.consentText.trim() !== ""
  );
}

function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createLead(input: LeadInput): Promise<{ ok: boolean; confirmToken?: string }> {
  const db = await getDB();
  if (!db) return { ok: false };
  if (!validateLead(input)) return { ok: false };
  const email = input.email.trim().toLowerCase();
  const confirmToken = randomToken();
  const now = Date.now();
  try {
    await db
      .prepare(
        `INSERT INTO leads
           (id, business_id, business_name, contact_name, email, phone, address, story, instagram,
            consent_text, consent_at, confirm_token, status, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        input.businessId ?? null,
        input.businessName.trim(),
        input.contactName.trim(),
        email,
        input.phone?.trim() || null,
        input.address?.trim() || null,
        input.story?.trim() || null,
        input.instagram?.trim() || null,
        input.consentText,
        now,
        confirmToken,
        input.source ?? "web",
        now
      )
      .run();
    return { ok: true, confirmToken };
  } catch {
    return { ok: false };
  }
}

/** Double-opt-in: flip an unconfirmed lead to `confirmed`. Idempotent. */
export async function confirmLead(token: string): Promise<boolean> {
  const db = await getDB();
  if (!db || !token) return false;
  try {
    const row = await db
      .prepare(`SELECT id FROM leads WHERE confirm_token = ? AND confirmed_at IS NULL`)
      .bind(token)
      .first<{ id: string }>();
    if (!row) return false;
    await db
      .prepare(
        `UPDATE leads SET confirmed_at = ?, status = CASE WHEN status = 'new' THEN 'confirmed' ELSE status END
         WHERE confirm_token = ?`
      )
      .bind(Date.now(), token)
      .run();
    return true;
  } catch {
    return false;
  }
}

export async function listLeads(status?: string): Promise<LeadRow[]> {
  const db = await getDB();
  if (!db) return [];
  try {
    const stmt = status
      ? db.prepare(`SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC`).bind(status)
      : db.prepare(`SELECT * FROM leads ORDER BY created_at DESC`);
    const { results } = await stmt.all<LeadRow>();
    return results;
  } catch {
    return [];
  }
}

export async function setLeadStatus(
  id: string,
  status: "approved" | "rejected",
  adminId: string
): Promise<void> {
  const db = await getDB();
  if (!db || !id) return;
  await db
    .prepare(`UPDATE leads SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?`)
    .bind(status, adminId, Date.now(), id)
    .run();
  await logModeration({
    actorId: adminId,
    action: status === "approved" ? "approve_lead" : "reject_lead",
    targetType: "lead",
    targetId: id,
  });
}

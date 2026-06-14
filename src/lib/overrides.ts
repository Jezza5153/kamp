import { revalidatePath } from "next/cache";
import { getDB } from "@/lib/cf";

/**
 * Owner-editable fields. Deliberately a small, safe text subset — never
 * category/geo/ownership. Each maps 1:1 to a Business field name so the merged
 * override in businessData.ts is valid without transformation.
 */
export const EDITABLE_FIELDS = [
  "shortDescription",
  "longDescription",
  "hoursNote",
  "phone",
  "email",
  "websiteUrl",
  "instagramUrl",
  "facebookUrl",
  "priceRange",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

export const FIELD_LABELS: Record<EditableField, string> = {
  shortDescription: "Korte omschrijving",
  longDescription: "Uitgebreide omschrijving",
  hoursNote: "Openingstijden (tekst)",
  phone: "Telefoon",
  email: "E-mail",
  websiteUrl: "Website",
  instagramUrl: "Instagram",
  facebookUrl: "Facebook",
  priceRange: "Prijsniveau (bijv. €€)",
};

export interface OverrideRow {
  id: string;
  business_id: string;
  fields: string;
  status: "pending" | "approved" | "rejected";
  submitted_by: string | null;
  submitted_at: number;
  reviewed_by: string | null;
  reviewed_at: number | null;
  reason: string | null;
}

function clean(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of EDITABLE_FIELDS) {
    const v = input[key];
    if (typeof v === "string" && v.trim() !== "") out[key] = v.trim();
  }
  return out;
}

/** Insert a pending override (one row = one submission of changed fields). */
export async function submitOverride(
  businessId: string,
  profileId: string,
  input: Record<string, unknown>
): Promise<{ ok: boolean; changed: number }> {
  const db = await getDB();
  if (!db) return { ok: false, changed: 0 };
  const fields = clean(input);
  if (Object.keys(fields).length === 0) return { ok: true, changed: 0 };
  await db
    .prepare(
      `INSERT INTO business_overrides (id, business_id, fields, status, submitted_by, submitted_at)
       VALUES (?, ?, ?, 'pending', ?, ?)`
    )
    .bind(crypto.randomUUID(), businessId, JSON.stringify(fields), profileId, Date.now())
    .run();
  return { ok: true, changed: Object.keys(fields).length };
}

/** Latest pending override fields for one business (so the form pre-fills the
 *  owner's own in-flight edits, not just the live values). */
export async function pendingFieldsFor(businessId: string): Promise<Record<string, string>> {
  const db = await getDB();
  if (!db) return {};
  const row = await db
    .prepare(
      `SELECT fields FROM business_overrides
       WHERE business_id = ? AND status = 'pending'
       ORDER BY submitted_at DESC LIMIT 1`
    )
    .bind(businessId)
    .first<{ fields: string }>();
  if (!row) return {};
  try {
    return JSON.parse(row.fields);
  } catch {
    return {};
  }
}

export async function listPending(): Promise<OverrideRow[]> {
  const db = await getDB();
  if (!db) return [];
  const { results } = await db
    .prepare(
      `SELECT * FROM business_overrides WHERE status = 'pending' ORDER BY submitted_at ASC`
    )
    .all<OverrideRow>();
  return results;
}

export async function moderateOverride(
  id: string,
  decision: "approved" | "rejected",
  reviewerId: string,
  reason?: string
): Promise<string | null> {
  const db = await getDB();
  if (!db) return null;
  const row = await db
    .prepare("SELECT business_id FROM business_overrides WHERE id = ?")
    .bind(id)
    .first<{ business_id: string }>();
  if (!row) return null;

  // Approving supersedes any earlier approved row for the same business by
  // leaving them in place — getOverrides() merges all approved rows, newest
  // values win because we re-approve the full field set each time.
  await db
    .prepare(
      `UPDATE business_overrides SET status = ?, reviewed_by = ?, reviewed_at = ?, reason = ? WHERE id = ?`
    )
    .bind(decision, reviewerId, Date.now(), reason ?? null, id)
    .run();

  if (decision === "approved") {
    revalidatePath("/");
    revalidatePath("/kaart");
    revalidatePath(`/ondernemers/${row.business_id}`);
  }
  return row.business_id;
}

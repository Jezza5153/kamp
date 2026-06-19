import { getDB } from "@/lib/cf";
import { logModeration } from "@/lib/audit";
import { events as seed, type EventCategory, type KampEvent } from "@/data/events";

/**
 * Agenda events seam (migration 0006). Approved D1 events are merged on top of
 * the curated seed (src/data/events.ts) so /agenda shows both, with identical
 * rendering + Event JSON-LD. The seed is the permanent fallback.
 */

export const EVENT_CATEGORIES: EventCategory[] = [
  "De Kamp",
  "Markt",
  "Koopzondag",
  "Festival",
  "Cultuur",
  "Seizoen",
];

export interface EventInput {
  title: string;
  category: string;
  recurring?: string;
  whenText: string;
  startDate?: string;
  endDate?: string;
  where: string;
  description: string;
  url?: string;
  businessId?: string;
}

const HTTP_RE = /^https?:\/\//i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in ISO form — round-trips so 2026-13-45 / 2026-02-31 fail. */
function validDate(s: string): boolean {
  if (!ISO_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Pure validation — unit-testable. Rejects bad categories, non-http(s) URLs
 *  (no `javascript:` href XSS), impossible dates, and end-before-start. */
export function validateEvent(input: EventInput): boolean {
  if (!input.title.trim() || !input.whenText.trim() || !input.where.trim() || !input.description.trim()) {
    return false;
  }
  if (!(EVENT_CATEGORIES as string[]).includes(input.category)) return false;
  const url = (input.url ?? "").trim();
  if (url && !HTTP_RE.test(url)) return false;
  const sd = (input.startDate ?? "").trim();
  const ed = (input.endDate ?? "").trim();
  if (sd && !validDate(sd)) return false;
  if (ed && !validDate(ed)) return false;
  if (sd && ed && ed < sd) return false; // ISO yyyy-mm-dd compares chronologically
  return true;
}

interface EventRow {
  id: string;
  title: string;
  category: string;
  recurring: string | null;
  when_text: string;
  start_date: string | null;
  end_date: string | null;
  where_text: string;
  description: string;
  url: string | null;
  business_id: string | null;
  status: string;
}

function toKampEvent(r: EventRow): KampEvent {
  return {
    id: r.id,
    title: r.title,
    category: r.category as EventCategory,
    recurring: r.recurring ?? undefined,
    whenText: r.when_text,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    where: r.where_text,
    description: r.description,
    url: r.url ?? undefined,
  };
}

export async function getApprovedEvents(): Promise<KampEvent[]> {
  // Keep the production build hermetic (like getOverrides()).
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
  const db = await getDB();
  if (!db) return [];
  try {
    const { results } = await db
      .prepare(`SELECT * FROM events WHERE status = 'approved' ORDER BY start_date IS NULL, start_date ASC`)
      .all<EventRow>();
    return results.map(toKampEvent);
  } catch {
    return [];
  }
}

/** Curated seed + approved D1 events (seed id wins on collision). For /agenda. */
export async function getAgendaEvents(): Promise<KampEvent[]> {
  const extra = await getApprovedEvents();
  const seen = new Set(seed.map((e) => e.id));
  return [...seed, ...extra.filter((e) => !seen.has(e.id))];
}

export async function listEvents(status?: string): Promise<(KampEvent & { status: string })[]> {
  const db = await getDB();
  if (!db) return [];
  try {
    const stmt = status
      ? db.prepare(`SELECT * FROM events WHERE status = ? ORDER BY submitted_at DESC`).bind(status)
      : db.prepare(`SELECT * FROM events ORDER BY submitted_at DESC`);
    const { results } = await stmt.all<EventRow>();
    return results.map((r) => ({ ...toKampEvent(r), status: r.status }));
  } catch {
    return [];
  }
}

export async function createEvent(
  input: EventInput,
  status: "pending" | "approved",
  submittedBy: string
): Promise<{ ok: boolean }> {
  const db = await getDB();
  if (!db) return { ok: false };
  if (!validateEvent(input)) return { ok: false };
  const now = Date.now();
  const trim = (s?: string) => {
    const v = (s ?? "").trim();
    return v === "" ? null : v;
  };
  try {
    await db
      .prepare(
        `INSERT INTO events
           (id, title, category, recurring, when_text, start_date, end_date, where_text, description,
            url, business_id, status, submitted_by, submitted_at, reviewed_by, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        input.title.trim(),
        input.category,
        trim(input.recurring),
        input.whenText.trim(),
        trim(input.startDate),
        trim(input.endDate),
        input.where.trim(),
        input.description.trim(),
        trim(input.url),
        trim(input.businessId),
        status,
        submittedBy,
        now,
        status === "approved" ? submittedBy : null,
        status === "approved" ? now : null
      )
      .run();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function moderateEvent(
  id: string,
  decision: "approved" | "rejected",
  reviewerId: string
): Promise<void> {
  const db = await getDB();
  if (!db || !id) return;
  await db
    .prepare(`UPDATE events SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?`)
    .bind(decision, reviewerId, Date.now(), id)
    .run();
  await logModeration({
    actorId: reviewerId,
    action: decision === "approved" ? "approve_event" : "reject_event",
    targetType: "event",
    targetId: id,
  });
}

export async function deleteEvent(id: string, adminId: string): Promise<void> {
  const db = await getDB();
  if (!db || !id) return;
  await db.prepare(`DELETE FROM events WHERE id = ?`).bind(id).run();
  await logModeration({ actorId: adminId, action: "delete_event", targetType: "event", targetId: id });
}

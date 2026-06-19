import { getDB, getEnv } from "@/lib/cf";

/**
 * i18n translation engine (migration 0012). Phase 1: machine-translate the NL
 * business text to EN via DeepL and store it; locale-aware reads merge it on top
 * of the seed/overrides. Fail-soft — no DEEPL_API_KEY means no translation happens
 * and EN simply falls back to the NL value.
 */

export const LOCALES = ["nl", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s);
}

/** Only the free-text fields worth translating (never names/addresses/urls). */
export const TRANSLATABLE_FIELDS = ["shortDescription", "longDescription", "subcategory"] as const;

async function getDeeplKey(): Promise<string | undefined> {
  return (await getEnv())?.DEEPL_API_KEY || undefined;
}

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** DeepL Pro (EU). Returns translations aligned to inputs, or null (fail-soft). */
export async function translateTexts(texts: string[], targetLang = "EN-GB"): Promise<string[] | null> {
  const key = await getDeeplKey();
  if (!key || texts.length === 0) return null;
  try {
    const res = await fetch("https://api.deepl.com/v2/translate", {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: texts, target_lang: targetLang, source_lang: "NL" }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { translations?: { text: string }[] };
    const out = data.translations?.map((t) => t.text);
    return out && out.length === texts.length ? out : null;
  } catch {
    return null;
  }
}

/** Apply a translation map to businesses — pure, unit-testable. */
export function applyTranslations<T extends { id: string }>(
  businesses: T[],
  translations: Record<string, Record<string, string>>
): T[] {
  return businesses.map((b) => {
    const t = translations[b.id];
    return t ? { ...b, ...t } : b;
  });
}

/** EN translations keyed business_id → { field → value } (non-rejected, non-stale). */
export async function getBusinessTranslations(locale: Locale): Promise<Record<string, Record<string, string>>> {
  if (locale === "nl") return {};
  if (process.env.NEXT_PHASE === "phase-production-build") return {};
  const db = await getDB();
  if (!db) return {};
  try {
    const { results } = await db
      .prepare(
        `SELECT business_id, field, value FROM business_translations
         WHERE locale = ? AND status IN ('machine','reviewed') AND stale = 0`
      )
      .bind(locale)
      .all<{ business_id: string; field: string; value: string }>();
    const map: Record<string, Record<string, string>> = {};
    for (const r of results) (map[r.business_id] ??= {})[r.field] = r.value;
    return map;
  } catch {
    return {};
  }
}

/** Translate one business's fields to EN + upsert. Returns the number stored. */
export async function translateBusiness(businessId: string, fields: Record<string, string>): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  const entries = Object.entries(fields).filter(
    ([f, v]) => (TRANSLATABLE_FIELDS as readonly string[]).includes(f) && typeof v === "string" && v.trim() !== ""
  );
  if (entries.length === 0) return 0;
  const translated = await translateTexts(entries.map(([, v]) => v));
  if (!translated) return 0;
  const now = Date.now();
  for (let i = 0; i < entries.length; i++) {
    const [field, source] = entries[i];
    try {
      await db
        .prepare(
          `INSERT INTO business_translations (business_id, locale, field, value, source_hash, status, stale, engine, updated_at)
           VALUES (?, 'en', ?, ?, ?, 'machine', 0, 'deepl', ?)
           ON CONFLICT(business_id, locale, field) DO UPDATE SET
             value = excluded.value, source_hash = excluded.source_hash, stale = 0, status = 'machine', updated_at = excluded.updated_at`
        )
        .bind(businessId, field, translated[i], await sha256(source), now)
        .run();
    } catch {
      // skip a field that fails to store rather than aborting the rest
    }
  }
  return entries.length;
}

/** Mark a business's translations stale (its NL source changed). Called on owner-edit approval. */
export async function markTranslationsStale(businessId: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  try {
    await db.prepare(`UPDATE business_translations SET stale = 1 WHERE business_id = ?`).bind(businessId).run();
  } catch {
    /* best effort */
  }
}

export async function translationStats(): Promise<{ businesses: number; stale: number }> {
  const db = await getDB();
  if (!db) return { businesses: 0, stale: 0 };
  try {
    const b = await db
      .prepare(`SELECT COUNT(DISTINCT business_id) AS n FROM business_translations WHERE locale = 'en'`)
      .first<{ n: number }>();
    const s = await db
      .prepare(`SELECT COUNT(DISTINCT business_id) AS n FROM business_translations WHERE locale = 'en' AND stale = 1`)
      .first<{ n: number }>();
    return { businesses: b?.n ?? 0, stale: s?.n ?? 0 };
  } catch {
    return { businesses: 0, stale: 0 };
  }
}

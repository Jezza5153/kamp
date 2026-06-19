import { getDB, getEnv } from "@/lib/cf";

/**
 * Admin-managed runtime settings (Resend sender, admin emails, site URL),
 * stored in D1 so they can be changed in-app without a redeploy. Each getter
 * falls back to the Worker env/secret, then a sensible default — so the app
 * works before anything is configured and during plain build/dev.
 */

export const SETTING_KEYS = [
  "resend_api_key",
  "resend_from",
  "admin_emails",
  "site_url",
  "google_maps_api_key",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

const DEFAULT_FROM = "Ondernemers van de Kamp <onboarding@resend.dev>";

export async function getSettings(): Promise<Partial<Record<SettingKey, string>>> {
  const db = await getDB();
  if (!db) return {};
  try {
    const { results } = await db
      .prepare("SELECT key, value FROM app_settings")
      .all<{ key: SettingKey; value: string }>();
    const out: Partial<Record<SettingKey, string>> = {};
    for (const r of results) out[r.key] = r.value;
    return out;
  } catch {
    return {};
  }
}

/** Upsert provided keys; an empty string clears the key (back to env/default). */
export async function saveSettings(values: Partial<Record<SettingKey, string>>): Promise<void> {
  const db = await getDB();
  if (!db) return;
  const now = Date.now();
  for (const key of SETTING_KEYS) {
    const v = values[key];
    if (v === undefined) continue; // not submitted → leave as-is
    const trimmed = v.trim();
    if (trimmed === "") {
      await db.prepare("DELETE FROM app_settings WHERE key = ?").bind(key).run();
    } else {
      await db
        .prepare(
          `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        )
        .bind(key, trimmed, now)
        .run();
    }
  }
}

export async function getResendConfig(): Promise<{ apiKey?: string; from: string }> {
  const s = await getSettings();
  const env = await getEnv();
  return {
    apiKey: s.resend_api_key || env?.RESEND_API_KEY || undefined,
    from: s.resend_from || DEFAULT_FROM,
  };
}

export async function getAdminEmails(): Promise<string[]> {
  const s = await getSettings();
  const env = await getEnv();
  const raw = s.admin_emails || env?.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export async function getConfiguredSiteUrl(): Promise<string | undefined> {
  const s = await getSettings();
  const env = await getEnv();
  return s.site_url || env?.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || undefined;
}

/** Google Maps Platform key (Places API) for live review display. Settings → env. */
export async function getGoogleMapsKey(): Promise<string | undefined> {
  const s = await getSettings();
  const env = await getEnv();
  return s.google_maps_api_key || env?.GOOGLE_MAPS_API_KEY || undefined;
}

/** Mollie API key (gift card). Env only — never expose via in-app settings. */
export async function getMollieKey(): Promise<string | undefined> {
  return (await getEnv())?.MOLLIE_API_KEY || undefined;
}

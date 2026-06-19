import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDB } from "@/lib/cf";
import { rateLimit } from "@/lib/rateLimit";
import { claimInvitesForEmail } from "@/lib/invites";
import { getAdminEmails, getConfiguredSiteUrl, getResendConfig } from "@/lib/settings";

/**
 * Magic-link auth for the owner/admin portal.
 *
 * - Owners email the admin, who issues access by adding rows to owner_business;
 *   anyone can request a login link, but a login only *unlocks* a listing if a
 *   matching owner_business row exists (or the profile is admin).
 * - Sessions are server-side: a random session id lives in an httpOnly cookie
 *   and is looked up in D1, so cookies carry no trust-bearing payload.
 * - Every accessor degrades to "logged out" when D1 isn't bound (plain build).
 */

const SESSION_COOKIE = "kamp_session";
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 min magic link
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type Role = "owner" | "admin";
export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function siteUrl(): Promise<string> {
  const configured = await getConfiguredSiteUrl();
  return (configured ?? "https://ondernemersvandekamp.nl").replace(/\/$/, "");
}

// ---------------------------------------------------------------------------
// Login (magic link)
// ---------------------------------------------------------------------------

/** Create a one-time token and email a login link. Always returns ok to the
 *  UI (don't leak whether an email exists); logs the link when no mailer set. */
export async function requestMagicLink(
  email: string,
  opts: { skipThrottle?: boolean } = {}
): Promise<{ ok: boolean }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false };
  const db = await getDB();
  if (!db) return { ok: true };

  // Throttle magic-link requests per email (max 5 / 15 min) as defence in depth
  // alongside Turnstile + the WAF. Over the limit we still report success and
  // simply send nothing — never reveal the limit or whether the address exists.
  // Admin-issued invites skip this: the actor is an authenticated admin and the
  // invite IS the owner's login link, so it must never hit the anonymous bucket.
  if (!opts.skipThrottle) {
    const rl = await rateLimit(db, `login:email:${clean}`, 5, TOKEN_TTL_MS);
    if (!rl.allowed) return { ok: true };
  }

  const token = randomToken();
  const now = Date.now();
  await db
    .prepare(
      "INSERT INTO auth_tokens (token, email, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)"
    )
    .bind(token, clean, now + TOKEN_TTL_MS, now)
    .run();

  const url = `${await siteUrl()}/auth/callback?token=${token}`;
  await sendMagicLink(clean, url);
  return { ok: true };
}

async function sendMagicLink(email: string, url: string): Promise<void> {
  const { apiKey, from } = await getResendConfig();
  if (!apiKey) {
    // No mailer configured yet: surface the link in the Worker logs so an admin
    // can still log in (set the Resend key in /admin/instellingen to send mail).
    console.log(`[magic-link] ${email} -> ${url}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Je inloglink — Ondernemers van de Kamp",
      html: `<p>Hallo,</p><p>Klik om in te loggen en je vermelding te beheren:</p>
<p><a href="${url}" style="background:#1f3a2e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Inloggen</a></p>
<p style="color:#666;font-size:13px">Of plak deze link: ${url}<br>De link is 15 minuten geldig.</p>`,
    }),
  }).catch((e) => console.error("[magic-link] send failed", e));
}

/** Verify a magic-link token, create a profile+session, set the cookie.
 *  Returns the role on success so the caller can route admins vs owners. */
export async function completeLogin(token: string): Promise<Role | null> {
  const db = await getDB();
  if (!db || !token) return null;
  try {
    // Atomic single-use claim: the conditional UPDATE…RETURNING ensures exactly one
    // concurrent request (real click vs. email-scanner prefetch) can consume a token.
    const claimed = await db
      .prepare("UPDATE auth_tokens SET used = 1 WHERE token = ? AND used = 0 AND expires_at > ? RETURNING email")
      .bind(token, Date.now())
      .first<{ email: string }>();
    if (!claimed) return null;

    const profile = await ensureProfile(claimed.email);
    // Bind any pending admin invites for this exact email (claim-time ownership):
    // logging in via the magic link proves control of the address.
    await claimInvitesForEmail(db, profile.id, profile.email);
    const sid = crypto.randomUUID();
    const now = Date.now();
    await db
      .prepare("INSERT INTO sessions (id, profile_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .bind(sid, profile.id, now + SESSION_TTL_MS, now)
      .run();

    const c = await cookies();
    c.set(SESSION_COOKIE, sid, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return profile.role;
  } catch {
    return null;
  }
}

async function ensureProfile(email: string): Promise<SessionUser> {
  const db = await getDB();
  if (!db) throw new Error("no db");
  const existing = await db
    .prepare("SELECT id, email, role FROM profiles WHERE email = ?")
    .bind(email)
    .first<SessionUser>();
  if (existing) return existing;

  const admins = await getAdminEmails();
  let role: Role = admins.includes(email) ? "admin" : "owner";
  if (role === "owner") {
    // Bootstrap: the very first account becomes admin, so a fresh deploy always
    // has someone who can open /admin and configure admins/Resend in-app.
    const c = await db
      .prepare("SELECT COUNT(*) AS n FROM profiles WHERE role = 'admin'")
      .first<{ n: number }>();
    if ((c?.n ?? 0) === 0) role = "admin";
  }
  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO profiles (id, email, role, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, email, role, Date.now())
    .run();
  return { id, email, role };
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<SessionUser | null> {
  const db = await getDB();
  if (!db) return null;
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  try {
    const row = await db
      .prepare(
        `SELECT p.id AS id, p.email AS email, p.role AS role, s.expires_at AS expires_at
         FROM sessions s JOIN profiles p ON p.id = s.profile_id WHERE s.id = ?`
      )
      .bind(sid)
      .first<{ id: string; email: string; role: Role; expires_at: number }>();
    if (!row || row.expires_at < Date.now()) return null;
    return { id: row.id, email: row.email, role: row.role };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/beheer");
  return u;
}

export async function logout(): Promise<void> {
  const db = await getDB();
  const c = await cookies();
  const sid = c.get(SESSION_COOKIE)?.value;
  if (sid && db) await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
  c.delete(SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// Ownership
// ---------------------------------------------------------------------------

export async function ownedBusinessIds(profileId: string): Promise<string[]> {
  const db = await getDB();
  if (!db) return [];
  const { results } = await db
    .prepare("SELECT business_id FROM owner_business WHERE profile_id = ?")
    .bind(profileId)
    .all<{ business_id: string }>();
  return results.map((r) => r.business_id);
}

export async function canEdit(user: SessionUser, businessId: string): Promise<boolean> {
  if (user.role === "admin") return true;
  return (await ownedBusinessIds(user.id)).includes(businessId);
}

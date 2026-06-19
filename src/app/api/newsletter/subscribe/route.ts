import { NextResponse } from "next/server";
import { getDB } from "@/lib/cf";
import { rateLimit } from "@/lib/rateLimit";
import { subscribe } from "@/lib/newsletter";
import { sendEmail } from "@/lib/email";
import { getConfiguredSiteUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

const CONSENT_TEXT =
  "Ik wil de nieuwsbrief van Ondernemers van de Kamp ontvangen met updates over nieuwe ondernemers en evenementen. Ik kan me altijd uitschrijven.";

export async function POST(req: Request) {
  const fd = await req.formData();
  // Honeypot — silently accept and do nothing for bots.
  if (String(fd.get("website") ?? "").trim() !== "") return NextResponse.json({ ok: true });

  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const db = await getDB();
  const rl = await rateLimit(db, `nl:email:${email}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ ok: true });

  const res = await subscribe(email, "footer", CONSENT_TEXT);
  if (res.ok && res.confirmToken) {
    const base = (await getConfiguredSiteUrl())?.replace(/\/$/, "") ?? "https://ondernemersvandekamp.nl";
    const url = `${base}/api/newsletter/confirm?token=${res.confirmToken}`;
    await sendEmail(
      email,
      "Bevestig je inschrijving — Ondernemers van de Kamp",
      `<p>Leuk dat je de nieuwsbrief van De Kamp wilt ontvangen.</p>
       <p>Bevestig je inschrijving met één klik:</p>
       <p><a href="${url}" style="background:#1f3a2e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Bevestig inschrijving</a></p>
       <p style="color:#666;font-size:13px">Of plak deze link: ${url}</p>`
    );
  }
  return NextResponse.json({ ok: res.ok });
}

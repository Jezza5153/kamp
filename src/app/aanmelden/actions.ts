"use server";

import { redirect } from "next/navigation";
import { getDB } from "@/lib/cf";
import { createLead } from "@/lib/leads";
import { rateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { getConfiguredSiteUrl } from "@/lib/settings";

// Exact consent copy shown next to the checkbox — stored verbatim per lead (audit proof).
const CONSENT_TEXT =
  "Ik geef toestemming om deze gegevens en aangeleverde beelden te gebruiken op Ondernemers van de Kamp. Voor publicatie nemen we altijd even contact op voor de laatste check.";

/** Public lead submission from /aanmelden. Honeypot + per-email rate limit;
 *  always lands on ?sent=1 so bots/abusers learn nothing. */
export async function submitLeadAction(formData: FormData) {
  // Honeypot: real users never fill the hidden 'website' field.
  if (String(formData.get("website") ?? "").trim() !== "") redirect("/aanmelden?sent=1");

  if (!formData.get("permission")) redirect("/aanmelden?error=consent");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const db = await getDB();
  // Max 3 applications per email per hour.
  const rl = await rateLimit(db, `lead:email:${email}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) redirect("/aanmelden?sent=1");

  const res = await createLead({
    businessName: String(formData.get("business") ?? ""),
    contactName: String(formData.get("contact") ?? ""),
    email,
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    story: String(formData.get("story") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    consentText: CONSENT_TEXT,
    source: "web",
  });

  if (res.ok && res.confirmToken) {
    const base = (await getConfiguredSiteUrl())?.replace(/\/$/, "") ?? "https://ondernemersvandekamp.nl";
    const url = `${base}/api/aanmelden/confirm?token=${res.confirmToken}`;
    await sendEmail(
      email,
      "Bevestig je aanmelding — Ondernemers van de Kamp",
      `<p>Bedankt voor je aanmelding bij Ondernemers van de Kamp.</p>
       <p>Klik om je aanmelding te bevestigen:</p>
       <p><a href="${url}" style="background:#1f3a2e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Bevestig aanmelding</a></p>
       <p style="color:#666;font-size:13px">Of plak deze link: ${url}</p>`
    );
  }

  redirect("/aanmelden?sent=1");
}

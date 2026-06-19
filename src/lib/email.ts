import { getResendConfig } from "@/lib/settings";

/**
 * Minimal transactional email sender (Resend HTTP API). Fail-soft: when no key
 * is configured it logs the message so flows still work in dev/before setup —
 * mirroring the magic-link sender in auth.ts.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const { apiKey, from } = await getResendConfig();
  if (!apiKey) {
    console.log(`[email] ${to} :: ${subject}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  }).catch((e) => console.error("[email] send failed", e));
}

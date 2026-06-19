import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { subscriberCounts, listSubscribers, listIssues } from "@/lib/newsletter";
import { createIssueAction, sendIssueBatchAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nieuwsbrief — beheer", robots: { index: false } };

const input =
  "mt-1 w-full rounded-xl border border-stone bg-background px-4 py-2.5 text-foreground outline-none focus:border-deep-green";

export default async function NewsletterAdmin({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; remaining?: string }>;
}) {
  await requireAdmin();
  const { sent, remaining } = await searchParams;
  const counts = await subscriberCounts();
  const confirmed = await listSubscribers("confirmed");
  const issues = await listIssues();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Nieuwsbrief</h1>
        <Link href="/admin/instellingen" className="text-sm text-warm-brown underline">
          ← Instellingen
        </Link>
      </div>

      {sent !== undefined ? (
        <div className="mt-5 rounded-xl bg-sage/60 p-4 text-sm text-deep-green">
          {sent} verzonden{Number(remaining) > 0 ? `, ${remaining} resterend — klik nogmaals voor de volgende batch.` : ". Klaar — iedereen heeft de nieuwsbrief ontvangen."}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["confirmed", "pending", "unsubscribed", "bounced"] as const).map((k) => (
          <div key={k} className="rounded-2xl bg-paper p-4 text-center shadow-[var(--shadow-card)]">
            <div className="text-2xl font-black text-deep-green">{counts[k] ?? 0}</div>
            <div className="text-xs text-warm-brown">{k}</div>
          </div>
        ))}
      </div>

      <form action={createIssueAction} className="mt-8 space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold text-deep-green">Nieuwe nieuwsbrief</h2>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-foreground">Onderwerp</label>
          <input id="subject" name="subject" required className={input} placeholder="Nieuws van De Kamp — juni" />
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-foreground">Tekst</label>
          <textarea id="body" name="body" required rows={8} className={input} placeholder={"Beste lezer,\n\nDit is het nieuws van deze maand…\n\n(lege regel = nieuwe alinea)"} />
        </div>
        <button type="submit" className="rounded-xl bg-deep-green px-5 py-2.5 font-medium text-background transition hover:opacity-90">
          Opslaan als concept
        </button>
      </form>

      {issues.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-deep-green">Edities</h2>
          <ul className="space-y-2">
            {issues.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-4 shadow-[var(--shadow-card)]">
                <div className="min-w-[12rem] flex-1">
                  <span className="font-medium text-deep-green">{i.subject}</span>
                  <span className="ml-2 rounded-full bg-stone/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-warm-brown/70">
                    {i.status}
                  </span>
                  <span className="ml-2 text-xs text-warm-brown/60">{i.sent} verzonden</span>
                </div>
                {i.status !== "sent" ? (
                  <form action={sendIssueBatchAction}>
                    <input type="hidden" name="issueId" value={i.id} />
                    <button className="rounded-lg bg-deep-green px-3 py-1.5 text-sm font-medium text-background">
                      {i.status === "sending" ? "Volgende batch" : "Verstuur"}
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-emerald-700">✓ verzonden</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-warm-brown/60">
            Versturen gebeurt in batches van 100 (binnen de Worker-limiet) en is hervatbaar — klik nogmaals tot
            &quot;resterend&quot; 0 is. Tot er een Resend-sleutel is, worden mails in de serverlogs getoond.
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-deep-green">Bevestigde abonnees ({confirmed.length})</h2>
        <ul className="divide-y divide-stone/20 rounded-2xl bg-paper px-4 shadow-[var(--shadow-card)]">
          {confirmed.length === 0 ? (
            <li className="py-4 text-sm text-warm-brown/60">Nog geen bevestigde abonnees.</li>
          ) : (
            confirmed.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{s.email}</span>
                {s.source ? <span className="text-xs text-warm-brown/50">{s.source}</span> : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

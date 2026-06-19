import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { subscriberCounts, listSubscribers } from "@/lib/newsletter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nieuwsbrief — abonnees", robots: { index: false } };

export default async function NewsletterAdmin() {
  await requireAdmin();
  const counts = await subscriberCounts();
  const confirmed = await listSubscribers("confirmed");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Nieuwsbrief — abonnees</h1>
        <Link href="/admin/instellingen" className="text-sm text-warm-brown underline">
          ← Instellingen
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["confirmed", "pending", "unsubscribed", "bounced"] as const).map((k) => (
          <div key={k} className="rounded-2xl bg-paper p-4 text-center shadow-[var(--shadow-card)]">
            <div className="text-2xl font-black text-deep-green">{counts[k] ?? 0}</div>
            <div className="text-xs text-warm-brown">{k}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-warm-brown/70">
        Bevestigde abonnees ({confirmed.length}). Het versturen van een nieuwsbrief (campagne) volgt; voor nu kun je
        deze adressen exporteren naar je e-mailtool.
      </p>

      <ul className="mt-4 divide-y divide-stone/20 rounded-2xl bg-paper px-4 shadow-[var(--shadow-card)]">
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
    </main>
  );
}

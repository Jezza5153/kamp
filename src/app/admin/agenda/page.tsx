import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listEvents, EVENT_CATEGORIES } from "@/lib/events";
import { addEventAction, approveEventAction, rejectEventAction, deleteEventAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agenda — beheer", robots: { index: false } };

const input =
  "mt-1 w-full rounded-xl border border-stone bg-background px-4 py-2.5 text-foreground outline-none focus:border-deep-green";

export default async function AgendaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; error?: string }>;
}) {
  await requireAdmin();
  const { added, error } = await searchParams;
  const all = await listEvents();
  const pending = all.filter((e) => e.status === "pending");
  const live = all.filter((e) => e.status === "approved");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Agenda — beheer</h1>
        <Link href="/admin/instellingen" className="text-sm text-warm-brown underline">
          ← Instellingen
        </Link>
      </div>
      <p className="mt-1 text-sm text-warm-brown">
        Voeg evenementen toe; ze verschijnen op{" "}
        <Link href="/agenda" className="text-amber-ink underline">
          /agenda
        </Link>{" "}
        naast de vaste items.
      </p>

      {added ? <div className="mt-5 rounded-xl bg-sage/60 p-4 text-sm text-deep-green">Toegevoegd.</div> : null}
      {error ? <div className="mt-5 rounded-xl bg-clay/15 p-4 text-sm text-clay">Controleer de velden (titel, categorie, datum jjjj-mm-dd, geldige link).</div> : null}

      <form action={addEventAction} className="mt-6 space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold text-deep-green">Nieuw evenement</h2>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">Titel</label>
          <input id="title" name="title" required className={input} placeholder="Kerstmarkt op De Kamp" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground">Categorie</label>
            <select id="category" name="category" className={input} defaultValue="De Kamp">
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="recurring" className="block text-sm font-medium text-foreground">Herhaling (optioneel)</label>
            <input id="recurring" name="recurring" className={input} placeholder="Elke vrijdag" />
          </div>
        </div>
        <div>
          <label htmlFor="whenText" className="block text-sm font-medium text-foreground">Wanneer (tekst)</label>
          <input id="whenText" name="whenText" required className={input} placeholder="14 december, 12.00–18.00 uur" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground">Startdatum (jjjj-mm-dd, optioneel)</label>
            <input id="startDate" name="startDate" className={input} placeholder="2026-12-14" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground">Einddatum (optioneel)</label>
            <input id="endDate" name="endDate" className={input} placeholder="2026-12-14" />
          </div>
        </div>
        <div>
          <label htmlFor="where" className="block text-sm font-medium text-foreground">Locatie</label>
          <input id="where" name="where" required className={input} placeholder="De Kamp, Amersfoort" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground">Omschrijving</label>
          <textarea id="description" name="description" required rows={3} className={input} />
        </div>
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-foreground">Link (optioneel, https)</label>
          <input id="url" name="url" type="url" className={input} placeholder="https://..." />
        </div>
        <button type="submit" className="rounded-xl bg-deep-green px-5 py-2.5 font-medium text-background transition hover:opacity-90">
          Toevoegen
        </button>
      </form>

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-deep-green">Ter goedkeuring ({pending.length})</h2>
          <ul className="space-y-2">
            {pending.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-4 shadow-[var(--shadow-card)]">
                <div className="min-w-[12rem] flex-1">
                  <span className="font-medium text-deep-green">{e.title}</span>
                  <span className="ml-2 text-xs text-warm-brown">{e.whenText} · {e.where}</span>
                </div>
                <form action={approveEventAction}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <button className="rounded-lg bg-deep-green px-3 py-1.5 text-sm font-medium text-background">Goedkeuren</button>
                </form>
                <form action={rejectEventAction}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <button className="rounded-lg border border-stone px-3 py-1.5 text-sm text-warm-brown">Afwijzen</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-deep-green">Op de agenda ({live.length})</h2>
        {live.length === 0 ? (
          <p className="text-sm text-warm-brown/70">Nog geen eigen evenementen — de vaste items staan al op /agenda.</p>
        ) : (
          <ul className="space-y-2">
            {live.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-4 shadow-[var(--shadow-card)]">
                <div className="min-w-[12rem] flex-1">
                  <span className="font-medium text-deep-green">{e.title}</span>
                  <span className="ml-2 text-xs text-warm-brown">{e.recurring || e.whenText}</span>
                </div>
                <form action={deleteEventAction}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <button className="rounded-lg border border-clay/40 px-3 py-1.5 text-sm text-clay">Verwijderen</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

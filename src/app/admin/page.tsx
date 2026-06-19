import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { allBusinessesSeed } from "@/lib/businessData";
import {
  FIELD_LABELS,
  listPending,
  type EditableField,
} from "@/lib/overrides";
import { listPendingMedia } from "@/lib/media";
import { approve, reject, approvePhoto, rejectPhoto, purgeBusinessData } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderatie", robots: { index: false } };

export default async function AdminPage() {
  await requireAdmin();
  const pending = await listPending();
  const pendingMedia = await listPendingMedia();
  const byId = new Map(allBusinessesSeed.map((b) => [b.id, b]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Moderatie</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/agenda" className="text-warm-brown underline">Agenda</Link>
          <Link href="/admin/nieuwsbrief" className="text-warm-brown underline">Nieuwsbrief</Link>
          <Link href="/admin/verhalen" className="text-warm-brown underline">Verhalen</Link>
          <Link href="/admin/statistieken" className="text-warm-brown underline">Statistieken</Link>
          <Link href="/admin/google" className="text-warm-brown underline">Google</Link>
          <Link href="/admin/instellingen" className="text-amber-ink underline">Instellingen</Link>
          <a href="/logout" className="text-warm-brown underline">Uitloggen</a>
        </div>
      </div>
      <p className="mt-1 text-sm text-warm-brown">
        {pending.length === 0
          ? "Geen openstaande wijzigingen."
          : `${pending.length} wijziging${pending.length === 1 ? "" : "en"} wachten op controle.`}
      </p>

      <ul className="mt-8 space-y-6">
        {pending.map((row) => {
          const biz = byId.get(row.business_id);
          let fields: Record<string, string> = {};
          try {
            fields = JSON.parse(row.fields);
          } catch {
            /* skip */
          }
          const approveThis = approve.bind(null, row.id);
          const rejectThis = reject.bind(null, row.id);
          return (
            <li
              key={row.id}
              className="rounded-2xl bg-paper p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-deep-green">
                  {biz?.name ?? row.business_id}
                </h2>
                {biz ? (
                  <Link
                    href={`/ondernemers/${biz.id}`}
                    className="text-xs text-amber-ink underline"
                  >
                    Bekijk live
                  </Link>
                ) : null}
              </div>

              <dl className="mt-4 space-y-3">
                {Object.entries(fields).map(([key, proposed]) => {
                  const current =
                    (biz as unknown as Record<string, unknown>)?.[key]?.toString() ?? "—";
                  return (
                    <div key={key} className="rounded-xl bg-background p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-warm-brown">
                        {FIELD_LABELS[key as EditableField] ?? key}
                      </dt>
                      <dd className="mt-1 text-sm text-clay line-through">{current}</dd>
                      <dd className="text-sm text-deep-green">{proposed}</dd>
                    </div>
                  );
                })}
              </dl>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <form action={approveThis}>
                  <button className="rounded-xl bg-deep-green px-4 py-2 text-sm font-medium text-background hover:opacity-90">
                    Goedkeuren
                  </button>
                </form>
                <form action={rejectThis} className="flex items-center gap-2">
                  <input
                    name="reason"
                    placeholder="Reden (optioneel)"
                    className="rounded-lg border border-stone bg-background px-3 py-2 text-sm outline-none focus:border-deep-green"
                  />
                  <button className="rounded-xl border border-clay px-4 py-2 text-sm font-medium text-clay hover:bg-clay/10">
                    Afwijzen
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-12 text-xl font-semibold text-deep-green">Foto&apos;s</h2>
      <p className="mt-1 text-sm text-warm-brown">
        {pendingMedia.length === 0
          ? "Geen foto&apos;s in de wachtrij."
          : `${pendingMedia.length} foto${pendingMedia.length === 1 ? "" : "'s"} wachten op controle.`}
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {pendingMedia.map((m) => {
          const biz = byId.get(m.business_id);
          const approveThis = approvePhoto.bind(null, m.id);
          const rejectThis = rejectPhoto.bind(null, m.id);
          return (
            <li key={m.id} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-card)]">
              <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-stone">
                {/* admin passes the access check, so the pending bytes load */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/media/${m.r2_key}`}
                  alt={biz?.name ?? m.business_id}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-sm font-medium text-deep-green">{biz?.name ?? m.business_id}</p>
              <p className="text-xs text-warm-brown">{m.kind}</p>
              <div className="mt-3 flex gap-2">
                <form action={approveThis}>
                  <button className="rounded-lg bg-deep-green px-3 py-1.5 text-sm font-medium text-background hover:opacity-90">
                    Goedkeuren
                  </button>
                </form>
                <form action={rejectThis}>
                  <button className="rounded-lg border border-clay px-3 py-1.5 text-sm font-medium text-clay hover:bg-clay/10">
                    Afwijzen
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="mt-16 rounded-2xl border border-clay/30 bg-clay/5 p-6">
        <h2 className="text-xl font-semibold text-clay">Gegevens wissen (AVG)</h2>
        <p className="mt-1 max-w-prose text-sm text-warm-brown">
          Verwijdert alle door de ondernemer ingediende gegevens van een zaak — geüploade
          foto&apos;s (ook uit opslag), tekstwijzigingen en gekoppelde logins. De vermelding valt
          terug op de basisgegevens. Niet terug te draaien. Typ <strong>WIS</strong> ter
          bevestiging.
        </p>
        <form action={purgeBusinessData} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-warm-brown">Zaak</span>
            <select
              name="businessId"
              required
              className="mt-1 w-64 rounded-lg border border-stone bg-background px-3 py-2 text-sm"
            >
              {[...allBusinessesSeed]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-warm-brown">Bevestig</span>
            <input
              name="confirm"
              required
              placeholder="WIS"
              className="mt-1 w-28 rounded-lg border border-stone bg-background px-3 py-2 text-sm"
            />
          </label>
          <button className="rounded-xl bg-clay px-4 py-2 text-sm font-medium text-background hover:opacity-90">
            Wis gegevens
          </button>
        </form>
      </section>
    </main>
  );
}

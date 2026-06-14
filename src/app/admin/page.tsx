import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { allBusinessesSeed } from "@/lib/businessData";
import {
  FIELD_LABELS,
  listPending,
  type EditableField,
} from "@/lib/overrides";
import { approve, reject } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderatie", robots: { index: false } };

export default async function AdminPage() {
  await requireAdmin();
  const pending = await listPending();
  const byId = new Map(allBusinessesSeed.map((b) => [b.id, b]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Moderatie</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/beheer" className="text-warm-brown underline">
            Vermeldingen
          </Link>
          <a href="/logout" className="text-warm-brown underline">
            Uitloggen
          </a>
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
    </main>
  );
}

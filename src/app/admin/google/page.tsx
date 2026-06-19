import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { allBusinessesSeed } from "@/lib/businessData";
import { listBusinessGoogle } from "@/lib/reviews";
import { setPlaceIdAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Google reviews — place_id", robots: { index: false } };

export default async function GoogleReviewsAdmin() {
  await requireAdmin();
  const placeIds = await listBusinessGoogle();
  const businesses = [...allBusinessesSeed].sort((a, b) => a.name.localeCompare(b.name, "nl"));
  const linked = Object.keys(placeIds).length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Google reviews — place_id</h1>
        <Link href="/admin/instellingen" className="text-sm text-warm-brown underline">
          ← Instellingen
        </Link>
      </div>
      <p className="mt-2 text-sm text-warm-brown">
        Koppel elke zaak aan zijn Google <strong>place_id</strong> om de reviews op de zaakpagina te tonen.
        Zoek de place_id via de{" "}
        <a
          href="https://developers.google.com/maps/documentation/places/web-service/place-id"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-ink underline"
        >
          Place ID Finder
        </a>{" "}
        (zoek de zaak, kopieer de <code>ChIJ…</code>-code). Zet eerst de Maps-sleutel in{" "}
        <Link href="/admin/instellingen" className="text-amber-ink underline">
          Instellingen
        </Link>
        . {linked} van {businesses.length} gekoppeld.
      </p>

      <ul className="mt-6 space-y-2">
        {businesses.map((b) => {
          const current = placeIds[b.id] ?? "";
          return (
            <li key={b.id} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-card)]">
              <form action={setPlaceIdAction} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="businessId" value={b.id} />
                <div className="min-w-[12rem] flex-1">
                  <span className="font-medium text-deep-green">{b.name}</span>
                  <span className="ml-2 text-xs text-warm-brown">{b.address}</span>
                </div>
                <input
                  name="placeId"
                  defaultValue={current}
                  placeholder="ChIJ…"
                  className="w-56 rounded-lg border border-stone bg-background px-3 py-2 text-sm outline-none focus:border-deep-green"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-deep-green px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
                >
                  Opslaan
                </button>
                {current ? <span className="text-xs text-emerald-700">✓ gekoppeld</span> : null}
              </form>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

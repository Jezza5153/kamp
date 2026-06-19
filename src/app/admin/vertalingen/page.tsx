import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getActiveBusinesses } from "@/lib/businessData";
import { translationStats } from "@/lib/i18n";
import { translateBatchAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vertalingen (NL → EN)", robots: { index: false } };

export default async function TranslationsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; remaining?: string }>;
}) {
  await requireAdmin();
  const { done, remaining } = await searchParams;
  const total = (await getActiveBusinesses()).length;
  const stats = await translationStats();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Vertalingen — NL → EN</h1>
        <Link href="/admin/instellingen" className="text-sm text-warm-brown underline">
          ← Instellingen
        </Link>
      </div>
      <p className="mt-1 text-sm text-warm-brown">
        Machinevertaling (DeepL) van de zaakomschrijvingen naar het Engels. Zet eerst de{" "}
        <code>DEEPL_API_KEY</code> als Worker-secret. Bij een goedgekeurde wijziging wordt de Engelse versie automatisch
        als &quot;verouderd&quot; gemarkeerd en bij de volgende ronde opnieuw vertaald.
      </p>

      {done !== undefined ? (
        <div className="mt-5 rounded-xl bg-sage/60 p-4 text-sm text-deep-green">
          {done} vertaald{Number(remaining) > 0 ? `, ${remaining} te gaan — klik nogmaals voor de volgende batch.` : ". Klaar — alles is vertaald."}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-paper p-4 text-center shadow-[var(--shadow-card)]">
          <div className="text-2xl font-black text-deep-green">{total}</div>
          <div className="text-xs text-warm-brown">zaken</div>
        </div>
        <div className="rounded-2xl bg-paper p-4 text-center shadow-[var(--shadow-card)]">
          <div className="text-2xl font-black text-deep-green">{stats.businesses}</div>
          <div className="text-xs text-warm-brown">vertaald (EN)</div>
        </div>
        <div className="rounded-2xl bg-paper p-4 text-center shadow-[var(--shadow-card)]">
          <div className="text-2xl font-black text-deep-green">{stats.stale}</div>
          <div className="text-xs text-warm-brown">verouderd</div>
        </div>
      </div>

      <form action={translateBatchAction} className="mt-6">
        <button type="submit" className="rounded-xl bg-deep-green px-5 py-3 font-medium text-background transition hover:opacity-90">
          Vertaal volgende batch (8)
        </button>
      </form>
      <p className="mt-3 text-xs text-warm-brown/60">
        Zonder DeepL-sleutel gebeurt er niets (Engels valt terug op het Nederlands). De Engelse pagina&apos;s zelf
        (routing op <code>/en</code>) volgen in de tweede fase.
      </p>
    </main>
  );
}

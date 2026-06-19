import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/analytics";
import { giftCardStats } from "@/lib/giftcard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Statistieken", robots: { index: false } };

const LABELS: Record<string, string> = {
  pageview: "Paginaweergaven",
  action_click: "Actie-kliks (reserveren/menu/route)",
  claim: "Geclaimde zaken",
  newsletter_confirm: "Nieuwsbrief bevestigd",
  giftcard_paid: "Cadeaukaarten betaald",
  review_scan: "Review-QR gescand",
  story_view: "Verhaal gelezen",
  search: "Zoekopdrachten",
};

export default async function StatsAdmin() {
  await requireAdmin();
  const summary = await getAnalyticsSummary(30);
  const gc = await giftCardStats();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Statistieken (30 dagen)</h1>
        <Link href="/admin/instellingen" className="text-sm text-warm-brown underline">
          ← Instellingen
        </Link>
      </div>
      <p className="mt-1 text-sm text-warm-brown">
        Cookieloos en zonder toestemming verzameld. Wire pageviews via Cloudflare Web Analytics; conversie-events via{" "}
        <code>track()</code>.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.entries(LABELS).map(([k, label]) => (
          <div key={k} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-card)]">
            <div className="text-2xl font-black text-deep-green">{summary.byType[k] ?? 0}</div>
            <div className="text-xs text-warm-brown">{label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-semibold text-deep-green">Cadeaukaart</h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-paper p-4 text-center shadow-[var(--shadow-card)]">
          <div className="text-2xl font-black text-deep-green">{gc.issued}</div>
          <div className="text-xs text-warm-brown">uitgegeven</div>
        </div>
        <div className="rounded-2xl bg-paper p-4 text-center shadow-[var(--shadow-card)]">
          <div className="text-2xl font-black text-deep-green">€{(gc.outstandingCents / 100).toFixed(0)}</div>
          <div className="text-xs text-warm-brown">openstaand saldo</div>
        </div>
        <div className="rounded-2xl bg-paper p-4 text-center shadow-[var(--shadow-card)]">
          <div className="text-2xl font-black text-deep-green">€{(gc.redeemedCents / 100).toFixed(0)}</div>
          <div className="text-xs text-warm-brown">ingewisseld</div>
        </div>
      </div>
    </main>
  );
}

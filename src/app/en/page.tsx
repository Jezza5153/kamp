import Link from "next/link";
import { Metadata } from "next";
import { CalendarDays, Gift, ArrowRight } from "lucide-react";
import BusinessExplorer from "@/components/BusinessExplorer";
import JsonLd from "@/components/JsonLd";
import { getActiveBusinessesIn } from "@/lib/businessData";
import { graph, organizationSchema, websiteSchema, districtPlaceSchema, itemListSchema } from "@/lib/schema";
import { SITE, abs } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "De Kamp, Amersfoort — independent shops, cafés & makers",
  description:
    "Discover every independent shop, café and maker on De Kamp, the historic shopping street in the heart of Amersfoort (NL). Opening hours, map and live ‘open now’ status.",
  alternates: { canonical: "/en", languages: { nl: "/", en: "/en" } },
  openGraph: { title: "De Kamp, Amersfoort", description: "Independent shops, cafés & makers in the old town of Amersfoort.", url: abs("/en"), siteName: SITE.name, locale: "en_GB" },
};

export default async function HomeEn() {
  const active = await getActiveBusinessesIn("en");

  return (
    <div className="flex flex-col">
      <section id="ondernemers" className="bg-stone/10 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">The guide to De Kamp</p>
            <h1 className="font-serif text-4xl font-black leading-tight text-deep-green sm:text-5xl">
              Find your spot on De Kamp
            </h1>
            <p className="mt-4 text-lg font-medium text-warm-brown/70">
              The independent shops, cafés and makers of De Kamp — the historic shopping street in the heart of
              Amersfoort, from the 13th-century Kamperbinnenpoort city gate down to the canals. Filter by category,
              search, or see what&apos;s open right now.
            </p>
          </div>
          <BusinessExplorer businesses={active} locale="en" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/agenda" className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-deep-green p-10 text-white shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-float)]">
            <div className="relative">
              <CalendarDays className="mb-6 h-9 w-9 text-gold" />
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-gold">Events</p>
              <h2 className="font-serif text-3xl font-black">What&apos;s on?</h2>
              <p className="mt-3 max-w-sm text-stone/80">Markets, Sunday shopping and festivals in the old town — plan your visit to De Kamp around them.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-gold">See the agenda <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>
          <Link href="/cadeaukaart" className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-paper p-10 shadow-[var(--shadow-card)] ring-1 ring-stone/40 transition hover:shadow-[var(--shadow-float)]">
            <div className="relative">
              <Gift className="mb-6 h-9 w-9 text-amber" />
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-amber-ink">Local</p>
              <h2 className="font-serif text-3xl font-black text-deep-green">The Kamp Gift Card</h2>
              <p className="mt-3 max-w-sm text-warm-brown/75">One gift card for every independent shop on the street. Keep your gift — and your money — local.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-ink">Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>
        </div>
      </section>

      <JsonLd
        data={graph(
          organizationSchema(),
          websiteSchema(),
          districtPlaceSchema(active.length),
          itemListSchema("Businesses on De Kamp, Amersfoort", active),
        )}
      />
    </div>
  );
}

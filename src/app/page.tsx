import Link from "next/link";
import { CalendarDays, Gift, ArrowRight } from "lucide-react";
import Hero from "@/components/Hero";
import SeoIntro from "@/components/SeoIntro";
import WandelShowcase from "@/components/WandelShowcase";
import FeaturedHorizontal from "@/components/FeaturedHorizontal";
import BusinessExplorer from "@/components/BusinessExplorer";
import OwnerSubmitCta from "@/components/OwnerSubmitCta";
import JsonLd from "@/components/JsonLd";
import { getActiveBusinesses } from "@/lib/businessData";
import { graph, organizationSchema, websiteSchema, districtPlaceSchema, itemListSchema } from "@/lib/schema";

export default async function Home() {
  const active = await getActiveBusinesses();

  return (
    <div className="flex flex-col">
      <Hero />
      <SeoIntro />
      <WandelShowcase />
      <FeaturedHorizontal />

      <section id="ondernemers" className="bg-stone/10 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">De gids</p>
            <h2 className="font-serif text-4xl font-black leading-tight text-deep-green sm:text-5xl">
              Vind jouw plek op De Kamp
            </h2>
            <p className="mt-4 text-lg font-medium text-warm-brown/70">
              Filter op categorie, zoek op naam of product, of zet “Nu open” aan. Beweeg over de kaart om de straat te
              verkennen — van de Kamperbinnenpoort tot aan de singels.
            </p>
          </div>
          <BusinessExplorer businesses={active} />
        </div>
      </section>

      {/* Agenda + Cadeaukaart teasers */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/agenda" className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-deep-green p-10 text-white shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-float)]">
            <div className="grain absolute inset-0" />
            <div className="relative">
              <CalendarDays className="mb-6 h-9 w-9 text-gold" />
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-gold">Agenda</p>
              <h3 className="font-serif text-3xl font-black">Wat is er te doen?</h3>
              <p className="mt-3 max-w-sm text-stone/80">Markten, koopzondagen en festivals in de binnenstad — plan je bezoek aan De Kamp eromheen.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-gold">Bekijk de agenda <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>
          <Link href="/cadeaukaart" className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-paper p-10 shadow-[var(--shadow-card)] ring-1 ring-stone/40 transition hover:shadow-[var(--shadow-float)]">
            <div className="relative">
              <Gift className="mb-6 h-9 w-9 text-amber" />
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-amber-ink">Initiatief</p>
              <h3 className="font-serif text-3xl font-black text-deep-green">De Kamp Cadeaukaart</h3>
              <p className="mt-3 max-w-sm text-warm-brown/75">Eén cadeaubon voor alle zelfstandige zaken van de straat. Houd je cadeau — en je geld — lokaal.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-ink">Lees meer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </div>
          </Link>
        </div>
      </section>

      <OwnerSubmitCta />

      <JsonLd
        data={graph(
          organizationSchema(),
          websiteSchema(),
          districtPlaceSchema(active.length),
          itemListSchema("Ondernemers van de Kamp, Amersfoort", active),
        )}
      />
    </div>
  );
}

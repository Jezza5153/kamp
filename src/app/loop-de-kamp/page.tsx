import Link from "next/link";
import { MapPin, ArrowUpRight, Camera, Navigation } from "lucide-react";
import { getActiveBusinesses } from "@/lib/businessData";
import BusinessImage from "@/components/BusinessImage";
import OpenBadge from "@/components/OpenBadge";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema } from "@/lib/schema";
import { coordsFor, streetViewUrl, directionsUrl } from "@/lib/geo";
import { categorySlug } from "@/lib/categories";

export const metadata = {
  title: "Wandel de Kamp — straatbeeld-wandeling langs alle ondernemers",
  description:
    "Wandel stap voor stap over De Kamp in Amersfoort, van de Kamperbinnenpoort tot de singels. Bekijk elke zaak met foto, openingstijden en het echte straatbeeld via Street View.",
  alternates: { canonical: "/loop-de-kamp" },
  openGraph: { title: "Wandel de Kamp, Amersfoort", description: "Een straatbeeld-wandeling langs alle ondernemers van De Kamp.", url: "/loop-de-kamp" },
};

export default async function RoutePage() {
  const stops = (await getActiveBusinesses()).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-14 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Straatbeeld-wandeling</p>
          <h1 className="font-serif text-4xl font-black text-deep-green sm:text-6xl">
            Wandel <span className="text-amber-600">de Kamp</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-warm-brown/80">
            Loop de straat virtueel mee, van de Kamperbinnenpoort tot aan de singels. Elke stop met foto, openingstijden
            en het echte straatbeeld — klik op <span className="font-bold text-deep-green">Straatbeeld</span> om bij de
            gevel rond te kijken.
          </p>
        </header>

        <ol className="relative space-y-6 border-l-2 border-amber/25 pl-6 sm:pl-10">
          <li className="relative">
            <span className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber sm:-left-[47px]" />
            <p className="font-serif text-xl font-black text-deep-green">Start · Kamperbinnenpoort</p>
            <p className="text-sm text-warm-brown/70">De middeleeuwse stadspoort — de drempel tussen de Langestraat en De Kamp.</p>
          </li>

          {stops.map((b, i) => {
            const c = coordsFor({ streetSegment: b.streetSegment, address: b.address, lat: b.lat, lng: b.lng });
            return (
              <li key={b.id} className="group relative">
                <span className="absolute -left-[37px] top-6 flex h-4 w-4 items-center justify-center rounded-full border-2 border-amber bg-background text-[10px] font-black text-amber-ink transition-colors group-hover:bg-amber sm:-left-[53px]" />
                <div className="overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] ring-1 ring-stone/30 sm:flex">
                  <Link href={`/ondernemers/${b.id}`} className="relative block aspect-[16/10] overflow-hidden sm:aspect-auto sm:w-56 sm:flex-shrink-0">
                    <BusinessImage business={b} sizes="(max-width:640px) 100vw, 224px" tag={`Stop ${i + 1}`} />
                  </Link>
                  <div className="flex flex-grow flex-col p-6">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-ink">Stop {i + 1}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-warm-brown/40">· {b.category}</span>
                    </div>
                    <Link href={`/ondernemers/${b.id}`} className="font-serif text-2xl font-black leading-tight text-deep-green hover:text-amber-ink">
                      {b.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-warm-brown/60">
                      <MapPin className="h-3.5 w-3.5" /> {b.address}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-warm-brown/75">{b.shortDescription}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <OpenBadge hours={b.hours} />
                      <a href={streetViewUrl(c)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-deep-green px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-amber hover:text-charcoal">
                        <Camera className="h-3.5 w-3.5" /> Straatbeeld
                      </a>
                      <a href={directionsUrl(b.address, b.postalCode)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-warm-brown/70 ring-1 ring-stone/50 transition hover:ring-amber/60">
                        <Navigation className="h-3.5 w-3.5" /> Route
                      </a>
                      <Link href={`/categorie/${categorySlug(b.category)}`} className="ml-auto hidden text-xs font-bold text-amber-ink hover:underline sm:inline-flex items-center gap-1">
                        Meer zoals dit <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}

          <li className="relative">
            <span className="absolute -left-[31px] top-1 h-5 w-5 rounded-full bg-deep-green sm:-left-[47px]" />
            <p className="font-serif text-xl font-black text-deep-green">Einde · de singels</p>
            <p className="text-sm text-warm-brown/70">Sluit af aan het water van de Zuid- of Weverssingel.</p>
          </li>
        </ol>

        <div className="mt-16 rounded-[var(--radius-lg)] bg-deep-green p-10 text-center text-white">
          <h2 className="font-serif text-2xl font-black">Liever op de kaart?</h2>
          <p className="mx-auto mt-2 max-w-md text-stone/80">Bekijk alle {stops.length} ondernemers op de interactieve kaart van De Kamp.</p>
          <Link href="/kaart" className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber px-7 py-3.5 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold">
            Naar de kaart <MapPin className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <JsonLd data={graph(breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Wandel de Kamp", url: "/loop-de-kamp" }]))} />
    </div>
  );
}

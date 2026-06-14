import Link from "next/link";
import { Footprints, ArrowRight, Camera } from "lucide-react";
import type { Business } from "@/data/businesses";
import { getActiveBusinesses } from "@/lib/businessData";
import BusinessImage from "./BusinessImage";

/** Pick a handful of stops with real photos, spread along the walking route. */
function previewStops(list: Business[], n = 5) {
  const withPhoto = list
    .filter((b) => b.imageUrl && b.imageFit !== "contain")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (withPhoto.length <= n) return withPhoto;
  return Array.from({ length: n }, (_, i) => withPhoto[Math.floor((i * (withPhoto.length - 1)) / (n - 1))]);
}

export default async function WandelShowcase() {
  const active = await getActiveBusinesses();
  const stops = previewStops(active, 5);

  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-deep-green p-10 shadow-[var(--shadow-float)] sm:p-14">
          <div className="grain absolute inset-0" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Copy */}
            <div>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-gold">
                <Footprints className="h-4 w-4" /> Straatbeeld-wandeling
              </span>
              <h2 className="font-serif text-4xl font-black leading-[0.95] text-white sm:text-5xl">
                Wandel de hele straat — <span className="text-gold">van poort tot singel</span>
              </h2>
              <p className="mt-6 max-w-md text-lg font-medium leading-relaxed text-stone/80">
                Loop De Kamp stap voor stap mee: bij elke zaak zie je de foto, of het nú open is, én kun je met één klik
                het echte <span className="font-bold text-white">straatbeeld</span> bekijken — alsof je zelf voor de
                gevel staat.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/loop-de-kamp"
                  className="group inline-flex items-center gap-3 rounded-full bg-amber px-8 py-4 text-xs font-black uppercase tracking-widest text-charcoal shadow-xl transition hover:bg-gold active:scale-95"
                >
                  Begin de wandeling
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <span className="inline-flex items-center gap-2 text-sm font-bold text-stone/70">
                  <Camera className="h-4 w-4 text-gold" /> {active.length} stops · Street View
                </span>
              </div>
            </div>

            {/* Staggered photo strip */}
            <div className="flex justify-center gap-3 sm:gap-4">
              {stops.map((b, i) => (
                <Link
                  key={b.id}
                  href={`/ondernemers/${b.id}`}
                  className={`group relative block w-1/5 flex-shrink-0 overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10 transition-transform hover:-translate-y-1 ${
                    i % 2 === 0 ? "translate-y-3" : "-translate-y-3"
                  }`}
                  style={{ aspectRatio: "3 / 4" }}
                >
                  <BusinessImage business={b} sizes="120px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-2 left-0 right-0 px-1 text-center text-[10px] font-black uppercase tracking-wider text-white/90">
                    {i + 1}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

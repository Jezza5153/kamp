import { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, ArrowUpRight, Mail } from "lucide-react";
import { type KampEvent } from "@/data/events";
import { getAgendaEvents } from "@/lib/events";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema } from "@/lib/schema";
import { SITE, abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agenda — wat is er te doen op en rond De Kamp",
  description:
    "De agenda van De Kamp in Amersfoort: markten, koopzondagen, festivals en evenementen in de binnenstad. Ontdek wat er te doen is rond de winkelstraat.",
  alternates: { canonical: "/agenda" },
  openGraph: { title: "Agenda van De Kamp, Amersfoort", description: "Markten, koopzondagen en evenementen in de binnenstad van Amersfoort.", url: "/agenda" },
};

const CATEGORY_ORDER: KampEvent["category"][] = ["De Kamp", "Markt", "Koopzondag", "Festival", "Cultuur", "Seizoen"];

function eventSchema(e: KampEvent) {
  // Only emit Event schema for concrete dated occurrences (avoid schema for vague recurrences).
  if (!e.startDate) return null;
  return {
    "@type": "Event",
    name: e.title,
    startDate: e.startDate,
    ...(e.endDate ? { endDate: e.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: e.where, address: { "@type": "PostalAddress", addressLocality: "Amersfoort", addressCountry: "NL" } },
    description: e.description,
    ...(e.url ? { url: e.url } : {}),
  };
}

// Approved D1 events merge with the seed; refresh within the ISR window.
export const revalidate = 300;

export default async function AgendaPage() {
  const events = await getAgendaEvents();
  const sorted = [...events].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  const eventNodes = events.map(eventSchema).filter(Boolean) as Record<string, unknown>[];

  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Agenda</p>
        <h1 className="font-serif text-4xl font-black text-deep-green sm:text-6xl">
          Wat is er te doen <span className="text-amber-600">op De Kamp</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-warm-brown/80">
          Markten, koopzondagen en evenementen in en rond de binnenstad van Amersfoort — handig om je bezoek aan de
          straat omheen te plannen.
        </p>

        {sorted.length > 0 ? (
          <div className="mt-14 space-y-5">
            {sorted.map((e) => (
              <article key={e.id} className="group flex flex-col gap-4 rounded-[var(--radius-lg)] bg-paper p-7 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-deep-green text-white">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="flex-grow">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-stone/40 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-warm-brown/70">{e.category}</span>
                    <span className="text-sm font-bold text-amber-ink">{e.recurring || e.whenText}</span>
                  </div>
                  <h2 className="font-serif text-2xl font-black text-deep-green">{e.title}</h2>
                  <p className="mt-1 text-warm-brown/75">{e.description}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-warm-brown/60">
                    <MapPin className="h-3.5 w-3.5" /> {e.where}
                    {e.recurring && e.whenText ? <span className="text-warm-brown/40">· {e.whenText}</span> : null}
                  </p>
                </div>
                {e.url && (
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start rounded-full border border-stone/50 px-4 py-2 text-xs font-bold text-deep-green transition hover:border-amber sm:self-center">
                    Meer info <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-14 rounded-[var(--radius-lg)] border-2 border-dashed border-stone/50 bg-paper p-12 text-center">
            <CalendarDays className="mx-auto mb-5 h-10 w-10 text-warm-brown/40" />
            <h2 className="mb-2 font-serif text-2xl font-black text-deep-green">De agenda wordt gevuld</h2>
            <p className="mx-auto max-w-md text-warm-brown/70">
              Binnenkort vind je hier markten, koopzondagen en evenementen rond De Kamp.
            </p>
          </div>
        )}

        {/* Submit CTA */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-deep-green p-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-serif text-xl font-black">Organiseer je iets op De Kamp?</h2>
            <p className="text-stone/80">Markt, opening, workshop of feest — laat het ons weten, dan zetten we het in de agenda.</p>
          </div>
          <a href={`mailto:${SITE.email}?subject=${encodeURIComponent("Evenement voor de agenda van De Kamp")}`} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-amber px-7 py-3.5 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold active:scale-95">
            <Mail className="h-4 w-4" /> Meld je evenement aan
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-warm-brown/50">
          Tip: bekijk ook de <Link href="/kaart" className="font-bold text-amber-ink hover:underline">kaart</Link> en{" "}
          <Link href="/loop-de-kamp" className="font-bold text-amber-ink hover:underline">wandelroute</Link> van De Kamp.
        </p>
      </div>

      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Agenda", url: "/agenda" },
          ]),
          ...eventNodes,
        )}
      />
    </div>
  );
}

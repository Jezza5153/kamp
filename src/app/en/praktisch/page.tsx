import { Metadata } from "next";
import Link from "next/link";
import { Train, Car, Bike, Footprints, Landmark, MapPin, Navigation, Clock } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { getActiveBusinessesIn } from "@/lib/businessData";
import { graph, districtPlaceSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { KAMPERBINNENPOORT } from "@/lib/geo";
import { abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Practical info — where De Kamp is & how to get there",
  description:
    "Everything for your visit to De Kamp in Amersfoort: where it is, parking, by train or bike, and what you'll find nearby. In the heart of the historic old town, by the Kamperbinnenpoort.",
  alternates: { canonical: "/en/praktisch", languages: { nl: "/praktisch", en: "/en/praktisch", "x-default": "/praktisch" } },
  openGraph: { title: "Visit De Kamp — practical info", description: "Location, parking, public transport and sights around De Kamp in Amersfoort.", url: abs("/en/praktisch"), locale: "en_GB" },
};

const gmaps = `https://www.google.com/maps/search/?api=1&query=${KAMPERBINNENPOORT.lat},${KAMPERBINNENPOORT.lng}`;

const arrive = [
  { icon: Train, title: "By train", text: "From Amersfoort Centraal station it's about a 10–12 minute walk to the Kamperbinnenpoort, or a short ride on the city bus towards the old town." },
  { icon: Car, title: "By car", text: "Park in one of the car parks within walking distance — Parkeergarage Flint (Flintplein) and Sint Jorisplein. Paid parking applies in the old town; the car parks are the most convenient option." },
  { icon: Bike, title: "By bike", text: "The old town is low-traffic and bike-friendly. There are guarded bike storages and racks around De Kamp and the Kamperbinnenpoort." },
  { icon: Footprints, title: "On foot", text: "From the city centre, follow the Langestraat and walk straight through the medieval Kamperbinnenpoort onto De Kamp — the gate marks the transition into the area." },
];

const nearby = [
  { name: "Kamperbinnenpoort", note: "The 13th-century city gate, the entrance to De Kamp." },
  { name: "Onze Lieve Vrouwetoren", note: "‘De Lange Jan’ — the landmark tower of the old town." },
  { name: "De singels", note: "The picturesque Zuidsingel and Weverssingel along the water." },
  { name: "De Hof", note: "The central square with the weekly market." },
  { name: "Museum Flehite & Mondriaanhuis", note: "Culture within walking distance." },
  { name: "Langestraat", note: "The adjoining shopping street, just beyond the gate." },
];

const faqs = [
  { question: "Where is De Kamp in Amersfoort?", answer: "De Kamp lies in the historic old town of Amersfoort. The area begins at the Kamperbinnenpoort and runs via the street Kamp and the adjacent streets (Achter de Kamp, Grote and Kleine Sint Jansstraat) into the old town, with the Zuidsingel and Weverssingel as its edges." },
  { question: "Is De Kamp part of the old town?", answer: "Yes. De Kamp is one of the shopping areas (sub-districts) of Amersfoort's old town, with its own traders' association — the ‘Vrienden van de Kamp’. The Kamperbinnenpoort forms the boundary with the neighbouring Langestraat." },
  { question: "Where can you park near De Kamp?", answer: "The most convenient options are the car parks within walking distance: Parkeergarage Flint on the Flintplein and the car park by Sint Jorisplein. Paid on-street parking applies in the old town." },
  { question: "How do you get to De Kamp by public transport?", answer: "From Amersfoort Centraal it's around a 10–12 minute walk, or you can take the city bus towards the old town and get off at the city centre." },
  { question: "Are the shops on De Kamp open on Sundays?", answer: "In Amersfoort, in principle every Sunday is a shopping Sunday; many shops in the old town are open then, usually from 12.00 to 17.00. Check each shop's opening hours in this guide." },
];

export default async function PraktischPage() {
  const activeCount = (await getActiveBusinessesIn("en")).length;
  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-14">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Practical info</p>
          <h1 className="font-serif text-4xl font-black text-deep-green sm:text-6xl">
            Visit <span className="text-amber-600">De Kamp</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-warm-brown/80">
            Everything you need for your visit to De Kamp in Amersfoort — location, transport, parking and what you&apos;ll
            find nearby.
          </p>
        </header>

        {/* Where */}
        <section className="mb-12 grid gap-6 rounded-[var(--radius-lg)] bg-deep-green p-8 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
          <div>
            <h2 className="mb-2 flex items-center gap-2 font-serif text-2xl font-black">
              <MapPin className="h-6 w-6 text-gold" /> Where is De Kamp?
            </h2>
            <p className="leading-relaxed text-stone/80">
              In the heart of the historic old town of Amersfoort, from the medieval Kamperbinnenpoort. {activeCount}{" "}
              independent businesses just a few minutes&apos; walk from one another.
            </p>
          </div>
          <a href={gmaps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-amber px-6 py-3.5 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold">
            <Navigation className="h-4 w-4" /> Open in Maps
          </a>
        </section>

        {/* Arrive */}
        <section className="mb-14">
          <h2 className="mb-6 font-serif text-3xl font-black text-deep-green">How to get there</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {arrive.map((a) => (
              <div key={a.title} className="rounded-[var(--radius)] bg-paper p-6 shadow-[var(--shadow-card)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-deep-green text-white">
                  <a.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-serif text-xl font-black text-deep-green">{a.title}</h3>
                <p className="text-sm leading-relaxed text-warm-brown/75">{a.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Nearby */}
        <section className="mb-14">
          <h2 className="mb-6 flex items-center gap-2 font-serif text-3xl font-black text-deep-green">
            <Landmark className="h-7 w-7 text-amber" /> Nearby
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {nearby.map((n) => (
              <div key={n.name} className="flex items-start gap-3 rounded-[var(--radius)] border border-stone/40 bg-paper p-5">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-ink" />
                <div>
                  <p className="font-bold text-deep-green">{n.name}</p>
                  <p className="text-sm text-warm-brown/70">{n.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="mb-6 font-serif text-3xl font-black text-deep-green">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.question} className="group rounded-[var(--radius)] bg-paper p-6 shadow-[var(--shadow-card)]">
                <summary className="cursor-pointer list-none font-serif text-lg font-bold text-deep-green">
                  <span className="flex items-center justify-between gap-4">
                    {f.question}
                    <span className="text-amber-ink transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-warm-brown/80">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-deep-green p-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 flex-shrink-0 text-gold" />
            <div>
              <h2 className="font-serif text-xl font-black">Ready to explore?</h2>
              <p className="text-stone/80">Browse the map or take a virtual stroll down the street.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/en/kaart" className="rounded-full bg-amber px-6 py-3 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold">To the map</Link>
            <Link href="/en/loop-de-kamp" className="rounded-full border border-white/30 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-deep-green">Walk De Kamp</Link>
          </div>
        </div>
      </div>

      <JsonLd
        data={graph(
          districtPlaceSchema(activeCount),
          breadcrumbSchema([{ name: "Home", url: "/en" }, { name: "Practical info", url: "/en/praktisch" }]),
          faqSchema(faqs),
        )}
      />
    </div>
  );
}

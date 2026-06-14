import { Metadata } from "next";
import Link from "next/link";
import { Train, Car, Bike, Footprints, Landmark, MapPin, Navigation, Clock } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { businesses } from "@/data/businesses";
import { graph, districtPlaceSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { KAMPERBINNENPOORT } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Praktische info — waar ligt De Kamp & hoe kom je er",
  description:
    "Alles voor je bezoek aan De Kamp in Amersfoort: waar het ligt, parkeren, met de trein of fiets, en wat je in de buurt vindt. In het hart van de historische binnenstad, bij de Kamperbinnenpoort.",
  alternates: { canonical: "/praktisch" },
  openGraph: { title: "Bezoek De Kamp — praktische info", description: "Locatie, parkeren, OV en bezienswaardigheden rond De Kamp in Amersfoort.", url: "/praktisch" },
};

const activeCount = businesses.filter((b) => b.status !== "closed").length;
const gmaps = `https://www.google.com/maps/search/?api=1&query=${KAMPERBINNENPOORT.lat},${KAMPERBINNENPOORT.lng}`;

const arrive = [
  { icon: Train, title: "Met de trein", text: "Vanaf station Amersfoort Centraal is het ongeveer 10–12 minuten lopen naar de Kamperbinnenpoort, of een korte rit met de stadsbus richting de binnenstad." },
  { icon: Car, title: "Met de auto", text: "Parkeer in een van de garages op loopafstand — Parkeergarage Flint (Flintplein) en Sint Jorisplein. In de binnenstad geldt betaald parkeren; de garages zijn het handigst." },
  { icon: Bike, title: "Met de fiets", text: "De binnenstad is autoluw en fietsvriendelijk. Er zijn bewaakte stallingen en fietsrekken rond De Kamp en de Kamperbinnenpoort." },
  { icon: Footprints, title: "Te voet", text: "Vanuit het stadshart loop je via de Langestraat zó door de middeleeuwse Kamperbinnenpoort De Kamp op — de poort is de overgang naar het gebied." },
];

const nearby = [
  { name: "Kamperbinnenpoort", note: "De 13e-eeuwse stadspoort, de toegang tot De Kamp." },
  { name: "Onze Lieve Vrouwetoren", note: "‘De Lange Jan’ — het baken van de binnenstad." },
  { name: "De singels", note: "De pittoreske Zuidsingel en Weverssingel langs het water." },
  { name: "De Hof", note: "Het centrale plein met de wekelijkse warenmarkt." },
  { name: "Museum Flehite & Mondriaanhuis", note: "Cultuur op loopafstand." },
  { name: "Langestraat", note: "De aansluitende winkelstraat, net buiten de poort." },
];

const faqs = [
  { question: "Waar ligt De Kamp in Amersfoort?", answer: "De Kamp ligt in de historische binnenstad van Amersfoort. Het gebied begint bij de Kamperbinnenpoort en loopt via de straat Kamp en de aangrenzende straten (Achter de Kamp, Grote en Kleine Sint Jansstraat) de oude stad in, met de Zuid- en Weverssingel als randen." },
  { question: "Is De Kamp onderdeel van de binnenstad?", answer: "Ja. De Kamp is een van de winkelgebieden (deelgebieden) van de Amersfoortse binnenstad, met een eigen ondernemersvereniging — de ‘Vrienden van de Kamp’. De Kamperbinnenpoort vormt de grens met de naastgelegen Langestraat." },
  { question: "Waar kun je parkeren bij De Kamp?", answer: "Het handigst zijn de parkeergarages op loopafstand: Parkeergarage Flint aan het Flintplein en de garage bij Sint Jorisplein. In de binnenstad geldt betaald straatparkeren." },
  { question: "Hoe kom je met het openbaar vervoer bij De Kamp?", answer: "Vanaf Amersfoort Centraal is het circa 10–12 minuten lopen, of je neemt de stadsbus richting de binnenstad en stapt uit bij het stadshart." },
  { question: "Zijn de winkels op De Kamp op zondag open?", answer: "In Amersfoort is het in principe iedere zondag koopzondag; veel winkels in de binnenstad zijn dan open, meestal van 12.00 tot 17.00 uur. Controleer per zaak de openingstijden op deze gids." },
];

export default function PraktischPage() {
  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-14">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Praktische info</p>
          <h1 className="font-serif text-4xl font-black text-deep-green sm:text-6xl">
            Bezoek <span className="text-amber-600">De Kamp</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-warm-brown/80">
            Alles wat je nodig hebt voor je bezoek aan De Kamp in Amersfoort — locatie, vervoer, parkeren en wat je in de
            buurt vindt.
          </p>
        </header>

        {/* Where */}
        <section className="mb-12 grid gap-6 rounded-[var(--radius-lg)] bg-deep-green p-8 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
          <div>
            <h2 className="mb-2 flex items-center gap-2 font-serif text-2xl font-black">
              <MapPin className="h-6 w-6 text-gold" /> Waar ligt De Kamp?
            </h2>
            <p className="leading-relaxed text-stone/80">
              In het hart van de historische binnenstad van Amersfoort, vanaf de middeleeuwse Kamperbinnenpoort. {activeCount}{" "}
              zelfstandige ondernemers op een paar minuten lopen van elkaar.
            </p>
          </div>
          <a href={gmaps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-amber px-6 py-3.5 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold">
            <Navigation className="h-4 w-4" /> Open in Maps
          </a>
        </section>

        {/* Arrive */}
        <section className="mb-14">
          <h2 className="mb-6 font-serif text-3xl font-black text-deep-green">Zo kom je er</h2>
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
            <Landmark className="h-7 w-7 text-amber" /> In de buurt
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
          <h2 className="mb-6 font-serif text-3xl font-black text-deep-green">Veelgestelde vragen</h2>
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
              <h2 className="font-serif text-xl font-black">Klaar om te ontdekken?</h2>
              <p className="text-stone/80">Bekijk de kaart of wandel de straat virtueel mee.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/kaart" className="rounded-full bg-amber px-6 py-3 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold">Naar de kaart</Link>
            <Link href="/loop-de-kamp" className="rounded-full border border-white/30 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-deep-green">Wandel de Kamp</Link>
          </div>
        </div>
      </div>

      <JsonLd
        data={graph(
          districtPlaceSchema(activeCount),
          breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Praktische info", url: "/praktisch" }]),
          faqSchema(faqs),
        )}
      />
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { Gift, Heart, Store, ArrowRight, Mail, Sparkles } from "lucide-react";
import { getActiveBusinesses } from "@/lib/businessData";
import { CATEGORIES } from "@/lib/categories";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kamp Cadeaukaart — één cadeaubon voor heel De Kamp",
  description:
    "De Kamp Cadeaukaart: een lokale cadeaubon die je besteedt bij de zelfstandige winkels, restaurants en makers van De Kamp in Amersfoort. Houd je cadeau — en je geld — lokaal.",
  alternates: { canonical: "/cadeaukaart", languages: { nl: "/cadeaukaart", en: "/en/cadeaukaart", "x-default": "/cadeaukaart" } },
  openGraph: { title: "Kamp Cadeaukaart", description: "Eén cadeaubon voor alle zelfstandige ondernemers van De Kamp in Amersfoort.", url: "/cadeaukaart" },
};

const mailto = (subject: string) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;

const steps = [
  { icon: Gift, title: "Koop de kaart", text: "Kies een bedrag en ontvang de Kamp Cadeaukaart — digitaal of als fysiek kaartje om weg te geven." },
  { icon: Heart, title: "Geef iets persoonlijks", text: "Geen standaard bon, maar een cadeau met een verhaal: een dag winkelen, eten en ontdekken op De Kamp." },
  { icon: Store, title: "Besteden op De Kamp", text: "De ontvanger kiest zelf: een diner, een sieraad, een boeket of een goede fles wijn — bij de zelfstandige zaken van de straat." },
];

export default async function CadeaukaartPage() {
  // Independent participating merchants (chains/anchors excluded), in walking order.
  const participants = (await getActiveBusinesses())
    .filter((b) => b.category !== "Keten / anker")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const faqs = [
    {
      question: "Wat is de Kamp Cadeaukaart?",
      answer:
        "Een lokale cadeaubon die je uitsluitend besteedt bij de zelfstandige ondernemers van De Kamp in Amersfoort. Eén kaart, vrij te besteden bij tientallen winkels, restaurants en makers — zo blijft je cadeau, en je geld, in de buurt.",
    },
    {
      question: "Waar kan ik de cadeaukaart besteden?",
      answer: `Bij de deelnemende zelfstandige zaken op De Kamp en de aangrenzende straten. Op dit moment staan er ${participants.length} onafhankelijke ondernemers in de gids; landelijke ketens doen bewust niet mee, zodat het lokaal blijft.`,
    },
    {
      question: "Kan ik de kaart als zakelijk relatiegeschenk gebruiken?",
      answer:
        "Ja, dat is juist een mooie toepassing: een lokaal relatie- of personeelsgeschenk dat de Amersfoortse binnenstad steunt. Neem contact op voor zakelijke bestellingen op maat.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-deep-green text-white">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Initiatief · in ontwikkeling
          </div>
          <h1 className="mt-7 max-w-3xl font-serif text-5xl font-black leading-[0.95] sm:text-7xl">
            Eén cadeaubon <span className="text-gold">voor heel De Kamp</span>
          </h1>
          <p className="mt-6 max-w-2xl text-xl font-medium text-stone/85 sm:text-2xl">
            De Kamp Cadeaukaart: te besteden bij de zelfstandige winkels, restaurants en makers van de straat. Geef een
            dag ontdekken cadeau — en houd je geld lokaal.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={mailto("Interesse Kamp Cadeaukaart")} className="inline-flex items-center gap-2 rounded-full bg-amber px-8 py-4 text-xs font-black uppercase tracking-widest text-charcoal shadow-xl transition hover:bg-gold active:scale-95">
              <Mail className="h-4 w-4" /> Houd mij op de hoogte
            </a>
            <a href={mailto("Zakelijke Kamp Cadeaukaart (relatiegeschenk)")} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-deep-green">
              Zakelijk bestellen
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Hoe het werkt</p>
        <h2 className="mb-12 max-w-2xl font-serif text-3xl font-black text-deep-green sm:text-4xl">
          Een lokaal cadeau in drie stappen
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-[var(--radius-lg)] bg-paper p-8 shadow-[var(--shadow-card)]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-deep-green text-white">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-amber-ink">Stap {i + 1}</p>
              <h3 className="mb-2 font-serif text-2xl font-black text-deep-green">{s.title}</h3>
              <p className="leading-relaxed text-warm-brown/75">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why local */}
      <section className="bg-stone/15 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Waarom lokaal</p>
            <h2 className="font-serif text-3xl font-black text-deep-green sm:text-4xl">Je geld blijft in de straat</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-warm-brown/80">
            <p>
              Een euro die je bij een zelfstandige ondernemer uitgeeft, blijft veel langer in de buurt dan bij een keten.
              De Kamp Cadeaukaart maakt dat tastbaar: één bon die het hele vakmanschap van de straat steunt — van de
              goudsmid tot het Ethiopische restaurant.
            </p>
            <p>
              Andere steden bewijzen het succes van de lokale cadeaukaart al. De Kamp heeft de perfecte ingrediënten: een
              compact gebied, tientallen unieke zaken en een sterke ‘<a href="https://vriendenvandekamp.nl/" target="_blank" rel="noopener noreferrer" className="font-semibold text-deep-green underline decoration-amber/40 underline-offset-2 transition hover:decoration-amber">Vrienden van de Kamp</a>’-gemeenschap.
            </p>
          </div>
        </div>
      </section>

      {/* Participating merchants */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Deelnemers</p>
        <h2 className="mb-3 font-serif text-3xl font-black text-deep-green sm:text-4xl">
          {participants.length} zelfstandige ondernemers
        </h2>
        <p className="mb-10 max-w-2xl text-warm-brown/70">
          De cadeaukaart is bedoeld voor de onafhankelijke zaken van De Kamp. Dit zijn de ondernemers die mee zouden
          kunnen doen — landelijke ketens laten we er bewust buiten.
        </p>

        <div className="space-y-10">
          {CATEGORIES.filter((c) => c.name !== "Keten / anker").map((c) => {
            const list = participants.filter((b) => b.category === c.name);
            if (!list.length) return null;
            return (
              <div key={c.slug}>
                <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-deep-green">{c.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {list.map((b) => (
                    <Link
                      key={b.id}
                      href={`/ondernemers/${b.id}`}
                      className="rounded-full border border-stone/50 bg-paper px-4 py-2 text-sm font-semibold text-warm-brown/80 transition hover:border-amber hover:text-deep-green"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        <h2 className="mb-8 font-serif text-3xl font-black text-deep-green">Veelgestelde vragen</h2>
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

        <div className="mt-12 flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-deep-green p-10 text-center text-white">
          <h2 className="font-serif text-2xl font-black">Interesse in de Kamp Cadeaukaart?</h2>
          <p className="max-w-md text-stone/80">Laat het ons weten — dan houden we je op de hoogte zodra de kaart er is.</p>
          <a href={mailto("Interesse Kamp Cadeaukaart")} className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber px-8 py-3.5 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold active:scale-95">
            Houd mij op de hoogte <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Cadeaukaart", url: "/cadeaukaart" },
          ]),
          faqSchema(faqs),
        )}
      />
    </div>
  );
}

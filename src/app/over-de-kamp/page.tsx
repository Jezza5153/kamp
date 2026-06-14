import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getActiveBusinesses } from "@/lib/businessData";
import { graph, districtPlaceSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";

export const metadata = {
  title: "Over De Kamp in Amersfoort — geschiedenis & winkelgebied",
  description:
    "De geschiedenis van De Kamp in Amersfoort: van middeleeuwse veedrift en de 13e-eeuwse Kamperbinnenpoort tot het onafhankelijke winkel- en horecagebied van vandaag.",
  alternates: { canonical: "/over-de-kamp" },
};

const faqs = [
  {
    question: "Wat is De Kamp in Amersfoort?",
    answer:
      "De Kamp is een circa 350 meter lange straat in de historische binnenstad van Amersfoort en het hart van een onafhankelijk winkel- en horecagebied. De straat begint bij de Kamperbinnenpoort en loopt de oude stad in. Samen met Achter de Kamp, de Grote Sint Jansstraat, de Zuidsingel en de Weverssingel vormt het een aaneengesloten gebied vol zelfstandige winkels, makers en restaurants.",
  },
  {
    question: "Hoe oud is de Kamperbinnenpoort?",
    answer:
      "De Kamperbinnenpoort dateert uit de tweede helft van de 13e eeuw en is de oudste nog bestaande stadspoort van Amersfoort. De poort bestaat uit twee achthoekige bakstenen torens met een verbindende boog en markeert de overgang van de Langestraat naar De Kamp.",
  },
  {
    question: "Waar komt de naam De Kamp vandaan?",
    answer:
      "Een ‘kamp’ is een omheind weiland. Het gebied buiten de eerste stadsmuur was gemeenschappelijke weidegrond waar vee naartoe werd gedreven. De straat heette in 1388 ‘Coecamp’/‘Oude Strate’ en van 1521 tot 1914 ‘Kampstraat’, en draagt sindsdien de naam Kamp.",
  },
];

export default async function AboutPage() {
  const active = await getActiveBusinesses();
  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-16 text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">De geschiedenis</p>
          <h1 className="font-serif text-4xl font-black text-deep-green sm:text-6xl">Over De Kamp</h1>
          <p className="mx-auto mt-6 max-w-xl text-xl font-medium italic leading-relaxed text-warm-brown/80">
            Waar de middeleeuwse geschiedenis van Amersfoort de ondernemerslust van vandaag ontmoet.
          </p>
        </header>

        <div className="space-y-14 leading-relaxed text-warm-brown/85">
          <section>
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">Wat is De Kamp?</h2>
            <p>
              De Kamp is een van de meest karakteristieke straten van de Amersfoortse binnenstad en het kloppend hart van
              een klein, onafhankelijk winkel- en horecagebied. De circa 350 meter lange straat begint bij de iconische
              Kamperbinnenpoort en loopt de oude stad in, langs tientallen rijksmonumenten. Anders dan de drukke
              Langestraat — met zijn ketens, net buiten de poort — is De Kamp kleinschalig, eigenzinnig en sfeervol: hier
              vind je zelfstandige winkeliers, ambachtelijke makers en een opvallend internationale horeca.
            </p>
          </section>

          <section className="grain rounded-[var(--radius-lg)] bg-paper p-8 sm:p-10">
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">De Kamperbinnenpoort</h2>
            <p>
              De Kamperbinnenpoort werd in de tweede helft van de 13e eeuw gebouwd als onderdeel van de eerste stadsmuur
              en is de oudste nog bestaande stadspoort van Amersfoort: twee achthoekige bakstenen torens met een
              verbindende boog. Toen de stad rond 1380 een tweede, grotere muur kreeg, kwam de poort binnen de stad te
              liggen. In 1914 besloot de gemeenteraad de poort te slopen voor een verkeerskruising, maar dankzij een
              rijkssubsidie bleef hij behouden en werd de boog tussen 1931 en 1933 herbouwd.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">Van veedrift tot winkelstraat</h2>
            <p>
              Een ‘kamp’ is een omheind weiland. De grond buiten de eerste stadsmuur was gemeenschappelijke weidegrond,
              en het vee werd er via de poort naartoe gedreven — vandaar de oorspronkelijke naam Viepoort. De
              handelsroute werd in 1388 vastgelegd als ‘Coecamp’ of ‘Oude Strate’ en heette van 1521 tot 1914
              ‘Kampstraat’. Eeuwenlang was het een toegangsweg voor handelaren en reizigers; vandaag is het de plek waar
              die handelsgeest voortleeft in de etalages van onafhankelijke ondernemers.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">Het gebied vandaag</h2>
            <p>
              Hoewel de naam De Kamp centraal staat, reikt het gebied verder: de Grote Sint Jansstraat, de Zuidsingel, de
              Weverssingel en Achter de Kamp horen er onlosmakelijk bij. Samen vormen ze een uniek winkel- en
              horecagebied met restaurants uit de hele wereld — Frans, Indiaas, Italiaans, Ethiopisch, Chinees en meer —
              naast goudsmeden, wijnkopers, interieurzaken, ambachtslieden en vertrouwde vakzaken. De ondernemers zijn
              verenigd in ‘Vrienden van de Kamp’. Op deze gids vind je er {active.length}.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">Waarom deze gids?</h2>
            <p>
              Achter elke deur op De Kamp zit een ondernemer met een passie, een vakmanschap en een verhaal. Deze gids
              geeft die verhalen een podium en maakt de straat beter vindbaar — voor inwoners van Amersfoort én voor
              bezoekers die op zoek zijn naar datgene wat een stad echt bijzonder maakt.
            </p>
          </section>

          <section>
            <h2 className="mb-6 font-serif text-2xl font-black text-deep-green sm:text-3xl">Veelgestelde vragen</h2>
            <div className="space-y-6">
              {faqs.map((f) => (
                <div key={f.question}>
                  <h3 className="mb-1.5 text-lg font-bold text-deep-green">{f.question}</h3>
                  <p>{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-deep-green p-10 text-center text-white">
          <h2 className="font-serif text-2xl font-black">Ontdek de ondernemers</h2>
          <p className="max-w-md text-stone/80">Loop de straat door op de kaart of bekijk alle zaken in de gids.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/#ondernemers" className="rounded-full bg-amber px-7 py-3 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold">
              Naar de gids
            </Link>
            <Link href="/kaart" className="rounded-full border border-white/30 px-7 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-deep-green">
              Bekijk de kaart
            </Link>
          </div>
        </div>

        <p className="mt-10 border-t border-stone/40 pt-6 text-xs leading-relaxed text-warm-brown/50">
          Disclaimer: de informatie op deze website is verzameld uit publieke bronnen en via opgave van ondernemers.
          Ondanks onze zorgvuldigheid kan informatie verouderd zijn. Mis je iets of klopt er iets niet? Laat het ons
          weten via info@ondernemersvandekamp.nl.
        </p>
      </article>

      <JsonLd
        data={graph(
          districtPlaceSchema(active.length),
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Over De Kamp", url: "/over-de-kamp" },
          ]),
          faqSchema(faqs),
        )}
      />
    </div>
  );
}

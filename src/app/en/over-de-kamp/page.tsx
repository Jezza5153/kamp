import Link from "next/link";
import { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { getActiveBusinessesIn } from "@/lib/businessData";
import { graph, districtPlaceSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "About De Kamp in Amersfoort — history & shopping district",
  description:
    "The history of De Kamp in Amersfoort: from medieval cattle droving and the 13th-century Kamperbinnenpoort city gate to the independent shopping and dining district of today.",
  alternates: {
    canonical: "/en/over-de-kamp",
    languages: { nl: "/over-de-kamp", en: "/en/over-de-kamp" },
  },
  openGraph: { url: abs("/en/over-de-kamp"), locale: "en_GB" },
};

const faqs = [
  {
    question: "What is De Kamp in Amersfoort?",
    answer:
      "De Kamp is a street roughly 350 metres long in the historic centre of Amersfoort and the heart of an independent shopping and dining district. The street starts at the Kamperbinnenpoort and runs into the old town. Together with Achter de Kamp, the Grote Sint Jansstraat, the Zuidsingel and the Weverssingel it forms a continuous area full of independent shops, makers and restaurants.",
  },
  {
    question: "How old is the Kamperbinnenpoort?",
    answer:
      "The Kamperbinnenpoort dates from the second half of the 13th century and is the oldest surviving city gate in Amersfoort. The gate consists of two octagonal brick towers with a connecting arch, and marks the transition from the Langestraat to De Kamp.",
  },
  {
    question: "Where does the name De Kamp come from?",
    answer:
      "A ‘kamp’ is an enclosed meadow. The land outside the first city wall was common pasture where cattle were driven. The street was called ‘Coecamp’/‘Oude Strate’ in 1388 and ‘Kampstraat’ from 1521 to 1914, and has carried the name Kamp ever since.",
  },
];

export default async function AboutPage() {
  const active = await getActiveBusinessesIn("en");
  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-16 text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">The history</p>
          <h1 className="font-serif text-4xl font-black text-deep-green sm:text-6xl">About De Kamp</h1>
          <p className="mx-auto mt-6 max-w-xl text-xl font-medium italic leading-relaxed text-warm-brown/80">
            Where the medieval history of Amersfoort meets the entrepreneurial spirit of today.
          </p>
        </header>

        <div className="space-y-14 leading-relaxed text-warm-brown/85">
          <section>
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">What is De Kamp?</h2>
            <p>
              De Kamp is one of the most characterful streets in the centre of Amersfoort and the beating heart of a
              small, independent shopping and dining district. The street, around 350 metres long, begins at the iconic
              Kamperbinnenpoort and runs into the old town, past dozens of listed national monuments. Unlike the busy
              Langestraat — with its chain stores, just outside the gate — De Kamp is small-scale, distinctive and full
              of character: here you will find independent shopkeepers, artisan makers and a strikingly international
              array of cafés and restaurants.
            </p>
          </section>

          <section className="grain rounded-[var(--radius-lg)] bg-paper p-8 sm:p-10">
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">The Kamperbinnenpoort</h2>
            <p>
              The Kamperbinnenpoort was built in the second half of the 13th century as part of the first city wall and
              is the oldest surviving city gate in Amersfoort: two octagonal brick towers with a connecting arch. When
              the city gained a second, larger wall around 1380, the gate came to lie within the city. In 1914 the town
              council decided to demolish the gate to make way for a road junction, but thanks to a national subsidy it
              was preserved, and the arch was rebuilt between 1931 and 1933.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">From cattle drove to shopping street</h2>
            <p>
              A ‘kamp’ is an enclosed meadow. The land outside the first city wall was common pasture, and the cattle
              were driven there through the gate — hence the original name Viepoort. The trade route was recorded in
              1388 as ‘Coecamp’ or ‘Oude Strate’ and was known as ‘Kampstraat’ from 1521 to 1914. For centuries it was
              an access road for traders and travellers; today it is the place where that commercial spirit lives on in
              the shop windows of independent entrepreneurs.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">The district today</h2>
            <p>
              Although the name De Kamp takes centre stage, the district reaches further: the Grote Sint Jansstraat, the
              Zuidsingel, the Weverssingel and Achter de Kamp are an inseparable part of it. Together they form a unique
              shopping and dining district with restaurants from all over the world — French, Indian, Italian,
              Ethiopian, Chinese and more — alongside goldsmiths, wine merchants, interior shops, craftspeople and
              trusted specialist stores. The entrepreneurs are united in ‘Vrienden van de Kamp’. On this guide you will
              find {active.length} of them.
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-serif text-2xl font-black text-deep-green sm:text-3xl">Why this guide?</h2>
            <p>
              Behind every door on De Kamp is an entrepreneur with a passion, a craft and a story. This guide gives
              those stories a stage and makes the street easier to find — for the people of Amersfoort and for visitors
              looking for the things that make a city truly special.
            </p>
          </section>

          <section>
            <h2 className="mb-6 font-serif text-2xl font-black text-deep-green sm:text-3xl">Frequently asked questions</h2>
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
          <h2 className="font-serif text-2xl font-black">Discover the entrepreneurs</h2>
          <p className="max-w-md text-stone/80">Walk the street on the map or browse all the businesses in the guide.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/en#ondernemers" className="rounded-full bg-amber px-7 py-3 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold">
              To the guide
            </Link>
            <Link href="/en/kaart" className="rounded-full border border-white/30 px-7 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-deep-green">
              View the map
            </Link>
          </div>
        </div>

        <p className="mt-10 border-t border-stone/40 pt-6 text-xs leading-relaxed text-warm-brown/50">
          Disclaimer: the information on this website has been gathered from public sources and details supplied by the
          entrepreneurs themselves. Despite our care, information may be out of date. Is something missing or
          incorrect? Let us know at info@ondernemersvandekamp.nl.
        </p>
      </article>

      <JsonLd
        data={graph(
          districtPlaceSchema(active.length),
          breadcrumbSchema([
            { name: "Home", url: "/en" },
            { name: "About De Kamp", url: "/en/over-de-kamp" },
          ]),
          faqSchema(faqs),
        )}
      />
    </div>
  );
}

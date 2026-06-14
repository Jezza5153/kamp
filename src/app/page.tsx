import Hero from "@/components/Hero";
import SeoIntro from "@/components/SeoIntro";
import FeaturedHorizontal from "@/components/FeaturedHorizontal";
import BusinessExplorer from "@/components/BusinessExplorer";
import OwnerSubmitCta from "@/components/OwnerSubmitCta";
import JsonLd from "@/components/JsonLd";
import { businesses } from "@/data/businesses";
import { graph, organizationSchema, websiteSchema, districtPlaceSchema, itemListSchema } from "@/lib/schema";

export default function Home() {
  const active = businesses.filter((b) => b.status !== "closed");

  return (
    <div className="flex flex-col">
      <Hero />
      <SeoIntro />
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

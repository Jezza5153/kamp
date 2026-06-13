import Hero from "@/components/Hero";
import SeoIntro from "@/components/SeoIntro";
import BusinessGrid from "@/components/BusinessGrid";
import OwnerSubmitCta from "@/components/OwnerSubmitCta";
import FeaturedBusinesses from "@/components/FeaturedBusinesses";

export default function Home() {
  return (
    <div className="flex flex-col gap-0">
      <Hero />
      <SeoIntro />
      
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-deep-green mb-4">Gezichten van de straat</h2>
              <p className="text-warm-brown/60 text-lg font-medium max-w-xl">
                Maak kennis met de ondernemers die elke dag klaarstaan om de Kamp te laten bruisen.
              </p>
            </div>
          </div>
          <FeaturedBusinesses />
        </div>
      </section>

      <div className="bg-stone/10">
        <BusinessGrid />
      </div>

      <OwnerSubmitCta />
    </div>
  );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { businesses, BusinessCategory } from "@/data/businesses";
import BusinessCard from "@/components/BusinessCard";
import JsonLd from "@/components/JsonLd";
import Link from "next/link";

const categoryMap: Record<string, BusinessCategory> = {
  "eten-drinken": "Eten & drinken",
  "koffie-lunch-zoet": "Koffie, lunch & zoet",
  "winkels-makers": "Winkels & makers",
  "mode-sieraden": "Mode & sieraden",
  "interieur-kunst": "Interieur & kunst",
  "beauty-verzorging": "Beauty & verzorging",
  "services-praktisch": "Services & praktisch",
  "slapen": "Slapen",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = categoryMap[slug];

  if (!categoryName) return {};

  return {
    title: `${categoryName} op De Kamp in Amersfoort`,
    description: `Ontdek de beste ${categoryName.toLowerCase()} op De Kamp in Amersfoort. Bekijk het overzicht van lokale ondernemers.`,
  };
}

export async function generateStaticParams() {
  return Object.keys(categoryMap).map((slug) => ({
    slug,
  }));
}

export default async function CategoryLanding({ params }: Props) {
  const { slug } = await params;
  const categoryName = categoryMap[slug];

  if (!categoryName) notFound();

  const filtered = businesses.filter((b) => b.category === categoryName);

  return (
    <div className="bg-background min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link href="/" className="text-amber font-bold text-sm tracking-widest uppercase mb-4 inline-block hover:underline">
            &larr; Alle ondernemers
          </Link>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-deep-green mb-6">
            {categoryName} op De Kamp
          </h1>
          <p className="text-lg text-warm-brown/80 max-w-3xl font-medium leading-relaxed">
            De Kamp in Amersfoort staat bekend om zijn diversiteit. In de categorie <span className="text-amber font-bold">{categoryName.toLowerCase()}</span> vind je een zorgvuldig samengestelde selectie van lokale zaken waar vakmanschap en passie centraal staan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>

        {/* Category FAQ Section */}
        <section className="mt-24 bg-stone/20 rounded-3xl p-8 md:p-12 border border-stone/30">
          <h2 className="text-3xl font-serif font-bold text-deep-green mb-8">Veelgestelde vragen</h2>
          <div className="space-y-8 max-w-3xl">
            <div>
              <h3 className="text-xl font-bold text-deep-green mb-2">Waar kun je {categoryName.toLowerCase()} vinden op De Kamp?</h3>
              <p className="text-warm-brown/80">Je vindt {categoryName.toLowerCase()} verspreid over de hele straat, van de Kamperbinnenpoort tot aan de Weverssingel. Elke ondernemer heeft een eigen unieke plek en verhaal.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-deep-green mb-2">Welke ondernemers zitten er in deze categorie?</h3>
              <p className="text-warm-brown/80">In de categorie {categoryName.toLowerCase()} zitten onder andere {filtered.slice(0, 3).map(b => b.name).join(', ')}.</p>
            </div>
          </div>
        </section>
      </div>
      
      {/* JSON-LD for category landing */}
      <JsonLd 
        type="ItemList" 
        data={{
          name: categoryName,
          items: filtered.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://ondernemersvandekamp.nl/ondernemers/${b.id}`,
            name: b.name
          }))
        }} 
      />
    </div>
  );
}

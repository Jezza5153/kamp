import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { businesses } from "@/data/businesses";
import BusinessCard from "@/components/BusinessCard";
import JsonLd from "@/components/JsonLd";
import { CATEGORIES, categoryBySlug, ALL_CATEGORY_SLUGS } from "@/lib/categories";
import { graph, itemListSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";

interface Props {
  params: Promise<{ slug: string }>;
}

const active = businesses.filter((b) => b.status !== "closed");

export async function generateStaticParams() {
  return ALL_CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = categoryBySlug(slug);
  if (!cat) return {};
  const title = `${cat.name} op De Kamp in Amersfoort`;
  return {
    title,
    description: cat.blurb,
    alternates: { canonical: `/categorie/${slug}` },
    openGraph: { title, description: cat.blurb, url: `/categorie/${slug}` },
  };
}

export default async function CategoryLanding({ params }: Props) {
  const { slug } = await params;
  const cat = categoryBySlug(slug);
  if (!cat) notFound();

  const filtered = active
    .filter((b) => b.category === cat.name)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.sortOrder - b.sortOrder);

  const names = filtered.slice(0, 4).map((b) => b.name).join(", ");
  const faqs = [
    {
      question: `Waar vind je ${cat.name.toLowerCase()} op De Kamp in Amersfoort?`,
      answer: `Je vindt ${cat.name.toLowerCase()} verspreid over De Kamp en de aangrenzende straten (Achter de Kamp, Grote Sint Jansstraat, Zuidsingel en Weverssingel), op loopafstand van de Kamperbinnenpoort in de binnenstad van Amersfoort.`,
    },
    {
      question: `Welke zaken vallen onder ${cat.name.toLowerCase()}?`,
      answer: `Onder andere ${names}. In totaal staan er ${filtered.length} ondernemers in deze categorie op deze gids.`,
    },
  ];

  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-block text-xs font-black uppercase tracking-widest text-amber-ink hover:underline">
          ← Alle ondernemers
        </Link>
        <h1 className="mb-6 font-serif text-4xl font-black text-deep-green sm:text-6xl">
          {cat.name} <span className="text-amber-600">op De Kamp</span>
        </h1>
        <p className="max-w-3xl text-lg font-medium leading-relaxed text-warm-brown/80">{cat.blurb}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.slug !== slug).map((c) => (
            <Link key={c.slug} href={`/categorie/${c.slug}`} className="rounded-full border border-stone/50 bg-paper px-4 py-1.5 text-sm font-bold text-deep-green transition hover:border-amber hover:text-amber">
              {c.short}
            </Link>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b, i) => (
            <BusinessCard key={b.id} business={b} priority={i < 3} />
          ))}
        </div>

        <section className="mt-24 rounded-[var(--radius-lg)] border border-stone/40 bg-paper p-8 sm:p-12">
          <h2 className="mb-8 font-serif text-3xl font-black text-deep-green">Veelgestelde vragen</h2>
          <div className="max-w-3xl space-y-8">
            {faqs.map((f) => (
              <div key={f.question}>
                <h3 className="mb-2 text-xl font-bold text-deep-green">{f.question}</h3>
                <p className="text-warm-brown/80">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <JsonLd
        data={graph(
          itemListSchema(`${cat.name} op De Kamp`, filtered),
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: cat.name, url: `/categorie/${slug}` },
          ]),
          faqSchema(faqs),
        )}
      />
    </div>
  );
}

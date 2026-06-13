import { Metadata } from "next";
import { notFound } from "next/navigation";
import { businesses } from "@/data/businesses";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const business = businesses.find((b) => b.id === id);

  if (!business) return {};

  return {
    title: `${business.name} op De Kamp in Amersfoort`,
    description: `${business.shortDescription} Ontdek ${business.name}, onderdeel van de ondernemers op De Kamp in Amersfoort.`,
  };
}

export async function generateStaticParams() {
  return businesses.map((b) => ({
    id: b.id,
  }));
}

export default async function BusinessDetail({ params }: Props) {
  const { id } = await params;
  const business = businesses.find((b) => b.id === id);

  if (!business) notFound();

  return (
    <div className="bg-background min-h-screen">
      {/* Detail Header */}
      <div className="bg-deep-green text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs 
            items={[
              { label: business.category, href: `/categorie/${business.category.toLowerCase().replace(/ & /g, '-').replace(/, /g, '-').replace(/ /g, '-')}` },
              { label: business.name, current: true }
            ]} 
          />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <span className="px-3 py-1 bg-amber text-white text-xs font-bold rounded-full uppercase tracking-widest mb-4 inline-block">
                {business.category}
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight">
                {business.name}
              </h1>
              <p className="mt-4 text-xl text-stone/90 font-medium max-w-2xl">
                {business.shortDescription}
              </p>
            </div>
            {business.websiteUrl && (
              <a 
                href={business.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-white text-deep-green font-bold rounded-full hover:bg-stone transition-all shadow-lg text-lg"
              >
                Bezoek website
              </a>
            )}
          </div>
          
          {business.imageUrl && (
            <div className="mt-12 rounded-3xl overflow-hidden shadow-2xl aspect-[21/9] border-4 border-white/10">
              <img 
                src={business.imageUrl} 
                alt={business.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            {/* Story Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-serif font-bold text-deep-green mb-8">Het verhaal achter de zaak</h2>
              <div className="prose prose-xl prose-stone max-w-none text-warm-brown/90 leading-relaxed italic">
                {business.longDescription}
              </div>
              
              <div className="mt-12 p-8 bg-stone/20 rounded-3xl border border-stone/30">
                <h3 className="text-xl font-serif font-bold text-deep-green mb-4">De mens achter {business.name}</h3>
                {business.publicPersonName ? (
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-deep-green/10 flex items-center justify-center text-deep-green border-2 border-amber/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-deep-green">{business.publicPersonName}</p>
                      <p className="text-warm-brown/60 text-sm italic">{business.publicPersonRole}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-warm-brown/70 italic leading-relaxed">
                    Het verhaal van de ondernemer achter deze zaak voegen we binnenkort toe. 
                    Ken jij de ondernemer of ben je het zelf? <Link href="/aanmelden" className="text-amber font-bold underline">Laat het ons weten.</Link>
                  </p>
                )}
              </div>
            </section>

            {/* AI Summary / In het kort */}
            <section className="bg-white p-8 rounded-3xl border border-stone/20 shadow-sm mb-16">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone/60 mb-4">In het kort</h2>
              <p className="text-warm-brown/90 leading-relaxed font-medium">
                {business.name} is een {business.category} aan {business.address} op De Kamp in Amersfoort. 
                Je kunt hier terecht voor {business.subcategory.toLowerCase()}.
              </p>
            </section>
          </div>

          {/* Sidebar / Practical Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-stone/20 shadow-sm">
                <h3 className="text-2xl font-serif font-bold text-deep-green mb-6">Praktische info</h3>
                <dl className="space-y-6">
                  <div>
                    <dt className="text-xs font-bold text-stone/50 uppercase tracking-widest mb-1">Adres</dt>
                    <dd className="text-warm-brown font-semibold">{business.address}, {business.postalCode} Amersfoort</dd>
                  </div>
                  {business.phone && (
                    <div>
                      <dt className="text-xs font-bold text-stone/50 uppercase tracking-widest mb-1">Telefoon</dt>
                      <dd className="text-warm-brown font-semibold">{business.phone}</dd>
                    </div>
                  )}
                  {business.email && (
                    <div>
                      <dt className="text-xs font-bold text-stone/50 uppercase tracking-widest mb-1">E-mail</dt>
                      <dd className="text-warm-brown font-semibold break-all">{business.email}</dd>
                    </div>
                  )}
                  {business.instagramUrl && (
                    <div>
                      <dt className="text-xs font-bold text-stone/50 uppercase tracking-widest mb-1">Instagram</dt>
                      <dd>
                        <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-amber font-bold hover:underline">
                          @ {business.instagramUrl.split('/').pop()}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-stone p-8 rounded-3xl border border-stone/30">
                <h3 className="text-xl font-serif font-bold text-deep-green mb-4">Loop de Kamp</h3>
                <p className="text-sm text-warm-brown/70 mb-6 font-medium">
                  {business.name} is een van de vele unieke stops op de route door De Kamp.
                </p>
                <Link href="/loop-de-kamp" className="text-amber font-bold flex items-center hover:translate-x-1 transition-transform">
                  Bekijk de hele route
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* JSON-LD for LocalBusiness */}
      <JsonLd type="LocalBusiness" data={business} />
    </div>
  );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { businesses } from "@/data/businesses";
import BusinessDetailClient from "@/components/BusinessDetailClient";
import JsonLd from "@/components/JsonLd";
import { graph, localBusinessSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { relatedBusinesses, buildFaqs } from "@/lib/related";
import { categorySlug, categoryByName } from "@/lib/categories";
import { businessUrl, abs, SITE } from "@/lib/site";

interface Props {
  params: Promise<{ id: string }>;
}

const active = businesses.filter((b) => b.status !== "closed");

export async function generateStaticParams() {
  return active.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = businesses.find((x) => x.id === id);
  if (!b) return {};

  const title = `${b.name} — ${b.subcategory} op De Kamp, Amersfoort`;
  const description = `${b.shortDescription} ${b.address}, Amersfoort.`;
  // Local photo → use it; otherwise inherit the branded root opengraph-image.
  const localImage = b.imageUrl && b.imageUrl.startsWith("/") ? abs(b.imageUrl) : undefined;

  return {
    title,
    description,
    keywords: [b.name, b.subcategory, b.category, "De Kamp Amersfoort", `${b.name} Amersfoort`, ...(b.specialties ?? [])],
    alternates: { canonical: `/ondernemers/${b.id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: businessUrl(b.id),
      siteName: SITE.name,
      locale: "nl_NL",
      ...(localImage ? { images: [{ url: localImage, width: 1200, height: 630, alt: b.name }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(localImage ? { images: [localImage] } : {}) },
  };
}

export default async function BusinessDetailPage({ params }: Props) {
  const { id } = await params;
  const business = businesses.find((b) => b.id === id);
  if (!business || business.status === "closed") notFound();

  const related = relatedBusinesses(business, active);
  const faqs = buildFaqs(business);
  const cat = categoryByName(business.category);

  const jsonLd = graph(
    localBusinessSchema(business),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: cat.name, url: `/categorie/${categorySlug(business.category)}` },
      { name: business.name, url: `/ondernemers/${business.id}` },
    ]),
    ...(faqs.length ? [faqSchema(faqs)] : []),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <BusinessDetailClient business={business} related={related} districtBusinesses={active} faqs={faqs} />
    </>
  );
}

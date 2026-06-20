import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveBusinessesIn, getBusinessIn } from "@/lib/businessData";
import BusinessDetailClient from "@/components/BusinessDetailClient";
import GoogleReviews from "@/components/GoogleReviews";
import JsonLd from "@/components/JsonLd";
import { graph, localBusinessSchema, breadcrumbSchema } from "@/lib/schema";
import { relatedBusinesses } from "@/lib/related";
import { categorySlug, categoryByName } from "@/lib/categories";
import { abs, SITE } from "@/lib/site";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getActiveBusinessesIn("en")).map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await getBusinessIn(id, "en");
  if (!b) return {};

  const title = `${b.name} — ${b.subcategory} on De Kamp, Amersfoort`;
  const description = `${b.shortDescription} ${b.address}, Amersfoort.`;
  const localImage = b.imageUrl && b.imageUrl.startsWith("/") ? abs(b.imageUrl) : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/en/ondernemers/${b.id}`,
      languages: { nl: `/ondernemers/${b.id}`, en: `/en/ondernemers/${b.id}`, "x-default": `/ondernemers/${b.id}` },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: abs(`/en/ondernemers/${b.id}`),
      siteName: SITE.name,
      locale: "en_GB",
      ...(localImage ? { images: [{ url: localImage, width: 1200, height: 630, alt: b.name }] } : {}),
    },
  };
}

export default async function BusinessDetailEn({ params }: Props) {
  const { id } = await params;
  const business = await getBusinessIn(id, "en");
  if (!business || business.status === "closed") notFound();

  const active = await getActiveBusinessesIn("en");
  const related = relatedBusinesses(business, active);
  const cat = categoryByName(business.category);

  // No FAQs on EN (the generator is Dutch) — the business description itself is translated.
  const jsonLd = graph(
    localBusinessSchema(business),
    breadcrumbSchema([
      { name: "Home", url: "/en" },
      { name: cat.name, url: `/categorie/${categorySlug(business.category)}` },
      { name: business.name, url: `/en/ondernemers/${business.id}` },
    ]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <BusinessDetailClient business={business} related={related} districtBusinesses={active} faqs={[]} locale="en" />
      <GoogleReviews businessId={business.id} />
    </>
  );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { businesses } from "@/data/businesses";
import BusinessDetailClient from "@/components/BusinessDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const business = businesses.find((b) => b.id === id);

  if (!business) return {};

  return {
    title: `${business.name} | Ondernemers van de Kamp`,
    description: `${business.shortDescription} Ontdek het verhaal van ${business.name} op De Kamp in Amersfoort.`,
    openGraph: {
      title: `${business.name} | Ondernemers van de Kamp`,
      description: business.shortDescription,
      images: business.imageUrl ? [{ url: business.imageUrl }] : [],
    },
  };
}

export async function generateStaticParams() {
  return businesses.map((b) => ({
    id: b.id,
  }));
}

export default async function BusinessDetailPage({ params }: Props) {
  const { id } = await params;
  const business = businesses.find((b) => b.id === id);

  if (!business) notFound();

  return <BusinessDetailClient business={business} />;
}

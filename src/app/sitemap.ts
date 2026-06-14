import { MetadataRoute } from "next";
import { businesses } from "@/data/businesses";
import { ALL_CATEGORY_SLUGS } from "@/lib/categories";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const active = businesses.filter((b) => b.status !== "closed");

  const businessUrls = active.map((b) => ({
    url: `${base}/ondernemers/${b.id}`,
    lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: b.featured ? 0.9 : 0.8,
    images: b.imageUrl && b.imageUrl.startsWith("/") ? [`${base}${b.imageUrl}`] : undefined,
  }));

  const categoryUrls = ALL_CATEGORY_SLUGS.map((slug) => ({
    url: `${base}/categorie/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const staticPages = [
    { url: base, priority: 1 },
    { url: `${base}/kaart`, priority: 0.9 },
    { url: `${base}/agenda`, priority: 0.8 },
    { url: `${base}/cadeaukaart`, priority: 0.8 },
    { url: `${base}/loop-de-kamp`, priority: 0.7 },
    { url: `${base}/over-de-kamp`, priority: 0.6 },
    { url: `${base}/aanmelden`, priority: 0.5 },
  ].map((p) => ({ url: p.url, lastModified: new Date(), changeFrequency: "weekly" as const, priority: p.priority }));

  return [...staticPages, ...categoryUrls, ...businessUrls];
}

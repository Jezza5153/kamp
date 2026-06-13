import { MetadataRoute } from "next";
import { businesses } from "@/data/businesses";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ondernemersvandekamp.nl";

  const businessUrls = businesses.map((b) => ({
    url: `${baseUrl}/ondernemers/${b.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categorySlugs = [
    "eten-drinken",
    "koffie-lunch-zoet",
    "winkels-makers",
    "mode-sieraden",
    "interieur-kunst",
    "beauty-verzorging",
    "services-praktisch",
    "slapen",
  ];

  const categoryUrls = categorySlugs.map((slug) => ({
    url: `${baseUrl}/categorie/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const staticPages = [
    { url: baseUrl, priority: 1 },
    { url: `${baseUrl}/loop-de-kamp`, priority: 0.9 },
    { url: `${baseUrl}/over-de-kamp`, priority: 0.6 },
    { url: `${baseUrl}/aanmelden`, priority: 0.5 },
  ].map((page) => ({
    url: page.url,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: page.priority,
  }));

  return [...staticPages, ...businessUrls, ...categoryUrls];
}

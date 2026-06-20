/**
 * JSON-LD (schema.org) builders — the structured-data "entity contract" that
 * powers rich results and AI-answer-engine citations. Builders return plain
 * objects; render them with the <JsonLd> component.
 *
 * Rule: never emit data that isn't true on the page (no fabricated ratings).
 */

import type { Business } from "@/data/businesses";
import { SITE, abs, businessUrl } from "@/lib/site";
import { coordsFor, mapsUrl } from "@/lib/geo";
import { toOpeningHoursSpec } from "@/lib/hours";

type Json = Record<string, unknown>;

/**
 * schema.org priceRange wants a compact value — a "€€" band or a numeric range —
 * not prose. Pass clean bands/ranges through (normalising $→€ for this NL guide)
 * and drop anything else rather than emit an invalid property.
 */
function normalizePriceRange(pr?: string): string | undefined {
  if (!pr) return undefined;
  const t = pr.trim().replace(/\$/g, "€");
  if (/^€{1,4}(\s*[–-]\s*€{1,4})?$/.test(t)) return t; // band, e.g. "€€" or "€-€€€"
  if (/^€?\d[\d.,]*\s*[–-]\s*€?\d[\d.,]*$/.test(t)) return t; // numeric range, e.g. "€10 - €25"
  return undefined; // prose → omit so the LocalBusiness node stays valid
}

const ID = {
  organization: `${SITE.url}/#organization`,
  website: `${SITE.url}/#website`,
  district: `${SITE.url}/#district`,
};

/** Publisher/Organization for the guide. */
export function organizationSchema(): Json {
  const sameAs = [SITE.social.instagram, SITE.social.facebook, SITE.social.googleBusiness].filter(Boolean);
  const logo = SITE.logo ? abs(SITE.logo) : undefined;
  const node: Json = {
    "@type": "Organization",
    "@id": ID.organization,
    name: SITE.name,
    url: SITE.url,
    email: SITE.email,
    description: SITE.description,
    areaServed: { "@type": "City", name: SITE.city },
  };
  if (logo) {
    // logo unlocks the Organization rich result / knowledge-panel; image reuses it.
    node.logo = logo;
    node.image = logo;
  }
  if (SITE.phone) node.telephone = SITE.phone;
  if (sameAs.length) node.sameAs = sameAs;
  return node;
}

/** WebSite + SearchAction (sitelinks search box / query understanding). */
export function websiteSchema(): Json {
  return {
    "@type": "WebSite",
    "@id": ID.website,
    url: SITE.url,
    name: SITE.name,
    inLanguage: SITE.lang,
    publisher: { "@id": ID.organization },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * The district itself as a Place entity — helps AI engines understand "De Kamp"
 * as a real geographic/shopping entity in Amersfoort.
 */
export function districtPlaceSchema(businessCount: number): Json {
  return {
    "@type": ["Place", "TouristAttraction"],
    "@id": ID.district,
    name: "De Kamp, Amersfoort",
    alternateName: ["Winkelgebied De Kamp", "Kampkwartier"],
    description:
      "De Kamp is het onafhankelijke winkel- en horecagebied in de historische binnenstad van Amersfoort, met als hart de straat Kamp die begint bij de middeleeuwse Kamperbinnenpoort.",
    url: SITE.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      postalCode: SITE.postalArea,
      addressCountry: SITE.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE.geo.lat,
      longitude: SITE.geo.lng,
    },
    containsPlace: { "@type": "Place", name: `${businessCount} ondernemers` },
    isAccessibleForFree: true,
    // Bind "De Kamp" to its canonical entities so AI engines + Google resolve it
    // to the real shopping street in Amersfoort (Wikipedia + Wikidata Q19286435).
    sameAs: [
      "https://nl.wikipedia.org/wiki/Kamp_(Amersfoort)",
      "https://www.wikidata.org/wiki/Q19286435",
    ],
  };
}

/** Breadcrumb trail. items: [{name, url?}]; last item is the current page. */
export function breadcrumbSchema(items: { name: string; url?: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: abs(it.url) } : {}),
    })),
  };
}

/** Ordered list of businesses (category / overview pages). */
export function itemListSchema(name: string, businesses: Business[]): Json {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: businesses.length,
    itemListElement: businesses.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: businessUrl(b.id),
      name: b.name,
    })),
  };
}

/** FAQPage — only call this with genuinely useful Q&As shown on the page. */
export function faqSchema(qa: { question: string; answer: string }[]): Json {
  return {
    "@type": "FAQPage",
    mainEntity: qa.map((x) => ({
      "@type": "Question",
      name: x.question,
      acceptedAnswer: { "@type": "Answer", text: x.answer },
    })),
  };
}

/** Full LocalBusiness (or subtype) for a single business detail page. */
export function localBusinessSchema(business: Business): Json {
  const { lat, lng } = coordsFor({
    streetSegment: business.streetSegment,
    address: business.address,
    lat: business.lat,
    lng: business.lng,
  });
  const sameAs = [business.websiteUrl, business.instagramUrl, business.facebookUrl].filter(Boolean);
  const hoursSpec = toOpeningHoursSpec(business.hours);
  const image = business.imageUrl ? abs(business.imageUrl) : undefined;

  const node: Json = {
    "@type": business.schemaType ?? "LocalBusiness",
    "@id": `${businessUrl(business.id)}#business`,
    name: business.name,
    description: business.shortDescription,
    url: businessUrl(business.id),
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      postalCode: business.postalCode ?? SITE.postalArea,
      addressCountry: SITE.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
    hasMap: business.googleMapsUrl || mapsUrl(business.address, business.postalCode),
    areaServed: { "@type": "City", name: SITE.city },
    isPartOf: { "@id": ID.district },
  };

  if (business.phone) node.telephone = business.phone;
  if (business.email) node.email = business.email;
  if (image) node.image = image;
  if (sameAs.length) node.sameAs = sameAs;
  if (hoursSpec) node.openingHoursSpecification = hoursSpec;
  const priceRange = normalizePriceRange(business.priceRange);
  if (priceRange) node.priceRange = priceRange;
  if (business.servesCuisine) node.servesCuisine = business.servesCuisine;
  if (typeof business.acceptsReservations === "boolean")
    node.acceptsReservations = business.acceptsReservations;
  if (business.menuUrl) node.hasMenu = business.menuUrl;
  if (business.publicPersonName)
    node.founder = { "@type": "Person", name: business.publicPersonName };

  return node;
}

/** Wraps one or more schema nodes into a single @graph document. */
export function graph(...nodes: Json[]): Json {
  return { "@context": "https://schema.org", "@graph": nodes };
}

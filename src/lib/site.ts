/**
 * Central site configuration & canonical NAP (Name / Address / Phone) data.
 * One source of truth keeps NAP consistent across pages, metadata and schema —
 * a core local-SEO requirement.
 */

import { DISTRICT_CENTER } from "@/lib/geo";

export const SITE = {
  name: "Ondernemers van de Kamp",
  shortName: "De Kamp Amersfoort",
  tagline: "De Kamp leeft.",
  url: "https://ondernemersvandekamp.nl",
  locale: "nl_NL",
  lang: "nl",
  description:
    "Ontdek elke ondernemer op De Kamp in Amersfoort — restaurants, winkels, makers en verzorging in de historische binnenstad. Inclusief openingstijden, kaart en verhalen.",
  email: "info@ondernemersvandekamp.nl",
  city: "Amersfoort",
  region: "Utrecht",
  country: "NL",
  postalArea: "3811",
  geo: DISTRICT_CENTER,
  /**
   * Square brand logo for the Organization rich result / knowledge panel.
   * Drop a square PNG (≥112px, e.g. 512×512) at /public/images/logo.png and set
   * this to "/images/logo.png". Left empty → no logo node is emitted.
   */
  logo: "",
  /** Public phone for the guide (NAP). Fill when a public number exists. */
  phone: "",
  /** Public social / Google Business profiles for the guide (sameAs). Fill when live. */
  social: {
    instagram: "",
    facebook: "",
    googleBusiness: "",
  },
} as const;

/** The street segments that make up the curated district. */
export const DISTRICT_STREETS = [
  "Kamp",
  "Achter de Kamp",
  "Grote Sint Jansstraat",
  "Zuidsingel",
  "Weverssingel",
] as const;

/** Absolute URL helper (composes with SITE.url). */
export function abs(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Canonical URL for a business detail page. */
export function businessUrl(id: string): string {
  return `${SITE.url}/ondernemers/${id}`;
}

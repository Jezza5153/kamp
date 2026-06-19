/**
 * Central category registry — single source of truth for slugs, copy and icons.
 * (Previously the slug map lived only inside the category page and omitted
 * "Keten / anker", so those businesses had no landing page.)
 */

import type { BusinessCategory } from "@/data/businesses";

export interface CategoryMeta {
  name: BusinessCategory;
  slug: string;
  /** lucide-react icon name */
  icon: string;
  /** short Dutch blurb for the landing page intro */
  blurb: string;
  /** very short label for chips */
  short: string;
  /** English chip label (i18n) */
  shortEn: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    name: "Eten & drinken",
    slug: "eten-drinken",
    icon: "UtensilsCrossed",
    short: "Eten & drinken",
    shortEn: "Food & drink",
    blurb:
      "Van Ethiopisch tot Napolitaans: De Kamp is het meest wereldse stukje horeca van Amersfoort. Restaurants, afhaal en wereldkeukens op loopafstand van de Kamperbinnenpoort.",
  },
  {
    name: "Koffie, lunch & zoet",
    slug: "koffie-lunch-zoet",
    icon: "Coffee",
    short: "Koffie & lunch",
    shortEn: "Coffee & lunch",
    blurb:
      "Verse koffie, ambachtelijk brood, taart en high tea. De adresjes waar je de dag begint of even neerstrijkt tussen het winkelen door.",
  },
  {
    name: "Winkels & makers",
    slug: "winkels-makers",
    icon: "Store",
    short: "Winkels & makers",
    shortEn: "Shops & makers",
    blurb:
      "Onafhankelijke winkels en makers met een eigen verhaal — wijn, vintage, stoffen, ateliers en cadeauwinkels die je nergens anders vindt.",
  },
  {
    name: "Mode & sieraden",
    slug: "mode-sieraden",
    icon: "Gem",
    short: "Mode & sieraden",
    shortEn: "Fashion & jewellery",
    blurb:
      "Maatkleding, duurzame mode, goudsmeden en juweliers. Persoonlijk advies en vakmanschap in plaats van de grijze winkelketen.",
  },
  {
    name: "Interieur & kunst",
    slug: "interieur-kunst",
    icon: "Frame",
    short: "Interieur & kunst",
    shortEn: "Interior & art",
    blurb:
      "Interieurstylisten, lijstenmakers, glas-in-lood, tapijten en galerieën. De Kamp is al generaties lang het woon- en kunsthart van de binnenstad.",
  },
  {
    name: "Beauty & verzorging",
    slug: "beauty-verzorging",
    icon: "Scissors",
    short: "Beauty",
    shortEn: "Beauty",
    blurb:
      "Kappers, beautysalons en verzorging met aandacht. Vertrouwde adressen waar je even helemaal bijkomt.",
  },
  {
    name: "Services & praktisch",
    slug: "services-praktisch",
    icon: "Wrench",
    short: "Services",
    shortEn: "Services",
    blurb:
      "Opticiens, audiciens, schoenmakers, reparatie en makelaars. Het praktische vakmanschap dat een echte buurt draaiende houdt.",
  },
  {
    name: "Slapen",
    slug: "slapen",
    icon: "BedDouble",
    short: "Slapen",
    shortEn: "Stay",
    blurb:
      "Blijf slapen in hartje Amersfoort. Stijlvol overnachten op een steenworp van de historische binnenstad.",
  },
  {
    name: "Keten / anker",
    slug: "keten-anker",
    icon: "Landmark",
    short: "Bekende namen",
    shortEn: "Big names",
    blurb:
      "De vertrouwde ankerzaken en bekende namen die voor reuring en aanloop zorgen op De Kamp.",
  },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
const BY_NAME = new Map(CATEGORIES.map((c) => [c.name, c]));

export function categoryBySlug(slug: string): CategoryMeta | undefined {
  return BY_SLUG.get(slug);
}
export function categoryByName(name: BusinessCategory): CategoryMeta {
  return BY_NAME.get(name) ?? CATEGORIES[2];
}
export function categorySlug(name: BusinessCategory): string {
  return categoryByName(name).slug;
}
export const ALL_CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

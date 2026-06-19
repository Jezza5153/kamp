import type { Locale } from "@/lib/i18n";

/** UI string dictionary (chrome). Business CONTENT is translated via DeepL (i18n.ts);
 *  this covers the fixed interface labels so /en isn't half-Dutch. */
const D: Record<string, { nl: string; en: string }> = {
  // Nav
  "nav.businesses": { nl: "Ondernemers", en: "Businesses" },
  "nav.map": { nl: "Kaart", en: "Map" },
  "nav.walk": { nl: "Wandel", en: "Walk" },
  "nav.events": { nl: "Agenda", en: "Events" },
  "nav.stories": { nl: "Verhalen", en: "Stories" },
  "nav.giftcard": { nl: "Cadeaukaart", en: "Gift card" },
  "nav.about": { nl: "Over", en: "About" },
  "nav.register": { nl: "Aanmelden", en: "Add your shop" },
  "nav.registerLong": { nl: "Zit jouw zaak er nog niet bij?", en: "Is your shop not listed yet?" },

  // Footer
  "footer.tagline": {
    nl: "Een levend straatportret van de meest karakteristieke ondernemersas in Amersfoort.",
    en: "A living portrait of Amersfoort's most characteristic independent shopping street.",
  },
  "footer.nav": { nl: "Navigatie", en: "Navigation" },
  "footer.area": { nl: "Het Gebied", en: "The area" },
  "footer.stayUpdated": { nl: "Blijf op de hoogte", en: "Stay in the loop" },
  "footer.newsletterText": {
    nl: "Ontvang updates over nieuwe ondernemers en events op De Kamp.",
    en: "Get updates on new businesses and events on De Kamp.",
  },
  "footer.manage": { nl: "Beheer je zaak", en: "Manage your shop" },
  "footer.privacy": { nl: "Privacy & cookies", en: "Privacy & cookies" },
  "footer.practical": { nl: "Praktische info", en: "Practical info" },
  "brand.leeft": { nl: "leeft.", en: "lives." },

  // Explorer
  "explorer.searchPlaceholder": { nl: "Zoek zaak, product of straat…", en: "Search shop, product or street…" },
  "explorer.searchAria": { nl: "Zoek ondernemer", en: "Search business" },
  "explorer.all": { nl: "Alles", en: "All" },
  "explorer.perfectFor": { nl: "Perfect voor", en: "Perfect for" },
  "explorer.openNow": { nl: "Nu open", en: "Open now" },
  "explorer.hideMap": { nl: "Verberg kaart", en: "Hide map" },
  "explorer.showMap": { nl: "Toon kaart", en: "Show map" },
  "explorer.clear": { nl: "Wis filters", en: "Clear filters" },
  "explorer.results": { nl: "ondernemers", en: "businesses" },
  "explorer.resultOne": { nl: "ondernemer", en: "business" },
  "explorer.mapHint": {
    nl: "Elke stip is een ondernemer · beweeg eroverheen voor details · klik om de zaak te bekijken",
    en: "Each dot is a business · hover for details · click to view the shop",
  },
  "explorer.nothingFound": { nl: "Niets gevonden", en: "Nothing found" },
  "explorer.nothingHint": {
    nl: "Probeer een andere categorie of zoekterm — of zet “Nu open” uit.",
    en: "Try another category or search term — or turn off “Open now”.",
  },
  "explorer.clearAll": { nl: "Alle filters wissen", en: "Clear all filters" },

  // Business detail
  "detail.story": { nl: "Het verhaal", en: "The story" },
  "detail.specialties": { nl: "Specialiteiten", en: "Specialties" },
  "detail.perfectFor": { nl: "Perfect voor", en: "Perfect for" },
  "detail.goodToKnow": { nl: "Goed om te weten", en: "Good to know" },
  "detail.theFace": { nl: "Het gezicht", en: "The face" },
  "detail.faq": { nl: "Veelgestelde vragen", en: "Frequently asked" },
  "detail.locationContact": { nl: "Locatie & contact", en: "Location & contact" },
  "detail.address": { nl: "Adres", en: "Address" },
  "detail.phone": { nl: "Telefoon", en: "Phone" },
  "detail.email": { nl: "E-mail", en: "Email" },
  "detail.walkMin": { nl: "min. lopen vanaf de Kamperbinnenpoort", en: "min walk from the Kamperbinnenpoort gate" },
  "detail.route": { nl: "Route via Google Maps", en: "Directions on Google Maps" },
  "detail.reserve": { nl: "Reserveren", en: "Book" },
  "detail.order": { nl: "Bestellen", en: "Order" },
  "detail.menu": { nl: "Menukaart", en: "Menu" },
  "detail.website": { nl: "Website", en: "Website" },
  "detail.hours": { nl: "Openingstijden", en: "Opening hours" },
  "detail.nearby": { nl: "In de buurt", en: "Nearby" },
  "detail.alsoOnKamp": { nl: "Ook op De Kamp", en: "Also on De Kamp" },
  "detail.allBusinesses": { nl: "Alle ondernemers →", en: "All businesses →" },
  "detail.reviewsOnGoogle": { nl: "Reviews op Google", en: "Reviews on Google" },
  "detail.areYouTitle": { nl: "Ben jij van deze zaak?", en: "Do you run this business?" },
  "detail.ownerCta": {
    nl: "Vul je verhaal, foto's en openingstijden aan — gratis.",
    en: "Add your story, photos and opening hours — free.",
  },
  "detail.manageThis": { nl: "Beheer deze zaak", en: "Manage this business" },
};

export function t(locale: Locale, key: string): string {
  const e = D[key];
  return e ? e[locale] ?? e.nl : key;
}

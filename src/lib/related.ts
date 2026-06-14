import type { Business } from "@/data/businesses";
import { formatWeek } from "@/lib/hours";
import { coordsFor, walkMinutesFromGate } from "@/lib/geo";

export interface FaqItem {
  question: string;
  answer: string;
}

/** Active (non-closed) businesses, same-category & nearby first. */
export function relatedBusinesses(business: Business, all: Business[], count = 6): Business[] {
  return all
    .filter((b) => b.id !== business.id && b.status !== "closed")
    .map((b) => ({
      b,
      score: (b.category === business.category ? 0 : 1000) + Math.abs(b.sortOrder - business.sortOrder),
    }))
    .sort((x, y) => x.score - y.score)
    .slice(0, count)
    .map((x) => x.b);
}

function domain(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Generate genuine, self-contained Q&As (also emitted as FAQPage schema). */
export function buildFaqs(b: Business): FaqItem[] {
  const faqs: FaqItem[] = [];
  const walk = walkMinutesFromGate(coordsFor({ streetSegment: b.streetSegment, address: b.address, lat: b.lat, lng: b.lng }));

  if (b.hours && b.hours.length) {
    const open = formatWeek(b.hours).filter((l) => l.value !== "Gesloten");
    if (open.length) {
      faqs.push({
        question: `Wat zijn de openingstijden van ${b.name}?`,
        answer: `${b.name} is geopend op: ${open.map((l) => `${l.label} ${l.value}`).join("; ")}.${
          b.hoursNote ? ` ${b.hoursNote}` : ""
        }`,
      });
    }
  }

  faqs.push({
    question: `Waar vind ik ${b.name} in Amersfoort?`,
    answer: `${b.name} ligt aan ${b.address}${b.postalCode ? `, ${b.postalCode}` : ""} in winkelgebied De Kamp, in de historische binnenstad van Amersfoort — ongeveer ${walk} minuten lopen vanaf de Kamperbinnenpoort.`,
  });

  faqs.push({
    question: `Wat kun je verwachten bij ${b.name}?`,
    answer: `${b.shortDescription}${b.specialties && b.specialties.length ? ` Bekend om: ${b.specialties.slice(0, 4).join(", ")}.` : ""}`,
  });

  if (b.websiteUrl) {
    faqs.push({
      question: `Heeft ${b.name} een website?`,
      answer: `Ja. Bekijk ${domain(b.websiteUrl)} voor het actuele aanbod${b.phone ? ` of bel ${b.phone}` : ""}.`,
    });
  }

  return faqs.slice(0, 4);
}

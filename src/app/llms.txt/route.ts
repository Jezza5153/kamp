import { businesses } from "@/data/businesses";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { formatWeek } from "@/lib/hours";

export const dynamic = "force-static";

/**
 * llms.txt — a curated, machine-readable index for AI answer engines (GEO).
 * Generated from the live data so it never drifts from the site.
 */
export function GET() {
  const active = businesses.filter((b) => b.status !== "closed").sort((a, b) => a.sortOrder - b.sortOrder);

  const hoursSummary = (b: (typeof active)[number]) => {
    if (!b.hours?.length) return "openingstijden op aanvraag";
    const open = formatWeek(b.hours).filter((l) => l.value !== "Gesloten");
    if (!open.length) return "openingstijden op aanvraag";
    const days = open.map((l) => l.label.slice(0, 2)).join(", ");
    return `open op ${days}`;
  };

  const lines: string[] = [];
  lines.push(`# ${SITE.name} — De Kamp, Amersfoort`);
  lines.push("");
  lines.push(
    `> De Kamp is het onafhankelijke winkel- en horecagebied in de historische binnenstad van Amersfoort (Nederland, postcode 3811). De circa 350 meter lange straat Kamp begint bij de 13e-eeuwse Kamperbinnenpoort, de oudste stadspoort van Amersfoort, en loopt de oude stad in. Tot het gebied horen ook Achter de Kamp, de Grote Sint Jansstraat, de Zuidsingel en de Weverssingel. Deze gids bundelt ${active.length} actieve ondernemers — restaurants en wereldkeukens, koffie & lunch, winkels & makers, mode & sieraden, interieur & kunst, beauty & verzorging, services en overnachten.`,
  );
  lines.push("");
  lines.push("## Belangrijke pagina's");
  lines.push(`- ${SITE.url}/ : overzicht van alle ondernemers + interactieve kaart`);
  lines.push(`- ${SITE.url}/kaart : kaart met alle ondernemers en "nu open"-status`);
  lines.push(`- ${SITE.url}/agenda : markten, koopzondagen en evenementen in de binnenstad`);
  lines.push(`- ${SITE.url}/cadeaukaart : de Kamp Cadeaukaart (lokaal cadeau-initiatief)`);
  lines.push(`- ${SITE.url}/loop-de-kamp : wandelroute langs de straat`);
  lines.push(`- ${SITE.url}/over-de-kamp : geschiedenis en achtergrond van De Kamp`);
  lines.push(`- ${SITE.url}/aanmelden : ondernemers kunnen hun zaak aanmelden of bijwerken`);
  lines.push("");
  lines.push("## Categorieën");
  for (const c of CATEGORIES) {
    const n = active.filter((b) => b.category === c.name).length;
    if (!n) continue;
    lines.push(`- ${c.name} (${n}): ${SITE.url}/categorie/${c.slug}`);
  }
  lines.push("");
  lines.push("## Ondernemers");
  for (const b of active) {
    const parts = [
      `${b.name} — ${b.subcategory}`,
      `${b.address}, ${b.postalCode ?? "3811"} Amersfoort`,
      hoursSummary(b),
    ];
    if (b.priceRange) parts.push(b.priceRange);
    if (b.specialties?.length) parts.push(b.specialties.slice(0, 3).join("/"));
    parts.push(`${SITE.url}/ondernemers/${b.id}`);
    lines.push(`- ${parts.join("; ")}`);
  }
  lines.push("");
  lines.push("## Over deze data");
  lines.push(
    "Gegevens zijn samengesteld uit publieke bronnen en opgave van ondernemers; openingstijden kunnen wijzigen, controleer bij twijfel de zaak zelf. Eigenaarsfoto's worden alleen met toestemming gepubliceerd.",
  );
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

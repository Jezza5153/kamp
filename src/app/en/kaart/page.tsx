import { Metadata } from "next";
import { getActiveBusinessesIn } from "@/lib/businessData";
import BusinessExplorer from "@/components/BusinessExplorer";
import JsonLd from "@/components/JsonLd";
import { graph, districtPlaceSchema, itemListSchema, breadcrumbSchema } from "@/lib/schema";
import { abs } from "@/lib/site";

// ISR — see DEPLOY_CLOUDFLARE.md (cache freshness): refresh approved D1 edits.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Map of De Kamp — every business at a glance",
  description:
    "See every business on De Kamp in Amersfoort on the interactive map. Filter by category, check who's open now and plan your route past the shops, restaurants and makers.",
  alternates: { canonical: "/en/kaart", languages: { nl: "/kaart", en: "/en/kaart" } },
  openGraph: { title: "Map of De Kamp, Amersfoort", description: "Every business on De Kamp on one interactive map.", url: abs("/en/kaart"), locale: "en_GB" },
};

export default async function KaartPage() {
  const active = await getActiveBusinessesIn("en");
  return (
    <div className="min-h-screen bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Map</p>
        <h1 className="font-serif text-4xl font-black leading-tight text-deep-green sm:text-6xl">
          De Kamp <span className="text-amber-600">on the map</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-warm-brown/70">
          Every business along the street, from the Kamperbinnenpoort to the canals. Hover over a dot to see the place,
          filter by category or search for what you need.
        </p>

        <div className="mt-10">
          <BusinessExplorer businesses={active} locale="en" />
        </div>
      </div>

      <JsonLd
        data={graph(
          districtPlaceSchema(active.length),
          itemListSchema("Businesses on the map of De Kamp", active),
          breadcrumbSchema([
            { name: "Home", url: "/en" },
            { name: "Map", url: "/en/kaart" },
          ]),
        )}
      />
    </div>
  );
}

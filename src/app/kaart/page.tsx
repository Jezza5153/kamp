import { Metadata } from "next";
import { getActiveBusinesses } from "@/lib/businessData";
import BusinessExplorer from "@/components/BusinessExplorer";
import JsonLd from "@/components/JsonLd";
import { graph, districtPlaceSchema, itemListSchema, breadcrumbSchema } from "@/lib/schema";

// ISR — see DEPLOY_CLOUDFLARE.md (cache freshness): refresh approved D1 edits.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kaart van De Kamp — alle ondernemers in beeld",
  description:
    "Bekijk alle ondernemers op De Kamp in Amersfoort op de interactieve kaart. Filter op categorie, zie wie er nu open is en plan je route langs winkels, restaurants en makers.",
  alternates: { canonical: "/kaart", languages: { nl: "/kaart", en: "/en/kaart", "x-default": "/kaart" } },
  openGraph: { title: "Kaart van De Kamp, Amersfoort", description: "Alle ondernemers op De Kamp op één interactieve kaart.", url: "/kaart" },
};

export default async function KaartPage() {
  const active = await getActiveBusinesses();
  return (
    <div className="min-h-screen bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Plattegrond</p>
        <h1 className="font-serif text-4xl font-black leading-tight text-deep-green sm:text-6xl">
          De Kamp <span className="text-amber-600">in kaart</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-warm-brown/70">
          Elke ondernemer langs de straat, van de Kamperbinnenpoort tot de singels. Beweeg over een stip voor de zaak,
          filter op categorie of zoek op wat je nodig hebt.
        </p>

        <div className="mt-10">
          <BusinessExplorer businesses={active} />
        </div>
      </div>

      <JsonLd
        data={graph(
          districtPlaceSchema(active.length),
          itemListSchema("Ondernemers op de kaart van De Kamp", active),
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Kaart", url: "/kaart" },
          ]),
        )}
      />
    </div>
  );
}

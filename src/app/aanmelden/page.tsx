import Link from "next/link";
import AanmeldenForm from "@/components/AanmeldenForm";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Aanmelden — word onderdeel van Ondernemers van de Kamp",
  description:
    "Ben jij een ondernemer op De Kamp in Amersfoort? Meld je zaak gratis aan, deel je verhaal en foto's en word beter vindbaar — met openingstijden, kaart en een eigen pagina.",
  alternates: { canonical: "/aanmelden" },
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Gratis aanmelden</p>
          <h1 className="font-serif text-4xl font-black text-deep-green sm:text-6xl">Meld je zaak aan</h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl font-medium leading-relaxed text-warm-brown/80">
            Help ons de gids van De Kamp completer en persoonlijker te maken. Deel je verhaal, je foto&apos;s en je
            openingstijden — en krijg je eigen vindbare pagina.
          </p>
        </div>

        <AanmeldenForm />

        <p className="mt-10 text-center text-sm text-warm-brown/60">
          Deze gids is een initiatief voor en door ondernemers. Andere vragen?{" "}
          <a href={`mailto:${SITE.email}`} className="font-bold text-amber-ink hover:underline">{SITE.email}</a>
        </p>

        <p className="mt-2 text-center text-xs text-warm-brown/45">
          <Link href="/over-de-kamp" className="hover:underline">Lees meer over De Kamp</Link>
        </p>
      </div>

      <JsonLd data={graph(breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Aanmelden", url: "/aanmelden" }]))} />
    </div>
  );
}

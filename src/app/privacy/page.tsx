import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Privacy & cookies — Ondernemers van de Kamp",
  description:
    "Hoe Ondernemers van de Kamp omgaat met je gegevens: welke gegevens we verwerken, cookies, verwerkers en je rechten onder de AVG.",
  alternates: { canonical: "/privacy" },
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-serif text-2xl font-black text-deep-green">{children}</h2>;
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Privacy &amp; cookies</p>
      <h1 className="font-serif text-4xl font-black text-deep-green sm:text-5xl">Privacyverklaring</h1>
      <p className="mt-4 text-warm-brown/80">
        Ondernemers van de Kamp is een gids voor het winkel- en horecagebied De Kamp in Amersfoort. We gaan zorgvuldig
        met je gegevens om en verwerken niet meer dan nodig.
      </p>

      <div className="mt-2 space-y-3 text-warm-brown/85">
        <H2>Welke gegevens we verwerken</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Aanmeldformulier ondernemers:</strong> naam zaak, contactpersoon, e-mail, telefoon, adres en je
            verhaal — op basis van je toestemming, om je vermelding te maken en contact op te nemen.
          </li>
          <li>
            <strong>Nieuwsbrief:</strong> je e-mailadres, met dubbele opt-in (je bevestigt via een link). Je kunt je
            altijd uitschrijven via de link onderaan elke mail.
          </li>
          <li>
            <strong>Beheeraccounts:</strong> e-mailadres en sessiegegevens van ondernemers/beheerders die hun vermelding
            bijwerken (inloggen via een eenmalige link — geen wachtwoorden).
          </li>
          <li>
            <strong>Foto&apos;s:</strong> alleen geplaatst na akkoord van de ondernemer.
          </li>
          <li>
            <strong>Statistieken:</strong> we meten gebruik <strong>cookieloos en geanonimiseerd</strong> — er wordt geen
            IP-adres of herleidbaar profiel opgeslagen (een dagelijks wisselende, onomkeerbare hash).
          </li>
        </ul>

        <H2>Cookies</H2>
        <p>
          We gebruiken <strong>geen tracking- of advertentiecookies</strong>. De enige cookie is een technische
          sessie-cookie die alleen wordt gezet als je inlogt om je zaak te beheren. Daarvoor is geen toestemming nodig.
        </p>

        <H2>Verwerkers</H2>
        <p>We schakelen een beperkt aantal dienstverleners in, met een verwerkersovereenkomst:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Cloudflare</strong> — hosting, database en opslag (EU-regio).</li>
          <li><strong>Resend</strong> — verzending van e-mails (inloglinks, nieuwsbrief); een Amerikaanse verwerker onder passende waarborgen (SCC/DPF).</li>
          <li><strong>Google</strong> — alleen als reviews van een zaak worden getoond (Places API); reviews worden niet opgeslagen.</li>
          <li><strong>Mollie</strong> — betalingen voor de cadeaukaart (zodra die live is), EU-betaaldienst.</li>
        </ul>

        <H2>Bewaartermijnen</H2>
        <p>
          We bewaren gegevens niet langer dan nodig. Niet-bevestigde aanmeldingen en nieuwsbrief-inschrijvingen verwijderen
          we automatisch na 30 dagen; statistieken na ongeveer 35 dagen. Financiële gegevens van cadeaukaarten bewaren we
          conform de wettelijke fiscale bewaarplicht.
        </p>

        <H2>Je rechten</H2>
        <p>
          Je hebt recht op inzage, correctie en verwijdering van je gegevens. Stuur een verzoek naar{" "}
          <a href={`mailto:${SITE.email}`} className="font-bold text-amber-ink hover:underline">
            {SITE.email}
          </a>
          . Ben je het ergens niet mee eens, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.
        </p>

        <H2>Contact</H2>
        <p>
          Vragen over privacy? Mail{" "}
          <a href={`mailto:${SITE.email}`} className="font-bold text-amber-ink hover:underline">
            {SITE.email}
          </a>
          .
        </p>
      </div>

      <p className="mt-12 text-center text-xs text-warm-brown/50">
        <Link href="/" className="hover:underline">
          ← Terug naar De Kamp
        </Link>
      </p>
    </main>
  );
}

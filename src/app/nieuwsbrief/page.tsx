import Link from "next/link";
import { CheckCircle2, MailCheck, XCircle } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return {
    title: "Nieuwsbrief — Ondernemers van de Kamp",
    description: "Schrijf je in voor updates over nieuwe ondernemers en evenementen op De Kamp in Amersfoort.",
    alternates: { canonical: "/nieuwsbrief" },
    // The transactional ?status= variants are thin/duplicate — keep them out of the index.
    ...(status ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-16">
      <div className="rounded-[var(--radius-lg)] bg-paper p-8 shadow-[var(--shadow-card)] sm:p-10">
        {status === "bevestigd" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
            <h1 className="font-serif text-2xl font-black text-deep-green">Je bent ingeschreven</h1>
            <p className="mt-2 text-warm-brown/80">Bedankt! Je ontvangt voortaan de nieuwsbrief van De Kamp.</p>
          </div>
        ) : status === "uitgeschreven" ? (
          <div className="text-center">
            <MailCheck className="mx-auto mb-4 h-12 w-12 text-amber-ink" />
            <h1 className="font-serif text-2xl font-black text-deep-green">Uitgeschreven</h1>
            <p className="mt-2 text-warm-brown/80">Je ontvangt geen nieuwsbrief meer. Jammer dat je gaat!</p>
          </div>
        ) : status === "mislukt" ? (
          <div className="text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-clay" />
            <h1 className="font-serif text-2xl font-black text-deep-green">Link verlopen of ongeldig</h1>
            <p className="mt-2 text-warm-brown/80">Schrijf je hieronder opnieuw in.</p>
            <div className="mt-6 text-left">
              <NewsletterSignup />
            </div>
          </div>
        ) : (
          <div>
            <h1 className="font-serif text-3xl font-black text-deep-green">Nieuwsbrief van De Kamp</h1>
            <p className="mt-2 text-warm-brown/80">
              Updates over nieuwe ondernemers, verhalen en evenementen op De Kamp — een paar keer per jaar, nooit spam.
            </p>
            <div className="mt-6">
              <NewsletterSignup />
            </div>
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-warm-brown/50">
        <Link href="/" className="hover:underline">
          ← Terug naar De Kamp
        </Link>
      </p>
    </main>
  );
}

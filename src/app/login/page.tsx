import { redirect } from "next/navigation";
import { requestMagicLink } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Inloggen — Ondernemers van de Kamp",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  async function send(formData: FormData) {
    "use server";
    await requestMagicLink(String(formData.get("email") ?? ""));
    redirect("/login?sent=1");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl bg-paper p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold text-deep-green">Beheer je vermelding</h1>
        <p className="mt-2 text-sm text-warm-brown">
          Log in om de tekst, openingstijden en foto&apos;s van jouw zaak op de Kamp bij te
          werken. Nog geen toegang?{" "}
          <a className="font-medium text-amber-ink underline" href="mailto:info@ondernemersvandekamp.nl">
            Mail ons
          </a>{" "}
          en we koppelen je login aan je zaak.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-sage/60 p-4 text-sm text-deep-green">
            Check je mailbox — we hebben een inloglink gestuurd. De link is 15 minuten geldig.
          </div>
        ) : (
          <form action={send} className="mt-6 space-y-3">
            {error ? (
              <p className="rounded-lg bg-clay/15 px-3 py-2 text-sm text-clay">
                Die link is verlopen of al gebruikt. Vraag een nieuwe aan.
              </p>
            ) : null}
            <label className="block text-sm font-medium text-foreground" htmlFor="email">
              E-mailadres
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="jij@jouwzaak.nl"
              className="w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-deep-green px-4 py-3 font-medium text-background transition hover:opacity-90"
            >
              Stuur inloglink
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

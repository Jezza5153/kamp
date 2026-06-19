import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instellingen", robots: { index: false } };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { saved } = await searchParams;
  const s = await getSettings();
  const hasKey = Boolean(s.resend_api_key);
  const hasMapsKey = Boolean(s.google_maps_api_key);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Instellingen</h1>
        <div className="flex gap-4 text-sm text-warm-brown">
          <Link href="/admin/google" className="underline">
            Google reviews
          </Link>
          <Link href="/admin" className="underline">
            ← Moderatie
          </Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-warm-brown">
        E-mail (Resend), beheerders en de site-URL. Wijzigingen werken direct, zonder opnieuw te
        deployen.
      </p>

      {saved ? (
        <div className="mt-5 rounded-xl bg-sage/60 p-4 text-sm text-deep-green">Opgeslagen.</div>
      ) : null}

      <form action={saveSettingsAction} className="mt-6 space-y-6">
        <section className="space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-semibold text-deep-green">E-mail (Resend)</h2>
          <p className="text-xs text-warm-brown">
            Maak een account op resend.com, verifieer je domein (DNS) en maak een API-sleutel.
            Zolang er geen sleutel staat, worden inloglinks alleen in de serverlogs getoond.
          </p>
          <Field
            name="resend_from"
            label="Afzender"
            placeholder="Ondernemers van de Kamp <login@jouwdomein.nl>"
            defaultValue={s.resend_from ?? ""}
          />
          <div>
            <label htmlFor="resend_api_key" className="block text-sm font-medium text-foreground">
              Resend API-sleutel{" "}
              {hasKey ? (
                <span className="text-xs font-normal text-amber-ink">· er is een sleutel ingesteld</span>
              ) : (
                <span className="text-xs font-normal text-clay">· nog niet ingesteld</span>
              )}
            </label>
            <input
              id="resend_api_key"
              name="resend_api_key"
              type="password"
              autoComplete="off"
              placeholder={hasKey ? "•••••••• (laat leeg om te behouden)" : "re_..."}
              className="mt-1 w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-semibold text-deep-green">Toegang & site</h2>
          <Field
            name="admin_emails"
            label="Beheerders (komma-gescheiden e-mails)"
            placeholder="info@jouwdomein.nl, collega@jouwdomein.nl"
            defaultValue={s.admin_emails ?? ""}
            help="Deze adressen krijgen beheerrechten. (De eerste login op een lege database wordt sowieso beheerder.)"
          />
          <Field
            name="site_url"
            label="Site-URL"
            placeholder="https://ondernemers-van-de-kamp.workers.dev"
            defaultValue={s.site_url ?? ""}
            help="Basis-URL voor de inloglinks in e-mails. Vul je definitieve domein in zodra je dat hebt."
          />
        </section>

        <section className="space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-semibold text-deep-green">Google reviews</h2>
          <p className="text-xs text-warm-brown">
            Maak in Google Cloud een Maps-sleutel met <strong>Places API (New)</strong> ingeschakeld. Stel
            daarna per zaak een{" "}
            <Link href="/admin/google" className="text-amber-ink underline">
              place_id
            </Link>{" "}
            in om de reviews te tonen.
          </p>
          <div>
            <label htmlFor="google_maps_api_key" className="block text-sm font-medium text-foreground">
              Google Maps API-sleutel{" "}
              {hasMapsKey ? (
                <span className="text-xs font-normal text-amber-ink">· er is een sleutel ingesteld</span>
              ) : (
                <span className="text-xs font-normal text-clay">· nog niet ingesteld</span>
              )}
            </label>
            <input
              id="google_maps_api_key"
              name="google_maps_api_key"
              type="password"
              autoComplete="off"
              placeholder={hasMapsKey ? "•••••••• (laat leeg om te behouden)" : "AIza..."}
              className="mt-1 w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green"
            />
          </div>
        </section>

        <button
          type="submit"
          className="rounded-xl bg-deep-green px-5 py-3 font-medium text-background transition hover:opacity-90"
        >
          Opslaan
        </button>
      </form>
    </main>
  );
}

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  help,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  help?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green"
      />
      {help ? <p className="mt-1 text-xs text-warm-brown">{help}</p> : null}
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canEdit, requireUser } from "@/lib/auth";
import { allBusinessesSeed } from "@/lib/businessData";
import { EDITABLE_FIELDS, FIELD_LABELS, pendingFieldsFor } from "@/lib/overrides";
import { currentMediaFor } from "@/lib/media";
import { submitEdit, uploadPhoto, submitEventAction } from "../actions";
import { EVENT_CATEGORIES } from "@/lib/events";
import PhotoUpload from "./PhotoUpload";

const PHOTO_MSG: Record<string, string> = {
  pending: "Foto geüpload — staat in de wachtrij voor goedkeuring.",
  missing: "Geen bestand gekozen.",
  too_large: "Bestand te groot (max 5 MB).",
  bad_type: "Ongeldig bestand — gebruik JPG, PNG, WebP of AVIF.",
  empty: "Het bestand was leeg.",
  unavailable: "Uploaden kan nu niet — probeer het later opnieuw.",
  db: "Er ging iets mis bij het opslaan — probeer opnieuw.",
};

export const dynamic = "force-dynamic";
export const metadata = { title: "Vermelding bewerken", robots: { index: false } };

const MULTILINE = new Set(["shortDescription", "longDescription", "hoursNote"]);

export default async function EditBusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; photo?: string; event?: string }>;
}) {
  const { id } = await params;
  const { saved, photo, event } = await searchParams;
  const user = await requireUser();
  if (!(await canEdit(user, id))) redirect("/beheer");

  const biz = allBusinessesSeed.find((b) => b.id === id);
  if (!biz) notFound();

  // Pre-fill with the owner's in-flight pending edit, else the live value.
  const pending = await pendingFieldsFor(id);
  const value = (f: string): string =>
    pending[f] ?? (biz as unknown as Record<string, unknown>)[f]?.toString() ?? "";

  const media = await currentMediaFor(id);
  const currentPhotoUrl = media ? `/media/${media.r2_key}` : biz.imageUrl ?? null;

  const action = submitEdit.bind(null, id);
  const photoAction = uploadPhoto.bind(null, id);
  const eventAction = submitEventAction.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/beheer" className="text-sm text-warm-brown underline">
        ← Mijn vermeldingen
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-deep-green">{biz.name}</h1>
      <p className="mt-1 text-sm text-warm-brown">
        Wijzigingen worden ter controle ingediend en verschijnen na goedkeuring op de site.
      </p>

      {saved ? (
        <div className="mt-5 rounded-xl bg-sage/60 p-4 text-sm text-deep-green">
          Bedankt! Je wijziging is ingediend en wacht op goedkeuring.
        </div>
      ) : null}
      {Object.keys(pending).length > 0 && !saved ? (
        <div className="mt-5 rounded-xl bg-gold/20 p-4 text-sm text-warm-brown">
          Je hebt nog een wijziging in behandeling — onderstaande velden tonen die voorgestelde
          tekst.
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-brown">Foto</h2>
        {photo ? (
          <div
            className={`mt-2 rounded-xl p-3 text-sm ${
              photo === "pending" ? "bg-sage/60 text-deep-green" : "bg-clay/15 text-clay"
            }`}
          >
            {PHOTO_MSG[photo] ?? "Onbekende status."}
          </div>
        ) : null}
        <div className="mt-3">
          <PhotoUpload action={photoAction} currentUrl={currentPhotoUrl} status={media?.status} />
        </div>
      </section>

      <form action={action} className="mt-8 space-y-5">
        {EDITABLE_FIELDS.map((f) => (
          <div key={f}>
            <label htmlFor={f} className="block text-sm font-medium text-foreground">
              {FIELD_LABELS[f]}
            </label>
            {MULTILINE.has(f) ? (
              <textarea
                id={f}
                name={f}
                rows={f === "longDescription" ? 6 : 3}
                defaultValue={value(f)}
                className="mt-1 w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green"
              />
            ) : (
              <input
                id={f}
                name={f}
                type="text"
                defaultValue={value(f)}
                className="mt-1 w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green"
              />
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-xl bg-deep-green px-5 py-3 font-medium text-background transition hover:opacity-90"
          >
            Wijziging indienen
          </button>
        </div>
      </form>

      <section className="mt-12 border-t border-stone/20 pt-8">
        <h2 className="text-lg font-semibold text-deep-green">Evenement aanmelden</h2>
        <p className="mt-1 text-sm text-warm-brown">
          Organiseer je iets? Dien het in voor de agenda — na goedkeuring verschijnt het op{" "}
          <Link href="/agenda" className="text-amber-ink underline">
            /agenda
          </Link>
          .
        </p>
        {event === "ingediend" ? (
          <div className="mt-4 rounded-xl bg-sage/60 p-4 text-sm text-deep-green">Bedankt! Je evenement wacht op goedkeuring.</div>
        ) : null}
        {event === "fout" ? (
          <div className="mt-4 rounded-xl bg-clay/15 p-4 text-sm text-clay">Controleer de velden (titel, wanneer, locatie, omschrijving; datum jjjj-mm-dd).</div>
        ) : null}
        <form action={eventAction} className="mt-4 space-y-4">
          <input name="title" required placeholder="Titel van het evenement" className="w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green" />
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="category" defaultValue="De Kamp" className="w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green">
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input name="startDate" placeholder="Startdatum jjjj-mm-dd (optioneel)" className="w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green" />
          </div>
          <input name="whenText" required placeholder="Wanneer (bijv. 14 december, 12.00–18.00 uur)" className="w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green" />
          <input name="where" required defaultValue={biz.address} placeholder="Locatie" className="w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green" />
          <textarea name="description" required rows={3} placeholder="Korte omschrijving" className="w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green" />
          <input name="url" type="url" placeholder="Link (optioneel, https)" className="w-full rounded-xl border border-stone bg-background px-4 py-3 text-foreground outline-none focus:border-deep-green" />
          <button type="submit" className="rounded-xl bg-deep-green px-5 py-3 font-medium text-background transition hover:opacity-90">
            Evenement indienen
          </button>
        </form>
      </section>
    </main>
  );
}

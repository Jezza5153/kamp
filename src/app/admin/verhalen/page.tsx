import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listStories } from "@/lib/stories";
import { createStoryAction, setStoryStatusAction, deleteStoryAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verhalen — beheer", robots: { index: false } };

const input =
  "mt-1 w-full rounded-xl border border-stone bg-background px-4 py-2.5 text-foreground outline-none focus:border-deep-green";

export default async function StoriesAdmin({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; error?: string }>;
}) {
  await requireAdmin();
  const { added, error } = await searchParams;
  const stories = await listStories();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-deep-green">Verhalen — beheer</h1>
        <Link href="/admin/instellingen" className="text-sm text-warm-brown underline">
          ← Instellingen
        </Link>
      </div>
      <p className="mt-1 text-sm text-warm-brown">
        Redactionele verhalen op{" "}
        <Link href="/verhalen" className="text-amber-ink underline">
          /verhalen
        </Link>
        . Tekst wordt als platte alinea&apos;s getoond (lege regel = nieuwe alinea).
      </p>

      {added ? <div className="mt-5 rounded-xl bg-sage/60 p-4 text-sm text-deep-green">Opgeslagen.</div> : null}
      {error ? <div className="mt-5 rounded-xl bg-clay/15 p-4 text-sm text-clay">Controleer titel, tekst en de slug/afbeelding.</div> : null}

      <form action={createStoryAction} className="mt-6 space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold text-deep-green">Nieuw verhaal</h2>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">Titel</label>
          <input id="title" name="title" required className={input} placeholder="De kleermaker van Atelier Misura" />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-foreground">Slug (optioneel — anders uit de titel)</label>
          <input id="slug" name="slug" className={input} placeholder="kleermaker-atelier-misura" />
        </div>
        <div>
          <label htmlFor="dek" className="block text-sm font-medium text-foreground">Intro / lede (1–2 zinnen)</label>
          <input id="dek" name="dek" className={input} />
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-foreground">Tekst</label>
          <textarea id="body" name="body" required rows={8} className={input} placeholder={"Eerste alinea…\n\nTweede alinea…"} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-foreground">Auteur (optioneel)</label>
            <input id="author" name="author" className={input} />
          </div>
          <div>
            <label htmlFor="heroUrl" className="block text-sm font-medium text-foreground">Afbeelding-URL (optioneel)</label>
            <input id="heroUrl" name="heroUrl" className={input} placeholder="https://… of /media/…" />
          </div>
        </div>
        <div>
          <label htmlFor="businessIds" className="block text-sm font-medium text-foreground">Gekoppelde zaken (id&apos;s, komma-gescheiden)</label>
          <input id="businessIds" name="businessIds" className={input} placeholder="atelier-misura-sartoria, toko-tjin" />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="publish" value="1" className="h-4 w-4" /> Direct publiceren
        </label>
        <button type="submit" className="rounded-xl bg-deep-green px-5 py-2.5 font-medium text-background transition hover:opacity-90">
          Opslaan
        </button>
      </form>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-deep-green">Alle verhalen ({stories.length})</h2>
        {stories.length === 0 ? (
          <p className="text-sm text-warm-brown/70">Nog geen verhalen.</p>
        ) : (
          <ul className="space-y-2">
            {stories.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-4 shadow-[var(--shadow-card)]">
                <div className="min-w-[12rem] flex-1">
                  <Link href={`/verhalen/${s.slug}`} className="font-medium text-deep-green hover:underline">
                    {s.title}
                  </Link>
                  <span className="ml-2 rounded-full bg-stone/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-warm-brown/70">
                    {s.status}
                  </span>
                </div>
                {s.status !== "published" ? (
                  <form action={setStoryStatusAction}>
                    <input type="hidden" name="storyId" value={s.id} />
                    <input type="hidden" name="status" value="published" />
                    <button className="rounded-lg bg-deep-green px-3 py-1.5 text-sm font-medium text-background">Publiceren</button>
                  </form>
                ) : (
                  <form action={setStoryStatusAction}>
                    <input type="hidden" name="storyId" value={s.id} />
                    <input type="hidden" name="status" value="draft" />
                    <button className="rounded-lg border border-stone px-3 py-1.5 text-sm text-warm-brown">Depubliceren</button>
                  </form>
                )}
                <form action={deleteStoryAction}>
                  <input type="hidden" name="storyId" value={s.id} />
                  <button className="rounded-lg border border-clay/40 px-3 py-1.5 text-sm text-clay">Verwijderen</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

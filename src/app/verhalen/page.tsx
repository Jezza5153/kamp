import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getPublishedStories } from "@/lib/stories";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema } from "@/lib/schema";

export const revalidate = 300;
export const metadata = {
  title: "Verhalen — de makers van De Kamp",
  description:
    "De verhalen achter de winkels, ateliers en horeca van De Kamp in Amersfoort. Ontmoet de ondernemers en ontdek wat hun zaak bijzonder maakt.",
  alternates: { canonical: "/verhalen" },
  openGraph: { title: "Verhalen van De Kamp, Amersfoort", url: "/verhalen" },
};

export default async function StoriesIndex() {
  const stories = await getPublishedStories();

  return (
    <div className="min-h-screen bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Verhalen</p>
        <h1 className="font-serif text-4xl font-black text-deep-green sm:text-6xl">De makers van De Kamp</h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-warm-brown/80">
          De mensen en verhalen achter de zaken op De Kamp — wie ze zijn, wat ze maken en waarom de straat hun thuis is.
        </p>

        {stories.length > 0 ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {stories.map((s) => (
              <Link
                key={s.id}
                href={`/verhalen/${s.slug}`}
                className="group overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-[var(--shadow-card)] transition hover:shadow-lg"
              >
                {s.heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.heroUrl} alt={s.title} className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-deep-green/10">
                    <BookOpen className="h-10 w-10 text-deep-green/40" />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="font-serif text-2xl font-black text-deep-green group-hover:text-amber-ink">{s.title}</h2>
                  {s.dek && <p className="mt-2 text-warm-brown/75">{s.dek}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-14 rounded-[var(--radius-lg)] border-2 border-dashed border-stone/50 bg-paper p-12 text-center">
            <BookOpen className="mx-auto mb-5 h-10 w-10 text-warm-brown/40" />
            <h2 className="mb-2 font-serif text-2xl font-black text-deep-green">De eerste verhalen komen eraan</h2>
            <p className="mx-auto max-w-md text-warm-brown/70">Binnenkort lees je hier de verhalen van de ondernemers van De Kamp.</p>
          </div>
        )}
      </div>

      <JsonLd
        data={graph(breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Verhalen", url: "/verhalen" }]))}
      />
    </div>
  );
}

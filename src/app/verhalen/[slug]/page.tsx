import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStory } from "@/lib/stories";
import { getBusiness } from "@/lib/businessData";
import JsonLd from "@/components/JsonLd";
import TrackView from "@/components/TrackView";
import { graph, breadcrumbSchema } from "@/lib/schema";
import { SITE, abs } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getStory(slug);
  if (!s || s.status !== "published") return {};
  const description = s.dek ?? s.body.slice(0, 150);
  const image = s.heroUrl ? (s.heroUrl.startsWith("/") ? abs(s.heroUrl) : s.heroUrl) : undefined;
  return {
    title: `${s.title} — Verhalen van De Kamp`,
    description,
    alternates: { canonical: `/verhalen/${s.slug}` },
    openGraph: {
      type: "article",
      title: s.title,
      description,
      url: abs(`/verhalen/${s.slug}`),
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story || story.status !== "published") notFound();

  const paragraphs = story.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const linked = (await Promise.all(story.businessIds.map((id) => getBusiness(id)))).filter(
    (b): b is NonNullable<typeof b> => Boolean(b)
  );

  const article: Record<string, unknown> = {
    "@type": "Article",
    headline: story.title,
    ...(story.dek ? { description: story.dek } : {}),
    ...(story.publishedAt ? { datePublished: new Date(story.publishedAt).toISOString() } : {}),
    ...(story.dateModified ? { dateModified: new Date(story.dateModified).toISOString() } : {}),
    author: { "@type": story.author ? "Person" : "Organization", name: story.author ?? SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
    ...(story.heroUrl ? { image: story.heroUrl.startsWith("/") ? abs(story.heroUrl) : story.heroUrl } : {}),
    mainEntityOfPage: abs(`/verhalen/${story.slug}`),
  };

  return (
    <article className="bg-background py-16 sm:py-24">
      <TrackView type="story_view" detail={{ slug: story.slug }} />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/verhalen" className="text-sm font-bold text-amber-ink hover:underline">
          ← Alle verhalen
        </Link>
        <h1 className="mt-4 font-serif text-4xl font-black text-deep-green sm:text-5xl">{story.title}</h1>
        {story.dek && <p className="mt-4 text-xl font-medium leading-relaxed text-warm-brown/85">{story.dek}</p>}
        {story.author && <p className="mt-3 text-sm font-bold text-warm-brown/60">Door {story.author}</p>}

        {story.heroUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.heroUrl} alt={story.title} className="mt-8 w-full rounded-[var(--radius-lg)] object-cover" />
        )}

        <div className="prose mt-8 max-w-none space-y-5 text-lg leading-relaxed text-foreground/90">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {linked.length > 0 && (
          <div className="mt-12 rounded-[var(--radius-lg)] bg-paper p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-3 font-serif text-lg font-black text-deep-green">Genoemd in dit verhaal</h2>
            <ul className="flex flex-wrap gap-3">
              {linked.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/ondernemers/${b.id}`}
                    className="inline-flex rounded-full border border-stone/40 px-4 py-2 text-sm font-bold text-deep-green transition hover:border-amber"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <JsonLd
        data={graph(
          article,
          breadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Verhalen", url: "/verhalen" },
            { name: story.title, url: `/verhalen/${story.slug}` },
          ])
        )}
      />
    </article>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { Gift, Heart, Store, ArrowRight, Mail, Sparkles } from "lucide-react";
import { getActiveBusinessesIn } from "@/lib/businessData";
import { CATEGORIES } from "@/lib/categories";
import JsonLd from "@/components/JsonLd";
import { graph, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { SITE, abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kamp Gift Card — one gift voucher for all of De Kamp",
  description:
    "The Kamp Gift Card: a local gift voucher you spend at the independent shops, restaurants and makers of De Kamp in Amersfoort. Keep your gift — and your money — local.",
  alternates: { canonical: "/en/cadeaukaart", languages: { nl: "/cadeaukaart", en: "/en/cadeaukaart" } },
  openGraph: { title: "Kamp Gift Card", description: "One gift voucher for all the independent businesses of De Kamp in Amersfoort.", url: abs("/en/cadeaukaart"), siteName: SITE.name, locale: "en_GB" },
};

const mailto = (subject: string) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;

const steps = [
  { icon: Gift, title: "Buy the card", text: "Choose an amount and receive the Kamp Gift Card — digital or as a physical card to give away." },
  { icon: Heart, title: "Give something personal", text: "Not a standard voucher, but a gift with a story: a day of shopping, eating and discovering on De Kamp." },
  { icon: Store, title: "Spend it on De Kamp", text: "The recipient decides: dinner, a piece of jewellery, a bouquet or a good bottle of wine — at the independent businesses of the street." },
];

export default async function CadeaukaartPage() {
  // Independent participating merchants (chains/anchors excluded), in walking order.
  const participants = (await getActiveBusinessesIn("en"))
    .filter((b) => b.category !== "Keten / anker")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const faqs = [
    {
      question: "What is the Kamp Gift Card?",
      answer:
        "A local gift voucher you spend exclusively at the independent businesses of De Kamp in Amersfoort. One card, free to spend at dozens of shops, restaurants and makers — so your gift, and your money, stays in the neighbourhood.",
    },
    {
      question: "Where can I spend the gift card?",
      answer: `At the participating independent businesses on De Kamp and the adjoining streets. At the moment there are ${participants.length} independent businesses in the guide; national chains deliberately don't take part, so it stays local.`,
    },
    {
      question: "Can I use the card as a corporate gift?",
      answer:
        "Yes, that's actually a lovely use: a local relationship or staff gift that supports Amersfoort's old town. Get in touch for bespoke business orders.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-deep-green text-white">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Initiative · in development
          </div>
          <h1 className="mt-7 max-w-3xl font-serif text-5xl font-black leading-[0.95] sm:text-7xl">
            One gift voucher <span className="text-gold">for all of De Kamp</span>
          </h1>
          <p className="mt-6 max-w-2xl text-xl font-medium text-stone/85 sm:text-2xl">
            The Kamp Gift Card: to spend at the independent shops, restaurants and makers of the street. Give a
            day of discovery as a gift — and keep your money local.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href={mailto("Interest in the Kamp Gift Card")} className="inline-flex items-center gap-2 rounded-full bg-amber px-8 py-4 text-xs font-black uppercase tracking-widest text-charcoal shadow-xl transition hover:bg-gold active:scale-95">
              <Mail className="h-4 w-4" /> Keep me posted
            </a>
            <a href={mailto("Corporate Kamp Gift Card (business gift)")} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-deep-green">
              Order for business
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">How it works</p>
        <h2 className="mb-12 max-w-2xl font-serif text-3xl font-black text-deep-green sm:text-4xl">
          A local gift in three steps
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-[var(--radius-lg)] bg-paper p-8 shadow-[var(--shadow-card)]">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-deep-green text-white">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-amber-ink">Step {i + 1}</p>
              <h3 className="mb-2 font-serif text-2xl font-black text-deep-green">{s.title}</h3>
              <p className="leading-relaxed text-warm-brown/75">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why local */}
      <section className="bg-stone/15 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Why local</p>
            <h2 className="font-serif text-3xl font-black text-deep-green sm:text-4xl">Your money stays on the street</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-warm-brown/80">
            <p>
              A euro you spend at an independent business stays in the neighbourhood far longer than one spent at a chain.
              The Kamp Gift Card makes that tangible: one voucher that supports all the craftsmanship of the street — from the
              goldsmith to the Ethiopian restaurant.
            </p>
            <p>
              Other cities have already proven the success of the local gift card. De Kamp has the perfect ingredients: a
              compact area, dozens of unique businesses and a strong ‘Vrienden van de Kamp’ community.
            </p>
          </div>
        </div>
      </section>

      {/* Participating merchants */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-ink">Participants</p>
        <h2 className="mb-3 font-serif text-3xl font-black text-deep-green sm:text-4xl">
          {participants.length} independent businesses
        </h2>
        <p className="mb-10 max-w-2xl text-warm-brown/70">
          The gift card is intended for the independent businesses of De Kamp. These are the businesses that could
          take part — we deliberately leave national chains out.
        </p>

        <div className="space-y-10">
          {CATEGORIES.filter((c) => c.name !== "Keten / anker").map((c) => {
            const list = participants.filter((b) => b.category === c.name);
            if (!list.length) return null;
            return (
              <div key={c.slug}>
                <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-deep-green">{c.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {list.map((b) => (
                    <Link
                      key={b.id}
                      href={`/en/ondernemers/${b.id}`}
                      className="rounded-full border border-stone/50 bg-paper px-4 py-2 text-sm font-semibold text-warm-brown/80 transition hover:border-amber hover:text-deep-green"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        <h2 className="mb-8 font-serif text-3xl font-black text-deep-green">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.question} className="group rounded-[var(--radius)] bg-paper p-6 shadow-[var(--shadow-card)]">
              <summary className="cursor-pointer list-none font-serif text-lg font-bold text-deep-green">
                <span className="flex items-center justify-between gap-4">
                  {f.question}
                  <span className="text-amber-ink transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-warm-brown/80">{f.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-deep-green p-10 text-center text-white">
          <h2 className="font-serif text-2xl font-black">Interested in the Kamp Gift Card?</h2>
          <p className="max-w-md text-stone/80">Let us know — and we&apos;ll keep you posted as soon as the card is available.</p>
          <a href={mailto("Interest in the Kamp Gift Card")} className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber px-8 py-3.5 text-xs font-black uppercase tracking-widest text-charcoal transition hover:bg-gold active:scale-95">
            Keep me posted <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: "Home", url: "/en" },
            { name: "Gift Card", url: "/en/cadeaukaart" },
          ]),
          faqSchema(faqs),
        )}
      />
    </div>
  );
}

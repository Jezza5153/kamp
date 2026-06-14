"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, Phone, Mail, MapPin, Quote, Camera, Navigation, Star, CheckCircle2, Sparkles } from "lucide-react";
import type { Business } from "@/data/businesses";
import Breadcrumbs from "@/components/Breadcrumbs";
import BusinessImage from "@/components/BusinessImage";
import BusinessCard from "@/components/BusinessCard";
import OpenBadge from "@/components/OpenBadge";
import HoursTable from "@/components/HoursTable";
import DistrictMap from "@/components/DistrictMap";
import { categorySlug } from "@/lib/categories";
import { directionsUrl, mapsUrl, walkMinutesFromGate, coordsFor } from "@/lib/geo";

export interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  business: Business;
  related: Business[];
  /** all active businesses, used only to draw the context mini-map */
  districtBusinesses: Business[];
  faqs: FaqItem[];
}

export default function BusinessDetailClient({ business, related, districtBusinesses, faqs }: Props) {
  const b = business;
  const walk = walkMinutesFromGate(coordsFor({ streetSegment: b.streetSegment, address: b.address, lat: b.lat, lng: b.lng }));
  const perfectFor = b.perfectFor ?? [];

  return (
    <div className="bg-background pb-24">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: b.category, href: `/categorie/${categorySlug(b.category)}` }, { label: b.name, current: true }]} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-8 max-w-4xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-amber px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-charcoal">{b.category}</span>
            <OpenBadge hours={b.hours} variant="inline" showUnknown />
            {b.priceRange && <span className="rounded-full bg-stone/50 px-3 py-1.5 text-sm font-bold text-warm-brown/80">{b.priceRange}</span>}
            {b.hasGoogleReviews && (
              <a href={b.googleMapsUrl || mapsUrl(b.address, b.postalCode)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-stone/50 px-3 py-1.5 text-sm font-bold text-warm-brown/80 hover:text-amber">
                <Star className="h-3.5 w-3.5 fill-amber text-amber" /> Reviews op Google
              </a>
            )}
          </div>
          <h1 className="font-serif text-5xl font-black leading-[0.92] tracking-tight text-deep-green sm:text-7xl">{b.name}</h1>
          <p className="mt-6 max-w-3xl text-xl font-medium leading-snug text-warm-brown/80 sm:text-2xl">{b.shortDescription}</p>
        </motion.div>
      </div>

      {/* Cover */}
      <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)] bg-stone/30 shadow-[var(--shadow-float)] sm:aspect-[21/9]">
          <BusinessImage business={b} priority sizes="100vw" tag="Kamp · Amersfoort" />
        </motion.div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left */}
          <div className="space-y-14 lg:col-span-7">
            <section>
              <SectionLabel>Het verhaal</SectionLabel>
              <div className="font-serif text-2xl font-medium italic leading-[1.45] text-warm-brown/90">
                <Quote className="mb-4 h-10 w-10 text-amber/25" />
                {b.longDescription}
              </div>
            </section>

            {(b.specialties?.length || perfectFor.length) && (
              <section className="grid gap-8 sm:grid-cols-2">
                {b.specialties && b.specialties.length > 0 && (
                  <div>
                    <SectionLabel>Specialiteiten</SectionLabel>
                    <ul className="flex flex-wrap gap-2">
                      {b.specialties.map((s) => (
                        <li key={s} className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-deep-green ring-1 ring-stone/50">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {perfectFor.length > 0 && (
                  <div>
                    <SectionLabel>Perfect voor</SectionLabel>
                    <ul className="flex flex-wrap gap-2">
                      {perfectFor.map((g) => (
                        <li key={g} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-600/20">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {b.keyFacts && b.keyFacts.length > 0 && (
              <section>
                <SectionLabel>Goed om te weten</SectionLabel>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  {b.keyFacts.map((f) => (
                    <div key={f.label} className="border-l-2 border-amber/40 pl-4">
                      <dt className="text-[11px] font-black uppercase tracking-widest text-warm-brown/45">{f.label}</dt>
                      <dd className="mt-0.5 text-base font-semibold text-deep-green">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {b.publicPersonName && (
              <section className="relative overflow-hidden rounded-[var(--radius-lg)] bg-paper p-10 shadow-[var(--shadow-card)]">
                <SectionLabel>Het gezicht</SectionLabel>
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-deep-green text-3xl font-black text-white shadow-lg ring-8 ring-stone/20">
                    {b.publicPersonName[0]}
                  </div>
                  <div>
                    <p className="font-serif text-2xl font-black text-deep-green">{b.publicPersonName}</p>
                    {b.publicPersonRole && <p className="text-sm font-bold uppercase tracking-wider text-warm-brown/50">{b.publicPersonRole}</p>}
                  </div>
                </div>
              </section>
            )}

            {faqs.length > 0 && (
              <section>
                <SectionLabel>Veelgestelde vragen</SectionLabel>
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
              </section>
            )}
          </div>

          {/* Right rail */}
          <aside className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              {/* contact */}
              <div className="rounded-[var(--radius-lg)] bg-deep-green p-8 text-white shadow-[var(--shadow-float)]">
                <SectionLabel light>Locatie & contact</SectionLabel>
                <dl className="space-y-5">
                  <Row icon={<MapPin className="h-5 w-5" />} label="Adres">
                    {b.address}, {b.postalCode ?? "3811"} Amersfoort
                    <span className="mt-1 block text-xs font-medium text-white/45">± {walk} min. lopen vanaf de Kamperbinnenpoort</span>
                  </Row>
                  {b.phone && (
                    <Row icon={<Phone className="h-5 w-5" />} label="Telefoon">
                      <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="hover:text-amber">{b.phone}</a>
                    </Row>
                  )}
                  {b.email && (
                    <Row icon={<Mail className="h-5 w-5" />} label="E-mail">
                      <a href={`mailto:${b.email}`} className="break-all hover:text-amber">{b.email}</a>
                    </Row>
                  )}
                </dl>

                <div className="mt-7 flex flex-col gap-3">
                  <a href={directionsUrl(b.address, b.postalCode)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-6 py-3.5 text-sm font-black uppercase tracking-widest text-charcoal shadow-lg transition hover:bg-gold active:scale-95">
                    <Navigation className="h-4 w-4" /> Route via Google Maps
                  </a>
                  <div className="flex gap-3">
                    {b.websiteUrl && (
                      <a href={b.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 px-4 py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-white hover:text-deep-green">
                        <Globe className="h-4 w-4" /> Website
                      </a>
                    )}
                    {b.instagramUrl && (
                      <a href={b.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex items-center justify-center rounded-full border border-white/25 px-4 py-3 transition hover:bg-white hover:text-deep-green">
                        <Camera className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* hours */}
              <div className="rounded-[var(--radius-lg)] bg-charcoal p-8 text-white shadow-[var(--shadow-card)]">
                <div className="mb-5 flex items-center justify-between gap-2">
                  <SectionLabel light>Openingstijden</SectionLabel>
                  <OpenBadge hours={b.hours} showUnknown />
                </div>
                <HoursTable hours={b.hours} note={b.hoursNote} />
              </div>

              {/* mini map */}
              <div>
                <DistrictMap businesses={districtBusinesses} highlightIds={new Set([b.id])} />
                <p className="mt-2 text-center text-xs text-warm-brown/50">{b.name} op De Kamp</p>
              </div>
            </div>
          </aside>
        </div>

        {/* related */}
        {related.length > 0 && (
          <section className="mt-24">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <SectionLabel>Ook op De Kamp</SectionLabel>
                <h2 className="font-serif text-3xl font-black text-deep-green sm:text-4xl">In de buurt</h2>
              </div>
              <Link href="/" className="hidden text-xs font-black uppercase tracking-widest text-amber-ink hover:underline sm:block">
                Alle ondernemers →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((r) => (
                <BusinessCard key={r.id} business={r} />
              ))}
            </div>
          </section>
        )}

        {/* owner CTA */}
        <section className="mt-20 flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-stone/40 bg-paper p-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <Sparkles className="h-8 w-8 flex-shrink-0 text-amber" />
            <div>
              <h3 className="font-serif text-xl font-black text-deep-green">Ben jij van {b.name}?</h3>
              <p className="text-sm text-warm-brown/70">Vul je verhaal, foto’s en openingstijden aan — gratis.</p>
            </div>
          </div>
          <Link href="/aanmelden" className="whitespace-nowrap rounded-full bg-deep-green px-7 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-amber active:scale-95">
            Beheer deze zaak
          </Link>
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="h-px w-8 bg-amber" />
      <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${light ? "text-amber" : "text-amber-ink"}`}>{children}</span>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 flex-shrink-0 text-white/40">{icon}</span>
      <div>
        <dt className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</dt>
        <dd className="text-lg font-medium">{children}</dd>
      </div>
    </div>
  );
}

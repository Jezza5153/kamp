# Ondernemers van de Kamp

A sophisticated, SEO/GEO-rich local guide to **every business on De Kamp** — the independent
shopping & hospitality district in the historic centre of Amersfoort (NL). The spine of the
district is the ~350 m street *Kamp*, starting at the 13th-century Kamperbinnenpoort city gate,
together with Achter de Kamp, Grote Sint Jansstraat, Zuidsingel and Weverssingel.

Built with **Next.js 16 (App Router) · Tailwind CSS v4 · Framer Motion · lucide-react**.

## Highlights

- **67 verified active businesses** with structured data — opening hours, geo coordinates,
  price level, specialties, key facts and refined Dutch descriptions.
- **Interactive district map** (`/kaart`, also on the homepage) — a bespoke, key-free SVG map
  that plots every business along the real curve of the street, colour-coded by category, with
  live "open now" dots. No third-party tiles or API keys.
- **Live "open nu" status** computed in Europe/Amsterdam time across cards, map pins, badges and a
  filter toggle (handles cross-midnight hours).
- **Generative cover art** — every business gets a deterministic, on-brand placeholder
  (category gradient + monogram + motif) until an owner photo is supplied. Fully legal, zero-network.
- **GEO / SEO foundation** — complete JSON-LD (LocalBusiness subtypes with geo + openingHours +
  price, BreadcrumbList, ItemList, FAQPage, WebSite/SearchAction, Organization, a Place/TouristAttraction
  for the district), per-page metadata + OpenGraph, a dynamic image-OG, a fresh-from-data `llms.txt`,
  an image sitemap, and a robots policy that explicitly welcomes AI answer-engine crawlers.
- **WCAG AA** colour tokens (`--amber-ink` for amber-coloured text), focus-visible rings,
  `prefers-reduced-motion` support.

## Project structure

```
src/
  app/                     # routes (home, /kaart, /categorie/[slug], /ondernemers/[id],
                           #         /loop-de-kamp, /over-de-kamp, /aanmelden,
                           #         llms.txt, opengraph-image, sitemap, robots)
  components/              # Navbar, Hero, BusinessExplorer (map+filter+grid), DistrictMap,
                           # BusinessCard, BusinessImage, OpenBadge, HoursTable, detail view, …
  data/businesses.ts       # the dataset (Business type + records)
  lib/
    site.ts                # canonical NAP / site config
    categories.ts          # category registry (slugs, copy, icons)
    geo.ts                 # district coordinates, street interpolation, projection, distances
    hours.ts               # open-now engine + schema.org hours
    schema.ts              # JSON-LD builders
    placeholder.ts         # generative SVG cover art
    related.ts             # related businesses + FAQ generation
research/                  # provenance: district + discovery + enrichment + strategy JSON
```

## Data & provenance

Business data was compiled from public sources (the shops' own sites, tijdvooramersfoort.nl,
VVV Amersfoort, Google Maps listings, local news) via a multi-agent research pass on **2026-06-14**
(see `research/`). Four businesses verified as closed/moved are intentionally excluded:
BKK Thai (Kamp 10), Ritos (Kamp 16, now Freddo), Binnenspecialist van den Berg (Kamp 82) and
Picture @ Home (Grote Sint Jansstraat 15).

Owner portraits and photos are only published with permission — candidate images found in public
sources are stored as `imageCandidateUrl` but never shown until an owner confirms.

## Roadmap

Surfaced by the research/design brief, not yet built: a **Kamp Cadeaukaart** (local gift card),
an **events/agenda** section, an editorial **owner-story** strand, **owner photo uploads**,
a **newsletter** + connected social profiles, and **NL/EN** bilingual content.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
```

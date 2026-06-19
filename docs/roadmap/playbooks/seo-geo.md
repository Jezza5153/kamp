# SEO + GEO + AEO Master Playbook — Ondernemers van de Kamp

> **Status:** authoritative cross-cutting standard. Every epic plugs into this playbook.
> **Owner:** SEO/GEO/AEO team. **Audience:** every epic lead.
> **Stack:** Next.js 16 (App Router) · React 19 · Cloudflare Workers (`@opennextjs/cloudflare`) · D1 · R2 · Tailwind v4.
> **Companion doc:** the dedicated **AEO Playbook** (`aeo.md` — answer-engine chunking, `llms.txt`, speakable, citation tracking). This playbook owns the *search + entity + local + measurement* layer and cross-references AEO where they meet.
> **Last reviewed:** 2026-06-19. Re-review every quarter; bump this line on every edit (freshness is itself a ranking input — see §9).

---

## 0. TL;DR — the non-negotiables

1. **Never regress the existing SEO surface.** Full JSON-LD `@graph`, `llms.txt`, OG image, image sitemap, AI-crawler `robots.ts`, per-page metadata + canonical are *shipped and green*. Every PR that touches a public route must keep these intact. CI guard in §11.
2. **One NAP source of truth: `src/lib/site.ts`.** Address, region, email, locale, geo. Schema, metadata, `llms.txt`, sitemap and the OG image all read from it. No hardcoded address/region/email anywhere else. Ever.
3. **No fabricated trust signals.** `aggregateRating` / `review` markup stays *off* business pages (self-serving rule, §4). `localBusinessSchema()` already omits them — keep it that way. Reviews are for on-page UX + AEO reputation + local-pack ranking via **Google Business Profile**, not for star snippets on our own domain.
4. **Entity-first.** Brands, people, the district = resolvable entities with stable `@id` + `sameAs`. Fill `SITE.social` and add Wikidata/OSM `sameAs` to the district before launch.
5. **Freshness is a ranking + citation input.** Emit `dateModified` on-page (not just in the sitemap). Every approved owner edit must bump `updatedAt`. ~83% of AI citations are pages updated <12 months; >60% <6 months.
6. **Answer-first content.** Lead with a 40–60 word extractable answer in FAQ/intro blocks. Detail lives in the AEO playbook.

---

## 1. Preserve + extend the existing strengths

The current state (audited) is genuinely strong. The job of every epic is **additive**, never destructive. This table is the contract.

| Asset (file) | What it does today | Extension rule for epics |
|---|---|---|
| `src/lib/schema.ts` `graph()` + 7 builders | Organization, WebSite+SearchAction, Place+TouristAttraction (district), LocalBusiness (subtype via `business.schemaType`), BreadcrumbList, ItemList, FAQPage | **Add new builders HERE, never inline in pages.** New: `eventSchema()`, `eventSeriesSchema()`, `articleSchema()`, `listingServiceSchema()`, `giftCardSchema()`. Keep the "never emit untrue data" rule (top-of-file comment). |
| `src/components/JsonLd.tsx` | Single render component | Reuse. Do not hand-roll `<script type="application/ld+json">`. |
| `src/app/llms.txt/route.ts` | Dynamic, D1-driven, force-static 1h cache | Extend with `## Evenementen`, `## Verhalen` sections as those epics ship. Never let it 500 — keep the seed fallback. |
| `src/app/opengraph-image.tsx` | `next/og` 1200×630, branded, no external deps | Reuse the pattern for per-business / per-event OG if added. |
| `src/app/sitemap.ts` | static + category + ~67 business URLs, `lastModified` from `updatedAt`, image entries | Each new route TYPE (event, story, EN locale) MUST register here with `lastModified` from data, never `now()` for unchanged pages. |
| `src/app/robots.ts` | Allows GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Google-Extended, ClaudeBot, Claude-Web, Applebot-Extended, Bingbot; sitemap + host declared | Do **not** add `Disallow` for `/beheer` `/admin` (runtime-gated, no sensitive HTML; a disallow leaks their existence). Add new AI bots here as they appear. |
| `layout.tsx` metadata | `metadataBase`, `%s` title template, `googleBot: max-image-preview:large, max-snippet:-1`, per-page canonical | **Add `lang="nl"` to `<html>`** (currently missing — WCAG + SEO; ship in launch). Add `alternates.languages` only when EN exists (§3 / bilingual). |
| `revalidate = 300` ISR | 5-min freshness window on data pages | Keep. When d1-next-tag-cache lands (see backend playbook) `revalidateTag`/`revalidatePath` become real and edits go live instantly — SEO benefit, no schema change. |

**Regression guard before every merge to a public route:**
```bash
npm run preview:cf          # build + run on the REAL Workers runtime (not next dev)
# For each canonical route, confirm JSON-LD is present and parses:
curl -s "$PREVIEW_URL/ondernemers/SOME_ID" \
  | grep -oP '<script type="application/ld\+json">.*?</script>' \
  | sed -E 's/<[^>]+>//g' | python3 -m json.tool > /dev/null && echo "JSON-LD OK"
# Then paste rendered HTML into the Rich Results Test + Schema.org validator (§11).
```

---

## 2. Per-feature SEO requirement table (the epic contract)

Every roadmap epic MUST satisfy its row before it ships. "Applies to" tags map to the epic list in §13.

| Epic | Required schema / SEO work | Where it goes | Indexing rule |
|---|---|---|---|
| **launch** | `lang="nl"` on `<html>`; fill `SITE.social.{instagram,facebook}`; district `sameAs` (Wikidata/OSM); `dateModified` on LocalBusiness + district nodes; verify canonical on every route; submit sitemap to Search Console + Bing; ship `placeId` column | `layout.tsx`, `site.ts`, `schema.ts`, `sitemap.ts`, migration | All public routes `index,follow`. |
| **agenda** | Move `eventSchema()` into `schema.ts`; add `organizer` (Organization `@id`), `location` (district Place `@id`), `image`, `offers` if ticketed; add `eventSeriesSchema()` for Koopzondag/markt; inject `## Evenementen` into `llms.txt`; register `/agenda` + per-event URLs in sitemap with `startDate`-derived `lastModified` | `schema.ts`, `agenda/page.tsx`, `llms.txt`, `sitemap.ts` | Index `/agenda` + dated event pages. **De-index events** whose `end_at < now()-90d` (`noindex`) to avoid stale-event bloat. |
| **owner-story** | New `articleSchema()`: `Article` with `@id`, `headline`, `author` → `Person` sharing the business `founder` `@id`, `datePublished`, `dateModified`, `publisher` → Organization `@id`, `image`, `mainEntityOfPage`, `about` → business `@id`; cross-link story ↔ business | `schema.ts`, `/verhalen/[slug]`, `sitemap.ts`, `llms.txt` (`## Verhalen`) | Index stories. Reciprocal internal links to the subject business (§12). |
| **google-reviews** | Add `placeId` to Business model + flow through D1 override; GBP OAuth read of *own* reviews; compliant on-page widget (§4); **NO `aggregateRating`/`review` JSON-LD on our pages**; review-acquisition deep links | `businesses.ts`, `schema.ts` (unchanged — stays off), `/api/reviews/[id]` | Reviews are UX/AEO, not rich-snippet bait. Reviews API endpoint `noindex`. |
| **cadeaukaart** | `giftCardSchema()` (`Product`/`GiftCard` + `Offer`, `priceCurrency: EUR`, `availability`); `listingServiceSchema()` reuse for "lokaal cadeau" Service; keep existing FAQPage (3 Q&A); `seller` → Organization `@id` | `schema.ts`, `cadeaukaart/page.tsx` | Index `/cadeaukaart`. Purchase / redeem routes `noindex`. |
| **bilingual** | `hreflang` via `metadata.alternates.languages` (`nl`, `en`, `x-default`); `[locale]` route group; `inLanguage` per node; translate FAQ/schema text; per-locale sitemap entries | `[locale]` group, every `generateMetadata`, `schema.ts`, `sitemap.ts` | Self-referencing canonical PER locale. hreflang must be reciprocal. |
| **discovery** (search/filter/map) | **Faceted-page indexing rules** (§7): keep filter state client-side (no new URLs); SearchAction results (`/?q=`) self-canonical to `/` + `noindex,follow`; ItemList only on indexable landing pages; add TouristTrip/ItemList+hasPart to `/loop-de-kamp` | `BusinessExplorer`, category route, `loop-de-kamp` | Only "clean" category + overview pages indexable. Query-string states `noindex`. |
| **newsletter** | No public-index surface; signup section gets a `WebPage` node at most; confirm/unsubscribe routes `noindex,nofollow` | newsletter route | Transactional routes `noindex`. |
| **design-system** | Guard Core Web Vitals (§8): no CLS from new components, `next/image` sizing discipline, no render-blocking JS; preserve focus + `prefers-reduced-motion` (already good) | components | Quality gate, not indexing. |
| **analytics** | Stand up the measurement loop (§10): Search Console, Bing Webmaster, Cloudflare Web Analytics, AI-mention panel; verify properties on launch | external + sitemap | n/a |
| **owner-ops** | Owner edits bump `updatedAt` → on-page `dateModified` → sitemap `lastModified`; NAP edits validated against `site.ts` format; review-acquisition + citation-consistency runbook | overrides path, admin UI | n/a |

---

## 3. Concrete how-to: schema builders to add

All go in `src/lib/schema.ts`, rendered via `<JsonLd>`, wrapped in `graph(...)`. Follow the existing conventions: stable `@id`, `filter(Boolean)`, conditional spread, never emit untrue data.

### 3.1 `dateModified` on existing nodes (launch — do this first, ~3 lines)

```ts
// in localBusinessSchema(business): after the node literal, before `return node`
if (business.updatedAt) node.dateModified = new Date(business.updatedAt).toISOString();

// in districtPlaceSchema(): add a site-level freshness anchor
dateModified: new Date().toISOString(), // ISR re-renders ≤5 min so this stays current
```
Pair with the owner-ops rule: **every approved override bumps `updatedAt`.** The photo-approval path already inserts a system override row (`setApprovedImage`) — extend the override-merge to stamp `updatedAt` whenever any approved row exists for a business.

### 3.2 District `sameAs` (launch — anchors the entity in AI knowledge graphs)

```ts
// in districtPlaceSchema(), add after isAccessibleForFree:
sameAs: [
  "https://www.openstreetmap.org/way/REPLACE_WITH_OSM_WAY_ID", // De Kamp street
  // "https://www.wikidata.org/wiki/REPLACE_WITH_Q_NUMBER",     // add if a Q-item exists
].filter(Boolean),
```
Action: SEO team looks up the OSM way for "Kamp, Amersfoort" and checks Wikidata for a Q-number for the street / binnenstad. **If none exists, create a Wikidata item** for the district — the single cheapest entity-anchoring win. Also fill `SITE.social` so `organizationSchema().sameAs` stops emitting an empty array.

### 3.3 `eventSchema()` + `eventSeriesSchema()` (agenda)

Currently the event builder is inline in `src/app/agenda/page.tsx`. Move it to `schema.ts` and extend:
```ts
export function eventSchema(e: KampEvent): Json {
  return {
    "@type": "Event",
    "@id": `${SITE.url}/agenda/${e.slug}#event`,
    name: e.title,
    description: e.description,
    startDate: e.startAt,          // ISO 8601 WITH tz, e.g. 2026-09-13T11:00:00+02:00
    ...(e.endAt ? { endDate: e.endAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@id": ID.district },          // reuse district Place entity
    organizer: { "@id": ID.organization },
    ...(e.image ? { image: abs(e.image) } : {}),
    ...(e.offers ? { offers: { "@type": "Offer", price: e.price, priceCurrency: "EUR",
        availability: "https://schema.org/InStock", url: e.ticketUrl } } : {}),
  };
}

// Recurring: Koopzondag, weekmarkt — one node covers the whole series
export function eventSeriesSchema(s: KampEventSeries): Json {
  return {
    "@type": "EventSeries",
    "@id": `${SITE.url}/agenda/${s.slug}#series`,
    name: s.title,
    location: { "@id": ID.district },
    organizer: { "@id": ID.organization },
    eventSchedule: {
      "@type": "Schedule",
      repeatFrequency: s.rrule,    // "P1M" monthly; or byDay for weekly markt
      ...(s.byDay ? { byDay: s.byDay } : {}),
    },
  };
}
```
Only emit when `startAt` is concrete (keep the existing gate). De-index past dated events (§2 agenda row).

### 3.4 `articleSchema()` (owner-story)

```ts
export function articleSchema(a: Story, business: Business): Json {
  return {
    "@type": "Article",
    "@id": `${SITE.url}/verhalen/${a.slug}#article`,
    headline: a.headline,                  // ≤110 chars
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    inLanguage: SITE.lang,
    ...(a.image ? { image: abs(a.image) } : {}),
    author: business.publicPersonName
      ? { "@type": "Person", name: business.publicPersonName,
          "@id": `${businessUrl(business.id)}#founder` }  // SAME @id as LocalBusiness.founder
      : { "@id": ID.organization },
    publisher: { "@id": ID.organization },
    mainEntityOfPage: `${SITE.url}/verhalen/${a.slug}`,
    about: { "@id": `${businessUrl(business.id)}#business` },  // story → business entity
  };
}
```
The `author.@id` must be **identical** to the `founder.@id` you also start emitting on the LocalBusiness node (add `"@id": "${businessUrl}#founder"` to the existing `founder` Person) — that's how the AI graph knows "the owner who wrote this = the founder of that business."

### 3.5 `listingServiceSchema()` for `/aanmelden` (launch / owner-ops)

```ts
export function listingServiceSchema(): Json {
  return {
    "@type": "Service",
    name: "Gratis vermelding op Ondernemers van de Kamp",
    serviceType: "Lokale ondernemersvermelding",
    provider: { "@id": ID.organization },
    areaServed: { "@type": "City", name: SITE.city },
    description: "Elke ondernemer op De Kamp krijgt gratis een vermelding met openingstijden, foto's en verhaal.",
  };
}
```
`/aanmelden` currently emits BreadcrumbList only — this targets the B2B query "mijn zaak aanmelden De Kamp".

---

## 4. Reviews: the self-serving constraint + Google Business Profile strategy

Highest-leverage *and* highest-risk area. Get the policy right.

### 4.1 The two hard rules (2024+ policy, still current 2026)

1. **Self-serving review markup is ineligible for rich results.** Reviews of *your own* entity, shown on *your own* page, do **not** earn star snippets for `LocalBusiness`/`Organization`. So **`schema.ts` keeps `aggregateRating` and `review` OFF business pages** — `localBusinessSchema()` already omits them. Keep it that way. If you ever add them, `aggregateRating`/`reviewCount` must *exactly* match a visible, user-sourced number on the page.
2. **Places API caching ban.** Do **not** pre-fetch, cache, or store Places API review content. The **`place_id` is the one exception** — store it freely. Places API returns **≤5 reviews per request**. When you display review content you **must** link back to Google Maps; with no map present, the **Google logo + attributions must be shown unobscured.**

### 4.2 The compliant architecture

```
Owner reviews (read + respond) → Google Business Profile API (owner OAuth in /beheer)
                                 = compliant; owner reads/responds to their OWN reviews
On-page display (≤5, optional) → request-time fetch, NO caching beyond place_id,
                                 Google logo + Maps link-back mandatory
Star snippets in SERP          → earned via the GBP listing + local pack, NOT our JSON-LD
Ranking lever                  → review ACQUISITION (volume + freshness + owner responses)
```

**Data model — do this now (zero cost, unblocks everything):**
```ts
// src/data/businesses.ts — add to the Business type + seed:
placeId?: string; // Google Place ID — EXEMPT from caching rules, safe to store
```
The value flows through the existing `business_overrides` JSON path (owners can submit it; admin approves), so no new column is strictly required — but a dedicated indexed column is cleaner if GBP epics query it.

**On-page widget rules (`<GoogleReviewsStrip>`):**
- [ ] Powered by GBP API (owner OAuth) for the owner's own listing, OR a request-time Places call (no cache).
- [ ] Google "G" logo rendered unobscured + "Reviews op Google" attribution.
- [ ] Every review card links to the Google Maps listing (`b.googleMapsUrl`).
- [ ] Max 5 reviews shown.
- [ ] Prominent **"Laat een review achter"** deep link to the GBP review form.
- [ ] `/api/reviews/[id]` returns `noindex` headers; never written to D1/R2.
- [ ] Replaces the current stub ("Reviews op Google" pill-link in `BusinessDetailClient`).

### 4.3 Review-acquisition program (the actual ranking win)

| Action | Owner | How |
|---|---|---|
| Per-business review deep link | google-reviews | `https://search.google.com/local/writereview?placeid={place_id}` → render as QR in `/beheer` |
| Printable QR table-tent / counter card | design-system + owner-ops | A6 card per business from `place_id` |
| Owners respond to reviews | owner-ops | GBP OAuth in portal; runbook: respond within 7 days |
| NAP consistency (review trust) | launch | §5 — mismatched NAP suppresses local-pack ranking |

---

## 5. Local SEO: GBP, NAP, citations

### 5.1 Two GBP layers
- **District-level:** the district association claims/holds a GBP for "De Kamp" as a point of interest if eligible, plus consistent mentions on VVV Amersfoort. The district `Place`+`TouristAttraction` schema + Wikidata anchor (§3.2) reinforce it.
- **Per-business:** each owner claims/manages their own GBP via OAuth in `/beheer` (read + respond). We never own their listing — we link to it and drive reviews to it.

### 5.2 NAP consistency — anchored on `src/lib/site.ts`
`SITE` is the single source. Canonical formats every citation must match:

| Field | Canonical value (from `site.ts`) |
|---|---|
| Name (guide) | `Ondernemers van de Kamp` |
| Short name | `De Kamp Amersfoort` |
| Locality | `Amersfoort` |
| Region | `Utrecht` |
| Postal area | `3811` |
| Email | `info@ondernemersvandekamp.nl` |
| URL | `https://ondernemersvandekamp.nl` |
| Streets in scope | `Kamp, Achter de Kamp, Grote Sint Jansstraat, Zuidsingel, Weverssingel` (`DISTRICT_STREETS`) |

**Per-business NAP** lives in `src/data/businesses.ts` + approved D1 overrides merged by `businessData.ts`. **Rule:** any owner edit to address/phone/postcode is validated before approval — NL postcode `^\d{4}\s?[A-Z]{2}$`, phone `^(\+31|0)`. The admin diff view (already present) should surface a NAP-format lint warning.

### 5.3 Citation targets (NL-specific — launch + owner-ops)
- [ ] **VVV Amersfoort** / Amersfoort city marketing — district + business listings.
- [ ] **Google Business Profile** (per business).
- [ ] **Bing Places** (per business — feeds Bing + Copilot + ChatGPT search).
- [ ] **Apple Business Connect** (Maps + Siri / Apple Intelligence).
- [ ] **OpenStreetMap** — map each street segment + notable businesses (feeds our `sameAs` + many AI engines).
- [ ] Local press / Amersfoort blogs → earned links (entity reinforcement, not just PageRank).

Consistency check: every citation's Name/Address/Phone must byte-match `site.ts` (guide) or `businesses.ts` (business). Tracked in a spreadsheet owned by owner-ops.

---

## 6. Keyword / topic map — De Kamp & Amersfoort intents

NL-first; EN versions land with the bilingual epic. Keep targets in each route's `keywords` metadata array (already present) and refresh annually.

| Cluster | Head terms | Long-tail / AEO question form | Target page | Schema |
|---|---|---|---|---|
| **District discovery** | `winkelen Amersfoort binnenstad`, `De Kamp Amersfoort` | "wat is De Kamp in Amersfoort?", "leukste winkelstraat Amersfoort" | `/`, `/over-de-kamp` | Place+TouristAttraction, FAQPage |
| **Things to do** | `wat te doen Amersfoort centrum` | "wandelroute Amersfoort binnenstad", "leuke route langs winkels Amersfoort" | `/loop-de-kamp` | **add TouristTrip/ItemList+hasPart** (currently breadcrumb-only) |
| **Eat & drink** | `restaurants De Kamp`, `lunch Amersfoort centrum` | "waar lunchen op De Kamp", "Italiaans restaurant Amersfoort binnenstad" | `/categorie/horeca`, business pages | LocalBusiness (Restaurant/Cafe subtype), FAQPage |
| **Shops by type** | `boekwinkel Amersfoort`, `kapper binnenstad Amersfoort` | "onafhankelijke winkel Amersfoort", category-specific | `/categorie/[slug]` | ItemList, FAQPage |
| **Practical** | `openingstijden winkels Amersfoort`, `parkeren binnenstad Amersfoort` | "zijn de winkels op De Kamp op zondag open?", "waar parkeren bij De Kamp" | `/praktisch` | FAQPage, speakable (AEO) |
| **Events** | `koopzondag Amersfoort`, `markt Amersfoort centrum` | "wanneer is de volgende koopzondag in Amersfoort" | `/agenda` | Event, EventSeries |
| **Gift** | `cadeaukaart Amersfoort`, `lokaal cadeau Amersfoort` | "cadeaubon lokale winkels Amersfoort" | `/cadeaukaart` | GiftCard/Product, FAQPage |
| **B2B (owner acq.)** | `mijn zaak aanmelden De Kamp` | "hoe meld ik mijn winkel aan bij De Kamp" | `/aanmelden` | Service |
| **Per-business brand** | `{business name} Amersfoort` | "openingstijden {business}", "{business} reviews" | `/ondernemers/[id]` | LocalBusiness |

The on-site `SearchAction` (already in `websiteSchema()` → `/?q=`) is the discovery epic's surface — keep it.

---

## 7. Faceted / discovery indexing rules

The discovery epic (search + filter + map) is where crawl bloat sneaks in. Rules:

- **Indexable:** clean overview (`/`), each category (`/categorie/[slug]`), each business, `/kaart`. These carry `ItemList`.
- **Not indexable:** any **query-string filter combination** (`/?q=...`, `/?open=1`, `perfectFor=...`, map vs grid). These are client-side state in `BusinessExplorer` today — **keep them client-side** (no separate URLs) so there's nothing to de-index. If a future filter becomes a real URL:
  ```ts
  export const metadata = {
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE.url}/categorie/${slug}` }, // back to the clean URL
  };
  ```
- **The `SearchAction` results view** (`/?q=`) self-canonicals to `/` and is `noindex,follow`.
- **One H1 per route.** Faceted landing pages get a unique H1 + a 40–60 word intro (AEO). Generic "Resultaten" pages are not indexed.

---

## 8. Core Web Vitals on Cloudflare Workers

Workers + OpenNext gives an edge-rendered, fast baseline. Protect it.

| Metric | Target | This-stack levers |
|---|---|---|
| **LCP** | < 2.5s | Hero image (`kamperbinnenpoort.jpg`) is the LCP element — `priority` on `next/image`, preconnect to the media origin, serve AVIF/WebP. ISR (`revalidate=300`) means HTML is edge-cached. |
| **CLS** | < 0.1 | Every `next/image` needs explicit `width`/`height` or `fill`+aspect box (cards use `aspect-[4/5]` — good). `OpenBadge` already null-renders until hydrated (no shift). New components must reserve space. |
| **INP** | < 200ms | Framer Motion is heavy — keep animations transform/opacity only (GPU). `prefers-reduced-motion` already collapses them. MapLibre is async-imported (good) — add a skeleton so its load doesn't feel like a stall. |
| **TTFB** | < 600ms | Workers edge + R2 incremental cache. **No Node-only APIs at the edge.** Keep `getOverrides()` on its index (`idx_overrides_business`). |

Image policy (impacts LCP + image sitemap): images are served today directly from Workers at original resolution/format (no transform layer). The launch/design-system epics should adopt Cloudflare Images or `next/image` resizing to ship sized AVIF/WebP — a major LCP win at lean cost. Until then, the R2 5 MB cap bounds source size.

**Measure on the real Workers runtime, not localhost:**
```bash
npm run preview:cf                              # builds + previews on Workers
npx unlighthouse --site "$PREVIEW_URL"          # crawls all routes, CWV per page
# or PageSpeed Insights against the preview URL for field-comparable lab data
```

---

## 9. Freshness cadence (the AI-citation multiplier)

2026 data: ~83% of AI citations are pages updated within 12 months; >60% within 6 months. Make freshness systemic, not manual.

- [ ] **On-page `dateModified`** on LocalBusiness + district + Article + Event nodes (§3.1).
- [ ] **`updatedAt` bumps on every approved override** (owner-ops wires this into the moderation path).
- [ ] **Sitemap `lastModified`** already reads `updatedAt` — keep it; never fall back to `now()` for unchanged pages (a freshness lie crawlers learn to ignore).
- [ ] **Seasonal refresh** of `/agenda`, `/praktisch` (holiday hours) — owner-ops runbook, quarterly.
- [ ] **`llms.txt`** regenerates per request from live data (already does) — inherently fresh.
- [ ] **Re-review this playbook quarterly** and bump the "Last reviewed" line (top of file).

---

## 10. Measurement loop

Stand up under the **analytics** epic; SEO team operates it.

| Tool | Tracks | Setup |
|---|---|---|
| **Google Search Console** | Impressions/clicks/position per query+page, CWV, rich-result coverage, index coverage | Verify domain property `ondernemersvandekamp.nl` via DNS TXT (Cloudflare DNS). Submit `sitemap.xml`. Watch Rich Results + Crawl Stats. |
| **Bing Webmaster Tools** | Bing + **Copilot** surface; can import from GSC | Verify, submit sitemap. Bing also feeds ChatGPT search. |
| **Cloudflare Web Analytics** | Privacy-first, EU-OK, no cookie banner; pageviews + CWV field data | Enable the Workers snippet. Zero-cost, GDPR-clean (no `gtag`, fits the lean/EU constraint). |
| **AI-mention tracking** | Whether GPT/Perplexity/Claude/AI-Overviews cite us | Fixed NL query panel run monthly ("beste winkels De Kamp Amersfoort", "wat te doen binnenstad Amersfoort") across ChatGPT / Perplexity / Google AI Overviews; log when `ondernemersvandekamp.nl` is cited. Chunk-tuning lives in `aeo.md`. |
| **Crawl-log check** | Are AI bots (GPTBot, ClaudeBot, PerplexityBot) actually fetching? | Cloudflare Workers logs / Logpush filtered by user-agent — confirms `robots.ts` allow-list works. |

**Monthly SEO review ritual:**
1. GSC: queries gaining/losing position; rich-result errors? pages dropped from index?
2. CWV field data (GSC + Cloudflare) within §8 targets?
3. AI-mention panel: citation-rate trend.
4. NAP/citation spot-check (3 random businesses).
5. Freshness: any business with `updatedAt` > 12 months → nudge owner (owner-ops).

---

## 11. Pre-merge & launch checklists + tooling

### Per-PR (any public route) checklist
- [ ] JSON-LD present + valid (Rich Results Test + Schema.org validator).
- [ ] `<title>`, `description`, `canonical` set via `generateMetadata`.
- [ ] No hardcoded NAP — reads from `site.ts` / `businesses.ts`.
- [ ] New route TYPE registered in `sitemap.ts` with real `lastModified`.
- [ ] No `aggregateRating`/`review` on business pages.
- [ ] CWV not regressed (no unsized images, no new render-block).
- [ ] `lang` correct; if EN, reciprocal `hreflang`.

### Launch checklist (launch epic owns)
- [ ] `lang="nl"` on `<html>`.
- [ ] `SITE.social.instagram` + `SITE.social.facebook` filled (else Organization `sameAs` is empty — no entity anchor).
- [ ] District `sameAs` (OSM/Wikidata) added.
- [ ] `dateModified` live on business + district nodes.
- [ ] GSC + Bing verified, sitemaps submitted.
- [ ] `placeId` shipped (even before review display).
- [ ] Robots allow-list confirmed in Cloudflare logs.
- [ ] All canonicals point to `https://ondernemersvandekamp.nl` (not the `*.workers.dev` preview).

### Tooling
- **Google Rich Results Test** — https://search.google.com/test/rich-results (per route, rendered HTML).
- **Schema.org Validator** — https://validator.schema.org/.
- **Google Search Console** + **Bing Webmaster Tools** — index + query data.
- **PageSpeed Insights** / **unlighthouse** — CWV against the `preview:cf` Workers URL.
- **Cloudflare Web Analytics** — GDPR-clean field data.
- **Screaming Frog (free ≤500 URLs)** or **Sitebulb** — crawl audit: canonicals, hreflang reciprocity, orphans, faceted-URL leaks.
- **Merkle hreflang Testing Tool** — when bilingual ships.
- **Wikidata / OpenStreetMap** — entity `sameAs` anchoring.

---

## 12. Internal-linking architecture

Topical authority comes from a deliberate link graph, not just navigation.

```
                         Home (/)  ── ItemList of all businesses
                          │  │  │
        ┌─────────────────┘  │  └─────────────────┐
   /categorie/[slug]   /over-de-kamp /praktisch   /kaart
   (ItemList, FAQ)     (district entity, FAQ)      (ItemList)
        │                     │
        ▼                     ▼
  /ondernemers/[id] ◀────── isPartOf #district   (every business → district entity)
        │  ▲
        │  └── /verhalen/[story]   (Article.about → business; business → its story)
        ▼
  /loop-de-kamp   (TouristTrip hasPart → each stop's LocalBusiness @id)
  /agenda         (Event.organizer → Organization; Event.location → #district)
```

Rules every epic follows:
- **Entity links via `@id`, not just `<a href>`.** `isPartOf` (business→district, already emitted), `about` (story→business), `location`/`organizer` (event→district/org), `author`=`founder` `@id` (story→person). These connect entities in the AI graph.
- **Every business page links** to: its category, the district (`/over-de-kamp`), the map, and — when it exists — its story.
- **Category pages link** to every member business + back to home + related categories.
- **`/loop-de-kamp`** links each stop to its business detail (and `hasPart` `@id` in TouristTrip schema, to be added).
- **Owner stories** link to the subject business and vice-versa (reciprocal).
- **No orphan pages.** Every new route is reachable from ≥1 indexable page AND the sitemap.
- **Descriptive anchor text** (business name + what it is), never bare "lees meer".

---

## 13. Applies-to-epics summary

| Epic | Primary SEO/GEO/AEO obligations (detail in §2) |
|---|---|
| **launch** | `lang`, `SITE.social`, district `sameAs`, `dateModified`, GSC/Bing verify, `placeId` column, canonical audit |
| **cadeaukaart** | GiftCard/Product schema, Service node, keep FAQ |
| **google-reviews** | `placeId` model, GBP OAuth, compliant widget (Maps link + logo), NO self-serving markup, review-acquisition |
| **agenda** | Event + EventSeries schema, past-event de-index, `llms.txt` events section |
| **owner-story** | Article schema, author=founder `@id`, reciprocal internal links, `llms.txt` stories section |
| **newsletter** | `noindex` transactional routes only |
| **bilingual** | hreflang, `[locale]`, `inLanguage`, reciprocal canonicals |
| **design-system** | CWV guardrails, image sizing, no CLS |
| **analytics** | Measurement loop (GSC, Bing, CF Analytics, AI-mention panel) |
| **owner-ops** | `updatedAt` freshness bumps, NAP-format validation, citation consistency, review responses |
| **discovery** | Faceted indexing rules, keep filters client-side, SearchAction canonical, TouristTrip on `/loop-de-kamp` |

---

*This playbook is the search/entity/local/measurement contract. For answer-engine chunking, `llms.txt` structure, speakable markup, and AI-citation copy patterns, see the dedicated **AEO Playbook** (`aeo.md`). The two reinforce each other — classic SEO and AEO are not separate programs.*

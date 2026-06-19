# AEO Playbook — Answer Engine Optimization for Ondernemers van de Kamp

> **ID:** `aeo` · **Status:** Standard (cross-cutting). Every epic MUST follow this.
> **Owner:** SEO/GEO/AEO lead. **Reviewers:** Engineering (Frontend), Content/Localization, Data/Analytics.
> **Last reviewed:** 2026-06-19. **Refresh cadence:** quarterly, or whenever an epic ships a new public route.

## 0. What AEO means for this project

AEO (Answer Engine Optimization) is the discipline of getting **cited as the answer** inside generative engines — ChatGPT / OpenAI search, Perplexity, Google AI Overviews + AI Mode, Gemini, and Microsoft Copilot — not just ranked in a blue-link list. For a hyper-local guide like De Kamp, the queries we must win are conversational and local: *"waar kan ik leuk lunchen op De Kamp Amersfoort"*, *"welke winkels zijn nu open in de binnenstad van Amersfoort"*, *"is er een koopzondag op De Kamp deze maand"*, *"Italiaans restaurant Kamp Amersfoort reserveren"*.

This site already ships a strong structured-data and crawlability foundation (see the SEO/GEO/AEO current-state inventory). This playbook turns that foundation into a **repeatable standard** so every roadmap epic ships answer-ready, and defines the freshness, entity, and measurement discipline that 2026 AI engines reward.

**The three levers, in priority order for this project:**
1. **Extractability** — direct, 40–60 word answers + matching FAQPage/QAPage schema, so an engine can lift a sentence and cite us.
2. **Entity clarity** — De Kamp, the Organization, and each LocalBusiness are unambiguous entities with `@id`, `sameAs`, and consistent NAP, so engines map the knowledge graph correctly.
3. **Freshness** — `dateModified` everywhere + a maintained refresh cadence, because ~83% of AI citations are pages updated within 12 months and >60% within 6 months.

---

## 1. Principles (the non-negotiables)

- [ ] **Answer-first.** Every page and every FAQ answer leads with the direct answer in the first sentence. No throat-clearing intros before the fact.
- [ ] **40–60 word extractable chunks.** Each FAQ answer, `shortDescription`, and `SeoIntro` paragraph targets 40–60 words — long enough to be a complete answer, short enough to be lifted verbatim as a citation.
- [ ] **Visible == structured.** Never emit FAQPage/QAPage/Event schema for content that isn't visible on the page. Google's 2024+ rule and engine trust both require parity. The codebase comment in `src/lib/schema.ts` already states this ("never emit data that isn't true on the page") — enforce it in review.
- [ ] **Never fabricate ratings.** `aggregateRating`/`review` stay out of `localBusinessSchema()` (the self-serving-review policy makes them ineligible for star snippets anyway). Reviews are a reputation/UX signal surfaced via the Google-reviews epic, not a schema lever. See `google-reviews` playbook.
- [ ] **Entity-first, NAP-locked.** All NAP flows from `src/lib/site.ts` (guide) and `src/data/businesses.ts` → `src/lib/businessData.ts` merge (per-business). No hardcoded addresses/phones in JSX or schema.
- [ ] **Fresh by default.** Every entity node that can change carries `dateModified`. Approved owner edits bump `updatedAt`. Stale pages are a measured defect, not an accepted state.
- [ ] **AI bots stay welcome.** Keep GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Google-Extended, ClaudeBot, Claude-Web, Applebot-Extended, Bingbot allowed in `src/app/robots.ts`. The trade is explicit (see §7).
- [ ] **Fast + server-rendered.** AI crawlers do not run heavy client JS reliably. Keep the answer content in SSR/SSG HTML (it already is — JSON-LD and FAQ copy render server-side). Client components like `OpenBadge` must never be the *only* place a fact appears.

---

## 2. Content structure standard (the answer-first pattern)

### 2.1 The 40–60 word answer chunk

This is the atomic unit of AEO for this site. Apply it to: every FAQ answer (`buildFaqs()` in `src/lib/related.ts`, the static FAQs on `/praktisch`, `/over-de-kamp`, `/categorie/[slug]`, `/cadeaukaart`), every `shortDescription` in the seed, and every page intro.

**Template (Dutch):** `[Direct antwoord op de vraag in één zin]. [1–2 zinnen concrete details: adres/straat, openingstijden, prijsklasse of specialiteit]. [Optionele call-to-action of verwijzing].`

**Good (52 words):**
> Op De Kamp in Amersfoort vind je circa 67 onafhankelijke zaken: restaurants en wereldkeukens, koffie- en lunchplekken, winkels, makers en verzorging. De straat Kamp begint bij de 13e-eeuwse Kamperbinnenpoort en loopt de oude binnenstad in. De meeste zaken zijn dinsdag tot zaterdag open; op koopzondagen ook op zondag.

**Bad (too vague, no liftable fact):**
> De Kamp is een gezellige plek met van alles te beleven voor jong en oud. Kom vooral eens langs!

### 2.2 Per-route answer-chunk audit

| Route | Answer-chunk source | Standard |
|---|---|---|
| `/ondernemers/[id]` | `shortDescription` + `buildFaqs()` | 1-line answer-first description; each generated FAQ 40–60 words |
| `/categorie/[slug]` | `SeoIntro` + 2 auto FAQs | Intro answers "wat voor zaken vind je hier"; FAQs 40–60 words |
| `/praktisch` | 5 FAQs (parkeren, OV, openingstijden, toegankelijkheid, bezienswaardigheden) | Each ≤60 words; lead with the fact (e.g. "Parkeer in Q-Park Eemplein, 5 min lopen.") |
| `/over-de-kamp` | District description + 3 FAQs | History answer-first; entity-dense (jaartal, straatnamen, poort) |
| `/agenda` | per-event description | Date + what + where in first sentence (agenda epic) |

**Review gate:** any PR adding/editing FAQ copy must include a word count in the description for each answer. Reject answers <30 or >80 words unless justified.

### 2.3 Conversational + near-me + local intent

Write headings and FAQ questions the way people *ask* engines, not the way SEOs write keywords:
- "Welke restaurants op De Kamp zijn nu open?" (not "Restaurants De Kamp openingstijden")
- "Waar kan ik parkeren bij De Kamp in Amersfoort?"
- "Is er deze maand een koopzondag in de binnenstad van Amersfoort?" (agenda epic)
- "Welke cadeaubon kan ik in de hele binnenstad van Amersfoort gebruiken?" (cadeaukaart epic)

Near-me intent is served by the **entity + geo** stack (§3) plus the Google-reviews/local-pack work — there is no on-page "near me" copy needed, but every business node must carry `geo`, `address`, and `areaServed: Amersfoort` (it already does in `localBusinessSchema()`).

---

## 3. Schema standard (machine extraction)

The contract lives in `src/lib/schema.ts`, rendered via `<JsonLd>` (`src/components/JsonLd.tsx`), wrapped in a single `@graph` by `graph(...)`. Extend it additively — never break existing nodes.

### 3.1 Current coverage (keep green)

`Organization`, `WebSite`+`SearchAction`, `Place`+`TouristAttraction` (district), `LocalBusiness` (+ subtypes via `business.schemaType`), `BreadcrumbList`, `ItemList`, `FAQPage`. All correct. `aggregateRating`/`review` correctly absent.

### 3.2 Required additions (each tied to an epic — see §9)

#### A. `dateModified` on entity nodes — **do this first, applies to every epic**

Add a freshness timestamp to the nodes that change. This is a ~3-line change with outsized AEO impact.

```ts
// src/lib/schema.ts — inside localBusinessSchema(business)
// after node.isPartOf = { "@id": ID.district };
if (business.updatedAt) node.dateModified = new Date(business.updatedAt).toISOString();
```

```ts
// districtPlaceSchema(businessCount, lastModified?: number)
// emit a site-level freshness signal based on the newest approved override
dateModified: new Date(lastModified ?? Date.now()).toISOString(),
```

Pass the freshest `updatedAt` across all active businesses into `districtPlaceSchema()` from `src/app/page.tsx` and `/over-de-kamp`. **Policy:** every approved owner edit (`moderateOverride` → ISR window) already updates the merged `updatedAt`; the moderation panel should surface a "laatst ververst" timestamp so admins can see staleness.

#### B. `sameAs` on the district + Organization — **applies to: launch, discovery**

`districtPlaceSchema()` has no `sameAs`. Anchor "De Kamp, Amersfoort" in public knowledge graphs:

```ts
sameAs: [
  "https://www.wikidata.org/wiki/Q...",            // De Kamp / Amersfoort binnenstad Q-number — verify
  "https://www.openstreetmap.org/way/...",          // the Kamp street way
  "https://nl.wikipedia.org/wiki/Kamperbinnenpoort",
],
```

Also fill `SITE.social.instagram` / `SITE.social.facebook` in `src/lib/site.ts` before launch so `organizationSchema().sameAs` is non-empty (it currently emits `[]` because both strings are blank). Without these the guide has **no cross-web identity anchor** and engines may conflate it with generic "De Kamp" mentions.

#### C. `eventSchema()` → move to `schema.ts` and extend — **applies to: agenda**

Today the Event builder is inline in `src/app/agenda/page.tsx` and not reusable/exported. Move and export it, and add an `EventSeries` builder for recurring events (koopzondagen, weekmarkt) — these fire year-round and answer high-frequency "things to do in Amersfoort" queries.

```ts
// src/lib/schema.ts
export function eventSchema(e: KampEvent): Json {
  return {
    "@type": "Event",
    "@id": `${SITE.url}/agenda#${e.id}`,
    name: e.title,
    description: e.description,           // keep 40–60 words, answer-first
    startDate: e.startAt,                 // ISO 8601, gate emission on this
    ...(e.endAt ? { endDate: e.endAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: "De Kamp, Amersfoort", "@id": ID.district,
      address: { "@type": "PostalAddress", addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: SITE.country } },
    organizer: { "@id": ID.organization },
    ...(e.businessId ? { performer: { "@id": `${businessUrl(e.businessId)}#business` } } : {}),
    ...(e.image ? { image: abs(e.image) } : {}),
    ...(e.offersUrl ? { offers: { "@type": "Offer", url: e.offersUrl, price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock" } } : {}),
  };
}

export function eventSeriesSchema(name: string, sub: KampEvent[]): Json {
  return { "@type": "EventSeries", "@id": `${SITE.url}/agenda#series-${slug(name)}`,
    name, organizer: { "@id": ID.organization }, subEvent: sub.map(eventSchema) };
}
```

#### D. `Article`/`BlogPosting` for owner stories — **applies to: owner-story**

Each story page needs an Article node whose `author` links to the business's founder Person node, plus `datePublished` + `dateModified`. This makes stories citable as named-entity content ("volgens [eigenaar] van [zaak]…").

```ts
export function articleSchema(a: OwnerStory): Json {
  return {
    "@type": "Article",
    "@id": `${SITE.url}/verhalen/${a.slug}#article`,
    headline: a.headline,                       // ≤110 chars
    description: a.dek,                          // 40–60 word answer-first dek
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    author: { "@type": "Person", name: a.authorName,
      "@id": `${businessUrl(a.businessId)}#founder` },  // link to LocalBusiness.founder
    publisher: { "@id": ID.organization },
    about: { "@id": `${businessUrl(a.businessId)}#business` },
    ...(a.image ? { image: abs(a.image) } : {}),
    inLanguage: a.locale ?? SITE.lang,
  };
}
```

To make the `author @id` resolve, give the founder Person a stable `@id` in `localBusinessSchema()`:
```ts
node.founder = { "@type": "Person", "@id": `${businessUrl(business.id)}#founder`, name: business.publicPersonName };
```

#### E. `Speakable` on factual pages — **applies to: discovery, launch**

Add `SpeakableSpecification` to `/over-de-kamp` (district description) and `/praktisch` (top 2–3 FAQ answers). Low effort, forward-compatible with voice/AI reading; signals the canonical factual description.

```ts
export function speakableSchema(cssSelectors: string[]): Json {
  return { "@type": "WebPage", speakable: { "@type": "SpeakableSpecification", cssSelector: cssSelectors } };
}
// usage on /praktisch: speakableSchema([".faq-answer", ".district-lede"])
```

#### F. `TouristTrip`/`ItemList`+`hasPart` on `/loop-de-kamp` — **applies to: discovery**

The walking route emits only `BreadcrumbList`. Add an itinerary node linking each stop's LocalBusiness `@id` — a strong AEO answer for "wat kun je doen op De Kamp" / "wandelroute Amersfoort binnenstad".

```ts
export function touristTripSchema(stops: Business[]): Json {
  return { "@type": "TouristTrip", "@id": `${SITE.url}/loop-de-kamp#trip`,
    name: "Loop De Kamp — wandelroute door de binnenstad van Amersfoort",
    description: "Een wandelroute van circa 350 meter langs de zaken op De Kamp, beginnend bij de Kamperbinnenpoort.",
    touristType: "Local exploration",
    itinerary: { "@type": "ItemList", numberOfItems: stops.length,
      itemListElement: stops.map((b, i) => ({ "@type": "ListItem", position: i + 1,
        item: { "@type": "Place", "@id": `${businessUrl(b.id)}#business`, name: b.name } })) } };
}
```

#### G. `QAPage` vs `FAQPage` — **clarification**

Keep using **`FAQPage`** for our curated Q&A (we author both question and answer). Reserve `QAPage` for any future user-asked single-question page (not on the roadmap). Do not mix the two on one page.

#### H. `Service` node on `/aanmelden` — **applies to: owner-ops**

Describe the free listing service to win B2B queries ("mijn zaak aanmelden De Kamp"):
```ts
{ "@type": "Service", name: "Gratis vermelding op Ondernemers van de Kamp",
  provider: { "@id": ID.organization }, areaServed: { "@type": "City", name: SITE.city },
  serviceType: "Bedrijfsvermelding", offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" } }
```

#### I. `GiftCard`/`Product` on `/cadeaukaart` — **applies to: cadeaukaart**

When the gift card is live, add a Product/gift-card node with `offers` (price, EUR, `availability`) and a purchase deep-link, plus keep the 3 FAQs answer-first.

### 3.3 Schema validation gate (CI + manual)

- [ ] Validate every public route's `@graph` with the [Schema.org validator](https://validator.schema.org/) and [Google Rich Results Test](https://search.google.com/test/rich-results) on each schema PR.
- [ ] Add a Vitest unit test per builder asserting required keys + `@id` shape (ties into the analytics/QA test suite). Example: `localBusinessSchema(b)["@id"]` ends with `#business`; `dateModified` is a valid ISO string when `updatedAt` is set.

---

## 4. Entity & NAP standard

- [ ] **Single source of truth.** Guide NAP from `SITE` in `src/lib/site.ts`; per-business NAP from the seed + approved-override merge (`businessData.ts`). Never inline.
- [ ] **Stable `@id`s.** Organization `#organization`, WebSite `#website`, district `#district`, each business `…#business`, each founder `…#founder`. Cross-link with `@id` references (`isPartOf`, `publisher`, `author`, `about`). These are the edges of our knowledge graph — keep them stable across deploys.
- [ ] **`sameAs` everywhere identity exists.** Org → guide socials. Business → website + Instagram + Facebook (already filtered for truthiness in `localBusinessSchema()`). District → Wikidata/OSM/Wikipedia (§3.2.B).
- [ ] **NAP automated check.** Add a unit test asserting the postal area, city, region, and country emitted in `localBusinessSchema()` and `districtPlaceSchema()` match `SITE`. This closes the "no NAP-anchor enforcement" gap from the backend audit. Run in CI on every PR touching `schema.ts`, `site.ts`, or the seed.
- [ ] **Topical authority via internal linking.** Every business page links to its category; every category links to related categories and to `/over-de-kamp` and `/praktisch`; `/loop-de-kamp` links to each stop. This cluster structure tells engines we are *the* authority on De Kamp. Use the planned `src/lib/nav.ts` single-source nav array so links don't drift. Add contextual in-body links (e.g. a restaurant page links "meer eten & drinken op De Kamp" → category), not just nav chrome.

---

## 5. Freshness standard (the citation multiplier)

Because >83% of AI citations are <12-months-old pages and >60% <6-months, treat freshness as a first-class, measured property.

### 5.1 Mechanics
- [ ] **On-page `dateModified`** on LocalBusiness, district, Article, Event nodes (§3.2.A/C/D).
- [ ] **Sitemap `lastModified`** already comes from `b.updatedAt` — keep it accurate (don't let it silently fall back to `now()`; a missing `updatedAt` is a seed data defect to fix).
- [ ] **ISR window** `revalidate=300` already refreshes within 5 min of an approved edit. When the `d1-next-tag-cache` override lands (launch epic), approved edits invalidate **instantly** — pair the moderation approval with `revalidatePath()` so the public node's `dateModified` updates the moment an owner edit goes live.
- [ ] **llms.txt** is regenerated from live data each request (`force-static`, 1h cache) — inherently fresh. Extend it per epic (§6).

### 5.2 Refresh cadence (who keeps pages young)

| Cadence | Action | Owner |
|---|---|---|
| Continuous | Owner edits via `/beheer` → approval bumps `updatedAt` | Owners + Admin moderation |
| Weekly | Agenda: publish/expire events so `/agenda` `dateModified` moves every week | Owner-ops / Admin |
| Monthly | Publish ≥1 owner story → fresh Article `dateModified` + new internal links | Content |
| Quarterly | Review `/praktisch`, `/over-de-kamp`, category intros for accuracy; bump copy + `dateModified` | SEO/Content |
| Quarterly | This playbook + schema validation sweep | SEO lead |

**Staleness alarm:** Data/Analytics builds a report flagging any business with `updatedAt` older than 9 months for an owner-prompt re-engagement email (ties to newsletter + owner-ops epics).

---

## 6. llms.txt strategy

`/llms.txt` (`src/app/llms.txt/route.ts`) is already a dense, data-driven AI index (district paragraph, important pages, categories with counts, per-business lines with address/hours/price/specialties/URL). Keep it **fresh-from-data** (never hand-maintained) and **extend per feature/locale**.

- [ ] **Agenda epic:** inject a `## Evenementen` section listing upcoming events (date — title — where — URL), generated from the live events table. "What's on in Amersfoort" queries read this directly.
- [ ] **Owner-story epic:** add a `## Verhalen` section (title — business — URL — dateModified).
- [ ] **Cadeaukaart epic:** the line already exists; once live, add a price/where-to-use one-liner.
- [ ] **Bilingual epic:** when EN ships, serve a locale-aware variant or a parallel `## English` block, and add the EN canonical URLs.
- [ ] **Reviews epic:** do **not** dump review text into llms.txt (Places API caching policy). A neutral "reviews op Google" pointer per business is fine; review *content* stays link-out only.
- [ ] **Discipline:** every business line stays one parseable row (`name — subcategory; address; hours; price; specialties; URL`). Don't bloat into paragraphs.
- [ ] **Optional companion:** consider a `/llms-full.txt` with full descriptions if engines start honoring it; keep `/llms.txt` lean as the index.

---

## 7. Crawlability for AI bots

`src/app/robots.ts` explicitly allows the major AI crawlers. **Keep it that way** — that is the price of admission to AI citations.

- [ ] Allowed (keep): GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Google-Extended, ClaudeBot, Claude-Web, Applebot-Extended, Bingbot.
- [ ] **The trade, stated plainly:** allowing these bots means our content can be used to train and to answer in their products *without a per-query backlink guarantee*. For a free local guide whose goal is **discovery and owner acquisition**, citation/mention reach outweighs the lost training-data control. The content is public-by-design; there is no proprietary moat to protect. **Decision: allow.** Revisit only if an engine starts materially substituting our traffic with zero attribution (measure in §10).
- [ ] **Performance is crawlability.** Keep answer content in SSR/SSG HTML (JSON-LD + FAQ copy already are). Don't regress a key fact into client-only state. The auth-gated `/beheer` and `/admin` are crawlable but contain no sensitive HTML — acceptable; do **not** add `noindex` confusion that risks the public routes.
- [ ] **Don't block on a CDN/WAF rule.** When the `/login` rate-limit WAF rule lands (launch epic), scope it to the `/login` POST only — never to GET pages or to AI user-agents.

---

## 8. Bilingual (EN) AEO — applies to: bilingual

- [ ] Set `<html lang="nl">` in `layout.tsx` now (zero-cost prerequisite; currently unset).
- [ ] When EN content exists, add `metadata.alternates.languages` (`nl`, `en`, `x-default`) on every page so engines serve the right-language answer and don't dilute on duplicate content.
- [ ] Mirror schema in EN: `inLanguage: "en"` on Article/WebPage nodes; EN `description`/FAQ copy following the same 40–60 word rule.
- [ ] Extend llms.txt (§6) and add EN canonical URLs to the sitemap.
- [ ] **Don't ship EN schema for pages without EN visible content** — the parity rule applies per locale.

---

## 9. Applies-to-which-epic matrix

| Epic | AEO obligations from this playbook |
|---|---|
| **launch** | Fill `SITE.social` for Org `sameAs`; add district `sameAs` (§3.2.B); `dateModified` on all nodes (§3.2.A); `<html lang>`; wire `d1-next-tag-cache` so freshness is instant; schema validation sweep; keep AI bots allowed |
| **cadeaukaart** | Product/gift-card + `offers` schema (§3.2.I); 3 FAQs answer-first; llms.txt line; conversational "cadeaubon binnenstad Amersfoort" intent |
| **google-reviews** | Reputation/UX signal only — **no `aggregateRating` schema** (self-serving); reviews surfaced via GBP/Maps link-out per `google-reviews` playbook; do not cache review text in llms.txt |
| **agenda** | Move/extend `eventSchema()` + `eventSeriesSchema()` (§3.2.C); per-event 40–60 word answer-first description; `## Evenementen` in llms.txt; weekly freshness cadence |
| **owner-story** | `articleSchema()` with founder `@id` author link (§3.2.D); monthly publish cadence; `## Verhalen` in llms.txt; internal links story↔business↔category |
| **newsletter** | Re-engagement email to owners with stale `updatedAt` (§5.2) to drive content freshness; no direct schema |
| **bilingual** | hreflang + `inLanguage` + EN answer chunks + EN llms.txt (§8) |
| **design-system** | Render answer chunks in SSR HTML; add `shortDescription` excerpt to `BusinessCard` (per-card entity signal); expose `.faq-answer`/`.district-lede` selectors for Speakable (§3.2.E) |
| **analytics** | AI-visibility measurement: citations, mentions, share-of-answer, crawler-hit logging (§10) |
| **owner-ops** | `Service` node on `/aanmelden` (§3.2.H); moderation "laatst ververst" timestamp; staleness re-engagement workflow |
| **discovery** | `TouristTrip` on `/loop-de-kamp` (§3.2.F); Speakable; conversational/near-me question phrasing; internal-link topical cluster |

---

## 10. Measurement — AI visibility (applies to: analytics)

Classic rank tracking misses AI answers. Track **citations, mentions, and share-of-answer**.

### 10.1 Manual prompt panel (start here, zero cost)
Maintain a fixed list of ~25 target prompts (NL + later EN) and check monthly across ChatGPT, Perplexity, Google AI Mode, Gemini, Copilot. Log: cited? (URL appears), mentioned? (brand/business named), position, competitor cited instead.

| Prompt | Engine | Cited URL? | Mentioned? | Notes |
|---|---|---|---|---|
| "leuke lunch De Kamp Amersfoort" | Perplexity | ✓ /categorie/koffie-lunch | ✓ | |
| "welke winkels binnenstad Amersfoort nu open" | ChatGPT | ✗ | ✓ district | push hours/now-open content |
| "koopzondag Amersfoort deze maand" | Google AI Mode | — | — | needs agenda epic |

Store in a simple D1 table or a tracked spreadsheet; chart the monthly trend (share-of-answer = cited prompts / total prompts).

### 10.2 Crawler-hit logging (Cloudflare-native)
- [ ] Use **Cloudflare Workers logs / Logpush** (or a lightweight Worker counter into D1) to record requests from GPTBot, PerplexityBot, ClaudeBot, Google-Extended, OAI-SearchBot user-agents. Rising AI-bot crawl frequency on fresh pages is a leading indicator of citation eligibility. EU-resident, no third party.
- [ ] Watch for **`ChatGPT-User` / `Perplexity-User`** hits — these are *real-time fetches triggered by a user's question*, i.e. direct evidence an engine is reading us to answer someone right now.

### 10.3 Referral + GSC
- [ ] Track referral traffic from `chat.openai.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com` in analytics (EU-resident — e.g. Plausible EU or Cloudflare Web Analytics; ties to analytics epic).
- [ ] In Google Search Console, monitor impressions/clicks on FAQ-style and "near me" queries as a proxy for AI Overview inclusion.

### 10.4 Tooling options (lean budget)
| Need | Free / cheap | Paid (if budget allows) |
|---|---|---|
| Schema validation | validator.schema.org, Rich Results Test | — |
| AI-citation tracking | manual prompt panel | Otterly.ai / Peec.ai / Profound (verify EU data terms first) |
| Crawler logs | Cloudflare Logpush → D1 | — |
| Rank/impressions | Google Search Console (free) | — |
| Referral analytics | Cloudflare Web Analytics / Plausible EU | — |

---

## 11. Definition of done (per epic, AEO checklist)

Copy this into every epic's PR template:

- [ ] New/changed public route emits a valid `@graph` (validator + Rich Results pass).
- [ ] All new schema nodes have stable `@id`s and cross-link via `@id` where applicable.
- [ ] `dateModified` present on every node that can change.
- [ ] Every new FAQ/answer/description is answer-first and 40–60 words (word counts in PR).
- [ ] Visible content == structured content (parity verified).
- [ ] NAP flows from `SITE`/seed only; NAP unit test passes.
- [ ] Internal links added to the topical cluster (category ↔ business ↔ district).
- [ ] llms.txt extended if the epic adds a content type.
- [ ] AI bots still allowed; answer content in SSR/SSG HTML.
- [ ] Target prompts added to the §10 measurement panel.

---

## 12. Quick reference — file map

| Concern | File |
|---|---|
| Schema builders | `src/lib/schema.ts` |
| Schema render | `src/components/JsonLd.tsx` |
| NAP / entity source | `src/lib/site.ts` |
| AI index | `src/app/llms.txt/route.ts` |
| Sitemap (lastModified) | `src/app/sitemap.ts` |
| AI-bot rules | `src/app/robots.ts` |
| Metadata / hreflang | `src/app/layout.tsx` + per-page `generateMetadata` |
| FAQ generation | `src/lib/related.ts` (`buildFaqs`) |
| Categories / clusters | `src/lib/categories.ts` |
| Business data merge | `src/lib/businessData.ts`, `src/data/businesses.ts` |

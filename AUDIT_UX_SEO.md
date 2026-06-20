# UX/UI + SEO/GEO/AEO/E-E-A-T Audit — Ondernemers van de Kamp

_Generated 2026-06-20 · 24-agent adversarially-verified audit · live: https://ondernemers-van-de-kamp.jezzacooks.workers.dev_

> Every 🔴/🟠 finding below was independently re-checked against the actual code by a second agent. The `verify` tag shows the verdict and any severity correction.

---

## TL;DR — answers to your three questions

### 1. How are spotlights organised — is it the best?
Verdict: the spotlight UX is strong but the SELECTION model is the weakest commercially-important part of the site, and it is the only major module that is wired wrong. Confirmed against code:

HOW THEY'RE ORGANISED: `src/components/FeaturedHorizontal.tsx:8` does `businesses.filter((b) => b.featured && b.status !== "closed").slice(0, 8)` — it imports the RAW static seed (`src/components/FeaturedHorizontal.tsx:3` `import { businesses } from "@/data/businesses"`), NOT the override-aware `getActiveBusinesses()`. Exactly 6 businesses carry `"featured": true` (toko-tjin, flups, de-tafelaar, awaze, dhome-de-winkel, annas-smaakatelier — confirmed at businesses.ts lines 382/656/1365/5676/6751/9337), so the SAME 6 render in the SAME seed order forever. No sort, no rotation, no rating signal, no rotation, no empty-state guard.

IS IT THE BEST? No, for three concrete reasons:
1. NOT runtime-controllable. `featured` and `sortOrder` are absent from `EDITABLE_FIELDS` (src/lib/overrides.ts:10-20) and there is zero `featured` reference in src/app/admin or src/app/beheer. Changing who is spotlighted requires a code edit + redeploy. For the most contested placement in a 67-business directory, this is the least flexible surface — and it kills any future "feature your business" monetisation.
2. It BYPASSES D1+ISR (confirmed). Because it reads the seed directly, an approved owner edit (new description, or a status→closed change) shows in the main grid but NOT in the spotlight card until redeploy. This is a real freshness/consistency bug, not just a design gap. Fix is small: make FeaturedHorizontal a server component that takes the featured subset computed from `getActiveBusinesses()` in page.tsx (the pattern WandelShowcase already uses).
3. STALE + UNFAIR. The same 6 shops monopolise the homepage internal-link equity; the other ~60 never rotate in.

Decisive changes: (a) compute featured from `getActiveBusinesses()` in page.tsx and pass as a prop so overrides+ISR apply; (b) add `featured`/`featuredRank` as an admin-only override field (the approved-override merge in setApprovedImage already proves non-EDITABLE keys can flow through D1); (c) add a date-seeded rotation over the featured pool + next-best-N so it stays fresh and fair; (d) add an empty-state guard so the big "In de spotlights" heading never renders above an empty scroller.

### 2. Are the Google reviews in / showing?
Verdict: the review DISPLAY code is real and well-built (not stubbed), but reviews are DARK on the live site — nothing shows today — because two gates are both closed. The good news: going live is a config/data task, not an engineering build.

WHAT'S BUILT (verified): `src/components/GoogleReviews.tsx` (rendered on detail pages at src/app/ondernemers/[id]/page.tsx:79 and the /en mirror) client-fetches `/api/reviews/[businessId]`, which reads `business_google.place_id` from D1 (src/app/api/reviews/[businessId]/route.ts:14-16) and calls the REAL Google Places API (New) endpoint `places.googleapis.com/v1/places/{id}` with FieldMask `rating,userRatingCount,googleMapsUri,reviews` (src/lib/places.ts:67-71). It is ToS-correct: force-dynamic + `Cache-Control: private, no-store` (route.ts:7,10), caps at 5 reviews (places.ts:45), renders Google attribution + Maps link (GoogleReviews.tsx:97-104), and deliberately emits NO AggregateRating JSON-LD (correct — avoids the self-serving-rating penalty).

WHY NOTHING SHOWS (both confirmed):
1. No Google Maps API key configured. `getGoogleMapsKey()` (src/lib/settings.ts) reads `s.google_maps_api_key || env.GOOGLE_MAPS_API_KEY`; neither is set (no `.dev.vars`, only `.dev.vars.example`; wrangler.jsonc lists no such secret). Without it `fetchPlaceReviews` returns null (places.ts:65). This is recoverable WITHOUT redeploy via /admin/instellingen (it's a D1 app_settings key), so severity is moderate, not critical.
2. Zero businesses have a place_id in the live path. `business_google` ships empty — migration 0005_google.sql has no seed INSERT, and the only writer is manual admin entry at /admin/google (reviews.ts:72-97). Seed place_ids exist only as substrings of `googleMapsUrl`, and only 2 of 67 contain a real `ChIJ…` code (grep `query_place_id=ChIJ` = 2: Indian Flavour line 4407, Belhadi). So even with a key, every business resolves no place_id and the route returns EMPTY → component returns null (GoogleReviews.tsx:61).

PRECISE STEPS TO GO LIVE: (1) Create a Google Maps Platform key with Places API (New) enabled + HTTP-referrer/API restrictions; set it once via /admin/instellingen (or `wrangler secret put GOOGLE_MAPS_API_KEY`). (2) Backfill place_ids: write a one-off script that parses the existing `query_place_id=ChIJ…` out of `googleMapsUrl` for the 2 that have one, then bulk-resolve the other ~65 via Places Text Search from name+address instead of hand-typing ChIJ codes in /admin/google. (3) Verify `GET /api/reviews/{id}` returns rating+reviews. Then reviews appear on every linked detail page.

Bonus already built: the review-ACQUISITION funnel (QR tokens via review_requests + `writeReviewUrl` deep link, reviews.ts:19-21,99-136) — use it to GROW genuine Google reviews, the right long-term GEO move.

### 3. Is this the best SEO / E-E-A-T / AEO / GEO to get picked up in Amersfoort ASAP?
Verdict: the on-page SEO/E-E-A-T/AEO/GEO craftsmanship is genuinely top-tier for a local guide — BUT one catastrophic config defect means the site currently cannot rank in Amersfoort at all, and it overrides everything else.

THE BLOCKER (critical, confirmed): `src/lib/site.ts:13` `url: "https://ondernemersvandekamp.nl"` is the single source of truth feeding metadataBase (layout.tsx:21), every canonical, all hreflang, OG urls, JSON-LD @ids (schema.ts:16-20), sitemap base, and robots `Host`/`Sitemap`. That domain does NOT resolve (NXDOMAIN). The live site at jezzacooks.workers.dev therefore tells Googlebot that the authoritative version of every page lives on a host Google cannot fetch — so the real, crawlable pages read as duplicates of a dead canonical and nothing indexes. wrangler.jsonc:35 also sets NEXT_PUBLIC_SITE_URL to the same dead .nl host, confirming .nl is the intended production domain. Until DNS points at the Worker (or SITE.url is set to the live origin), every other SEO win is wasted. Note: a `getConfiguredSiteUrl()` helper exists but is wired ONLY to transactional/email flows, never to the SEO surfaces — so this is genuinely a one-line/one-DNS fix.

WHAT'S ALREADY EXCELLENT (don't touch): unique per-route titles/descriptions, self-canonicals, NL/EN hreflang on detail pages, a clean @graph (Organization + WebSite/SearchAction + district Place/TouristAttraction + per-business LocalBusiness SUBTYPES with geo/hours/address/sameAs + BreadcrumbList + FAQPage + ItemList), a 217-URL sitemap, AI-crawler-friendly robots (GPTBot/PerplexityBot/ClaudeBot allowed), live /llms.txt, FAQPage on 5 page types, and the honest "no fabricated ratings" rule. This is well above typical.

REAL REMAINING GAPS (all secondary to the domain, all confirmed):
- E-E-A-T trust: Organization has NO logo and an EMPTY sameAs (site.ts:25-28 socials are ""; schema.ts:32 filters to []). No GBP, no telephone, no PostalAddress on the guide entity — the largest local-EEAT corroboration gap. Footer carries only email.
- District Place node has no Wikidata/Wikipedia sameAs (schema.ts:60-84) — weakens AI entity-binding of "De Kamp" to Amersfoort.
- Homepage H1 is the slogan "De Kamp leeft." with zero local keywords (Hero.tsx:33-35) — the single strongest on-page signal spent on a tagline.
- Local authorities (Vrienden van de Kamp, Citymarketing) named in body copy but never hyperlinked — no citation equity. (gemeente + VVV ARE already linked via /agenda event URLs.)
- priceRange data is malformed prose with mixed €/$ (e.g. "Maatpakken vanaf ca. EUR499") passed verbatim into schema — can invalidate the property.
- Verhalen editorial pages emit only breadcrumb, no Article/author schema — missed Experience/Expertise signal.

Is it the BEST to get picked up in Amersfoort ASAP? After the domain fix and a GBP, yes — the foundation is there. Today, no, because of the dead canonical.

---

## Ranking-Amersfoort-ASAP plan (first 2 weeks)

Ordered first-2-weeks plan, specific to this codebase. Do them in this order — items 1-2 are hard gates; everything below is wasted until they're done.

DAY 1 (the unblock — highest leverage, smallest effort):
1. Fix the dead canonical. Decide the production domain. If ondernemersvandekamp.nl is the target, connect it in Cloudflare and point DNS at the Worker; otherwise set `src/lib/site.ts:13` SITE.url to the live workers.dev origin (and align wrangler.jsonc:35 NEXT_PUBLIC_SITE_URL). Verify the chosen origin returns 200 and serves matching canonical/OG/JSON-LD. This single change corrects metadataBase, canonicals, hreflang, OG, all JSON-LD @ids, sitemap and robots at once. WITHOUT THIS, NOTHING INDEXES.
2. Set up Search Console for the chosen domain, submit /sitemap.xml, request indexing of the homepage + top category pages.

DAYS 2-3 (the map-pack play — biggest local-SEO lever):
3. Create/claim a Google Business Profile for "Ondernemers van de Kamp" anchored at Kamperbinnenpoort. Decide a public NAP (phone + a district visiting address).
4. Wire that NAP + GBP into code: add logo + telephone + PostalAddress to `organizationSchema()` (schema.ts:23-34), fill SITE.social so sameAs is non-empty (site.ts:24-28), mirror phone+address in Footer.tsx:37. Add Wikipedia+Wikidata sameAs for Kamperbinnenpoort to `districtPlaceSchema` (schema.ts:60-84).

DAYS 3-4 (on-page relevance + spotlight correctness):
5. Rewrite the homepage H1 to be keyword+city bearing (Hero.tsx:33-35); demote 'De Kamp leeft.' to a tagline span. Fix the hardcoded '67' stat to the live count (96 open).
6. Fix the Hero LCP <img> (fetchPriority high + dimensions + preload; it's a raw 566KB JPG) — mobile CWV is a ranking factor here.
7. Make FeaturedHorizontal a server component fed by getActiveBusinesses() from page.tsx + add an empty-state guard, so the spotlight reflects D1 overrides/closures (currently it reads the raw seed and goes stale).

DAYS 5-7 (turn on reviews — the trust + GEO signal):
8. Set GOOGLE_MAPS_API_KEY (Places API New) via /admin/instellingen.
9. Backfill business_google.place_id: script-parse the 2 existing ChIJ codes from googleMapsUrl, then bulk-resolve the remaining ~65 via Places Text Search from name+address (don't hand-type in /admin/google). Verify GET /api/reviews/{id} returns data.

DAYS 8-10 (citations + i18n polish):
10. Hyperlink Vrienden van de Kamp + Citymarketing; pursue reciprocal listings from VVV Amersfoort / inAmersfoort / gemeente. Add x-default hreflang to every languages map and a self-canonical+x-default to the categorie template.
11. Normalize priceRange to EUR-bands (sanitize in schema.ts:163) to remove the invalid-property risk on LocalBusiness nodes.

DAYS 11-14 (AEO + E-E-A-T depth):
12. Add Article/author schema to /verhalen/[slug] (page.tsx:100-103). Add a homepage FAQ block + faqSchema and a visible 'Bijgewerkt op' freshness stamp. Add a cached 'X.X star (N)' badge to BusinessCard from business_google.cached_rating (refreshed on Cron), keeping NO AggregateRating JSON-LD.

This sequence gets the site indexable on Day 1, into the Amersfoort map pack by Day 3 via the GBP, and converting on trust signals by week 2.

---

## Quick wins (high impact, low effort)

**1. Fix the dead canonical domain — the #1 ranking blocker. Either point ondernemersvandekamp.nl DNS at the Cloudflare Worker, OR set SITE.url to the live workers.dev origin so canonicals/hreflang/OG/JSON-LD/sitemap/robots are self-consistent and indexable. Then submit the sitemap in Search Console.**
- Impact: Critical — unblocks ALL indexing; nothing ranks until this is done
- Effort: S — one line in src/lib/site.ts:13 (plus DNS or a redeploy)
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/lib/site.ts:13, /Users/jeremyarrascaeta/kmap site/kamp/wrangler.jsonc:35`

**2. Set the Google Maps API key (Places API New enabled) via /admin/instellingen or `wrangler secret put GOOGLE_MAPS_API_KEY`. First of the two review gates.**
- Impact: High — combined with place_ids, turns the review section live; no redeploy needed via D1 settings
- Effort: S
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/lib/settings.ts (getGoogleMapsKey), /Users/jeremyarrascaeta/kmap site/kamp/.dev.vars.example`

**3. Make the homepage H1 keyword + city bearing, e.g. H1 'De Kamp Amersfoort — winkels, restaurants & makers in de binnenstad' styled large, with 'De Kamp leeft.' demoted to a styled tagline span.**
- Impact: High — reclaims the strongest on-page signal for the head query 'winkelen De Kamp Amersfoort'
- Effort: S
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/components/Hero.tsx:33-35`

**4. Add an Organization logo (absolute square >=112px) and populate SITE.social (Instagram/Facebook/GBP) so sameAs is non-empty; add the district's Wikipedia+Wikidata sameAs for Kamperbinnenpoort.**
- Impact: Medium-High — unlocks Organization rich result + strengthens AI entity-binding of De Kamp
- Effort: S
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/lib/site.ts:24-28, /Users/jeremyarrascaeta/kmap site/kamp/src/lib/schema.ts:23-34 and :60-84`

**5. Convert FeaturedHorizontal to receive the featured subset computed from getActiveBusinesses() in page.tsx (server) instead of importing the raw seed, and add an empty-state guard. Fixes the spotlight freshness bug.**
- Impact: Medium — spotlight reflects approved D1 edits/closures; no stale cards; matches WandelShowcase pattern
- Effort: S
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/components/FeaturedHorizontal.tsx:3,8, /Users/jeremyarrascaeta/kmap site/kamp/src/app/page.tsx`

**6. Hyperlink 'Vrienden van de Kamp' and Citymarketing where named; add x-default hreflang (pointing at the NL URL) to every languages map and a self-canonical+x-default to the categorie template.**
- Impact: Medium — citation equity + cleaner i18n graph
- Effort: S
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/app/over-de-kamp/page.tsx:85, /Users/jeremyarrascaeta/kmap site/kamp/src/app/praktisch/page.tsx:37, /Users/jeremyarrascaeta/kmap site/kamp/src/app/categorie/[slug]/page.tsx:29`

**7. Fix the Hero LCP image: add fetchPriority="high" + explicit dimensions/aspect-ratio + a preload link (the JPG is an unoptimized 566KB raw <img>). Also fix the hardcoded '67 ondernemers' stat (site has 96 open) by feeding the live count.**
- Impact: Medium — improves mobile LCP/CLS (a ranking factor) and data consistency
- Effort: S
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/components/Hero.tsx:20 and :61`

## Bigger bets

**1. Backfill business_google.place_id for all ~67 businesses: a one-off script parsing existing query_place_id=ChIJ from googleMapsUrl (covers 2), then bulk-resolve the rest via Places Text Search from name+address. Second review gate — without this, reviews stay dark even with the key.**
- Impact: High — turns on live star ratings + reviews across all detail pages; powers the GEO trust signal
- Effort: M
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/migrations/0005_google.sql, /Users/jeremyarrascaeta/kmap site/kamp/src/lib/reviews.ts:72-97, new script in /Users/jeremyarrascaeta/kmap site/kamp/scripts/`

**2. Create + claim a Google Business Profile for the initiative (category e.g. shopping district / tourist information) anchored at Kamperbinnenpoort, plus add telephone + PostalAddress to organizationSchema and surface the same NAP in the Footer. Link the GBP via sameAs.**
- Impact: High — the single fastest way to win the 'winkelen De Kamp Amersfoort' map pack and corroborate the entity NAP
- Effort: M
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/lib/schema.ts:23-34, /Users/jeremyarrascaeta/kmap site/kamp/src/lib/site.ts:18-28, /Users/jeremyarrascaeta/kmap site/kamp/src/components/Footer.tsx:37`

**3. Make spotlighting admin-editable + rotating: add featured/featuredRank as admin-only override fields (the approved-override merge already supports non-EDITABLE keys, see setApprovedImage), add a toggle in /admin, and add a date-seeded rotation over the featured pool + next-best-N.**
- Impact: Medium-High — unlocks fair rotation, rewards onboarded shops, and a 'feature your business' monetisation path
- Effort: M
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/lib/overrides.ts:10-20,108-134, /Users/jeremyarrascaeta/kmap site/kamp/src/app/admin/, /Users/jeremyarrascaeta/kmap site/kamp/src/components/FeaturedHorizontal.tsx`

**4. Add Article/BlogPosting schema (headline, image, datePublished/dateModified, author, publisher->#organization) to /verhalen/[slug]; add a homepage FAQ block + faqSchema and a visible 'Bijgewerkt op' freshness signal.**
- Impact: Medium — E-E-A-T Experience/Expertise + 2026 AEO favours fresh, liftable homepage Q&A
- Effort: M
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/app/verhalen/[slug]/page.tsx:100-103, /Users/jeremyarrascaeta/kmap site/kamp/src/app/page.tsx, /Users/jeremyarrascaeta/kmap site/kamp/src/components/SeoIntro.tsx`

**5. Surface a compact 'X.X star (N)' rating badge on BusinessCard and a trust strip near the spotlight, fed by cached business_google.cached_rating/cached_count refreshed on a Cron/queue. (A numeric rating on cards is ToS-safe — it's a fact, not stored review text — keep emitting NO AggregateRating JSON-LD.)**
- Impact: Medium — major CTR/trust lift on listing cards; also adds a cost/rate-limit guard vs per-view Places calls
- Effort: M
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/components/BusinessCard.tsx, /Users/jeremyarrascaeta/kmap site/kamp/migrations/0005_google.sql (cached_rating/cached_count), /Users/jeremyarrascaeta/kmap site/kamp/src/app/api/reviews/[businessId]/route.ts`

**6. Normalize priceRange to a single EUR-band convention (sanitize in localBusinessSchema or clean the source data); move concrete starting prices into description/Offer.**
- Impact: Medium — removes invalid-property risk on the otherwise-clean LocalBusiness nodes
- Effort: S-M
- Files: `/Users/jeremyarrascaeta/kmap site/kamp/src/data/businesses.ts, /Users/jeremyarrascaeta/kmap site/kamp/src/lib/schema.ts:163`

---

## Full findings by dimension

### Featured / Spotlight business organisation & presentation

**Verdict:** Spotlights are organised by a single hard-coded boolean flag baked into the static seed. FeaturedHorizontal.tsx:8 does `businesses.filter((b) => b.featured && b.status !== "closed").slice(0, 8)` — it reads the raw seed array src/data/businesses.ts directly (line 3 imports `{ businesses }`, NOT the override-aware getActiveBusinesses). Exactly 6 businesses have `"featured": true` (toko-tjin, flups, de-tafelaar, awaze, dhome-de-winkel, annas-smaakatelier), so all 6 always appear, always in the same data-file order, forever. There is NO sortOrder applied inside the spotlight rail itself, NO rating signal, NO rotation, NO randomisation, and NO paid/priority tier. Selection is NOT editorially controllable at runtime: `featured` and `sortOrder` are absent from EDITABLE_FIELDS in overrides.ts:10-20, and there is no `featured` reference anywhere in src/app/admin or src/app/beheer. The only way to change who is spotlighted is a code edit + redeploy. Visually the rail is strong (horizontal scroller, big serif heading, mobile-friendly 300px cards, motion reveal, deep links to /ondernemers/[id]), so UX and internal-linking/SEO value are good — but the SELECTION model is the weak link: static, stale, unfair, and invisible to the ISR/D1 freshness machinery the rest of the site relies on. Not the best approach for a fair, fresh, conversion-driving directory.

**Already working well:**
- Visual hierarchy is genuinely strong: dedicated full-bleed section with an italic 'Spotlight' eyebrow + 6xl serif 'In de spotlights' heading (FeaturedHorizontal.tsx:14-17), clearly separated from the main guide.
- Mobile-friendly horizontal scroller with a 'Scroll horizontaal' affordance and responsive card widths w-[300px] sm:w-[420px] (FeaturedHorizontal.tsx:19-33).
- Spotlight cards reuse BusinessCard, so every card is a real internal link to /ondernemers/[id] (BusinessCard.tsx:16-17) — good for crawl depth and internal-link equity to detail pages.
- Featured state is reinforced site-wide: BusinessCard.tsx:37-41 renders a gold star badge titled 'Uitgelicht', and BusinessExplorer/category pages float featured businesses to the top via the (b.featured?1:0) sort tiebreak (BusinessExplorer.tsx:52, categorie/[slug]/page.tsx:42).
- All 6 currently-featured businesses have real imageUrl values (verified in the seed), so the rail isn't rendering broken/placeholder cards today.
- Defensive status !== 'closed' filter on the spotlight (FeaturedHorizontal.tsx:8) means a featured business that later closes silently drops out instead of showing a dead card.

**Findings:**

- 🟠 HIGH — **Spotlight selection is a hard-coded boolean with no admin/owner control**  _(verify: confirmed → medium)_
  - Evidence: `overrides.ts:10 `export const EDITABLE_FIELDS = [ "shortDescription", ... "priceRange" ]` — featured and sortOrder are absent; grep for featured in src/app/admin and src/app/beheer returns nothing.`
  - Why: For a directory of ~67 independent businesses, who gets the homepage spotlight is the most valuable, most contested placement. Today it can only change by editing src/data/businesses.ts and redeploying — the editor/owners cannot rotate it, sell it, or reward newly-onboarded shops. This makes the most commercially important surface the least flexible and undermines any future 'feature your business' value proposition.
  - Fix (effort M): Add featured (and optionally featuredRank/featuredUntil) to the override pipeline: include them in an admin-only editable set, surface a toggle in src/app/admin, and write through business_overrides so the existing D1+ISR machinery picks them up.

- 🟠 HIGH — **FeaturedHorizontal reads the static seed, bypassing D1 overrides and ISR**  _(verify: confirmed → medium)_
  - Evidence: `FeaturedHorizontal.tsx:3 `import { businesses } from "@/data/businesses";` and line 8 filters that raw array — unlike page.tsx:23 which uses `await getActiveBusinesses()` (the override-aware seam in businessData.ts:63).`
  - Why: businessData.ts:5-12 documents that all server reads should go through the async getters so approved owner edits from D1 are merged. Because the spotlight skips this, an approved name/description/closed-status change for a featured business shows in the main grid but NOT in the homepage spotlight card until a redeploy — a real freshness/consistency bug, and the reason even a future admin 'featured' toggle wouldn't surface here.
  - Fix (effort S): Convert FeaturedHorizontal to a server component that calls getActiveBusinesses() (like WandelShowcase.tsx:16-17) and pass the featured subset down, or compute the featured list in page.tsx and pass it as a prop so overrides + ISR apply.

- 🟡 MEDIUM — **Ordering is fully deterministic and stale — same 6 businesses, same order, forever**
  - Evidence: `FeaturedHorizontal.tsx:8 applies no sort after the filter; the rail renders in raw seed order (toko-tjin, flups, de-tafelaar, awaze, dhome-de-winkel, annas-smaakatelier). No rotation, randomisation, or recency signal anywhere in the component.`
  - Why: Always spotlighting the same 6 shops in the same order is unfair to the other ~60 businesses and goes visually stale for repeat visitors. It also concentrates internal-link equity on a fixed handful rather than spreading discovery — the opposite of what helps many local businesses rank.
  - Fix (effort M): Introduce light rotation: a daily/weekly date-seeded shuffle (deterministic so SSR/ISR stays stable) over a larger eligible pool, or rotate featured flags on a schedule. Even a date-seeded sort over the 6 plus next-best-N keeps it fresh and fairer.

- 🟡 MEDIUM — **Spotlight count can silently collapse when data is sparse — no empty-state guard**
  - Evidence: `FeaturedHorizontal.tsx:8 `.slice(0, 8)` then maps over featured with no length check; the heading and wrapper at lines 11-22 always render even if featured is empty.`
  - Why: Only 6 are featured against a cap of 8, so the rail never fills its intended width today; more importantly, if those 6 were un-flagged or marked closed, the page would render a large 'In de spotlights' heading above an empty scroller — a broken-looking hero section with no fallback. Relying on a hand-maintained boolean with no floor is fragile.
  - Fix (effort S): Add a fallback: if fewer than N featured exist, top up from a quality signal (real photos / highest verification confidence), and skip rendering the section if the final list is empty.

- ⚪ LOW — **No paid/priority or owner-claim concept tied to spotlighting**
  - Evidence: `No priority/paid/sponsor/featuredRank field exists; featured is the only signal (businesses.ts:111 `featured?: boolean;`) and category/explorer sorts only use featured then sortOrder (BusinessExplorer.tsx:52).`
  - Why: For a local guide that wants to be sustainable and to reward verified/owner-approved businesses, there's no structured way to express priority tiers (owner-claimed > verified > unclaimed). This limits both monetisation and the ability to editorially prioritise engaged businesses.
  - Fix (effort M): Add a small ordered tier (featuredRank or a sponsor flag) feeding both the spotlight order and the category/explorer tiebreak, kept admin-editable via the override pipeline.

### Google Reviews integration — are reviews actually integrated and showing?

**Verdict:** NO — reviews are NOT showing on the live site today, even though the code to show them is real and well-built (not stubbed). The integration is LIVE-capable: GoogleReviews.tsx client-fetches /api/reviews/[businessId], which reads a place_id from D1 and calls the real Google Places API (New) endpoint places.googleapis.com/v1/places/{id} (src/lib/places.ts:67). But it renders nothing right now for two compounding reasons: (1) NO Google Maps API key is configured — getGoogleMapsKey() (src/lib/settings.ts:85-88) reads from D1 settings (google_maps_api_key) or GOOGLE_MAPS_API_KEY env; neither is set (wrangler.jsonc:34-40 lists only AUTH_SECRET/RESEND_API_KEY/ADMIN_EMAILS as secrets, there is no .dev.vars file, and no admin has entered a key). With no key, fetchPlaceReviews returns null (src/lib/places.ts:65) → API route returns EMPTY → component returns null (GoogleReviews.tsx:61). (2) ZERO businesses have a place_id wired into the live path. The live path reads business_google.place_id from D1 (src/lib/reviews.ts:39-53), but migration 0005_google.sql creates the business_google table EMPTY — there are no INSERTs anywhere, and an admin must manually paste each ChIJ… code via /admin/google. The seed data (src/data/businesses.ts) carries place_ids only as inert substrings inside googleMapsUrl (only 2 of ~67 actually contain a real ChIJ… code; 6 are empty query_place_id= placeholders), and nothing copies those into business_google. So the wiring is correct and ToS-compliant, but unpopulated — it is dark. PRECISE STEPS TO GO LIVE: (a) Create a Google Maps Platform API key with Places API (New) enabled, restrict it, and set it: wrangler secret put GOOGLE_MAPS_API_KEY (or paste it in /admin/instellingen). (b) For each business, find its ChIJ… place_id via the Place ID Finder and save it at /admin/google (writes business_google.place_id). (c) Verify GET /api/reviews/{id} returns rating+reviews. Reviews then appear on the detail page. Until both (a) and (b) are done for a given business, that business shows no reviews.

**Already working well:**
- Reviews are LIVE code, not stubbed: src/lib/places.ts:67 makes a real fetch to the Google Places API (New) Place Details endpoint with X-Goog-FieldMask 'rating,userRatingCount,googleMapsUri,reviews', and parsePlaceDetails() maps the real response shape (authorAttribution, relativePublishTimeDescription, etc.).
- ToS-compliant caching strategy: review content is fetched client-side per request and served no-store. API route is dynamic='force-dynamic' with Cache-Control 'private, no-store' (route.ts:7,10) and a comment explicitly noting content must never enter the ISR/static cache. Only the place_id (a cache-exempt value per Places policy) is persisted in D1 (migration 0005_google.sql:8 comment 'cache-exempt per Places policy').
- Required Google attribution is present: GoogleReviews.tsx:97-104 renders a link back to Google Maps ('Bekijk alle reviews op Google Maps') and 'reviews aangeleverd door Google', satisfying the Places display-attribution requirement.
- Google rich-results policy compliance is deliberate and correct: NO Review or AggregateRating JSON-LD is emitted anywhere (confirmed by grep — only doc-comments mention it). schema.ts header rule 'never emit data that isn't true on the page (no fabricated ratings)' and localBusinessSchema() omits aggregateRating entirely. This avoids Google's self-serving-rating penalty since the site can't host its own genuine first-party reviews.
- Sensible empty/no-key/no-place_id fallback: every failure path collapses to EMPTY and the component returns null (GoogleReviews.tsx:61) — no broken UI, no zero-star placeholders.
- Caps at 5 reviews per Places ToS (places.ts:45 .slice(0,5)) and tolerates missing fields with defaults ('Google-gebruiker', originalText fallback) — well covered by places.test.ts.
- Review-acquisition funnel exists (QR/short-link tokens via review_requests + writeReviewUrl deep link), giving a path to actually GROW genuine Google reviews — the right long-term GEO/local-SEO move.
- Admin UX is in place: /admin/google lists all businesses with a place_id field and shows 'X van Y gekoppeld' progress (admin/google/page.tsx:45).

**Findings:**

- 🔴 CRITICAL — **No Google Maps API key set in production — every review call returns null**  _(verify: partial → low)_
  - Evidence: `src/lib/settings.ts:88 `return s.google_maps_api_key || env?.GOOGLE_MAPS_API_KEY || undefined;` and src/lib/places.ts:65 `if (!key || !placeId) return null;`. wrangler.jsonc:37-40 lists secrets (AUTH_SECRET, RESEND_API_KEY, ADMIN_EMAILS) but NOT GOOGLE_MAPS_API_KEY; no .dev.vars file exists.`
  - Why: Without the key, fetchPlaceReviews() short-circuits to null for every business, so /api/reviews/[id] always returns EMPTY and the GoogleReviews component renders nothing. Reviews can never appear regardless of place_ids. This is the #1 blocker.
  - Fix (effort S): Create a Google Maps Platform key with Places API (New) enabled, apply HTTP-referrer + API restrictions, then `wrangler secret put GOOGLE_MAPS_API_KEY` (and add it to .dev.vars for local). Alternatively enter it once via /admin/instellingen (stored in D1 settings.google_maps_api_key). Document it in wrangler.jsonc's secrets comment block.

- 🔴 CRITICAL — **Zero businesses have a place_id in the live path — business_google table ships empty**  _(verify: confirmed → high)_
  - Evidence: `migrations/0005_google.sql:6 creates `business_google` with no seed INSERT (grep for 'INSERT INTO business_google' returns nothing). The live lookup is src/lib/reviews.ts:44-49 `SELECT ... FROM business_google WHERE business_id = ?`. Seed place_ids live only as substrings of googleMapsUrl in src/data/businesses.ts, and only 2 contain a real `ChIJ…` (e.g. line 4407 Indian Flavour, line 7310 Belhadi); 6 are empty `query_place_id=`.`
  - Why: Even with an API key, no business resolves a place_id (src/app/api/reviews/[businessId]/route.ts:15 returns EMPTY when !g?.place_id), so the section is dark for all ~67 businesses. Requires manual per-business admin entry — high operational risk of it never being completed.
  - Fix (effort M): Two-part: (1) Write a one-off seed/migration that backfills business_google.place_id by parsing the existing `query_place_id=ChIJ…` out of each googleMapsUrl in businesses.ts (covers the ~2 that already have one). (2) Bulk-resolve the remaining place_ids via the Places Text Search/Find Place API from name+address and pre-populate, instead of hand-typing 60+ ChIJ codes in /admin/google.

- 🟡 MEDIUM — **No aggregate star rating shown on cards/listings — reviews live only on detail pages**
  - Evidence: `GoogleReviews is rendered only on the detail page (src/app/ondernemers/[id]/page.tsx:79). grep shows the Stars component and any rating render exist solely in src/components/GoogleReviews.tsx; no card/listing component references rating/Stars/cached_rating.`
  - Why: Star ratings on category/overview cards are a major CTR and trust signal for local search. The schema even reserves cached_rating/cached_count columns (0005_google.sql:15-16) for exactly this, but they're unused. Note: showing a cached number on cards would NOT violate ToS (a numeric rating is a fact, not stored review text), so this is a safe, high-value win.
  - Fix (effort M): Populate business_google.cached_rating/cached_count on a scheduled refresh (Cron/queue) from the Places call, and render a compact 'X.X ★ (N)' badge on listing cards. Keep emitting NO AggregateRating JSON-LD (correct), but the on-page visual badge is allowed and valuable.

- 🟡 MEDIUM — **Review freshness depends on live per-request fetch with no rate-limit / cost guard**
  - Evidence: `src/app/api/reviews/[businessId]/route.ts:7-17 is force-dynamic + no-store and calls fetchPlaceReviews on EVERY page view; there is no in-flight dedupe, short-lived edge cache, or per-IP throttle. src/lib/places.ts has no quota handling beyond returning null on !res.ok.`
  - Why: Places API Place Details (with reviews field) is a billed SKU. A popular detail page or a bot crawl triggers one paid API call per view, which can run up cost and hit quota — at which point !res.ok makes reviews silently vanish. ToS forbids persisting review text, but a very short non-persistent in-memory/edge TTL is generally acceptable and protects cost.
  - Fix (effort M): Add a small safeguard: a short-lived (e.g. 60s) in-worker memoization keyed by place_id to collapse bursts, plus log/handle 429/quota responses distinctly from genuine 'no reviews'. Confirm against current Places ToS that a brief non-durable cache is permitted before persisting anything.

- ⚪ LOW — **relativeTime / author photo come straight from Google with light handling; mapsUrl link is the only attribution surfaced when no reviews**
  - Evidence: `GoogleReviews.tsx:61 returns null when data.reviews.length===0, so if a place has a rating but zero text reviews, the rating+attribution block never renders. places.ts:50 falls back text to '' and the component hides empty-text reviews (line 90) but still counts them toward the 'show something' threshold.`
  - Why: Edge case: a business with a strong numeric rating but no written reviews shows nothing at all, losing a trust signal that could legitimately display (rating + 'see on Google Maps').
  - Fix (effort S): Relax the render guard to show the rating header + Maps attribution link when data.rating != null even if reviews[] is empty, while still hiding individual empty-text review cards.

### Technical SEO

**Verdict:** The on-page technical SEO craftsmanship is genuinely strong — unique titles/descriptions per route, per-page canonicals, NL/EN hreflang pairing on most templates, a clean Next 16 metadata API setup, a complete sitemap (217 URLs incl. all businesses, categories, stories, EN routes), an AI-crawler-friendly robots.txt, and a custom 1200x630 OG image. BUT there is one catastrophic, ranking-blocking defect that overrides everything: the entire site declares its canonical domain as https://ondernemersvandekamp.nl (SITE.url in src/lib/site.ts), and that domain does NOT resolve (DNS fails). The live site at jezzacooks.workers.dev therefore serves canonical tags, hreflang links, OG urls, JSON-LD @ids, the sitemap loc values, and robots Host: all pointing at a dead host. Google will try to consolidate/index the non-existent domain and effectively cannot index the real one. This single issue means the site cannot rank in Amersfoort at all until the real production domain is live and SITE.url matches it. Biggest blockers in order: (1) dead canonical domain; (2) no x-default hreflang + categorie pages missing hreflang entirely; (3) 727KB–888KB HTML pages (LCP/CWV risk) driven by inlined per-business SVG placeholders and the raw-img Hero LCP; (4) sitemap lacks hreflang alternates and omits /en/categorie. Fix #1 first; the rest are real but secondary.

**Already working well:**
- Metadata architecture is clean and modern (Next 16): metadataBase set from SITE.url (layout.tsx:21), title template '%s | Ondernemers van de Kamp' (layout.tsx:24), and genuinely unique, keyword-rich, length-appropriate titles/descriptions per template (business, kaart, over-de-kamp, categorie, EN home).
- Per-page self-referencing canonicals everywhere via alternates.canonical (e.g. ondernemers/[id]/page.tsx:38, kaart/page.tsx:14, categorie/[slug]/page.tsx:29).
- openGraph + twitter summary_large_image configured globally (layout.tsx:40-52) and per business with local photo fallback to the branded root OG image.
- Custom branded 1200x630 opengraph-image.tsx with correct alt/size/contentType exports — good quality, on-brand, readable.
- Sitemap is comprehensive and well-structured: homepage priority 1, all active businesses (0.8/0.9 featured), all categories, stories, static pages, and EN routes, with sensible changefreq/priority and real lastmod from updatedAt (sitemap.ts). Live sitemap returns 217 URLs.
- robots.txt is correct: allows '/', no accidental Disallow, references the sitemap, and explicitly welcomes AI answer-engine crawlers (GPTBot, PerplexityBot, ClaudeBot, etc.) for GEO (robots.ts:9).
- NL/EN hreflang pairing implemented on home, business, kaart, over-de-kamp, loop-de-kamp via alternates.languages, with matching return links on the /en counterparts (en/page.tsx:16, en/ondernemers/[id]/page.tsx:34-37).
- Strong internal linking + descriptive anchors: category cross-links, breadcrumb JSON-LD, related businesses, 'Meer zoals dit' category links on loop-de-kamp.
- next/font with display:'swap' for Inter + Playfair (layout.tsx:8-18) — no FOIT, good font-loading behavior.
- ISR revalidate=300 on dynamic templates keeps approved D1 edits fresh for crawlers.

**Findings:**

- 🔴 CRITICAL — **Canonical domain ondernemersvandekamp.nl is dead — every canonical/hreflang/OG/sitemap URL points to a non-resolving host**  _(verify: confirmed)_
  - Evidence: `src/lib/site.ts:13 `url: "https://ondernemersvandekamp.nl"`; live site confirms `<link rel="canonical" href="https://ondernemersvandekamp.nl"/>` while `curl https://ondernemersvandekamp.nl` returns 'Could not resolve host' (DNS failure). robots.txt on the live worker emits `Host: https://ondernemersvandekamp.nl` and `Sitemap: https://ondernemersvandekamp.nl/sitemap.xml`.`
  - Why: Google consolidates ranking signals to the canonical URL. Because that domain does not exist, Googlebot is told the real, crawlable workers.dev pages are duplicates of a host it cannot fetch — so nothing indexes and nothing ranks in Amersfoort. This is the single hard blocker; all other SEO work is wasted until it is fixed.
  - Fix (effort S): Register/connect the real production domain in Cloudflare and point DNS at the Worker, OR (until then) set SITE.url to the actual live origin (https://ondernemers-van-de-kamp.jezzacooks.workers.dev). It is the one source of truth feeding metadataBase, canonicals, hreflang, OG, JSON-LD and the sitemap, so a one-line change corrects the whole site. Verify the chosen domain resolves and serves 200 before launch, then submit the sitemap in Search Console.

- 🟠 HIGH — **No x-default hreflang, and categorie pages emit no hreflang at all**  _(verify: confirmed → medium)_
  - Evidence: `All templates declare only `languages: { nl, en }` (e.g. layout/page.tsx:14, ondernemers/[id]/page.tsx:38) — no `'x-default'` key. categorie/[slug]/page.tsx:29 sets only `alternates: { canonical }` with no `languages`; live `/categorie/eten-drinken` shows a canonical but zero `<link rel="alternate" hreflang>` tags.`
  - Why: Google's 2026 guidance recommends an x-default entry so it knows which URL to serve users whose language/region isn't matched (important for an international-tourist-facing Amersfoort guide). Missing it weakens locale targeting. The category pages having no hreflang means the NL category landing pages have no signalled relationship to anything, and there are no EN category pages to pair with — a gap in the i18n graph.
  - Fix (effort M): Add `'x-default'` (point it at the NL URL) to every `languages` map. Decide on categorie: either create /en/categorie/[slug] routes and add full nl/en/x-default hreflang + list them in the sitemap, or explicitly leave NL-only but still add a self-canonical + x-default. Centralize the languages object in a helper so all templates stay consistent.

- 🟠 HIGH — **Very large server-rendered HTML (loop-de-kamp 888KB, home 727KB) from inlined per-business SVG placeholders — LCP/CWV risk**  _(verify: partial → low)_
  - Evidence: `Live transfer: `/loop-de-kamp` = 888,615 bytes, `/` = 726,827 bytes, `/kaart` = 667,106 bytes (single uncompressed HTML docs). loop-de-kamp/page.tsx:43-80 renders ~67 stops, each calling BusinessImage; BusinessImage.tsx:84 injects a full `placeholderSvg(...)` via dangerouslySetInnerHTML for every business lacking a photo, and each next/image emits a long srcset.`
  - Why: Core Web Vitals are a ranking factor. ~870KB of HTML on a single document inflates TTFB-to-render and LCP, especially on mobile in the field (Amersfoort shoppers on phones). Dozens of inlined SVGs also bloat DOM size, hurting INP. This directly suppresses the mobile ranking the project needs.
  - Fix (effort M): Stop inlining placeholder SVGs into HTML: render placeholders as a CSS background or a cached data-URI/static asset referenced once, not duplicated per card. For loop-de-kamp, lazy-render stops below the fold (or paginate/virtualize) so the initial HTML is small. Confirm Cloudflare is gzip/brotli-compressing HTML responses. Re-measure with Lighthouse mobile after.

- 🟡 MEDIUM — **Hero LCP image uses raw <img> instead of next/image — no optimization, priority, or preload**
  - Evidence: `src/components/Hero.tsx:20 `<img src="/images/kamperbinnenpoort.jpg" alt="..." className="h-full w-full object-cover" />` — no width/height, no priority, no responsive srcset; this is the above-the-fold hero on the homepage.`
  - Why: The hero is the homepage LCP element. A plain <img> ships the full-size JPEG with no AVIF/WebP, no responsive sizing, and no fetchpriority=high/preload, slowing LCP on the most important ranking page and causing layout shift (no dimensions).
  - Fix (effort S): Convert to next/image with `priority`, explicit dimensions (or fill + sizes), so it gets an optimized format, a preload hint, and reserved space. If the Workers optimiser can't serve it, at minimum add width/height and `fetchpriority="high"` plus a preconnect/preload.

- 🟡 MEDIUM — **Sitemap omits hreflang alternates and EN category pages**
  - Evidence: `sitemap.ts builds plain url/lastModified/changeFrequency/priority entries with no `alternates.languages` (Next 16 supports it); live sitemap.xml contains 0 `xhtml:link`/hreflang occurrences. enUrls (sitemap.ts:28-42) lists /en home, /en/kaart, /en/ondernemers/* etc. but no /en/categorie/*, and `/categorie/` appears only 9 times (NL only).`
  - Why: Sitemap-level hreflang is the most robust way to communicate NL/EN equivalence to Google and reduces ambiguity vs. relying solely on <head> tags. Its absence, combined with the dead-domain issue, makes locale discovery weaker. Missing EN categories is a smaller coverage gap.
  - Fix (effort S): Add `alternates: { languages: { nl, en } }` to each business/home/page entry in sitemap.ts so Next emits the xhtml:link blocks. If EN category pages are created, add them here too. Low effort once the domain is fixed.

- ⚪ LOW — **EN business detail pages reuse NL LocalBusiness JSON-LD and have title/description that can duplicate NL when DeepL falls back**
  - Evidence: `en/ondernemers/[id]/page.tsx:60-67 builds `localBusinessSchema(business)` and the description is `${b.shortDescription} ${b.address}, Amersfoort.` — i18n.ts:60 `getBusinessTranslations` returns {} (fail-soft) when no DEEPL_API_KEY, so EN pages render the Dutch shortDescription verbatim with an /en canonical.`
  - Why: When translation falls back, /en/ondernemers/{id} and /ondernemers/{id} have near-identical Dutch content under two canonicals. hreflang mitigates this, but if hreflang is mis-served (see dead-domain issue) it reads as thin duplicate content and dilutes the EN locale's value.
  - Fix (effort M): Gate EN business pages (or at least their indexability) on whether a real EN translation exists — e.g. noindex EN detail pages that fell back to NL, or skip generating them — so EN only exposes genuinely translated content. Keep hreflang correct so the canonical pair is unambiguous.

### Structured Data (JSON-LD) + E-E-A-T trust signals

**Verdict:** The structured-data foundation is genuinely good — well above typical local-guide sites. A clean @graph with @id-linked Organization, WebSite+SearchAction, a Place/TouristAttraction district entity, per-business LocalBusiness subtypes (ClothingStore/Restaurant/etc.) carrying PostalAddress, real GeoCoordinates, openingHoursSpecification, sameAs, telephone, image, founder, plus BreadcrumbList, FAQPage and ItemList. It would pass the Rich Results Test for FAQ, Breadcrumb and LocalBusiness. The architecture is principled (single NAP source in site.ts, honest "no fabricated ratings" rule). The gaps that actually cost rankings/rich-results: (1) Organization has NO logo and empty sameAs on the LIVE site — blocks the Organization/knowledge-panel rich result and weakens entity trust; (2) the guide's own NAP is incomplete — no telephone, no PostalAddress on the Organization, and the footer carries only email, so there is no consistent N-A-P to corroborate; (3) no Google Business Profile / social sameAs anywhere — the single biggest local-SEO + E-E-A-T gap; (4) priceRange data is malformed (prose and mixed €/$ symbols) which can invalidate the property; (5) no author/Article schema on the editorial Verhalen content; (6) the gift card has no Product/Offer schema. AggregateRating is correctly omitted — that is the right call, not a gap.

**Already working well:**
- Clean single @graph document per page with proper @id cross-linking: WebSite.publisher -> #organization, LocalBusiness.isPartOf -> #district (src/lib/schema.ts:42-44, 155). No broken references or invalid nesting - confirmed in live HTML.
- Per-business schema uses correct LocalBusiness SUBTYPES (ClothingStore, Restaurant, Store, CafeOrCoffeeShop) via business.schemaType (src/lib/schema.ts:139), stronger than generic LocalBusiness for AI/entity understanding.
- LocalBusiness nodes carry the full recommended set: PostalAddress, real GeoCoordinates, openingHoursSpecification (schema.org day URIs), telephone, email, image (absolutized), sameAs, hasMap, areaServed - verified live on /ondernemers/atelier-misura-sartoria.
- Honest review handling: GoogleReviews.tsx explicitly emits NO AggregateRating because the data is Google-owned/self-serving (src/components/GoogleReviews.tsx:37), with required Places attribution and a Maps link. Correct, policy-safe choice.
- WebSite + SearchAction sitelinks searchbox present and well-formed (src/lib/schema.ts:45-52).
- District modeled as a Place/TouristAttraction entity with alternateName, geo and address (src/lib/schema.ts:60-84) - strong for AI engines understanding 'De Kamp' as a real place.
- ItemList emitted on home, /kaart and every /categorie page with position + url + name (src/lib/schema.ts:99-112) - good foundation for directory/carousel eligibility.
- Event schema on /agenda is conditional on a concrete startDate with eventStatus and eventAttendanceMode (src/app/agenda/page.tsx:20-34) - avoids invalid Event markup for vague recurrences.
- NAP centralization: one source of truth in src/lib/site.ts feeds metadata + schema - the right architecture for consistency.
- FAQPage only emitted where genuine Q&A is rendered on-page (over-de-kamp, ondernemers detail guarded by faqs.length), respecting Google's on-page-content requirement.

**Findings:**

- 🟠 HIGH — **Organization has no logo and empty sameAs on the live site - blocks Organization rich result / knowledge panel**  _(verify: confirmed → medium)_
  - Evidence: `src/lib/schema.ts:23-33 organizationSchema() omits any logo field; src/lib/site.ts:25-28 social: { instagram: '', facebook: '' } are empty, and the live homepage renders "sameAs": [] (confirmed via curl of the @graph Organization node).`
  - Why: Google's Organization/logo rich result and the entity knowledge panel require a logo (ImageObject) and benefit heavily from non-empty sameAs. With neither, Google cannot confidently establish the publisher as a real entity - weakening E-E-A-T Trust for the whole domain and forfeiting a brand SERP feature the site is otherwise eligible for.
  - Fix (effort S): Add logo (absolute URL to a square >=112px PNG/SVG) to organizationSchema(), and populate SITE.social with the real Instagram/Facebook plus the Google Business Profile and the Vrienden van de Kamp page so sameAs is non-empty.

- 🟠 HIGH — **Guide's own NAP is incomplete and inconsistent - no telephone/address in schema, footer has only email**  _(verify: confirmed → medium)_
  - Evidence: `src/lib/site.ts:18-22 defines email/city/region/postalArea but NO telephone and NO street address; organizationSchema() (src/lib/schema.ts:23-33) emits no address PostalAddress and no telephone; src/components/Footer.tsx:37 exposes only mailto:info@ondernemersvandekamp.nl with no phone or postal address anywhere.`
  - Why: Local SEO and AI answer engines corroborate an entity by matching consistent Name-Address-Phone across schema, footer, contact page and external citations. With no address/phone at all there is nothing to match - the guide reads as a thin web property rather than a trustworthy local organization, suppressing local-pack / AI-citation eligibility.
  - Fix (effort M): Decide on a public NAP (even a district visiting address + contact phone, or the Vrienden van de Kamp address). Add telephone and an address PostalAddress to organizationSchema(), and surface the same phone+address in Footer.tsx so the three sources are byte-consistent.

- 🟠 HIGH — **No Google Business Profile or social sameAs linkage anywhere - largest local-EEAT gap**  _(verify: confirmed)_
  - Evidence: `Grep across src/app and src/lib finds no GBP/maps profile URL for the guide entity; src/lib/schema.ts:32 sameAs only references SITE.social.* which are empty (src/lib/site.ts:26-27); the Vrienden van de Kamp collective is named in copy (src/app/over-de-kamp/page.tsx:85) but never linked as a sameAs or modeled as parentOrganization/memberOf.`
  - Why: For a local guide, the Google Business Profile is the single highest-leverage trust + ranking signal, and sameAs to it plus socials is how schema ties the website to that profile and the real-world Vrienden van de Kamp authority. Its absence caps both classic local-pack ranking and AI-Overview citation confidence.
  - Fix (effort M): Create/claim a GBP for the guide or collective, link it via sameAs, and model Vrienden van de Kamp as an Organization the guide is memberOf or that is parentOrganization, with its own sameAs. Converts a copy-only credibility claim into a machine-readable trust edge.

- 🟡 MEDIUM — **priceRange data is malformed - prose and mixed currency symbols can invalidate the property**
  - Evidence: `src/data/businesses.ts emits e.g. "priceRange": "Maatpakken vanaf ca. EUR499 (Business Suit)" (~line 228, confirmed live on the ClothingStore node) and a mix of $$, EUR-EUR, EUR10 - EUR25, EUR17,95 - EUR246,85 across records; localBusinessSchema passes it through verbatim (src/lib/schema.ts:163).`
  - Why: schema.org priceRange expects a short qualitative band (EUR-band or $$ or a clean currency range). Free-text like 'Maatpakken vanaf ca. EUR499' and inconsistent symbol systems can be ignored or flagged in the Rich Results Test and looks low-quality to AI extractors, undermining the otherwise clean LocalBusiness node.
  - Fix (effort S): Normalize priceRange to a single convention (EUR-band). Sanitize in localBusinessSchema (regex to the band) or clean the source data; move concrete starting prices into description/Offer rather than priceRange.

- 🟡 MEDIUM — **Editorial Verhalen content has no Article/author schema - missed E-E-A-T Experience/Expertise signal**
  - Evidence: `src/app/verhalen/[slug]/page.tsx:100-103 emits only graph(breadcrumbSchema(...)); no Article/BlogPosting, no author Person, no datePublished, no publisher. The listing (src/app/verhalen/page.tsx:60-61) likewise emits only a breadcrumb.`
  - Why: Story pages are exactly where E-E-A-T Experience and Expertise are demonstrated and where authorship signals matter most to Google and AI engines. Without Article + author + publisher schema these pages are invisible as authored content and ineligible for article-style rich treatment or confident attribution.
  - Fix (effort M): Add an Article/BlogPosting node on /verhalen/[slug] with headline, image, datePublished/dateModified, author (Person or the Organization), and publisher -> #organization (reuse the @id). Even attributing to the guide Organization is better than none.

- ⚪ LOW — **Gift card page has no Product/Offer schema**
  - Evidence: `src/app/cadeaukaart/page.tsx:178-186 emits only graph(breadcrumbSchema, faqSchema); no Product or Offer node despite the page promoting a forthcoming Kamp Cadeaukaart.`
  - Why: A gift card is a commerce entity; Product/Offer markup (once the card is live with price/availability) unlocks product rich results and clearer AI understanding. Because the product is not yet purchasable, deferring is correct - but it is a tracked launch gap.
  - Fix (effort S): When the card goes live (Mollie per privacy page), add a Product with an Offer (price, priceCurrency EUR, availability, url). Until then leaving it off is the honest choice - flag it on the launch checklist rather than emitting a fake Offer now.

- ⚪ LOW — **BreadcrumbList emits an item for the current (last) page**
  - Evidence: `src/lib/schema.ts:94 ...(it.url ? { item: abs(it.url) } : {}) and callers pass a url for the final crumb (e.g. src/app/ondernemers/[id]/page.tsx:69 { name: business.name, url: '/ondernemers/'+business.id }).`
  - Why: Google's guidance is that the final breadcrumb (current page) should omit item. It still validates and renders, so impact is minimal, but omitting it is documented best practice and avoids parser ambiguity.
  - Fix (effort S): Drop the url on the last crumb at call sites, or have breadcrumbSchema skip item for the final element (i === items.length-1).

### Local / GEO SEO — getting found in Amersfoort ASAP

**Verdict:** Yes, Amersfoort searchers will find this fast IF one blocker is fixed first: the entire site declares its canonical home as https://ondernemersvandekamp.nl (src/lib/site.ts:13), but it is actually live on ondernemers-van-de-kamp.jezzacooks.workers.dev. Every canonical tag, sitemap URL, robots host, OG url and JSON-LD @id therefore points at a domain that doesn't serve the content — so Google will either index the workers.dev URL with self-conflicting canonicals or wait for the .nl domain to go live. Fix that and you're in a genuinely strong position: the local-SEO fundamentals here are excellent. NAP is centralized and consistent (one source of truth in site.ts feeding metadata + schema), 70/98 businesses have real postal codes, 66 have verified high-confidence lat/lng (the rest interpolated along a hand-anchored Kamp spine), each detail page emits a full LocalBusiness schema with geo, address, hours, directions, Street View and walk-time-from-the-gate, and there are dedicated, content-rich /praktisch (parking, transit, FAQ) and /over-de-kamp (history) pages plus an /agenda with real market/koopzondag data and Event schema. "De Kamp" + "Amersfoort" + "Kamperbinnenpoort" appear in titles, descriptions, body and image alt throughout. The biggest remaining gaps after the domain fix: (1) the homepage H1 is the brand tagline "De Kamp leeft." with zero local keywords; (2) "Vrienden van de Kamp", gemeente, VVV and Citymarketing are named in body copy but never hyperlinked, so no citation/backlink equity flows; (3) there is no per-business GBP place ID wired into schema (sameAs/hasMap only); and (4) the initiative itself has no Google Business Profile / Organization address, which is the fastest way to win the "winkelen De Kamp Amersfoort" map pack.

**Already working well:**
- Single source of truth for NAP: src/lib/site.ts defines SITE.city/region/postalArea/geo once and feeds metadata, schema and llms.txt, so name/address/postal stay consistent across the whole site (the core local-SEO requirement).
- Strong structured data: src/lib/schema.ts emits a districtPlaceSchema (Place + TouristAttraction with GeoCoordinates + PostalAddress) on key pages and a full localBusinessSchema per business with geo, openingHoursSpecification, hasMap, areaServed=Amersfoort and isPartOf the district @id — exactly what AI answer engines and rich results consume.
- Real, verified coordinates: 66/98 businesses carry explicit high-confidence lat/lng (e.g. businesses.ts:225 "lat": 52.157183), and coordsFor() in geo.ts always prefers verified coords over interpolation.
- Genuinely deep local content, not thin: /praktisch covers parking garages (Flint, Sint Jorisplein), train (10–12 min from Amersfoort CS), bike, foot, nearby landmarks and 5 local FAQs with FAQPage schema; /over-de-kamp has real dated history (13th-c. Kamperbinnenpoort, 1388 'Coecamp', 1521–1914 'Kampstraat'); /agenda lists actual recurring markets and koopzondag with Event JSON-LD.
- Directions and map intent fully covered: directionsUrl()/mapsUrl()/streetViewUrl() in geo.ts produce Google Maps deep-links keyed to '{address}, 3811 Amersfoort, Netherlands', wired into the detail page (BusinessDetailClient.tsx:180) and /loop-de-kamp.
- Local keywords in the right places: titles/descriptions consistently pair 'De Kamp' + 'Amersfoort' + 'Kamperbinnenpoort' (layout.tsx keywords array, praktisch/over-de-kamp/kaart/agenda metadata), and image alt text is localized (Hero.tsx:20 alt names the Kamperbinnenpoort and De Kamp).
- GEO/AI-engine readiness: robots.ts explicitly allows GPTBot/PerplexityBot/ClaudeBot/Google-Extended etc., and a generated /llms.txt summarizes the district (postcode 3811, 350m street, Kamperbinnenpoort) and links every key page.
- Clean URL + sitemap structure: human-readable Dutch slugs (/over-de-kamp, /praktisch, /kaart, /ondernemers/{id}, /categorie/{slug}) and a complete sitemap.ts with per-business images and EN alternates.

**Findings:**

- 🔴 CRITICAL — **Canonical domain mismatch: whole site points at ondernemersvandekamp.nl but is live on workers.dev**  _(verify: confirmed)_
  - Evidence: `src/lib/site.ts:13 `url: "https://ondernemersvandekamp.nl"` — this feeds metadataBase (layout.tsx:21), every `alternates.canonical`, sitemap.ts base, robots.ts `host: SITE.url`, and all JSON-LD @id values, while the live site is ondernemers-van-de-kamp.jezzacooks.workers.dev.`
  - Why: If the .nl domain is not yet serving this content, Google crawls the workers.dev URL but every canonical/OG/schema URL declares a different, dead host. Google will distrust the canonical, may index the workers.dev domain with no authority, or simply hold off indexing — directly blocking 'get found in Amersfoort ASAP'. This single config line invalidates the otherwise excellent on-page SEO.
  - Fix (effort S): Decide the production domain now. If ondernemersvandekamp.nl is the target, point DNS at the Worker and deploy there before relying on indexing; until then set SITE.url to the actual live workers.dev URL so canonicals/sitemap/schema are self-consistent and indexable. There is already a getConfiguredSiteUrl() (used in admin/actions.ts:195) — wire SITE.url-dependent SEO surfaces to the truly live origin.

- 🟠 HIGH — **Homepage H1 is a brand tagline with no local keywords**  _(verify: confirmed → medium)_
  - Evidence: `src/components/Hero.tsx:33-35 `<h1 ...>De Kamp <span ...>leeft.</span></h1>` — the site's primary H1 is the tagline 'De Kamp leeft.'`
  - Why: The homepage targets the highest-value queries ('winkelen De Kamp Amersfoort', 'De Kamp Amersfoort winkels'). The single strongest on-page ranking signal — the H1 — spends itself on a slogan instead of the head keyword + city. The body and title tag carry the keywords, but the H1 is wasted local-relevance.
  - Fix (effort S): Keep the visual tagline but make the H1 keyword-bearing, e.g. H1 'De Kamp Amersfoort — winkels, restaurants & makers in de binnenstad' (styled large), with 'De Kamp leeft.' demoted to a styled tagline/<p>. Or add a visually-styled but semantically primary H1 and render the slogan as a sibling span.

- 🟠 HIGH — **Local authorities (Vrienden van de Kamp, gemeente, VVV, Citymarketing) are named but never linked**  _(verify: partial → medium)_
  - Evidence: `Body text references 'Vrienden van de Kamp' on praktisch/page.tsx:37 and over-de-kamp/page.tsx:85 but a grep for any vriendenvandekamp domain link returns nothing; gemeente/VVV appear only inside businesses.ts source URLs, not as outbound page links.`
  - Why: Local citation and backlink equity is the second-biggest local ranking lever after NAP. Linking to and being linked from Vrienden van de Kamp, gemeente Amersfoort, VVV Amersfoort and Citymarketing builds the topical/geographic association Google uses to trust 'this site is THE De Kamp resource'. Mentioning them as plain text earns none of that.
  - Fix (effort M): Hyperlink 'Vrienden van de Kamp', 'gemeente Amersfoort' (amersfoort.nl/markten is already cited in events.ts), and VVV Amersfoort wherever named, and add a short 'Partners / over dit initiatief' section linking these bodies. Then pursue reciprocal listings (a link back from vriendenvandekamp / VVV / inAmersfoort) — bake the relationship in, don't just mention it.

- 🟡 MEDIUM — **No Google Business Profile place IDs wired into business schema**
  - Evidence: `src/lib/schema.ts:153 sets only `hasMap: business.googleMapsUrl || mapsUrl(...)` and sameAs from website/socials; the Business type has no placeId field (grep for placeId/place_id in businesses.ts returns 0), and GoogleReviews.tsx 'shows nothing if no place_id set'.`
  - Why: Each business's own GBP is what wins the Amersfoort map pack. Without a place ID, the site can't deep-link to the canonical Google listing, can't show live ratings (the reviews component sits empty), and the LocalBusiness schema can't reinforce the GBP entity — weakening the entity-matching that Google and AI Overviews rely on for local queries.
  - Fix (effort M): Add an optional `placeId` to Business, populate from research, and (a) build hasMap/directions as place-ID Maps links (`?api=1&query_place_id=`), (b) emit it so GoogleReviews can show real star ratings, and (c) where a business lacks a GBP, flag it via the existing missingFields mechanism as an owner action.

- 🟡 MEDIUM — **The initiative itself has no GBP / postal address in Organization schema**
  - Evidence: `src/lib/schema.ts:23-34 organizationSchema() emits only name/url/email/areaServed and an empty sameAs (SITE.social.instagram/facebook are "" in site.ts:25-28); there is no PostalAddress, no LocalBusiness type, no GBP link for 'Ondernemers van de Kamp' as an entity.`
  - Why: A district-guide GBP (category e.g. 'Tourist information' / 'Shopping district') placed at the Kamperbinnenpoort would let the initiative itself appear in the Amersfoort map pack and Maps for 'De Kamp Amersfoort', funneling discovery to the whole directory — the single fastest way to 'get found in Amersfoort ASAP'.
  - Fix (effort M): Create a Google Business Profile for the initiative anchored at De Kamp / Kamperbinnenpoort, fill SITE.social with the real Instagram/Facebook so sameAs is non-empty, and add the GBP URL to organizationSchema sameAs plus a PostalAddress (the district already has verified coords in geo.ts).

- ⚪ LOW — **Hero stat shows a stale hardcoded '67 ondernemers' while the site actually has 96 active**
  - Evidence: `src/components/Hero.tsx:61 `{ v: "67", l: "ondernemers" }` is hardcoded, whereas status counts in businesses.ts are 96 'open' / 2 'closed', and every other surface (SeoIntro.tsx:9, schema, llms.txt) uses the live active count.`
  - Why: The most prominent above-the-fold number contradicts the rest of the site and the real directory size. It under-sells scale to users and creates a data-consistency signal mismatch that AI answer engines may surface ('De Kamp has 67 vs 96 businesses?'), and it will keep drifting as businesses are added.
  - Fix (effort S): Make Hero a server-rendered/prop-fed count like the other components (pass getActiveBusinesses().length) instead of the literal 67, so the headline stat is always accurate.

### AEO / AI answer-engine optimization

**Verdict:** Top-tier AEO readiness for a local guide. Live llms.txt, FAQPage schema on 5 page types for conversational Dutch queries, De Kamp Place entity, AI-crawler-friendly robots, visible+JSON-LD FAQ. Top gaps: no Wikidata sameAs on the district (top fix), llms.txt not linked, empty Org sameAs, no freshness signal, no homepage FAQ. None block.

**Already working well:**
- Live llms.txt llms.txt/route.ts
- FAQPage+HTML on 5 pages praktisch/page.tsx:147
- Conversational Dutch FAQ praktisch/page.tsx:36-40
- De Kamp Place entity schema.ts:60-84
- robots allows AI crawlers robots.ts:9
- Per-business auto FAQ related.ts:44-47

**Findings:**

- 🟠 HIGH — **District lacks Wikidata/Wikipedia sameAs**  _(verify: confirmed → medium)_
  - Evidence: `schema.ts:60-84 no sameAs`
  - Why: AI engines may not bind De Kamp to the Amersfoort entity, weakening citations.
  - Fix (effort S): Add Wikipedia+Wikidata sameAs for Kamperbinnenpoort to districtPlaceSchema.

- 🟡 MEDIUM — **llms.txt not linked; Org sameAs empty**
  - Evidence: `layout.tsx:20-39 no link; site.ts:25-28 social empty (schema.ts:32)`
  - Why: Undiscoverable llms.txt and thin publisher identity lower AI citation odds.
  - Fix (effort S): Link /llms.txt in metadata/robots; fill SITE.social + Organization.sameAs.

- 🟡 MEDIUM — **No freshness signal; no homepage FAQ/table**
  - Evidence: `dateModified only on stories verhalen/[slug]:51-52; page.tsx:11 omits faqSchema; SeoIntro.tsx:34-44 prose`
  - Why: 2026 AEO favors fresh data and liftable homepage lists; both missing.
  - Fix (effort M): Add dateModified + 'Bijgewerkt op'; add homepage FAQ+faqSchema and a category table.

### UX/UI, mobile, accessibility, performance (spotlight emphasis)

**Verdict:** The UX/UI is genuinely strong — this is a polished, editorial, design-led build with a coherent token system (globals.css), reduced-motion handling, a thoughtful image-precedence strategy, semantic landmarks (main/footer/nav), and good filtering UX in BusinessExplorer. It is well above typical local-guide quality. But the spotlight presentation is NOT yet the best it can be: "In de spotlights" (FeaturedHorizontal.tsx) is a bare horizontal overflow scroller with no scroll-snap, no keyboard access, no role/aria, and a desktop-only "Scroll horizontaal" hint — on mobile and for keyboard/screen-reader users the featured businesses are hard or impossible to reach, which undercuts the single most commercially important module on the page. The hero is visually spectacular but ships its LCP image as a raw non-priority <img> with no width/height, so largest-contentful-paint and CLS suffer. Fix the spotlight scroller affordances, the LCP image, and a handful of contrast/alt/tap-target gaps and this becomes excellent.

**Already working well:**
- Coherent design-token system in globals.css (colours, radii, shadows) with an explicit, honest contrast note: --amber is flagged 'DECORATION/FILL ONLY — fails AA as text on light' and a separate --amber-ink (~5.6:1) is used for amber-coloured text/links/labels — a rare, mature distinction.
- Strong semantic structure: layout.tsx uses html lang=nl, a single <main>, <Navbar>/<Footer> landmarks; SeoIntro uses a real <dl>/<dt>/<dd> stat list; loop-de-kamp uses an ordered <ol> for the route.
- prefers-reduced-motion is globally respected (globals.css 101-110) and :focus-visible has a defined 2px amber outline with offset (94-98); BusinessCard adds its own focus-visible ring.
- Mobile menu is well done: aria-label/aria-expanded/aria-controls on the toggle, inert + aria-hidden on the collapsed panel (Navbar.tsx 84-101) so collapsed links aren't focusable.
- Smart, Workers-aware image precedence in BusinessImage.tsx with deterministic on-brand SVG placeholders (zero network cost), and descriptive alt strings built from name+subcategory+address.
- OpenBadge avoids hydration mismatch by computing 'open now' client-side after mount and reserving no space pre-mount (avoids CLS), with a live pinging dot for open state.
- NewsletterSignup is accessible and honest: sr-only label, honeypot, role=status/aria-live=polite on success, role=alert on error, double opt-in disclosure.
- BusinessExplorer has real empty-state handling (dashed card + reset CTA), aria-pressed on toggle filters, aria-label on search, and a sensible sticky control bar; the <details> FAQ pattern uses list-none summary with a group-open:rotate-45 +-to-x chevron.

**Findings:**

- 🟠 HIGH — **Spotlight scroller has no keyboard access, no aria, no scroll-snap, and a desktop-only hint**  _(verify: partial → medium)_
  - Evidence: `FeaturedHorizontal.tsx:24 `<div className="no-scrollbar w-full overflow-x-auto pb-12">` with cards in `flex w-max gap-8`; the only scroll affordance is 19-21 `<div className="hidden ... md:block">Scroll horizontaal &rarr;</div>`. No role, aria-label, tabIndex, or snap-* anywhere in the file.`
  - Why: This is the commercially central module — the featured/paid businesses. A bare overflow-x scroller is not keyboard-focusable, so Tab skips past off-screen cards; screen readers get no region label; and the 'Scroll horizontaal' cue is hidden on mobile (md:block) exactly where horizontal scrolling is least discoverable. Off-screen featured cards may never be seen, defeating the spotlight's purpose.
  - Fix (effort M): Add `role="region" aria-label="Ondernemers in de spotlight"` and `tabIndex={0}` to the scroll container; add `snap-x snap-mandatory` to the container and `snap-start` to each card; add visible prev/next buttons (or a mobile-visible cue) and a focus-visible ring. Let the first off-screen card peek as an affordance on mobile.

- 🟠 HIGH — **Hero LCP image is a raw non-priority <img> with no dimensions, inside a framer-motion transform**  _(verify: confirmed)_
  - Evidence: `Hero.tsx:18-20 `<motion.div style={{ scale: imgScale }}...><img src="/images/kamperbinnenpoort.jpg" alt="..." className="h-full w-full object-cover" />` — no width/height, no fetchpriority, no preload; wrapped in a useScroll/useTransform client component.`
  - Why: This is the above-the-fold LCP element. A plain <img> with no fetchpriority=high or preload means late discovery; no intrinsic dimensions risks CLS; and gating the hero behind a 'use client' framer-motion wrapper delays paint and adds hydration cost on the most-visited page. On mobile this directly hurts LCP/CLS, which Google weights for local ranking.
  - Fix (effort M): Add `fetchPriority="high"` and explicit width/height (or aspect-ratio) to the <img>, and `<link rel="preload" as="image" href="/images/kamperbinnenpoort.jpg">`. Render the static hero markup server-side and layer the parallax motion progressively so first paint doesn't depend on JS.

- 🟡 MEDIUM — **Generative placeholder images are aria-hidden, so placeholder-only cards lose all alt text**
  - Evidence: `BusinessImage.tsx:84 `return <div aria-hidden="true" ... dangerouslySetInnerHTML={{ __html: placeholder() }} />;` and 56-57 the contain-logo branch also wraps the placeholder backdrop in `aria-hidden="true"`. The descriptive `alt` built at line 24 is only applied on the <img>/Image branches.`
  - Why: For every business without an owner photo (likely most of them today), the card image conveys nothing to screen readers — the constructed alt ('Name — subcategory, address Amersfoort') is discarded. The visible business name still exists in the heading, so not catastrophic, but the image region is silent and inconsistent with the photo branches.
  - Fix (effort S): On the placeholder branch, wrap in a container with `role="img" aria-label={alt}` instead of `aria-hidden="true"` (keep the inner SVG decorative). Gives placeholder cards the same accessible name as photo cards.

- 🟡 MEDIUM — **Sticky control bar offset (72/88px) doesn't match navbar height (80/96px); #ondernemers anchor has no scroll-margin**
  - Evidence: `Navbar.tsx:51 `flex justify-between h-20 sm:h-24` (80/96px). BusinessExplorer.tsx:67 `sticky top-[72px] ... sm:top-[88px]`. Homepage section uses `id="ondernemers"` (page.tsx:32) linked from hero/nav as `/#ondernemers`; grep for scroll-mt/scroll-margin across src/ returns nothing.`
  - Why: The 8px mismatch leaves a sliver of scrolling content visible above the sticky filter bar behind the semi-transparent navbar — messy on a flagship page. Worse, clicking 'Ontdek de ondernemers' / nav 'Ondernemers' jumps to #ondernemers but the sticky navbar (80-96px) overlaps the section heading, hiding 'Vind jouw plek op De Kamp' under the bar.
  - Fix (effort S): Set sticky offsets to match the navbar (`top-20 sm:top-24`) and add `scroll-mt-24 sm:scroll-mt-28` to the `#ondernemers` section so anchor jumps clear the fixed navbar.

- 🟡 MEDIUM — **External photos bypass next/image and no homepage card gets priority; loop-de-kamp inlines ~67 images/SVGs**
  - Evidence: `BusinessCard accepts `priority?` (line 9) but FeaturedHorizontal.tsx:35 and BusinessExplorer.tsx:172 render `<BusinessCard business={...} />` with no priority. External photos render as plain `<img loading={priority?'eager':'lazy'}>` (BusinessImage.tsx:75) — unoptimised full-res. loop-de-kamp/page.tsx:43-80 maps all ~67 stops, each inlining a full external <img> or a ~1-2KB placeholder SVG via dangerouslySetInnerHTML (placeholder.ts is 167 lines), inflating HTML to ~887KB.`
  - Why: External owner/Google photos bypass next/image entirely — no resizing/format negotiation, so large originals download full-size on mobile. Combined with 67 inline placeholder SVGs, this is the dominant page-weight driver. No first-viewport card is marked priority, so initial visible images can be deprioritised behind below-fold ones.
  - Fix (effort L): Pass `priority` to the first 1-2 featured cards and the first explorer row. Proxy/optimise external images through Cloudflare image resizing (or cache+resize into R2). On loop-de-kamp, paginate or lazy-mount below-fold stops to cut initial HTML.

- 🟡 MEDIUM — **DistrictMap is role=application with marker buttons but is effectively mouse-only**
  - Evidence: `DistrictMap.tsx:192-198 container `role="application" aria-label="Interactieve kaart..."`; markers are real <button>s with aria-label (132-135) but popups/navigation fire on `mouseenter`/`click` only (154-168); map is built in a client useEffect. No non-map list is paired with it for keyboard/SR users.`
  - Why: role=application passes keys to the widget, but MapLibre's default keyboard handling won't reliably let a SR user tab to individual brand markers, and popups only appear on hover. The explorer grid is the de-facto fallback but isn't announced as such. For an Amersfoort local guide this is a WCAG 2.1 keyboard-operability gap.
  - Fix (effort M): Make the grid the explicit accessible equivalent (visually-hidden 'een toegankelijke lijst staat hieronder'). Ensure markers are focusable in DOM order and open their popup on focus, not just mouseenter. Consider `role="group"` if keys aren't fully trapped.

- ⚪ LOW — **Several decorative-on-dark text tones sit near or below the AA contrast floor**
  - Evidence: `globals.css --stone #e7decf; Footer.tsx uses text-stone/40 and text-stone/30 (61, 80) and text-stone/20 (83) on bg-charcoal #18140f; Hero stat label text-white/50 (Hero.tsx:67); FeaturedHorizontal hint text-warm-brown/40 (19).`
  - Why: stone/30–stone/40 on charcoal and white/50 hint text fall below 4.5:1 AA for normal body text. Mostly small uppercase labels and copyright/area lists, so limited impact, but the area list and footer legal links are genuine content a low-vision user may want.
  - Fix (effort S): Bump the footer 'Area' list and copyright/legal links to at least text-stone/60, and the hero stat label to text-white/70. Reserve sub-AA opacities for purely decorative elements only.

- ⚪ LOW — **No review/rating social proof on the homepage or spotlight cards**
  - Evidence: `page.tsx renders Hero→SeoIntro→WandelShowcase→FeaturedHorizontal→Explorer→teasers→OwnerSubmitCta with no ratings surfaced; GoogleReviews.tsx is imported only in the detail flow (BusinessDetailClient.tsx), not the homepage. BusinessCard shows category/open/price but no star rating.`
  - Why: For a local guide that must rank and convert fast, aggregate review/rating signals are a primary trust and CTR driver and feed review schema for AI Overviews. Spotlight cards show no rating, so quality isn't readable at a glance, and the owner-submit CTA is the only conversion emphasised — visitor-side 'why trust this' is thin.
  - Fix (effort M): Surface a compact star rating on BusinessCard where Google review data exists, and add a small aggregate trust strip near the spotlight. Emit AggregateRating schema where ratings exist for rich results.


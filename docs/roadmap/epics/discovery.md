# Search, Filtering & Map Upgrade — Discovery & Exploration Epic

> Turn the homepage explorer into a fast, faceted, URL-addressable, SEO-clean discovery layer over the ~67 De Kamp businesses: keep client-side fuzzy search now with a D1 FTS5 backend seam ready for growth, formalise MapLibre as a brand component on an EU/key-free tile source, and upgrade loop-de-kamp into a structured TouristTrip itinerary.
> **Recommended phase:** Phase 4 (post-launch/hardening, post-events backend, parallel to GBP reviews). **Effort:** 5–8 weeks. **Teams:** Frontend, Backend/Infra, SEO/GEO/AEO, Design/UX, Content/Localization, Legal, Data/Analytics, Operations, Product, QA.
>
> **Reviewer's note (this is the finalized, adversarially-reviewed version).** The draft contained several stack-level inaccuracies that would have broken implementation. The four load-bearing corrections, all verified against the actual repo on 2026-06-19:
> 1. **Cron cannot be "a scheduled export in the same Worker file."** The OpenNext-generated `.open-next/worker.js` exports only `fetch`. A Cron Trigger requires a **custom worker wrapper** that re-exports the generated `fetch` and adds `scheduled`, with `wrangler.jsonc` `main` repointed at the wrapper and a `triggers.crons` array. Spelled out in §4 Backend.
> 2. **The price facet cannot map to `1|2|3|4`.** `Business.priceRange` in `src/data/businesses.ts` is free-text and inconsistent (`"$$"`, `"€-€€€"`, `"€10 - €25"`, `"Maatpakken vanaf ca. €499 (Business Suit)"`). A clean band facet requires a Content normalisation pass into a **new additive `priceBand?: 1|2|3|4`** field; the existing `priceRange` string stays as the human-readable label.
> 3. **The dietary field already exists** as `dietaryTags?: string[]` on the Business type — it is just unpopulated. Do **not** introduce a new `dietary` field; populate `dietaryTags` via Content + override.
> 4. **The `bm25()` weight count must equal the number of indexed columns.** `business_search` has 11 columns but `business_id` is `UNINDEXED`, so `bm25()` takes **10** weights, not 9. The draft's call was malformed. Corrected in §4/§5.

---

## 1. Goal & value

De Kamp is ~67 independent shops, cafés, restaurants and makers spread over five connected streets in the historic centre of Amersfoort. The single most valuable thing this site can do for the **district** is convert "I'm in town / I'm looking for X" intent into a foot through a specific door. Today the homepage `BusinessExplorer` already does category chips + free-text contains-search + "perfect voor" quick-filters + a "nu open" toggle + a real MapLibre map. It is good. It is also: (a) **not URL-addressable** — you cannot share or bookmark "alle koffieadresjes die nu open zijn", you cannot land on a filtered state from an AI answer or a newsletter link, and analytics can't see what people filter for; (b) **search is naïve** — a plain lowercased `includes()` over concatenated fields with no diacritic-folding (so "cafe" misses "café"), no typo tolerance, no synonyms ("kapper" vs "kapsalon"), and no field weighting; (c) **the map is an orphaned, partly-inaccessible component** — DOM markers built outside React, popups as inline HTML strings, no keyboard path, no skip-link, no loading skeleton; (d) **loop-de-kamp**, the district's signature "what to do here" asset, emits only a BreadcrumbList and has no structured itinerary; and (e) **the category landing pages and any filtered state are an SEO faceted-nav risk** the moment filters become crawlable URLs.

The problem this epic solves, per audience:

- **Visitors / locals (B2C):** find the right business in seconds — by need ("lunch", "cadeau", "nu open"), by type, by price — and explore the actual street geometry. Shareable filtered links and a real walking itinerary turn passive browsing into a planned visit.
- **Owners (B2B):** more qualified discovery traffic to their detail page. A business that is hard to find is invisible; better search/facets and a map that actually surfaces them is the single highest-leverage UX lever on their behalf, and it is free to them.
- **The district association / admin:** measurable discovery (what do people search for that we do not have? which categories pull?), a defensible SEO posture (no thin filter pages cannibalising the curated category pages), and an itinerary asset that wins "wat kun je doen op De Kamp / binnenstad Amersfoort" AI-answer and search queries — exactly the freshness/entity signals the 2026 guidelines reward.

Backend is the owner's headline priority, so the centre of gravity here is the **search data seam**: a derived D1 FTS5 index that stays correct against the merged `businessData` (seed + approved overrides), a clean `/api/search` route handler, a `search_log` for zero-result intelligence, and the tile-serving infrastructure for the map — all on the existing Cloudflare/D1/R2 stack with no new paid processors.

---

## 2. How it works in real life

**Personas & real businesses.** Visitor: **Sanne**, 31, lives in Amersfoort-Vathorst, on De Kamp for a Saturday afternoon. Owner: **Marco**, who runs a wijnwinkel on Langestraat/Kamp (a "Winkels & makers" entry). Admin/moderator: **Linda**, the district-association volunteer who curates listings and reviews edits.

**Sanne — search & facet journey (B2C):**
1. Sanne opens `ondernemersvandekamp.nl` on her phone. The hero loads instantly (LCP-safe; the map is deferred and not yet mounted). She scrolls to the explorer.
2. She types "kapper". Today that would only match the literal substring; after this epic, the client index has folded diacritics, weighted `name` and `subcategory` highest, and a synonym map expands "kapper" → also matches "kapsalon", "haar", "Beauty & verzorging". She instantly sees the relevant salons. The URL becomes `…/?q=kapper` so she can share it.
3. She actually wanted lunch. She clears search, taps the **Koffie & lunch** category chip and the **Nu open** toggle. The URL is now `…/?categorie=koffie-lunch-zoet&open=1`. The grid re-filters with the existing Framer animation; the map (if shown) dims non-matching markers. A result count reads "7 ondernemers".
4. She adds the **Lunch** "perfect voor" quick-filter → `…&voor=lunch`. She copies the link into her friends' WhatsApp group. Her friend opens it and lands on **exactly** that filtered state — because the page reads the query params on load and hydrates the explorer state from them.
5. She taps **Toon kaart**. A skeleton shows for ~300ms while `maplibre-gl` lazy-imports, then the brand-retinted Protomaps basemap fades in. Markers are now real focusable buttons; she taps one for **Marco's wijnwinkel**, sees the open-status dot + hours popup, and clicks through to the detail page.
6. If she had searched something the district does not have ("sushi", say) she hits the styled empty state ("Niets gevonden…") — and a sampled, IP-free beacon logs `q="sushi", results=0` to `search_log`, feeding Linda's monthly "demand we don't serve" report.

**Marco — owner perspective (B2B):** Marco does not operate search directly, but in `/beheer/[id]` he sees a small read-only "Hoe vindbaar ben je" panel: which category and "perfect voor" tags his listing carries and the synonyms that route to him. If his shop is mis-tagged he edits `subcategory`/`specialties`/`perfectFor` through the normal override flow; on approval, `rebuildSearchIndex()` runs and his listing immediately surfaces for the right queries. His incentive to keep his listing rich (descriptions, tags) is now directly tied to discoverability.

**Linda — admin/moderator (curation):** In `/admin` Linda has a new lightweight **Zoekinzicht** view: top searches (last 30 days), zero-result queries, and an editable **synonyms** table (`kapper → kapsalon, haar`; `borrel → wijn, bar, café`). When she approves Marco's edit, the same approval action that (once `d1-next-tag-cache` is wired) invalidates the tag cache also rebuilds the FTS5 index — she never manages the index by hand. A nightly cron reconciles the index and prunes old `search_log` rows, so she never has to think about drift.

---

## 3. Scope

**In:**
- URL-addressable explorer state (search query + all facets) via query params, with shareable/bookmarkable filtered links and back/forward support.
- Search hardening: diacritic folding, field weighting, prefix/typo tolerance, synonym/spelling map; keep it client-side for now.
- A dark-launched **D1 FTS5** search seam (`/api/search` + `rebuildSearchIndex()` + migration) wired behind a feature flag, ready to flip on as the dataset grows.
- Faceted filters: category, open-now, a **normalised price band** (`priceBand`, see §4 Content — requires a data pass; **not** derivable from the messy `priceRange` string), "perfect voor", and the **existing-but-unpopulated dietary facet** (`dietaryTags`: vegetarisch/vegan/glutenvrij/halal) where Content fills the data.
- SEO-clean indexing rules for filter permutations (canonical/robots/sitemap discipline) — the 9 curated category pages stay the only indexable facet surfaces.
- Map decision + upgrade: lock MapLibre, pick an EU/key-free tile source, formalise `DistrictMap` as a documented design-system component, fix accessibility, add loading/skeleton, deferred mount.
- loop-de-kamp upgrade: ordered itinerary, `TouristTrip`/`ItemList hasPart` schema, on-page numbered stops + map polyline, llms.txt route section.
- `search_log` (privacy-safe) + analytics events + Linda's `/admin` Zoekinzicht + synonyms.
- **A custom worker wrapper** (`src/worker.ts`) so a nightly Cron Trigger can run reindex + log-pruning — a prerequisite the draft glossed over (see §4 Backend).

**Out (this epic):**
- Full server-side search as the default path (FTS5 stays dark-launched until a growth threshold; we build the seam, we do not flip it for ~67 rows).
- GBP/Places reviews surfacing on the map/detail (separate epic; we only reuse `place_id` for "open in Google Maps" deep-links — and only the place_id, which is the one Places-API field exempt from the no-caching rule).
- Payments/Cadeaukaart, newsletter, owner self-service signup (separate epics).
- Full EN translation of search/facet copy (we make the URL + data model locale-ready; actual EN strings ship with the i18n epic).

**Later:**
- Geolocation "near me" sort (browser geolocation → distance sort) once consent UX is settled.
- Saved searches / "bewaar deze selectie" for returning visitors.
- Map clustering + a richer route mode (multiple curated routes beyond loop-de-kamp).
- Server-rendered search results page for very-high-intent queries if FTS5 is promoted to default.

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

**Routing & URL state.** The explorer stays on `/` (and the per-category `/categorie/[slug]` pages stay the indexable landings). Facet state moves into the URL as **query params** read via `useSearchParams()` and written via `router.replace()` (App Router, no full navigation) so filtering never triggers a server round-trip but is shareable and back/forward-aware. Canonical param vocabulary (locale-ready, language-neutral slugs): `q`, `categorie` (slug), `open` (`1`), `prijs` (`1|2|3|4` → `priceBand`), `voor` (perfect-voor slug), `dieet` (slug). On mount, hydrate `BusinessExplorer` state from `searchParams`; on every state change, serialise back. Keep the existing `useMemo` filtering and extend it with priceBand + dietary predicates.

> **Next 16 caveat (read first).** `node_modules/next/dist/docs/01-app` is the source of truth — AGENTS.md mandates reading it before coding because this is not the Next you remember. Specifically verify: (a) any component calling `useSearchParams()` **must** be inside a `<Suspense>` boundary or it forces the whole route to client-side bail-out at build; (b) `router.replace()` from `next/navigation` is the non-history-pushing updater — confirm whether the current build still supports the `{ scroll: false }` option and whether a shallow/`history.replaceState` path is preferred for pure param writes that must not re-run server components; (c) that updating params via `router.replace` does **not** silently re-trigger `getActiveBusinesses()` on the server (it should not, since data is passed down once at SSR). Do not assume Pages-Router `shallow` semantics — they do not exist in App Router.

**Server vs client.** `/` page component stays a Server Component reading `getActiveBusinesses()` (merged data) and passing a **lean projected search index** (id, name, slug, category, subcategory, tags, specialties, perfectFor, address, priceBand, dietaryTags, lat/lng) — **not** full Business objects — plus the rendering list to the client `BusinessExplorer`. `BusinessExplorer`, `DistrictMap`, `OpenBadge` remain client. Wrap the explorer subtree in `<Suspense>`.

**Search component.** Replace the inline `hay.includes(q)` with a small client search module `src/lib/search.ts`: normalise (`toLocaleLowerCase('nl')` + `String.prototype.normalize('NFD')` diacritic strip via `/\p{Diacritic}/gu`), tokenise, weight fields (name 3×, subcategory/tags 2×, specialties/perfectFor/address 1×), apply a synonym expansion map (shipped as static JSON, optionally hydrated from `/api/search/synonyms`), and rank by score. Keep it dependency-free (no Fuse.js at ~67 rows; a hand-rolled weighted token-overlap + prefix match is smaller and faster). Debounce input ~120ms. Typo tolerance at this scale = prefix match + a cheap 1-edit (Levenshtein ≤1) fallback only when zero exact/prefix hits — do not run edit-distance on every keystroke.

**Facets.**
- **Price band:** render from the **new `priceBand?: 1|2|3|4`** field (Content owns the mapping pass; see below). Until `priceBand` is populated for a business, that business is simply absent from price-filtered results (never guess a band from the free-text string at runtime). Display label stays the human `priceRange` string.
- **Dietary:** render from the existing `dietaryTags?: string[]` field (already on the type, currently empty in seed). Content fills it. The chip set is the controlled vocab: Vegetarisch / Vegan / Glutenvrij / Halal.
- Render facets as the existing `Chip`/toggle patterns. Add a single "Wis filters" that clears all params.

**Map.** Promote `DistrictMap` to a documented component: lazy-`import('maplibre-gl')` only on first show/viewport (it already async-imports — keep, but gate mount behind `showMap` AND an `IntersectionObserver`/interaction to protect LCP). Add a `<DistrictMapSkeleton>` (paper-coloured block + shimmer) shown until the style `idle` event. Convert markers to React-managed focusable `<button>`s where feasible; at minimum add `tabindex="0"`, `role="button"`, `aria-label`, and Enter/Space/Escape handlers to the DOM markers, plus a visible "Sla kaart over" skip-link before the map container. Add the loop-de-kamp polyline as a GeoJSON line layer. Keep an **accessible non-map fallback list** so keyboard/SR users are never map-dependent.

**Forms/images.** No new uploads. Reuse `BusinessImage` for marker popups. Add a `shortDescription` line-clamp to `BusinessCard` (a flagged AEO/UX win that also feeds search relevance).

**State summary:** explorer state = URL-derived (`categorie, q, open, prijs, voor, dieet, showMap`); `now` stays a client interval; `highlightIds` derived. No global store needed.

### Engineering — Backend & Infra (Cloudflare) — PRIORITY DEPTH

The backend job is to make search **correct, fast, derived, and growth-ready** without breaking the seed-only build or the `businessData` merge seam. Everything below is additive.

**1. D1 search index (derived cache, never source of truth).** Add `migrations/0003_search.sql`:

```sql
-- FTS5 full-text index. DERIVED from getActiveBusinesses() (merged seed+overrides).
-- business_id is UNINDEXED (stored, returned, NOT searched/ranked).
-- tokenize unicode61 remove_diacritics 2 folds café->cafe.
-- NOTE: D1 ships SQLite with FTS5 compiled in (verified available on D1);
-- if a future D1 image were to drop it, the GET /api/search path stays dark-
-- launched and the client search remains the live path, so this is non-blocking.
CREATE VIRTUAL TABLE business_search USING fts5(
  business_id UNINDEXED,   -- column 0: stored only
  name,                    -- 1
  subcategory,             -- 2
  tags,                    -- 3
  specialties,             -- 4
  perfect_for,             -- 5
  dietary,                 -- 6  (from dietaryTags joined)
  address,                 -- 7
  person,                  -- 8
  body,                    -- 9  shortDescription + longDescription excerpt
  tokenize = "unicode61 remove_diacritics 2"
);

-- Privacy-safe search analytics. No IP, no session id, no PII. 90-day retention via cron.
CREATE TABLE search_log (
  id            TEXT PRIMARY KEY,
  q_normalised  TEXT NOT NULL,           -- normalised + TRUNCATED to 64 chars (PII minimisation)
  results_count INTEGER NOT NULL,
  had_click     INTEGER NOT NULL DEFAULT 0,
  locale        TEXT NOT NULL DEFAULT 'nl',
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_search_log_created ON search_log(created_at);
CREATE INDEX idx_search_log_q ON search_log(q_normalised);

-- Admin-editable synonym / spelling expansion map.
CREATE TABLE search_synonyms (
  term       TEXT PRIMARY KEY,           -- normalised query term
  expansions TEXT NOT NULL,              -- JSON array of extra terms to OR-match
  updated_at INTEGER NOT NULL
);
```

The FTS5 table is a **cache**. The rule (mirrors the existing override discipline): **never index `src/data/businesses.ts` directly** — always index the merged output of `getActiveBusinesses()` so approved overrides, system photo rows, and GDPR purges are reflected. At ~67 rows a full rebuild is trivially cheap, so we do not maintain incremental row-level updates — we `DELETE FROM business_search; INSERT …` the whole set inside one D1 batch (`db.batch([...])`, atomic).

**2. `rebuildSearchIndex()` job (`src/lib/search-index.ts`).** Reads merged businesses, projects each to the FTS columns (joining arrays to space-separated strings, stripping HTML from `longDescription`), and rewrites the table in one `db.batch`. Invoked from **exactly the places that already invalidate cache**, so search can never be staler than the page:
- `src/lib/overrides.ts` → after `moderateOverride(id,'approved',…)` and after `setApprovedImage(...)`.
- `src/lib/gdpr.ts` → after `purgeBusiness(...)` / `purgeProfile(...)`.
- Build/deploy: a one-shot `db:reindex` for first population (see §4.8).
- **Nightly Cron Trigger** (see §4.3) — full reindex + `DELETE FROM search_log WHERE created_at < now-90d` + the audit's existing `auth_tokens`/`sessions` pruning. This is the reconciliation safety net against any missed invalidation.

Because the index rebuild is invoked from a Server Action / route context that already holds the D1 binding via `getCloudflareContext()`, no new binding is needed for the synchronous-on-approval path.

**3. Cron Trigger — requires a CUSTOM WORKER (the draft was wrong here).** The OpenNext-generated `.open-next/worker.js` exports **only** `fetch`. You **cannot** add a `scheduled` export to a generated file, and there is no "same Worker file" to edit. The supported pattern ([OpenNext custom-worker howto](https://opennext.js.org/cloudflare/howtos/custom-worker)) is:

1. Create `src/worker.ts` (compiled to a wrapper):
   ```ts
   // Re-export the OpenNext fetch handler and add a scheduled handler.
   import nextWorker from "../.open-next/worker.js";
   // Durable Object classes the OpenNext worker may export must also be re-exported
   // if the project ever enables them (queue / sharded tag cache / bucket cache purge).
   export { /* DOQueueHandler, DOShardedTagCache, BucketCachePurge */ } from "../.open-next/worker.js";

   export default {
     fetch: nextWorker.fetch,
     async scheduled(event: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
       ctx.waitUntil((async () => {
         // 1. prune expired auth_tokens + sessions (from the backend audit)
         // 2. rebuildSearchIndex(env)
         // 3. DELETE FROM search_log WHERE created_at < now-90d
       })());
     },
   } satisfies ExportedHandler<CloudflareEnv>;
   ```
2. Point `wrangler.jsonc` `main` at the build output of this wrapper (the OpenNext build emits `.open-next/worker.js`; the wrapper is bundled on top — follow the custom-worker howto for the exact `main`/build-order wiring, since `opennextjs-cloudflare build` regenerates `.open-next/`). Confirm the build order: `opennextjs-cloudflare build` first, then the wrapper bundles the produced file.
3. Add the trigger to `wrangler.jsonc`:
   ```jsonc
   "triggers": { "crons": ["17 3 * * *"] }   // 03:17 UTC nightly
   ```
   Use `event.cron` to branch if multiple schedules are ever added.

**Caveat to flag for the implementer:** because `rebuildSearchIndex()` runs inside the Worker isolate, it must obtain the D1 binding from the `env` passed to `scheduled`, **not** from `getCloudflareContext()` (which is request-scoped). Write `rebuildSearchIndex(env)` to accept an explicit `env`/`DB` so it works in both the request path and the scheduled path.

**4. Route handlers.**
- `GET /api/search` (`export const dynamic = 'force-dynamic'`) — query: `q, categorie, open, prijs, voor, dieet, locale`. Builds an FTS5 `MATCH` query with prefix tokens (`term*`) and synonym OR-expansion from `search_synonyms`, ranks with **a 10-weight** `bm25(business_search, 3.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5)` — **one weight per INDEXED column** (the 10 columns after `business_id UNINDEXED`: name, subcategory, tags, specialties, perfect_for, dietary, address, person, body … note bm25 weights map to indexed columns in declaration order; verify the exact arity against the final column list and adjust). Applies non-FTS facet filters (category/open/priceBand/dietary) as post-filters on the returned ids joined back to merged data. Returns `{ results: [{id,name,slug,category,score}], total }`. **Feature-flagged** (D1 `app_settings` key `search_backend = 'client'|'fts'`, falling back to `'client'`), dark-launched. This is the growth seam.
- `POST /api/search/log` → `204` — fire-and-forget, sampled (1-in-1 for zero-result, ~1-in-5 otherwise), validates payload, **stores no IP/session/PII**, truncates `q` to 64 chars, inserts a `search_log` row. Rate-limited (WAF, §4.6).
- `GET /api/route/loop-de-kamp` — returns ordered itinerary stops (business id + lat/lng + order + blurb) for the map polyline and itinerary list, derived from a curated `src/data/route-loop.ts` ordering joined to merged business data. **ISR note:** in Next 16 App Router, a GET Route Handler is statically cached only when it is fully static; using `getActiveBusinesses()` (which reads D1 at runtime outside build) makes it dynamic. Either (a) mark it `export const revalidate = 300` and accept it is recomputed within the ISR window, **knowing the tag cache is currently the dummy no-op** so `revalidateTag`/`revalidatePath` will not invalidate it on approval — time-based only; or (b) simpler and recommended: do **not** make this a route handler at all — compute stops in the `/loop-de-kamp` Server Component directly from merged data (one render, no extra endpoint) and only expose JSON if a client polyline genuinely needs a fetch. Prefer (b); drop the endpoint unless the client map provably needs it.
- `POST /api/search/synonyms` is **not** a public route — implement as a `requireAdmin`-gated **Server Action** from `/admin` (consistent with the existing `admin/actions.ts` pattern), upserting `search_synonyms`.

**5. Tile serving (map infra).** If we self-host Protomaps (recommended — §7): build a single `amersfoort.pmtiles` for a tight bbox around De Kamp, store it as an R2 object. Serve via `GET /tiles/[...key]` route handler (`force-dynamic`) that **honours HTTP Range requests** — PMTiles is a range-readable single file and MapLibre+the `pmtiles` protocol plugin issue `Range` reads. Implementation: read the `Range` header, pass `{ range: { offset, length } }` to `env.TILES.get(key, { range })`, and respond `206 Partial Content` with correct `Content-Range`/`Accept-Ranges: bytes`, else `200`. Set `Cache-Control: public, max-age=31536000, immutable`. Add a dedicated `TILES` R2 binding in `wrangler.jsonc` (cleaner than overloading `PHOTOS`). Keep OpenFreeMap as a documented runtime fallback style URL.

> **Verify before building:** confirm Workers R2 `.get()` supports the `range` option in the current `@cloudflare/workers-types`, and that `global_fetch_strictly_public` (already on) does not interfere with serving local R2 bytes (it does not — that flag governs outbound fetch). Confirm the `pmtiles` client lib's range requests succeed against the handler with a local `wrangler dev` smoke test before wiring the basemap.

**6. Bindings / config (`wrangler.jsonc`).** Add the `TILES` R2 binding. Add the `triggers.crons` array (§4.3). Add a D1 `app_settings` key `search_backend` (no schema change — `app_settings` is already a generic key/value table). **Unblocking prerequisites from the backend audit that this epic depends on:** (a) the **real `database_id`** must replace `REPLACE_WITH_D1_DATABASE_ID` (the app has never been deployed); (b) `d1-next-tag-cache` should be wired in `open-next.config.ts` + a `NEXT_TAG_CACHE_D1` binding so approval-time revalidation is instant — the search-index rebuild rides the same approval action, so instant tag-cache + instant index gives end-to-end correctness. **If (b) is not done, the index still rebuilds on approval (good), but the public page only reflects it after the 5-minute ISR window — document this gap, do not let it silently surprise QA.**

**7. Security & owner-isolation.** `/api/search`, `/api/search/log`, `/api/route/*` (if kept), and `/tiles/*` are **public** (no session). No owner data crosses these endpoints — search returns only already-public listing fields. Apply a **Cloudflare WAF rate-limit rule** (same pattern the audit recommends for `/login`): e.g. 60 req/min/IP on `/api/search*`, 30 req/min/IP on `/api/search/log` (it is a write), 120 req/min/IP on `/tiles*`. The synonyms admin path is `requireAdmin`-gated (Server Action). `search_log` writes are unauthenticated by design — mitigate poisoning via sampling + truncation + rate-limit; the data is low-stakes (aggregate query trends).

**8. Caching & migrations.** Client search = zero backend. `/api/search` responses get a short `s-maxage` (e.g. 60s) on `Cache-Control` keyed by the full query string (edge cache). Tiles immutable. `0003_search.sql` applied via the existing `db:migrate` (`wrangler d1 migrations apply --remote`) and `db:migrate:local`. Add a `db:reindex` npm script that runs a one-shot admin route or `wrangler d1 execute` to populate `business_search` after first migrate — the index is empty until first rebuild, so the FTS flag must stay `'client'` until reindex has run at least once.

### SEO / GEO / AEO

**The faceted-nav rule (most important).** Filter permutations must NOT become indexable. Concretely: (a) filtered states are **query params on `/`**, never new routes; (b) any request to `/` carrying a query string returns **`X-Robots-Tag: noindex, follow`** — set it on the response from `/` (since Next 16 `generateMetadata` cannot read live query params for a statically-cached Server Component, prefer the header route: emit it from Next.js `middleware.ts` keyed on `request.nextUrl.searchParams.size > 0`, OR add a tiny dynamic boundary; **do not** rely on `<meta robots>` injected client-side after hydration — crawlers may not execute it); (c) a `<link rel="canonical">` on `/` always points to the **clean `/`** (canonical is static and param-free); when only `categorie` is set, the **share button** links to the curated `/categorie/[slug]` so equity flows to the hand-written page; (d) **no `<a href>` anywhere points into a `?…` filter combination** — share links are produced by JS (clipboard copy), not crawlable anchors; (e) sitemap stays exactly as-is (8 static + 9 category + ~67 detail), parameters excluded. This protects the 9 hand-written category landing pages as the only category-facet surfaces.

> **Verify before building:** whether this project already has a `middleware.ts` (OpenNext supports Next middleware at the edge). If adding one, confirm it does not break the OpenNext middleware handler chain — the generated worker already invokes `middlewareHandler`. Read the OpenNext middleware howto before adding a `middleware.ts`.

**Schema additions.**
- `/loop-de-kamp`: add `TouristTrip` with `itinerary` as an `ItemList` whose `itemListElement` are `ListItem` → each `item` referencing the stop's `LocalBusiness @id` (`{businessUrl}#business`). Add `touristType`, and `provider` = the district `Organization @id`. This is the single biggest AEO win in the epic for "wat te doen / wandelroute binnenstad Amersfoort". Add the builder to `src/lib/schema.ts` (do not inline it in the page) so it is reusable and testable.
- Add `dateModified` to the discovery/itinerary page JSON-LD (freshness signal; >83% of AI citations are <12 months old). Pull from the max `updatedAt` across the route's stops, or the route data file's own timestamp.
- Ensure the existing `WebSite` `SearchAction` `urlTemplate` matches the new canonical `?q={search_term_string}` param (the homepage search **is** the site search).

**Reviews / place_id (ToS guardrail — restated because this epic touches the map).** This epic does **not** display Google reviews. It only reuses `place_id` for an "open in Google Maps" deep-link. That is compliant: `place_id` is the single Places-API field **exempt** from the no-caching/no-storing rule and may be stored in D1/seed. **Do not** in this epic: pre-fetch or cache any Places-API review text, rating, or photo; render `aggregateRating`/`review` schema on business pages (self-serving-review schema is **not** eligible for rich snippets for LocalBusiness/Organization since 2024 and would be a policy violation if numbers do not match a visible user-sourced source). Any star/rating display, the 5-review-max, the mandatory Google logo + attribution when no map is present, and the GBP-OAuth read path all belong to the **separate GBP/reviews epic**.

**Metadata/OG.** Keep canonical discipline above. The `/` and `/loop-de-kamp` OG images stay branded. Ensure `metadata.alternates.languages` is **wired but NL-only for now** so the EN flip is a data change, not a refactor (coordinate i18n epic).

**llms.txt.** Add an `## Wandelroute` section to the `/llms.txt` generator listing the loop-de-kamp stops in order with address/specialty, alongside the per-business lines. This makes the itinerary machine-extractable for AI answer engines. Keep it derived from the same merged data so it never drifts.

**Answer formatting (AEO).** The loop-de-kamp intro and the explorer's empty/help copy follow the 40–60-word answer-first chunk standard. Each itinerary stop gets a 1-sentence extractable "why stop here" line.

**Internal linking / topics.** Category chips and the itinerary cross-link to the curated `/categorie/[slug]` pages (real, indexable anchors), reinforcing topical clusters: "koffie Amersfoort binnenstad", "winkels De Kamp", "wandelen historische binnenstad". CWV: defer the map, keep INP <200ms — directly a ranking + AEO factor.

### Design / UX

**Screens/flows.** (1) Explorer control bar (existing) extended with price + dietary facets and an "active filters" summary chip row that doubles as a clear-each affordance. (2) Filtered/shareable state with a small "Deel deze selectie" / copy-link button (clipboard, not an anchor). (3) Map skeleton + accessible markers + skip-link + keyboard popup. (4) loop-de-kamp itinerary screen: numbered vertical stop list synced to a map polyline, "stop X van N", scroll-spy highlight.

**States.** Define empty (extend the good existing one for new facets), loading (map skeleton, search-pending shimmer on grid count), error (FTS endpoint failure → silently fall back to client search; tile failure → OpenFreeMap fallback → static district image + toast), success (result count + animated grid). Document all in the design tool.

**Responsive.** Facet bar already horizontal-scrolls on mobile (`no-scrollbar`) — keep; ensure new facets do not overflow the sticky bar height. Map full-width `min(68vh,560px)`. Itinerary stacks stop-list-over-map on mobile, side-by-side on lg.

**Motion.** Adopt the recommended `src/lib/motion.ts` presets (SPRING/FADE/CARD_HOVER) for the new pieces and add a **JS-layer reduced-motion guard** for the map fade and grid (CSS guard already exists, but Framer is not covered by it).

**WCAG AA / EAA.** Fix the global focus ring (use `--amber-ink`/white per the design audit — current `--amber` at ~3.2:1 fails SC 1.4.11 3:1). Map markers reach 3:1 non-text contrast and have visible focus. Dietary/price chips meet AA. Skip-link visible on focus. The map a11y work is partly an **EAA (June 2025) legal requirement**, not just polish (see Legal).

**Deliverables (Figma):** updated explorer bar with all facets + active-filter summary; map skeleton + focus/popup states; loop-de-kamp itinerary (desktop + mobile); the `DistrictMap` and facet chips documented in the design-system file. Co-own the **map tile/aesthetic decision** with the design-system lead so the brand retint survives the Protomaps switch.

### Content / Localization

**Price band normalisation (NEW, a real data task — the draft assumed this was free).** Content must produce, per business, a `priceBand: 1|2|3|4` (€ / €€ / €€€ / €€€€) judgement, because the seed's `priceRange` is free-text and inconsistent (`"$$"`, `"€-€€€"`, `"€10 - €25"`, `"Maatpakken vanaf ca. €499 (Business Suit)"`). This is a manual editorial pass over ~67 rows (a few hours), delivered as an additive seed field (and/or override). The human-readable `priceRange` string stays as the displayed label. **Estimate +0.5 wk; this is on the critical path for the price facet.**

**Dietary normalisation:** populate the existing `dietaryTags?: string[]` field. Content owns the controlled-vocab mapping from free-text specialties → tags (so "vegetarisch", "veggie", "plantaardig" all normalise to `vegan`/`vegetarisch` correctly), and decides where data is genuinely unknown (leave empty — never guess). This feeds both the facet and search synonyms. Many businesses will have no dietary data — that is fine; the facet only shows businesses that have it.

**Copy needed (NL-first, warm/je-jij register):** new facet labels ("Prijs": €/€€/€€€/€€€€; "Dieet": Vegetarisch/Vegan/Glutenvrij/Halal); active-filter summary microcopy; "Deel deze selectie"; the loop-de-kamp itinerary — an answer-first intro (40–60 words) + a one-line "why stop here" for each of ~8–12 stops, in the established editorial voice; enriched empty-state copy per facet; the map skip-link label ("Sla de kaart over").

**Synonyms:** Content seeds `search_synonyms` (kapper↔kapsalon↔haar; borrel↔wijn/bar/café; cadeau↔gift/kado) — the zero-result `search_log` becomes the ongoing backlog.

**EN/bilingual implication:** all new strings go through the i18n message structure (next-intl `nl.json`/`en.json`) even if EN is stubbed — never hardcode. Facet slugs in URLs stay language-neutral. Alt text for any new map/route imagery in NL.

### Legal / Compliance (GDPR + EAA)

- **Search logging:** `search_log` stores **no IP, no session id, no PII** — only a normalised, **64-char-truncated** query string, count, click flag, locale, timestamp. Lawful basis = legitimate interest (service improvement) with data minimisation; documented in the privacy policy, with a short **DPIA-lite** noting the residual risk that a user could type personal data into a search box (mitigated by truncation, exclusion from any export, aggregate-only use, and 90-day retention enforced by cron). Add a line to the privacy policy describing the search-analytics purpose and retention.
- **Analytics:** must be cookieless/consent-light (see Data) — no consent-banner trigger if we use a privacy-first, IP-anonymised tool. If a tool that sets cookies or fingerprints is ever chosen instead, a consent gate becomes mandatory under ePrivacy — keep that out of scope by sticking to Cloudflare Web Analytics / Plausible.
- **Map tiles (the GDPR driver behind the tile recommendation):** **Google Maps JS API** transfers user IP to Google (US transfer; requires consent + a processor relationship under current EU transfer law) — rejected. **MapTiler** has EU hosting + a DPA but still logs requester IP (third-party egress) — acceptable but adds a processor + DPA. **Self-hosted Protomaps `.pmtiles` on R2** keeps every tile request on Cloudflare, which already has a **signed DPA** covering this project — no new processor, no new DPA, no third-party IP egress. This is the compliant default. **OpenFreeMap** (current fallback) is community-hosted with no DPA/SLA and opaque server location — acceptable only as an emergency runtime fallback, **not** as the primary source for a GDPR-clean posture; document it as fallback-only.
- **EAA / EU Web Accessibility (in force June 2025):** the map accessibility fixes (keyboard path, skip-link, focusable markers, accessible non-map fallback list, focus-ring contrast) are partly a **legal** requirement for a public-facing service, not just UX. The accessible fallback list is the compliance backstop if the interactive map cannot be made fully SR-navigable.
- **No domain-law surface here:** no payments/e-money/PSD2 (Cadeaukaart epic), no voucher/VAT, no review-API ToS display surface (GBP epic — only the exempt `place_id` is reused, see SEO section). No marketing-consent surface (newsletter epic).
- **Processors touched:** Cloudflare (D1/R2/Workers — existing DPA), the chosen analytics vendor (Cloudflare = existing DPA; Plausible = new DPA, EU-resident), the tile source (none if self-hosted). All EU-resident.

### Data / Analytics

**Events:** `search_performed {q_len, results_count}` (no raw query client-side; raw goes only to the IP-free `search_log`), `filter_applied {facet, value}`, `filters_cleared`, `map_opened`, `map_marker_clicked {business_id}`, `business_click {from: 'grid'|'map'|'search'}`, `share_link_copied`, `itinerary_stop_viewed {order}`. Wire `had_click=1` on the latest matching `search_log` row when a `business_click {from:'search'}` follows a search within the session (best-effort; no session id is stored server-side, so the click flag is set by the same `/api/search/log` beacon carrying a client-only ephemeral correlation, never persisted).

**KPIs:** see structured `kpis` — discovery engagement rate, search success + zero-result rate, filtered→detail conversion, category organic entrances, map interaction rate, CWV (INP/LCP/CLS), itinerary engagement, AI-citation freshness.

**Dashboards:** (1) Discovery funnel (impression→filter→detail click). (2) Search intelligence (top queries, zero-result backlog from `search_log`, click-through). (3) CWV on `/` and `/loop-de-kamp`. (4) Map usage. Linda's `/admin` Zoekinzicht is the operational slice.

**Instrumentation:** privacy-first analytics (see §7) for client events; D1 `search_log` for query intelligence (queryable directly + surfaced in `/admin`). CWV via `next/web-vitals` reporting (or the analytics tool's web-vitals) to an optional `POST /api/vitals`.

### Operations / Owner-relations

**Human workflow:** Linda reviews the monthly **zero-result report** (from `search_log`) → either adds a synonym (`search_synonyms` via `/admin`), flags a content gap (a category the district has but is not tagged for), or notes genuine demand the district cannot serve (input to recruitment). **SLA:** synonym/tag fixes within 1 week; no new moderation queue (search is derived, not user-generated). **Owner onboarding:** the `/beheer` "Hoe vindbaar ben je" panel + a one-paragraph help note ("rijke tags = beter vindbaar") nudges owners to enrich listings — Operations owns this messaging. **Support:** "ik sta niet in de zoekresultaten" → check tags/category → owner edits via normal override flow → approval rebuilds index. No new support burden beyond synonym curation.

---

## 5. Data model & API

**D1 DDL:** see `migrations/0003_search.sql` in §4.1 — `business_search` (FTS5 virtual table, derived, `business_id` UNINDEXED), `search_log` (privacy-safe, 64-char-truncated query, 90-day retention), `search_synonyms` (admin-editable). No change to `app_settings` (the `search_backend` flag reuses the existing key/value table).

**Business type changes (additive, in `src/data/businesses.ts` type + seed):**
- `priceBand?: 1 | 2 | 3 | 4` — NEW, populated by Content; drives the price facet. (`priceRange: string` stays as the display label.)
- `dietaryTags?: string[]` — EXISTING field, currently empty; Content populates.

**R2 key conventions:**
- Tiles: `tiles/amersfoort-v{n}.pmtiles` (versioned, immutable; bump `{n}` to invalidate) under the new `TILES` binding. Served via `/tiles/[...key]` with Range support.
- No new photo keys; reuse the existing `business/{id}/…` convention.

**Route handlers:**
- `GET /api/search?q=&categorie=&open=&prijs=&voor=&dieet=&locale=` → `200 {results:[{id,name,slug,category,score}],total}` (FTS5 MATCH + 10-weight bm25 + synonym expansion + facet post-filter; feature-flagged via `search_backend`; `s-maxage=60`).
- `POST /api/search/log` body `{q,results_count,had_click,locale}` → `204` (sampled, IP/PII-free, q truncated to 64 chars, rate-limited).
- `GET /tiles/[...key]` → `200`/`206` (Range) tile bytes, `Cache-Control: immutable`.
- **(Prefer to drop)** `GET /api/route/loop-de-kamp` — only if the client polyline genuinely needs a fetch; otherwise compute stops in the `/loop-de-kamp` Server Component from merged data (see §4 Backend point 4b).
- Synonyms upsert is a `requireAdmin` **Server Action** in `admin/actions.ts`, **not** an HTTP route.

**Jobs:**
- `rebuildSearchIndex(env)` — accepts explicit `env` (works in both request and `scheduled` contexts). Invoked from `overrides.ts` (approval + setApprovedImage), `gdpr.ts` (purge), `db:reindex` one-shot, and the nightly Cron Trigger in the **custom worker** `src/worker.ts` (§4.3), which also prunes `search_log` and expired `auth_tokens`/`sessions`.

**Third-party API calls/webhooks:** none for search. Map = static tiles from R2 (or OpenFreeMap fallback style URL). No webhooks introduced.

---

## 6. User flows & state machine

**Explorer filter flow (client):** `idle` → user edits search/facet → `filtering` (URL params replaced via `router.replace`, `useMemo` recompute) → `results(n)` or `empty(0)`. On `empty`, fire `search_log` (zero-result). Back/forward navigates the param history → re-hydrate state. Edge cases: malformed/unknown param values are ignored (fall back to defaults); `open=1` with `now===null` (pre-hydration) must **not** flash an empty grid — treat `now===null` as "open filter not yet applied" until the clock hydrates, then re-filter; `prijs` referencing a band no business has → empty state, not error; `dieet` slug not in vocab → ignored.

**Search backend flip (dark→live):** flag `search_backend='client'` (default) → client search only. Flip to `'fts'` → frontend calls `GET /api/search`; on **any** error/timeout/empty-FTS-index it **silently falls back to client search** (graceful degradation — search must never hard-fail). Pre-flip invariant: `db:reindex` has run at least once (index non-empty). Correctness invariant: every approval/purge calls `rebuildSearchIndex(env)`; nightly cron reconciles.

**Map flow:** `unmounted` → user taps "Toon kaart" or map scrolls into view → `loading` (skeleton, `import('maplibre-gl')`) → `ready` (style `idle`, markers placed) → marker `hover`→popup, `click`→`router.push`. Edge: tile fetch fails → fall back to OpenFreeMap style URL → if that fails, show static district image + "kaart tijdelijk niet beschikbaar" and keep the grid + the accessible list (the non-map path). Keyboard: Tab into skip-link → skip past, or Tab into markers (geographic/address order) → Enter/Space opens popup → Escape closes + returns focus to the triggering marker.

**Itinerary flow:** load `/loop-de-kamp` → render numbered list + polyline from merged route data → scroll-spy highlights the active stop's marker. Edge: a route stop's business is purged/closed → itinerary skips it gracefully (route data is curated; the nightly cron flags broken stops — a stop id no longer in active businesses — to Linda).

---

## 7. Third-party choices

**Map tile source (the key decision):**
| Option | EU residency / GDPR | Fit (brand retint, key-free) | Cost @ scale |
|---|---|---|---|
| **OpenFreeMap (current)** | Community-hosted, no DPA, no SLA, server location opaque | Works today, full retint | Free, no guarantees — fallback only |
| **MapTiler (EU plan)** | EU hosting + DPA, but logs requester IP (third-party egress) | Excellent, key-based | Free tier then ~€25–295/mo |
| **Google Maps JS** | US transfer, consent required, processor complexity | Off-brand, hard to retint, ToS limits | Per-load billing, can exceed budget |
| **Protomaps self-hosted `.pmtiles` on R2 (RECOMMEND)** | All requests on Cloudflare (existing DPA), zero third-party IP egress | Full vector retint, key-free, single static file | **~€0/month** (one small R2 file + range reads) |

**Recommendation: self-host Protomaps `.pmtiles` for the Amersfoort bbox on R2.** Cheapest, most GDPR-clean (no new processor/DPA, no IP egress), total brand control for the "real-street-curve" retint, removes the OpenFreeMap SLA risk. Keep OpenFreeMap as a documented runtime **fallback** only. Keep **MapLibre-gl** as the renderer (already integrated) — do not regress to the bespoke SVG; retire it. Requires the `pmtiles` JS protocol plugin (~small, MIT, no network egress of its own) registered with MapLibre and pointed at `/tiles/...`.

**Search:** keep **hand-rolled client search** now (no Fuse.js — unnecessary weight at ~67 rows), with **D1 FTS5** as the built-but-dark-launched growth backend (FTS5 is compiled into D1's SQLite, EU-resident on Cloudflare, €0). No Algolia/Typesense/Meilisearch — overkill, paid, and adds a non-EU/processor surface for a ~67-row dataset.

**Analytics:** **Cloudflare Web Analytics** (€0, cookieless, IP-anonymised, no new processor/DPA, same Cloudflare account) is the recommended default, with custom events via a thin `POST /api/vitals`/beacon if CF's event model is too limited; otherwise **Plausible EU** (~€9/mo, richer custom events, EU-resident, new DPA). No Google Analytics (consent + US transfer).

---

## 8. Milestones & sequencing

0. **M0 — Unblock prerequisites (carried, not new effort here).** Real D1 `database_id` in `wrangler.jsonc`; first remote `db:migrate`; ideally `d1-next-tag-cache` wired. *Gate:* without `database_id`, nothing in this epic can be tested remotely. (Owned by launch/hardening epic; this epic blocks on it.)
1. **M1 — URL-addressable facets + SEO indexing rules (1–1.5 wk).** Query-param state in `BusinessExplorer` (`<Suspense>` + `useSearchParams`/`router.replace`), dietary facet (data-permitting), shareable links, `X-Robots-Tag: noindex,follow` for `?…` requests via `middleware.ts`, canonical to clean `/`, sitemap unchanged. *Deliverable:* shareable filtered homepage, zero new indexable surfaces. **Price facet deferred to M2 pending Content's `priceBand` pass.**
2. **M2 — Search hardening + FTS5 seam + price band (1.5–2 wk).** `src/lib/search.ts` (diacritics/weighting/synonyms/typo), `migrations/0003_search.sql`, `rebuildSearchIndex(env)`, the **custom worker `src/worker.ts`** + nightly Cron Trigger, dark-launched `GET /api/search` + `search_log` + `POST /api/search/log`, `db:reindex`. Content delivers `priceBand` → price facet ships. *Deliverable:* better client search live; FTS backend tested behind flag; cron pruning live.
3. **M3 — Map formalised + a11y + tiles (1.5–2 wk).** Protomaps `.pmtiles` on R2 + `/tiles/[...key]` **range** handler + `pmtiles` protocol wiring, `DistrictMap` as documented component, skeleton, keyboard/skip-link/popup a11y + accessible fallback list, deferred mount, motion presets. *Deliverable:* accessible, EU-clean, branded map; SVG retired.
4. **M4 — loop-de-kamp itinerary (0.5–1 wk).** Curated `src/data/route-loop.ts`, stops computed in the Server Component (no extra endpoint unless needed), numbered itinerary + polyline, `TouristTrip`/`ItemList hasPart` schema in `schema.ts`, llms.txt route section, answer-first copy, `dateModified`. *Deliverable:* itinerary asset live + structured.
5. **M5 — Analytics, /admin Zoekinzicht, QA, launch (0.5–1 wk).** Events instrumented, synonyms Server Action + zero-result report in `/admin`, Playwright e2e (facet URL round-trip, no-results, FTS→client fallback, map skip-link, range-request smoke), CWV budget verified, axe gate. *Deliverable:* measured, tested, shipped.

---

## 9. Dependencies

- **Production launch + hardening (HARD):** real D1 `database_id` and first remote migrate — nothing testable remotely without it. `d1-next-tag-cache` wired makes approval-time index + cache invalidation instant; if absent, public reflection lags by the 5-min ISR window (documented, acceptable interim).
- **Custom worker pattern (HARD, internal to this epic):** the Cron Trigger needs `src/worker.ts` + `main` repoint + `triggers.crons`; this is net-new infra the project does not yet have.
- **Content data pass (HARD for price facet):** `priceBand` normalisation over ~67 rows is on the critical path for M2's price facet.
- **Design-system epic (HARD for map polish):** map tile/aesthetic decision, `src/lib/motion.ts` presets, focus-ring fix are co-owned.
- **i18n scaffolding (HARD for content):** URL/param design must be locale-ready; strings go through next-intl namespaces from day one.
- **Events backend (SOFT):** itinerary + llms.txt benefit from dated events; not blocking.
- **GBP/reviews epic (SOFT):** reuse `place_id` only for Maps deep-links; review display is explicitly out of scope.
- **businessData merge seam (HARD invariant):** must remain the single read path; FTS index and route stops derive from it.

---

## 10. Risks & mitigations

(See structured `top_risks`. Headlines: faceted-nav thin pages → query-param-only + `X-Robots-Tag` header + canonical; cron is not a same-file export → custom worker wrapper (`src/worker.ts`) is the only supported path and is a real, sequenced task; price facet has no clean source data → Content `priceBand` normalisation pass on the critical path; FTS index drift → derive from merged data + rebuild on approval/purge + nightly reconcile; tile GDPR/cost → self-host Protomaps on R2; bm25 weight-count mismatch → exactly one weight per indexed column; map a11y/EAA → focusable markers + skip-link + accessible list fallback + axe gate; place_id is the only Places-API data reused, no review caching → ToS-clean.)

---

## 11. Acceptance criteria / Definition of Done

- [ ] Search query + every facet (category, open-now, **priceBand**, perfect-voor, dietary) are reflected in the URL; the state is shareable and survives back/forward and reload; unknown/malformed param values are ignored without error.
- [ ] No `?…`-parametered request to `/` is indexable: it returns `X-Robots-Tag: noindex, follow`; canonical on `/` is always the clean param-free `/`; sitemap is unchanged; no crawlable `<a href>` points into a filter combination.
- [ ] Client search is diacritic-insensitive, field-weighted, synonym-aware, and typo-tolerant (1-edit fallback on zero exact/prefix hits); "cafe"→"café", "kapper"→salons.
- [ ] `migrations/0003_search.sql` applies cleanly (local + remote); `business_id` is UNINDEXED; `rebuildSearchIndex(env)` is called on every approval/purge and nightly; after any approved edit the index matches `getActiveBusinesses()`.
- [ ] The **custom worker `src/worker.ts`** re-exports the OpenNext `fetch` (site fully functional) and adds `scheduled`; `triggers.crons` fires nightly; the scheduled run reindexes, prunes `search_log` >90d, and prunes expired `auth_tokens`/`sessions`. Verified with a manual `wrangler` scheduled-trigger invocation.
- [ ] `GET /api/search` returns correctly-ranked, facet-filtered results behind the `search_backend` flag using a **10-weight bm25** (one per indexed column); flipping to `'fts'` works and any error/timeout/empty-index silently falls back to client search.
- [ ] `search_log` stores no IP/PII, truncates `q` to 64 chars, enforces 90-day retention via cron; zero-result report visible in `/admin`; privacy policy + DPIA-lite updated.
- [ ] `priceBand` populated by Content for every business that should appear in the price facet; the free-text `priceRange` is never parsed at runtime to infer a band.
- [ ] Map renders from self-hosted Protomaps tiles on R2 via the range-capable `/tiles` handler (returns `206` for `Range` requests with correct `Content-Range`); OpenFreeMap fallback works; SVG map removed.
- [ ] Map: visible "Sla kaart over" skip-link, markers focusable in geographic order with Enter/Space + Escape, **accessible non-map list as the equivalent path**, loading skeleton, JS reduced-motion guard. Passes axe + manual keyboard audit; focus ring ≥3:1. (EAA conformance.)
- [ ] loop-de-kamp shows an ordered numbered itinerary + map polyline and emits valid `TouristTrip`/`ItemList hasPart` schema (Rich Results Test passes); llms.txt has the `## Wandelroute` section; intro is a 40–60-word answer-first chunk; page JSON-LD carries a fresh `dateModified`.
- [ ] No `aggregateRating`/`review` schema added; only `place_id` is reused (for the Maps deep-link). No Places-API review content is fetched, cached, or stored.
- [ ] Analytics events fire; CWV at p75 on `/` and `/loop-de-kamp`: INP <200ms, LCP <2.5s, CLS <0.1 (map deferred).
- [ ] Existing JSON-LD/SSG and the seed-only build (`NEXT_PHASE` guard) remain green; no regression to the `businessData` merge or the build's hermetic seed-only behaviour.
- [ ] Playwright e2e covers: facet URL round-trip, no-results state, FTS→client fallback, map skip-link, and a `/tiles` range-request smoke test.

---

## 12. KPIs & success metrics

(See structured `kpis`: discovery engagement >35%, search success >60% with a weekly zero-result backlog worked down, filtered→detail +20% rel., category organic entrances +30%/90d, map interaction rate, CWV budget held, itinerary engagement, AI-citation freshness via `dateModified`.)

---

## 13. Cost

**One-off:** engineering ~5–8 weeks (in-team), including the net-new custom-worker/cron infra and the range-capable tile handler; Content's `priceBand` + `dietaryTags` normalisation pass (~0.5 wk, on the critical path); generating the Protomaps `.pmtiles` for the Amersfoort bbox (free tooling, ~1 hour); Figma deliverables (in-team). **€0 external.**

**Monthly at this scale:** D1 FTS5 + `search_log` — within the existing D1 free/low tier (€0). Protomaps tiles on R2 — one small static file + range reads, effectively €0 (well within the R2 free tier already used for photos/cache). Analytics — **Cloudflare Web Analytics €0** (recommended) or **Plausible EU ~€9/mo** if richer custom events are needed. **Total: €0–9/month**, fully inside the €0–25 budget, no new EU processor/DPA if Cloudflare-only.

---

*Sources for the OpenNext custom-worker/cron correction: [OpenNext — Custom Worker](https://opennext.js.org/cloudflare/howtos/custom-worker), [Cloudflare — Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/).*

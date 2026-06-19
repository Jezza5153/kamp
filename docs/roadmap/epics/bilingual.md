# NL/EN Bilingual (Internationalization) — Ondernemers van de Kamp

> Add English alongside Dutch (default NL) for tourists and AI answer engines, via Next.js 16 App Router locale routing, a D1 translation store with machine pre-translation + human review, and full per-locale SEO/GEO/AEO — without breaking the existing SSG/ISR pipeline or any JSON-LD.
> **Recommended phase:** Phase 6, with the foundation scaffolding (M0) pulled forward into Phase 4 so it lands while routing churn is cheap. **Effort:** 6–10 weeks. **Teams:** Frontend, Backend/Infra, SEO/GEO/AEO, Design/UX, Content/Localization, Growth, Legal, Data/Analytics, QA/Release, Product, Owner-relations.

> **Reviewer note (this document is the finalized version after an adversarial pass).** Three corrections were load-bearing and have been folded in: (1) Next.js 16 **renamed the `middleware` convention to `proxy`** — there is no `src/middleware.ts` in this codebase's Next version; the file is `src/proxy.ts` exporting `proxy()`. (2) The Next 16 **native i18n pattern requires every route under `app/[lang]`**, which would force NL under `/nl` and break every existing canonical/inbound link/Search Console record. Keeping NL prefix-less at the root therefore requires either a library that supports an unprefixed default locale **verified against Next 16 + the proxy rename**, or a proxy-rewrite approach. The default recommendation is now the **native dictionary pattern with a proxy rewrite** (zero new deps, fully edge-safe), with next-intl demoted to an evaluated option gated on a compatibility spike. (3) Machine-translated pages must be **`noindex` until human-reviewed** — this is now a hard acceptance criterion, not a "either/or".

---

## 1. Goal & value

Amersfoort's historic centre is a tourist destination (Mondriaan, the Koppelpoort, the muurhuizen, VVV walking routes). A large share of "things to do in Amersfoort old town", "best independent shops near me", "where to eat Amersfoort" queries — from human visitors and increasingly from AI answer engines (ChatGPT, Perplexity, Google AI Overviews) — are made in **English**. Today every byte of the site is Dutch, so:

- **Visitors** (international tourists, expats, exchange students, non-Dutch-speaking residents) bounce or never discover De Kamp at all.
- **Owners** lose a real, high-intent audience that is physically standing in the binnenstad with a phone.
- **The district** has zero English-language entity footprint, so AI engines answering English queries about Amersfoort never cite De Kamp — they cite Booking/TripAdvisor instead.

**The problem solved:** make De Kamp discoverable and usable in English while keeping Dutch the canonical, default experience and **never** degrading the Dutch SEO/GEO foundation that already ships. The win is twofold: (1) classic local-SEO reach to English searchers, and (2) AEO — becoming the cited English-language source-of-truth for "independent shops & hospitality in Amersfoort's old town", anchored on a clearly-defined bilingual district entity.

This is explicitly **additive**: NL stays at the root, EN lives under `/en`, and the existing JSON-LD/SSG/ISR contract is preserved per locale.

---

## 2. How it works in real life

**Personas:** *Emma* (28, British, weekend visitor in Amersfoort), *Jimmy Karaaslan* (owner of **Atelier Misura Sartoria**, Kamp 1 — a real De Kamp business), *Wendy* (district-association volunteer + site admin/moderator).

**Emma discovers De Kamp in English.**
1. Saturday morning, Emma asks ChatGPT "independent shops and good coffee in Amersfoort old town". Because we now publish *reviewed* English pages with strong entity schema and an English `llms.txt`, the answer cites *ondernemersvandekamp.nl/en* and names a few shops.
2. She taps through to `https://ondernemersvandekamp.nl/en`. Her browser sent `Accept-Language: en`; the proxy confirms `/en` is correct and serves the English home page. The hero keeps the Dutch brand mark "De Kamp leeft." with an EN sub-line; the explorer chips read "All / Food & drink / Shopping / Makers / Care", "Open now", "Map".
3. She filters to **Shopping** and opens **Atelier Misura Sartoria**. The detail page is in English: short description, the "story" (longDescription), specialties, opening hours rendered as "Open until 21:00 (Thursday late-night shopping)", a Google Maps link, and an FAQ in English. The URL is `/en/ondernemers/atelier-misura-sartoria` (slug NOT translated — see §4 SEO); `hreflang` tags cross-link the NL twin and vice-versa.
4. She switches to NL using the language switcher (globe icon) to check the street-name spelling — the switcher keeps her on the *same business*, just the NL URL. She plans a route, walks over, buys a shirt.

**Jimmy keeps his English listing honest.**
1. Jimmy logs into `/beheer` (magic link, unchanged). His listing now shows two tabs: **Nederlands** (source) and **English**.
2. The English tab is pre-filled with a machine translation (DeepL) of his current NL copy, clearly labelled "Automatically translated — please review". He fixes "maatpakken" → "bespoke suits" (DeepL said "tailored suits"; he prefers "bespoke") and tweaks the story.
3. He submits. His English edit goes into the **same moderation queue** as Dutch edits — `status='pending'`. Nothing is public yet.
4. Two weeks later Jimmy updates his NL opening hours. On approval, the system notices the NL `longDescription` `source_hash` changed, marks the corresponding EN field **stale**, and re-queues a machine re-translation. Until re-reviewed, the EN page falls back to the *reviewed* EN where unchanged and to NL (with correct `lang`-tagged span and valid hreflang) only for the changed field — never a broken half-page.

**Wendy moderates both languages.**
1. Wendy opens `/admin`. The pending queue now has a **language column**. She sees Jimmy's English edit beside the NL source and the machine suggestion: three columns, NL (read-only) / machine EN / Jimmy's EN.
2. She approves. The EN `business_translations` rows flip to `status='reviewed'`, the per-locale tag cache is invalidated (instant if the d1-next-tag-cache override is wired, otherwise within the 5-min ISR window), and `/en/ondernemers/atelier-misura-sartoria` updates with a fresh EN `dateModified`.
3. For the ~67 seed businesses, Wendy doesn't translate by hand from scratch: a nightly cron pre-translated everything with DeepL into `status='machine'`. She works a review queue, approving/correcting locale by locale — a curation job, not a translation job. Pages only enter the EN sitemap once `status='reviewed'`, and the `/en` route emits `<meta name="robots" content="noindex">` until then, so Google never indexes thin machine text.

---

## 3. Scope

**In (v1):**
- App Router locale routing: NL prefix-less at root, EN under `/en` (mechanism decided in §4 Frontend after a compatibility spike).
- Locale negotiation + redirect in `src/proxy.ts` (the Next 16 successor to middleware); `<html lang>` dynamic.
- UI string layer (`nl.json` source-of-truth + reviewed `en.json`): nav, footer, explorer, badges, forms, empty/loading/error/success states.
- Language switcher that preserves the current entity/page.
- D1 translation store for the ~67 businesses' core fields (name, shortDescription, longDescription, specialties, perfectFor, keyFacts labels/values) + the 6 key static pages (over-de-kamp, praktisch, cadeaukaart, loop-de-kamp, category blurbs, aanmelden) + image alt text.
- DeepL machine pre-translation + admin human-review queue + owner self-service EN tab.
- Owner-edit → EN re-translation staleness pipeline keyed on `source_hash`.
- Per-locale: hreflang + x-default, canonical-to-self, sitemap alternates, `/en/llms.txt`, localized JSON-LD (`inLanguage`, localized name/description/FAQ, retained per-locale `@id`, per-locale `dateModified`), `noindex`-until-reviewed gating.
- Analytics locale dimension; GDPR review (DeepL sub-processor) + privacy-policy update.

**Out (v1):**
- Owner-story editorial strand in EN (rides the owner-story epic).
- Agenda/event *prose* translation beyond machine + Event schema `inLanguage` (events epic owns content).
- Newsletter EN broadcasts (newsletter epic owns content; we only add a `locale` column to its subscriber table when it lands).
- Languages beyond EN (DE/FR) — architecture supports them, content does not.
- Real-time/in-page on-the-fly translation widgets (Google Translate banner) — explicitly avoided; bad for SEO and brand.
- **Translated URL slugs** — slugs stay Dutch in both locales (`/en/ondernemers/atelier-misura-sartoria`). Translating slugs adds a slug-mapping table, redirect debt, and breaks the entity-aware switcher for marginal SEO gain. Deferred indefinitely.

**Later:**
- DE/FR using the same pipeline once EN proves ROI.
- EN owner stories (Article schema with author Person `@id`).
- Localized OG images (EN headline variant via a `locale` param on the OG route).
- Glossary-locked DeepL (brand terms: "De Kamp", "koopzondag", street names never translated).

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

> **Stack reality check (verified against this repo's `node_modules/next` v16.2.9 docs):**
> - The middleware file convention is **deprecated and renamed to `proxy`**. The negotiation/redirect logic lives in **`src/proxy.ts`** exporting `proxy(request: NextRequest)`, NOT `middleware.ts`. Any guide/snippet that says `middleware` is stale for this stack.
> - Next 16's **native** i18n pattern (`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`) puts **all** routes under `app/[lang]/` and forwards `lang` to every layout/page via `PageProps<'/[lang]'>`. There is no built-in "unprefixed default locale" option — that behaviour comes from a library or from a proxy rewrite.

**Routing scheme (locked decision, mechanism chosen by spike):** Keep **NL prefix-less at the root** and add **EN under `/en`**. Do *not* move NL under `/nl` — that breaks every existing canonical, inbound link and Search Console record. Two viable mechanisms; pick one in the M0 spike (1–2 days, blocking):

- **Option A — native dictionaries + proxy rewrite (RECOMMENDED, zero new deps, lowest edge risk).** Put routes under `app/[locale]/`. In `src/proxy.ts`, for a path with **no** `/en` prefix, *internally rewrite* (`NextResponse.rewrite`) to `/nl/<path>` so the `[locale]` segment resolves to `nl` while the **visible URL stays prefix-less**. For `/en/...`, pass through. `generateStaticParams` emits both locales. Use the `getDictionary(locale)` server-only loader from the Next 16 doc verbatim for UI chrome. This is fully documented for this exact Next version, runs at the Workers edge with no Node-only API, and ships zero message bundle to the client by default.
- **Option B — next-intl, ONLY if the spike confirms it.** next-intl offers `localePrefix: 'as-needed'` (unprefixed default) and entity-aware `getPathname`/`redirect` helpers out of the box. **Risk to verify in the spike:** next-intl historically wires its locale negotiation through `middleware.ts`; confirm the installed version exports a `proxy`-compatible entry (or that `middleware.ts` is still honored as an alias) on Next 16.2.9 running under `@opennextjs/cloudflare`, and that its RSC message API works at the edge. If any check fails, fall back to Option A. **Do not assume next-intl works — it is not installed today and its Next-16/proxy compatibility is unverified.**

**Implementation (common to both options):**
- **`src/proxy.ts`:** negotiate locale from path → cookie (`NEXT_LOCALE`) → `Accept-Language` (use `@formatjs/intl-localematcher` + `negotiator` as the Next doc shows, or next-intl's negotiator). Redirect `/en`-eligible users only on first visit; never auto-redirect away from an explicit choice (respect the `NEXT_LOCALE` cookie). Matcher must exclude `/media`, `/_next`, static assets, `sitemap.xml`, `robots.txt`, `/llms.txt`, `/en/llms.txt`, `/opengraph-image`, `/auth`, `/logout`, `/beheer`, `/admin` (portal/admin stay NL-only in v1). Keep the proxy allocation-light — it runs on every request at the edge.
- **`<html lang>`:** set dynamically from the active locale in the root layout (currently `<html lang>` is **not set at all** — this epic fixes a standing WCAG/SEO bug as a free side effect). With Option A this is `app/[locale]/layout.tsx`.
- **Server vs client:** translation lookups happen in **Server Components** so the render path stays SSG/ISR and no message bundle ships to the client unnecessarily. Client components (Navbar, BusinessExplorer, OpenBadge, HoursTable, DistrictMap popups, LanguageSwitcher, the EN owner tab) receive only the **scoped namespaces** they need via props or a provider — never the whole dictionary.
- **`generateStaticParams`** per dynamic route (`/[locale]/ondernemers/[id]`, `/[locale]/categorie/[slug]`): emit the cartesian product of locales × ids so both locales are statically generated; keep `revalidate = 300`. Continue to read params from the build-time seed (`allBusinessesSeed`) so the build stays hermetic.
- **Data fetching:** extend the single read seam — `getActiveBusinesses(locale)` (see Backend). NL is the identity path (no extra query). All existing components keep working because the merged `Business` object **shape** is unchanged — only string *contents* differ by locale.
- **Components:**
  - New `<LanguageSwitcher>` (client): globe icon in Navbar + footer. It maps the *current* path to its counterpart **entity-aware**: `/en/ondernemers/x` ↔ `/ondernemers/x`. Compute via `usePathname()` and a deterministic prefix-add/strip that is dynamic-segment-safe (the slug is identical across locales, so this is a pure prefix toggle — but unit-test it against `/`, `/en`, `/categorie/[slug]`, deep paths, and trailing slashes). `hreflang` + `lang` attrs on each option; `aria-label`; keyboard-operable; focus-visible ring uses `--amber-ink`/white (NOT bare `--amber`, which fails the 3:1 non-text contrast SC 1.4.11 per the design audit).
  - `BusinessExplorer`, `Navbar`, `Footer`, `OpenBadge` (status labels), `HoursTable` (day names → use `new Intl.DateTimeFormat(locale,{weekday:'long'})` so "maandag"/"Monday" come from the platform, not a string table), `BusinessCard` (specialty tags + the to-be-added shortDescription excerpt), `AanmeldenForm`, empty/error states — all read from message namespaces.
  - **Owner EN tab** in `/beheer/[id]`: a client component with the NL source shown read-only beside each EN field, the machine suggestion prefilled, and a "this is machine-translated, please check" `<Alert variant="info">`. Submits via a server action (see Backend). Per-field "stale — NL changed" chip when `stale=1`.
- **Images:** image URLs are locale-agnostic (same R2 objects); only **alt text** is localized (see Content/Backend). OG image stays site-level for v1.
- **A11y / reduced-motion** unchanged; ensure switcher and language tabs are keyboard-operable and focus-visible.

**Frontend deliverables:** M0 routing spike + decision memo; `src/proxy.ts`; `app/[locale]` route migration (or Option-B wiring); `LanguageSwitcher`; dictionary/provider wiring; message-namespace extraction; owner EN-tab UI.

### Engineering — Backend & Infra (Cloudflare) — **priority depth**

Governing principle: **translate at write-time, store the result as a per-locale delta in D1, merge at read-time.** This mirrors the existing `business_overrides` pattern exactly — no DeepL call ever happens on the render path, and the edge adds at most one extra indexed D1 read per non-NL page.

**D1 schema (new migration `migrations/0003_i18n.sql`):**

```sql
-- Per-locale translated business fields, merged onto the NL-merged Business.
CREATE TABLE business_translations (
  id            TEXT PRIMARY KEY,             -- crypto.randomUUID()
  business_id   TEXT NOT NULL,                -- seed id (no FK, matches overrides convention)
  locale        TEXT NOT NULL,                -- 'en' (extensible: 'de','fr')
  field         TEXT NOT NULL,                -- 'name'|'shortDescription'|'longDescription'|
                                              -- 'specialties'|'perfectFor'|'keyFacts'|'imageAlt'
  value         TEXT NOT NULL,                -- string, or JSON for array/struct fields
  source_hash   TEXT NOT NULL,                -- sha-256 of the NL source value at translation time
  status        TEXT NOT NULL DEFAULT 'machine', -- 'machine'|'pending'|'reviewed'|'rejected'
  engine        TEXT,                         -- 'deepl' | 'human' | 'owner'
  stale         INTEGER NOT NULL DEFAULT 0,   -- 1 when NL source changed since translation
  translated_by TEXT,                         -- profile id | 'system'
  translated_at INTEGER NOT NULL,
  reviewed_by   TEXT,
  reviewed_at   INTEGER
);
CREATE UNIQUE INDEX uq_biz_tr        ON business_translations(business_id, locale, field);
CREATE INDEX        idx_biz_tr_serve ON business_translations(locale, status, stale);
CREATE INDEX        idx_biz_tr_biz   ON business_translations(business_id, locale);

-- Per-locale translated static-page / FAQ content (not chrome; chrome lives in en.json).
CREATE TABLE page_translations (
  id          TEXT PRIMARY KEY,
  page_key    TEXT NOT NULL,                  -- 'over-de-kamp'|'praktisch'|'cadeaukaart'|
                                              -- 'loop-de-kamp'|'category:horeca'|'faq:praktisch:1'...
  locale      TEXT NOT NULL,
  namespace   TEXT NOT NULL,                  -- logical block within the page
  value       TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'machine',-- 'machine'|'pending'|'reviewed'|'rejected'
  stale       INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL
);
CREATE UNIQUE INDEX uq_page_tr        ON page_translations(page_key, locale, namespace);
CREATE INDEX        idx_page_tr_serve ON page_translations(locale, status, stale);

-- Async pipeline ledger. Used even in the synchronous-cron design as a retry/error log
-- so a DeepL failure is observable in /admin and re-attemptable, rather than silent.
CREATE TABLE translation_jobs (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,                   -- 'business'|'page'
  ref_id     TEXT NOT NULL,                   -- business_id or page_key
  locale     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'queued',  -- 'queued'|'running'|'done'|'failed'
  attempts   INTEGER NOT NULL DEFAULT 0,
  error      TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_jobs_status ON translation_jobs(status, locale);
```

Notes: no FK on `business_id` (matches the existing `business_overrides`/`business_media` convention where the seed id is the soft reference). SQLite has no native `sha256`; compute `source_hash` in the Worker via WebCrypto (`crypto.subtle.digest('SHA-256', …)`) before writing — do not attempt it in SQL. JSON fields (`specialties`, `perfectFor`, `keyFacts`) are stored as JSON text and `JSON.parse`d on read, mirroring how `business_overrides.fields` already works.

**Read path (the seam):** extend `src/lib/businessData.ts` — change `getActiveBusinesses()`/`getBusinesses()`/`getBusiness()` to accept an optional `locale: Locale = 'nl'`:
- For `nl`: **byte-for-byte the current behaviour** (seed + approved overrides). No new query, no regression risk.
- For `en`:
  1. Build the NL-merged `Business[]` exactly as today (this is the fallback layer).
  2. One indexed query: `SELECT business_id, field, value FROM business_translations WHERE locale = ? AND status = 'reviewed' AND stale = 0` (hits `idx_biz_tr_serve`).
  3. Spread-merge per `business_id`: replace only reviewed, non-stale EN fields; everything else stays NL. `JSON.parse` array/struct fields; on parse failure skip that field (don't fail the page), mirroring the existing override loop's per-row try/catch.
- Keep the same `NEXT_PHASE === 'phase-production-build'` short-circuit so the build stays seed-only and hermetic.
- Catch-wrapped: any D1 failure → silently return the NL-merged set (EN page degrades to NL content but stays up; hreflang and `<html lang="en">` still valid, individual NL spans get `lang="nl"`).

**Write path (server actions / cron):**
- `submitTranslation(businessId, locale, field, value)` — owner action: `requireUser` + `canEdit(businessId)`; UPSERT a `business_translations` row `status='pending'`, `engine='owner'`, `source_hash = sha256(currentNLValue)`. Supersede any prior `pending` for the same `(business_id, locale, field)` (mirror the media-supersede pattern). Length/`field`-allowlist validation server-side.
- `moderateTranslation(id, 'reviewed'|'rejected', reviewerId, reason?)` — admin action (`requireAdmin`): stamp reviewer/time; on `reviewed`, `revalidateTag('biz:en:'+businessId)` (a no-op today, instant once d1-next-tag-cache is wired).
- `machineTranslateBusiness(businessId, locale)` — admin/cron: for each translatable field lacking a `reviewed`/`pending` row, or with `stale=1`, call DeepL, write `status='machine'`, `engine='deepl'`. Never auto-publishes (machine rows are excluded from the serve query). Records a `translation_jobs` row so failures surface in `/admin`.
- **Staleness hook in the existing `moderateOverride` approval path (the single most important integration point):** when an NL override is approved, recompute `sha256` of each affected field's new NL value; any `business_translations`/`page_translations` row whose stored `source_hash` differs → `UPDATE … SET stale = 1` and enqueue a `translation_jobs` row. The nightly cron picks these up and re-machine-translates them, resurfacing them in the review queue. This is what keeps EN honest without a human watching.
- `submitPageTranslation` / `moderatePageTranslation` — admin-only analogues for `page_translations` (pages have no owner).

**DeepL call (server action or cron ONLY, never render path):**
```
POST https://api.deepl.com/v2/translate
Authorization: DeepL-Auth-Key <key>
Content-Type: application/json
{ "text": [ ... ], "source_lang": "NL", "target_lang": "EN-GB",
  "tag_handling": "html", "context": "De Kamp, an independent shopping & hospitality
  district in the historic centre of Amersfoort, Netherlands",
  "glossary_id": "<brand-glossary>" }
```
`global_fetch_strictly_public` is already enabled, so outbound `fetch` works at the edge. Batch multiple fields per request (DeepL accepts an array of `text`) to stay well inside rate/size limits — the whole ~67-business corpus is a handful of batched requests. Use the **free tier endpoint** `https://api-free.deepl.com/v2/translate` for dev/testing and the Pro endpoint in prod; key is environment-scoped.

**Bindings (`wrangler.jsonc`) and env:**
- `NEXT_TAG_CACHE_D1` (second D1 binding) + the `d1-next-tag-cache` override in `open-next.config.ts` — so `revalidateTag('biz:en:atelier-…')` invalidates the EN page **instantly** on approval instead of waiting the per-locale 300 s ISR window. The current `open-next.config.ts` sets only `incrementalCache` (dummy tag cache → all `revalidateTag` calls are no-ops). With locales doubling the page count, time-based-only invalidation gets noticeably staler; wiring d1-next-tag-cache is **strongly recommended before EN launch** (and is a shared dependency with the broader backend roadmap).
- `DEEPL_API_KEY` — add to the `KampEnv` interface in `src/lib/cf.ts` (it is **not** there today), set via `wrangler secret put DEEPL_API_KEY`, and also readable from `app_settings` like the Resend key so it's rotatable in `/admin/instellingen` without a redeploy. Add a `deepl_api_key` row handling to `settings.ts` (`getDeeplKey()` with env → app_settings → undefined fallback).
- (Deferred) `TRANSLATION_QUEUE` Cloudflare Queue — for v1 scale (~67 businesses, a few owner edits/week) **synchronous DeepL-in-cron is sufficient**; the `translation_jobs` table gives retry/observability without a Queue. Add Queues only if volume grows or DE/FR multiply the corpus.

**Cron (scheduled Worker export, same Worker; `wrangler.jsonc` `triggers.crons`):** nightly — (a) machine-pre-translate any business/page field lacking an EN row; (b) reset `stale=1` rows to a fresh `machine` translation so the review queue resurfaces them; (c) drain `translation_jobs` (retry failed, cap `attempts`); (d) — shared with the broader backend plan — prune expired `auth_tokens` and `sessions`. Zero extra cost on Workers. **OpenNext note:** confirm the `scheduled()` handler is exported through the `.open-next/worker.js` entry; OpenNext wraps the Worker, so the cron export must be re-exported from the OpenNext worker (verify in the M2 spike — if OpenNext does not forward `scheduled`, fall back to a tiny **separate** Worker bound to the same D1, or a Cloudflare Cron-triggered route handler hit via Cron Trigger fetch).

**Caching:** per-locale tags (`biz:{locale}:{id}`, `cat:{locale}:{slug}`, `page:{locale}:{key}`). `revalidate=300` retained per locale. The R2 incremental cache (`kamp-next-cache`) now holds ~2× pages — negligible at this scale, well within R2 free limits.

**Security & owner-isolation:** unchanged model — `canEdit(businessId)` gates owner translation submits; only admins moderate; machine rows never serve. No new auth surface, no new public write endpoint (server actions only). Apply the same rate-limit posture to translation submit actions as to other owner writes (and the WAF `/login` rate-limit from the backend roadmap). DeepL key is a secret, never exposed client-side.

**Migrations:** add `0003_i18n.sql`; apply via existing `db:migrate` / `db:migrate:local`. Purely additive — no change to existing tables.

### SEO / GEO / AEO

- **hreflang (critical):** every page emits **bidirectional** `hreflang` via Next.js `metadata.alternates.languages` — `nl`, `en`, and `x-default` (point `x-default` at the **NL root**, the default audience). The NL page links to its EN twin and vice-versa; mismatched/one-way hreflang is the #1 i18n SEO failure. Validate with a bidirectional crawl (Screaming Frog hreflang report) and Search Console.
- **Canonical:** each locale page is canonical to **itself** (`/en/...` canonical = `/en/...`), never cross-locale. With correct hreflang, translations are not duplicate content. The existing `alternates: { canonical: "/" }` in `layout.tsx` must become per-locale-aware.
- **Indexability gating (hard rule):** an `/en` URL is **`noindex`** (via `metadata.robots`) AND absent from the sitemap until **all** of its served fields are `status='reviewed'`. Machine-only EN pages must never be indexed — thin/auto-translated content is a documented quality risk and can drag the whole domain. The page may still *render* for a logged-in reviewer/preview, but ships `noindex` to crawlers. Flip to indexable + add to sitemap atomically on review completion.
- **Slugs stay Dutch** in both locales (no slug translation). This keeps the entity-aware switcher a pure prefix toggle and avoids redirect debt; the SEO cost is negligible because the on-page content, title, meta, and schema are fully English.
- **Per-locale sitemap:** extend `sitemap.ts` to emit NL + (reviewed-only) EN URLs, each entry carrying `alternates.languages` (`<xhtml:link rel="alternate" hreflang>`). Per-business `lastModified` comes from the **locale's own** latest `reviewed_at`/`updatedAt`.
- **Per-locale llms.txt:** add a `/en/llms.txt` route generated from **EN-reviewed** data only, mirroring the NL structure (district paragraph, categories, per-business lines). NL `/llms.txt` unchanged. Reference `/en/llms.txt` from `robots.ts`.
- **JSON-LD per locale:** add `inLanguage` (`nl`/`en`) to LocalBusiness, Place/TouristAttraction, FAQPage (and Article later) nodes — note `inLanguage: SITE.lang` is already hardcoded in `schema.ts` and must become a parameter. Emit **localized** `name`/`description`/FAQ text on EN pages while **retaining the same `@id`** (the entity is identical; only the language differs). Keep `aggregateRating` **omitted** per the 2024+ self-serving-review policy. Add **per-locale `dateModified`** (the EN node's value = EN last review date) — directly serves the 2026 freshness signal (>60% of AI citations are pages updated within 6 months).
- **Entity-first/AEO:** keep "De Kamp" as one cross-locale entity (the `sameAs` Wikidata/OSM URIs from the SEO epic apply to both languages). EN FAQ/answer chunks follow the **40–60-word answer-first** standard — translate *to* the standard, don't translate verbatim if the NL ran long. EN `SeoIntro`/answer blocks are first-class, not afterthoughts.
- **Internal linking:** EN pages link to EN pages (category ↔ business ↔ district); never leak into NL mid-journey except via the explicit switcher. Keep a per-locale WebSite `SearchAction`.
- **Keywords/topics (EN):** "independent shops Amersfoort old town", "where to eat Amersfoort centre", "things to do Amersfoort historic centre", "Amersfoort boutique shopping", "Amersfoort coffee/lunch". Map to existing categories.
- **robots:** the existing AI-crawler allowlist (GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended, ClaudeBot, …) applies to `/en/*` automatically; the only addition is referencing `/en/llms.txt`.
- **CWV:** EN must equal NL — same SSG/ISR, no client-side translation, scoped client message payload. Verify LCP/INP/CLS on `/en/*`.
- **Reviews/Maps (cross-reference, not in this epic's scope):** when the GBP/reviews epic ships an EN review widget, Places API rules still apply — Google logo + attribution shown unobscured when no map is present, link back to Google Maps, no caching of review content beyond `place_id`, max 5 reviews per request — and the attribution/labels must be in English on EN pages.

### Design / UX

- **Language switcher:** globe icon + "NL / EN" in Navbar (desktop + mobile menu) and footer. States: current locale highlighted, hover, focus-visible (`--amber-ink`/white ring — not bare `--amber`), keyboard-operable. On mobile, part of the AnimatePresence menu. Deliver in **Figma**.
- **Owner EN-tab (`/beheer/[id]`):** two-tab or side-by-side — NL source (read-only, muted) beside the EN field; "machine-translated, please review" `<Alert variant="info">` (part of the portal brand-uplift); per-field "stale — NL changed" warning chip when `stale=1`. Status dots: machine (amber), pending (gold), reviewed (sage), rejected (clay). Reuse design tokens, not raw utility classes.
- **Admin translation queue (`/admin`):** three-column diff — NL source / machine EN / submitted EN — with accessible old/new distinction (icon + ARIA label, **not colour alone**). Approve/reject per field or per business; bulk-approve unchanged machine translations.
- **Empty/loading/error/success in EN:** every empty state, map skeleton, error, and success toast needs an EN string. EN strings run ±30% vs NL — **stress-test the explorer chips, OpenBadge labels, and hero clamp** for overflow/wrapping.
- **WCAG AA:** correct `<html lang>` per page (screen-reader pronunciation) plus `lang="nl"` spans wrapping any NL-fallback text inside an EN page; switcher labelled; no colour-only meaning in the diff.
- **Deliverables:** Figma frames for switcher, EN owner-tab, admin 3-col queue, plus a localized-copy length-stress sheet.

### Content / Localization

- **Copy needed:** (1) UI chrome (~150–250 keys) → `en.json`; (2) 6 key pages + category blurbs + FAQs; (3) ~67 businesses × ~6 fields, machine-translated then human-reviewed; (4) image alt text per locale.
- **Tone → register:** NL is warm/informal (je/jij), lightly poetic ("kloppend hart"). EN: **warm but not twee**, British-English (`EN-GB`), confident, concrete. Keep the brand mark "De Kamp leeft." **untranslated** as a constant; add an EN sub-line rather than translating the tagline. **Never translate proper nouns:** business names, street names ("Kamp", "Zuidsingel"), "koopzondag" (gloss once as "Sunday shopping", then leave).
- **Workflow:** DeepL pre-translate → human reviewer (a fluent EN/NL volunteer or a one-off freelance pass) edits in the admin queue → approve. Maintain a **glossary** (brand/geographic terms) and a one-page EN style guide (40–60-word answer chunks, British spelling, sentence-case headings).
- **Volume reality:** ~67 × (short ~30w + long ~90w + ~5 specialties + ~4 perfectFor + ~3 keyFacts) ≈ ~12k words of business copy + ~3–4k words of pages/FAQ + UI strings. Machine pre-translation makes this a **review** task: ~1–1.5 min/field → roughly **2–3 focused person-days** for businesses + ~1 day pages + ~0.5 day UI ≈ **4–5 review-days total**, not weeks of from-scratch translation. (Caveat: several seed `longDescription`s contain English editorial notes mid-paragraph — the reviewer must catch and clean these, so budget the high end.)

### Growth / Marketing

- After EN soft-launch: outreach to **VVV Amersfoort**, hotel concierges, Airbnb/expat groups, and English-language "what to do in Amersfoort" content sites for backlinks to `/en`.
- Ensure member businesses' Google Business Profiles reference the EN guide where appropriate; submit `/en` to relevant English directories.
- AEO: monitor and seed English AI-answer coverage; track which EN queries cite the site.
- Owner comms: tell owners their listing is now reachable by international visitors (adoption driver).

### Legal / Compliance (GDPR)

- **No new lawful-basis surface from translation itself** — translating already-published *business* descriptions is processing of public business content, not new personal data collection. Owner-submitted EN edits ride the existing owner-portal contract/consent basis.
- **DeepL as sub-processor:** DeepL is German (EU), GDPR-compliant, offers a DPA, and **DeepL API Pro does not retain or use submitted text for training** — the EU-residency-clean choice over Google Cloud Translation (US). **Action: sign DeepL's DPA, add DeepL to the processor register and to the privacy policy in BOTH NL and EN.** Because some descriptions contain owner names ("oprichter Jimmy Karaaslan"), treat DeepL as processing limited personal data covered by its DPA + no-retention guarantee. *Verify the no-retention claim against DeepL's current DPA at contract time — do not rely on this document's assertion.*
- **Retention/erasure:** `business_translations` rows are part of a business listing — **extend `purgeBusiness()`** (currently deletes `business_media` + `business_overrides` only) to also `DELETE FROM business_translations WHERE business_id = ?`. `page_translations` are not personal data. Profile-purge cascade is unaffected (translations key on `business_id`, not `profile_id`).
- **Accessibility law:** correct `lang` per locale advances European Accessibility Act / WCAG posture — this epic *improves* compliance.
- **Marketing consent (newsletter):** out of scope here except: when the newsletter epic lands, the EN double-opt-in copy must be a faithful translation of the NL consent (no weaker consent in EN). No payments/PSD2/voucher/review-API scope in this epic.

### Data / Analytics

- Add a **locale dimension** to all analytics events (page_view, explorer_filter, business_view, maps_click, route_plan, owner_login). Use an EU-resident, privacy-friendly tool (§7).
- **Events:** `language_switch{from,to,page}`, EN page_view, EN bounce/engagement, switcher impressions vs clicks, EN detail→maps/route conversions, translation-queue throughput (admin-side, from D1).
- **Dashboards:** NL-vs-EN sessions/engagement/conversion; hreflang error count (Search Console export); translation freshness (% EN fields `stale=0`) and review backlog (from D1).

### Operations / Owner-relations

- **Human workflow:** Wendy (admin) owns the EN review queue; machine pre-translation makes it a curation task. **SLA:** EN owner edits reviewed within **5 business days**; stale-flagged EN re-reviewed within the same window.
- **Onboarding:** update owner help copy ("Your listing now has an English tab — it's auto-translated, you can refine it"); provide a one-paragraph EN-tone tip sheet.
- **Moderation:** the queue surfaces NL source + machine + submitted EN together so a moderate-English reviewer can sanity-check fast; bulk-approve unchanged machine translations.
- **Support:** ensure the EN site shows the existing `info@` contact; EN FAQ for "is this site official?" and "how do I list my business?".

---

## 5. Data model & API

**D1 DDL:** see Backend §4 (`business_translations`, `page_translations`, `translation_jobs`). **Extend `purgeBusiness()`** to delete `business_translations`.

**`KampEnv` change:** add `DEEPL_API_KEY?: string` to the interface in `src/lib/cf.ts`; add a `getDeeplKey()` accessor in `settings.ts` (env → `app_settings` → undefined).

**R2 key conventions:** **unchanged** — photos are locale-agnostic; only alt text (D1) is localized. No new buckets/keys.

**Routes / actions (METHOD path → req/res):**
- Server Action `submitTranslation(businessId, locale, field, value)` → owner; `{ok}` | validation error; writes `pending` row.
- Server Action `moderateTranslation(id, 'reviewed'|'rejected', reason?)` → admin; revalidates per-locale tag.
- Server Action `machineTranslateBusiness(businessId, locale)` → admin; triggers DeepL, writes `machine` rows + `translation_jobs` ledger.
- Server Action `submitPageTranslation` / `moderatePageTranslation` → admin.
- `GET /en/llms.txt` → `text/plain`, EN-reviewed data, force-static + 1h cache.
- `GET /sitemap.xml` (existing `sitemap.ts`) → emits NL + reviewed-EN entries with `xhtml:link` alternates.
- Cron `scheduled()` → pre-translate / re-translate-stale / drain jobs / prune auth (no HTTP). *Verify OpenNext forwards `scheduled` (M2 spike).*

**Third-party API:** DeepL `POST /v2/translate` (Pro in prod, `api-free` in dev), `Authorization: DeepL-Auth-Key`, body `{text[], source_lang:'NL', target_lang:'EN-GB', tag_handling:'html', context, glossary_id}`. Server action / cron only; synchronous, no webhooks.

**Read seam:** `getActiveBusinesses(locale)` in `businessData.ts` — NL identical to today; EN adds one indexed read (`locale='en' AND status='reviewed' AND stale=0`) spread-merged onto the NL set, catch-wrapped to NL fallback.

## 6. User flows & state machine

**Translation lifecycle (per field):**
`absent → (cron DeepL) machine → (owner edit) pending → (admin) reviewed | rejected`. From `reviewed`, an NL source change → `stale=1` → cron re-translates → `machine` → review again. **Only `reviewed AND stale=0` is ever served.**

**Visitor flow:** request `/en/...` → proxy confirms/negotiates → SSG/ISR page → `getActiveBusinesses('en')` merges reviewed EN over NL → render with EN JSON-LD + bidirectional hreflang. Switcher → entity-aware counterpart URL, set `NEXT_LOCALE` cookie.

**Owner flow:** open EN tab → machine prefill → edit → submit (`pending`) → admin reviews → `reviewed` → tag invalidated → live.

**Edge cases & failures:**
- *D1 down on EN render:* catch → serve NL content under the `/en` URL (page stays up; `<html lang="en">`, NL spans tagged `lang="nl"`; hreflang valid).
- *Field reviewed, NL later changed:* serve reviewed EN for unchanged fields, NL fallback (stale-marked) for the changed field — never a broken page.
- *DeepL error/timeout in cron:* `translation_jobs` row marked `failed`, retried up to `attempts` cap; no machine row written; field stays NL until next run; visible in `/admin`.
- *Owner submits spam/poor EN:* stays `pending`, never served; admin rejects.
- *Business has zero reviewed EN rows:* exclude from EN sitemap and ship `noindex`; render full NL fallback under `/en` only for users who navigated there explicitly.
- *Switcher on a page with no reviewed EN twin:* still toggles the URL (slug is shared), page shows NL fallback under `/en` with `noindex` — acceptable; or hide the switcher on such pages (product decision).
- *Build time:* `NEXT_PHASE` guard → seed-only, EN merge skipped → build hermetic and green.

## 7. Third-party choices

**Machine translation:**
- **DeepL API Pro (Germany, EU) — RECOMMEND.** Best NL↔EN quality, GDPR DPA, no retention/training on Pro, glossary + HTML tag handling. Pricing: ~€5.49/mo base + ~€20 per 1M chars; this corpus (~15k words ≈ ~90k chars) costs **a few euros total** to bulk-translate, near-zero monthly after.
- Google Cloud Translation — strong, but US company (EU-residency friction for a lean EU project), no glossary advantage for this pair. Not recommended.
- Amazon Translate / Azure Translator — viable, more setup, weaker NL nuance. Not recommended.
- LLM (Claude/GPT) translation — flexible, could enforce the 40–60-word answer-chunk style, but adds prompt-engineering + cost variability. Keep as an optional **reviewer-assist**, not the pipeline default.

**i18n mechanism:**
- **Native Next 16 dictionaries + proxy rewrite (Option A) — RECOMMEND (default).** Documented for this exact Next version, zero new deps, edge-safe, prefix-less NL preserved via rewrite.
- **next-intl — evaluate in the M0 spike (Option B).** Nice DX (`localePrefix:'as-needed'`, entity-aware path helpers) but **not installed today** and its Next-16/`proxy`-rename/OpenNext-edge compatibility is **unverified** — adopt only if the spike passes.
- next-i18next / hand-rolled hreflang — avoid.

**Analytics (EU-resident):** **Cloudflare Web Analytics** (free, EU, cookieless) for CWV/traffic; add **Plausible** (EU, GDPR, ~€9/mo) only if locale-dimensioned event depth is needed.

## 8. Milestones & sequencing

- **M0 — Foundation spike + scaffolding (pull into Phase 4)** — ~1–1.5 wk: **routing-mechanism spike (Option A vs B) with a written decision**, `<html lang>` dynamic, `app/[locale]` route group, `src/proxy.ts` negotiation/rewrite, lock NL-root/`/en` scheme; NL works **byte-identically**; SSG/JSON-LD green; existing NL URLs unchanged. *Deliverable: routing live, zero visible change, decision memo.*
- **M1 — UI string layer** — ~1 wk: extract `nl.json`, human-review `en.json`, `LanguageSwitcher`, hreflang on static pages, `noindex` plumbing. *Deliverable: chrome fully EN.*
- **M2 — Backend translation store + pipeline** — ~1.5–2 wk: `0003_i18n.sql`, locale read-seam, server actions, DeepL cron (+ `scheduled` OpenNext-forwarding spike), admin review queue, **staleness hook in `moderateOverride`**, `purgeBusiness` extension, per-locale tag cache (d1-next-tag-cache + `NEXT_TAG_CACHE_D1`). *Deliverable: pipeline end-to-end.*
- **M3 — Content translated & reviewed** — ~2 wk (content + SEO in parallel): 67 businesses + 6 pages reviewed; per-locale sitemap/llms.txt/JSON-LD/hreflang + `noindex`-gating complete. *Deliverable: EN content live & indexable.*
- **M4 — QA, analytics, launch** — ~1–1.5 wk: bidirectional hreflang validation, Playwright/Wrangler locale tests, CWV on `/en/*`, analytics locale dim, soft-launch + outreach. *Deliverable: EN GA.*

## 9. Dependencies

Critical (hard): **production launch baseline** (stable canonical domain — the routing scheme must be locked before any EN URL is indexed); **d1-next-tag-cache override + `NEXT_TAG_CACHE_D1`** (instant per-locale invalidation; shared with backend roadmap); **content style guide / 40–60-word answer-chunk standard**; **`SITE.social` + entity `sameAs` filled** (so the cross-locale entity has anchors). Mechanism-level: **M0 routing spike** must complete before M1/M2. Soft: events / owner-story / newsletter epics own their *own* EN content (out of v1; this epic only adds the `locale` plumbing they consume).

## 10. Risks & mitigations

See structured `top_risks`. Headline risks: (1) **i18n-mechanism uncertainty** on Next 16 + `proxy` rename + OpenNext edge — mitigated by the M0 spike with a native-dictionary fallback that is fully documented for this version. (2) **URL migration breakage** — mitigated by NL-prefix-less-at-root + proxy rewrite, never moving NL to `/nl`. (3) **Thin machine-translated content indexed** — mitigated by hard `noindex`-until-reviewed + sitemap gating. (4) **Translation drift/staleness** — mitigated by the `source_hash` staleness hook in `moderateOverride`. (5) **`scheduled` not forwarded by OpenNext** — mitigated by an M2 verification spike + separate-Worker fallback. (6) **DeepL DPA/residency assumption wrong** — mitigated by verifying the DPA at contract time before any PII-bearing text is sent.

## 11. Acceptance criteria / Definition of Done

- [ ] `<html lang>` reflects the active locale on every page; NL-fallback text inside EN pages is wrapped in `lang="nl"` spans.
- [ ] NL remains prefix-less at root; EN under `/en`; **no existing NL URL changed** (verified by diffing the sitemap against pre-epic).
- [ ] Locale negotiation lives in `src/proxy.ts` (NOT `middleware.ts`); negotiates path → cookie → Accept-Language without overriding an explicit `NEXT_LOCALE` choice.
- [ ] M0 routing-mechanism decision documented (Option A native dictionaries, or Option B next-intl with a passing compatibility spike).
- [ ] All UI chrome + 6 key pages + category blurbs + ~67 businesses render correctly in EN, **human-reviewed**.
- [ ] Bidirectional hreflang (`nl`/`en`/`x-default`→NL) on every page; self-canonical per locale; 0 errors in a Screaming Frog hreflang crawl + Search Console.
- [ ] EN URLs ship `noindex` AND are absent from the sitemap until `status='reviewed'`; flip to indexable atomically on review.
- [ ] Per-locale `/en/llms.txt`, sitemap alternates, and JSON-LD (`inLanguage`, localized name/description/FAQ, retained `@id`, per-locale `dateModified`) valid; `aggregateRating` still omitted.
- [ ] Owner EN tab works; submissions flow through the existing moderation queue; only `reviewed AND stale=0` serves.
- [ ] NL source change marks corresponding EN fields `stale=1` (via the `moderateOverride` hook) and re-queues translation; staleness never produces a broken page.
- [ ] `getActiveBusinesses('nl')` is byte-identical to current behaviour; `getActiveBusinesses('en')` adds ≤1 indexed D1 read on render; no DeepL call on render; build stays hermetic/seed-only.
- [ ] Per-locale tag invalidation works (instant with d1-next-tag-cache; else ≤300 s).
- [ ] `purgeBusiness()` deletes `business_translations`.
- [ ] `DEEPL_API_KEY` in `KampEnv` + rotatable via `/admin/instellingen`; never exposed client-side.
- [ ] DeepL DPA signed (no-retention verified against the current DPA); processor register + privacy policy updated in NL + EN.
- [ ] Cron `scheduled()` confirmed to run under OpenNext (or separate-Worker fallback in place); pre-translate/re-translate-stale/drain-jobs verified.
- [ ] CWV on `/en/*` equal to NL.
- [ ] Analytics carries a locale dimension; `language_switch` tracked.
- [ ] Playwright tests cover NL+EN routing, the proxy rewrite keeping NL prefix-less, switcher entity-preservation, and hreflang presence.

## 12. KPIs & success metrics

See structured `kpis`: EN organic sessions/quarter; 100% valid bidirectional hreflang (0 SC errors); EN AI-citation count (manual + tooling); EN freshness (% EN fields `stale=0`, median EN `dateModified` age <6 mo); review throughput + backlog vs the 5-business-day SLA; switcher click-through; EN engagement vs NL (bounce, pages/session); per-locale CWV parity; EN conversion proxies (maps/route clicks).

## 13. Cost

**One-off:** DeepL bulk translation of the corpus — a few euros (~90k chars). Human review ~4–5 person-days (volunteer, or one-off freelance ~€500–900 if outsourced). Engineering ~6–10 weeks internal (the wider range reflects the M0 mechanism spike and the OpenNext `scheduled` verification).
**Monthly:** DeepL API Pro ~€5–10/mo (base + tiny incremental from owner edits/stale re-translations). Plausible (optional) ~€9/mo, or €0 with Cloudflare Web Analytics. D1/R2 incremental (~2× pages) negligible — within free tiers at this scale. **Net new run-rate: ~€5–20/mo**, inside the lean budget.

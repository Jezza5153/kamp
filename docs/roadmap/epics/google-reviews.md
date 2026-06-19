# Google Reviews — Integration & Acquisition (2026-compliant)

> Connect every De Kamp business to its Google Business Profile via the cache-exempt `place_id`, surface owner-authorized reviews on `/ondernemers/[id]` with the legally required Google Maps link-back + Google logo + per-author attribution, strictly respect the Places API / Maps Platform caching policy (persist `place_id` + aggregate numbers only — never persist review text/author/per-review rating), deliberately AVOID self-serving AggregateRating markup that no longer earns SERP stars, and run a structured review-acquisition program (QR counter cards, request deep-links, owner GBP responses, reputation monitoring) that compounds into local-pack ranking.
>
> **Recommended phase:** Phase 5 (after production launch + Cloudflare hardening). `place_id` groundwork + acquisition (M0) pulled forward into Phase 4 because it has **zero Google-API dependency** and ships value immediately. **Effort:** 6–9 weeks wall-clock (heavily gated by Google API approval latency — see §9). **Teams:** Backend/Infra (lead), Frontend, SEO/GEO/AEO, Legal/Compliance, Design/UX, Content/Localization, Data/Analytics, Operations/Owner-relations, Product/PM, QA/Release.

---

## 0. Reviewer's note — what changed from the draft and why

This document was hardened against the actual stack (Next.js 16 App Router on Cloudflare Workers/OpenNext, D1, R2 — no Node-only APIs, no Vercel, no Postgres) and re-verified against current (2026-06) Google ToS. Material corrections from the draft:

1. **Edge-caching review TEXT is non-compliant.** The draft's `/api/reviews` returned the full review payload with `Cache-Control: public, max-age=900`. Storing review text in any shared cache (Cloudflare edge cache included) is "storing content" under the Maps Platform / Places policy. **Corrected:** the route serves review **text** with `Cache-Control: private, no-store`; only the **aggregate numbers** (`rating`, `count`) are allowed a short shared TTL because they are facts, not content. Split into two response concerns accordingly.
2. **GBP API access is a hard, multi-week gate that the draft underweighted.** The Google Business Profile API requires a Google Cloud project, an **enabled API allowlist request** (the BP APIs are access-restricted; you must apply), and a **verified GBP that is 60+ days old**. Approval is days-to-weeks. M2 (public display + owner replies) **cannot ship** until this lands. M0 and the acquisition program's QR/deep-link half have **no** Google-API dependency and must be front-loaded. Effort widened to 6–9 weeks wall-clock to reflect this.
3. **`writereview` deep-link has a known intermittent failure.** `https://search.google.com/local/writereview?placeid={place_id}` is the recommended form (and is compliant — it is a URL built from the exempt `place_id`, not cached content), but it does not reliably open the review composer for every place_id / on every device. **Corrected:** `/r/[token]` falls back to the Maps listing URL (`?q=place_id:{place_id}`) when a per-business `review_link_override` is set, and Operations gets a verification step.
4. **Two review-read paths, two policy regimes.** Reading an owner's *own* reviews via the **Business Profile API with the owner's OAuth token** is the compliant route and is *not* governed by the Places-API self-serving-content caching rule the same way — but to keep one defensible architecture we apply the **strictest** rule everywhere: review text is `no-store`, never written to D1/R2. The **Places API** is used **only** as an optional admin `place_id` resolver, never for display.
5. **`AUTH_SECRET` is currently unused** (confirmed in `src/lib/cf.ts` `KampEnv` + `src/lib/auth.ts` — sessions are opaque D1 lookups). This epic is its first real consumer: it derives the AES-GCM key for OAuth-refresh-token encryption. Documented as such so it is no longer a "reserved / lint hazard" note.
6. **`app_settings` key allowlist is closed.** `SETTING_KEYS` in `src/lib/settings.ts` is a literal tuple; adding Google secrets to `/admin/instellingen` requires extending that tuple plus `saveSettings`/`getSettings` getters — called out as a concrete code change, not a free "follow the pattern".
7. **The no-content-caching guarantee conflicts with ISR-cached HTML** unless review text is client-fetched. Re-confirmed: SSR emits **aggregate numbers only**; review cards are client-rendered from a `no-store` fetch so they never enter the R2 ISR cache (`kamp-next-cache`). Added an explicit acceptance test for this.

---

## 1. Goal & value

De Kamp's discovery battle is won or lost in Google's local pack — the "near me" map results that decide who walks through the door. Reviews are among the strongest *controllable* local-pack ranking factors after NAP consistency and proximity. Today the site link-outs to Google ("Reviews op Google" pill in `BusinessDetailClient.tsx`) but renders nothing, stores no `place_id`, has no owner connection, and runs no acquisition motion. This epic closes that gap on three fronts:

- **For the district:** higher aggregate review volume and rating across ~67 businesses raises the whole district's visibility for "winkelen Amersfoort binnenstad", "restaurant De Kamp", and AI-answer-engine queries ("waar kan ik goed eten op De Kamp?"). Reviews are an **entity-reputation signal** that AI engines (ChatGPT, Perplexity, Google AI Overviews) weigh when deciding which businesses to cite.
- **For owners:** a business like **Toko Tjin** (high review count, strong rating) gets that social proof surfaced tastefully on its own page, plus a one-click way to respond to reviews from `/beheer` without a separate daily Google login. A 3-review shop gets a private, encouraging acquisition nudge and a printable QR counter card — turning the guide into an active growth tool, not a passive listing.
- **For visitors:** trustworthy, attributed, live review snippets reduce the "is this place any good?" friction without forcing a context-switch to Google Maps first.

**The problem solved:** we make reviews a first-class, *compliant* asset — respecting the Maps Platform caching policy (no caching of review text), respecting the 2024+ self-serving-review structured-data rule (no fake-star markup), and channelling the actual SEO weight where it belongs: Google Business Profile completeness and a review-acquisition program anchored on the canonical NAP in `src/lib/site.ts`.

---

## 2. How it works in real life

**Personas:** *Sanne* (visitor, 29, on her phone deciding where to eat). *Henk* (owner of Toko Tjin, high review count). *Mirjam* (owner of a new ceramics shop, 3 reviews). *Bram* (district admin/moderator, part-volunteer).

**Journey A — Bram connects the businesses (M0, no API needed).** Bram logs into `/admin`. A new "Google" tab lists all ~67 businesses with a status chip (Niet gekoppeld / place_id gezet / Eigenaar gekoppeld). For Toko Tjin he pastes the Google `place_id` (found via the Place ID Finder or the Maps URL) and saves. The system stores `place_id` in `business_google` (this field is explicitly *exempt* from caching rules) and immediately rebuilds Toko Tjin's "Bekijk op Google Maps" deep-link and "Laat een review achter" link from canonical `place_id` patterns. No reviews are fetched — but the link-outs are now precise and the acquisition QR can already be generated. Bram does this for all ~67 in an afternoon.

**Journey B — Henk authorizes his own profile (M2).** Henk gets a Resend email inviting him to manage Toko Tjin at `/beheer`. On his business page he sees a branded card: *"Koppel je Google Bedrijfsprofiel — laat je echte reviews zien en reageer er direct op."* He ticks an explicit consent box, clicks "Koppel met Google", is sent through Google's OAuth consent screen (scope to manage *his own* business), approves, and is redirected back. The Worker exchanges the code, **AES-GCM-encrypts the refresh token** with an `AUTH_SECRET`-derived key, and stores it in `business_google` with `gbp_connected=1`. Now `/ondernemers/toko-tjin` can fetch his reviews live via the Business Profile API (the compliant own-listing route), and Henk sees a "Reageer op reviews" list in `/beheer`. He replies to a recent 5★ review in two clicks; the reply posts to Google via his token.

**Journey C — Sanne reads reviews (M2).** Sanne opens `/ondernemers/toko-tjin`. The SSR page already shows the aggregate header ("4,6 ★ · 240 reviews op Google", from `cached_rating`/`cached_count`) so crawlers and first paint have it. Below the story, a client-rendered **Google Reviews strip** hydrates: the Google "G" logo unobscured, up to 5 recent review cards (stars, ~2-line excerpt, reviewer first name, relative date, per-author attribution link), each card and the header linking to the Toko Tjin Google Maps listing. A "Laat een review achter" button deep-links to the Google review form. The page emits **no** `aggregateRating` JSON-LD. Review text arrives via a `no-store` fetch and is never written to D1 or the R2 ISR cache.

**Journey D — Mirjam grows from 3 reviews (M3).** Mirjam's page does **not** show a public review strip (below the count threshold — we never publicly display a discouraging "3 reviews"). Instead, in `/beheer` she sees an encouraging acquisition panel: a printable A6 **QR counter-card PDF** ("Tevreden? Laat een review achter ❤") deep-linking to her Google review form, plus a shareable link for order-confirmation emails. Over a month her count climbs; once it crosses the threshold the public strip auto-appears at the next tag-cache invalidation (or within the 5-min ISR window if tag cache isn't yet wired). Bram's admin **reputation dashboard** shows district-wide rating, volume, and 30-day trend, flagging growth and any sudden rating drop to respond to.

**Failure-handling glimpses:** if Google's API is down, the strip degrades to the plain "Bekijk reviews op Google" link-out (never a broken widget). If Henk disconnects, his token is revoked at Google and wiped, the page falls back to `place_id` link-out, and aggregate numbers stop refreshing (stale numbers are hidden after a staleness cutoff).

---

## 3. Scope

**In:**
- `business_google` D1 model: `place_id` (exempt), GBP linkage, AES-GCM-encrypted OAuth refresh token, `cached_rating`/`cached_count` (numbers only), `last_synced`, `review_link_override`.
- Admin "set place_id" UI in `/admin`; precise Maps + review-form deep-links from `place_id`; optional Places API place_id resolver.
- Owner GBP OAuth connect/disconnect in `/beheer` (Business Profile API, own-listing scope) behind an explicit consent checkbox.
- Compliant live review display on `/ondernemers/[id]` with required Google logo + Maps link-back + per-author attribution; ≤5 reviews/request; conditional on a count threshold; **review text never persisted/edge-cached**.
- Owner review-response UI (post replies to Google via owner token).
- Acquisition program: per-business review-request deep-link, printable QR counter-card PDF, funnel tracking (`review_requests`).
- Admin reputation dashboard (rating/volume/trend) + analytics events.
- Cron jobs: nightly token refresh, aggregate-number sync (compliant cadence), token/state-retention prune.

**Out (this epic):**
- AggregateRating / `review` JSON-LD for SERP stars (deliberately excluded — ineligible for self-serving reviews + risky).
- Persistent storage/edge-caching of review text, author identity, or per-review ratings (ToS-forbidden).
- Importing reviews into on-site search or `llms.txt` body text.
- Non-Google review sources (Tripadvisor, Facebook).
- AI-generated review replies.

**Later:**
- EN/bilingual review-strip labels (rides on the i18n epic's `next-intl`/hreflang scaffolding).
- District-level aggregate rating on the homepage Place/TouristAttraction entity (numbers only, carefully — and only if Legal signs off that an aggregate-of-aggregates is defensible).
- Review-driven editorial pulls ("most-loved on De Kamp") with manual curation + attribution (quoting review text in editorial is a separate ToS review).
- Sentiment/keyword trend mining for the owner dashboard.

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

**Routes & rendering.**
- `/ondernemers/[id]` stays ISR (`export const revalidate = 300`). The review strip must NOT block SSR or break SSG. The server component reads `business_google` (via a new `businessGoogle` helper alongside `businessData`) and passes **only** `cached_rating`/`cached_count`/`mapsUrl`/`reviewUrl` into an SSR header. A **client component `GoogleReviewsStrip`** fetches `GET /api/reviews/[businessId]` on mount for the live ≤5 review cards. This keeps review text out of the cached HTML (ToS) while keeping aggregate numbers SSR-visible for crawlers/AEO.
- `/beheer/[id]`: add a server-rendered "Google Bedrijfsprofiel" card. The connect button is a plain `<a>` to `GET /beheer/google/connect/[businessId]` (a route handler that starts OAuth — must be a GET navigation, not a Server Action, because OAuth needs a top-level redirect). Disconnect + respond-to-review are **Server Actions** (`disconnectGoogle`, `respondToReview`).
- `/admin`: add a "Google" section (server component) listing businesses with a `setPlaceId` Server Action form per row, plus the reputation dashboard (server-fetched aggregates).

**Components (new, design-system-aligned — fix the current portal "orphaned CMS" look):**
- `GoogleReviewsStrip` (`"use client"`): props `{ businessId, ratingFallback, countFallback, mapsUrl, reviewUrl }`. States: **loading** (skeleton cards, brand stone shimmer, reserved height to protect CLS), **success** (≤5 cards + Google "G" logo + per-author + header link-backs), **empty/below-threshold** (renders nothing public), **error** (degrade to "Bekijk reviews op Google" link-out). Google "G" logo SVG inline, unobscured.
- `GoogleConnectCard` (portal): connect/connected/disconnect states; explicit consent checkbox gating the connect link; uses `--deep-green`/`--amber` tokens, Playfair heading, shared `<KampInput>`/`<Alert>` (from the design-system uplift). Degrades gracefully with inline fallback styles if those shared components aren't built yet.
- `ReviewResponseList` (portal, `"use client"`): list recent reviews with a reply textarea → `respondToReview` action; optimistic "verzonden" state; never persists the review text it displays.
- `ReviewQrCard` (portal): preview + "Download QR-kaart (PDF)" button → `GET /beheer/google/qr/[businessId].pdf`.
- `AdminReputationDashboard`: table + sparkline (rating/volume/trend) sortable by rating, count, trend.

**State/forms/images.** Client fetch via `useState`/`useEffect` with an `AbortController` (no SWR dependency needed). The Google logo and star glyphs ship as inline SVG (no external image dep, consistent with `next/og`). **Reviewer avatars are NOT loaded from Google** (avoids hotlinking, privacy, and a caching grey-area) — use initial-avatars matching the existing person-card pattern; the author *name* + a link to the author's Google profile (when the API returns one) satisfy attribution. Add a "Sla reviews over" skip-link before the strip; star rating exposed as text ("4,6 van 5 sterren") for screen readers.

### Engineering — Backend & Infra (Cloudflare) — PRIORITY, MAXIMUM DETAIL

**Core principle (ToS-driven architecture):** `place_id` is the *only* Google-derived value persisted (explicitly exempt). Review **text, author identity, per-review rating** are **never** written to D1, R2, or any shared/edge cache. Aggregate `rating`/`count` are numbers (facts) cached for trend/UX with a short documented refresh cadence, always reconciled to Google's live numbers on display, and hidden if staler than a cutoff. Live review reads go through the **Business Profile API using the owner's OAuth token** (the compliant own-listing route) — never pre-fetched Places API content.

**D1 schema (`migrations/0003_google.sql`):**

```sql
-- Per-business Google linkage. place_id is ToS-exempt; review text is NEVER stored.
CREATE TABLE business_google (
  business_id          TEXT PRIMARY KEY,            -- seed id, no FK (matches existing override/media pattern)
  place_id             TEXT,                        -- Google Place ID (CACHE-EXEMPT, persisted)
  review_link_override TEXT,                        -- optional: Maps URL if writereview deep-link misbehaves
  gbp_account_id       TEXT,                        -- Business Profile API account resource (e.g. accounts/123)
  gbp_location_id      TEXT,                        -- Business Profile API location resource (e.g. locations/456)
  gbp_connected        INTEGER NOT NULL DEFAULT 0,  -- 0/1 owner OAuth active
  oauth_refresh_enc    TEXT,                        -- AES-GCM ciphertext (base64 "iv:ct"), NEVER plaintext
  oauth_scope          TEXT,                        -- granted scope string
  token_expires_at     INTEGER,                     -- access-token expiry (epoch ms)
  cached_rating        REAL,                        -- aggregate number only (e.g. 4.6)
  cached_count         INTEGER,                     -- aggregate number only (e.g. 240)
  last_synced          INTEGER,                     -- epoch ms of last aggregate sync (powers staleness cutoff)
  connected_by         TEXT,                        -- profile id that authorized (consent record)
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL
);
CREATE INDEX idx_bizgoogle_connected ON business_google(gbp_connected);

-- Acquisition funnel. No PII beyond an opaque token.
CREATE TABLE review_requests (
  id           TEXT PRIMARY KEY,                    -- UUID
  business_id  TEXT NOT NULL,
  channel      TEXT NOT NULL,                       -- 'qr' | 'link' | 'email'
  token        TEXT NOT NULL UNIQUE,                -- short opaque token used in /r/[token]
  created_by   TEXT,                                -- profile id
  created_at   INTEGER NOT NULL,
  scanned_at   INTEGER,                             -- first redirect (best-effort)
  converted_at INTEGER                              -- best-effort only; usually NULL (see note below)
);
CREATE INDEX idx_revreq_business ON review_requests(business_id);

-- CSRF-safe OAuth state, short-lived.
CREATE TABLE oauth_states (
  state       TEXT PRIMARY KEY,                     -- random 32-byte hex
  business_id TEXT NOT NULL,
  profile_id  TEXT NOT NULL,
  expires_at  INTEGER NOT NULL                      -- +10 min; pruned by cron
);

-- Privacy-light custom funnel events (cookieless, no PII).
CREATE TABLE analytics_events (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  business_id TEXT,
  props_json  TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_analytics_name ON analytics_events(name, created_at);
```

> **Honesty note on `converted_at`:** there is *no reliable* way to confirm a Google review was actually written from a redirect — Google passes no return callback, and we do not store review authors to diff. `converted_at` is therefore **best-effort only** (e.g. an optional return-trip pixel) and conversion is primarily inferred at the aggregate level (did `cached_count` rise after a QR campaign). The dashboard must label it "geschat". Do not present scan→review as a hard funnel.

**Token encryption.** Consume the currently-unused `AUTH_SECRET` (confirmed not consumed anywhere in `auth.ts` today). Derive an AES-GCM-256 key via Web Crypto: `crypto.subtle.importKey("raw", utf8(AUTH_SECRET), "HKDF", …)` → `deriveKey` (HKDF-SHA-256, fixed info label `"gbp-oauth-v1"`) → AES-GCM `CryptoKey`. Encrypt with a fresh 12-byte random IV per write; store `base64(iv) + ":" + base64(ciphertext)` in `oauth_refresh_enc`. Decrypt only in-memory at call time. Refresh tokens are the crown jewels (write access to an owner's Google profile) — never log, never export, never plaintext. **If `AUTH_SECRET` rotates, all stored tokens become undecryptable and owners must reconnect** — document this and gate rotation behind a runbook.

**Route handlers / server actions (real signatures — all Edge/Workers-safe, Web Crypto + `fetch` only, no Node APIs):**
- `GET /api/reviews/[businessId]` (route handler, `export const dynamic = "force-dynamic"`): public (no auth). Look up `business_google`; if not `gbp_connected` or `cached_count < THRESHOLD` → return `{ display:false }`. Else fetch ≤5 reviews live via Business Profile API with the decrypted owner token. **Response headers:** `Cache-Control: private, no-store` (review text MUST NOT enter any shared cache). Body: `{ display:true, rating:number, count:number, mapsUrl:string, reviewUrl:string, reviews:[{stars, excerpt, authorFirst, authorUrl?, relativeTime}] }`. On API error/timeout (≤2.5 s budget): return `{ display:false, degraded:true }` and log a `review_api_error` event. The caller renders; the server stores nothing. (Aggregate numbers for the SSR header come from D1 `cached_*`, refreshed by cron — a separate, allowed concern.)
- `GET /beheer/google/connect/[businessId]` (route handler, `force-dynamic`): `requireUser()` + `canEdit(businessId)` (existing helper, joins `owner_business`); require `consent=1` query param set by the consent checkbox; INSERT `oauth_states`; 302 to Google OAuth (`access_type=offline`, `prompt=consent`, `state`, scope per §7).
- `GET /beheer/google/callback` (route handler, `force-dynamic`): validate `state` against `oauth_states` (exists + unexpired) then delete it; handle `error=access_denied` → friendly redirect `?google=denied`; exchange `code` → refresh+access tokens; resolve `accounts/*` + `locations/*` (one Business Profile API call); AES-GCM-encrypt refresh token; UPSERT `business_google` (`gbp_connected=1`); 302 `/beheer/[id]?google=connected`.
- `GET /beheer/google/qr/[businessId].pdf` (route handler, `force-dynamic`): `requireUser` + `canEdit`; generate A6 QR-card PDF (QR encodes `https://{site}/r/{token}`); INSERT `review_requests` (channel `qr`); `Content-Type: application/pdf`, `Content-Disposition: attachment`.
- `GET /r/[token]` (route handler, `force-dynamic`): look up `review_requests`; stamp `scanned_at` if null; 302 to `review_link_override` if set, else `https://search.google.com/local/writereview?placeid={place_id}`. If token unknown → 302 to the business page (no 404 leak).
- Server Actions (`src/app/beheer/actions.ts`): `disconnectGoogle(businessId)` (`canEdit` → revoke token at Google's revoke endpoint → wipe `oauth_refresh_enc`/`gbp_*`, set `gbp_connected=0`); `respondToReview(businessId, reviewName, FormData)` (`canEdit` → `reviews.updateReply` via Business Profile API with the decrypted token).
- Server Action (`src/app/admin/actions.ts`): `setPlaceId(businessId, FormData)` (`requireAdmin` → validate place_id shape → UPSERT `business_google.place_id` + optional `review_link_override`).

**Owner isolation.** Every owner-scoped handler calls `canEdit(businessId)`. A token is only ever decrypted for the business it belongs to. The public `/api/reviews/[businessId]` decrypts the owner token *for that exact business* to read that business's reviews — no cross-business token path exists. (Trade-off accepted: the public route uses the owner's token to read public reviews; this is the GBP-sanctioned own-listing read and keeps us off the Places-API self-serving path.)

**Cron / Cloudflare Cron Triggers (scheduled `export default { scheduled }` in the Worker; zero extra cost — fold into the planned auth-prune cron so there is a single scheduled entry):**
- `gbp-token-refresh` (nightly): for rows where `token_expires_at` is near, refresh access tokens; on permanent `invalid_grant` mark `gbp_connected=0` and notify the owner via Resend.
- `gbp-aggregate-sync` (every 6–12 h, documented compliant cadence): refresh `cached_rating`/`cached_count` numbers only; update `last_synced`. If a tag-cache override exists, `revalidateTag` the affected business so a threshold crossing flips the strip on.
- `prune` (nightly): delete expired `oauth_states`; wipe tokens for disconnected/erased businesses; combined with the existing planned `auth_tokens`/`sessions` prune.

**Caching dependency.** Wants the **`d1-next-tag-cache` override + `NEXT_TAG_CACHE_D1` binding** (a hard dependency from the backend foundation epic) so crossing the display threshold or connecting GBP invalidates `/ondernemers/[id]` instantly rather than waiting up to 5 min. **Degrades gracefully without it:** with the dummy tag cache, threshold changes simply lag by the 5-min ISR window — acceptable, not blocking. The live `/api/reviews` response is `no-store` regardless.

**Bindings/secrets (wrangler).** Reuse `DB`. Consume `AUTH_SECRET`. Add via `wrangler secret put`: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and (optional, admin-resolver only) `GOOGLE_MAPS_API_KEY`. To make these rotatable without redeploy via `/admin/instellingen`, **extend the closed `SETTING_KEYS` tuple in `src/lib/settings.ts`** (currently `resend_api_key`, `resend_from`, `admin_emails`, `site_url`) with `google_oauth_client_id`, `google_oauth_client_secret`, `google_maps_api_key`, and add matching getters that fall back to `env`. This is a concrete code change, not "follow the pattern for free". `OAUTH_REDIRECT` is derived from the canonical site URL, not a secret.

**Security.** Cloudflare WAF rate-limit rules (zero-cost, no code) on `/beheer/google/connect`, `/beheer/google/callback`, `/api/reviews/*`, and `/r/*` (e.g. 10 req/min/IP). State-param CSRF on OAuth. No tokens in logs (`observability.enabled` is on — scrub). `global_fetch_strictly_public` is already set; Google API endpoints are public hosts, so server `fetch` to them is permitted.

**GDPR erasure hook.** Extend `purgeBusiness()` and `purgeProfile()` in `src/lib/gdpr.ts` to, **in order:** (1) if `gbp_connected`, decrypt + call Google's token revoke endpoint (best-effort, swallow failure), (2) DELETE `business_google` (token + place_id), (3) DELETE `review_requests` for that business, (4) DELETE any `oauth_states`. Idempotent. Profile purge cascades through `owner_business` already; the Google rows are keyed by `business_id`, so purge-by-business covers them.

### SEO / GEO / AEO

- **Do NOT add `aggregateRating` or `review` to `localBusinessSchema()` in `src/lib/schema.ts`.** Self-serving reviews on the entity's own page are ineligible for review rich snippets for LocalBusiness/Organization (2024+). Keep the existing correct omission. Any visible rating/count must exactly match Google's live numbers.
- **Where the SEO weight goes:** GBP completeness + the acquisition program (more reviews → local-pack ranking). Add a launch-checklist item verifying per-business NAP byte-consistency between `src/lib/site.ts`, the JSON-LD address nodes, and each GBP listing.
- **AEO entity-reputation:** the SSR-visible aggregate ("4,6 ★ · 240 reviews op Google") makes the page a stronger *answer* for "is X goed?" / "beste [categorie] op De Kamp" without claiming stars. Add `dateModified` to `localBusinessSchema()` from `business.updatedAt` (a global recommended fix); the aggregate-sync touch counts as a freshness signal.
- **`place_id` → `sameAs`:** add the business's Google Maps URL (built from `place_id`) to the LocalBusiness `sameAs` array. This is metadata derived from the exempt `place_id`, not cached review content — fully compliant — and anchors the entity to Google's knowledge graph.
- **Crawlable aggregate, non-crawlable text:** the aggregate line is SSR text (crawlable); review *text* is client-fetched (`no-store`) and intentionally not in cached HTML. In `llms.txt`, add a neutral per-business line ("Heeft Google-reviews — bekijk op Google Maps: {mapsUrl}") but **no review text** (ToS).
- **CWV:** strip loads after paint, skeletoned with reserved height (no CLS), inline SVG logo (no extra request) — protect LCP/CLS on `/ondernemers/[id]`.
- **robots:** add `Disallow: /api/reviews/`, `Disallow: /r/`, `Disallow: /beheer/google/` to `robots.ts` (utility endpoints, not content). No new sitemap entries. hreflang unaffected until the EN epic.

### Design / UX

- **Screens:** (1) public `GoogleReviewsStrip` on `/ondernemers/[id]`; (2) portal `GoogleConnectCard` + `ReviewResponseList` + `ReviewQrCard`; (3) admin Google list + reputation dashboard; (4) printable A6 QR counter card.
- **Four states each:** loading (brand stone shimmer, reserved height), success, empty/below-threshold (public: nothing; owner: encouraging nudge), error (degrade to link-out).
- **Attribution design (non-negotiable, bake in so it can't be styled away):** Google "G" logo unobscured + "Reviews via Google" label + every card/header links to Maps + per-review author name links to the author's Google profile when provided. Follow Google's brand/attribution style guidelines for logo size/clear-space.
- **Brand uplift:** portal components use design-system tokens (`--deep-green`, `--amber`, Playfair headings) and shared `<KampInput>`/`<Alert>`/`<KampButton>` — this epic retires the "orphaned CMS" portal look. Provide inline fallbacks if the shared components aren't built yet.
- **WCAG AA:** star glyphs need text alternative ("4,6 van 5 sterren"); review cards keyboard-focusable; use `--amber-ink` for the focus ring (the known `--amber` 3.2:1 contrast fix); reduced-motion guard on the dashboard sparkline; QR card print layout CMYK-safe, QR ≥38 mm with quiet zone.
- **Deliverables:** Figma frames for all four screens × four states, redlines/tokens, handoff spec; QR card as a print-ready artboard; copy-deck collaboration with Content.

### Content / Localization

- **Dutch copy:** strip header ("4,6 ★ · 240 reviews op Google"), CTAs ("Laat een review achter", "Bekijk op Google Maps"), portal connect card warm copy + **explicit consent line** ("Je geeft Ondernemers van de Kamp toestemming om je Google-reviews te tonen en namens jou te reageren"), low-review nudge ("Verzamel meer reviews — print je QR-kaart voor de toonbank"), QR card text ("Tevreden? Laat een review achter ❤"), Resend emails (invite-to-connect, token-expired/reconnect, weekly reputation digest), staleness/error fallbacks ("Reviews tijdelijk niet beschikbaar — bekijk ze op Google"). Tone: informal je/jij, warm, "De Kamp leeft." register — fixes the flat portal microcopy.
- **EN-ready:** all strings authored as `reviews.*` keys ready for the future `next-intl` namespace; ship NL now. hreflang handled by the i18n epic.
- **Alt text:** Google logo `alt="Google"`; star rating exposed as text; no review-author images so no author-image alt.
- **Workflow:** Content drafts → Legal reviews consent + attribution wording → Design places → Dev wires keys.

### Legal / Compliance (GDPR)

- **Lawful basis:** displaying an owner's public Google reviews via the owner-authorized API = the owner's explicit request (consent + contract for the service); we also rely on legitimate interest for showing already-public business reviews. OAuth-token storage = necessary to deliver the service the owner asks for. Owner ticks an explicit consent box before OAuth.
- **Consent:** explicit owner consent screen before OAuth (copy above); newsletter/marketing consent stays separate; consent timestamp + scope recorded (`business_google.oauth_scope` + `connected_by` + `updated_at`).
- **Retention/erasure:** tokens wiped on disconnect, on GDPR erase (extended `purgeBusiness`/`purgeProfile`), and by the prune cron; **review text is never stored, so there is nothing to erase there** (the strongest GDPR posture); `review_requests` hold no PII (opaque token only) and prune on business erase.
- **Processors + DPAs:** Google (Business Profile API + optional Places API — accept the Maps Platform / API ToS; ensure attribution; their data-processing terms apply, with US transfer under SCCs); Cloudflare (Workers/D1/R2 — DPA in place; confirm EU jurisdiction restriction where offered); Resend (EU region, DPA). Maintain a processor-register entry for Google.
- **Domain law — the two hard constraints, verified 2026-06:**
  - **Maps Platform / Places API policy:** no caching/storing of content beyond `place_id`; mandatory Google Maps link-back; Google logo + attributions (including review-author info/links) shown unobscured when no map is present. We satisfy this via the inline "G" logo + per-author + Maps link-backs; the mini-map already on the detail page is the alternative attribution surface. **Architecture enforces the no-cache rule** (review text `no-store`, never in D1/R2).
  - **Review structured-data policy (2024+):** no self-serving AggregateRating markup. Enforced by keeping `schema.ts`'s omission.
- **No payments/PSD2/e-money/voucher-VAT implications in this epic** — those belong to the separate Kamp Cadeaukaart epic and are out of scope here.
- **Accessibility:** EAA/WCAG AA on all new UI.
- **Sign-off gate:** Legal reviews the attribution rendering, the consent copy, the processor-register entry, and the no-cache architecture **before M2 ships** (blocking).

### Data / Analytics

- **Events:** `review_strip_view`, `review_card_click` (→ Maps), `leave_review_click`, `gbp_connect_start`/`gbp_connect_success`/`gbp_connect_denied`/`gbp_disconnect`, `review_response_sent`, `qr_card_download`, `review_request_scan` (`/r/[token]`), `review_api_error`. (`review_request_convert` only if a return pixel is implemented — labelled estimated.)
- **KPIs:** see §12.
- **Dashboards:** owner sees their own rating/volume/response-rate + QR scan funnel (estimated) in `/beheer`; admin sees district-wide reputation dashboard with sortable table + 30-day sparkline + drop alerts.
- **Instrumentation:** privacy-light, EU-resident, cookieless — **Cloudflare Web Analytics** for pageview/CWV + the **D1 `analytics_events` log** (written server-side from route handlers/actions) for the custom funnel events. No third-party JS analytics, no cookies, GDPR-clean, ~€0.

### Operations / Owner-relations

- **Onboarding:** Bram sets `place_id` for all reachable businesses (M0). **Verify each `writereview` deep-link actually opens the composer**; if not, set `review_link_override` to the Maps listing URL. Then a Resend campaign invites owners to connect GBP; Operations provides a 1-page NL how-to and offers to help connect during a district visit. Note the **GBP-must-be-60-days-old + verified** prerequisite when onboarding brand-new businesses.
- **Moderation/SLAs:** admin monitors the reputation dashboard weekly; flags rating drops; nudges owners to respond (target 60% of new reviews answered within 7 days). `place_id` corrections handled in `/admin` within 2 business days.
- **Support:** owner FAQ ("Waarom zie ik mijn reviews niet?" → below threshold / not connected / API delay / token expired); one-click disconnect; printed QR cards distributed at the counter.
- **The Toko Tjin vs. ceramics-shop split** is the operational template: high-review shops get display + response coaching; low-review shops get the private acquisition kit.

---

## 5. Data model & API

**D1 DDL:** `business_google`, `review_requests`, `oauth_states`, `analytics_events` — migration `0003_google.sql`, applied via existing `db:migrate` / `db:migrate:local` scripts.

**R2:** **no review content in R2.** Optional: cache the generated QR-card PDF at `qr/{businessId}/{token}.pdf` (regenerable, non-sensitive) or generate on the fly. The ISR cache bucket (`kamp-next-cache`) must never receive review text — guaranteed by client-side `no-store` fetch (verified by acceptance test).

**`place_id` / deep-link conventions:**
- Maps listing: `https://www.google.com/maps/place/?q=place_id:{place_id}`
- Review form: `https://search.google.com/local/writereview?placeid={place_id}` (fallback to Maps listing via `review_link_override` where the composer doesn't open)
- Internal request redirect: `/r/{token}` → review form / override.

**Route handlers (METHOD /path → req/res):**
- `GET /api/reviews/[businessId]` → `{ display, rating, count, mapsUrl, reviewUrl, reviews[≤5], degraded? }`, headers `Cache-Control: private, no-store` (text never persisted).
- `GET /beheer/google/connect/[businessId]?consent=1` → 302 Google OAuth (owner-gated, state set).
- `GET /beheer/google/callback?code&state` → exchange + encrypt + UPSERT → 302 `/beheer/[id]?google=connected` (or `?google=denied`).
- `GET /beheer/google/qr/[businessId].pdf` → A6 QR-card PDF (owner-gated, logs `review_requests`).
- `GET /r/[token]` → stamp scan → 302 review form/override.
- Server Actions: `setPlaceId` (admin), `disconnectGoogle` (owner), `respondToReview` (owner).

**Third-party API calls + webhooks:**
- Google OAuth 2.0 token endpoint (`oauth2.googleapis.com/token`): code↔token exchange, refresh; revoke endpoint on disconnect.
- Google **Business Profile API**: read reviews (`accounts/{account}/locations/{location}/reviews`, returns ≤ page size; we cap at 5), post replies (`…/reviews/{review}/reply` via `updateReply`), resolve account/location. This is the compliant own-listing route for display + response.
- Google **Places API** (optional, server key, admin only): resolve a `place_id` from a name/address query when Bram can't find it manually. **Never** used to pre-fetch/cache review content for display.
- **No inbound webhooks** (Google has no review push). Freshness via the `gbp-aggregate-sync` cron + the live per-request fetch.

---

## 6. User flows & state machine

**Business review state:** `unlinked` → (admin sets place_id) → `place_id_set` → (owner consents + OAuth) → `gbp_connected` → (disconnect/erase) → back to `place_id_set` (token wiped) / `unlinked`.

**Display gate:** public strip renders iff `gbp_connected=1` **AND** `cached_count >= THRESHOLD` (default 5) **AND** live `/api/reviews` fetch succeeds **AND** `last_synced` within the staleness cutoff. Else: owner-private nudge (below threshold) or silent link-out (API error/stale).

**OAuth flow:** start (consent ticked) → state stored → Google consent → callback. Branches: state invalid/expired → friendly error + retry; `error=access_denied` → "Geen toegang verleend" + retry; token exchange transient-fail → retry; permanent-fail → error. Later permanent token failure → cron flips `gbp_connected=0` + Resend reconnect email.

**Edge cases & failures:**
- API/quota error on `/api/reviews` → `{display:false, degraded:true}`, frontend shows link-out, log `review_api_error` (never a broken widget).
- Owner revokes access on Google's side → next fetch 401/`invalid_grant` → cron flips `gbp_connected=0`, emails owner.
- `place_id` wrong/changed (business moved) → admin re-sets; stale aggregates overwritten on next sync; `last_synced` reset.
- `writereview` deep-link doesn't open composer for a given place_id → Operations sets `review_link_override` to the Maps listing.
- Threshold crossing → tag-cache invalidation flips strip on; without tag cache it lags ≤5 min (acceptable).
- Rate-limit hit on `/r/[token]` (QR spam) → WAF throttles; scan logging best-effort.
- GDPR erase mid-flight → revoke token first, then delete rows; idempotent.
- `AUTH_SECRET` rotated → stored tokens undecryptable → connect cards show "Opnieuw koppelen vereist"; treat as a controlled re-consent event (runbook).

---

## 7. Third-party choices

**Reviews source/display:**
- **Option A — Google Places API only:** simplest call, but content is not persistently cacheable, ≤5 reviews, "self-serving" if shown on the entity page, and gives **no owner-response path**. Display-via-Places is a ToS grey-area we avoid. → admin `place_id` resolver only.
- **Option B — Google Business Profile API (owner OAuth):** the *only* compliant route to **read and respond to** an owner's own reviews; fits the owner-portal model; supports replies. **Access is gated:** requires a GCP project, an **API-access application/allowlist approval** (days–weeks), and a verified GBP **60+ days old**. **RECOMMENDED** despite the gate — start the application on day 1 of M1.
- **Option C — Third-party aggregators (Trustpilot/Reviews.io widgets):** off-platform, paid, not Google-native, doesn't help the Google local pack — **rejected**.

**Token encryption:** Web Crypto AES-GCM-256 with an HKDF-derived key from `AUTH_SECRET`, at the edge — no external KMS, no latency/cost. **RECOMMENDED.** (Trade-off: secret rotation forces owner re-consent — documented.)

**QR/PDF generation:** in-Worker, Edge-safe — a small pure-JS/WASM QR encoder + a minimal PDF byte-writer (no `pdfkit`/Node streams; e.g. a hand-rolled single-page PDF or a Workers-compatible lib). No third-party, no PII leaves the edge. **RECOMMENDED.** (Verify the chosen lib has no Node-only deps before adoption — the one place a wrong library choice breaks the Workers build.)

**Analytics:** **Cloudflare Web Analytics** (free, EU-edge, cookieless) for pageview/CWV + the **D1 `analytics_events` log** for custom funnel events. Optional **Plausible EU** (~€9/mo) only if richer dashboards are wanted later. **RECOMMEND Cloudflare + D1 log → ~€0.**

**Email:** reuse existing **Resend (EU region)** for owner invites/digests/reconnect — already integrated, GDPR-clean.

**Net stack:** Google Business Profile API (display + response) + Google Places API (admin resolver only) + in-Worker AES-GCM + in-Worker QR/PDF + Resend EU + Cloudflare Web Analytics + D1 event log.

---

## 8. Milestones & sequencing

- **M0 — place_id data seam (cache-exempt) + acquisition deep-links — ~1 wk. NO Google API dependency.** `0003_google.sql`; admin set-place_id UI; rebuild Maps/review deep-links + `review_link_override`; `/r/[token]` + `review_requests` logging; in-Worker QR-card PDF. Ships value immediately. **Pull into Phase 4.**
- **M1 — GCP setup + GBP API access application (LONG-LEAD, START FIRST) — ~0.5 wk work, multi-week wait.** Create GCP project; configure OAuth consent screen + verification; **submit the Business Profile API access request day 1**; confirm a verified GBP 60+ days old exists for pilots; extend `SETTING_KEYS`; provision secrets. The *wait* runs in parallel with M0.
- **M2 — GBP OAuth backend + compliant review display — ~2–2.5 wk (gated on M1 approval).** connect/callback/disconnect handlers; AES-GCM token storage; token-refresh cron; `/api/reviews/[id]` (`no-store`); `GoogleReviewsStrip` with full attribution; aggregate-sync cron; threshold + staleness gate; SSR aggregate numbers + `sameAs`; **Legal sign-off (blocking)**.
- **M3 — Acquisition program (owner-facing) + response UI — ~1–1.5 wk.** `ReviewQrCard` in portal; owner respond-to-review UI (`respondToReview`); admin reputation dashboard.
- **M4 — Hardening, analytics, launch — ~0.5–1 wk.** WAF rate-limits; analytics events + KPI dashboard; retention/erase hooks verified; QA on a high-review shop + a low-review shop; rollout.

**Total: 6–9 weeks wall-clock** — dominated by Google API approval latency (M1 wait). Engineering hands-on is ~5–6.5 wk; the band's top end is approval slippage.

## 9. Dependencies

- **Production launch + Cloudflare hardening (Phase 4):** real `database_id` (currently `REPLACE_WITH_D1_DATABASE_ID` — app has never deployed), deployed Workers, WAF rules.
- **Google Business Profile API access approval + verified GBP 60+ days old** — the critical-path, multi-week, external blocker. **Start M1 first**, parallel to M0.
- **`AUTH_SECRET` provisioned** (`wrangler secret put`) and now actually consumed for AES-GCM token encryption.
- **`SETTING_KEYS` tuple extended** in `src/lib/settings.ts` for Google secrets in `/admin/instellingen` (closed allowlist — concrete change).
- **Owner self-service / admin access** (`owner_business` INSERT) so owners can reach `/beheer` to connect (the access flow is manual today — see backend epic).
- *(Soft)* `d1-next-tag-cache` override + `NEXT_TAG_CACHE_D1` binding for instant threshold/connect invalidation — **degrades to the 5-min ISR window if absent (non-blocking).**
- *(Soft)* Cron Trigger foundation (single scheduled Worker export) for sync/refresh/prune.
- *(Soft)* Design-system shared components (`KampInput`/`Alert`/`KampButton`) for on-brand portal UI — inline fallbacks documented.
- *(Soft)* `SITE.social` filled + Organization `sameAs` populated (entity anchoring that reviews reinforce).

## 10. Risks & mitigations

See structured `top_risks`. Headlines: (1) **GBP API approval latency / verified-GBP-60-days gate** blocks M2 — front-load M1, ship M0+acquisition independently. (2) **Edge-caching review text would breach ToS** — architecture forces `no-store`; acceptance test greps the R2 cache. (3) **Encrypted OAuth tokens / `AUTH_SECRET` rotation** — AES-GCM, per-owner isolation, minimal scope, revoke-on-disconnect/erase, rotation runbook. (4) **No self-serving AggregateRating markup** — keep schema omission; weight goes to GBP + acquisition. (5) **`writereview` deep-link unreliability + unverifiable conversion** — `review_link_override` fallback; conversion labelled estimated. (6) **Low-review embarrassment** — count threshold + private nudge, never public discouraging counts.

## 11. Acceptance criteria / Definition of Done

- [ ] `0003_google.sql` applied (local + remote); `place_id` stored for all reachable businesses; each `writereview`/override deep-link manually verified to open the composer.
- [ ] Admin can set/correct `place_id` (+ optional `review_link_override`) in `/admin`; Maps + review deep-links rebuilt from `place_id`.
- [ ] GBP API access approved; pilot GBP is 60+ days old & verified.
- [ ] Owner can connect/disconnect GBP in `/beheer` behind an explicit consent checkbox; refresh token stored **AES-GCM-encrypted**, never plaintext (verified by D1 inspection); per-owner isolation enforced via `canEdit`.
- [ ] `/ondernemers/[id]` shows ≤5 live reviews with Google logo + per-author + Maps link-back when connected and `cached_count` ≥ threshold; below threshold shows nothing public.
- [ ] `/api/reviews` responds `Cache-Control: private, no-store`; **no review text/author/per-review rating** in D1, R2, or the ISR cache — verified by inspecting a `kamp-next-cache` object for the page and grepping D1.
- [ ] **No** `aggregateRating`/`review` JSON-LD on business pages; SSR-visible numbers match Google's live numbers.
- [ ] Owner can post a review reply from `/beheer` (posts to Google via own token).
- [ ] QR counter-card PDF downloads (Edge-generated, no Node deps) and `/r/[token]` resolves to the review form/override; scans logged.
- [ ] Admin reputation dashboard shows rating/volume/30-day trend; QR conversion clearly labelled "geschat".
- [ ] Cron jobs (token-refresh, aggregate-sync, prune) run, are idempotent, and fold into a single scheduled Worker export.
- [ ] GDPR erase revokes at Google + wipes tokens/`business_google`/`review_requests`/`oauth_states`; disconnect revokes at Google.
- [ ] WAF rate-limits on OAuth + `/api/reviews` + `/r/*`; `robots.ts` disallows `/api/reviews/`, `/r/`, `/beheer/google/`.
- [ ] Analytics events firing to Cloudflare + the D1 log; KPI dashboard live.
- [ ] Legal sign-off on attribution rendering + consent copy + processor register + no-cache architecture (blocking, before M2).
- [ ] Build green; existing JSON-LD/SSG/`getOverrides` merge untouched; CWV (LCP/CLS) not regressed (reserved strip height).
- [ ] QA validated on a high-review shop and a low-review shop.

## 12. KPIs & success metrics

See structured `kpis`. Primary: place_id coverage (≈67/67); owner GBP-connection coverage (target 30%+ in 6 mo); net-new reviews/business/month (district aggregate); district rating + volume 30-day trend; owner response rate (60%+ within 7 days); QR scan count (and *estimated* scan→review at aggregate level); review-CTA CTR; local-pack referral sessions (GBP Insights + Cloudflare Analytics); API error rate <1% of fetches; **zero ToS / no-cache-violation incidents**.

## 13. Cost

**One-off:** engineering ~5–6.5 wk hands-on (in-team); GCP project + OAuth verification + BP API access application (free, time-cost, multi-week wait); QR-card print run (~€20–50 batch, optional — owners can self-print).

**Monthly at this scale:**
- Google Business Profile API: **€0** (no per-call charge for own-listing reads/replies within quota).
- Google Places API (admin `place_id` resolver only, rare): within the monthly free usage → **~€0**.
- Cloudflare Workers/D1/R2: within existing usage, negligible incremental → **~€0**.
- Resend (EU): existing plan/free tier covers owner emails → **€0**.
- Cloudflare Web Analytics + D1 event log: **€0** (or Plausible EU ~€9/mo only if richer dashboards wanted).

**Total incremental run cost: ~€0–10/month** — squarely within the lean budget.

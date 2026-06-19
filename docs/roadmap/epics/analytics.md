# Analytics & Measurement — Cookieless, GDPR-Native Measurement for Ondernemers van de Kamp

> Prove the guide works — without a cookie banner. Cloudflare Web Analytics (cookieless, native to Workers) for pageviews + Core Web Vitals, plus a first-party Worker event collector writing **bounded** aggregates to D1. We instrument the outbound action links already in the data (reserveren / bestellen / menu / route / bel / website), owner claims, gift-card sales, newsletter signups, review-count snapshots, and AI-answer-engine share-of-answer.
>
> **Recommended phase:** Phase 4. The pageview + webmaster-tools layer (M1) ships *inside* the launch-hardening epic; the first-party event collector + dashboards (M2–M5) are the first dedicated post-launch epic, sequenced after the features it instruments exist.
>
> **Effort:** 5–8 weeks (revised up from the draft's 4–7 — the cron requires a custom OpenNext worker entrypoint, not a pre-existing cron; see §4 Backend and §8 Risks).
>
> **Teams:** Backend/Infra (lead — backend is the priority), Frontend, SEO/GEO/AEO, Design/UX, Content/Localization, Legal/Compliance, Data/Analytics, Operations/Owner-relations, Product/PM.

> **Reviewer's note (what changed from the draft).** Three load-bearing corrections: (1) **There is no existing cron.** The OpenNext-Cloudflare adapter emits a Worker that exports *only* `fetch`; adding a nightly `scheduled` handler requires a **custom worker entrypoint** that re-exports the generated fetch handler and a new `main` + `triggers.crons` in `wrangler.jsonc`. This is net-new infra work and a hard prerequisite for the rollup/prune job — not a one-line "fold into the existing cron." (2) **D1 free tier is 100,000 row-writes/day.** A naive "one INSERT per event" collector can exhaust that and start returning write errors as traffic grows; the design now includes an explicit write-budget, in-Worker pre-aggregation option, and a documented upgrade trigger. (3) **The `request.cf` object and `ctx.waitUntil` are not available the same way inside a Next.js route handler on OpenNext** — they are reached via `getCloudflareContext()`, and `waitUntil` must come from that context, not a Node `process` API. These are reflected throughout.

---

## 1. Goal & value

The whole point of *Ondernemers van de Kamp* is to send real people to real shops, cafés and restaurants on De Kamp. Today the site is beautiful and SEO-strong but **measurement-blind**: nobody can answer "is this working?". This epic makes the answer concrete and defensible — without a cookie banner.

- **For the district association (admin):** a single dashboard answering "did we drive visits, clicks-to-call, route-clicks, reservations, gift-card sales, owner claims and reviews this month?" — the evidence needed to justify the project to the ~67 owners, to the gemeente, and to any future funder.
- **For owners (B2B):** their own listing's numbers in `/beheer` — "your page was viewed 412× this month, 38 people clicked 'route', 12 clicked 'bel', 6 clicked your menu" — the single most persuasive reason for an owner to claim and maintain their listing.
- **For visitors (B2C):** indirectly — measurement reveals which pages are slow, which categories under-convert, which content AI engines cite, so the team keeps the experience fast and findable.
- **The problem solved:** the guide currently runs on faith. After this epic it runs on a North-Star metric (monthly outbound action clicks) and a KPI tree, all gathered **without a cookie banner** — preserving the fast, frictionless, premium feel that is itself a competitive and AEO advantage (consent walls hurt Core Web Vitals and bounce).

The strategic constraint shapes the whole design: **EU residency + GDPR mandatory, budget €0–25/month, small/part-volunteer team.** That rules out Google Analytics 4 (US transfer + consent banner + complexity) and rules in a cookieless, first-party, Cloudflare-native approach. "Essentially free" is true *at current scale* — but it is bounded by the D1 free-tier write ceiling, which we size and guard explicitly (§5, §13).

---

## 2. How it works in real life

**Personas:** *Sanne* (visitor, 31, Amersfoort-Vermeerkwartier), *Bram* (owner of **Wit-Lof**, Kamp 5), *Hadewych* (district-association admin/moderator).

**Sanne's journey (the North-Star path).** On a Saturday Sanne asks ChatGPT "leuke lunch op De Kamp Amersfoort". The guide is cited (we measure that monthly via the prompt panel). She lands on `/categorie/eten-drinken`, taps through to **Wit-Lof**. The page records a *business-page view* (Cloudflare beacon for CWV/pageviews + a first-party `page_view` event for the funnel join). She reads the story, then taps **"Route"** → an `action_click {business_id:"wit-lof", action_type:"route"}` is queued to `POST /api/collect` via `navigator.sendBeacon` *before* navigation, then Google Maps opens. No cookie is set; she is counted by a daily-rotating salted hash that cannot re-identify her across days. She also taps **"Bel"** → `action_click {action_type:"call"}`. **Two outbound actions, one visit — exactly the value the guide exists to create, now visible.**

**Bram's journey (owner value + onboarding funnel).** Bram gets the monthly Resend digest: "Wit-Lof op De Kamp — 412 weergaven, 38× route, 12× bel, 6× menu." He logs into `/beheer`, sees the same numbers, and — motivated — finishes claiming his listing and uploads a new photo. His claim was itself a funnel: `claim_start → claim_email_sent → claim_completed`. Each step is a **server-side** event emitted by the server action / route handler (not the browser), so it cannot be spoofed and needs no cookie. Later Bram enables Google reviews; the nightly GBP snapshot records his review *count*, and next month's digest shows "+4 reviews".

**Hadewych's journey (admin / measurement owner).** Monday she opens `/admin/analytics`. The North-Star tile shows **1,840 outbound action clicks this month, +18%**. The KPI tree decomposes it: page-views → action-clicks → claims → gift-card sales → newsletter → reviews. A per-business leaderboard shows Wit-Lof and **Toko Tjin** topping route-clicks; a quiet long-tail business at the bottom flags a content gap she assigns to Content. A funnel panel shows the **gift-card** flow converting at 4% and the **owner-onboarding** funnel at 61%. A second tab: Google Search Console shows impressions climbing for "winkelen Amersfoort binnenstad". Once a month she runs the 20-query **share-of-answer panel** and logs which engines cite the guide. None of this required a consent banner, a third-party tag manager, or a euro of paid tooling beyond the existing stack.

---

## 3. Scope

**In (this epic):**
- Cloudflare Web Analytics (cookieless pageviews + CWV) on all public routes.
- First-party Worker event collector: `POST /api/collect` + `analytics_events` + nightly rollup to `analytics_daily_rollup`.
- Cookieless visitor model (daily salted hash; no cookie, no fingerprint beyond coarse device class + country).
- Client event lib (`sendBeacon`, `keepalive`-fetch fallback) wired to **every outbound action link** already in the data (`websiteUrl`, `phone`, `menuUrl`, `orderUrl`, `googleMapsUrl`/route, "Reviews op Google").
- **Server-side** conversion events for claim, newsletter, gift-card (from the Mollie webhook), and GBP review-count snapshots — emitted from server actions / route handlers, never the browser.
- **A custom OpenNext worker entrypoint** adding a `scheduled` handler + a Cron Trigger (net-new infra; see §4 Backend).
- `/admin/analytics` dashboard + per-owner stats in `/beheer`.
- Google Search Console + Bing Webmaster verification, sitemap submission, IndexNow.
- GSC API nightly import into `gsc_daily`.
- GEO/AEO share-of-answer tracker (`ai_citation_log`) + AI-bot crawl-rate proxy (logged from the collector / middleware).
- Nightly cron: rollup aggregation + raw-event pruning + GSC import + expired-`auth_tokens`/`sessions` pruning (the latter folds in the roadmap's standing cron item, which this epic actually *builds*).
- Legal LIA / no-consent justification memo + public "Hoe wij meten" privacy section.

**Out (explicitly not this epic):**
- Google Analytics 4, GTM, any US-resident analytics, any cookie-based identity.
- Cross-site / cross-device stitching, persistent user profiles.
- Heatmaps / session replay.
- A/B testing framework.
- Building the gift-card/newsletter/claim features themselves — this epic only *instruments* them and depends on them existing.

**Later (fast-follow):**
- Migrate the collector to a Cloudflare Queue (consumer batches writes) or self-hosted Umami if event volume approaches the D1 write ceiling and richer UI is wanted.
- Automated AI-Overview citation scraping (if/when a compliant API exists).
- Funnel cohorting and retention curves.
- EN-locale segmentation once the bilingual track ships.
- Anomaly alerting (Resend alert when traffic drops > X%).

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

- **Pageview beacon:** add the Cloudflare Web Analytics beacon via `next/script` with `strategy="afterInteractive"` in `src/app/layout.tsx`. Prefer the explicit `next/script` tag (versioned in code, CSP-auditable) over CF dashboard auto-injection. Cookieless; **no consent gate**. Add the beacon host to the CSP `script-src`/`connect-src` if/when a CSP lands.
- **Event client lib** (`src/lib/analytics.ts`, `"use client"`): export `track(eventType, payload)` that calls `navigator.sendBeacon('/api/collect', new Blob([JSON.stringify(...)], {type:'application/json'}))`, with a `fetch('/api/collect', {method:'POST', keepalive:true, ...})` fallback when `sendBeacon` is unavailable. `sendBeacon` survives the page-unload that an outbound link triggers — critical for action-click accuracy. Never set/read a cookie or `localStorage`. **Respect `navigator.doNotTrack === '1'` and `navigator.globalPrivacyControl === true`** by silently no-op'ing the first-party collector (defensive, even though we are cookieless and consent-exempt).
- **Outbound-link instrumentation:** the action links live in `src/components/BusinessDetailClient.tsx` (`b.websiteUrl`, `b.phone` → `tel:`, `b.menuUrl`, `b.orderUrl`, `b.googleMapsUrl` → route, and the "Reviews op Google" link → `b.googleMapsUrl || mapsUrl()`). Introduce a shared **`<ActionLink action_type business_id href icon label>`** client component that (a) renders the existing icon/label styling so the design system stays DRY, and (b) fires `track('action_click', {...})` on **`onPointerDown`** (so middle-click / new-tab / long-press are all captured before navigation). The `<a>` is server-rendered so it still works with JS disabled (graceful degradation — link opens, just unmeasured).
- **Components:** `<ActionLink>` (tracking + presentation); `<AnalyticsBeacon>` (the `next/script` tag, lives in layout). Keep everything else a server component — only the link wrapper and the beacon are `"use client"`.
- **Conversion events are NOT client-tracked.** Claim, newsletter, and gift-card conversions are server-emitted (see Backend) so the client stays dumb and unspoofable. The only client tracking is `page_view` (used for the first-party funnel join) and `action_click`.
- **No images, no bundle bloat.** Keep the analytics client < 2 KB gzipped; load the CF beacon `afterInteractive`. Measurement must not regress the CWV it measures — verify LCP/INP before/after in M2 (acceptance criterion).
- **Admin/owner UI:** build `/admin/analytics` as a server component reading the **rollup** tables, with small client chart components. Given budget + bundle discipline, use **hand-rolled inline-SVG bars/sparklines** styled with the existing `globals.css` tokens — no Recharts/Chart.js. Build the per-business stats strip in `/beheer/[id]` and a summary card on `/beheer`. Date-range switcher is a server-side search-param (`?from=&to=`) — no client state needed.

### Engineering — Backend & Infra (Cloudflare) — PRIMARY FOCUS

This is the headline. The collector and rollup are deliberately tiny, bounded, and cookieless. **Two items in the draft were wrong and are corrected here:** (a) there is no existing cron to "extend," and (b) the per-event write model must be sized against the D1 100k-writes/day free-tier ceiling.

#### 4.1 The cron does not exist yet — build the custom worker entrypoint first

The OpenNext-Cloudflare adapter (`opennextjs-cloudflare build`) emits `.open-next/worker.js` exporting **only a `fetch` handler**. `wrangler.jsonc` points `main` at it. There is **no `scheduled` export and no `triggers.crons`** today, and the roadmap's "auth-token pruning cron" is *unbuilt*. To run any nightly job you must:

1. Add a **custom worker entrypoint**, e.g. `worker.ts` at repo root:
   ```ts
   // worker.ts — wraps the OpenNext-generated handler and adds a cron handler.
   import handler from "./.open-next/worker.js";
   import { runNightlyJobs } from "./src/lib/cron"; // pure functions, take the D1 binding

   export default {
     fetch: handler.fetch, // delegate all HTTP to OpenNext untouched
     async scheduled(event: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
       ctx.waitUntil(runNightlyJobs(env, event.scheduledTime));
     },
   } satisfies ExportedHandler<CloudflareEnv>;

   // Re-export the Durable Object / any named exports OpenNext requires, if present.
   export * from "./.open-next/worker.js";
   ```
2. Point `wrangler.jsonc` `"main"` at the built custom worker (per OpenNext's "Custom Worker" guide — typically you set `main` to your wrapper and let the build produce `.open-next/worker.js` as the import target; verify the exact wiring against the installed `@opennextjs/cloudflare@^1.19` docs, since the import path is version-sensitive).
3. Add the trigger to `wrangler.jsonc`:
   ```jsonc
   "triggers": { "crons": ["17 2 * * *"] }  // 02:17 UTC nightly (off the hour to avoid CF cron congestion)
   ```
4. Test locally with `wrangler dev` then `curl http://localhost:8787/cdn-cgi/handler/scheduled` to fire the handler.

`runNightlyJobs()` must be **pure D1 logic** (`src/lib/cron.ts`) that takes the `env` bindings — do not import Next.js server-only helpers into the cron path (they assume a request context that the scheduled handler does not have).

#### 4.2 D1 schema (new migration `migrations/0003_analytics.sql`)

DDL in §5. Tables: `analytics_events` (raw, ≤ 35-day retention, pruned nightly), `analytics_daily_rollup` (durable aggregate the dashboards read), `ai_citation_log` (GEO share-of-answer), `gsc_daily` (Search Console import). Apply via the existing `db:migrate` script.

#### 4.3 Route handler — the collector

`POST /api/collect` at `src/app/api/collect/route.ts` with `export const dynamic = "force-dynamic"` and `export const runtime = "nodejs"` is **not** used — on OpenNext the route runs on the Workers runtime by default; do **not** add `runtime = "edge"` either (OpenNext does not use Next's edge runtime). Access bindings and request metadata through `getCloudflareContext()` from `@opennextjs/cloudflare`, **not** via a bare `request.cf` (which is not reliably populated through the Next request object on OpenNext) — read `cf` from `getCloudflareContext().cf` / the request passed by the adapter. Steps:

1. **Origin defence:** reject unless `Origin` is in the site allowlist **and** `Sec-Fetch-Site` ∈ {`same-origin`, `same-site`}. Always return `204` regardless of validation outcome, so abusers learn nothing.
2. **Payload guard:** enforce a hard body-size cap (e.g. 1 KB) by reading `Content-Length` and bailing early; parse JSON in a `try/catch`.
3. **Schema + enum validation:** `event_type ∈ {page_view, action_click}` (server-only event types are rejected here — they never come from the browser); `action_type ∈ {website, call, menu, order, route, reviews}`; `business_id` must be `null` or match a known seed id (cheap in-memory `Set` built from the seed at module load).
4. **Bot filter:** drop human-counting if UA matches a bot regex. **AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, OAI-SearchBot, etc.) are logged separately** as `ai_bot_crawl` for the AEO proxy — but note these bots rarely execute JS, so the *primary* AI-crawl signal comes from server-side request logging in middleware, not the client beacon (the collector path will see few of them). Treat the client-side AI-bot count as a weak supplement.
5. **Cookieless visitor hash:** `visitor_hash = base64url(SHA-256(daily_salt ‖ client_ip ‖ user_agent)).slice(0,22)`. `daily_salt = HMAC(server_secret, UTC_date_string)` so it rotates every 24 h and is unguessable. IP is **never stored raw**; because the salt rotates daily, the hash **cannot re-identify a person across days** — the linchpin of the no-consent posture (see Legal). `server_secret` is a `wrangler secret` (reuse/rename `AUTH_SECRET`, which is currently declared-but-unused, or add `ANALYTICS_SALT_SECRET`).
6. **Write strategy (the cost-critical decision):** INSERT **one** `analytics_events` row per accepted event. Use `ctx.waitUntil(db…run())` so the response returns `204` immediately and the write happens out-of-band. **Budget:** at the D1 free ceiling of **100,000 row-writes/day**, and assuming ~2–4 writes per engaged visit (1 page_view + 1–3 action_clicks) plus nightly rollup writes, the design is safe up to ~20–30k engaged sessions/day — far beyond current scale. **Mitigation if approached:** (a) sample `page_view` (e.g. keep 1-in-N) since CF Web Analytics already covers raw pageviews and the first-party `page_view` exists only for the funnel join; (b) buffer events in a **Cloudflare Queue** (free plan as of 2026-02) and have a consumer batch-INSERT — moving N writes into ~1 amortised write. Document the upgrade trigger: **alert + switch to the Queue path when daily `analytics_events` inserts exceed 50k.**
7. Return `204 No Content`. Never set a cookie; never echo PII.

#### 4.4 Server-side conversion events (no client trust)

Add `logServerEvent(env, {...})` to `src/lib/analytics-server.ts` — a direct D1 INSERT into `analytics_events` for `event_type ∈ {claim_start, claim_email_sent, claim_completed, newsletter_signup, newsletter_confirmed, giftcard_checkout, giftcard_paid, review_snapshot}`. `visitor_hash` is `null` for these (they are not visit-scoped). Call sites:
- the **claim** server action (owner-onboarding epic) → `claim_start` / `claim_email_sent` / `claim_completed`;
- the **newsletter** double-opt-in endpoints (newsletter epic) → `newsletter_signup` / `newsletter_confirmed`;
- the **Mollie webhook** handler `POST /api/mollie/webhook` (gift-card epic owns the route; this epic adds the `logServerEvent` call) → `giftcard_paid` with `meta.mollie_payment_id` for reconciliation. **Mollie remains the source of truth for €.**
- the **GBP snapshot** nightly job → `review_snapshot` with `meta.review_count` per business.

These need no `/api/collect` round-trip and cannot be spoofed by a browser. **Sequencing reality:** the call sites do not exist until their epics land, so M3 ships **idempotent stub call sites** (a no-throw `logServerEvent` that the future epics wire in) — this epic must not block on them.

#### 4.5 Nightly cron job body (`src/lib/cron.ts`, called from the scheduled handler)

Run in order, each step independently `try/catch`-wrapped so one failure does not abort the rest:
1. **Aggregate** yesterday's `analytics_events` → `analytics_daily_rollup` via `INSERT … ON CONFLICT(date,dimension,key,metric) DO UPDATE` (idempotent — a re-run of the same day overwrites, so a missed night self-heals next run). Metrics: `page_views`, `unique_visitors` (`COUNT(DISTINCT visitor_hash)`), `action_clicks` per type, per-business breakdowns, funnel-stage counts. **De-dupe action-clicks** in the rollup per `visitor_hash × business × action × day` to resist self-inflation.
2. **Import GSC** Search Analytics for the appropriate lag day (GSC data is ~2–3 days delayed — import `today − 3`, not `today − 1`, or you will store empty rows; re-import a trailing 3-day window each night and UPSERT to backfill).
3. **Snapshot reviews** (if GBP epic is live): per claimed business, read the owner-OAuth GBP review count, write `review_snapshot`.
4. **Prune** `analytics_events` older than the retention window (35 days, Legal-signed-off) — data-minimisation by design.
5. **Prune** expired `auth_tokens` and `sessions` (builds the standing roadmap cron item).
6. On any step throwing, send a Resend **cron-failure alert** to admin (so a silent data gap is noticed).

#### 4.6 Bindings, rate-limiting, security

- **Bindings:** reuse `DB` (D1). No new R2. If the Queue mitigation is adopted, add a `QUEUE` producer/consumer binding (deferred to "later" unless the write budget is hit).
- **Rate-limit `/api/collect`:** add a **Cloudflare WAF rate-limiting rule** (e.g. 60 req/min/IP on `POST /api/collect`). Note: rate-limiting rules are a **dashboard/Terraform config**, and the truly-free allotment is limited — confirm the current free-plan rule count before relying on it; if unavailable, fall back to an in-Worker token-bucket keyed on IP in a D1/DO counter, or accept the WAF managed challenge. Do not claim "zero-cost WAF" without checking the account's plan.
- **Cloudflare Web Analytics** needs only a dashboard site-token + the beacon — no binding, no API.
- **`/api/collect` in `robots.ts` disallow:** add a `disallow: ["/api/", "/beheer", "/admin"]` rule for crawlers (currently `robots.ts` has **no disallow at all** — verified in `src/app/robots.ts`). This stops crawler-inflated events and keeps internal tools out of the index. Keep the AI-crawler allow rules.
- **Owner isolation:** `/admin/analytics` behind `requireAdmin()`. `/beheer` owner stats **must** filter `business_id IN (ownedBusinessIds(profile))` — an owner sees only their own rollups. Test with two accounts (acceptance criterion).
- **Caching:** dashboards read the small, indexed rollup tables; they are auth-gated and low-traffic, so render them `force-dynamic` (no ISR — ISR would cache one admin's view). The collector is always dynamic. Pre-aggregation is the performance strategy: never scan raw events at read time.

#### 4.7 Migrations & indexes

Add `0003_analytics.sql`; apply via `db:migrate`. Indexes: `analytics_events(ts)`, `analytics_events(business_id, event_type)`, `analytics_events(event_type, ts)`, `analytics_daily_rollup(date, dimension)`, `ai_citation_log(date)`, `gsc_daily(date)`.

### SEO / GEO / AEO

- **Search Console + Bing:** verify both via **DNS TXT on Cloudflare DNS** (instant). Submit `sitemap.ts`, set international targeting to NL. Bing Webmaster can import settings from GSC.
- **IndexNow:** deploy an IndexNow key file at the domain root (a static route returning the key) and **ping IndexNow when an override is approved** — hook the existing `moderateOverride`/`setApprovedImage` path in `src/lib/overrides.ts` / `src/app/admin/actions.ts`. A single `POST https://api.indexnow.org/indexnow` with the changed URL(s). Speeds Bing/Yandex recrawl; a freshness lever. Note: Google does **not** consume IndexNow — Google freshness still relies on sitemap `lastModified` + crawl.
- **GSC API import** feeds `gsc_daily` → dashboard surfaces query/impression/CTR/position so Content sees which AEO answer-chunks earn clicks. **Auth:** GSC API needs a Google Cloud **service account** added as a GSC property user, or OAuth — store credentials as `wrangler secret`s; the call is a nightly `searchanalytics.query` from the cron. Mind that GSC search-query data is privacy-thresholded (rare queries omitted) — store only what the API returns.
- **AI share-of-answer:** no official API. Track two ways — (1) the **manual monthly prompt panel** (20 fixed De Kamp/Amersfoort queries) logged in `ai_citation_log` per engine (ChatGPT, Perplexity, Google AI Overviews, Copilot) with `cited` + `position`; (2) **AI-bot crawl rate** from server-side request logging (middleware / CF logs), not the client beacon (these bots don't run JS). Rising crawl + rising citations = winning AEO.
- **Freshness loop:** the dashboard's per-business "last refreshed" (`updatedAt`/`dateModified`) ties to the 2026 finding that >83% of AI citations are pages updated within 12 months and >60% within 6 months. Surface stale pages so Content refreshes them — measurement drives the freshness cadence.
- **CWV:** CF Web Analytics reports LCP/INP/CLS p75; GSC Core Web Vitals confirms. The beacon must not regress CWV (the reason we reject GTM/GA4).
- **No schema for analytics pages** — `/admin/analytics`, `/beheer` are `noindex` + `robots` disallow; keep them out of the sitemap.

### Design / UX

- **Screens:** `/admin/analytics` (North-Star hero tile, KPI tree, per-business leaderboard table, gift-card funnel, owner-onboarding funnel, GSC panel, AEO scoreboard, date-range switcher, CSV export); `/beheer` owner summary card + `/beheer/[id]` per-business stats strip; the monthly email digest layout.
- **States for every panel:** empty ("Nog geen data — we meten vanaf vandaag"), loading (skeleton on existing tokens), error ("Kon statistieken niet laden"), success. A newly-launched site is mostly empty states early — design them warmly, not as failures.
- **Brand uplift:** the design audit flagged `/admin` and `/beheer` as design-orphaned. Apply tokens: Playfair headings, `--deep-green` / `--amber-ink`, radius/shadow tokens. Charts: inline-SVG bars/sparklines in `--deep-green` fill / `--amber` accent — no chart library.
- **Responsive:** dashboards must work on Hadewych's phone — stack panels at `sm`, table → cards on mobile.
- **Motion:** subtle count-up on the North-Star number via the shared motion presets; respect `prefers-reduced-motion`.
- **WCAG AA:** do **not** encode trends by colour alone (the audit caught this in the admin diff view) — pair up/down arrows + `+`/`−` signs with green/red. Use `--amber-ink` (not `--amber`, which is ~3.2:1) for the focus ring on these new screens. Data tables get `<th scope>`; charts get `<title>` + `aria-label` text summaries (e.g. "Routeklikken per maand: jan 12, feb 18…").
- **Deliverables:** Figma frames for the three screens + email digest, with empty/loading/error/success variants, handed off via design-system tokens. Document `<ActionLink>` and the chart components.

### Content / Localization

- **Microcopy (NL-first, warm "De Kamp leeft." register):** tile labels ("Klikken naar ondernemers", "Unieke bezoekers", "Route opgevraagd", "Gebeld", "Menu bekeken", "Cadeaukaarten verkocht", "Nieuwsbrief-aanmeldingen", "Nieuwe reviews"), empty/error states, and the **monthly owner email digest** (the highest-leverage artefact — it makes owners care). Tone: encouraging, concrete, never shaming a low number.
- **Legal-facing copy:** a short, plain-Dutch **privacy section "Hoe wij meten"** — cookieless approach, no banner, no tracking cookies, anonymous aggregate statistics — linked from the footer (the audit noted Privacy currently points to `#`). This is part of why we run consent-free, and it builds trust.
- **EN/bilingual implication:** the dashboard is admin-only, so EN dashboard copy is low priority; but the **public privacy statement** must be translated when the EN track ships, and `ai_citation_log` should split EN vs NL query panels (English AI citations are a separate KPI).
- **Alt text:** dashboard charts are inline SVG with `<title>`/`aria-label` — no alt files. The **digest email** charts (rendered as images for email clients) need descriptive `alt`.
- **Workflow:** Content writes NL copy → Legal reviews the privacy section → EN translation deferred to the localization epic.

### Legal / Compliance (GDPR) — justify the no-consent posture

- **Lawful basis & the consent question.** Under ePrivacy (NL: Telecommunicatiewet implementing Art 5(3)) consent is required to *store or read information on a device* unless strictly necessary. Our design **stores nothing on the device** — no cookies, no `localStorage`, no fingerprinting. Cloudflare Web Analytics is purpose-built cookieless. The first-party collector uses a **daily-rotating HMAC salt over IP+UA, never storing raw IP, non-persistent across days**, producing **anonymous aggregate statistics**. The Autoriteit Persoonsgegevens and analogous CNIL guidance treat genuinely anonymous, first-party, aggregate audience measurement as **exempt from consent**. **However:** the IP+UA hash, even transiently, is processed personal data at the moment of hashing — so this is a *consent-exemption-for-storage* argument plus a *legitimate-interest* basis for the brief processing, **not** a claim that "no personal data is ever touched." The memo must say this precisely; over-claiming ("zero personal data") is the audit risk.
- **Deliverable — written LIA + no-consent memo** documenting: (a) no device storage; (b) salt rotation defeating persistence; (c) IP never stored raw, dropped after hashing; (d) ≤ 35-day raw-event retention with nightly aggregation+deletion; (e) no profiling, no advertising use, no cross-site; (f) no data sharing. Keep on file for an AP audit. Note explicitly **why a full DPIA is not required** (no large-scale profiling, no special categories, no systematic monitoring of a public space at scale) — but have Legal confirm this conclusion rather than asserting it.
- **Processors + DPAs / processor register:** Cloudflare (sign the Cloudflare DPA; configure EU data localisation / Data Localisation Suite where applicable — note CF Web Analytics aggregation location and confirm it meets the EU-residency constraint). Google Search Console / GSC API (we import only aggregate, privacy-thresholded query stats; Google's terms + SCCs apply; no personal data of *our* users is sent to Google that wasn't already Google's). Bing Webmaster (Microsoft DPA). Mollie (gift-card revenue mirror — Amsterdam, EU-resident; its DPA lives in the payments epic). Resend (digest emails — EU region; its DPA in the newsletter epic).
- **Retention/erasure:** raw `analytics_events` ≤ 35 days then cron-deleted (minimisation by design). Rollups carry **no `visitor_hash`** (non-identifying aggregates) so they fall outside erasure scope. **Confirm** the existing GDPR-erase flow (`purgeBusiness`/`purgeProfile`) need not touch analytics: rollups are anonymous and raw events self-expire — **document this conclusion in the erasure runbook** rather than leaving it implicit.
- **Domain law (boundaries, deferred to owning epics):**
  - **Payments / PSD2 / e-money / voucher-VAT (gift card):** analytics is **not** a payment processor and stores **no card data, no PII, no balances** — only a paid-count and a `mollie_payment_id` for reconciliation. The substantive NL gift-card compliance (single- vs multi-purpose voucher VAT timing; the **PSD2 limited-network exclusion** under art. 1:5a(2)(k) Wft; the **DNB notification duty once payment volume exceeds €1M over a trailing 12 months**; e-money licensing) lives entirely in the gift-card epic. This epic's only obligation is to **not** become a shadow record-of-truth for money — it mirrors Mollie and labels figures "mirrored from Mollie."
  - **Review-API ToS:** review **counts** shown come from the **GBP API (owner OAuth — the compliant route)**; analytics stores only a numeric snapshot, never cached Places review *content*. No attribution obligation arises because **no review text or author data is displayed in analytics**. (The Places API caching rule — place_id cacheable indefinitely, review content not cacheable, attribution + author links mandatory when content *is* displayed, max 5 reviews/request — is honoured in the reviews-display epic, not here.)
  - **Marketing consent:** newsletter signups are recorded as conversion *events*; the **consent itself** (double-opt-in) is the newsletter epic's job. Analytics records the *fact* of confirmation, never a basis to email.
  - **Accessibility (EAA 2025 / WCAG AA):** dashboards are internal but still built to AA.

### Data / Analytics

- **Canonical event taxonomy:** `page_view`, `action_click{website|call|menu|order|route|reviews}`, `claim_start`, `claim_email_sent`, `claim_completed`, `newsletter_signup`, `newsletter_confirmed`, `giftcard_checkout`, `giftcard_paid`, `review_snapshot`, `ai_bot_crawl`. The `action_type` enum is the **contract** between the data-model fields and the tracker — adding a new outbound link = adding one enum value in one place.
- **KPI tree** (§12): North-Star = monthly outbound action clicks → reach (page views, unique visitors), quality (action-click rate), conversion verticals (claims, gift-card, newsletter, reviews), discovery (GSC organic, AEO share-of-answer), health (CWV).
- **Dashboards & owners:** `/admin/analytics` (owner: Hadewych/PM); per-business stats in `/beheer` (each owner); monthly Resend digest (automated). North-Star reviewed monthly by Product/PM.
- **Discipline:** one shared taxonomy doc; de-dupe action-clicks per `visitor_hash × business × action × day` in the rollup; always headline **unique** counts; exclude known admin/owner `visitor_hash`es where feasible (best-effort, since hashes rotate daily).
- **Reconciliation:** nightly check that `giftcard_paid` event count ≈ `gift_cards` paid rows ≈ Mollie settled count; flag drift to admin. (Approximate, not exact, because client `giftcard_checkout` can be lost while the server-side `giftcard_paid` is authoritative.)

### Operations / Owner-relations

- **Monthly digest workflow:** cron assembles per-owner stats → Resend sends "jouw maand op De Kamp" → owners engage → conversions tracked. The operational heartbeat that turns measurement into owner retention.
- **Onboarding hook:** the claim welcome email points owners to `/beheer` stats — "watch your numbers grow."
- **Anomaly watch / SLA:** review the dashboard **weekly**, the share-of-answer panel **monthly**. Spike from a press mention → ensure the cited page is current; a business with 0 action-clicks for 60 days → content intervention.
- **Support:** owners will ask "what does 'route' mean / why is my number low" — a one-page plain-Dutch metric FAQ (Content writes it).

### Product / PM

Owns the North-Star and the KPI tree; prioritises the funnel work; runs the monthly review; signs off the retention-window decision with Legal; gates M1 into the launch epic vs M2–M5 as the post-launch epic. No team is N/A — all are touched.

---

## 5. Data model & API

**D1 DDL (`migrations/0003_analytics.sql`):**

```sql
-- Raw events: append-only, short retention (pruned nightly by cron).
CREATE TABLE analytics_events (
  id            TEXT PRIMARY KEY,            -- crypto.randomUUID()
  ts            INTEGER NOT NULL,            -- epoch ms
  event_type    TEXT NOT NULL,               -- page_view | action_click | claim_start | claim_email_sent
                                             -- | claim_completed | newsletter_signup | newsletter_confirmed
                                             -- | giftcard_checkout | giftcard_paid | review_snapshot | ai_bot_crawl
  business_id   TEXT,                         -- seed id, nullable (site-level / server events)
  action_type   TEXT,                         -- website|call|menu|order|route|reviews (action_click only)
  path          TEXT,                         -- request path, query stripped
  referrer_host TEXT,                         -- host only, no query/path PII
  visitor_hash  TEXT,                         -- base64url(SHA-256(daily_salt||ip||ua))[:22]; NULL for server events; NOT stable across days
  country       TEXT,                         -- request cf.country (coarse)
  device        TEXT,                         -- 'mobile' | 'desktop' | 'tablet' (coarse UA class)
  meta          TEXT,                         -- optional JSON (mollie_payment_id, review_count, …)
  is_bot        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_events_ts        ON analytics_events(ts);
CREATE INDEX idx_events_biz_type  ON analytics_events(business_id, event_type);
CREATE INDEX idx_events_type_ts   ON analytics_events(event_type, ts);

-- Durable aggregate the dashboards read (no visitor_hash -> non-identifying, outside erasure scope).
CREATE TABLE analytics_daily_rollup (
  date       TEXT NOT NULL,        -- 'YYYY-MM-DD' (UTC)
  dimension  TEXT NOT NULL,        -- 'site' | 'business' | 'action' | 'funnel' | 'country' | 'device' | 'referrer'
  key        TEXT NOT NULL,        -- business_id, action_type, funnel-stage, country code, … ('' for site)
  metric     TEXT NOT NULL,        -- 'page_views' | 'unique_visitors' | 'action_clicks' | 'conversions'
  count      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, dimension, key, metric)   -- enables idempotent UPSERT on re-run
);
CREATE INDEX idx_rollup_date_dim ON analytics_daily_rollup(date, dimension);

-- Manual / semi-automated GEO share-of-answer tracking.
CREATE TABLE ai_citation_log (
  id        TEXT PRIMARY KEY,
  date      TEXT NOT NULL,         -- 'YYYY-MM-DD'
  engine    TEXT NOT NULL,         -- 'chatgpt' | 'perplexity' | 'google_aio' | 'copilot'
  query     TEXT NOT NULL,         -- one of the 20 fixed panel prompts
  cited     INTEGER NOT NULL,      -- 0/1 was the guide cited
  position  INTEGER,               -- rank within the answer, nullable
  locale    TEXT NOT NULL DEFAULT 'nl',
  notes     TEXT
);
CREATE INDEX idx_aicit_date ON ai_citation_log(date);

-- Google Search Console import (data is ~2-3 days lagged; import a trailing window and UPSERT).
CREATE TABLE gsc_daily (
  date        TEXT NOT NULL,
  query       TEXT NOT NULL,
  page        TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks      INTEGER NOT NULL DEFAULT 0,
  position    REAL,
  PRIMARY KEY (date, query, page)
);
CREATE INDEX idx_gsc_date ON gsc_daily(date);
```

**Route handlers:**

- `POST /api/collect` (`src/app/api/collect/route.ts`, `export const dynamic = "force-dynamic"`). Request: `{ event_type: 'page_view'|'action_click', business_id?, action_type?, path, referrer_host? }`. Response: **`204 No Content`** (always; no body). Validates Origin + `Sec-Fetch-Site`, body-size cap, enum/schema, bot-filter, computes `visitor_hash` from `getCloudflareContext().cf` IP/UA + daily salt, writes one row via `ctx.waitUntil`. Rate-limited (WAF rule or in-Worker token-bucket). Never sets a cookie.
- `GET /admin/analytics` (page, `requireAdmin`, `force-dynamic`) → reads `analytics_daily_rollup`, `gsc_daily`, `ai_citation_log` for the `?from=&to=` range.
- `GET /admin/analytics/export.csv` (`src/app/admin/analytics/export.csv/route.ts`, `requireAdmin`) → streams rollup as CSV.
- Owner stats: rendered inside `/beheer` + `/beheer/[id]` server components, query scoped to `ownedBusinessIds(profile)`.

**Server-emitted events** (no HTTP route — direct `logServerEvent(env, …)`): `claim_*` from the claim action; `newsletter_*` from the newsletter endpoints; `giftcard_checkout` from the Mollie create-payment action and `giftcard_paid` from the **Mollie webhook** (`POST /api/mollie/webhook`, owned by the gift-card epic — this epic adds the `logServerEvent` call with `meta.mollie_payment_id`); `review_snapshot` from the GBP nightly job. **M3 ships no-throw stubs so this epic does not block on those epics.**

**Third-party calls:** GSC API `searchanalytics.query` (nightly, service-account, trailing-3-day window, EU). Cloudflare Web Analytics (beacon → CF dashboard; no API). IndexNow ping `POST https://api.indexnow.org/indexnow` on override approval. No analytics webhook of our own — we *consume* the Mollie webhook the payments epic exposes.

---

## 6. User flows & state machine

**Action-click flow (core path):**
1. Visitor on business page → taps "Route".
2. `onPointerDown` → `track('action_click',{business_id,action_type:'route'})` → `navigator.sendBeacon('/api/collect', …)`.
3. Browser begins navigation to Google Maps (beacon already queued, survives unload).
4. Worker validates → `ctx.waitUntil(INSERT analytics_events)` → returns `204`.
5. Nightly cron aggregates → `analytics_daily_rollup` → dashboard shows it next day.
- **Edge cases:** JS off → link works, event lost (acceptable). `sendBeacon` unsupported → `fetch(keepalive:true)` fallback. Middle-click/new-tab → `pointerdown` already fired. Double-tap → de-duped in rollup by `visitor_hash×business×action×day`. DNT/GPC set → collector no-ops. `waitUntil` write fails → event lost silently (acceptable; we never block the user).

**Collector validation state machine:** `received → originValid? → sizeOk? → schemaValid? → enumValid? → botFiltered? → hashed → waitUntil(insert) → 204`. Any failure short-circuits to `204` (silent). Rate-limit returns `429` (or a challenge) before the handler.

**Owner-onboarding funnel (server-side):** `claim_start` → `claim_email_sent` → `claim_completed` (magic-link consumed + `owner_business` row). Edge: email never clicked → stuck at `claim_email_sent`, shows as funnel leak.

**Gift-card funnel:** `/cadeaukaart` `page_view` → `giftcard_checkout` (Mollie payment created) → Mollie redirect → webhook `giftcard_paid` (authoritative) OR `failed/expired`. Edge: paid webhook arrives but `giftcard_checkout` missing (JS blocked) → reconcile from Mollie nightly; revenue still counted (webhook is server-side).

**Newsletter funnel:** `newsletter_signup` → confirm email → `newsletter_confirmed`. Unconfirmed = no marketing consent → funnel leak.

**Nightly cron:** `aggregate(yesterday) → write rollup (UPSERT) → import GSC (today−3, trailing window) → review snapshots → delete events past retention → prune auth tokens/sessions → on error, Resend alert`. Edge: a missed night self-heals on the next run (idempotent UPSERT on the rollup PK) provided it runs within the retention window.

---

## 7. Third-party choices

| Option | EU residency / GDPR | Cookieless / no banner | Fit for this stack | Cost | Verdict |
|---|---|---|---|---|---|
| **Cloudflare Web Analytics** | Yes — CF; confirm aggregation region meets EU-residency; no cookies, no PII | **Yes** (purpose-built cookieless) | **Native** — already on CF Workers, one beacon, zero infra | **Free** | **RECOMMEND (pageviews/CWV)** |
| **First-party Worker + D1 collector** (custom) | Yes — our D1, our retention rules | **Yes** (daily salted hash, no device storage) | **Perfect** — reuses D1; needs the new custom-worker cron | **~€0** *within the 100k-writes/day D1 ceiling* | **RECOMMEND (events/funnels)** |
| Plausible Analytics (EU Cloud, DE) | Yes — EU-hosted, cookieless, GDPR-clean | Yes | Good, but external script + another DPA; goals/events on higher tiers | ~€9–19/mo | Named fallback — adopt if the team wants an off-the-shelf UI over a custom dashboard |
| Umami (self-hosted on Workers+D1) | Yes (we host) | Yes | Possible, but *another app to operate* | Hosting only | **Later** — if the custom collector's UI/volume outgrows itself |
| Matomo (EU cloud / self-host) | Yes | Cookieless mode exists | Heavy (PHP/self-host or paid cloud) | €19+/mo or ops-heavy | Rejected — too heavy for a part-volunteer team |
| Google Analytics 4 | **No** — US transfer, consent banner | No (cookies) | Conflicts with no-banner + EU posture | Free | **Rejected outright** |

**Recommendation:** Cloudflare Web Analytics (pageviews/CWV) + a custom first-party Worker→D1 collector (funnels). Both cookieless, EU-resident, ~free, native — the only combination satisfying *consent-free + EU + €0–25/mo + small team* at once. Plausible (EU) is the priced fallback for a polished UI; Umami self-hosted is the "later" path if event volume/UX outgrows the collector (also the escape hatch if the D1 write ceiling is hit). GSC + Bing Webmaster are non-negotiable, free, additive (search-side, not on-site tracking).

---

## 8. Milestones & sequencing

1. **M1 — Cookieless pageviews + webmaster tools (0.5–1 wk).** CF Web Analytics beacon in `layout.tsx`; GSC + Bing verified via DNS TXT; sitemap submitted; IndexNow key route deployed; `robots.ts` disallow `/api/`, `/beheer`, `/admin`. *Ships inside the launch-hardening epic.* **Deliverable:** live cookieless pageviews + organic-search visibility, no banner.
2. **M2 — Custom-worker cron + collector + schema (1.5–2 wk).** Custom `worker.ts` entrypoint + `triggers.crons` + local `/cdn-cgi/handler/scheduled` test; `0003_analytics.sql`; `POST /api/collect`; daily-salt hash via `getCloudflareContext`; rate-limit; client `track()` lib. **Deliverable:** events flowing into D1, hardened, with a working nightly handler skeleton. *(Larger than the draft's M2 because the cron entrypoint is net-new.)*
3. **M3 — Instrumentation (0.5–1 wk).** `<ActionLink>` wrapping every outbound link in `BusinessDetailClient`; server-side `logServerEvent()` **stubs** wired where the claim/newsletter/Mollie/GBP epics will call them (no-throw, no-op until those epics land). **Deliverable:** full client event taxonomy emitting; server hooks ready.
4. **M4 — Rollup cron body + dashboards (1.5–2 wk).** Implement `runNightlyJobs()` (aggregate UPSERT, GSC trailing-window import, prune, auth-token prune, failure alert); `/admin/analytics` (North-Star, KPI tree, leaderboard, funnels, GSC panel); per-owner stats in `/beheer`; CSV export. **Deliverable:** the answer to "is it working?".
5. **M5 — GEO/AEO + digest + Legal (0.5–1 wk).** `ai_citation_log` + the monthly 20-query panel ritual; AI-bot crawl proxy from server logs; monthly Resend owner digest; **Legal LIA/no-consent memo** + public "Hoe wij meten" privacy section + processor register. **Deliverable:** AEO scoreboard + owner-retention loop + compliance artefact.

---

## 9. Dependencies

- **Production launch + CF hardening** (fix `database_id` in `wrangler.jsonc`, real deploy, wire `d1-next-tag-cache` if desired) — **hard prerequisite**.
- **Custom OpenNext worker entrypoint** for the cron — **net-new, built in M2**, not a pre-existing asset (corrects the draft).
- **Owner-onboarding/claim epic** — emits the claim funnel events (M3 ships stubs so we don't block).
- **Gift-card/Mollie epic** — owns the Mollie webhook this epic hooks for `giftcard_paid`/revenue.
- **Newsletter double-opt-in epic** — emits signup/confirm events.
- **GBP/reviews epic** — supplies review-count snapshots.
- **`d1-next-tag-cache`** (soft) — makes dashboard freshness instant; not blocking (dashboards are `force-dynamic` anyway).
- **Legal ratification of the no-consent posture** — gates shipping without a banner.
- **Decision (Legal + PM):** raw-event retention window (35 days proposed) must be signed off.
- **Confirm** the account's Cloudflare plan supports the WAF rate-limit rule, else implement the in-Worker token-bucket fallback.

## 10. Risks & mitigations

- **No existing cron; OpenNext worker exports only `fetch`.** → Build the custom `worker.ts` wrapper + `triggers.crons` in M2; test via `/cdn-cgi/handler/scheduled`; verify the import wiring against the installed `@opennextjs/cloudflare` version (path is version-sensitive). Budgeted as net-new work (effort raised to 5–8 wk).
- **D1 free-tier 100k row-writes/day exhausted by per-event INSERTs → write errors site-wide.** → Size headroom (§5.6); sample `page_view`; alert at 50k/day; switch to a Cloudflare Queue (free plan) + batch-insert consumer as the documented upgrade path.
- **`request.cf` / `waitUntil` not available the Node way on OpenNext.** → Read `cf` and `ctx` via `getCloudflareContext()`; never reach for Node `process`/Vercel APIs. No Postgres, no Node-only crypto — use Web Crypto `crypto.subtle.digest` for the hash.
- **Regulator/owner forces a cookie banner.** → Legal LIA memo proving genuine cookielessness + daily-salt non-persistence + IP minimisation + short retention + no profiling; the memo states the basis *precisely* (consent-exemption-for-storage + LI for transient hashing), not "zero personal data."
- **Open `/api/collect` abused / inflates metrics / burns D1 writes.** → Rate-limit (WAF or in-Worker), Origin + `Sec-Fetch` validation, body-size cap, enum/schema validation, bot filter, nightly aggregate-then-delete bounds D1.
- **Self-inflation (owners clicking own links).** → de-dupe per visitor-hash×business×action×day; best-effort admin/owner exclusion; headline unique counts.
- **AEO share-of-answer is manual and gets neglected.** → fixed 20-query monthly panel as a calendar ritual + AI-bot crawl rate (server-log proxy) as the automated leading indicator.
- **Revenue mismatch with Mollie.** → Mollie webhook is source of truth; analytics labels revenue "mirrored from Mollie"; nightly *approximate* reconciliation flags drift.
- **GSC import stores empty rows (querying too recent a day).** → import `today−3` on a trailing 3-day UPSERT window.
- **Beacon regresses Core Web Vitals.** → `afterInteractive`, < 2 KB client, no GTM/GA4; verify LCP/INP before/after as an acceptance gate.
- **Cron silently fails → data gap.** → idempotent UPSERT self-heals within the retention window; Resend alert on any step failure.

## 11. Acceptance criteria / Definition of Done

- [ ] Cloudflare Web Analytics live on all public routes; **zero cookies set** (verified in DevTools → Application) and **no consent banner** anywhere.
- [ ] A **custom worker entrypoint** runs a `scheduled` handler; firing `/cdn-cgi/handler/scheduled` locally executes `runNightlyJobs()`; `triggers.crons` is set in `wrangler.jsonc`.
- [ ] `POST /api/collect` validates Origin/`Sec-Fetch` + body-size + enum + schema, bot-filters, is rate-limited, returns `204`, sets no cookie, stores no raw IP; bindings/`cf` read via `getCloudflareContext()`.
- [ ] `visitor_hash` provably rotates daily (salt-rotation test: same synthetic visitor on two UTC days → different hashes).
- [ ] D1 write budget documented; an alert/threshold exists at 50k `analytics_events`/day with the Queue upgrade path written down.
- [ ] Every outbound action link (website, call, menu, order, route, reviews) on business pages emits a typed `action_click` on `pointerdown`; links still work with JS disabled.
- [ ] Server-side events fire for claim, newsletter confirm, gift-card paid (from the Mollie webhook), review snapshot — unspoofable; M3 stubs are no-throw until owning epics wire them.
- [ ] Nightly cron aggregates to `analytics_daily_rollup` (idempotent UPSERT), imports GSC on a trailing window, deletes raw events past 35 days, prunes `auth_tokens`/`sessions`, and sends a Resend alert on failure.
- [ ] `/admin/analytics` shows North-Star + KPI tree + per-business leaderboard + gift-card funnel + owner-onboarding funnel + GSC panel + AEO scoreboard; AA-compliant (no colour-only trends; `--amber-ink` focus ring; `<th scope>`; chart `aria-label` summaries).
- [ ] Owners see **only** their own businesses' stats in `/beheer` (owner-isolation tested with two accounts).
- [ ] GSC + Bing verified; sitemap submitted; IndexNow pings on override approval; `robots.ts` disallows `/api/`, `/beheer`, `/admin`.
- [ ] `ai_citation_log` populated with ≥ 1 monthly panel run; AI-bot crawl events recorded from server logs.
- [ ] Monthly Resend owner digest sends with correct per-owner numbers.
- [ ] **Legal LIA/no-consent memo signed** (with the precise lawful-basis wording); public "Hoe wij meten" section live + footer-linked; processor register updated (Cloudflare, Google, Bing, Mollie, Resend DPAs); DPIA-not-required rationale recorded.
- [ ] Revenue figures reconcile (approximately) with Mollie nightly; dashboard labels them "mirrored from Mollie".
- [ ] CWV (LCP/INP/CLS p75) not regressed by the beacon vs pre-launch baseline.

## 12. KPIs & success metrics

**North-Star:** monthly **outbound action clicks** to businesses (sum of website/call/menu/order/route/reviews) — the moment the guide creates real-world value.

**KPI tree:**
- **Reach** → business-page views/month; unique visitors/month; views per business (long-tail discovery).
- **Quality** → action-click rate (action clicks ÷ page views); route + call clicks (highest intent).
- **Owner adoption** → claim completion rate; # claimed businesses; owners editing monthly.
- **Commerce** → gift-card conversion (paid ÷ `/cadeaukaart` visits); monthly gift-card revenue (mirrored from Mollie).
- **Audience** → newsletter double-opt-in completion rate; confirmed subscribers.
- **Reputation** → net-new Google reviews/month across claimed businesses (count snapshots).
- **Discovery (search)** → GSC impressions/clicks/CTR/avg-position for De Kamp/Amersfoort queries; Bing equivalents.
- **Discovery (AI/AEO)** → share-of-answer (% of the 20-query panel citing the guide, per engine); AI-bot crawl frequency (leading proxy).
- **Health** → CWV p75 (LCP/INP/CLS) — a fast site is a citation prerequisite.

Targets are set at launch + 30 days once a baseline exists (empty-state honest): e.g. month-over-month growth in North-Star, ≥ X% action-click rate, ≥ 1 cited engine in the panel.

## 13. Cost

**One-off:** engineering build (5–8 wk team time — internal, raised for the custom-worker cron); DNS verification, IndexNow key, Legal memo (internal time). **No paid tooling, no setup fees.**

**Monthly at current scale (~67 businesses, modest traffic):**
- Cloudflare Web Analytics: **€0**.
- First-party collector on Workers + D1: **€0** — *provided daily `analytics_events` writes stay under the **100,000 row-writes/day** D1 free ceiling.* Current scale is comfortably under; the 50k/day alert + Queue upgrade path is the guard.
- GSC + GSC API + Bing Webmaster + IndexNow: **€0**.
- Resend monthly digest: within the existing Resend plan (**€0** at this volume).
- GEO share-of-answer panel: ~30 min/month manual, **€0** tooling.

**Total incremental: ~€0/month** at current scale — inside the €0–25 budget. **Scaling note:** if traffic grows past the D1 write ceiling, the first paid step is either the D1 paid plan (usage-based, cents at this scale) or the Queue mitigation (free plan as of 2026-02); Plausible EU (~€9–19/mo) remains the off-the-shelf fallback. Budget is bounded and the upgrade triggers are documented.

# Production Launch & Cloudflare Hardening

> Take the green-built app live on Cloudflare Workers at **ondernemersvandekamp.nl** — EU-resident D1/R2 (true `jurisdiction=eu`), instant cache invalidation, rate-limited auth, nightly backups, full observability, and a repeatable go-live runbook. **Phase 1 (ship first).** **Effort: 3–4.5 weeks.** **Teams:** Backend/Infra (lead), Frontend, SEO/GEO/AEO, Design/UX, Content, Legal, Data/Analytics, QA/Release, PM, Operations.

This is the prerequisite epic. Nothing else on the roadmap — events, gift card, reviews, newsletter, i18n — can launch until the app is live, hardened, and observable. Backend is the owner priority and the bulk of this document.

> **Reviewer note (principal pass):** the original draft was sound on architecture but carried three launch-gate errors that are corrected throughout this final: (1) **Resend is NOT EU-resident** — selecting `eu-west-1` only changes the *sending* region; all account data, email metadata, and logs sit in the **US** under SCCs, so it is a third-country transfer that must be documented, not a residency claim; (2) `--location weur` is only a *hint* — true GDPR data-localization needs **`--jurisdiction eu`** on D1 and R2 (immutable at creation, requires EU-specific endpoints); (3) the OpenNext Worker does **not** ship a `scheduled()` export by default — you must add a **custom worker wrapper** that re-exports `fetch` + `scheduled` and repoint `main`. All three are reflected below.

---

## 1. Goal & value

**The problem.** The application is feature-complete for Phase 0–3 and the build is green, but it has **never been deployed**. `wrangler.jsonc` still carries `database_id: "REPLACE_WITH_D1_DATABASE_ID"`, the tag cache is the dummy no-op (so approved owner edits only appear after a 5-minute ISR window), the magic-link endpoints have no rate limiting, expired `auth_tokens` and `sessions` accumulate forever, there are no backups, and no observability. The district has a polished product that no one can visit.

**The value.**
- **For the district association:** a live, professional presence at their own domain that ranks in Google's local pack and gets cited by AI answer engines — the whole point of the SEO/GEO foundation already built. A site that is up ≥99.9% of the time, can be restored from backup, and won't leak personal data.
- **For owners (B2B):** when they approve an edit or upload a photo, it appears on the public site in seconds, not minutes — making the portal feel responsive and trustworthy. Their login is protected from abuse and their listing data lives in the EU.
- **For visitors (B2C):** a fast (sub-2s LCP), always-on, secure (HTTPS/HSTS) guide to De Kamp, served from Cloudflare's edge with low NL latency.

**Why it matters now.** Every day unlaunched is a day of lost discovery traffic and an unverifiable claim that the product works. Launch converts a repository into a public good for the Amersfoort city centre.

---

## 2. How it works in real life

**Personas:** **Sanne** — owner of *Koffie & Zo*, self-manages via `/beheer`. **Marijke** — volunteer admin/moderator, works in `/admin` + `/admin/instellingen`. **Tom** — a visitor from Utrecht looking for lunch in de Amersfoortse binnenstad. **Jeroen** — the backend engineer running go-live.

**Journey A — Jeroen takes it live.**
1. `npx wrangler login`, then **`npx wrangler d1 create kamp-db --jurisdiction eu`** (NOT `--location weur` — jurisdiction enforces EU storage *and* compute and is immutable; the location hint alone does not). Wrangler prints a `database_id`; he pastes it into `wrangler.jsonc`, replacing the placeholder, and adds `"jurisdiction": "eu"` to the `d1_databases` entry.
2. He creates buckets in EU jurisdiction: **`wrangler r2 bucket create kamp-photos --jurisdiction eu`**, `kamp-next-cache --jurisdiction eu`, `kamp-backups --jurisdiction eu`. He sets `"jurisdiction": "eu"` on each R2 binding in `wrangler.jsonc` (jurisdictional buckets are reached via the EU endpoint and must be declared, or the binding resolves to a different/empty bucket).
3. Applies migrations to the live DB: `npm run db:migrate` (runs `wrangler d1 migrations apply kamp-db --remote`). `0001_init.sql`, `0002_settings.sql`, **`0003_login_throttle.sql`** all land.
4. Secrets: `wrangler secret put AUTH_SECRET` (64-byte random — note: **reserved/unused** by current auth, see 4B.6). `RESEND_API_KEY` + `ADMIN_EMAILS` stay optional (in-app path + first-login bootstrap).
5. Instant invalidation: adds `tagCache: d1NextTagCache` to `open-next.config.ts`, a `NEXT_TAG_CACHE_D1` binding (reusing `kamp-db`) to `wrangler.jsonc`, and the **custom worker wrapper** (4B.4) so cron works. Deploys to preview: `npm run preview:cf`, smoke-tests, then `npm run deploy:cf`.
6. In the dashboard he binds `ondernemersvandekamp.nl` (+ `www`) to the Worker, confirms Universal SSL, enables HSTS, and adds WAF Rate-Limiting rules on `/login` and `/auth/callback`.
7. Runs the go-live smoke test (§11): homepage over HTTPS, JSON-LD validates, he logs in (magic link prints to `wrangler tail` until Resend is set), becomes admin, and verifies an approved override appears on the public page within ~10 seconds.

**Journey B — Marijke configures & moderates.** First login on the empty DB **bootstraps her to admin**. She opens `/admin/instellingen`, sets the Resend key, sender (`hallo@ondernemersvandekamp.nl`), admin email list, and canonical site URL (all in D1, no redeploy). When Sanne submits an edit it lands in the `/admin` queue; on approve, `moderateOverride` runs `revalidatePath('/ondernemers/koffie-en-zo')` and — because the D1 tag cache is now wired — the public page purges + re-renders in seconds.

**Journey C — Sanne updates her café.** Magic-link login (15-min, single-use token; `httpOnly; Secure; SameSite=Lax` opaque UUID cookie, 30-day TTL). She is rate-limited to **5 link requests / 10-min window per email** (in-app) + 5/min/IP (WAF) so she can't be email-bombed. She edits hours + uploads a hero photo (magic-byte sniffed, ≤5 MB) → pending → branded "ter controle ingediend" banner. **Owner isolation:** `canEdit` checks an `owner_business` row; hand-editing the URL to another business id is denied server-side. After approval her hours go live; `dateModified` updates (AEO freshness) and flows into the next sitemap `lastModified`.

**Journey D — Tom discovers the café.** "lunch binnenstad Amersfoort" → LocalBusiness + district JSON-LD and fast CWV surface the page; an AI engine cites the `llms.txt`-fed entity data. Page loads <2s over HTTPS; a transient error yields a branded on-brand error page, never a raw stack trace.

---

## 3. Scope

**In**
- D1 + R2 (photos, ISR cache, backups) created with **`jurisdiction=eu`** (true EU residency); `database_id` fix + preflight guard.
- Secrets: `AUTH_SECRET`, `RESEND_API_KEY`, `ADMIN_EMAILS` + the in-app `/admin/instellingen` path.
- **Instant cache invalidation** via `d1-next-tag-cache` + `NEXT_TAG_CACHE_D1` (vs today's dummy/ISR-300).
- Custom domain + TLS (Universal SSL), `www` → apex 301, HSTS.
- **Rate limiting** on magic-link issuance, auth callback, upload action (WAF + in-app per-email throttle + Turnstile).
- **Cron Trigger** via a custom worker wrapper: nightly D1 export to R2 + pruning of expired `auth_tokens`/`sessions`/`login_throttle`.
- Observability: Workers Analytics + Logpush→R2, `wrangler tail`, external uptime monitor, alerting.
- Security review: session cookies, owner-only-edit isolation, CSP/security headers, `noindex` on portal/admin.
- Branded 404 / 500 / error / global-error pages.
- Performance budget + cache-control headers.
- Staging vs production environments; secret-rotation procedure; restore drill.
- A concrete **go-live runbook** with wrangler commands.
- **Processor/transfer documentation** including the Resend US transfer (SCCs) — a legal launch gate (§Legal).

**Out (other epics)**
- Mollie/iDEAL gift-card payments; events CRUD; GBP/reviews integration; newsletter; NL/EN i18n; owner self-service signup. (Launch only makes the *platform* ready.)

**Later**
- Multi-region/failover beyond Cloudflare's edge; D1 read-replication.
- Full CI/CD on GitHub Actions (Vitest + Playwright + `wrangler deploy`) — minimally scaffolded here, expanded later.
- WAF managed rules / Bot Management upgrades beyond free rate-limit rules.
- Image CDN transform layer (Cloudflare Images) — photos serve directly today.
- Migration off Resend to a true-EU-resident ESP if residency (not just SCC-covered transfer) becomes a hard requirement.

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

Small but launch-critical surface: error states and the UX safety net.

- **Error/404/500 pages (App Router, Next.js 16):**
  - `src/app/not-found.tsx` — branded 404 (Playfair heading, paper bg, "Terug naar De Kamp" → `/`). **Server component, no DB calls** — must render even if D1 is down.
  - `src/app/error.tsx` — `"use client"` segment error boundary with `reset()` retry. No PII in the message; logs to console (captured by Workers logs).
  - `src/app/global-error.tsx` — `"use client"` root fallback that renders its own `<html lang="nl"><body>`, used when the root layout throws.
  - All three **edge-safe**: no `getOverrides()` / `getCurrentUser()` — pure static so they survive a backend outage.
- **`<html lang="nl">`** in `layout.tsx` — zero-cost WCAG + SEO win, ship at launch.
- **Loading states:** `loading.tsx` for `/beheer` and `/admin` (skeleton) so the auth round-trip doesn't flash blank; paper-shimmer skeleton for the `DistrictMap` async-import flash.
- **No client-held trust:** confirm no component derives role/identity from anything but the server (`getCurrentUser`).
- **Turnstile widget on `/login`:** client component wrapping the existing email form; renders the Turnstile script and passes the token into the Server Action. **Progressive enhancement caveat:** the email form may still post without JS, but the Server Action then has no token to verify — so the action must **fail closed** (reject with a friendly "schakel JavaScript in" message) rather than silently issue a link. The WAF managed-challenge is the no-JS backstop. Reserve widget height to protect CLS.
- **Images:** verify post-deploy that `/media/[...key]` carries `Cache-Control: public, max-age=31536000, immutable` (approved) and `private, no-store` (pending) — already implemented in `media.ts`.

**Deliverables:** `not-found.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx` (×2), map skeleton, Turnstile login wrapper (fail-closed), `lang="nl"`.

### Engineering — Backend & Infra (Cloudflare) — PRIMARY

The headline. Ordered by dependency.

**4B.1 — Fix the D1 binding (unblocks everything).**
- `wrangler d1 create kamp-db --jurisdiction eu` → paste the real `database_id` into `wrangler.jsonc` `d1_databases[0].database_id`; add `"jurisdiction": "eu"` there too.
- **Deploy preflight** `scripts/preflight.mjs`, wired as `predeploy:cf`:
  - Fail on any `REPLACE_WITH_` / placeholder in `wrangler.jsonc`.
  - Assert each D1 + R2 binding carries `"jurisdiction": "eu"`.
  - Assert `migrations/` contains `0001`–`0003` and warn if not yet applied (`wrangler d1 migrations list --remote`).
  - Assert `open-next.config.ts` references `d1NextTagCache` and `wrangler.jsonc` has `NEXT_TAG_CACHE_D1`.
  - `"preflight": "node scripts/preflight.mjs"`, `"predeploy:cf": "npm run preflight"`, and add an explicit `deploy:cf` chain so the hook fires (`predeploy:cf` only auto-runs before a script literally named `deploy:cf` — verify in CI as npm lifecycle `pre*` hooks fire for the matching script name).

**4B.2 — EU data residency (CORRECTED).**
- **D1 + R2 created with `--jurisdiction eu`, not `--location weur`.** A location *hint* biases the primary replica but does **not** guarantee storage stays in the EU; **jurisdiction `eu` restricts data to the EU** and is the GDPR-grade control. Jurisdiction is **immutable at creation** — there is no migrate-in-place, so getting it right now avoids a recreate-and-copy. Jurisdictional R2 buckets are addressed via the EU endpoint (`<account>.eu.r2.cloudflarestorage.com`) and may not appear in some dashboard/migration tooling — document this for ops.
- **Worker compute:** Workers run at the nearest edge globally; you cannot pin a Worker to the EU. Residency is therefore enforced at the **data layer** (D1 + R2 in EU jurisdiction). Document the GDPR-relevant statement precisely: *"All personal data at rest is stored in the EU; compute is ephemeral edge execution and persists nothing outside EU-jurisdiction stores."* Sign the **Cloudflare DPA** (dashboard → Legal).
- **Resend (CORRECTED — this is a transfer, not residency):** selecting Resend's `eu-west-1` region only sends mail from Ireland; **Resend account data, email metadata, logs and API records remain in the US**. This is a **third-country transfer of personal data** (the recipient email address + the magic-link URL), lawful only under the **Resend DPA's Standard Contractual Clauses**. Do **not** describe Resend as "EU-resident." Either (a) accept the SCC-covered transfer and record it in the ROPA + sub-processor list with a short Transfer Impact Assessment note, or (b) if the association insists on true residency, switch the magic-link sender to an EU-resident ESP (e.g. an EU-hosted SMTP/transactional provider) — flagged as a *Later* item, not a launch blocker, since SCCs make Resend lawful.

**4B.3 — Instant cache invalidation (headline backend change).**
- **Trade-off:** today `open-next.config.ts` has no `tagCache` → dummy no-op → `revalidatePath()`/`revalidateTag()` in `overrides.ts`, `media.ts`, `gdpr.ts` do nothing; only `export const revalidate = 300` (ISR) provides freshness, i.e. up-to-5-min staleness. For a moderation product where an admin wants to *see* an approved edit, that feels broken.
- **The fix:**
  1. `open-next.config.ts`: `import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache"` and add `tagCache: d1NextTagCache` to `defineCloudflareConfig`.
  2. `wrangler.jsonc`: add a second D1 binding `NEXT_TAG_CACHE_D1` pointing at the **same** `kamp-db` (the adapter creates separate tag tables). Note the binding name is adapter-defined; confirm against the installed `@opennextjs/cloudflare` ^1.19 docs at build time.
  3. `opennextjs-cloudflare build` populates the tag table on deploy.
  - Result: existing `revalidatePath` calls take effect → approved edits/photos/GDPR purges surface in **seconds**.
- **Safety net:** lower per-page `revalidate` from 300 to **3600** (1h) rather than removing it, so even if tag invalidation fails, pages self-heal within an hour. Each revalidate adds a small D1 write — negligible at ~67 businesses, but note it counts toward D1 write quota (Workers Paid headroom).

**4B.4 — Cron Trigger: backups + pruning (CORRECTED — needs a custom worker wrapper).**
- The OpenNext-generated `.open-next/worker.js` exports only `fetch`; it does **not** expose `scheduled()`. The "thin companion Worker if the adapter doesn't expose scheduled" hedge in the draft is unnecessary — wrap it instead:
  ```ts
  // worker.ts (new entry; build still emits .open-next/worker.js)
  import handler from "./.open-next/worker.js";
  // Re-export DO classes ONLY if you adopt DO queue/tag-cache (we use d1NextTagCache, so not needed):
  // export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
  export default {
    fetch: handler.fetch,
    async scheduled(event, env, ctx) {
      ctx.waitUntil(runNightly(env)); // prune + backup, see below
    },
  } satisfies ExportedHandler<CloudflareEnv>;
  ```
  Then set `"main": "worker.ts"` in `wrangler.jsonc` (Wrangler bundles it) and add `"triggers": { "crons": ["0 3 * * *"] }`. Verify the OpenNext build still writes `.open-next/worker.js` before `wrangler deploy` runs (it does — the wrapper imports the built artifact; sequence the build so `.open-next/worker.js` exists at bundle time).
- `runNightly(env)` at 03:00 UTC:
  1. **Prune:** `DELETE FROM auth_tokens WHERE used = 1 OR expires_at < ?;` `DELETE FROM sessions WHERE expires_at < ?;` `DELETE FROM login_throttle WHERE window_start < ?;` (`?` = `Date.now()` minus the relevant window). Keeps these forever-growing tables lean.
  2. **Export:** read each table and write a JSON/NDJSON dump to `kamp-backups` at `backups/${YYYY-MM-DD}.json`. (Also document Cloudflare D1 **Time Travel / point-in-time recovery** — 30-day window on the paid plan — as the primary DR mechanism; the R2 dump is for portability + off-Cloudflare retention.)
  3. **Retention:** delete `kamp-backups` objects older than 90 days.
  - Wrap each step in try/catch and `console.error` a structured line on failure (alerted via Logpush). A single missed nightly run is tolerable (Time Travel covers DR); a 3-day gap pages Operations.
- **Cost:** Cron Triggers are free; the work is trivial at this scale.

**4B.5 — Rate limiting (auth + uploads).**
- **WAF Rate-Limiting rules (dashboard, no code):**
  - `POST /login` → **5 / minute / IP**, action: managed challenge → block.
  - `GET /auth/callback` → **10 / minute / IP** (blunts token enumeration; tokens are 64-hex/unguessable — defence-in-depth).
  - Upload Server-Action POST → **10 / minute / IP**. (Server Actions POST to the page origin with a Next action header; scope the rule by path + method; verify the matched path post-deploy since Server Action routing differs from classic endpoints.)
- **In-app per-email throttle** (survives IP rotation): new `login_throttle` table; `requestMagicLink` increments a per-email counter inside a rolling 10-min window and refuses past **N=5**. Implement as an atomic UPSERT to avoid a read-modify-write race (two concurrent requests both reading count=4). Prevents email-bombing a single address regardless of source IP.
- **Turnstile on `/login`:** verify the token server-side **before** issuing a link via `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` (inline in the Server Action). Turnstile tokens are **single-use and expire after 300s**; pass an `idempotency_key` so an action retry after a network blip doesn't fail with `timeout-or-duplicate`. Turnstile is free and EU-compatible (no Google reCAPTCHA dependency). The secret key is a new secret: `wrangler secret put TURNSTILE_SECRET_KEY`; the site key is public (in the client wrapper).

**4B.6 — Security review (sessions + owner isolation).**
- **Sessions:** confirm cookie is `httpOnly; Secure; SameSite=Lax; Path=/`, opaque 122-bit UUID, server-side expiry check every request via `getCurrentUser`. `AUTH_SECRET` is referenced in `KampEnv` but **not consumed** (sessions are pure D1 lookups, no HMAC). **Decision:** document it as *reserved* and **remove it from the "required secrets" preflight list** so it isn't a false dependency; keep setting it (cheap) for future HMAC. Do not block launch on HMAC — UUID entropy is sufficient.
- **Owner isolation:** audit every `/beheer/[id]` page and Server Action (`submitEdit`, `uploadPhoto`) to confirm `canEdit(profileId, businessId)` is enforced **server-side in the action**, not just gating the page render (a Server Action is independently invocable — a page-level guard is not sufficient). Add an automated test asserting a non-owner is denied both the page and each action. Confirm `/media/[...key]` pending-photo gate checks `canEdit` for the *specific* business encoded in the key (path-traversal/cross-business check).
- **Headers/CSP:** add `Content-Security-Policy` — `default-src 'self'`; `img-src 'self' data:`; `connect-src 'self' https://tiles.openfreemap.org` (MapLibre tiles + style) `https://challenges.cloudflare.com`; `script-src 'self' https://challenges.cloudflare.com` (Turnstile) plus the minimum `'unsafe-inline'`/`'unsafe-eval'` that next/og + Framer actually require (audit and tighten — prefer nonces if feasible); `frame-src https://challenges.cloudflare.com`. Add `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (deny camera/microphone/geolocation — the map uses no geolocation API), and **HSTS** `max-age=63072000; includeSubDomains; preload`. Set via `next.config.ts` `headers()` (works on OpenNext) and/or the Worker wrapper. **Verify** CSP doesn't break MapLibre tiles, the OG image route, or Framer in preview before cutover.
- **Crawlability:** keep `robots.ts` allowing AI crawlers, but add **`X-Robots-Tag: noindex`** on `/beheer/*` and `/admin/*` responses (header in `next.config.ts` or middleware) so the auth-gated portal stays out of every index entirely.

**4B.7 — Caching & performance headers.**
- `_next/static` → immutable 1y (default). `/media` approved → immutable 1y. Public pages → ISR via R2 incremental cache + tag cache. `llms.txt` → 1h (already). `robots.txt`/`sitemap.xml` → modest cache (e.g. 1h).
- Confirm `global_fetch_strictly_public` does not break the Resend `fetch` or the Turnstile `siteverify` fetch (both are public HTTPS — fine; verify in preview).
- **Preload the hero image** (`<link rel="preload" as="image">` for the LCP element) — the single biggest LCP lever.

**4B.8 — Migrations & environments.**
- Migrations stay file-based in `migrations/`, applied via `wrangler d1 migrations apply --remote`. **No manual SQL in prod.** New table ships as `migrations/0003_login_throttle.sql`.
- **Staging:** add `[env.staging]` in `wrangler.jsonc` with its own EU-jurisdiction `kamp-db-staging` D1, `kamp-photos-staging` + `kamp-next-cache-staging` R2, and a `staging.ondernemersvandekamp.nl` route. Deploy `wrangler deploy --env staging`. Staging serves `noindex` (robots + `X-Robots-Tag`) and a distinct `NEXT_PUBLIC_SITE_URL` so its canonicals never compete with prod. (Note: a second full D1+R2 set is within free/paid quotas at this size; document the small extra storage.)

**Deliverables:** updated `wrangler.jsonc` (real id, `jurisdiction:eu` on all stores, tag-cache binding, cron, staging env, repointed `main`), `worker.ts` wrapper with `scheduled()`, `open-next.config.ts` (tag cache), `migrations/0003_login_throttle.sql`, `scripts/preflight.mjs`, CSP/header config, `TURNSTILE_SECRET_KEY` secret, WAF rules, signed Cloudflare DPA + Resend DPA(SCCs).

### SEO / GEO / AEO

Foundation is strong; this epic's job is to **not break it at cutover** and ship the launch-blocking entity fixes.

- **Launch-blocker entity fixes:**
  - Fill `SITE.social.instagram` + `SITE.social.facebook` in `src/lib/site.ts` — otherwise Organization `sameAs` is empty and the entity has no cross-web anchor. If the profiles genuinely don't exist yet, the association must create them pre-launch (even a placeholder Instagram) so the anchor isn't fabricated/dead.
  - Add `dateModified` to `localBusinessSchema()` (from `business.updatedAt`) and a site-level `dateModified` to `districtPlaceSchema()` — the 2026 freshness signal (>83% of AI citations are <12-month-fresh). ~3-line change.
- **Cutover protocol:**
  - Verify the property in **Google Search Console** + **Bing Webmaster Tools** via DNS TXT **before** DNS cutover, so it's live the moment the domain resolves.
  - Submit `sitemap.xml` to GSC + Bing immediately post-launch.
  - Confirm canonicals resolve to the apex `https://ondernemersvandekamp.nl` (not `www`, not `*.workers.dev`); set `www` → apex **301** at Cloudflare. **Block indexing of `*.workers.dev`** (the default Worker route) — disable the workers.dev route or `noindex` it, or it competes with the apex for duplicate content.
  - Run the **Rich Results Test** on home, business detail, category, over-de-kamp, praktisch — all must validate (QA gate, §11).
- **robots/llms/sitemap:** verify `robots.ts` still allows the AI-crawler list on the live domain; confirm `llms.txt` renders from live D1 and `Sitemap:`/`Host:` point at the apex.
- **CWV as ranking + AEO input:** enforce the perf budget. Edge + ISR should give TTFB <200ms from NL; LCP gated on the preloaded hero.
- **No `aggregateRating` regression:** confirm schema still omits self-serving review markup (correct per 2024+ policy). Reviews are a later epic — do not add any review schema here.
- **hreflang:** N/A at launch (NL-only); leave `metadata.alternates.languages` ready but **do not emit an empty/partial hreflang set**.

**Deliverables:** `site.ts` social fix, `dateModified` in `schema.ts`, `*.workers.dev` deindex, GSC/Bing verification, sitemap submission, Rich Results validation report.

### Design / UX

- **404 / 500 / error / global-error / offline screens:** on-brand (paper bg, Playfair heading, "De Kamp leeft." mark, `--amber-ink` link, warm Dutch microcopy). Empty/loading/error variants for `/beheer` + `/admin`. **Figma** with redlines + exact tokens.
- **Turnstile slot** on `/login`: reserve height to protect CLS.
- **Focus-ring fix (a11y launch blocker):** the current `:focus-visible` amber ring is ~3.2:1 on cream — **below** WCAG 2.1 SC 1.4.11 (3:1). Switch to `--amber-ink` or a dual-tone amber+white halo so it passes on both light and dark surfaces. (EAA, in force June 2025, makes AA the legal bar.)
- **HoursTable contrast:** `text-white/40` on charcoal almost certainly fails 4.5:1 for small text — bump to a lighter token or raise opacity; verify with a contrast checker.
- **Map skeleton:** paper-shimmer placeholder for the MapLibre async-load flash.
- **Maintenance/holding page** (optional): static branded page to serve during intentional cutover downtime.

**Deliverables (Figma):** error-state screens, login-with-Turnstile, fixed focus-ring spec, contrast-corrected HoursTable, map skeleton.

### Content / Localization

- **Dutch microcopy:** 404 ("Deze pagina is verdwaald op De Kamp — terug naar huis?"), 500/error ("Er ging iets mis. Probeer het zo nog eens."), maintenance, the Turnstile/anti-spam notice, the rate-limit message ("Je hebt te veel inlogverzoeken gedaan — wacht een paar minuten."), and a no-JS Turnstile fallback line ("Schakel JavaScript in om in te loggen."). Keep the warm informal *je/jij* register.
- **Legal copy:** finalise **Privacy** + **Cookie** policy pages (currently `#` placeholders) — launch-required (§Legal). Must name Cloudflare *and* **Resend (US transfer, SCCs)** as sub-processors. Dutch-first.
- **Alt text:** confirm launch-critical images (hero, OG) have meaningful Dutch alt text (OG is text-rendered — fine).
- **i18n:** N/A at launch (NL-only). New copy lives as hardcoded NL for now, to be extracted when the i18n epic runs.
- **Email/sender copy:** magic-link email body + sender name set in `/admin/instellingen`.

**Deliverables:** error/maintenance copy, privacy + cookie policy text (with Resend US-transfer disclosure), login anti-spam + no-JS + rate-limit messages.

### Legal / Compliance (GDPR) — launch gate

- **Lawful basis:** owner accounts + edits = *contract / legitimate interest* (running the listing they requested); magic-link auth = necessary for the service. Document per processing activity in a **Record of Processing (ROPA)**.
- **Data residency & transfers (CORRECTED):**
  - D1 + R2 in **`jurisdiction=eu`** → personal data at rest is EU-resident. Sign the **Cloudflare DPA**.
  - **Resend is a US processor.** Selecting `eu-west-1` changes only the sending region; account data/logs/metadata stay in the US. This is a **Chapter V transfer** lawful under the **Resend DPA's SCCs**. Record it in the ROPA, list Resend as a sub-processor with location = US (SCCs), and add a one-paragraph **Transfer Impact Assessment** noting the data is minimal (recipient email + login URL, ephemeral). If the association's policy forbids any US transfer, swap to an EU-resident ESP before launch (decision required — see §9).
  - List **Cloudflare (EU jurisdiction)** and **Resend (US, SCCs)** as the two sub-processors.
- **Retention/erasure:** the nightly cron prunes expired tokens/sessions/throttle. Document a **retention schedule**: auth tokens 15 min (hard expiry) + nightly sweep, sessions 30 d, `login_throttle` 10-min window, R2 backups 90 d, D1 Time Travel 30 d, override/media records indefinite as service records. GDPR erase exists (`purgeProfile`/`purgeBusiness`). **Document the backup-erasure window:** an erased subject may persist in dated R2 backups up to 90 days and in D1 Time Travel up to 30 days — standard and defensible; state it in the privacy policy.
- **Cookies:** the only cookie is the strictly-necessary `httpOnly` session cookie → **no consent banner legally required**. Choosing **Cloudflare Web Analytics (cookieless)** keeps it that way. Document this. **Do NOT add GA4** (would require a consent banner + Google DPA + a US-transfer assessment).
- **Accessibility (EAA, in force June 2025):** target WCAG 2.1 AA; the focus-ring + contrast fixes are part of this. Document conformance intent.
- **Out of scope for THIS epic (flag for later epics):** payments/e-money/PSD2 + voucher VAT (gift-card epic), Google Places/GBP API ToS + self-serving-review schema rule (reviews epic), marketing/newsletter consent (newsletter epic). Explicitly N/A at launch (no payments, reviews, or newsletter live; the `mailto:` footer is not marketing automation).
- **Breach:** define the notification path (association DPO/contact, 72-hour GDPR clock) in the runbook.

**Deliverables:** signed Cloudflare DPA + Resend DPA (with SCCs + sub-processor entry US/SCCs), ROPA, retention schedule, live privacy + cookie pages, cookieless-analytics memo, breach-response note, Resend-transfer decision record.

### Data / Analytics

- **Tooling:** **Cloudflare Web Analytics** (cookieless, free, EU-friendly, no consent banner) — avoids GA4's consent + transfer burden.
- **KPIs to track:** pageviews/route, top business pages, referrers, device/geo (NL %); Core Web Vitals field (CrUX via GSC + CF RUM); Worker metrics (requests, 5xx rate, CPU time, sub-request count); auth funnel (server-logged privacy-safe counts — magic-link requests, successful logins, rate-limit/throttle blocks, **no PII**); moderation throughput (overrides submitted vs approved — D1 query, not a tracker).
- **Dashboards:** one Cloudflare view (traffic + CWV + Worker errors) + a saved weekly D1 query for edit/moderation volume.
- **Instrumentation:** structured single-line JSON `console.log` in key Server Actions (login issued, override approved, photo approved, GDPR purge) → **Logpush → R2** for later analysis. **No PII** in logs — hash emails (`SHA-256`) if an identifier is needed.
- **Alerting:** Cloudflare notification on 5xx-rate spike and on Worker error-rate threshold; alert on `scheduled()` failure (parse Logpush for the cron error line).

**Deliverables:** CF Web Analytics enabled, Logpush→R2 (EU bucket) configured, Worker-error + cron-failure alerts, saved weekly moderation query.

### Operations / Owner-relations

- **Runbook ownership:** Operations holds the human runbook (§6/§11) and the rollback decision.
- **Admin onboarding (for Marijke):** how first-login-becomes-admin works; how to set the Resend key in `/admin/instellingen`; how to read a magic link from `wrangler tail` during the pre-Resend window; how to add an owner (manual `owner_business` INSERT until the self-service epic).
- **Moderation SLA:** pending edits/photos reviewed within **2 business days**; weekly queue-check cadence; holiday cover named.
- **Support:** single inbox `hallo@ondernemersvandekamp.nl`; one-page owner FAQ (how to log in, why edits need approval, the ~seconds-to-live timing).
- **Incident comms:** who posts what + where (association channel) if the site goes down.

**Deliverables:** admin onboarding doc, moderation SLA, owner support FAQ, incident-comms note.

---

## 5. Data model & API

**No new business-domain tables.** This epic hardens the existing schema and adds one tiny operational table plus operational jobs.

### New table

```sql
-- migrations/0003_login_throttle.sql
CREATE TABLE IF NOT EXISTS login_throttle (
  email        TEXT PRIMARY KEY,        -- lowercased
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL          -- epoch ms of current 10-min window
);
-- Atomic UPSERT pattern in requestMagicLink (avoids read-modify-write race):
--   INSERT INTO login_throttle (email, count, window_start)
--   VALUES (?, 1, ?)
--   ON CONFLICT(email) DO UPDATE SET
--     count        = CASE WHEN login_throttle.window_start < ? THEN 1 ELSE login_throttle.count + 1 END,
--     window_start = CASE WHEN login_throttle.window_start < ? THEN ?  ELSE login_throttle.window_start END;
-- Then SELECT count and refuse if > 5. Pruned nightly by the cron.
```

### Existing tables — operational changes only
- `auth_tokens`, `sessions`: now **pruned nightly** (no schema change). `DELETE FROM auth_tokens WHERE used = 1 OR expires_at < ?;` and `DELETE FROM sessions WHERE expires_at < ?;`.
- `profiles`, `owner_business`, `business_overrides`, `business_media`, `app_settings` — unchanged.

### Tag-cache tables
- Created and managed by `@opennextjs/cloudflare`'s `d1-next-tag-cache` override in `kamp-db` (via `NEXT_TAG_CACHE_D1`). Do not hand-edit.

### R2 key conventions
- `kamp-photos` (EU jurisdiction): `business/{businessId}/{uuid}-{hex4}.{ext}` (existing).
- `kamp-next-cache` (EU jurisdiction): ISR output (adapter-managed).
- **New** `kamp-backups` (EU jurisdiction): `backups/{YYYY-MM-DD}.json` (nightly D1 dump, 90-day retention).

### Route handlers (METHOD /path → request/response)

| Method/Path | Request | Response | Notes |
|---|---|---|---|
| `POST /login` (Server Action) | `{ email, turnstileToken }` | redirect + flash | **NEW logic:** verify Turnstile (siteverify, idempotency_key), atomic `login_throttle` UPSERT + refuse > 5/10-min, then existing `requestMagicLink`. WAF 5/min/IP. **Fails closed** if token missing. |
| `GET /auth/callback?token=X` | query token | redirect `/admin`\|`/beheer` | unchanged; WAF 10/min/IP. |
| `GET /logout` | session cookie | redirect `/` | unchanged. |
| `GET /media/[...key]` | key | image bytes / 404 | unchanged; pending gated by `canEdit` for the *specific* business in key. |
| Server Actions (`submitEdit`, `uploadPhoto`, `approve`, `reject`, `approvePhoto`, `rejectPhoto`, `purgeBusinessData`, `saveSettingsAction`) | as today | as today | unchanged shape; `uploadPhoto` WAF 10/min/IP; **each action re-checks `canEdit`/`requireAdmin` server-side**; approvals now fire **real** `revalidatePath`. |

> No separate `POST /auth/verify-turnstile` route is created — siteverify is called **inline** in the `/login` Server Action (one fewer open endpoint to rate-limit).

### Scheduled job
- **Cron `0 3 * * *`** → custom `worker.ts` `scheduled()`:
  1. Prune `auth_tokens` (used or expired), `sessions` (expired), `login_throttle` (stale window).
  2. Export all tables → `kamp-backups/backups/{date}.json`.
  3. Delete `kamp-backups` objects > 90 days old.
  Each step try/catch + structured error log.

### Third-party API calls
- **Resend** `POST https://api.resend.com/emails` — magic-link send (existing; US processor, SCCs). No inbound webhooks at launch.
- **Cloudflare Turnstile** `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` — token validation (single-use, 300s TTL, `idempotency_key` on retry). **NEW.**
- No other external APIs (payments/reviews/newsletter are later epics).

---

## 6. User flows & state machine

**Magic-link auth (hardened):**
```
[idle] --POST /login (email + turnstileToken)-->
  WAF >5/min/IP?                 -> [blocked by WAF] (challenge/429)
  turnstileToken missing?        -> [rejected] ("schakel JavaScript in") (fail closed)
  siteverify invalid/expired?    -> [rejected: challenge] (retry; token single-use, 300s)
  login_throttle > 5 this window?-> [throttled] ("wacht een paar minuten")
  else -> INSERT auth_tokens (15-min, used=0)
       -> Resend send (or console.log if no key) -> [link_sent]
[link_sent] --GET /auth/callback?token-->
  token missing/expired/used?    -> [invalid] (back to /login)
  WAF >10/min/IP?                 -> [blocked]
  else -> mark used=1 -> ensureProfile (bootstrap admin if 0 admins)
       -> INSERT sessions (30d) -> set cookie -> [authenticated] -> /admin|/beheer
[authenticated] --GET /logout--> DELETE session -> clear cookie -> [idle]
[authenticated] --session expired (checked per request)--> [idle]
```

**Override → live (instant tag cache):**
```
owner submitEdit (canEdit re-checked in action) -> [pending]
admin approve -> moderateOverride('approved') -> revalidatePath() FIRES (tag cache live)
  tag-cache write OK?    -> public page purged + re-rendered in seconds -> [live]
  tag-cache write FAILS? -> ISR revalidate=3600 backstops -> [live within 1h] (self-heal)
admin reject -> [rejected] (reason stored)
```

**Edge cases & failure handling:**
- **D1 unreachable at runtime:** `getOverrides()` is catch-wrapped → public site serves seed-only (degraded but up). `getCurrentUser()` returns null → portal redirects to `/login`. Error pages render (no DB dependency).
- **Resend down / no key:** magic link prints to Worker logs; admin retrieves it via `wrangler tail`. Login not blocked.
- **Turnstile service down:** siteverify fetch fails → action returns a friendly retry, does **not** issue a link (fail closed). WAF challenge remains as a coarse backstop.
- **`login_throttle` race:** atomic UPSERT prevents two concurrent requests both passing at count 4→5.
- **Tag-cache write error:** ISR window backstops freshness; log + alert if revalidate failures spike.
- **Cron failure:** alert on `scheduled()` exception; one missed backup tolerable (Time Travel covers 30 d); a 3-day gap pages Operations.
- **Cutover DNS:** keep low TTL; if the live site errors, repoint DNS or `wrangler rollback` the Worker.
- **Owner edits another business:** `canEdit` denies in the action (not just the page) → 403/redirect; logged as a security event.
- **`*.workers.dev` indexed:** route disabled/`noindex` so it can't compete with the apex.

---

## 7. Third-party choices

| Need | Options | EU residency / GDPR | Cost | Recommendation |
|---|---|---|---|---|
| **Hosting/runtime** | Cloudflare Workers (incumbent), Vercel, Netlify | CF: data EU via D1/R2 **jurisdiction=eu**; DPA available; compute is ephemeral edge | $0 free / **$5/mo Workers Paid** | **Cloudflare Workers** — already built on it; D1/R2/Cron/WAF native, EU data, cheapest. |
| **Database** | Cloudflare D1 (incumbent), Turso, Neon | D1 **jurisdiction=eu** + Time Travel 30 d | included | **D1** — bound already; no migration. Create with `--jurisdiction eu`. |
| **Object storage** | R2 (incumbent), S3-EU | R2 **jurisdiction=eu**; egress-free; EU endpoint | ~$0 at this size | **R2** — incumbent, egress-free, EU jurisdiction. |
| **Transactional email** | Resend (incumbent), Postmark, Brevo (EU/FR), Scaleway TEM (FR), MailChannels | **Resend = US data + SCCs (NOT EU-resident)**; Brevo/Scaleway are EU-resident | Resend free 3k/mo → $20/mo | **Resend** for launch (already wired; lawful via SCCs, minimal data). **If true EU residency is mandated, switch to Brevo (FR) or Scaleway TEM (FR).** Decision in §9. |
| **Bot/abuse defence** | Cloudflare Turnstile + WAF Rate Limiting (incumbent), reCAPTCHA | CF native, no Google transfer | free | **Turnstile + WAF** — no extra vendor, GDPR-clean. |
| **Analytics** | Cloudflare Web Analytics (cookieless), Plausible (EU), GA4 | CF cookieless = no banner; Plausible EU-hosted; GA4 needs consent + transfer | free / Plausible ~$9/mo / GA4 free | **Cloudflare Web Analytics** — free, cookieless, no banner, EU. Plausible later if richer reports wanted. |
| **Uptime monitoring** | UptimeRobot, Better Stack, Cloudflare health checks | external pingers (EU regions available) | free tier | **UptimeRobot free** (5-min) or **Better Stack free** — external eyes beyond CF's own metrics. |
| **Logs retention** | Cloudflare Logpush → R2 (incumbent), Datadog, Axiom | Logpush to **EU-jurisdiction R2** keeps logs EU | ~$0 (R2) | **Logpush → R2 (EU)** — EU, cheap, no new vendor. |

**Net new monthly vendor cost: ~$5 (Workers Paid) + $0–20 (Resend if volume grows).** Within the lean €0–25/mo budget. (Brevo/Scaleway TEM, if chosen for residency, also have free/low tiers — no budget impact.)

---

## 8. Milestones & sequencing

1. **M1 — Resources & secrets (EU jurisdiction)** — *~2–3 days.* Create D1/R2 with `--jurisdiction eu`, paste `database_id`, apply migrations `--remote`, set `AUTH_SECRET` + `TURNSTILE_SECRET_KEY`, document the in-app secret path, sign Cloudflare + Resend DPAs, record the Resend US-transfer decision. **Deliverable:** app reachable on `*.workers.dev` reading live EU D1.
2. **M2 — Instant invalidation** — *~2 days.* `d1-next-tag-cache` + `NEXT_TAG_CACHE_D1`, lower `revalidate` to 3600, verify approve→live in seconds on preview. **Deliverable:** demonstrated instant edit.
3. **M3 — Hardening** — *~5–6 days.* WAF rate-limit rules; Turnstile (siteverify + idempotency, fail-closed) + atomic `login_throttle` (migration 0003); **custom `worker.ts` wrapper + `scheduled()` backup+prune cron** (the riskiest item — buffer included); CSP/HSTS/security headers + portal `noindex`; branded 404/500/error/global-error; focus-ring + contrast a11y fixes; owner-isolation action audit + test. **Deliverable:** hardened, abuse-resistant, self-pruning Worker.
4. **M4 — Domain + TLS + observability** — *~2–3 days.* Bind apex + `www` 301, Universal SSL, HSTS preload, deindex `*.workers.dev`, Cloudflare Web Analytics, Logpush→R2(EU), UptimeRobot, error-rate + cron-failure alerts, `wrangler tail` runbook. **Deliverable:** monitored production domain.
5. **M5 — Staging sign-off → cutover** — *~3–4 days.* Stand up `[env.staging]` (EU stores, `noindex`); QA gate (Lighthouse/CWV budget, JSON-LD Rich Results, auth+upload+moderation E2E, owner-isolation test, **restore drill**); GSC/Bing verify; fill `SITE.social` + `dateModified`; live privacy/cookie pages; execute go-live runbook; submit sitemap; production smoke test. **Deliverable:** **live at ondernemersvandekamp.nl.**

**Critical path:** M1 → M2 → M3 → M4 → M5 (mostly serial). M3's cron wrapper is the highest-uncertainty task (custom worker entry + build sequencing) — schedule it early in M3. A11y/content/legal deliverables run in parallel from M1.

---

## 9. Dependencies

- **Cloudflare Workers Paid plan** ($5/mo) for headroom on D1 writes (tag cache + throttle), Cron, Time Travel 30-day, and rate-limiting at sustained volume.
- **Registrar/DNS access** to delegate `ondernemersvandekamp.nl` to Cloudflare.
- **Email sender**: a verified sending domain with SPF/DKIM/DMARC DNS records (blocks live magic-link email) — on Resend, **or** on Brevo/Scaleway if the residency decision flips.
- **Content/Legal:** finalised `SITE.social` URLs (real, not dead) + privacy/cookie policy copy naming Cloudflare + Resend(US/SCCs) — both launch-quality blockers.
- **Decision — instant tag cache vs ISR-300:** recommended **instant** before launch (M2).
- **Decision — analytics tool:** recommended **Cloudflare Web Analytics** (no consent banner).
- **Decision — Resend (US/SCCs) vs an EU-resident ESP:** recommended **Resend for launch** (lawful via SCCs, minimal data); flip to Brevo/Scaleway only if the association forbids any US transfer. **Must be recorded before launch** for the ROPA.
- **No dependency on** events/gift-card/reviews/newsletter/i18n epics — launch is their prerequisite.

---

## 10. Risks & mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | `database_id` placeholder or wrong D1 ships → silent seed-only fallback, owner edits invisible. | Med | High | **Preflight** fails build on `REPLACE_WITH_`; go-live smoke test verifies an approved override appears. |
| 2 | Magic-link endpoint email-bombed / token-enumerated. | Med | High | WAF + Turnstile (fail-closed) + atomic per-email `login_throttle`; 122-bit token/session entropy. |
| 3 | **GDPR transfer: Resend US data treated as "EU-resident" → undocumented Chapter V transfer.** | **Med** | **High** | Correctly classify Resend as US/SCCs; record in ROPA + sub-processor list + TIA; OR switch to EU ESP. **Do not claim residency.** |
| 4 | **D1/R2 created with `--location` (hint) not `--jurisdiction eu` → data not actually EU-locked, immutable mistake.** | **Med** | **High** | Use `--jurisdiction eu` at creation; preflight asserts `"jurisdiction":"eu"` on every binding; recreate-and-copy if wrong (cheap at this size). |
| 5 | **Cron `scheduled()` doesn't fire — OpenNext worker has no scheduled export.** | **Med** | **Med** | Custom `worker.ts` wrapper re-exporting `fetch`+`scheduled`; repoint `main`; verify build emits `.open-next/worker.js` before bundle; staging cron test. |
| 6 | Tag-cache misconfig → stale/poisoned pages. | Med | Med | Official override only; ISR=3600 safety net; staging timed approve→refresh test. |
| 7 | Cutover regresses CWV or breaks JSON-LD. | Med | High | QA gate (Lighthouse + Rich Results); canary on `*.workers.dev`; low DNS TTL for fast rollback; deindex workers.dev. |
| 8 | Tokens/sessions accumulate, bloating D1. | High (if unfixed) | Med | Nightly cron prune; this epic fixes it. |
| 9 | No backups → unrecoverable data loss. | Low | High | Nightly R2 export + D1 Time Travel (30 d); **one restore drill pre-launch**. |
| 10 | CSP breaks MapLibre tiles / OG image / Framer / Turnstile. | Med | Med | Build CSP allowlisting OpenFreeMap + challenges.cloudflare.com; verify in preview before cutover; tighten `unsafe-*` iteratively. |
| 11 | Server Action invoked directly bypasses page-level guard → cross-owner edit. | Med | High | Re-check `canEdit`/`requireAdmin` **inside every action**; automated owner-isolation test. |
| 12 | Resend sending domain unverified at launch → no login emails. | Med | High | Verify SPF/DKIM/DMARC in M1; `wrangler tail` fallback for the first admin. |
| 13 | `*.workers.dev` indexed → duplicate-content split. | Med | Med | Disable/`noindex` the workers.dev route at cutover. |

---

## 11. Acceptance criteria / Definition of Done

**Infra & data**
- [ ] `wrangler.jsonc` has a real `database_id`; preflight blocks any placeholder.
- [ ] D1 `kamp-db` and R2 `kamp-photos` / `kamp-next-cache` / `kamp-backups` all created with **`jurisdiction=eu`**; bindings declare `"jurisdiction":"eu"`; preflight asserts it.
- [ ] Migrations `0001`–`0003` applied `--remote`; verified via `wrangler d1 execute`.
- [ ] `AUTH_SECRET` (reserved) + `TURNSTILE_SECRET_KEY` set; Resend key + admin emails settable in `/admin/instellingen` (verified live).
- [ ] Cloudflare DPA + Resend DPA **signed**; ROPA + retention schedule + **Resend US-transfer (SCCs) record** documented.

**Cache & performance**
- [ ] `d1-next-tag-cache` wired; an approved override appears on the public page in **< 10s**.
- [ ] Per-page `revalidate` lowered to 3600 safety net.
- [ ] CWV budget on home + business detail: **LCP < 2.0s, INP < 200ms, CLS < 0.1** (lab + field).
- [ ] Hero image preloaded; static + `/media` immutable cache headers verified.

**Security**
- [ ] WAF rate limits live on `/login` (5/min), `/auth/callback` (10/min), upload action (10/min).
- [ ] Turnstile on `/login` with server-side siteverify (single-use, idempotency_key); action **fails closed** without a token; `login_throttle` enforced per email via atomic UPSERT.
- [ ] Owner-isolation test: a non-owner is denied `/beheer/[id]` **and** each Server Action (server-side, not just page render).
- [ ] Session cookie `httpOnly; Secure; SameSite=Lax`; CSP, HSTS (preload), nosniff, referrer-policy, permissions-policy all present and verified not to break MapLibre/OG/Turnstile.
- [ ] `/beheer` + `/admin` return `X-Robots-Tag: noindex`.

**Domain, observability, ops**
- [ ] `ondernemersvandekamp.nl` + `www` → apex 301; Universal SSL active; HSTS verified; `*.workers.dev` deindexed/disabled.
- [ ] Cloudflare Web Analytics live; Logpush→R2(EU) configured; UptimeRobot + 5xx-rate alert + cron-failure alert active.
- [ ] `wrangler tail` runbook + go-live runbook + rollback procedure documented and rehearsed.
- [ ] **Custom `worker.ts` `scheduled()` deploys and fires**: one prune + one backup observed in staging/prod; **one restore drill** completed from an R2 dump.
- [ ] Staging env (`[env.staging]`) live, `noindex`, separate EU D1/R2.

**SEO/content/legal**
- [ ] `SITE.social.instagram` + `.facebook` filled with **real** profiles; Organization `sameAs` non-empty.
- [ ] `dateModified` emitted on LocalBusiness + district schema.
- [ ] Rich Results Test passes on home, business detail, category, over-de-kamp, praktisch.
- [ ] GSC + Bing verified; sitemap submitted; canonical = apex HTTPS.
- [ ] `<html lang="nl">` set; focus ring ≥ 3:1; HoursTable text ≥ 4.5:1.
- [ ] Privacy + cookie policy pages live (footer links no longer `#`), naming Cloudflare + Resend(US/SCCs) sub-processors.
- [ ] Branded 404 / 500 / error / global-error pages render with D1 down.

**Go-live smoke test (production, immediately after cutover)**
- [ ] Home, a business page, category, sitemap.xml, robots.txt, llms.txt all 200 over HTTPS.
- [ ] Log in → first account becomes admin → set Resend in `/admin/instellingen`.
- [ ] Submit an edit as owner → approve as admin → see it live in < 10s.
- [ ] Upload a photo → approve → served via `/media` → pending photo 404s for anon.
- [ ] Trigger a 404 + a thrown error → branded pages render.

---

## 12. KPIs & success metrics

- **Uptime ≥ 99.9%** (30-day rolling, external monitor).
- **CWV (field, p75):** LCP < 2.0s, INP < 200ms, CLS < 0.1 on home + business detail.
- **TTFB p75 < 200ms** from NL (Workers edge).
- **Edit-to-live latency < 10s** (instant tag cache) vs 300s baseline.
- **Zero data-residency incidents:** D1/R2 in `jurisdiction=eu`; 100% processors under signed DPAs; the one US transfer (Resend) documented under SCCs.
- **Auth abuse:** 0 successful token-enumeration; WAF + throttle blocks tracked; effective < 5 link requests / email / 10-min.
- **Backups:** 100% nightly success; ≥ 1 verified restore drill pre-launch.
- **SEO health post-launch:** 100% public routes pass Rich Results; sitemap indexed in GSC within 2 weeks; AI-crawler hits (GPTBot/PerplexityBot/ClaudeBot) observed in logs; no `*.workers.dev` URLs indexed.
- **Error rate:** 5xx < 0.1% of requests.

---

## 13. Cost

**One-off (engineering time):** ~3–4.5 person-weeks (mostly Backend/Infra, with Frontend/Design/Content/Legal/QA in parallel). The bump over the draft's 2.5–4 reflects the custom-worker cron wrapper, CSP verification, and the owner-isolation action audit. No one-off vendor fees.

**Monthly at this scale (~67 businesses, modest traffic):**

| Item | Cost |
|---|---|
| Cloudflare Workers Paid (D1 writes, Cron, Time Travel, rate-limit headroom) | **$5/mo** |
| D1 (within paid limits at this volume) | included |
| R2 (photos + ISR cache + backups, egress-free, EU jurisdiction) | ~$0 (a few GB) |
| Cloudflare Web Analytics, Turnstile, WAF rate-limit rules, Logpush→R2 | $0 |
| Resend (free 3k/mo; magic links are low-volume) — or Brevo/Scaleway free tier | $0 (→ $20/mo only if volume grows) |
| UptimeRobot / Better Stack (free tier) | $0 |
| Domain `ondernemersvandekamp.nl` | ~€10/yr (~€1/mo) |
| **Total** | **~$5–6/mo (~€5–6)**, well under the €25/mo ceiling |

Headroom: if traffic or moderation volume pushes D1 writes high, the next step is staying within Workers Paid included quotas — no architectural change.

---

**Bottom line:** fix the `database_id`, put D1/R2 in EU **jurisdiction** (not just a location hint), wire the D1 tag cache for instant edits, add a **custom worker wrapper** so the nightly backup+prune cron actually fires, rate-limit + fail-closed-Turnstile the auth, re-check ownership inside every Server Action, bolt on observability + CSP/HSTS, fill the two SEO entity gaps, ship branded error pages, **document the Resend US transfer under SCCs (it is not EU-resident)**, and execute the runbook. That converts a green build into a hardened, EU-compliant, fast, observable production site — and unblocks every other epic on the roadmap.

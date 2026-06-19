# mem.md — working memory for "Ondernemers van de Kamp"

> Cross-machine handoff notes. Commit + push this so you can `git pull` and pick up
> instantly on any machine. **Last updated: 2026-06-19.**

## What this project is
A SEO/GEO-rich local guide to every business on **De Kamp**, the independent shopping &
hospitality district in the historic centre of **Amersfoort (NL)**. ~67 verified businesses
with structured data, an interactive SVG district map, live "open nu" status, and a
self-service owner/admin portal with moderation.

- **Repo:** https://github.com/Jezza5153/kamp  (branch: `main`)
- **Local path (this machine):** `/Users/jeremyarrascaeta/kmap site/kamp`
- **Target domain:** ondernemersvandekamp.nl
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · Framer Motion · lucide-react
- **Hosting:** Cloudflare Workers via OpenNext adapter · **D1** (SQLite) · **R2** (photos + ISR cache)
- **Auth:** magic-link (email), server-side sessions in D1
- ⚠️ This is **Next.js 16** — APIs differ from older Next. See `AGENTS.md`; read
  `node_modules/next/dist/docs/` before writing route/server code.

## Where we left off (status)
Backend is **built through Phase 3 + in-app settings**. Working tree clean, `main` == `origin/main`.
Recent commits (newest first):
- `a6f2bd5` In-app settings box — configure Resend / admin emails / site URL at `/admin/instellingen`
- `989fa5f` Phase 3: GDPR erase — purge a business's submitted data (photos + overrides + links)
- `4861c03` Phase 2: owner photo uploads to R2 + moderation
- `b97d513` Phase 1 backend: magic-link auth + owner portal + admin moderation on D1
- `b33d3d1` Cloudflare infra: OpenNext + Wrangler + D1 schema + R2 + deploy docs
- `de1434b` Phase 0: data-access seam (`src/lib/businessData.ts`)

**Branches:** work on `main`. The two other remote branches
(`ux-ui-upgrade`, `roadmap-cadeaukaart-agenda`) are **stale** — they hold no commits ahead of
`main` (main is 18 / 16 commits ahead). Ignore unless you deliberately want that old snapshot.

## Resume on a new machine (do this first)
```bash
git clone https://github.com/Jezza5153/kamp
cd kamp
npm install

# Plain Next.js dev (no D1/R2 — overrides return {} so you see the static seed):
npm run dev                      # http://localhost:3000
```
For the **full Cloudflare path** (auth, owner portal, admin, photos):
```bash
cp .dev.vars.example .dev.vars   # then fill in AUTH_SECRET (any long random string)
npm run db:migrate:local         # apply migrations to local D1 (.wrangler/state)
npm run preview:cf               # OpenNext build + local Worker w/ D1 + R2
```
**Not in git (recreate per machine):** `.dev.vars`, `node_modules`, `.wrangler/`, `.open-next/`.

## Per-machine config you must supply
- **`.dev.vars`** — `AUTH_SECRET` (required), `RESEND_API_KEY` (optional — without it magic
  links print to Worker logs), `ADMIN_EMAILS`.
- **`wrangler.jsonc`** — `d1_databases[0].database_id` is still the placeholder
  `REPLACE_WITH_D1_DATABASE_ID`. For remote deploy you must `wrangler d1 create kamp-db` and
  paste the real id. (Local dev with `--local` doesn't need it.)
- First account to log in on an **empty DB becomes admin** automatically — no ADMIN_EMAILS needed to bootstrap.

## Architecture map
```
src/
  app/                routes: / · /kaart · /categorie/[slug] · /ondernemers/[id]
                      /loop-de-kamp · /over-de-kamp · /praktisch · /agenda · /cadeaukaart
                      /aanmelden (owner request) · /login · /logout · /auth/callback
                      /beheer (owner dashboard) · /beheer/[id] (+ PhotoUpload)
                      /admin · /admin/instellingen · /media/[...key] (gated R2 serving)
                      llms.txt · opengraph-image · sitemap · robots
  components/         Navbar, Hero, BusinessExplorer (map+filter+grid), DistrictMap,
                      BusinessCard, BusinessDetailClient, OpenBadge, HoursTable, JsonLd, …
  data/businesses.ts  THE SEED dataset (Business type + ~67 records) — permanent fallback
  data/events.ts      agenda data
  lib/
    businessData.ts   ← data seam: merges seed + APPROVED D1 overrides (read via async getters)
    cf.ts             Cloudflare bindings access (getDB, R2, env)
    auth.ts           magic-link + sessions
    settings.ts       app_settings (Resend/admin/site URL) read from D1
    overrides.ts      pending/approved override writes + revalidate
    media.ts          R2 photo upload/serve
    gdpr.ts           purge a business's submitted data
    hours.ts geo.ts schema.ts placeholder.ts related.ts categories.ts site.ts
migrations/           0001_init.sql (auth/overrides/media/sessions) · 0002_settings.sql
research/             provenance JSON (discovery/enrichment/strategy/audit) from 2026-06-14
```
**Data rule:** server code reads businesses via `businessData.ts` async getters
(`getBusinesses`, `getActiveBusinesses`, `getBusiness`). `businesses.ts` stays the build-time
seed + permanent fallback. Approved owner edits in D1 are merged on read; if D1 is empty/absent,
getters fall back to the seed (build stays hermetic — overrides skipped during production build).

## How the owner flow works
`/aanmelden` (owner requests access) → admin invites in `/admin` (links email → business_id) →
owner magic-link login → `/beheer` dashboard edits text/hours/contact/socials/price/tags +
uploads photos → submit writes a **pending** override/media row (live value untouched) → admin
approves a field-by-field diff in `/admin` → override flips to approved, photo promoted to public,
page regenerates. Public pages set `revalidate = 300` (ISR ~5 min) since the OpenNext tag cache
is the default "dummy" (so `revalidatePath` is a no-op in prod — see DEPLOY_CLOUDFLARE.md to wire
the D1 tag cache for instant invalidation).

## Deploy
```bash
npx wrangler login
npx wrangler d1 create kamp-db          # paste id into wrangler.jsonc
npm run db:migrate                       # remote D1
npx wrangler r2 bucket create kamp-photos
npx wrangler r2 bucket create kamp-next-cache
npx wrangler secret put AUTH_SECRET      # + optionally RESEND_API_KEY, ADMIN_EMAILS
npm run deploy:cf
```
Then point `ondernemersvandekamp.nl` at the Worker (Cloudflare dashboard) and set EU region for GDPR.
Resend key / admin emails / site URL can also be set in-app at `/admin/instellingen` (stored in D1, no redeploy).

## Roadmap (BUILT 2026-06-19 — full multi-team plan in repo)
A backend-first, SEO/GEO/AEO + Google-reviews roadmap was generated as a docs suite:
- **[BACKEND_MASTER_PLAN.md](BACKEND_MASTER_PLAN.md) — START HERE.** Full D1 schema evolution
  (migrations 0003→0012), route-handler inventory, integrations (Mollie/Resend/Google/DeepL),
  cron jobs, security/isolation, tag-cache wiring, and a 10-step dependency-ordered build sequence.
- **[ROADMAP.md](ROADMAP.md)** — master program plan: phases, milestone calendar, mermaid
  dependency map, RACI, sequencing rationale, index to everything.
- **docs/roadmap/operating-framework.md** — team charters, risk register, KPIs/OKRs, budget, governance.
- **docs/roadmap/epics/** (11): launch, cadeaukaart, google-reviews, agenda, owner-story,
  newsletter, bilingual, design-system, analytics, owner-ops, discovery.
- **docs/roadmap/playbooks/** (7): eng-standards, seo-geo, **aeo**, design, content, legal, qa-release.

**Build order = backend first.** Phase 0 = launch/infra (deploy at all — D1 id, buckets, secrets,
tag cache, cron wrapper, rate limiting, CI, backups, security), then owner-ops → reviews → events
→ newsletter → stories → cadeaukaart → i18n → discovery → analytics. Cadeaukaart is gated on a
fintech-lawyer + accountant sign-off (PSD2/voucher-VAT) — start that legal track immediately.

**Reviews are 2026-compliant:** GBP API (owner OAuth) + place_id only; no review-text caching;
NO self-serving AggregateRating schema; SEO weight goes to GBP/local-pack + review acquisition.

## Build progress — Step 1 backend foundation (started 2026-06-19, in code)
Local, verifiable slice of the launch epic is DONE and green (`npm test` 11/11, `npm run build` ok):
- `migrations/0003_launch.sql` — `rate_limit` table.
- `src/lib/rateLimit.ts` — sliding-window limiter (fail-open); wired into `requestMagicLink` (5/15min per email).
- `src/lib/maintenance.ts` — nightly prune logic (`runMaintenance`), ready for cron.
- `open-next.config.ts` + `wrangler.jsonc` — `d1NextTagCache` + `NEXT_TAG_CACHE_D1` binding (instant invalidation; paste real D1 id in BOTH).
- `scripts/preflight.mjs` — `deploy:cf` aborts on `REPLACE_WITH_` placeholder / missing binding.
- Vitest + `.github/workflows/ci.yml` (test+build hard gates; lint non-blocking). Tests incl. owner-isolation security regression.

**Deferred (needs a `*:cf` build to verify):** the cron `scheduled()` worker wrapper (`src/worker.ts`)
+ `triggers.crons` — see DEPLOY_CLOUDFLARE.md "Backend Step 1". **Pre-existing lint debt** (5 Next-16
errors in OpenBadge/BusinessExplorer/DistrictMap/HoursTable/agenda) tracked separately — not mine.

## Build progress — Step 2 owner-ops leads/invites (done 2026-06-19, green: 19/19 tests, build ok)
The keystone that finally gives `owner_business` a UI writer (claim-time ownership):
- `migrations/0004_owner_ops.sql` — `leads`, `owner_invites`, `moderation_log` (+ owner_business index).
- `src/lib/invites.ts` — `inviteOwner` (admin links email→business, atomic batch) + `claimInvitesForEmail`
  (binds owner_business ONLY when that exact email logs in — security boundary, unit-tested).
- `src/lib/leads.ts` — lead funnel (create/confirm/list/setStatus) + pure `validateLead`.
- `src/lib/audit.ts` (moderation_log), `src/lib/email.ts` (Resend sender, fail-soft).
- `auth.ts` `completeLogin` now calls `claimInvitesForEmail` after `ensureProfile`.
- Admin actions: `inviteOwnerAction` / `approveLeadAction` / `rejectLeadAction` in `admin/actions.ts`.
- Public funnel: `/aanmelden` form now posts to `submitLeadAction` (honeypot + rate-limit + double-opt-in
  email) instead of mailto; `/api/aanmelden/confirm` confirms. `/aanmelden` is now dynamic (reads searchParams).
- Tests: `invites.test.ts` (no-hijack email match), `leads.test.ts` (validation).

**Still TODO for owner-ops:** admin UI to render the leads queue + an "invite owner" button (the server
actions exist; wire them into `/admin`).

## Build progress — Step 3 Google reviews (buildable slice) + adversarial review (done 2026-06-19)
ToS-compliant slice (place_id only, never review text; OAuth/display deferred until GBP API approval):
- `migrations/0005_google.sql` — `business_google` (place_id + numeric aggregates), `review_requests`, `oauth_states`.
- `src/lib/reviews.ts` — `setPlaceId`, review-request funnel, `writeReviewUrl` deep-link, `resolveReviewRequest`.
- `src/app/r/[token]/route.ts` — counter-QR scan → Google "write a review" redirect. `setPlaceIdAction` in admin.

**Adversarial review (workflow, 5 dims × verify) found 12 issues; fixed 9** (build/tests/lint all green, 23 tests):
- GDPR Art.17 (2 high): `purgeBusiness`/`purgeProfile` now erase `leads`/`owner_invites`/`business_google`/`review_requests` (business- and email-scoped).
- Admin invites no longer dropped by the shared login throttle (`requestMagicLink(email,{skipThrottle})`).
- `confirmLead` made idempotent (email link-scanners); `setLeadStatus` won't clobber `converted`; `inviteOwner` verifies the business exists; `moderation_log.detail` stores the invite token, not the email (minimisation); maintenance prunes stale unconfirmed leads + expired invites; `confirm_token` indexed.
- Skipped #8 (duplicate audit row under near-unreachable concurrent double-claim).

## Review DISPLAY via Places API (no approval needed — added 2026-06-19)
Key insight: review **display** uses the **Places API** (just a Maps API key, instant) — only owner **replies**
need the GBP API (OAuth + multi-week approval). So display was pulled forward:
- `src/lib/places.ts` — Places API (New) `GET /v1/places/{id}` (X-Goog-FieldMask), `parsePlaceDetails` (≤5 reviews, tested).
- `src/app/api/reviews/[businessId]/route.ts` — `force-dynamic` + `private, no-store` (ToS: never cache review content).
- `src/components/GoogleReviews.tsx` — client-fetched (keeps reviews out of ISR cache), attribution + Maps link, **no AggregateRating schema** (self-serving). Wired into `/ondernemers/[id]`.
- **Fully in-app, no CLI:** set the Maps key in **/admin/instellingen** (Google reviews section) and paste each shop's
  **place_id** in **/admin/google** (lists all businesses; uses `setPlaceIdAction` + `listBusinessGoogle`). Then reviews show.
- **Decision (2026-06-19): display only.** Owners reply to reviews on their own Google profiles — we do NOT build the
  GBP owner-reply feature. The `oauth_*`/cached columns in `business_google` stay unused.
- **Refinements:** swap the text attribution for the official Google logo asset (strict ToS); restrict the Maps key to Places API; cost = 1 API call per detail-page view that has a place_id.

**Still needs GBP API approval (apply ASAP — multi-week):** owner review REPLIES + reading ALL reviews from
`/beheer` (OAuth connect/callback + encrypted token storage).

## Build progress — Step 4 events / agenda (done 2026-06-19, green: 33 tests, build+lint)
D1 events that merge with the curated seed (`src/data/events.ts`), same `KampEvent` shape + Event JSON-LD:
- `migrations/0006_events.sql` — `events` table (status pending|approved|rejected, optional business_id).
- `src/lib/events.ts` — `getAgendaEvents` (seed + approved D1, seed wins on id), `createEvent`/`moderateEvent`/`deleteEvent`/`listEvents`, build-guarded `getApprovedEvents`, pure `validateEvent` (rejects non-http(s) URLs = no javascript: XSS, impossible/`end<start` dates, bad category).
- `/agenda` now async + `revalidate=300` (prerenders from seed, merges D1 via ISR). `/admin/agenda` = add events + approve/reject/delete (all `requireAdmin`). Linked from `/admin/instellingen`.
- `gdpr.ts` `purgeBusiness` also deletes business-linked events.
- Adversarial review (1 agent, 7 areas): no security/authz defects; only fix taken was the date-validity hardening.
- **Deferred:** owner self-submission of events from `/beheer` (backend supports `pending` status already); recurring-event RRULE expansion.

## Build progress — Step 5 newsletter (done 2026-06-19, green: 38 tests)
Self-hosted on Resend + D1 (no ESP vendor), GDPR double-opt-in:
- `migrations/0007_newsletter.sql` — `newsletter_subscribers` + `subscriber_events` (consent audit, FK cascade).
- `src/lib/newsletter.ts` — `subscribe` (anti-enumeration, never resurrects bounced), `confirmSubscriber` (idempotent), `unsubscribe`, `listSubscribers`, `subscriberCounts`, pure `validateEmail`.
- Routes: `/api/newsletter/subscribe` (POST, honeypot+rate-limit+confirm email), `/confirm`, `/unsubscribe` (GET + RFC-8058 POST).
- `NewsletterSignup.tsx` (footer + `/nieuwsbrief` page), `/admin/nieuwsbrief` (counts + confirmed list).
- GDPR: `purgeProfile` deletes subscribers by email; maintenance prunes unconfirmed >30d. Email sends fail-soft until Resend is configured.
- **Deferred:** campaign/digest SENDING (issues + per-recipient delivery ledger + batching) — collect-only for now.

## Build progress — Step 6 owner-story / verhalen (done 2026-06-19, green: 46 tests)
D1-backed editorial, admin-authored, plain-text paragraphs (XSS-safe, no markdown lib):
- `migrations/0008_stories.sql` — `stories` + `story_business` (FK cascade).
- `src/lib/stories.ts` — `createStory`/`setStoryStatus`/`deleteStory`/`getPublishedStories`/`getStory`/`listStories`, pure `slugify` + `validateStory` (rejects non-http(s)/non-path hero = no javascript: XSS).
- `/verhalen` (ISR index), `/verhalen/[slug]` (Article JSON-LD + linked businesses), `/admin/verhalen` (create/publish/depublish/delete). Footer + admin nav updated.
- `purgeBusiness` unlinks `story_business`. Build-guarded getters.
- **Deferred:** owner photo-upload for story heroes (uses a URL field for now), rich text.

Next backend steps: Step 7 cadeaukaart ledger (`0009`, Mollie stubbed — legally blocked), then 8 i18n, 9 discovery, 10 analytics, then cron worker + FULL AUDIT + flowcharts.

NOTE: pre-existing Next-16 lint errors were fixed (new `src/lib/useNow.ts` hook + 4 components); CI now hard-gates lint.

## Gotchas / reminders
- Owner photos/portraits only publish with permission — `imageCandidateUrl` is stored but never shown until confirmed.
- 4 businesses verified closed/moved are intentionally excluded (BKK Thai, Ritos, Binnenspecialist v.d. Berg, Picture @ Home).
- Content/UI is **Dutch**. Keep new copy NL (bilingual is a roadmap item, not yet done).
- Don't commit `.dev.vars` or real secrets.

## Quick command reference
| Task | Command |
|---|---|
| Install | `npm install` |
| Dev (plain Next) | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Local Worker (D1+R2) | `npm run preview:cf` |
| Migrate local D1 | `npm run db:migrate:local` |
| Migrate remote D1 | `npm run db:migrate` |
| Deploy | `npm run deploy:cf` |

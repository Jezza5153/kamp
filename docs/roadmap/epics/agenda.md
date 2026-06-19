# Agenda / Events — De Kamp District Events Calendar

> A backend-first district events calendar for De Kamp, Amersfoort: D1-backed, owner-submitted + admin-curated, one-off **and** recurring (RRULE) events, powering `/agenda` + `/agenda/[slug]`, Event JSON-LD rich results, add-to-calendar (`.ics`) + share, homepage surfacing, and high-freshness AEO "wat is er te doen in Amersfoort" answers.
> **Recommended phase:** Phase 5 (post-launch; reuses the existing override/moderation + magic-link patterns). **Effort:** 4–6 weeks (revised up from the draft's 3–5: the recurrence engine, the **separate cron Worker** OpenNext forces on us, and the net-new test harness are all underestimated). **Teams:** Frontend, Backend/Infra (Cloudflare), SEO/GEO/AEO, Design/UX, Content/Localization, Legal/Compliance, Data/Analytics, QA/Release, Product/PM, Owner-relations/Operations.

> **Principal-reviewer note (read first).** This finalized version corrects four material errors in the draft that would have caused wasted work or a broken build:
> 1. **The cron job cannot be a `scheduled()` export bolted onto the app Worker.** OpenNext generates `.open-next/worker.js` on every build and it exports only `{ fetch }`; the file is overwritten and cannot be hand-edited. The cron runs as a **separate dedicated Cloudflare Worker** bound to the same D1/R2 (primary recommendation), or via a thin wrapper entry that re-exports OpenNext's `fetch` and adds `scheduled` (alternative). See §4-Backend-7 and §7.
> 2. **`canEdit` takes two arguments** — `canEdit(user: SessionUser, businessId: string)` — not `canEdit(businessId)`. Every server action must pass the resolved session user. Verified in `src/lib/auth.ts:208`.
> 3. **`revalidateTag('events')` is a no-op in production today** because `open-next.config.ts` has no `tagCache` override (verified). The d1-next-tag-cache override + `NEXT_TAG_CACHE_D1` binding is a **hard prerequisite** for "updates within seconds," not a nice-to-have. Without it the honest behaviour is the 5-minute ISR window — say so to owners.
> 4. **There is no test runner installed** (no Vitest/Jest in `package.json`, verified). The DST/recurrence unit tests in M2 require standing up Vitest first; that setup cost is folded into the estimate, and it is a shared deliverable (the codebase has zero tests today).

---

## 1. Goal & value

**The problem.** Today `/agenda` is a static page reading `src/data/events.ts` (~8 hand-curated entries; verified — `src/app/agenda/page.tsx` imports the array directly and emits `Event` JSON-LD only for entries with a concrete `startDate`). It cannot accept owner-submitted events, has no detail pages, no recurrence engine, no add-to-calendar, no homepage surfacing, and the submit CTA is a **`mailto:` link** (verified) — there is no server-side record of submissions. The static file goes stale the moment a date passes — and stale is the worst possible state for an events page, both for human trust and for AEO (freshness is the dominant AI-citation signal: >83% of AI citations are pages updated within 12 months).

**Why it matters to the district.** "Wat is er te doen op De Kamp / in de binnenstad van Amersfoort" is one of the highest-intent local discovery queries. A living agenda is the single biggest **freshness engine** the site can have: koopzondagen, weekmarkten (warenmarkt op de Hof, bloemenmarkt), festivals, seasonal moments (Sinterklaasintocht, kerstsfeer) and per-shop happenings (een proeverij bij een wijnzaak, een signing, een opening). Each dated event is a new, time-bound, schema-rich URL that AI answer engines and Google's Events enhancement love to cite.

**Why it matters to owners (B2B).** An owner-submittable event is a *reason to log into `/beheer`* and a free promotional channel. It deepens the owner relationship beyond a one-time listing edit and gives the district association a content pipeline that doesn't depend on a volunteer editing a TypeScript file by hand.

**Why it matters to visitors (B2C).** Visitors get a plannable, filterable, add-to-calendar-able guide to the district, cross-linked to the businesses behind each event — turning "I'm going to that market" into "…and I'll visit these three shops while I'm there."

**The value, in one line:** an agenda turns a static directory into a *living* district that ranks, gets cited by AI, and gives owners a reason to come back.

---

## 2. How it works in real life

**Personas**
- **Sanne** — 34-year-old Amersfoorter, plans her Saturday on her phone.
- **Marco** — owner of a wine/delicatessen shop on De Kamp (single-business owner, already linked in `owner_business`).
- **Hester** — the district-association admin/moderator who curates the agenda and approves submissions.

**Journey A — Sanne discovers and plans (visitor).**
1. Sanne googles "wat te doen Amersfoort binnenstad dit weekend." Google shows an AI Overview that cites the De Kamp agenda, plus a rich Event result for a dated festival.
2. She taps through to `/agenda`. The page opens on **"Deze week"** with a date filter (Vandaag / Dit weekend / Deze maand / Alles) and category chips (De Kamp · Markt · Koopzondag · Festival · Cultuur · Seizoen).
3. She filters to **Dit weekend** and sees the warenmarkt, the koopzondag, and Marco's *Wijnproeverij: Italiaanse oogst* on Saturday.
4. She taps Marco's event → `/agenda/wijnproeverij-italiaanse-oogst`. The detail page shows date/time, location (mini district map), description, a **"Zet in agenda"** (`.ics`) button, a **share** button, and a prominent link **"Bij … op De Kamp"** to Marco's business detail page.
5. She taps "Zet in agenda" → downloads an `.ics` → it lands in her phone's calendar with the right time (correctly resolved for Europe/Amsterdam DST). She shares it via the native share sheet (or copy-link fallback).
6. Saturday she visits the proeverij and the two neighbouring shops the event page linked.

**Journey B — Marco submits an event (owner).**
1. Marco logs into `/beheer` via magic link. On his business card he sees a new **"Evenement toevoegen"** action.
2. He fills a short form: title, category, date + start/end time, optional "elke laatste vrijdag van de maand" recurrence preset, description, optional external URL (his webshop ticket page), optional photo.
3. He submits. A server action (`requireUser()` → `canEdit(user, businessId)`) validates (title/description length, https-only URL, start≤end, date not >18 months out, plain-text only, RRULE parseable) and writes an `events` row `status='pending'` plus (if he uploaded one) a pending image to R2 under `event/{id}/…`. He sees an inline **"Ingediend ter controle"** banner — identical language to the existing edit-moderation flow.
4. Hester gets a Resend email: "Nieuw evenement ter controle: Wijnproeverij — …".
5. Marco's event does **not** appear publicly yet (pending gate). His own `/beheer` shows it under "In behandeling."

**Journey C — Hester moderates and curates (admin).**
1. Hester opens `/admin`. A new **"Evenementen"** queue lists pending submissions with the same diff/approve/reject affordances as edits and photos.
2. She reviews Marco's event, fixes a typo inline if needed, and clicks **Goedkeuren**.
3. On approval: the event flips to `status='approved'`; **occurrences are materialised** (one-off → one row; recurring → expanded for a rolling 12-month window) by the approval action; the event image (if any) becomes public; `revalidateTag('events')` fires (only effective once the d1-next-tag-cache override is live; otherwise the 5-minute ISR window applies). Marco gets a Resend "je evenement staat live" email with the public URL.
4. Hester also **curates district-wide events** herself: she adds festival dates and marks the *koopzondag* as a recurring evergreen item (RRULE: every Sunday) with `business_id = NULL` (district-wide; admin-only).
5. The **separate nightly cron Worker** keeps everything fresh: it re-expands recurrences for a rolling window, flips past occurrences/events, and opportunistically prunes expired auth tokens/sessions — so Sanne never sees a dead event and Hester never garbage-collects by hand.

---

## 3. Scope

**In**
- D1 `events` + `event_occurrences` tables; migration `migrations/0003_events.sql` (next free number — `0001_init.sql` and `0002_settings.sql` exist; verified).
- One-off events + recurring events via **RRULE** (stored as string, materialised into concrete occurrence rows). The Worker request path **never** parses RRULE.
- District-wide events (`business_id = NULL`, admin-only) vs single-business events (linked to a seed business id; owner-submittable).
- Two authoring sources: **owner-submitted** via `/beheer` (moderated, reuses override/approval pattern) and **admin-curated** via `/admin`.
- Public `/agenda` listing (date + category + text filter) and `/agenda/[slug]` detail.
- Event JSON-LD (+ `EventSeries` for recurring) moved into `src/lib/schema.ts`; rich-result eligible.
- Add-to-calendar `.ics` route + native share.
- Homepage "Binnenkort op De Kamp" upcoming-events strip.
- A **dedicated Cloudflare cron Worker** (separate from the OpenNext app Worker) for nightly recurrence-expansion + past-event expiry — and, as the first consumer of cron infra, expired auth-token/session pruning.
- Event images reusing the existing `kamp-photos` R2 bucket + `/media/[...key]` serving path.
- `## Evenementen` section in `llms.txt`; sitemap entries per dated event.
- Vitest harness (net-new to the repo) for the recurrence/DST logic and `.ics` generation.

**Out (this epic)**
- Ticketing / payment / RSVP. **No Mollie, no PSD2, no e-money, no voucher/VAT surface** — `offers` links **out** to the owner's own ticketing URL only. (Confirmed correct for legal scope: linking out to a third-party ticket seller creates no payment-services or voucher obligation for the platform.)
- EN/bilingual agenda content (depends on the i18n scaffolding epic — NL ships first; data model is i18n-ready).
- A full calendar-grid month view (start with a chronological list grouped by date).
- Real-time capacity/availability.

**Later**
- EN translations + hreflang once i18n routing exists.
- Month-grid calendar view + "events near me today" map layer on `/kaart`.
- Ticketing via the Cadeaukaart/Mollie integration once that epic is proven.
- ICS feed subscription (`webcal://`) for the whole district agenda.
- Import from an external feed (VVV/Uitagenda Amersfoort, Eventbrite) — its own ToS/GDPR review.

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

> **Reminder per repo `AGENTS.md` (verified):** "This is NOT the Next.js you know." Read `node_modules/next/dist/docs/` before writing route/component code; do not assume older-Next APIs (params are async, `generateMetadata` signatures, route-handler conventions).

**Routes / components**
- **`/agenda` (Server Component, ISR `export const revalidate = 300`, `export const dynamic = 'force-static'` semantics as on existing public pages)** — rebuild the existing page to read from D1 via `src/lib/events.ts` (`getUpcomingOccurrences`) instead of the static array. Server-render the full list (good for SEO/AEO crawl), then hydrate a **client `AgendaExplorer`** for filtering (mirrors `BusinessExplorer`: `useMemo` filter, `aria-pressed` chips, `AnimatePresence`).
  - Filter state (client): `dateRange` (`today | weekend | month | all`), `category` (enum), `query`. No server round-trip — filter over the SSR-hydrated occurrence list.
  - Group occurrences by date with sticky date headers ("Vandaag", "Zaterdag 21 juni", …).
  - **Tagging caveat:** Next.js `revalidateTag` only takes effect once the d1-next-tag-cache override is configured (see Backend §9). Tag the page `events` so it's ready, but the page's contract today is "fresh within 5 min."
- **`/agenda/[slug]` (Server Component, ISR)** — detail page. Reuses `BusinessDetailClient`-style two-column layout: left = description + "Het verhaal achter dit evenement"; right rail = date/time card, location (mini `DistrictMap` when lat/lng present), `.ics` + share buttons, and a strong link to the related business (`/ondernemers/[id]`) when `business_id` is set. **404** (call `notFound()`) on unknown or non-approved slugs. `generateMetadata` reads `getEventBySlug`.
- **`/agenda/[slug]/event.ics` (Route Handler, `export const dynamic = 'force-dynamic'`)** — `GET` returns `text/calendar`; client buttons are plain `<a href=".../event.ics" download>`. Hand-roll the VEVENT (no library at the edge): `DTSTART`/`DTEND` in UTC `Z` form, `SUMMARY`, `DESCRIPTION`, `LOCATION`, `URL`, `UID`, `DTSTAMP`. Fold lines at 75 octets per RFC 5545; escape `,` `;` `\n`. For a specific recurring date the `.ics` carries that single occurrence's UTC instants (not an RRULE) so the user's calendar shows the right local time without re-deriving DST.
- **Homepage strip** — a `UpcomingEventsStrip` **Server Component** rendered on `/` (re-uses home ISR). Renders 3–4 next occurrences as compact cards; falls back to evergreen recurring items when no dated events. Link "Bekijk de hele agenda →". No client fetch.
- **`/beheer` event submission** — extend the owner portal. New `EventForm` **client** component (controlled inputs, recurrence toggle revealing a simple `RecurrencePicker`: "Eenmalig / Elke week / Elke maand" presets that map to RRULE strings, plus an "Aangepast" escape hatch). Reuse the existing `PhotoUpload` client component for the optional image. Submits to the `submitEvent` server action (returns query-param status like the existing photo flow: `?event=pending|invalid|too_large`).
- **`/admin` event queue** — extend the admin page with an "Evenementen" section listing pending events with approve/reject forms (server actions). Show the proposed event rendered as it will appear publicly (preview), plus reject-with-reason. **No new design-system orphan:** apply the same branded `Alert`/Playfair uplift the portal needs (don't replicate the raw CMS look).

**Components to build:** `AgendaExplorer` (client), `EventCard`, `EventDateBadge`, `AddToCalendarButton` (client, just renders the `<a download>`), `ShareButton` (client, `navigator.share` with copy-link fallback + reduced-motion-safe toast), `UpcomingEventsStrip` (RSC), `EventForm` (client), `RecurrencePicker` (client). Reuse: `OpenBadge`-style status chips, `DistrictMap`, `JsonLd`, `BusinessImage`, design tokens.

**Images:** event images served via existing `/media/[...key]`; use the existing `BusinessImage`/next-image pattern. No new image pipeline.

**State/forms:** all writes via **Server Actions** (matching `submitEdit`/`uploadPhoto`). A read-only `GET /api/events/upcoming` route is **optional** and should be **omitted** unless a future client widget needs it — the homepage strip is pure RSC.

### Engineering — Backend & Infra (Cloudflare) — PRIMARY FOCUS

This epic is deliberately built on the existing, proven seams: the **override/moderation pattern**, the **`businessData.ts` build-guarded read path**, **magic-link auth + `canEdit`**, and the **`/media/[...key]` R2 serving route**. Genuine novelty is concentrated in exactly two places: the **recurrence engine** and the **cron Worker** — and the cron Worker is harder than the draft implied (see §7).

**1. D1 schema (`migrations/0003_events.sql`).** Two tables (full DDL in §5). Key decisions:
- **`events`** holds the canonical event (one row per logical event). `business_id` is **nullable** — `NULL` = district-wide (admin-only); a non-null value references a **seed business id** (no FK, same convention as `business_overrides.business_id` / `business_media.business_id`, verified). `recurrence_rule` is a nullable RRULE string. `status` is `'pending'|'approved'|'rejected'|'past'`. `slug` is `UNIQUE`.
- **`event_occurrences`** holds materialised concrete occurrences, with `start_utc`/`end_utc` as **epoch-ms INTEGER (UTC)** — the table the edge actually queries; never RRULE at request time. `event_id` FK `ON DELETE CASCADE` (matches the `profiles → sessions/owner_business` cascade pattern, verified).
- Indexes: `idx_events_status(status, business_id)` (admin queue + per-business listing), `idx_events_slug(slug)`, `idx_occ_window(start_utc, status)` (upcoming-window scan).
- **Note on D1 cascades:** D1 enforces `ON DELETE CASCADE` only with `PRAGMA foreign_keys = ON`, which D1 applies per-connection. The existing schema already relies on this for `profiles`, so it is known-good here; still, the cron/GDPR delete should **also** delete occurrences explicitly as a belt-and-braces idempotent step (see §7c, §Legal).

**2. Read path (`src/lib/events.ts`)** — **mirror `businessData.ts`/`overrides.ts` exactly:**
- `getUpcomingOccurrences(windowDays = 120)`, `getEventBySlug(slug)`, `getEventOccurrencesForBusiness(businessId)`, `getNextOccurrences(limit)` (homepage strip).
- **Build guard:** every function checks `process.env.NEXT_PHASE === 'phase-production-build'` and returns the static `src/data/events.ts` seed → the build stays hermetic and seed-only, exactly like `getOverrides()` (verified pattern).
- **Catch-wrapped:** any D1 failure falls back to the seed silently — same discipline as the override merge. `getDB()` returns `null` off-Workers, so every accessor must early-return the seed on `null`.
- Queries select `status='approved'` events JOINed to `event_occurrences` where `status='scheduled'` and `start_utc >= now`, ordered `start_utc ASC`. Use the loosely-typed `D1Stmt`/`D1Database` interfaces in `src/lib/cf.ts` (verified — no `@cloudflare/workers-types` dependency in the public build).

**3. Recurrence engine — the hard part, kept off the edge.**
- The `rrule` npm package + a tz library is too heavy and DST-risky to run in a Worker request. **Decision: expand RRULE → concrete occurrences only in Node contexts** — (a) at **admin approval** (`approveEvent`, which runs server-side in the app Worker) and (b) in the **nightly cron Worker**. The edge only ever reads pre-computed rows.
- Materialisation = parse `recurrence_rule`, generate local wall-clock occurrences against `Europe/Amsterdam` for a rolling 12-month window, convert each to **epoch-ms UTC**, and **idempotently upsert** into `event_occurrences` (dedupe on `UNIQUE(event_id, start_utc)` via `INSERT … ON CONFLICT(event_id, start_utc) DO NOTHING`). One-off events get a single occurrence.
- **DST is the make-or-break detail.** `rrule` operates on naive/UTC datetimes and does **not** itself understand IANA zones — you must (i) generate occurrences in floating local time, (ii) convert local→UTC with a zone-aware library (`@date-fns/tz` `TZDate`, or `luxon`, or the built-in `Intl.DateTimeFormat`/`Temporal` if the `nodejs_compat` runtime exposes it — verify before relying on `Temporal`). A "19:00 every Friday" event must stay 19:00 local across both the **last-Sunday-of-March** (skip hour) and **last-Sunday-of-October** (repeated hour) transitions. **Unit-test both boundary weeks explicitly** (M2). This is the #1 correctness risk in the epic.
- **Bundle hygiene:** the `rrule` + tz libs are imported **only** in (a) the app Worker's server action module (approval path) and (b) the cron Worker. They must **never** be imported by any module on the `/agenda` request path, or they bloat the edge bundle. Add an eslint `no-restricted-imports` rule or a build assertion to enforce this.

**4. Server Actions (writes — no new HTTP route for writes).**
- `beheer/actions.ts → submitEvent(businessId: string | null, form: FormData)`:
  - `const user = await requireUser();`
  - if `businessId` set, `if (!(await canEdit(user, businessId))) throw …` — **two-arg `canEdit(user, businessId)`** (verified signature `src/lib/auth.ts:208`). If `businessId` is `NULL` (district-wide), require `user.role === 'admin'`.
  - validate (see §8); `INSERT events` `status='pending'`, `source='owner'`, `submitted_by=user.id`, `slug=` slugified title (collision-suffixed).
  - optional image: reuse `uploadMedia` semantics under key prefix `event/{eventId}/…` (extend `media.ts`, see §5).
- `admin/actions.ts → approveEvent(id)`:
  - `const admin = await requireAdmin();` (verified helper redirects non-admins).
  - `UPDATE events SET status='approved', reviewed_by=admin.id, reviewed_at=…, updated_at=…` (mirrors `moderateOverride`).
  - **materialise occurrences** (Node `rrule` path) inside the action; wrap in try/catch — on parse failure, **do not approve**: roll back to `pending` and surface an admin error (never publish a broken series).
  - if an image was pending, approve it (reuse `approveMedia`).
  - `revalidateTag('events')` (effective only with the tag-cache override; otherwise harmless no-op).
  - Resend "live" mail (reuse `getResendConfig`).
- `admin/actions.ts → rejectEvent(id, reason)`: `requireAdmin()`; `UPDATE status='rejected'` + `reason`; Resend decline mail.
- **Caveat on `approveEvent` materialisation:** approval runs in the OpenNext app Worker, which has `nodejs_compat`. Confirm in a preview deploy that `rrule` + the chosen tz lib actually run there (some tz libs touch `process`/`fs` paths that the Workers runtime rejects). If they don't, move materialisation entirely into the cron Worker and have `approveEvent` only flip status + enqueue a "needs-expansion" flag the cron picks up within ~minutes (acceptable: occurrences appear at the next cron, or trigger the cron Worker via a service binding for immediacy).

**5. R2.** **No new bucket.** Event images live in the existing `kamp-photos` bucket under key prefix `event/{eventId}/{uuid}-{hex4}.{ext}`, with the same magic-byte MIME sniff (JPEG/PNG/WebP/AVIF), 5 MB cap, and immutable cache headers as photos (verified flow in `media.ts`). Extend `mediaByKey()` so an **approved** event image key resolves **public**, and **pending** event images gate on `requireUser` + ownership. **Ownership caveat:** the current photo gate is `getCurrentUser() + canEdit(businessId)`; a **district-wide** event has no `businessId`, so its pending image cannot use `canEdit`. Gate district-wide pending event images on `role === 'admin'` instead. Encode the event id in the key and resolve the owning business (or NULL) to pick the right gate.

**6. Bindings / `wrangler.jsonc`.**
- App Worker: no new bindings strictly required for reads (`DB`, `PHOTOS` exist; verified). For working tag invalidation, add the d1-next-tag-cache override in `open-next.config.ts` + a **second D1 binding `NEXT_TAG_CACHE_D1`** (recommended dependency).
- **Cron Worker (new):** its own minimal `wrangler.jsonc` (or a second `[env.cron]` / second config file) with `"triggers": { "crons": ["15 2 * * *"] }` (02:15 UTC nightly) and bindings to the **same** D1 `kamp-db` and R2 `kamp-photos`. It does **not** use OpenNext and ships a plain `export default { async scheduled(event, env, ctx) { … } }`. See §7.

**7. Cron / scheduled Worker — corrected design.**
> **Why a separate Worker (the draft was wrong here).** OpenNext **generates** `.open-next/worker.js` on every `opennextjs-cloudflare build`, and that file exports only `{ async fetch }` (verified by reading `node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js`). You cannot durably add a `scheduled()` export to it — your edit is overwritten on the next build, and `wrangler.jsonc`'s `main` points at the generated file.
>
> **Two compliant options:**
> - **(A) Dedicated cron Worker (RECOMMENDED).** A separate small Worker project (`workers/cron/`), its own `wrangler.jsonc`, deployed independently, bound to the same `kamp-db` + `kamp-photos`. Clean separation, independent deploy cadence, the rrule/tz deps never touch the app bundle, easiest to reason about and test. Tiny extra ops surface (one more `wrangler deploy` in CI).
> - **(B) Wrapper entry.** Set `main` to a custom `worker.ts` that `import { default as openNextHandler } from '.open-next/worker.js'` and `export default { fetch: openNextHandler.fetch, scheduled }`. Keeps one deploy but couples the cron lifecycle to the app build and risks the rrule deps leaking into the edge bundle. Use only if a second Worker is operationally unacceptable.
>
> Recommendation: **(A)**.

The nightly `scheduled()` handler (idempotent, safe to re-run, logs counts):
- **(a)** For every `status='approved'` event with a `recurrence_rule`, re-expand into `event_occurrences` for the rolling 12-month window (`INSERT … ON CONFLICT DO NOTHING`).
- **(b)** Flip `event_occurrences.status='past'` where `end_utc < now` (or `start_utc < now` for all-day); flip one-off `events.status='past'` when their last occurrence is past. Use `db.batch()` for the bulk updates (the `D1Database` interface in `cf.ts` exposes `batch`, verified).
- **(c)** Explicitly `DELETE FROM event_occurrences WHERE event_id IN (deleted events)` is unnecessary if cascade is on, but the cron also **hard-deletes** `status='past'` events older than the retention window (24 months, see Legal) and their occurrences + R2 images — done explicitly, not relying solely on cascade.
- **(d)** Opportunistically prune expired `auth_tokens` (`expires_at < now OR used=1` older than 24h) and `sessions` (`expires_at < now`) — the first concrete consumer of cron, closing a documented D1-bloat gap for free.
- **(e)** **Tag invalidation from cron:** a Worker `scheduled` handler cannot call Next's `revalidateTag`. If on-demand invalidation is needed after the nightly run, the cron must write to the same `NEXT_TAG_CACHE_D1` table the d1-next-tag-cache override reads (i.e. bump the tag's revalidation timestamp directly), **or** simply rely on the 5-minute ISR window for cron-driven changes (acceptable — cron changes are not time-critical). Document which.

**8. Security & owner-isolation.**
- Submission is **always** `status='pending'`; nothing renders publicly until admin approval — reuse the existing moderation gate (no new trust surface).
- `canEdit(user, businessId)` gates single-business submissions; **district-wide events (`business_id NULL`) are admin-only**.
- **Input validation (server-side, authoritative — client validation is UX only):** title ≤ 120 chars; description ≤ 2000 chars; `url` must start with `https://` (scheme allowlist; reject `javascript:`/`data:`/`http:`); `start_at ≤ end_at`; `start_at` in the future and ≤ 18 months out; `recurrence_rule` parsed/validated server-side (reject malformed); `category` in the fixed enum; `location_lat`/`location_lng` within NL bounding box if present. **Store and render as plain text only** — escape on render, never `dangerouslySetInnerHTML`. This eliminates stored XSS.
- **Rate-limit `submitEvent`:** per-session cap (≤ 10 pending events per owner) checked in the action, **plus** a Cloudflare WAF rate rule on the `/beheer` POST path — consistent with the planned `/login` hardening. (Server Actions POST to the page origin, so the WAF rule targets the `/beheer*` path with method POST.)
- **CSRF:** Next.js Server Actions include built-in origin checks; keep them on (do not disable `serverActions.allowedOrigins` defaults).

**9. Caching.** Public pages stay ISR `revalidate=300`, tagged `events`. **Honest statement of current behaviour:** because `open-next.config.ts` has **no `tagCache`** today (verified), `revalidateTag('events')` is a **no-op in production** and approvals surface within the 5-minute ISR window. To get near-instant updates, add the d1-next-tag-cache override + `NEXT_TAG_CACHE_D1` binding (listed as a dependency, §9-Dependencies). The `.ics` route is `force-dynamic` (tiny). Event images keep the immutable 1-year cache.

**10. Migrations & seed import.** Ship `0003_events.sql` via the existing scripts: `db:migrate` = `wrangler d1 migrations apply kamp-db --remote`, `db:migrate:local` = `… --local` (verified). Provide a one-time **idempotent seed import** of the current ~8 curated entries from `src/data/events.ts` into D1 (`INSERT … ON CONFLICT(slug) DO NOTHING`), run once post-migration; the static file remains the build-time / D1-down fallback. **Note:** the seed type (`KampEvent`) uses `recurring: string` (Dutch prose) and `whenText`, not RRULE — the import script must map curated recurring entries to real RRULE strings (or import them as evergreen with admin follow-up), and map `where` → `location_name`. Don't assume a 1:1 column match.

### SEO / GEO / AEO

- **Move `eventSchema()` out of `agenda/page.tsx` into `src/lib/schema.ts`** and export it (the current inline builder is correct but not reusable — verified it lives inline and gates on `startDate`). Extend with: `organizer` (district association `Organization` `@id` for district-wide events, or the related `LocalBusiness` `@id` for single-business events), `image`, `offers` (link out to the owner's ticket URL when present; include `price`/`availability` **only if known** — never fabricate), `eventStatus`/`eventAttendanceMode` (already present), `location` with full `PostalAddress` + `geo` when lat/lng exist.
- **Add `eventSeriesSchema()`** for evergreen recurring events (koopzondag, warenmarkt): emit an `EventSeries` plus the next N **dated** `Event` sub-events — never a single open-ended date-less Event (Google drops date-less events). Gate strictly on a concrete future `startDate` (keep the existing guard).
- **`dateModified` everywhere** — add `dateModified` to each event node and to the `/agenda` page-level schema (reflecting last occurrence refresh / approval, from `events.updated_at`). The nightly cron refresh keeps this signal warm automatically — directly serving the 2026 freshness guideline.
- **No `aggregateRating`/`review` on event nodes** — out of scope here (events aren't reviewed on-site), and consistent with the site's correct avoidance of self-serving review markup.
- **Metadata / OG:** `/agenda/[slug]` gets per-event `generateMetadata` (title, description = the answer-first 40–60 word summary, canonical, OG). Dynamic per-event OG image is a later enhancement; site-level OG is the launch fallback.
- **`sitemap.ts`:** add one URL per **approved dated event** (`/agenda/[slug]`), `lastModified = events.updated_at`, `changeFrequency` `daily` near the event date else `weekly`, `priority` ~0.7. Recurring evergreen events get a single stable URL. (Sitemap reads D1 at request time like the existing per-business entries — verified pattern.)
- **`llms.txt`:** inject a `## Evenementen` section listing the next ~10 upcoming occurrences (title · date · location · URL) — directly closes the documented gap. Generated from the same `getNextOccurrences()` read path; keep the existing `force-static` + 1h cache.
- **`robots.ts`:** no change — agenda routes are already crawlable and the AI-crawler allowlist (GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended, ClaudeBot, …) already covers them (verified).
- **AEO answer-chunks:** every event detail leads with a **40–60 word direct answer** ("De Wijnproeverij Italiaanse oogst is op zaterdag 21 juni 2026 van 15:00–18:00 bij … op De Kamp, Amersfoort. Gratis toegang, geen reservering nodig."). Add a small per-event FAQ block ("Moet ik reserveren?", "Is het gratis?", "Waar is het precies?") with `FAQPage` markup whose Q&A **exactly matches** visible text (2024+ FAQ policy).
- **Internal linking:** event ↔ related business ↔ category page ↔ `/agenda`; `/loop-de-kamp` and `/kaart` link to upcoming events; homepage strip links in. Tight topical cluster around "evenementen / wat te doen De Kamp Amersfoort."
- **hreflang:** none at launch (NL-only). The data model is i18n-ready so the later EN epic adds `alternates.languages` without rework.
- **CWV:** SSR the list (no client-fetch waterfall), lazy-load the mini-map on detail, keep event images responsive via the existing pipeline — preserves the strong CWV posture.

### Design / UX

**Screens:** (1) `/agenda` list with sticky date headers + filter bar (date range + category chips + search), (2) `/agenda/[slug]` detail, (3) homepage "Binnenkort" strip, (4) `/beheer` event form + list, (5) `/admin` event moderation queue.

**States for every screen (mandatory):**
- **Empty:** `/agenda` with no dated events → show evergreen recurring items + a secondary "agenda wordt gevuld" message (never a blank page — reuse the existing dashed-border empty treatment). `/beheer` → "Nog geen evenementen — voeg je eerste toe."
- **Loading:** homepage strip + mini-map get skeletons (closes the documented "no loading/skeleton states" gap and the map content-flash).
- **Error:** submission validation errors inline on the field; server failure → friendly retry copy.
- **Success:** "Ingediend ter controle" (owner) / "Evenement staat live" (post-approval) — reuse a branded `Alert` (Playfair heading, deep-green/amber tokens), **not** the raw CMS look the portal currently has.

**Components:** `EventCard`, `EventDateBadge`, filter chips (reuse `BusinessExplorer` chip styling), `AddToCalendarButton`, `ShareButton`, `RecurrencePicker`. Tokenise alongside the broader design-system work (type scale + spacing tokens) so the agenda doesn't add more ad-hoc Tailwind values.

**Responsive:** single-column list on mobile with sticky date headers; detail collapses the right rail below the body. **Motion:** reuse the `AnimatePresence` filter pattern; honour `prefers-reduced-motion` (and add the JS-layer guard for Framer noted in the design audit). **WCAG AA:** date filter chips get `aria-pressed`; `.ics`/share are real `<button>`/`<a>` with visible labels; category colour chips carry **icon + text** (never colour-only); **fix the focus-ring contrast** on these new controls — use `--amber-ink`/white, not `--amber` (the documented ~3.2:1 focus-ring failure).

**Deliverables:** Figma frames for the 5 screens (all states) + a redlined spec for `EventCard`/detail in the design-system file; copy deck handed to Content.

### Content / Localization

- **Copy needed:** `/agenda` intro + filter labels; per-category microcopy; event-detail FAQ templates; `/beheer` form labels + helper text; submission confirmation/decline email bodies; homepage strip heading ("Binnenkort op De Kamp"); empty-state copy.
- **Dutch tone:** match the established warm, informal, slightly poetic register ("De Kamp leeft."). Event descriptions stay concrete and useful (date, place, what to expect) while on-brand.
- **Owner-submission guidance:** in-form placeholder coaching owners on a good event description (mirror the well-crafted `/aanmelden` story placeholder).
- **EN/bilingual:** keep all UI strings extraction-ready (no deep-buried literals) so the later next-intl migration can lift them; event *content* stays owner-authored NL until the EN epic.
- **Alt text:** event images require descriptive alt (owner-provided field, default "{event title} — De Kamp, Amersfoort").
- **Editorial workflow:** Hester owns district-wide events and final copy edits on owner submissions during moderation.

### Legal / Compliance (GDPR)

- **Lawful basis:** owner-submitted event data is processed on the basis of the owner's **legitimate interest / the listing arrangement** (promoting their own business via the platform). The only personal data is the existing owner-profile linkage (`submitted_by`) — **no new PII category, no new processor.**
- **Event content with people:** if an owner uploads a photo containing identifiable people or names a performer, that is their responsibility — add a short submission notice ("zorg dat je toestemming hebt voor beeld en namen die je plaatst"), mirroring the existing media-upload notice. Document this in the owner terms.
- **Retention & erasure:** past events flip to `status='past'` and drop from public views; the cron hard-deletes `past` events older than **24 months** (define this retention period in the privacy statement) plus their occurrences and R2 images. **GDPR erase MUST be extended in `src/lib/gdpr.ts`:**
  - `purgeBusiness(businessId)` → also delete `events` + (cascade or explicit) `event_occurrences` + event R2 objects (`SELECT image_r2_key FROM events WHERE business_id = ?` then `photos.delete`, mirroring the existing `business_media` delete loop).
  - `purgeProfile(profileId)` → also delete events where `submitted_by = profileId` (and their occurrences/images). **Note (verified):** `purgeProfile` currently selects media by `submitted_by` and relies on the `profiles` cascade for `sessions`/`owner_business` — events have **no** FK to `profiles`, so events submitted by a purged profile must be deleted **explicitly** by `submitted_by`, not via cascade.
  - Both purge functions currently call `revalidatePath` (a **no-op** in prod, verified) — that's fine for correctness (data is gone from D1/R2); the public page reverts on next ISR. Don't claim "instant."
- **Processors/DPAs:** no new processors — Cloudflare (D1/R2/Workers, EU jurisdiction config) and Resend (EU region) already in place with DPAs. The `.ics`/share is fully client-side, no processor.
- **Domain law (explicitly confirmed in scope):** **No payments / PSD2 / e-money / voucher-VAT** surface — `offers` links out to the owner's own ticket seller, which creates no payment-services obligation for the platform. **No Google reviews / Places API** usage in this epic (so the Places API attribution/no-caching/max-5 and self-serving-review-schema rules are N/A here — they belong to the GBP epic). **Marketing consent** N/A for transactional moderation emails (legitimate-interest transactional); if events later feed a newsletter, that's the newsletter epic's double-opt-in. **Accessibility (EU EAA / WCAG AA):** new screens meet the same AA bar — covered in Design/QA.

### Data / Analytics

- **Events to track:** `agenda_view`, `agenda_filter_apply {dateRange, category}`, `event_detail_view {slug}`, `event_ics_download {slug}`, `event_share {slug, method}`, `event_related_business_click {slug, businessId}`, `homepage_upcoming_click`, `event_submit {scope: business|district}`, `event_submit_validation_error {field}`, `event_approved`/`event_rejected` (admin-side, server-logged).
- **Analytics tool must be EU/GDPR-compliant** (the stack is EU-residency-mandated). Recommend a cookieless, EU-hosted product analytics (e.g. Plausible EU or Cloudflare Web Analytics — no consent banner needed if cookieless). Do **not** add GA4 (US transfer + consent burden) without a DPA/consent flow.
- **KPIs:** upcoming-event count always ≥ 6 (incl. evergreen); % approved dated events indexed in GSC within 7 days; Event rich-result impressions (GSC Events enhancement report); monthly manual AI-citation audit for "wat te doen Amersfoort"; owner submission rate + approval rate; moderation latency; `.ics`/share engagement; agenda→business cross-click rate.
- **Instrumentation:** client events via the chosen privacy-first analytics; server-side counters (submissions/approvals/cron-row-counts) logged from server actions + cron (Cloudflare `observability` is already enabled in `wrangler.jsonc`, verified); weekly automated "zero past events visible publicly" check.

### Operations / Owner-relations

- **Human workflow:** Hester curates district-wide evergreen + festival events quarterly; owners self-submit single-business events year-round; moderation reuses the `/admin` queue.
- **Onboarding:** add an "Evenement toevoegen" tip to owner onboarding emails and the `/beheer` first-run; a short how-to in owner help content.
- **Moderation SLA:** target **< 48h** submit→decision; Resend notification on every submission keeps the queue visible.
- **Cron observability runbook:** how to confirm last night's cron ran (Cloudflare dashboard → the cron Worker → Cron Events / logs), how to manually trigger it (`wrangler` scheduled invocation), and the "stale agenda" recovery path (re-run cron; 12-month buffer means a missed night is not user-visible).
- **Support runbook:** "my event isn't showing" (pending vs approved vs past), "the date is wrong" (DST/timezone), "remove my event" (admin delete → cascades occurrences + image).

---

## 5. Data model & API

**D1 DDL — `migrations/0003_events.sql`:**

```sql
CREATE TABLE IF NOT EXISTS events (
  id              TEXT PRIMARY KEY,          -- crypto.randomUUID()
  business_id     TEXT,                      -- NULL = district-wide (admin-only); else seed business id (no FK, matches existing convention)
  slug            TEXT NOT NULL UNIQUE,      -- public URL: /agenda/{slug}
  title           TEXT NOT NULL,             -- plain text, <= 120 chars
  description     TEXT NOT NULL,             -- plain text only (no HTML), <= 2000 chars
  category        TEXT NOT NULL,             -- 'De Kamp'|'Markt'|'Koopzondag'|'Festival'|'Cultuur'|'Seizoen'
  location_name   TEXT NOT NULL,
  location_lat    REAL,                      -- nullable; enables geo + mini-map
  location_lng    REAL,
  url             TEXT,                      -- external info/ticket URL (https only); offers links out here
  image_r2_key    TEXT,                      -- key in kamp-photos bucket: event/{id}/...
  organizer       TEXT,                      -- free text; district-wide events default to the association
  recurrence_rule TEXT,                      -- RRULE string (RFC 5545); NULL for one-off
  source          TEXT NOT NULL,             -- 'owner'|'admin'|'seed'
  status          TEXT NOT NULL,             -- 'pending'|'approved'|'rejected'|'past'
  submitted_by    TEXT,                      -- profile id or 'system'
  submitted_at    INTEGER NOT NULL,          -- epoch ms
  reviewed_by     TEXT,
  reviewed_at     INTEGER,
  reason          TEXT,                      -- rejection reason, nullable
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL           -- drives dateModified + sitemap lastModified
);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status, business_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

CREATE TABLE IF NOT EXISTS event_occurrences (
  id         TEXT PRIMARY KEY,               -- crypto.randomUUID()
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  start_utc  INTEGER NOT NULL,               -- epoch ms (UTC), computed from local wall-clock against Europe/Amsterdam
  end_utc    INTEGER,                        -- epoch ms (UTC), nullable
  all_day    INTEGER NOT NULL DEFAULT 0,     -- 0/1
  status     TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled'|'cancelled'|'past'
  UNIQUE(event_id, start_utc)                -- idempotent re-expansion (ON CONFLICT DO NOTHING)
);
CREATE INDEX IF NOT EXISTS idx_occ_window ON event_occurrences(start_utc, status);
```

> **Cascade reminder:** D1 honours `ON DELETE CASCADE` with foreign-keys enabled per-connection (the existing `profiles` cascade relies on this). Still, GDPR-erase and the retention-cron delete occurrences **explicitly** as well, so correctness never depends on the pragma being set on a given connection.

**R2 key convention:** `event/{eventId}/{uuid}-{hex4}.{ext}` in the existing `kamp-photos` bucket; `Cache-Control: public, max-age=31536000, immutable`; served via `GET /media/[...key]` (approved → public; pending single-business → `requireUser` + `canEdit(user, businessId)`; pending district-wide → `role==='admin'`).

**Route handlers / actions:**
- `GET /agenda` → page (RSC, ISR, tag `events`). Reads `getUpcomingOccurrences()`.
- `GET /agenda/[slug]` → page (RSC, ISR, tag `events`). Reads `getEventBySlug()`. `notFound()` on unknown/non-approved.
- `GET /agenda/[slug]/event.ics` (`force-dynamic`) → `200 text/calendar` VEVENT (`DTSTART`/`DTEND` UTC `Z`, `SUMMARY`, `DESCRIPTION`, `LOCATION`, `URL`, `UID`, `DTSTAMP`; RFC-5545 line-folding + escaping). `404` if event missing/past.
- `GET /api/events/upcoming` *(OPTIONAL — omit unless a client widget needs it)* → `200 application/json { occurrences: [...] }`.
- **Server action** `submitEvent(businessId: string | null, FormData)` → `requireUser()`; ownership/admin check; validate; `INSERT events status='pending'`; returns redirect `?event=pending|invalid|too_large`.
- **Server action** `approveEvent(id)` → `requireAdmin()`; `status='approved'`; materialise occurrences (try/catch, rollback on RRULE failure); approve pending image; `revalidateTag('events')`; Resend "live" mail.
- **Server action** `rejectEvent(id, reason)` → `requireAdmin()`; `status='rejected'` + reason; Resend decline mail.
- **Cron Worker** `scheduled()` (separate Worker, `15 2 * * *`) → re-expand recurrences, flip past, retention hard-delete, prune auth tokens/sessions.

**Third-party API calls / webhooks:** none for core function. Resend (already integrated) sends transactional moderation emails. No inbound webhooks. (External-feed import is explicitly Later.)

---

## 6. User flows & state machine

**Event lifecycle:**
`(none) → pending` (owner submits) — or admin creates directly as `approved`.
`pending → approved` (admin approves → occurrences materialised, image approved, tag revalidated when override is live, owner emailed).
`pending → rejected` (admin rejects + reason → owner emailed; no public render).
`approved → past` (cron: last occurrence `end_utc < now`).
`rejected/past → (deleted)` (GDPR erase, or retention-cron hard delete at 24 months).
Occurrence sub-state: `scheduled → past` (cron) or `scheduled → cancelled` (admin cancels one date of a recurring series without killing the event).

**Submission flow (owner):** open `/beheer` → "Evenement toevoegen" on an owned business (`canEdit(user, id)`) → fill form → client validates → `submitEvent` → server re-validates → on failure `?event=invalid` with inline errors; on success `INSERT pending` (+ pending R2 image) → `?event=pending` → branded "ter controle" banner → admin emailed.

**Moderation flow (admin):** queue → preview → approve (materialise + revalidate + email) or reject (reason + email).

**Public flow (visitor):** `/agenda` → filter → `/agenda/[slug]` → `.ics` / share / related-business.

**Edge cases & failure handling:**
- **D1 down at request time** → `events.ts` catch falls back to the `src/data/events.ts` seed (curated events still render).
- **RRULE parse fails at approval** → approval aborts, event stays `pending`, admin sees an error (never publishes a broken series).
- **`rrule`/tz lib won't run in the app Worker** → fall back to cron-side materialisation (approval flips status, cron expands within the next run or via service-binding trigger). Validate in preview deploy in M2.
- **DST boundary** → occurrences computed local→UTC against Europe/Amsterdam; `.ics` carries correct UTC instants; both transition weeks unit-tested.
- **Duplicate slug** → server appends a numeric suffix on collision (`-2`, `-3`).
- **Image upload fails** → event still approvable without an image (optional); pending image superseded/cleaned by existing R2 logic.
- **Owner edits an approved event** → returns to `pending` (re-moderation); occurrences regenerated on re-approval.
- **Event in the past at submit** → rejected by validation (`start_at` must be future).
- **Cron misses a night** → next run is idempotent and self-heals; 12-month pre-materialised buffer means a missed night is not user-visible.
- **District-wide pending image gate** → `role==='admin'` (no `businessId` to `canEdit` against).
- **Zero upcoming dated events** → `/agenda` + homepage strip fall back to evergreen recurring items (never empty).

---

## 7. Third-party choices

Deliberately **low-dependency** — mostly libraries + infra primitives, no new SaaS — keeping inside the €0–25/month budget and the EU-residency mandate.

| Need | Options | Recommendation |
|---|---|---|
| **Recurrence (RRULE)** | `rrule` (npm, RFC-5545) + tz lib vs hand-rolled vs `dayjs`+plugin | **`rrule` + a zone-aware tz lib** (`@date-fns/tz` or `luxon`), run **only** in the cron Worker and (if it runs there) the approval action — **never at the edge**. Materialise to `event_occurrences`; the request path stays lib-free. `rrule` alone is **not** DST-safe — the tz conversion is mandatory. |
| **Scheduling** | **Separate Cron Worker** vs wrapper-entry `scheduled` vs Durable Object alarms vs Queues | **Separate dedicated cron Worker** — OpenNext owns `.open-next/worker.js` (single `fetch` export, regenerated each build), so you **cannot** durably add `scheduled` to it. A standalone Worker bound to the same D1/R2 is clean, independently deployable, and keeps rrule deps off the edge bundle. Free on Workers. (Wrapper-entry is the fallback if a second Worker is unacceptable.) |
| **Add-to-calendar** | Self-generated `.ics` route vs AddEvent/SaaS | **Self-generated `.ics`** — trivial VEVENT, no processor, no PII leaves the edge, no cost, GDPR-clean. |
| **Share** | `navigator.share` + copy-link fallback vs AddThis/ShareThis | **`navigator.share`** — native, no third party, no tracking, GDPR-clean. |
| **Transactional email** | **Resend (EU region)** — already integrated | **Resend** — reuse `getResendConfig`, EU residency, DPA in place. No new processor. |
| **Event images** | Existing **R2 `kamp-photos`** + `/media/[...key]` vs new bucket / CF Images | **Existing R2 path** — reuse the proven upload/serve/supersede/erase flow; no new binding, no new cost. |
| **Product analytics** | Plausible EU / Cloudflare Web Analytics vs GA4 | **Cookieless EU analytics** (Plausible EU or CF Web Analytics) — no consent banner, EU residency. Avoid GA4 (US transfer + consent). |
| **Test runner (net-new)** | **Vitest** vs Jest | **Vitest** — fast, ESM-native, fits Next 16/TS; the repo has **no** test runner today, so this is a setup cost (folded into M2) and a shared deliverable. |
| **External event source (Later)** | VVV/Uitagenda Amersfoort, Eventbrite API | **Defer** — owner-submitted + admin-curated covers launch; a feed import is Later with its own ToS/GDPR review. |

**Net new third-party cost: €0** (cookieless analytics has a free tier; everything else reuses Cloudflare + Resend).

---

## 8. Milestones & sequencing

1. **M1 — Data model + read path + Vitest setup (≈1 wk).** `0003_events.sql`; `src/lib/events.ts` with `NEXT_PHASE` build guard + catch-to-seed; idempotent seed-import script (with the `KampEvent`→RRULE mapping); **stand up Vitest** (none exists today); build green & seed-only. *Deliverable: tables live in local + remote D1; static page still renders via seed fallback; test harness runs.*
2. **M2 — Recurrence engine + dedicated cron Worker (≈1.5 wk).** `rrule`+tz materialiser; **separate cron Worker** project (own `wrangler.jsonc`, same D1/R2 bindings) running nightly re-expand + past-flip + retention delete + token/session prune; **DST boundary unit tests (Oct + Mar) pass**; confirm in a **preview deploy** whether the approval action can also run `rrule` (else cron-only). *Deliverable: occurrences auto-populate and self-expire; cron verified on a preview deploy.*
3. **M3 — Owner submission + admin moderation (≈1 wk).** `submitEvent` + event-image upload (extend `media.ts`); `/beheer` `EventForm`; `/admin` event queue (approve/reject); Resend notifications; full server-side validation + per-session rate-limit + WAF rule; **two-arg `canEdit(user, businessId)`** + district-wide admin-only gate. *Deliverable: full submit→moderate→publish loop with owner isolation.*
4. **M4 — Public `/agenda` + `/agenda/[slug]` + filters + .ics + homepage strip (≈1 wk).** Rebuild list from D1; detail page; `AgendaExplorer` filters; `.ics` route (DST-correct); share; `UpcomingEventsStrip` on home; all empty/loading/error/success states; WCAG AA (focus-ring fix, `aria-pressed`, colour-independent cues). *Deliverable: end-to-end visitor experience.*
5. **M5 — SEO/AEO + analytics + GDPR-erase extension + launch (≈1 wk).** `eventSchema()`/`eventSeriesSchema()` in `schema.ts` (+ organizer/offers/image/dateModified); `## Evenementen` in `llms.txt`; sitemap per event; per-event FAQ chunks; analytics instrumented; **extend `purgeBusiness`/`purgeProfile`** for events/occurrences/images; QA matrix; **Rich Results Test** validation; production deploy. *Deliverable: indexed, cited, measured, erasable, live.*

> **Hard gate before M2 ships to prod:** the d1-next-tag-cache override + `NEXT_TAG_CACHE_D1` binding should land (shared dependency) so approvals are near-instant; if it slips, M4 ships with the honest 5-minute-window contract.

---

## 9. Dependencies

- **Phase 4 production launch / real `database_id`** — `wrangler.jsonc` still has `REPLACE_WITH_D1_DATABASE_ID` (verified); the epic cannot deploy without `wrangler d1 create kamp-db` + the id paste.
- **d1-next-tag-cache override** (`open-next.config.ts` + `NEXT_TAG_CACHE_D1` binding) — for working `revalidateTag('events')`; **today it is a no-op** (verified, no `tagCache` configured). Without it, the agenda is "fresh within 5 min."
- **Dedicated cron Worker infrastructure** — this epic stands it up (OpenNext's generated worker cannot host `scheduled`). Also the first home for token/session pruning.
- **Vitest** — net-new; no test runner in `package.json` today (verified).
- **Existing patterns reused (hard dependencies):** override/moderation (`business_overrides`, `listPending`, `moderateOverride`); magic-link auth (`requireUser`, `requireAdmin`, **`canEdit(user, businessId)` — two args**, `owner_business`); `businessData.ts`/`overrides.ts` build-guard + catch-to-seed pattern; `/media/[...key]` R2 serving + supersede; `src/lib/schema.ts` + `JsonLd`; Resend (`getResendConfig`); `src/lib/cf.ts` loose D1/R2 types + `db.batch()`.
- **GDPR erase** (`src/lib/gdpr.ts`) — `purgeBusiness` **and** `purgeProfile` must be extended (events have no FK to `profiles`, so profile-scoped deletion is explicit, not cascade).
- **i18n scaffolding epic (later)** — for EN agenda + hreflang; NL ships first.
- **Owner self-service signup epic (optional)** — broadens who can submit single-business events.

---

## 10. Risks & mitigations

1. **Cron cannot bolt onto the OpenNext Worker (feasibility).** → Ship a **separate cron Worker** bound to the same D1/R2 (or a wrapper entry). Verified by reading OpenNext's worker template. *This was a hard error in the draft.*
2. **RRULE/DST correctness (the #1 logic risk).** → `rrule` is not zone-aware; pair it with a tz lib, compute local→UTC against Europe/Amsterdam, materialise to `event_occurrences`; explicit Oct/Mar boundary unit tests; edge only SELECTs.
3. **`rrule`/tz lib may not run in the Workers runtime (approval path).** → Validate in a preview deploy in M2; fall back to cron-only materialisation if libs touch unsupported Node APIs.
4. **`revalidateTag` is a no-op today.** → Land the d1-next-tag-cache override as a dependency; otherwise commit to the honest 5-minute window and don't promise "seconds" to owners.
5. **Event rich-result ineligibility (date-less / self-promo).** → Gate strictly on concrete future `startDate`; evergreen → next-N dated Events or `EventSeries`; visible content matches markup 1:1; validate in Rich Results Test.
6. **Submission spam / stored XSS / link spam.** → pending-by-default gate; authoritative server-side validation (length caps, https-only scheme allowlist, date sanity, RRULE parse, plain-text render); per-session rate limit + WAF rule.
7. **District-wide pending-image auth gap.** → `canEdit` can't gate a `NULL` business; use `role==='admin'` for district-wide pending media.
8. **GDPR gaps (events not cascaded from profiles).** → Extend both `purgeBusiness` and `purgeProfile`; delete occurrences + R2 images explicitly; retention cron at 24 months.
9. **Stale agenda kills trust + AEO freshness.** → Nightly cron flips past; evergreen fallback prevents empty page; cron-refreshed `dateModified` keeps the freshness signal warm.
10. **Scope creep into ticketing/payments.** → OUT/Later; `offers` links out only; no PSD2/e-money/voucher-VAT surface; revisit after the Mollie/Cadeaukaart epic.
11. **Cron silently fails (observability).** → Idempotent + self-healing; log row counts; daily "zero past events visible" automated check + alert; 12-month buffer absorbs a missed run; runbook for manual re-trigger.
12. **Net-new test harness underestimated.** → Vitest setup is its own deliverable in M1; estimate raised to 4–6 weeks accordingly.

---

## 11. Acceptance criteria / Definition of Done

- [ ] `migrations/0003_events.sql` applies cleanly to local **and** remote D1; `events` + `event_occurrences` present with indexes + cascade.
- [ ] `src/lib/events.ts` returns seed at build (`NEXT_PHASE` guard) and on D1 failure (catch-to-seed); `getDB()===null` returns seed; `next build` stays green and seed-only.
- [ ] Vitest harness exists and runs in CI-able fashion; RRULE materialiser produces correct occurrences for weekly/monthly patterns; **DST boundary tests pass for both Oct and Mar transitions**.
- [ ] A **dedicated cron Worker** (separate from the OpenNext app Worker) is deployed with `crons: ["15 2 * * *"]`, bound to the same D1/R2; it re-expands recurrences, flips past events/occurrences, hard-deletes past events older than 24 months (+ their occurrences + R2 images), and prunes expired `auth_tokens`/`sessions`; idempotent on re-run; logs counts.
- [ ] `submitEvent` uses `requireUser()` + **`canEdit(user, businessId)` (two args)** for single-business events and `role==='admin'` for district-wide events.
- [ ] All submissions land `status='pending'`; nothing renders publicly until admin approval.
- [ ] Server-side validation rejects: >120-char title, >2000-char description, non-`https://` URL (scheme allowlist), `start>end`, past `start`, dates >18mo out, malformed RRULE; content rendered as escaped plain text (no `dangerouslySetInnerHTML`).
- [ ] Admin can approve/reject (with reason) from `/admin`; approval materialises occurrences (rollback on RRULE failure), approves the pending image, fires `revalidateTag('events')`, emails the owner via Resend.
- [ ] Pending **district-wide** event images gate on `role==='admin'`; pending single-business images gate on `canEdit`; approved event images are public — via the existing `/media/[...key]` route.
- [ ] `/agenda` reads D1, filters by date range + category + search, groups by date, never shows past or empty (evergreen fallback).
- [ ] `/agenda/[slug]` renders full detail, mini-map (when geo), related-business link, `.ics` download (RFC-5545-valid, DST-correct local time), share; `notFound()` on unknown/non-approved.
- [ ] `UpcomingEventsStrip` on the homepage shows next events / evergreen fallback (pure RSC, no client fetch).
- [ ] `eventSchema()`/`eventSeriesSchema()` live in `schema.ts` with organizer/offers(link-out only)/image/dateModified; **Google Rich Results Test passes** for one-off, recurring (EventSeries), and single-business templates; no fabricated price/availability.
- [ ] `## Evenementen` section present in `llms.txt`; `sitemap.ts` lists approved dated events with `lastModified=updated_at`; per-event FAQ chunks (40–60 word answers) match visible content.
- [ ] **GDPR:** `purgeBusiness` deletes the business's events + occurrences + event R2 images; `purgeProfile` deletes events `submitted_by` that profile (explicit, not cascade) + occurrences + images; retention cron honoured.
- [ ] All new screens meet WCAG AA (focus-ring uses `--amber-ink`/white not `--amber`, `aria-pressed` on filters, colour-independent category cues, reduced-motion honoured incl. Framer JS guard); empty/loading/error/success states implemented.
- [ ] Analytics events fire via a cookieless EU-hosted tool (no GA4 / no consent banner needed).
- [ ] No new third-party processor; all data on Cloudflare (EU) + Resend (EU); DPAs in place; no payments/PSD2/voucher/Places-API surface introduced.

## 12. KPIs & success metrics

- Upcoming events live on `/agenda` at all times: **never < 6** (incl. evergreen recurring).
- **90%+** of approved dated events indexed in GSC within 7 days.
- Rising **Event rich-result impressions** (GSC Events enhancement report), MoM.
- AI-answer citations for "wat is er te doen in Amersfoort / De Kamp" — manual monthly audit across ChatGPT, Perplexity, Google AI Overviews.
- **30%+** of active owners submit ≥ 1 event/year; approval rate tracked.
- Median moderation latency submit→decision **< 48h**.
- `/agenda` sessions, `.ics` downloads, share clicks (engagement).
- Homepage "Binnenkort" strip CTR to `/agenda` and to business detail.
- Event-detail → related-business click-through (cross-sell).
- **Zero** past/expired events visible publicly (daily automated check, target 100%).

## 13. Cost

**One-off (build):** 4–6 weeks of team effort (revised up from 3–5 for the recurrence engine, the separate cron Worker, and the net-new Vitest harness). No setup fees, no new accounts.

**Monthly at this scale (~67 businesses, district-sized event volume):**
- Cloudflare D1: events + occurrences are tiny (low thousands of rows/year) — **within free tier**.
- Cloudflare R2 (event images): a few MB in the existing bucket — **negligible, within existing spend**.
- Cloudflare Cron Triggers + the second (cron) Worker: **free** on the Workers plan (a separate Worker doesn't add cost on the bundled/paid plan; on the free plan it counts toward the daily request budget but a nightly cron is trivial).
- Cloudflare Workers requests: agenda traffic is modest — **within existing plan**.
- Resend (moderation emails): a few emails/week — **within existing free/EU tier**.
- Cookieless EU analytics: free tier (CF Web Analytics is free; Plausible EU has a low-cost tier if self-host isn't used).
- `.ics` + Web Share: **€0** (no processor).

**Net new monthly cost: ≈ €0** — comfortably inside the €0–25/month budget; adds no EU-residency or GDPR surface beyond what's already in place.

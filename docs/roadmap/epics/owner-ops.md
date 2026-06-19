# Owner Acquisition & Moderation Operations — The Human Engine of De Kamp

> The operational + human system that turns ~67 static listings into a living, owner-maintained guide: a claim-your-listing acquisition funnel (district-association outreach → /aanmelden → admin invite → magic-link), Dutch help + support, a moderation playbook with real SLAs, trust & safety policy, and retention nudges.
> **Recommended phase:** Phase 4, right after production launch + Cloudflare hardening, in parallel with the GBP/reviews epic. **Effort:** 6–9 weeks (revised up from the draft's 5–8 after the reviewer flagged the auth-extension, rate-limit-fallback, and consent-audit work the draft under-scoped). **Teams:** Operations & Content & Legal central; Backend (moderation tooling, lead/invite/nudge backend, in-app rate limiter) and Frontend light; SEO, Design, Analytics, PM, QA supporting.

> **Reviewer note (principal pass):** This document is the *finalized* version after an adversarial engineering/legal/SEO review of the draft. The most material corrections were: (1) **Resend does NOT give EU data residency** — `eu-west-1` only controls the *dispatch* region (Ireland); all account data, email metadata and logs are stored in the **US** — so the lawful-transfer basis is SCCs, not EU residency, and this must be fixed in the project memory and privacyverklaring; (2) the **Cloudflare Free plan includes exactly ONE rate-limiting rule** (fixed 10s/1min window), so it cannot cover all four auth/lead endpoints — an in-app D1 limiter is the *primary* control, WAF a single coarse backstop; (3) the keystone `inviteOwner` multi-table write must use **`db.batch()`** (D1 has no interactive transactions on Workers) or it can leave half-created owners; (4) several flows the draft listed as trivial (`completeLogin` extension, lead dedupe, GDPR cascade for `leads`) need explicit edge-case handling. All corrections are inline below and flagged **[REVIEWER]**.

---

## 1. Goal & value

Today the backend can *receive* owner edits and photos and moderate them, but there is **no flow that gets owners into the portal at all**. `owner_business` rows can only be created by an admin hand-writing SQL; `/aanmelden` is a `mailto:` form that produces an email, not a record; there is no help, no policy, no SLA, no retention. The site is a beautiful guide that nobody but the admin can edit.

This epic is the engine that fixes that. Its value:

- **For the district association (the customer):** a repeatable, low-effort way to onboard and retain owners without each one becoming a manual SQL/inbox chore. A weekly operational rhythm a part-volunteer team can actually run.
- **For owners (B2B):** a dignified "we already built your page — claim it" experience instead of a cold sign-up. They keep their own hours, photos, and story fresh in minutes, and they trust that edits get reviewed quickly and fairly.
- **For visitors (B2C):** accurate hours, real photos, current stories. Freshness is the single biggest lever on both trust and AI-citation probability (>60% of AI citations are pages updated within 6 months) — and freshness only happens at scale if owners maintain their own listings.
- **The problem solved:** the gap between "a CMS exists" and "67 real shopkeepers use it." That gap is human and operational, not technical — so this plan is operations-and-content-led with a focused backend to remove every manual chore.

---

## 2. How it works in real life

**Personas**
- **Saskia** — coordinator of the De Kamp ondernemersvereniging (district association), part-time, runs the site as admin/moderator. Not technical.
- **Driss** — owner of a falafel/Levantine lunchroom on Kamp. Busy, runs the counter himself, checks email on his phone between orders.
- **Lotte** — owner of a concept/interior shop on Kamp, design-savvy, will absolutely judge the product by how its portal looks.
- **Mark** — a visitor from Utrecht looking for "lunch op De Kamp Amersfoort nu open."

**Journey A — Acquisition (Saskia onboards Driss, the "we built it for you" path).**
1. Saskia walks the street with a printed **leave-behind card** (one per business) and a QR sticker. Driss's lunchroom is already in the seed data with a placeholder photo. The card says: *"Jouw zaak staat al op ondernemersvandekamp.nl. Scan en claim 'm — 2 minuten."*
2. Driss scans the QR. It deep-links to `/aanmelden?b=driss-lunchroom` with his business pre-selected. The form (now a real Server Action, no more `mailto:`) is mostly pre-filled from seed data; he confirms his email, ticks the (default-unticked) consent box, submits.
3. Backend writes a `leads` row (status `new`), emails Driss a **double-opt-in confirmation** ("bevestig je e-mail"), and notifies Saskia in the `/admin/aanmeldingen` queue.
4. Driss taps confirm; lead flips to `confirmed`. Saskia sees it, verifies (she knows him — he runs the shop) and clicks **"Nodig uit → koppel aan Driss Lunchroom."** This single action (one D1 `batch`) creates his `profiles` row, inserts the `owner_business` link, inserts an `owner_invites` claim token, and emails a **magic-link claim**.
5. Driss clicks the link from his phone, lands directly in `/beheer` already bound to his listing. He fixes his hours (he now closes Mondays via the `hoursNote` field), uploads a real photo of the counter (with alt text), edits his story. Everything goes in as **pending**.

**Journey B — Moderation (Saskia, week-to-week).**
6. Saskia's Monday rota slot: she opens `/admin`. The queue shows Driss's text edit and photo, each with **who submitted, when, age, and a claim-this-item lock** so a co-moderator doesn't double-handle it. The diff view shows old → new with an explicit "oud"/"nieuw" label (not colour alone).
7. Driss's hours edit is clean — **Approve**. **[REVIEWER] Caveat:** instant live-update requires the `d1-next-tag-cache` override (a hard dependency, see §9); *without it, the live page still lags up to the 5-minute ISR window* — do not promise owners "binnen seconden" in the email until that override is shipped. His photo passes the policy rubric — **Approve**.
8. A different owner submitted a story edit containing a competitor jab. Saskia picks the **rejection-reason template "Niet over andere ondernemers"**, which sends a warm, specific Dutch rejection email. Every action lands in `moderation_log`.
9. SLA clock: edits within 48h, photos within 72h. The queue surfaces the **oldest pending item's age** so Saskia and her co-moderator never let it rot.

**Journey C — Retention (the nudge engine, no human needed).**
10. Six months later Driss hasn't logged in. The weekly cron flags his listing as stale (>180 days since `updatedAt`). A friendly Dutch nudge email goes out: *"Kloppen je openingstijden nog? Eén tik om te checken."* It's logged in `nudge_log` so he's never spammed twice in a window, and it carries a working **opt-out link** (legitimate-interest service email, see Legal).
11. Early December the **seasonal-hours** cron fires for horeca/retail: *"Pas je kerst- en koopzondag-tijden aan."* Driss updates, the loop repeats.

**Journey D — The visitor payoff (Mark).**
12. Mark searches "lunch De Kamp nu open." Because Driss's hours and photo are fresh and accurate, his listing's `OpenBadge` correctly shows "open," the page ranks/cites well on freshness, and Mark walks in. The whole acquisition+moderation+retention machine existed to make this one moment true.

**Lotte's variant:** as a design-led owner she's skeptical of "another portal." The branded portal uplift (shared epic) + the "your page already looks premium, just claim it" framing converts her; she becomes a reference owner Saskia name-drops to the next ten businesses.

---

## 3. Scope

**In**
- Real lead-capture backend replacing the `/aanmelden` `mailto:` (D1 `leads`, Server Action, double-opt-in, admin notification).
- Admin **leads queue** + **approve-lead → invite-owner** action that finally gives `owner_business` a UI.
- `owner_invites` claim-token flow layered onto the existing magic-link/`auth.callback`.
- Moderation tooling upgrades: queue filter/sort, item-claim lock, rejection-reason templates, **`moderation_log` audit table**.
- Written **moderation playbook**: SLAs, rota, escalation, rejection tone guide.
- Dutch **help centre** (`/help`) + in-portal contextual help + support inbox routing.
- **Trust & safety**: public huisregels, content/photo policy, takedown + appeal path, photo-rights attestation.
- **Retention engine**: cron-driven freshness + seasonal-hours nudges (`nudge_log`), re-engagement sequence.
- **In-app rate limiter** (D1-backed) for the auth + lead intake endpoints — the *primary* control (Free-plan WAF can only back one of them). **[REVIEWER] added to scope.**
- Owner-photo **alt-text field** in `/beheer` upload (a11y + AEO; small extension). **[REVIEWER] promoted from Content footnote to in-scope.**
- **Printed/QR leave-behind kit** (PDF) + outreach playbook for the association.
- Metrics + ops dashboard for the KPIs.

**Out (owned by other epics, referenced here)**
- GBP OAuth + review *display* (GBP/reviews epic) — but the **review-request acquisition flow** and **review-moderation SLA** are co-defined here.
- Payments / Cadeaukaart, events/agenda backend, newsletter broadcast tooling (this epic only needs Resend transactional + the subscribers consent pattern), i18n routing.
- Portal/admin visual rebrand (Design-system epic) — this epic specifies the *operational* screens and states; the brand uplift is a dependency, not a deliverable here.
- The `d1-next-tag-cache` override itself (Backend/Infra epic) — consumed here as a dependency.

**Later**
- EN help docs + bilingual outreach (after i18n scaffolding).
- Self-serve "claim without admin verification" for low-risk businesses (only after the manual loop is proven). **[REVIEWER] Keep this firmly Later: self-serve claim without human verification is the single biggest listing-hijack vector; do not soften it.**
- Owner-to-owner referral incentives; gamified freshness streaks.
- Slack/WhatsApp support channel beyond email.

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16, App Router)

> This is Next.js 16 on Cloudflare Workers via OpenNext — **no Node-only APIs at the edge** (no `fs`, no `Buffer`-heavy libs at runtime, no `node:crypto` for tokens — use Web Crypto `crypto.getRandomValues`/`crypto.randomUUID`, exactly as `auth.ts` already does). Verify any new dependency is edge-safe before adding it.

**Routes / pages**
- `/aanmelden` (existing, public): replace `AanmeldenForm` `mailto:` submit with a **progressive-enhancement form posting to a Server Action** (`submitLead`). Support `?b=<businessId>` query to pre-select/pre-fill a seed business. Server Component page wrapping a thin client form; the form uses `useActionState` (Next 16) for inline success/error without a hard navigation. **[REVIEWER] Validate `?b=` against the seed list server-side** (`getActiveBusinesses`) before pre-filling — an attacker-supplied `b` must not echo arbitrary text into the form or create a lead for a non-existent business.
- `/aanmelden/bevestigd` (public): double-opt-in landing after confirm token.
- `/help` (public, ISR): Dutch help centre — Server Component reading static MDX/TS help content; FAQPage schema. `/help/[slug]` for individual guides.
- `/admin/aanmeldingen` (admin, `force-dynamic`): leads queue. Server Component lists `leads`; client row components for the claim-lock + invite action. **Must be `force-dynamic` and behind `requireAdmin()`** like the existing admin page — it contains PII (lead emails) and must never be cached or statically rendered.
- `/admin` (existing): extend the moderation page with filter/sort controls (client island, state in URL `searchParams` so the server reads them), item-claim indicator, and rejection-reason **template picker** (a `<select>` that fills the reason textarea).
- `/beheer` (existing): add a **contextual help drawer** (client island) + a "je listing is X dagen niet bijgewerkt" freshness banner (Server-rendered from `updatedAt`).

**Components**
- `LeadForm` (client) — replaces the `mailto:` logic; `useActionState`, consent checkbox (default unchecked), honeypot field, inline states.
- `KampInput`/`KampTextarea` shared field components (from design-system epic) so `/aanmelden` and `/beheer` match. **[REVIEWER] Soft dependency — if the design-system epic slips, ship with the existing inline field styles rather than blocking the funnel; flag as a polish follow-up.**
- `RejectionTemplatePicker` (client) — fills the existing reject reason input.
- `ModerationFilters` (client) — status/age/type filter, persisted in URL searchParams (server reads them).
- `HelpDrawer` (client) — slide-over with the relevant Dutch guide; focus-trap + Escape-to-close (a11y).
- `FreshnessBanner` (server) — shown in `/beheer/[id]` when `updatedAt` is stale.
- `AltTextField` (in the existing `PhotoUpload` flow) — required text input captured alongside the photo. **[REVIEWER] new.**
- `LeaveBehindPreview` (server, admin-only) — renders the per-business QR/claim card for printing.

**State / forms**
- On-site mutations are **Server Actions** (the codebase pattern). Provide **one** thin `POST /api/aanmelden` route handler for the off-site/QR/embed case, and have **both the Server Action and the route handler call the same `createLead()` lib fn** so validation/consent/rate-limit logic exists in exactly one place.
- Forms are uncontrolled + `FormData` (matches `beheer/actions.ts`). Honeypot + consent are re-validated **server-side** (never trust the client gate).

**Images / QR**
- QR codes generated **server-side, edge-safe** — render the printable card via the `next/og` `ImageResponse` route pattern already used by `/opengraph-image`, or generate the QR matrix with a pure-JS edge-safe encoder (e.g. `qrcode`'s core in a Worker-compatible mode — verify no `node:` imports). **No Node-only canvas libs, no hosted QR SaaS** (avoids logging scans off-platform → GDPR). **[REVIEWER]:** if a pure-JS QR lib proves not edge-safe, fall back to encoding the claim URL as a `data:`-URI SVG QR computed in the route handler.

---

### Engineering — Backend & Infra (Cloudflare) — PRIMARY

This is the headline. Everything reuses the existing patterns in `src/lib/auth.ts`, `overrides.ts`, `media.ts`, `gdpr.ts`, `settings.ts`, the D1 binding `DB`, and `getDB()` from `cf.ts`. No new bindings except optionally the second D1 for tag cache (separate epic). Cron is a new scheduled export on the same Worker.

**New D1 tables** (new migration `0003_owner_ops.sql`). Full DDL in §5.
- `leads` — acquisition intake + consent + status + double-opt-in token + expiry.
- `owner_invites` — claim tokens binding email+business_id before first login.
- `moderation_log` — immutable audit of every moderation/invite/purge action.
- `nudge_log` — which nudge type was sent to which business/email and when.
- `rate_limit` — **[REVIEWER] new**: in-app sliding-window counter keyed by `(bucket, identifier)` for the auth + lead endpoints, since Free-plan WAF gives only one rule (see Security).

**Schema changes to existing tables**
- `owner_business`: no column change; it finally gets a **writer path in the admin UI** (the `inviteOwner` action INSERTs it). Add index `idx_owner_business_business(business_id)` for reverse lookups ("who owns X").
- `business_overrides` / `business_media`: add nullable `claimed_by TEXT` + `claimed_at INTEGER` for the moderation **claim-lock**. Recommend the lightweight column approach over a separate `moderation_claims` table since these tables are already moderation-scoped and low-volume. **[REVIEWER] note:** SQLite/D1 `ALTER TABLE ADD COLUMN` is cheap and online here; safe.

**Route handlers / Server Actions** (signatures in §5)
- `POST /api/aanmelden` → `createLead(payload)` — public, **rate-limited (in-app, see Security)**, honeypot + consent enforced, validates `business_id` against the seed, **dedupes on `(lower(email), business_id)` against non-rejected leads within 30 days**, writes `leads` (status `new`), sends confirm email via Resend, notifies admins. Always returns an `ok`-shaped 202 (don't leak whether a lead already exists).
- `GET /api/aanmelden/confirm?token=…` → flips lead `new → confirmed`, single-use token, **7-day TTL**, 410 on expired/used.
- Server Action `submitLead(FormData)` in `aanmelden/actions.ts` — calls the same `createLead()`.
- Server Action `approveLead(id)` / `rejectLead(id, reason)` in `admin/actions.ts` (writes `moderation_log`; reject emails applicant).
- Server Action `inviteOwner({ leadId?, email, businessId })` — **the keystone**. Must be **atomic via `db.batch([...])`** (D1 exposes `batch()` in `cf.ts`; Workers D1 has **no interactive `BEGIN/COMMIT` transactions**, so a multi-statement non-batched sequence can half-fail and orphan a profile). The batch: upsert `profiles` (or look up existing id first, then batch the dependent writes), INSERT `owner_business`, INSERT `owner_invites`, INSERT `moderation_log`. Email the magic-link claim **after** the batch commits, `.catch()`-wrapped (existing pattern). **[REVIEWER]: this is the highest-risk write in the epic — write an integration test for the partial-failure path.**
- Extend `completeLogin(token)` in `auth.ts`: after creating the session, if an **un-claimed, un-expired `owner_invites` row exists whose email == the just-authenticated profile email**, mark it `claimed_at`, ensure the `owner_business` row exists (idempotent `INSERT ... ON CONFLICT DO NOTHING`), and flip any backref `leads` row to `converted`. **[REVIEWER] critical correctness points:** (a) only bind invites matching the authenticated email — never bind by token alone, or a forwarded claim link hands ownership to whoever opens it; (b) the magic-link token and the invite are **two separate tokens** — the claim email's link is a normal magic-link `/auth/callback?token=…` whose login *side-effect* consumes the matching invite, OR carries both; pick one and document it (recommend: invite issuance also issues an `auth_tokens` row so one click both logs in and binds); (c) make the invite-consumption idempotent so a double-click doesn't error.
- Server Action `claimModerationItem(table, id)` / `reassignModerationItem(table, id)` — sets/clears `claimed_by/claimed_at`; `table` is an allow-listed enum (`'business_overrides' | 'business_media'`), never interpolated raw into SQL.
- **All** moderation Server Actions (`approve`, `reject`, `approvePhoto`, `rejectPhoto`, `inviteOwner`, `approveLead`, `rejectLead`, `purgeBusinessData`) **must write `moderation_log`**.

**Cron / scheduled Worker** (new `scheduled()` export; coordinate as the **single shared handler** that dispatches by cron expression)
- Register in `wrangler.jsonc` `triggers.crons`. **[REVIEWER]:** Cron Triggers run in **UTC** — there is no per-trigger timezone. Schedule the "weekly Monday 08:00 Europe/Amsterdam" job as the correct UTC cron (`0 7 * * 1` in winter / `0 6 * * 1` in summer) **and** guard inside the handler by computing Amsterdam local time, because DST will shift it by an hour twice a year. Don't claim "Mon 08:00 Europe/Amsterdam" as a literal cron string.
- **Nightly (`0 3 * * *` UTC):** purge expired `auth_tokens`, expired `sessions`, expired `owner_invites`, stale `rate_limit` rows, **unconfirmed `leads` >30 days**, **unconverted confirmed `leads` >12 months** (GDPR retention) via `purgeLead`.
- **Weekly (guarded to Mon ~08:00 Amsterdam):** detect stale listings (`updatedAt` > 180 days, owner bound) → freshness nudge; detect seasonal windows (early Dec, before koopzondagen) → seasonal-hours nudge. Each send checks `nudge_log`'s unique `(business_id, kind, window_key)` constraint to avoid re-spam, sends via Resend, writes `nudge_log`. **Throttle to N sends per invocation** (Resend free tier = **100 emails/day**; at 67 owners a single weekly run is fine, but the throttle protects against a buggy window-key fan-out).
- **[REVIEWER]:** the `scheduled()` handler runs in the OpenNext Worker — confirm the OpenNext build surfaces a `scheduled` export hook; if it does not expose one cleanly, the documented fallback is a **separate tiny Worker** on the same account bound to the same `DB`/`PHOTOS`, deployed alongside, owning all cron. Decide this in M1 spike, not at the end.

**Security & owner-isolation**
- Reuse `canEdit()` — unchanged; owner edits already pending-by-default and per-request gated.
- **Invite-only ownership:** `owner_business` is only ever written by an admin `inviteOwner` action after verification, or by the idempotent ensure inside `completeLogin` for a matching invite — **never self-granted**. This is the anti-hijack control.
- **Rate limiting — corrected design. [REVIEWER]:** The Cloudflare **Free plan includes exactly ONE rate-limiting rule** with a fixed 10s or 1min window and limited matching. It **cannot** independently cover `/api/aanmelden`, `/login`, `/auth/callback`, and `/api/aanmelden/confirm`. Therefore:
  - **Primary control = an in-app D1 limiter** (`rate_limit` table): on each protected endpoint, `INSERT ... ON CONFLICT` increment a counter keyed `(bucket, ip_or_email, window_start)`; reject over threshold (e.g. lead intake 5/min/IP, magic-link request 5/min/IP, confirm 20/min/IP). IP from `request.headers.get('CF-Connecting-IP')`. This is edge-safe, ~one extra D1 round-trip, and works on the free plan.
  - **Backstop = the single free WAF rule** applied to the highest-risk path (`POST /api/aanmelden` OR `/login`), or a single expression OR-matching both paths. Document that broader coverage needs Cloudflare Pro (custom rules) or is simply handled in-app.
  - Honeypot field + default-unticked consent gate on lead intake to deter bots.
  - **Do not claim WAF rate limiting is "zero-cost, zero-code" for all endpoints — it is not.**
- Tokens: `owner_invites` and lead-confirm tokens use the same `randomToken()` (32-byte hex via Web Crypto), single-use, TTL'd, exactly like `auth_tokens`.
- **No PII in logs** beyond what `[magic-link]` already logs; in production with a configured mailer, lead/invite emails are **never** `console.log`'d (the existing code only logs the link when *no* Resend key is set — preserve that guard).

**Caching / invalidation**
- Public reads (`/aanmelden`, `/help`) are ISR. Owner-edit approvals invalidate via the **d1-next-tag-cache override** (dependency); until it ships, the 5-minute ISR window governs (set owner-facing copy accordingly). Admin queues (`/admin`, `/admin/aanmeldingen`) are `force-dynamic`.

**Migrations**
- Add `migrations/0003_owner_ops.sql`; apply via the existing `db:migrate` / `db:migrate:local` scripts. No data backfill (leads/invites/logs start empty). Add the `owner_business` and new-table indexes in the same migration. **[REVIEWER]:** test `0003` applies cleanly on a DB that already has `0001`+`0002` (the `ALTER TABLE` statements assume the originals exist).

---

### SEO / GEO / AEO

- **`/aanmelden` (B2B acquisition SEO):** add a `Service` + `WebPage` JSON-LD node describing the **free listing service** (provider = Organization `@id`, areaServed = Amersfoort, `offers.price = "0"`, `priceCurrency = "EUR"`). Targets "mijn zaak aanmelden De Kamp", "winkel aanmelden Amersfoort binnenstad". Answer-first 40–60-word lede: *"Heb je een zaak op De Kamp? Je vermelding op ondernemersvandekamp.nl is gratis…"*.
- **`/help`:** FAQPage schema with genuine visible Q&A; each answer a 40–60-word extractable chunk (the documented AEO target). This doubles as AEO content for "hoe beheer ik mijn vermelding De Kamp". Add `dateModified` to the FAQPage node.
- **Freshness as a first-class signal:** the retention engine's entire purpose, restated in SEO terms — every approved owner edit bumps `updatedAt`, which must flow into **on-page `dateModified`** on the `LocalBusiness` JSON-LD node and the sitemap `lastModified`. Add `dateModified: business.updatedAt` to `localBusinessSchema()` (small change, coordinate with the SEO epic that owns `schema.ts` — **don't edit `schema.ts` from this epic without that coordination**, to avoid two epics colliding on the same file). The admin queue shows a "laatst ververst" timestamp so moderators see freshness at a glance.
- **Review structured-data discipline (2024+ self-serving rule):** **[REVIEWER] reaffirmed** — the review-request flow here only **deep-links to Google's own review form**; it surfaces no review content on-site and adds **no `aggregateRating`/`review` markup** to business pages (correctly omitted today). Any on-page review *display* is the GBP epic's problem and must, per Places API ToS, show the Google logo + attribution when no map is present, cache nothing beyond `place_id`, and show ≤5 reviews per request. Nothing in this epic touches that surface.
- **Internal linking:** `/help` links to `/aanmelden`; `/aanmelden` links to representative business pages ("zo ziet jouw pagina eruit"); footer links to `/help`. Build the topical cluster "ondernemer worden / je zaak op De Kamp".
- **Sitemap/robots/llms.txt:** add `/help` (+ `/help/[slug]`) and `/aanmelden/bevestigd` to the sitemap; keep them crawlable. `/admin/*` and `/admin/aanmeldingen` stay runtime-gated; they render no PII to anonymous crawlers (auth redirect) so leaving them crawlable-but-gated is acceptable, though a `Disallow: /admin` line is harmless belt-and-braces. Add a short "## Voor ondernemers" section to `llms.txt` describing the free claim process.
- **hreflang:** none now (NL-only). When EN help ships, add `alternates.languages` per the SEO epic's hreflang infrastructure.
- **CWV:** `/aanmelden` and `/help` are content-light ISR pages — keep them fast; no client JS beyond the form island and help drawer. Reserve space for the form success state (no CLS).
- **Local SEO tie-in:** the review-request acquisition flow (co-owned with GBP epic) is the highest-leverage local-pack lever — surfaced in `/beheer` once an owner is claimed.

---

### Design / UX

**Screens to design (Figma):**
1. `/aanmelden` redesigned form — pre-fill state (QR deep-link), empty, validating, submitting, success (inline, no mail-client), error, already-submitted, **rate-limited ("even wachten") state**.
2. `/aanmelden/bevestigd` confirmation landing (+ the **expired/used confirm-link** variant → "vraag een nieuwe link").
3. `/admin/aanmeldingen` leads queue — list, filters, lead detail, "invite" confirm modal, empty state ("geen nieuwe aanmeldingen").
4. `/admin` moderation upgrades — claim-lock badge, "wordt behandeld door X" warning, filter/sort bar, rejection-template picker, oldest-pending-age indicator, audit-log peek.
5. `/help` centre + `/help/[slug]` article + in-portal `HelpDrawer`.
6. `FreshnessBanner` in `/beheer`.
7. **Alt-text field** in the photo upload (with helper copy).
8. Printable **leave-behind card** + QR sticker (print spec, bleed, CMYK note for the print shop).

**Components & states:** every async action needs explicit **empty / loading / error / success** states. Leads queue empty state, moderation empty state ("queue leeg — goed bezig"), invite-sent success toast, lead-confirm-pending pill, claim-lock-held warning. Reuse the shared `KampInput` family and a named `<Alert variant>` (from design-system epic) instead of raw utility banners.

**Responsive:** owners overwhelmingly use phones (Driss). The `/aanmelden` form, `/beheer`, and `/help` must be mobile-first; the QR deep-link lands on mobile. Admin queues can be desktop-primary but must not break on tablet.

**Motion:** subtle only; reuse the shared motion presets; respect `prefers-reduced-motion`. No motion on moderation actions (clarity > delight there).

**WCAG AA (EAA in force since June 2025):** moderation diff must not rely on colour alone — add an icon/label "oud"/"nieuw" (current strikethrough+colour fails SC 1.4.1). Fix the focus-ring contrast issue site-wide (`--amber` #c9822b ≈ 3.2:1 on `--background` fails SC 1.4.11 → use `--amber-ink`/white, or a dual-tone ring). Add `lang="nl"` to `<html>`. Skip links + focus-trap on `/help` and the `HelpDrawer`.

**Designers deliver:** Figma frames for all screens + states, the print-ready leave-behind PDF, redlines/handoff spec, and the rejection-email visual template (used by Content for copy).

---

### Content / Localization

**Copy needed (Dutch-first, warm informal je/jij register matching "De Kamp leeft."):**
- `/aanmelden` rewrite for the "claim, niet aanmelden" framing; consent checkbox legal-but-warm wording (with Legal) — **default unticked, granular**.
- Double-opt-in confirm email + applicant confirmation email + admin notification email.
- **Magic-link claim invite email** — the most important conversion copy in the epic: *"Je pagina staat klaar. Claim 'm in 2 minuten."*
- `/help` centre: 8–12 guides (hoe claim ik mijn zaak, hoe wijzig ik openingstijden, hoe upload ik foto's + fotorichtlijnen + alt-tekst, hoe lang duurt goedkeuring, hoe vraag ik een review, AVG/privacy, contact).
- **Rejection-reason templates** (6–8): off-topic over andere ondernemers, fotorechten onduidelijk, lage beeldkwaliteit, onjuiste/onverifieerbare info, ongepaste inhoud, dubbele inzending — each warm, specific, with a fix-it next step.
- **Huisregels / content + photo policy** (public + portal versions).
- Freshness + seasonal nudge emails — **must carry a working opt-out line + an unsubscribe mechanism** (Legal: these are legitimate-interest service emails, not marketing).
- **Alt-text guidance** for owners ("beschrijf wat te zien is, bv. 'gevel van Driss Lunchroom aan de Kamp'") — both a11y and AEO.
- Leave-behind card + QR sticker copy.
- In-portal microcopy uplift (the current `/beheer` copy lacks brand warmth).

**Bilingual implication:** author all strings so they're extractable later (a `messages/nl.json`-ready structure even before next-intl lands). EN help is Later; don't block on it. Set `lang="nl"` now.

**Workflow:** Content drafts in the shared doc → Legal reviews consent/policy/email footers → Operations approves tone → strings land in code. Maintain a single Dutch glossary so "vermelding / ondernemer / claimen / openingstijden" stay consistent.

---

### Legal / Compliance (GDPR / AVG)

- **[REVIEWER] CORRECTION — Resend data residency:** the project memory and the draft repeatedly assert "Resend EU region = EU-resident / GDPR-clean." This is **inaccurate.** Resend's `eu-west-1` controls only where mail is *dispatched* (Ireland); **all account data, email metadata, logs, and API records are stored in the United States** regardless of sending region (confirmed against Resend's own docs, June 2026). Consequences:
  - The lawful transfer basis is **Standard Contractual Clauses (SCCs) + Resend's DPA + a documented TIA (transfer impact assessment)** — **not** "EU data residency." Fix this wording everywhere (privacyverklaring, verwerkersregister, project memory).
  - Recipient email + name *will* transit/rest in the US. Minimise PII in email bodies, set short Resend log retention if configurable, and **disclose the US processor + SCCs in the privacyverklaring**.
  - **Decision point for the association:** accept SCC-based US transfer for transactional email (pragmatic, common, lean-budget) **or** switch to a genuinely EU-resident sender. Genuinely-EU options to evaluate: **Brevo** (FR/EU-hosted) or **Scaleway TEM** (FR). Document the decision; if staying on Resend, the SCC paperwork is mandatory, not optional.
- **Lawful basis:** lead data = **consent** (explicit, default-unticked checkbox, recorded with exact timestamp + consent *text version* in `leads.consent_text`/`consent_at`). Owner account/listing data = **contract/legitimate interest** (they run their own listing). Nudge emails to claimed owners = **legitimate interest** (service-related, with opt-out) — *not* marketing consent; keep them transactional/service in nature, with an unsubscribe link.
- **Consent specifics:** the `/aanmelden` checkbox is **unticked by default**, granular (data use vs image use stated), and links to the privacyverklaring. Store the exact consent string + version. **Double opt-in** = anti-spam + consent-quality evidence.
- **Retention / erasure:** unconfirmed leads auto-purged >30 days; unconverted confirmed leads >12 months (cron). Add `purgeLead(id)` alongside the existing `purgeProfile`/`purgeBusiness`. **[REVIEWER] gap to close:** `leads` and `owner_invites` and `nudge_log` have **no FK/cascade** to `profiles` — so `purgeProfile` (which cascades only `sessions` + `owner_business`) will **leave lead/invite/nudge rows containing the person's email behind**. The erasure routine must *also* delete `leads`/`owner_invites`/`nudge_log` rows matching that email. Make `purgeProfile` do a best-effort email-match sweep of these tables, and document the SAR (inzage) + erasure runbook for Operations.
- **Processors + DPAs (verwerkersregister, Art. 30):**
  - **Cloudflare** (D1/R2/Workers): configure the account's data-location/jurisdiction restriction to EU where the plan allows; sign the Cloudflare DPA. Note: on the free plan, regional services / Data Localization Suite controls are limited — document the actual residency posture honestly rather than asserting "EU residency."
  - **Resend**: **US-stored data, SCCs + DPA** (see correction above). Verified subdomain `send.ondernemersvandekamp.nl` (SPF/DKIM/DMARC) for deliverability.
  - **Google** (GBP) — separate epic.
  - Analytics processor per §7.
- **Domain law:**
  - *Reviews / Places API ToS* (co-owned with GBP epic): no caching beyond `place_id`; Google logo + attribution when shown without a map; ≤5 reviews/request. The review-request flow here only deep-links to Google's own form — **no ToS exposure in this epic**.
  - *Photo rights:* require a **photo-rights attestation checkbox** ("ik heb de rechten op deze beelden en geef toestemming voor publicatie") at upload, recorded with timestamp. Takedown path for IP complaints + an appeal route.
  - *Marketing consent:* nudges are service emails with opt-out; any future newsletter needs separate explicit consent (other epic).
  - *Accessibility (EAA, in force June 2025):* keep public + owner-facing flows WCAG 2.1 AA; the moderation-diff colour-only issue and the focus-ring contrast are concrete compliance gaps to fix in this epic.
  - *Payments/PSD2/e-money/voucher-VAT:* **N/A to this epic** (Cadeaukaart epic). Flagged so it isn't dropped; **[REVIEWER] confirmed nothing in this epic moves money or issues vouchers**, so no e-money/PSD2/VAT exposure here.
- **Deliverables:** updated privacyverklaring (lead + owner + nudge + cookie sections, **incl. US-transfer/SCC disclosure for Resend**), AVG-compliant email footers with unsubscribe, consent text versions, retention schedule, verwerkersregister entries (with corrected residency facts), huisregels legal review, TIA for Resend.

---

### Data / Analytics

**Events to track** (privacy-respecting, EU-resident analytics — see §7):
- `aanmelden_view`, `aanmelden_submit`, `lead_confirm` (double-opt-in), `invite_sent`, `invite_claimed` (the funnel).
- `owner_login`, `owner_edit_submit`, `owner_photo_upload`.
- `moderation_approve`, `moderation_reject` (with type + latency derived from timestamps — **sourced from `moderation_log`, the source of truth, not client analytics**).
- `nudge_sent`, `nudge_resulted_in_edit` (join `nudge_log.resulted_edit_at` → next owner_edit).
- `help_view`, `help_article_view`, `support_contact`.

**KPIs / dashboards** (§12). Two surfaces:
1. **Ops dashboard** (`/admin` extension, server-rendered from D1): claimed %, active owners, queue depth, oldest-pending age, median time-to-approve (computed from `moderation_log`), invited-not-claimed list (drives the follow-up rota). The operational cockpit — must exist **in-product**, not just in an analytics tool.
2. **Marketing/funnel dashboard** (analytics tool): the acquisition funnel + help engagement.

**Instrumentation:** most operational KPIs come **server-side from D1** (`leads`, `owner_business`, `moderation_log`, `nudge_log`) — accurate and consent-free. Client analytics only for page-view/funnel, behind the cookie/consent banner where required.

---

### Operations / Owner-relations — CENTRAL

**Acquisition operating rhythm:**
- **Outreach waves:** Saskia + 1 volunteer walk a cluster of the street per week with leave-behind cards (each pre-printed with that business's QR claim link). Target: ~10 conversations/week → full street in ~7 weeks.
- **Follow-up rota:** the "invited but not claimed in 7 days" admin list drives a phone/in-person nudge. Three touches max, then pause.
- **Do-it-for-them:** for reluctant owners, Saskia enters the edit herself (admin can edit any listing) and gets verbal sign-off — lowers friction to near zero.

**Moderation playbook:**
- **SLAs:** text edits ≤48h, photos ≤72h, review-related actions ≤72h. Published to owners. **[REVIEWER]:** only promise "binnen seconden live" once `d1-next-tag-cache` ships; until then say "binnen enkele minuten."
- **Rota:** 2 moderators, weekly primary/secondary handoff; claim-lock prevents collisions; secondary covers holidays.
- **Escalation:** contested rejection or T&S incident → district-association board within 5 working days; documented decision.
- **Decision rubric:** approve if accurate + own content + on-brand + policy-clean; otherwise reject with the matching template. Borderline → secondary moderator second opinion.
- **Rejection tone:** always warm, specific, with the fix ("we plaatsen 'm graag zodra…"). Never terse.

**Support:** `/help` self-serve first; `info@ondernemersvandekamp.nl` as the human channel, monitored on the same rota, target first-response <2 business days. Common questions feed back into `/help`.

**Onboarding kit for new moderators:** the playbook doc + rubric + template library + a 30-min walkthrough.

---

## 5. Data model & API

### D1 DDL — `migrations/0003_owner_ops.sql`

```sql
-- Acquisition funnel intake
CREATE TABLE leads (
  id            TEXT PRIMARY KEY,            -- crypto.randomUUID()
  business_id   TEXT,                        -- seed id if claiming an existing listing (nullable for new); validated against seed
  business_name TEXT NOT NULL,
  contact_name  TEXT NOT NULL,
  email         TEXT NOT NULL,               -- lowercased
  phone         TEXT,
  address       TEXT,
  instagram     TEXT,
  story         TEXT,
  status        TEXT NOT NULL DEFAULT 'new', -- new | confirmed | approved | rejected | converted
  consent_text  TEXT NOT NULL,               -- exact consent string shown (versioned)
  consent_at    INTEGER NOT NULL,            -- epoch ms
  confirm_token TEXT,                        -- double-opt-in token (nullable after confirm/expiry)
  confirm_at    INTEGER,                     -- epoch ms when email confirmed
  source        TEXT,                        -- 'qr' | 'web' | 'admin' | 'outreach'
  reviewed_by   TEXT,                        -- profile id
  reviewed_at   INTEGER,
  reason        TEXT,                        -- rejection reason
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_leads_status  ON leads(status, created_at);
CREATE INDEX idx_leads_confirm ON leads(confirm_token);
CREATE INDEX idx_leads_email   ON leads(email);          -- erasure sweep + dedupe
-- Dedupe is enforced in code (one non-rejected lead per (email,business_id) within 30d),
-- not as a UNIQUE constraint, because a re-application after rejection is legitimate.

-- Claim tokens binding an email + business to a listing before first login
CREATE TABLE owner_invites (
  token       TEXT PRIMARY KEY,             -- 64-hex random, single-use
  email       TEXT NOT NULL,                -- lowercased; binding only fires when == authenticated email
  business_id TEXT NOT NULL,                -- seed id to bind on claim
  lead_id     TEXT,                          -- nullable backref to leads.id
  invited_by  TEXT NOT NULL,                -- admin profile id
  expires_at  INTEGER NOT NULL,             -- +14 days
  claimed_at  INTEGER,                       -- null until consumed (idempotent)
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_owner_invites_email ON owner_invites(email);

-- Immutable audit log of every moderation / ownership action
CREATE TABLE moderation_log (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT NOT NULL,                -- admin profile id (or 'system')
  action      TEXT NOT NULL,               -- approve_edit | reject_edit | approve_photo | reject_photo |
                                            -- approve_lead | reject_lead | invite_owner | purge_business |
                                            -- purge_profile | purge_lead | claim_item | reassign_item
  target_type TEXT NOT NULL,               -- override | media | lead | owner_business | profile
  target_id   TEXT NOT NULL,
  business_id TEXT,
  detail      TEXT,                          -- JSON: reason, template id, diff summary
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_modlog_target ON moderation_log(target_type, target_id);
CREATE INDEX idx_modlog_actor  ON moderation_log(actor_id, created_at);

-- Retention / nudge bookkeeping (prevents re-spamming)
CREATE TABLE nudge_log (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  email       TEXT NOT NULL,
  kind        TEXT NOT NULL,               -- freshness | seasonal_hours | claim_followup | reengage
  window_key  TEXT NOT NULL,               -- e.g. '2026-H1' or '2026-12' to dedupe per window
  sent_at     INTEGER NOT NULL,
  resulted_edit_at INTEGER                  -- set when a subsequent edit lands (attribution)
);
CREATE UNIQUE INDEX idx_nudge_dedupe ON nudge_log(business_id, kind, window_key);
CREATE INDEX idx_nudge_email ON nudge_log(email);         -- erasure sweep

-- In-app rate limiter (Free-plan WAF gives only ONE rule; this is the primary control)
CREATE TABLE rate_limit (
  bucket      TEXT NOT NULL,               -- 'lead' | 'magic' | 'confirm'
  identifier  TEXT NOT NULL,               -- CF-Connecting-IP or lowercased email
  window_start INTEGER NOT NULL,           -- epoch ms, floored to the window
  count       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket, identifier, window_start)
);
-- pruned nightly by cron

-- Moderation claim-lock on existing tables
ALTER TABLE business_overrides ADD COLUMN claimed_by TEXT;
ALTER TABLE business_overrides ADD COLUMN claimed_at INTEGER;
ALTER TABLE business_media     ADD COLUMN claimed_by TEXT;
ALTER TABLE business_media     ADD COLUMN claimed_at INTEGER;

-- Reverse-lookup index for ownership ("who owns X")
CREATE INDEX idx_owner_business_business ON owner_business(business_id);
```

### R2 key conventions
No new buckets. Reuses `kamp-photos` with the existing `business/{businessId}/{uuid}-{hex4}.{ext}` convention. Leave-behind QR PDFs/cards are **generated on demand and not stored** (no R2 lifecycle policy to maintain). Owner alt-text is stored as an override field, not in R2.

### Route handlers / Server Actions

```
POST /api/aanmelden
  req:  { business_id?, business_name, contact_name, email, phone?, address?,
          instagram?, story?, consent:true, hp?: "" /*honeypot must be empty*/ }
  resp: 202 { ok:true }            // always ok-shaped; in-app rate-limited; validates business_id
                                   // against seed; dedupes; sends confirm email; notifies admins
  resp: 429 { ok:false }           // only when the in-app limiter trips (Design has a "even wachten" state)

GET  /api/aanmelden/confirm?token=<hex>
  -> 302 /aanmelden/bevestigd      // flips lead new->confirmed, single-use, 7-day TTL
  -> 410                            // expired/used  (UI offers "vraag een nieuwe link")

Server Action submitLead(FormData)        // on-site form -> same createLead()
Server Action approveLead(id)             // admin; lead -> approved; modlog
Server Action rejectLead(id, reason)      // admin; lead -> rejected; emails applicant; modlog
Server Action inviteOwner({leadId?, email, businessId})
   // db.batch([upsert profiles?, INSERT owner_business, INSERT owner_invites, INSERT modlog]);
   // then email magic-claim (.catch-wrapped). ATOMIC — D1 has no interactive txns on Workers.
Server Action claimModerationItem(table, id)      // table is an allow-listed enum
Server Action reassignModerationItem(table, id)
// completeLogin(token) extended: after session creation, if an unclaimed/unexpired owner_invites
//   row's email == authenticated email -> mark claimed_at, ensure owner_business (idempotent),
//   flip backref lead -> converted. Bind ONLY on email match. Idempotent on double-click.

GET  /auth/callback?token=<hex>           // existing; login side-effect now resolves owner_invites
```

### Third-party calls / webhooks
- **Resend** (HTTPS `POST https://api.resend.com/emails`, existing helper): applicant confirmation, admin lead notification, magic-link claim invite, freshness/seasonal nudges. No inbound webhook for MVP; optionally consume Resend bounce/complaint webhooks later to suppress bad addresses and honour erasure. **[REVIEWER]:** Resend stores recipient PII in the **US** (SCCs apply, see Legal).
- **No payment/review API in this epic.**

---

## 6. User flows & state machine

**Lead state machine:** `new → confirmed → approved → converted` (happy path); `new → (expire 30d) → purged`; `confirmed → rejected`; `confirmed → (12mo) → purged`. (Re-application after `rejected` creates a fresh lead — allowed.)

**Invite state machine:** `created → claimed` (login consumes the matching-email invite, `owner_business` ensured, lead → converted); `created → (expire 14d) → expired` (admin can re-invite, re-issuing a fresh token).

**Moderation item:** `pending → claimed_by(X) → approved | rejected`; reject carries reason; both write `moderation_log`; approve invalidates cache (via tag-cache override when present, else ISR window).

**Ordered happy path:** submit lead → confirm email → admin approve+invite → owner clicks claim → logged in + bound → owner edits (pending) → moderator approves → live (seconds with override / minutes without) → 180d later nudge → owner refreshes.

**Edge cases & failures:**
- *Double submission / spam:* honeypot + in-app rate-limit + dedupe on `(lower(email), business_id)` within 30d → return ok-shaped, don't create duplicate.
- *Invalid/unknown `?b=`:* server validates against the seed; unknown id → treat as a "new business" lead (no pre-fill), never echo unvalidated text.
- *Confirm link expired/used:* 410 + "vraag een nieuwe link" CTA.
- *Owner claims a business already owned:* admin verification gate prevents issuing the invite; a deliberate second co-owner is a separate intentional admin `owner_business` insert.
- *Claim link forwarded / email mismatch:* `completeLogin` binds **only** the invite whose email == authenticated profile email; otherwise logs in without binding and shows "deze uitnodiging hoort bij een ander e-mailadres." **(Anti-hijack — do not bind by token alone.)**
- *Invite double-click:* invite-consumption is idempotent (`claimed_at` set once; `owner_business` insert `ON CONFLICT DO NOTHING`).
- *`inviteOwner` partial failure:* `db.batch()` makes it all-or-nothing; covered by integration test.
- *Invite never claimed (7/14d):* surfaces in admin follow-up list; cron expires at 14d; admin re-invites.
- *Resend down:* send is `.catch()`-wrapped; lead/invite still persists; admin sees it and can resend manually; the link is surfaced in Worker logs **only when no mailer is configured** (existing guard).
- *Moderation collision:* claim-lock + "dit item wordt al behandeld door X" warning; reassign breaks a stale lock.
- *GDPR erase mid-funnel:* `purgeLead`/`purgeProfile` removes all traces **including the email-match sweep of `leads`/`owner_invites`/`nudge_log`** (these don't cascade via FK — see Legal).
- *Nudge double-send:* `idx_nudge_dedupe` unique constraint hard-blocks duplicates per window.
- *Cron DST drift:* handler recomputes Amsterdam local time and guards the weekly job (UTC cron can't express a timezone).

---

## 7. Third-party choices

**Transactional email (invites, confirmations, nudges):**
| Option | Data residency / GDPR | Fit | Cost |
|---|---|---|---|
| **Resend** (already integrated) | **Dispatch from EU (Ireland) but ACCOUNT DATA/LOGS/METADATA in the US → SCCs + DPA, not EU residency** | Native to the codebase (`api.resend.com/emails`), Workers `fetch()`-friendly | Free 3k/mo & **100/day**; €18/mo (~50k) |
| **Brevo** (ex-Sendinblue) | **EU-hosted (FR)** — genuine EU residency | Adds a vendor; REST API Workers-friendly | Free tier; paid from ~€7/mo |
| **Scaleway TEM** | **FR/EU residency** | French cloud; REST API | ~€0.25/1k emails |
| Postmark | US-based; EU options limited | Second vendor | ~$15/mo |

**→ Recommend:** keep **Resend** for the lean MVP **with SCCs + DPA + a TIA + privacyverklaring disclosure of the US transfer** — *and explicitly correct the "Resend = EU resident" claim in the project memory.* If the association wants true EU residency (a reasonable AVG posture for a public-sector-adjacent local body), **Brevo (FR)** is the low-friction switch. Either way: verified subdomain `send.ondernemersvandekamp.nl` (SPF/DKIM/DMARC) and short log retention.

**Analytics (funnel + help engagement):**
| Option | Residency / GDPR | Fit | Cost |
|---|---|---|---|
| **Cloudflare Web Analytics** | cookieless, no PII, no consent banner needed | Native to the stack, zero-config | Free |
| Plausible (EU-hosted) | EU residency, cookieless | Lightweight funnels | ~€9/mo |
| Umami (self-host on Workers/D1) | Full EU control | More ops burden | Free + hosting |

**→ Recommend Cloudflare Web Analytics for page/funnel basics, with operational KPIs computed server-side from D1** (source of truth). Add Plausible only if richer funnel analysis is needed. Avoid GA4 (consent-banner + transfer complexity).

**QR generation:** server-side, edge-safe (`next/og` route or pure-JS encoder verified Worker-compatible) — no third-party SaaS, no scan logging off-platform.

**Print (leave-behinds):** any local Amersfoort drukkerij; design exports CMYK PDF. ~€50–100 one-off.

---

## 8. Milestones & sequencing

1. **M1 — Lead-capture backend + scheduled-Worker spike (1.5 wk).** `0003` migration (`leads`, `rate_limit`), `createLead()` shared lib, `POST /api/aanmelden` + `submitLead`, **in-app rate limiter**, double-opt-in confirm, Resend applicant + admin emails, `/admin/aanmeldingen` queue, replace `mailto:`. **Spike: confirm OpenNext exposes a `scheduled()` hook or decide on the separate-cron-Worker fallback.** *Deliverable: a real, GDPR-consented lead funnel + a cron decision.*
2. **M2 — Claim-to-portal invite (1–1.5 wk).** `owner_invites`, **`inviteOwner` (atomic `db.batch`)** — the keystone, gives `owner_business` a UI — extend `completeLogin` (email-matched, idempotent), claim-link email, integration test for the partial-failure + double-click paths. *Deliverable: admin onboards an owner end-to-end in two clicks.*
3. **M3 — Moderation tooling + playbook (1 wk).** `moderation_log` + claim-lock columns, queue filter/sort, rejection templates, audit peek; written SLA/rota/escalation/rubric docs. *Deliverable: a moderation operation a 2-person team can run.*
4. **M4 — Help centre + support + alt-text + leave-behind kit (1–1.5 wk).** `/help` + articles + `HelpDrawer`, support routing, **photo alt-text field**, printable QR card PDF. *Deliverable: owners self-serve; association has outreach materials.*
5. **M5 — Trust & safety + policy + Legal corrections (1 wk).** Huisregels, content/photo policy, photo-rights attestation checkbox, takedown/appeal path, **privacyverklaring + verwerkersregister rewrite (Resend US-transfer/SCC, corrected residency facts), TIA, `purgeLead` + erasure email-sweep**. *Deliverable: defensible moderation + correct AVG posture.*
6. **M6 — Engagement engine + KPIs (1 wk).** Cron nudges (`nudge_log`, DST-guarded), ops dashboard (claimed %, queue age, time-to-approve, invited-not-claimed), analytics events. *Deliverable: retention loop + the cockpit.*

Run M1→M2 strictly first (they unblock the campaign). M3–M6 can overlap. Outreach waves begin the moment M2 ships **and** the auth rate-limit + verified sending subdomain are live.

---

## 9. Dependencies
- **Hard blocker:** production launch + Cloudflare hardening (real `database_id`, deployed). Nothing here works pre-deploy.
- **Auth rate-limit (in-app D1 limiter + single WAF backstop)** — acquisition drives traffic to magic-link endpoints; must be hardened **before** outreach. **[REVIEWER]: this is now in-scope here, not assumed free from WAF.**
- **d1-next-tag-cache override** (Backend/Infra epic) — for instant approval visibility/owner trust. Strongly recommended before outreach scales; owner copy must not promise "seconden" until it lands.
- **Resend production config** in `/admin/instellingen` + verified sending subdomain + **SCC/DPA paperwork** (Legal).
- **Shared scheduled Worker / cron infra** — nudge + lead-expiry + rate-limit-pruning jobs; resolve the OpenNext `scheduled()` vs separate-Worker question in M1.
- **GBP/Reviews epic** — review-request acquisition flow co-owned; review-moderation SLA defined here.
- **Design-system epic** — shared `KampInput`/`<Alert>` + portal brand uplift (soft dependency; don't block the funnel on it).
- **SEO epic** — owns `schema.ts`; coordinate the `dateModified` addition rather than editing it here.
- **i18n decision** — `lang="nl"` now; EN help is Later.

---

## 10. Risks & mitigations
(See structured `top_risks` — summarised.)
- **Low adoption** → do-it-for-them + "claim, niet aanmelden" framing + QR + face-to-face outreach.
- **Invite emails in spam** → verified subdomain + DMARC + invited-not-claimed follow-up rota.
- **Resend US-transfer GDPR exposure (corrected)** → SCCs + DPA + TIA + privacyverklaring disclosure, or switch to Brevo (FR). Correct the false "EU residency" claim in memory/docs.
- **Free-plan WAF can't rate-limit four endpoints (corrected)** → in-app D1 limiter as the primary control; single WAF rule as a coarse backstop.
- **`inviteOwner` partial write orphaning an owner** → atomic `db.batch()` + integration test.
- **Listing hijack via forwarded claim link** → bind ownership only on email match in `completeLogin`; invite-only `owner_business`; pending-by-default edits.
- **Erasure leaving lead/invite/nudge PII behind** → email-match sweep added to `purgeProfile`/`purgeLead`.
- **Tiny team capacity** → automate every chore (one-click invite, cron nudges, templates); keep the human surface to outreach + judgement only.

---

## 11. Acceptance criteria / Definition of Done
- [ ] `/aanmelden` writes a `leads` row via Server Action (no `mailto:`), with consent text + version + timestamp stored; `?b=` validated against the seed.
- [ ] Double-opt-in: applicant receives + can confirm (7-day TTL); lead flips `new→confirmed`; admin notified; expired/used confirm link returns 410 with a re-request CTA.
- [ ] In-app D1 rate limiter enforced on `/api/aanmelden`, magic-link request, and confirm; single WAF rule documented as the backstop. (No reliance on multiple free WAF rules.)
- [ ] Admin can approve a lead and **invite an owner in one atomic `db.batch` action** that creates `profiles` + `owner_business` + `owner_invites` + `moderation_log` and sends a claim email; partial-failure path covered by a test.
- [ ] Claim link logs the owner in **and** binds ownership **only when the invite email matches the authenticated email**; idempotent on double-click; owner lands in `/beheer` pre-scoped; lead → `converted`.
- [ ] Every moderation/invite/lead/purge action writes an immutable `moderation_log` row.
- [ ] Moderation queue supports filter/sort, shows item age + oldest-pending age, and a claim-lock with reassignment ("wordt behandeld door X").
- [ ] Rejection emails use approved Dutch templates; tone reviewed by Content.
- [ ] Photo upload captures **alt text**; photo-rights attestation enforced and recorded.
- [ ] `/help` live with FAQPage schema (40–60-word answers, `dateModified`), ≥8 Dutch guides, focus-trapped in-portal `HelpDrawer`.
- [ ] Huisregels + content/photo policy published; takedown/appeal path documented.
- [ ] Cron prunes expired tokens/sessions/invites/rate_limit + unconfirmed leads (30d) + unconverted leads (12mo); sends freshness + seasonal nudges with `nudge_log` dedupe and a working opt-out; weekly job DST-guarded.
- [ ] `purgeProfile`/`purgeLead` sweep `leads`/`owner_invites`/`nudge_log` by email (no orphaned PII).
- [ ] Ops dashboard shows claimed %, active owners, queue depth, median time-to-approve, invited-not-claimed.
- [ ] `lang="nl"` set; moderation diff no longer colour-only; focus-ring contrast fixed (`--amber-ink`/white).
- [ ] Privacyverklaring + verwerkersregister updated **with the corrected Resend US-transfer/SCC facts**; TIA filed; verified sending subdomain configured.
- [ ] Migration `0003` applies cleanly on top of `0001`+`0002`, local + remote; build stays green; existing JSON-LD/SSG unbroken; no `aggregateRating` added to business pages.

## 12. KPIs & success metrics
- **% claimed:** 60% (40/67) by month 3, 80% by month 6.
- **Active owners** (login/edit in trailing 90d): ≥50% of claimed.
- **Median time-to-approve:** edits <48h, photos <72h (from `moderation_log`).
- **Lead→claim conversion:** ≥60% of invites claimed within 14d.
- **Listing freshness:** ≥70% of listings `updatedAt` within 180 days.
- **Queue health:** oldest pending item <SLA at all times; median queue age trending down.
- **Support:** first-response <2 business days; ticket volume per active owner trending down (help deflection).
- **Decision quality:** rejection rate stable; appeal/dispute rate <5%.
- **Deliverability:** invite/confirm bounce rate <3%; spam-complaint rate <0.1% (verified subdomain + DMARC working).

## 13. Cost
**One-off:** print run of leave-behind cards/QR stickers ~€50–100; design/content time (internal); legal review of privacyverklaring/policy + **Resend TIA/SCC paperwork** (internal or ~€0–500 if outsourced).
**Monthly at this scale:** Resend free tier covers MVP volume (well under 3k/mo and 100/day for 67 owners + occasional nudges); €0. Cloudflare Web Analytics €0. D1/R2/Workers within existing free/near-free usage; the new tables are tiny. **[REVIEWER] cost caveat:** if broader edge rate-limiting beyond the single free WAF rule is wanted, Cloudflare **Pro is ~$20/mo** — but the in-app D1 limiter avoids that, keeping recurring cost at **€0–18/month** (€18 only if Resend volume crosses the free tier or Plausible is added; €0 if a Brevo free tier replaces Resend). Fits the lean €0–25/mo budget.

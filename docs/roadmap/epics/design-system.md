# Design System & UX Overhaul — "De Kamp leeft." matured into a documented, accessible, conversion-tuned system

> Formalize the design tokens (WCAG-AA focus ring, type, spacing, radius, shadow, motion) in Tailwind v4 `@theme` + a Figma variable library; document the component catalog with every state in Ladle; brand-uplift the owner portal `/beheer` and admin `/admin` (the surfaces that drive owner adoption); ship a real WCAG 2.1 AA pass; keep MapLibre and make it keyboard-accessible; build the **`/aanmelden` lead-capture backend** (genuinely unowned today); and replace the brand-critical `mailto:` and link stubs by **wiring the UI to the Newsletter and Reviews epics' backends** (this epic ships the components, not those backends).
> **Recommended phase:** Phase 4, immediately after production launch + Cloudflare hardening. The token/a11y/portal/admin slice (M1–M4) can run in parallel with launch; the backend-wired UX (M5) follows once deploy + a real `database_id` are live.
> **Effort:** 6–9 weeks (small/part-volunteer team; 2 FE, 1 BE, 1 design, shared SEO/content/legal). Revised down from the draft's 6–10 because the newsletter and reviews *backends* are no longer in scope here (see §0).
> **Teams:** Frontend, Backend/Infra, SEO/GEO/AEO, Design/UX, Content/Localization, Growth, Legal/Compliance, Data/Analytics, QA/Release, Product/PM, Owner-relations/Operations.

---

## 0. Adversarial review notes (what changed from the draft and why)

This is the finalized document. The skeptical pass found the following and corrected them:

1. **The draft duplicated the Newsletter epic's entire backend — and conflicted with it.** The draft defined a `newsletter_subscriptions` table + `subscribeNewsletter` action + `/api/newsletter/confirm|unsubscribe` handlers. But `docs/roadmap/epics/newsletter.md` already owns this, with a **different, canonical** schema (`newsletter_subscribers`, plus `newsletter_events` audit and `newsletter_deliveries`), `unsub_token` + `confirm_token` split, `consent_text_version`/`consent_ip`, bounce/complaint handling, RFC 8058 one-click, and a `subscribe()` shared lib. Shipping a parallel table would be a **data-model fork**. **Corrected:** this epic ships **only the `<NewsletterForm>` UI component**, which calls the Newsletter epic's existing Server Action / `subscribe()` path. No newsletter D1 table, no confirm/unsubscribe handlers here. Newsletter is a hard dependency, not a deliverable.
2. **The draft's reviews contract ("fetch `/api/reviews` on mount, never caches, live GBP read") contradicts the Reviews epic.** `docs/roadmap/epics/google-reviews.md` explicitly **rejected** request-time live GBP fan-out (quota-fragile, and it would force decrypting an owner's write-capable OAuth token on anonymous public requests). It replaced it with a **cron-synced ephemeral snapshot**: `/api/reviews/[businessId]` reads a D1 `review_snapshot` + cached numeric `rating`/`count`, returns `{ display:false }` below the threshold, and sets `Cache-Control: public, max-age=900` (15-min edge cache, never persisted to ISR). **Corrected:** `GoogleReviewsStrip` consumes that exact contract verbatim — including `{ display:false }`, the SSR aggregate line, the ≤5 client-fetched cards, and graceful link-out fallback. "Never caches" was wrong; "never persisted to D1/R2 ISR, 15-min edge cache" is right.
3. **`leads` is genuinely unowned — kept here, and added to the GDPR purge path.** No other epic specifies the `/aanmelden` lead funnel, so this epic owns `migrations/0003_leads.sql`, `submitLead`, and the admin Leads tab. **Legal invariant added:** `leads` holds personal data (contact name + email of an applicant), so per `docs/roadmap/playbooks/legal.md` it **must** be added to `purgeProfile()`/`purgeBusiness()` in `src/lib/gdpr.ts` (delete leads by email on profile erase; by `business_id` on business erase) and to the RoPA before merge. The draft omitted this.
4. **"Resend EU region endpoint" is wrong.** Resend's API host is `https://api.resend.com` for everyone; **EU data residency is a region setting chosen at sending-domain/account creation**, not a different endpoint. Corrected throughout: the requirement is "sending domain created in Resend's EU region + signed DPA," not "call an EU endpoint."
5. **Cloudflare image transforms: free-tier math corrected and failure mode named.** Cloudflare Image Transformations free tier = **5,000 unique transformations/month**; over that, Free-plan transforms **fail with error 9422 (fail-closed), not silent billing**. At ~67 businesses × a handful of widths × AVIF/WebP, unique transforms are well under 5,000/mo, so this is **€0**, not "€0–5". Documented the 9422 fallback (serve the already-`immutable`-cached original) so a quota blip never breaks an image.
6. **Turnstile server-verify must use `fetch`/Web Crypto, not Node.** Confirmed no Node-only assumption survives: the siteverify call is a plain `fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', …)` from the Worker — fine under `nodejs_compat`. No `nodemailer`/SMTP anywhere (Workers can't open raw TCP; Resend HTTP API only). Ladle and stylelint are **dev/build-time** tools, never in the Worker bundle.
7. **Framer Motion reduced-motion needs a JS guard, not just CSS.** The existing CSS `prefers-reduced-motion` rule collapses CSS transitions but does **not** govern Framer Motion's JS-driven values. Added `src/lib/motion.ts` with a `useReducedMotion()`-aware preset so Framer durations collapse to `0.001` — the CSS rule alone is insufficient.
8. **`<html lang="nl">` and the focus-ring fix are pulled to M1 day-one** — both are one-line WCAG/AEO wins with zero dependency on anything else.
9. **VAT / e-money / PSD2 / voucher law is correctly out of scope** (that's the Cadeaukaart/Payments epic). This epic only *styles* the `/cadeaukaart` placeholder; it touches no money flow. Confirmed nothing here triggers payments-law obligations.
10. **`canEdit` and existing server-action signatures are untouched.** Portal/admin uplift is strictly presentational — no change to `beheer/actions.ts` or `admin/actions.ts` business logic, matching the audited invariants. New admin actions (`updateLeadStatus`, `promoteLeadToOwner`) are additive and `requireAdmin`-gated.

---

## 1. Goal & value

The public site already looks premium. The problem is fourfold, each mapping to a concrete risk:

1. **The adoption surfaces look like a generic CMS.** `/beheer` and `/admin` use none of the brand tokens — plain white forms, `font-semibold` instead of Playfair, raw `bg-sage/60` banners instead of named Alerts. The owners self-managing their listing judge the *whole product* by the portal. A portal that feels unfinished depresses the single most important funnel: owners claiming and enriching their own listing — which is also the freshness engine that powers our AEO citations. **Value: owner trust → more claims → fresher owner-verified content → better local-pack + AI-citation performance.**

2. **The system is undocumented and untokenized.** Type sizes are ad-hoc (`text-[15vw]`, `text-7xl`, `text-3xl` across ~20 components), spacing is raw Tailwind, motion durations are hardcoded per component, there is no Storybook/Ladle. Any rebrand, type audit, or new-contributor onboarding requires reading every file. **Value: velocity + consistency for a part-volunteer team; a single-file type/spacing change instead of a 20-file hunt.**

3. **The brand-critical interactions are fake.** The newsletter is a `mailto:` href; `/aanmelden` submits via `window.location.href = mailto:` (unreliable on mobile, no server record, no confirmation); the reviews "widget" is a single link with no rendering; social icons point at `#`. These are trust and conversion leaks on the exact surfaces that grow the district. **Value: real, GDPR-clean capture funnels the admin operates from `/admin`, not an inbox.** (Newsletter + reviews backends are delivered by their own epics; this epic delivers the *lead* backend and wires all three UIs.)

4. **Accessibility is borderline-failing in two SC-level ways.** The global `:focus-visible` ring is `--amber #c9822b` on `--background #f6f0e2` ≈ **3.2:1** — below WCAG 2.1 SC 1.4.11 (3:1 non-text minimum) and invisible on dark surfaces. `<html>` has **no `lang`** attribute. `HoursTable` uses `text-white/40` on charcoal (likely < 4.5:1). For an EU commercial digital service, AA is a baseline obligation; the **European Accessibility Act** (transposed into the Dutch *Wet toegankelijkheid producten en diensten*, in force from 28 June 2025) raises the stakes for in-scope services. **Value: legal defensibility, inclusive reach, and AA as a positive CWV/quality signal.** (Whether De Kamp's guide is strictly *in scope* under the EAA is a Legal determination — see §4 Legal — but we target AA regardless.)

The district wins a documented, accessible, conversion-tuned brand system; owners win a portal worth being listed in; visitors win faster, more legible, more navigable pages.

---

## 2. How it works in real life

**Personas & real seed businesses:** *Sanne*, 34, owner of **Lavanche** (chocolatier on De Kamp); *Tom*, visitor from Utrecht; *Mariëtte*, the district-association volunteer who moderates at `/admin`.

### Journey A — Sanne enriches her listing (owner portal, post-uplift)
1. Sanne clicks her magic link, lands on `/beheer`. Instead of a bare white list, she sees the **branded portal shell**: the familiar Navbar, a forest-green sub-header "Welkom terug — Lavanche" with an amber avatar initial, her listing card in `--paper` with a Playfair heading. Same world as the public site.
2. She opens `/beheer/lavanche`. The edit form uses the shared **`KampInput`/`KampTextarea`** components — same rounded-2xl, same accessible dual-tone focus ring as the public `/aanmelden` form. A sticky **`Alert variant="info"`** explains "Wijzigingen worden ter controle ingediend" in the brand voice.
3. She drags a new hero photo onto the **`PhotoUpload`** dropzone. Instant client-side **preview**, a **progress bar** during the R2 upload (still the existing `uploadPhoto` Server Action, 6 MB body cap), then an inline **`Alert variant="success"`** — no hard navigation, no `?photo=pending` query-param flash.
4. She edits hours + short description and submits. Approval bumps `updatedAt`, so `dateModified` fires on the next revalidation (AEO freshness).

### Journey B — Tom discovers the district (public, polished)
1. Tom searches "chocolade Amersfoort binnenstad", lands on `/categorie/eten-drinken`. Cards now show a **2-line description excerpt** under the specialty tags — better scanning for him, more entity signal for the AI crawler that surfaced the page.
2. He taps through to Lavanche. LCP is fast: the hero is a responsive AVIF served via Cloudflare Image Transformations from the R2 original. On the right rail, **`GoogleReviewsStrip`** (when the Reviews epic has connected Lavanche and it's above the review-count threshold) shows the SSR-rendered "4,6 ★ · N reviews op Google" line plus up to 5 snapshot review cards fetched client-side, the **Google "G" logo + "Bekijk alle reviews op Google Maps"** link-back unobscured. Below threshold or unconnected → the component renders the plain link-out (the API returns `{ display:false }`).
3. He opens the mini-map. With a keyboard he can **"Sla kaart over"** (skip-link) or tab through a source-ordered business list; the MapLibre canvas is a visual enhancement, not a keyboard trap.
4. At the footer he enters his email in the **real `<NewsletterForm>`** (powered by the Newsletter epic's `subscribe()` action), ticks the consent box, and gets the double-opt-in confirmation email. He's a GDPR-clean subscriber, not a lost `mailto:`.

### Journey C — Mariëtte moderates (admin, polished)
1. `/admin`'s moderation queue now has **sort, filter, pagination, and bulk-approve**. The diff view shows old→new with an **icon + ARIA label** ("verwijderd"/"nieuw"), not colour-and-strikethrough alone.
2. A new **Leads tab** shows applications from `/aanmelden` (now a real D1 `leads` row, not an inbox email). She clicks "Promoveer tot eigenaar" on a verified applicant → after a human verification step it INSERTs `owner_business` → the owner can now log in. The last manual-only gap is closed in the UI.
3. A **Nieuwsbrief tab** is owned by the Newsletter epic; this epic only ensures the admin shell has the slot/nav for it (no double build).
4. A GDPR purge runs behind a **focus-trapped confirm modal** (typed business name), not a bare text field.

---

## 3. Scope

**In**
- Tokenize type scale, spacing scale, motion presets; finalize radius/shadow/colour tokens in `globals.css` `@theme inline` + a mirrored **Figma variable library**.
- Component catalog: extract shared primitives (`KampInput`, `KampTextarea`, `KampSelect`, `KampButton`, `Alert`, `Badge`, `Card`, `ConfirmModal`) and document every state (default/empty/loading/error/success/disabled) in **Ladle**.
- Owner portal `/beheer` + admin `/admin` full brand uplift (**presentational only**; `actions.ts` logic untouched).
- **`/aanmelden` lead-capture backend** (D1 `leads` + Resend + Turnstile) replacing the `mailto:` — *this epic owns it*.
- `<NewsletterForm>` UI component wired to the **Newsletter epic's** `subscribe()` Server Action — replacing the footer `mailto:`. *Backend owned by newsletter.md.*
- `GoogleReviewsStrip` display component consuming the **Reviews epic's** `GET /api/reviews/[businessId]` snapshot contract — display + attribution only. *Backend owned by google-reviews.md.*
- Full WCAG 2.1 AA audit + fixes (focus ring, `lang=nl`, contrast, skip-links, map keyboard path, Framer reduced-motion JS guard) + **axe-core CI gate**.
- Image/LCP strategy: Cloudflare Image Transformations in front of R2 originals (AVIF/WebP, width-stepped), generative-placeholder CLS tuning.
- **Map decision: keep MapLibre** (§7), add accessible parallel list.
- `BusinessCard` description excerpt; nav IA unified via `src/lib/nav.ts`; Footer social icons with real brand SVGs + accessible labels.
- Design-ops: handoff docs, stylelint token-lint gate, published Ladle catalog.
- Real `/privacy` page + processor-register/privacy-policy update (the `#` placeholder is a launch blocker that this UX work surfaces).

**Out (owned by other epics)**
- **Newsletter backend** — `newsletter_subscribers` table, double-opt-in, confirm/unsubscribe handlers, digest, `/links`, social embeds → **Newsletter epic**. This epic ships only the `<NewsletterForm>` island + `/admin` nav slot.
- **GBP OAuth, `place_id`/`business_google`/`review_snapshot`, the `/api/reviews` handler, the cron sync, the acquisition QR** → **Reviews epic**. This epic ships only `GoogleReviewsStrip`.
- Full NL/EN bilingual content + locale routing → **i18n epic**. This epic ships `lang=nl` + string-externalization scaffolding only.
- Payments / Kamp Cadeaukaart product → **Payments epic**. This epic styles the placeholder page only.
- Events data + `/agenda` content → **Events epic**. This epic styles the shell.
- Production deploy, real `database_id`, tag-cache override, WAF baseline → **Launch/Infra epic**.

**Later**
- Figma → code token-sync automation (Style Dictionary / Tokens Studio).
- Visual-regression in CI (Chromatic-equivalent) once volume justifies cost.
- Per-business dynamic OG images. Dark mode (out of brand scope today).

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

> **Heed `AGENTS.md`: this is a modified Next.js 16 — read `node_modules/next/dist/docs/` before using any API. Server Components are default; add `"use client"` only where interactivity demands it.**

**Token layer (`src/app/globals.css`)** — add to `:root`, mirror into `@theme inline`:
```css
:root {
  /* TYPE SCALE */
  --text-hero: clamp(3.5rem, 12vw, 9rem);
  --text-display: clamp(2.5rem, 6vw, 3.5rem);
  --text-heading-lg: 2.5rem;
  --text-heading: 1.75rem;
  --text-title: 1.25rem;
  --text-body-lg: 1.125rem;
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-label: 0.6875rem; /* 11px uppercase eyebrow */
  /* SPACING LADDER (4px base) */
  --space-1:.25rem; --space-2:.5rem; --space-3:.75rem; --space-4:1rem;
  --space-6:1.5rem; --space-8:2rem; --space-12:3rem; --space-16:4rem;
  --space-20:5rem; --space-24:6rem;
  /* ACCESSIBLE FOCUS (SC 1.4.11) */
  --focus-ring: var(--amber-ink);   /* ~5.6:1 on light */
  --focus-ring-halo: #ffffff;
}
@theme inline {
  --text-hero: var(--text-hero); /* …map every token… */
  --spacing-1: var(--space-1);   /* … */
}
```
- **Fix the focus ring** (SC 1.4.11): dual-tone — `outline: 2px solid var(--focus-ring); outline-offset: 2px; box-shadow: 0 0 0 4px var(--focus-ring-halo);` so it's visible on **both** light and dark surfaces. Verify on `--background`, `--deep-green`, `--charcoal`.
- **`<html lang="nl">`** in `layout.tsx` — do **day one** of M1.

**Shared primitives (new, `src/components/ui/`)** — Server Components where possible; `"use client"` only for stateful ones:
- `KampInput`, `KampTextarea`, `KampSelect`, `KampButton` (variants `primary`/`secondary`/`ghost`; sizes), `Alert` (`success|warning|error|info`, icon + `role="status"`/`role="alert"`), `Badge`, `Card`, `ConfirmModal` (focus-trapped, Escape-to-close, typed confirmation). These replace the ad-hoc `field = "w-full rounded-2xl …"` strings in `AanmeldenForm` and the plain `border-stone` inputs in the portal so both surfaces share one source.

**Owner portal**
- New `src/app/beheer/layout.tsx` (Server Component): Navbar + branded sub-header (business name + avatar initial). Replace `font-semibold` h1 with `font-serif`.
- `/beheer/[id]/page.tsx`: swap inline form markup for the shared primitives; status banners → `<Alert>`. **No change to `submitEdit`/`uploadPhoto` signatures.**
- **`PhotoUpload`** (`"use client"`): rewrite to drag-and-drop with `URL.createObjectURL` preview, upload-progress (XHR/`fetch`), inline `Alert` — replacing the `?photo=` hard-nav. Still posts to the existing `uploadPhoto` Server Action. Add a client-side MIME + 5 MB pre-check **mirroring** the server's magic-byte allowlist (JPEG/PNG/WebP/AVIF) — the server check stays authoritative.

**Admin**
- `/admin/page.tsx`: extract the moderation queue into a client component with sort (newest/oldest/business), filter (pending/all, by category), cursor pagination on `submitted_at`, and **bulk-approve** (multi-select → array of ids → sequential server-action loop with per-item error capture). Diff: add an icon (`Minus` clay / `Plus` deep-green) + visually-hidden label so it isn't colour-only.
- GDPR purge: replace text-confirm with `<ConfirmModal>` (focus-trapped, Escape, typed business name).
- New **Leads** tab (Server Component reading `leads`). **Nieuwsbrief** nav slot reserved for the Newsletter epic (don't double-build the tab body).

**Public**
- `BusinessCard`: add `line-clamp-2` `shortDescription` excerpt (`text-small text-warm-brown/70`).
- `NewsletterForm` (`"use client"` island over a Server Action with `useActionState`): replace footer `mailto:`; required consent checkbox + Turnstile + hidden honeypot. **Calls the Newsletter epic's `subscribe()` lib path** — do not re-implement subscription logic. Inline pending/success/already-subscribed/error UI; progressive-enhancement friendly.
- `AanmeldenForm`: replace `window.location.href = mailto:` with `useActionState` → `submitLead` Server Action (this epic's). Keep the warm Dutch microcopy.
- `GoogleReviewsStrip` (`"use client"`): fetch `GET /api/reviews/[businessId]` on mount → if `{ display:false }` render the plain "Bekijk reviews op Google" link-out; else loading skeleton → up to 5 cards (stars, ~2-line excerpt, reviewer first name, relative time) + the SSR aggregate line + Google logo + Maps link-back. Never blocks SSR. The numeric aggregate line is rendered **server-side** by the business-detail page (reads `business_google.cached_rating/cached_count`, owned by the Reviews epic) so it's crawlable; the strip only hydrates the snippet cards.
- `src/lib/nav.ts` exporting `NAV_ITEMS` consumed by `Navbar` **and** `Footer` so desktop/mobile IA can't drift (fixes the 6-vs-7 discrepancy; add `Praktisch` to desktop).
- `src/lib/motion.ts` exporting `SPRING`, `FADE`, `CARD_HOVER`, plus a `useReducedMotion`-aware wrapper that collapses Framer durations to `0.001` under `prefers-reduced-motion` (**JS-layer guarantee** — the CSS rule does not govern Framer's JS values).
- **DistrictMap accessibility**: render a source-ordered `<ul>` of businesses (real links) adjacent to the map as the canonical keyboard path; add a `Sla kaart over` skip-link; mark decorative DOM markers `aria-hidden`; add a loading skeleton over the `#f4ecdb` container during the async `maplibre-gl` import.

**Images**: `next/image` with explicit `sizes`; `priority` on the LCP hero only; AVIF/WebP via Cloudflare Image Transformations (§5); generative `categoryArt` painted as a blur-equivalent background to avoid CLS. **Fail-closed handling:** if a transform returns error 9422 (free-tier quota), fall back to the original R2 object (already served `immutable`) so an image never breaks.

### Engineering — Backend & Infra (Cloudflare) — *priority depth*

This epic adds **1 D1 table** (`leads`), **1 server action** (`submitLead`), **2 admin actions** (`updateLeadStatus`, `promoteLeadToOwner`), an **image-transform front**, and **two GDPR-retention sweeps appended to the existing nightly cron** — all on the existing single Worker. **No newsletter or reviews backend here** (other epics).

**D1 migration** (new `migrations/0003_leads.sql`):
```sql
-- 0003_leads.sql — /aanmelden applications (personal data: see GDPR §4).
CREATE TABLE leads (
  id            TEXT PRIMARY KEY,               -- crypto.randomUUID()
  business_name TEXT NOT NULL,
  contact_name  TEXT NOT NULL,
  email         TEXT NOT NULL,                  -- lowercased on write
  phone         TEXT,
  address       TEXT,
  story         TEXT,
  instagram     TEXT,
  business_id   TEXT,                           -- set when an existing seed listing is claimed
  status        TEXT NOT NULL DEFAULT 'new',    -- new | contacted | approved | rejected
  source        TEXT NOT NULL DEFAULT 'aanmelden',
  consent_text  TEXT NOT NULL,                  -- exact privacy/consent string shown (GDPR proof)
  created_at    INTEGER NOT NULL,
  reviewed_by   TEXT,
  reviewed_at   INTEGER,
  notes         TEXT
);
CREATE INDEX idx_leads_status ON leads(status, created_at);
CREATE INDEX idx_leads_email  ON leads(email);
```
Apply via the existing `db:migrate` (`wrangler d1 migrations apply kamp-db --remote`) / `:local`. **No `place_id` and no newsletter tables here** — those belong to the Reviews and Newsletter epics respectively.

**GDPR wiring (mandatory, per `playbooks/legal.md` invariants):** extend `src/lib/gdpr.ts`:
- `purgeProfile(profileId)` → also `DELETE FROM leads WHERE email = ?` (the profile's email) — a person's pending/old application is their personal data.
- `purgeBusiness(businessId)` → also `DELETE FROM leads WHERE business_id = ?`.
Add a `leads` RoPA row before merge. The single-erasure-path invariant must hold.

**Server Action** (`src/app/aanmelden/actions.ts`) — follow the `beheer/actions.ts` pattern (FormData in, no HTTP route):
- `submitLead(formData)` → server-side validate (reject empty/invalid email) → **verify Turnstile token** via `fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method:'POST', body })` → check honeypot → `INSERT INTO leads` with the exact `consent_text` shown → Resend: admin notification (to `getAdminEmails()`) + applicant confirmation. Returns `{ ok, error? }` for `useActionState`. Rate-limited by the WAF rule on the page-origin POST.

**Admin actions** (extend `src/app/admin/actions.ts`, all `requireAdmin`-gated):
- `updateLeadStatus(id, status)` → `{ ok }`.
- `promoteLeadToOwner(formData)` `{ leadId, businessId }` → ensure/lookup a `profiles` row by the lead's email (do **not** auto-create a session) → `INSERT INTO owner_business (profile_id, business_id, created_at)` → mark lead `approved`. **Gated behind an explicit human-verification checkbox** ("ik heb geverifieerd dat deze persoon de eigenaar is") — closes the manual-only owner-add gap without auto-trusting form input.

**Security & owner-isolation**
- **Cloudflare Turnstile** (managed challenge, EU-friendly, free, no tracking cookie) on `/aanmelden` and the newsletter form — server-side token verify before any D1 write. `TURNSTILE_SECRET_KEY` via `wrangler secret put`; `NEXT_PUBLIC_TURNSTILE_SITE_KEY` as a `var`.
- **WAF rate-limit rules** (zero-cost on Workers): `5 req/min/IP` on the `/aanmelden` POST and the newsletter POST origins (the newsletter rule is shared with the Newsletter epic — coordinate, don't duplicate). Honeypot hidden field as a cheap second gate.
- Leads PII is never rendered on public routes, never in JSON-LD/llms.txt, never logged.

**Reviews-display dependency contract** (consumed, **not owned** — verbatim from `google-reviews.md`):
`GET /api/reviews/[businessId]` (route handler, `force-dynamic`, no auth) returns
`{ display:boolean, rating:number, count:number, mapsUrl:string, reviewUrl:string, reviews:[{stars,excerpt,authorFirst,relativeTime}] }`,
served from the D1 `review_snapshot` + cached numeric aggregate (**the handler never decrypts an owner token**), `Cache-Control: public, max-age=900` (15-min edge cache, **never persisted to D1/R2 ISR**). Below the review-count threshold or unconnected → `{ display:false }`. This epic stores nothing related to reviews; it only renders the response.

**Cron / cleanup** — append to the **existing** nightly Cron Trigger (added by the Infra epic for `auth_tokens`/`sessions` pruning; the Newsletter epic also appends its own sweep — coordinate to a single `scheduled` export). Add two GDPR-retention sweeps for `leads`:
- delete `leads` where `status='rejected'` AND `reviewed_at < now − 180d`;
- delete `leads` where `status='new'` AND `created_at < now − 365d` (never-actioned stale applications) — log an `erased` audit line.
Cloudflare cron is **UTC-only, no DST** — fine for an overnight sweep, documented so nobody files a bug. Zero extra cost (same Worker).

**Caching / invalidation**: leads + newsletter are dynamic POST flows — no ISR concern. The `BusinessCard` excerpt and the SSR aggregate line ride the existing `revalidate=300`; once the **d1-next-tag-cache override** (Infra epic) lands, owner edits that change card content invalidate instantly. The reviews snippet strip is edge-cached 15 min, never ISR-persisted.

**Image pipeline (Cloudflare Image Transformations + R2)**: front `/media/[...key]` (or `/cdn-cgi/image/width=…,format=auto/…`) to serve width-stepped AVIF/WebP from the original R2 object. Keep the existing magic-byte upload security and the per-request auth gate on **pending** photos unchanged (only `approved`, publicly-cacheable objects get long-lived transformed variants). Approved variants: `Cache-Control: public, max-age=31536000, immutable` (existing convention). **Free-tier reality:** 5,000 unique transforms/month free; over that, Free-plan transforms fail with **error 9422** (fail-closed, no silent charge) — at ~67 businesses × a few widths this stays free; the FE fallback to the original R2 object covers a 9422. This is the single biggest LCP lever (Workers currently serve full-resolution originals).

**Bindings/secrets**: reuse `DB`, `PHOTOS`, `RESEND_API_KEY` (Resend sending domain in the **EU region** + signed DPA), `ADMIN_EMAILS`. Add `TURNSTILE_SECRET_KEY` (secret) + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (var). The Resend Audience id lives in `app_settings` (owned by the Newsletter epic), not here.

### SEO / GEO / AEO

- **Token/a11y work is itself an AEO signal**: faster LCP and AA compliance feed Core Web Vitals + Google quality signals. Tie the image pipeline to measured LCP wins.
- **`BusinessCard` excerpt** adds extractable entity text to grid/category pages → better AI snippet extraction. Content trims excerpts toward the 40–60-word answer-first discipline.
- **`dateModified` plumbing**: every approved owner edit (now flowing through the polished portal) bumps `updatedAt` → emit `dateModified` on `localBusinessSchema()` (a 3-line change in `src/lib/schema.ts`) → satisfies the 2026 freshness signal (>83% of AI citations < 12 months old). Admin queue surfaces "laatst ververst".
- **Reviews display is AEO/trust, not rich-snippet SEO**: per the 2024+ self-serving policy, do **not** add `aggregateRating` to `LocalBusiness` markup (`schema.ts` correctly omits it). The SSR aggregate **text** line is crawlable trust copy, not schema. SEO weight stays on the GBP local-pack + acquisition program (Reviews/Growth epics). Maps link-back + Google logo unobscured is mandatory.
- **`/aanmelden` schema**: add a `Service`/`WebPage` node describing the free listing service (B2B query "mijn zaak aanmelden De Kamp") now that it's a real funnel.
- **`lang=nl` + hreflang scaffolding**: set `lang=nl` now; stub `metadata.alternates.languages` so the i18n epic only fills EN.
- **Social**: once `SITE.social.instagram/facebook` are filled (Growth/Newsletter), Organization `sameAs` emits real anchors — this epic's Footer icons and the schema both read the same `src/lib/site.ts` source. (Reminder: the site's own `/links` page is **not** a `sameAs` — that's an external-reference field only.)
- **CWV targets**: LCP < 2.0s, CLS < 0.1, INP < 200ms p75 mobile — joint with Frontend; gate via Lighthouse-CI budget.

### Design / UX

- **Deliver in Figma**: a **variable collection** mirroring code tokens 1:1 (colours with AA annotations, type scale, spacing ladder, radius, shadow, motion durations) so design↔code never drift. Component sets with variants matching the React primitives.
- **Screens**: `/beheer` (list + edit + photo upload), `/admin` (queue + diff + leads + purge modal), `<NewsletterForm>`, `AanmeldenForm`, `GoogleReviewsStrip`, `BusinessCard` with excerpt. Each documented with **all states**: default / empty / loading (skeleton) / error / success / disabled.
- **Responsive**: mobile-first; verify the narrow-`max-w` portal/admin at 360px; unify nav IA.
- **Motion**: codify principles — purposeful, < 400ms, ease `[0.22,1,0.36,1]`, always honor `prefers-reduced-motion` (CSS **and** the new JS guard). Deliver a motion spec sheet.
- **WCAG AA**: design-time contrast checks on every token pairing; specify the dual-tone focus ring; retire `HoursTable` `text-white/40` for an AA-passing dim token (verify `white/75` and the replacement on `--charcoal`); touch targets ≥ 44px in portal/admin.
- Tools: **Figma** for library + handoff; **Ladle** (Vite-native, lighter than Storybook — fits the lean stack) as the living code catalog.

### Content / Localization

- Rewrite portal/admin microcopy in the brand voice (flat → warm/reassuring). Owner-relations reviews tone.
- **Lead (aanmelden)** copy: the exact `consent_text` stored at submit, the admin notification, and the applicant confirmation email — NL, warm, je/jij.
- **Newsletter copy is owned by the Newsletter epic** — this epic only places the component; do not author duplicate consent strings (use that epic's `consent_text_version`).
- **Empty/error states**: Dutch copy for every new state (loading, no reviews yet, upload failed, lead submitted, lead failed).
- **Alt text**: convention — owner-uploaded photos get alt derived from `business.name + category` until owners supply their own; generative placeholders are `aria-hidden` (decorative).
- **Bilingual implication**: externalize all new strings into an `nl` namespace (even if hand-rolled) so the i18n epic gets clean keys, not inline JSX. No EN authored here.

### Legal / Compliance (GDPR)

- **Leads — lawful basis: pre-contractual / legitimate interest** (Art. 6(1)(b)/(f)) for processing a business's own application. Store `consent_text` + timestamp as proof. Retention: 180d post-rejection, 365d if never actioned (cron-enforced), indefinite once an owner. **Must be in `purgeProfile`/`purgeBusiness` and the RoPA** (see §4 Backend) — this is a release-blocking invariant.
- **Newsletter lawful basis, double-opt-in, retention, RFC 8058 unsubscribe** → owned by the **Newsletter epic + legal playbook**. This epic only renders the consented form and must surface that epic's exact consent string. No new newsletter processing decisions here.
- **Reviews ToS** → owned by the **Reviews epic**: no caching of Places content beyond `place_id`; owner-authorized GBP own-data via ephemeral snapshot; Google logo + Maps link-back unobscured. This epic's `GoogleReviewsStrip` must render the logo + link-back exactly as the Reviews epic specifies and **store nothing**.
- **Processors + DPAs** (this epic's incremental surface): Cloudflare (D1/R2/Workers/Turnstile — DPA in place, EU jurisdiction restriction), Resend (sending domain in EU region + DPA). Update the processor register + privacy policy. **Ship a real `/privacy` page this epic** (the current `#` is a launch blocker).
- **Accessibility law**: the **European Accessibility Act** (NL: *Wet toegankelijkheid producten en diensten*, in force 28 June 2025) may bring in-scope commercial digital services into a legal AA obligation. **Legal to confirm whether De Kamp's guide is in scope**; engineering targets WCAG 2.1 AA regardless, and this epic's audit + axe-core gate is the conformance evidence (toward an accessibility statement if required).
- **Turnstile**: privacy-preserving, no third-party tracking cookie — preferred over reCAPTCHA (which would trigger consent-banner liability).
- **Analytics**: first-party cookieless only (Plausible self-host / Cloudflare Web Analytics) — no consent banner may become necessary. Any non-essential cookie introduced requires a banner (coordinate with Analytics).

### Data / Analytics

- **Events (cookieless, no PII)**: `portal_listing_viewed`, `portal_edit_submitted`, `portal_photo_uploaded`, `aanmelden_submitted`, `newsletter_signup` (fire on the Newsletter epic's success), `review_strip_viewed`, `review_maps_clicked`, `map_marker_opened`, `nav_item_clicked`.
- **KPIs/dashboards**: portal task-completion funnel; aanmelden→owner conversion; CWV (LCP/CLS/INP) RUM by route; axe violation count over time. (Newsletter confirmation-rate KPI is owned by the Newsletter epic.)
- **Instrumentation**: **Plausible (EU/self-host)** for page + custom events (cookieless, GDPR-clean, no banner). Cloudflare Web Analytics (free) as RUM/CWV fallback. Optional first-party `ui_events` D1 table only if self-hosting events (keep it PII-free).

### Operations / Owner-relations

- **Onboarding**: the polished portal is the onboarding artifact — pair with a one-page Dutch "zo beheer je je vermelding" guide.
- **Moderation SLA**: with sort/filter/bulk queue, target < 24h median time-to-decision; "laatst ververst" surfaces stale listings to nudge owners.
- **Leads workflow**: Mariëtte triages the `/admin` Leads tab (new→contacted→approved/rejected). The **human verification step** (is this person actually the owner?) is mandatory before `promoteLeadToOwner` — the checkbox enforces it in the UI; document the verification runbook (e.g. confirm via the business's published phone/email).
- **Support**: GDPR-erase requests routed through admin; document the runbook (which purge, what it does).

---

## 5. Data model & API

**D1 DDL** — see §4 Backend (`0003_leads.sql`): `leads` only. No change to existing tables; `promoteLeadToOwner` writes the existing `owner_business`. Newsletter/reviews tables are owned by their epics.

**R2 key conventions** — unchanged: `business/{businessId}/{uuid}-{hex4}.{ext}`. Variants via Cloudflare Image Transformations in front of `/media/[...key]`; pending-photo auth gate unchanged; only `approved` objects get long-lived transformed variants.

**Route handlers / actions**
| Method / type | Path | Request → Response | Owner |
|---|---|---|---|
| Server Action | `submitLead(FormData)` | `{business_name, contact_name, email, phone?, address?, story?, instagram?, turnstileToken}` → `{ok, error?}`; INSERT leads + Resend admin+applicant | **this epic** |
| Server Action (admin) | `updateLeadStatus(id, status)` | → `{ok}` | **this epic** |
| Server Action (admin) | `promoteLeadToOwner(FormData)` | `{leadId, businessId, verified:true}` → INSERT owner_business; `{ok}` | **this epic** |
| Server Action | `subscribe()` (via `<NewsletterForm>`) | `{email, consent, source?, website?}` → `{ok}` | **Newsletter epic** (consumed) |
| GET (route.ts) | `/api/reviews/[businessId]` | → `{display, rating, count, mapsUrl, reviewUrl, reviews[]}`, `Cache-Control: public, max-age=900` | **Reviews epic** (consumed) |

**Third-party calls**: Resend REST (`POST /emails`) from the Worker for lead admin/applicant mail. Turnstile siteverify (`POST https://challenges.cloudflare.com/turnstile/v0/siteverify`). No inbound webhooks in this epic.

---

## 6. User flows & state machine

**Lead (aanmelden)**: `idle → submitting → (validation/turnstile/honeypot fail → error) → submitted (D1 row + emails) → admin: new → contacted → approved → [verify + promote] → owner_business created` OR `→ rejected → (180d) → pruned`. Edge: duplicate application same email → flagged in admin (not blocked); promote requires/creates a `profiles` row by email and the human-verification checkbox; never-actioned `new` > 365d → pruned.

**Newsletter (UI only)**: `idle → submitting → (turnstile/consent fail → error) → pending` — the full `pending → confirmed → unsubscribed` machine and all edge cases (already-confirmed, expired token, resubscribe, bounce) live in the **Newsletter epic**. This epic only renders idle/submitting/success/already-subscribed/error from the action's return.

**Photo upload (portal)**: `idle → file-selected (preview) → uploading (progress) → (server reject: MIME/size/auth → inline error) → pending (Alert) → admin approve → live`. Edge: > 5 MB caught client- and server-side; non-allowlisted MIME rejected by magic-byte sniff; re-upload supersedes prior pending (existing logic, untouched).

**Reviews strip**: `loading (skeleton) → {display:false} → link-out` OR `→ loaded (≤5 cards + SSR aggregate + attribution)`. Edge: snapshot stale/missing/below-threshold/API-error → `{display:false}` → plain Maps link-out (never a broken widget); never blocks page render (client-fetched after SSR); stores nothing.

**Admin moderation queue**: `list (sorted/filtered/paginated) → select (single|bulk) → approve|reject(reason) → revalidate`. Edge: optimistic UI rolls back on action error; bulk-approve is sequential with per-item error capture (one failure doesn't abort the batch).

---

## 7. Third-party choices

**Map — DECISION: keep `maplibre-gl`.** Already integrated (OpenFreeMap Positron, no API key, brand-retinted); gives real pan/zoom + geographic accuracy a static SVG can't; and **serves the Reviews requirement** — an embedded interactive map satisfies Google's Maps-attribution rule when on-page reviews are shown. The only debt is accessibility (DOM markers outside React), solved cheaply by the parallel source-ordered list + skip-link (progressive enhancement) — far less work than rebuilding a bespoke SVG and losing the real-map upgrade path. Cost: €0 (OpenFreeMap free, no key).

**Lead/transactional email: Resend (sending domain in EU region)** — already in stack for auth, GDPR-clean, EU residency selected at domain creation (not a special endpoint), one DPA, consistent sender. vs Brevo / Mailchimp (US-centric, residency friction). **Recommendation: Resend.**

**Bot protection: Cloudflare Turnstile** — native to the stack, free, privacy-preserving (no consent banner), EU-clean. vs reCAPTCHA v3 (Google tracking + banner liability) / hCaptcha (extra vendor). **Recommendation: Turnstile.**

**Analytics: Plausible (EU-host/self-host)** for product events (cookieless, no banner, custom events) + **Cloudflare Web Analytics** (free) for RUM/CWV. vs GA4 (banner + US-transfer friction). Plausible Cloud ~€9/mo or self-host €0.

**Component catalog: Ladle** (Vite-native, light) vs Storybook (heavier). **Recommendation: Ladle** now; revisit Storybook+Chromatic only if visual-regression-in-CI earns its cost.

**Design tokens: Figma Variables** (native, free) mirrored by hand now; Tokens Studio / Style Dictionary automation deferred to "Later".

---

## 8. Milestones & sequencing

1. **M1 — Token foundation + a11y critical fixes (1–1.5 wk)**: type/spacing/motion tokens in `@theme`; dual-tone focus ring; `<html lang="nl">`; `src/lib/motion.ts` reduced-motion JS guard; Figma variable library. *Can start during the launch epic; depends on nothing.*
2. **M2 — Component catalog + primitives (1.5 wk)**: `KampInput/Textarea/Select/Button/Alert/Badge/Card/ConfirmModal`; Ladle catalog with all states; `BusinessCard` excerpt; `src/lib/nav.ts` IA unification; Footer brand-SVG social icons.
3. **M3 — Owner portal uplift (1.5 wk)**: `beheer/layout.tsx` shell; form/Alert swap; drag-drop `PhotoUpload` with preview+progress. *Presentational only.*
4. **M4 — Admin polish (1 wk)**: accessible diff; sort/filter/paginate/bulk-approve; GDPR `ConfirmModal`; Leads tab + Nieuwsbrief nav slot.
5. **M5 — Backend-wired UX (1.5–2 wk)**: `0003_leads` migration + `gdpr.ts` purge wiring; `submitLead` + `updateLeadStatus` + `promoteLeadToOwner`; Turnstile + WAF + cron lead-prune; Resend wiring; `<NewsletterForm>` against the Newsletter epic's `subscribe()`; `GoogleReviewsStrip` against the Reviews epic's `/api/reviews`; remove all `mailto:`. **Reviews/newsletter UI degrade to link-out / disabled if those epics haven't shipped yet — the lead funnel does not depend on them.**
6. **M6 — Image/LCP + full WCAG audit + handoff (1–1.5 wk)**: Cloudflare Image Transformations pipeline + 9422 fallback + generative-placeholder CLS tuning; axe-core + Lighthouse-CI gates; full AA audit sign-off; Ladle + Figma handoff published; map keyboard path verified; `/privacy` page shipped.

**Dependency note:** M5's lead funnel needs only the launch epic (deploy + real `database_id`). The newsletter form needs the Newsletter epic's `subscribe()`; the reviews strip needs the Reviews epic's `/api/reviews`. M1–M4 are independent and parallelizable.

## 9. Dependencies
- **Production launch + Cloudflare hardening** (deploy, real `database_id`, secrets, WAF baseline) — **blocks M5's D1 writes**.
- **Newsletter epic** — `subscribe()` Server Action + `newsletter_subscribers` + confirm/unsubscribe — **blocks the newsletter form going live** (UI degrades to disabled/coming-soon without it).
- **Reviews epic** — `business_google.cached_*`, `review_snapshot`, `/api/reviews` handler, cron sync — **blocks the reviews strip only** (degrades to the `place_id` link-out).
- `d1-next-tag-cache` override — instant invalidation of design-driven content edits (degraded-but-OK without it: 5-min ISR).
- Resend EU sending domain + signed DPA (shared with auth/newsletter).
- i18n epic — this epic ships `lang=nl` + string externalization; EN deferred.
- Growth fills `SITE.social.*` before Footer real hrefs + Organization `sameAs`.

## 10. Risks & mitigations
- **Portal/admin uplift scope-creeps into a rewrite** → strictly presentational swaps, never touch `actions.ts` logic; component-by-component behind existing routes; QA snapshot-diffs + schema snapshot tests.
- **Tailwind v4 token migration causes visual regressions** → introduce tokens additively, migrate per-component with Ladle snapshots, freeze pixel-locked surfaces (hero, OG image).
- **Duplicating the newsletter/reviews backend** (the draft's original error) → explicitly out of scope; this epic only consumes the other epics' contracts; a contract mismatch is caught by a shared types module / integration test.
- **`leads` PII escapes the erasure path** → `gdpr.ts` purge wiring + RoPA row are M5 acceptance gates; a release-blocking legal invariant.
- **Open form endpoints become spam vectors** → Turnstile + WAF 5/min/IP + honeypot.
- **Reviews widget mis-renders attribution** → render Google logo + Maps link-back exactly per the Reviews epic; store nothing; below-threshold → link-out.
- **MapLibre marker a11y is brittle** → canonical parallel `<ul>` keyboard path + skip-link; markers `aria-hidden`; keep MapLibre, don't rebuild SVG.
- **Image-transform free-tier exhausted** → fail-closed 9422 + FE fallback to the original R2 object; monitor transform count.
- **Volunteer bandwidth** → M1–M4 deliver standalone value even if M5/M6 slip; sequence so the adoption-critical portal uplift lands before the nice-to-haves.

## 11. Acceptance criteria / Definition of Done
- [ ] Type, spacing, motion, radius, shadow, colour tokens defined in `globals.css` `@theme` + mirrored in a Figma variable library; **stylelint token-lint gate** flags 0 hardcoded hex / ad-hoc `text-[..]`.
- [ ] `<html lang="nl">` set; focus ring passes SC 1.4.11 on light **and** dark surfaces; `HoursTable` dim text passes 4.5:1; Framer Motion honors `prefers-reduced-motion` via the JS guard.
- [ ] `KampInput/Textarea/Select/Button/Alert/Badge/Card/ConfirmModal` shipped and used by both public and portal/admin; documented in Ladle with default/empty/loading/error/success/disabled states.
- [ ] `/beheer` + `/admin` fully on-brand (Playfair headings, Alert components, branded shell); business logic in `actions.ts` unchanged (snapshot-diff verified).
- [ ] Drag-and-drop `PhotoUpload` with preview + progress; no `?photo=` hard-nav; client + server MIME/size checks.
- [ ] Admin queue has sort/filter/pagination/bulk-approve; diff view is icon+ARIA (not colour-only); GDPR purge behind a focus-trapped `ConfirmModal`.
- [ ] `/aanmelden` is a real D1 `leads` funnel + Resend (no `mailto:`); Leads tab works; `promoteLeadToOwner` INSERTs `owner_business` behind a human-verification checkbox.
- [ ] `leads` added to `purgeProfile`/`purgeBusiness` in `gdpr.ts` + a RoPA row exists; cron prunes rejected/stale leads.
- [ ] Footer `<NewsletterForm>` calls the **Newsletter epic's** `subscribe()` (no duplicate table); newsletter `mailto:` removed.
- [ ] `GoogleReviewsStrip` consumes the **Reviews epic's** `/api/reviews` contract: renders `{display:false}` as a link-out, ≤5 cards + SSR aggregate + Google logo + Maps link-back otherwise; stores nothing; degrades gracefully.
- [ ] Turnstile + WAF rate-limit on both form endpoints.
- [ ] `0003_leads` migration applied to remote D1.
- [ ] Cloudflare Image Transformations serving AVIF/WebP with a 9422 fallback; LCP < 2.0s, CLS < 0.1, INP < 200ms p75 mobile on home + business detail.
- [ ] axe-core CI gate: 0 critical/serious on all public + portal routes; full WCAG 2.1 AA audit signed off; map has skip-link + keyboard path.
- [ ] Real `/privacy` page shipped; processor register + privacy policy updated (Cloudflare, Resend, Turnstile, Plausible).
- [ ] `src/lib/nav.ts` single source; desktop/mobile IA identical; Footer social icons real brand SVGs with accessible labels.
- [ ] No existing JSON-LD/SSG broken (schema snapshot tests green); `dateModified` emitted on `localBusinessSchema()`.

## 12. KPIs & success metrics
- Portal task-completion (edit submitted / portal session) > 80%; photo-upload completion > 60%.
- 0 axe critical/serious in CI across public + portal.
- LCP < 2.0s, CLS < 0.1, INP < 200ms p75 mobile.
- Aanmelden lead→owner conversion > 30%.
- Admin median time-to-decision < 24h.
- Token-lint: 0 hardcoded values flagged.
- Owner post-onboarding satisfaction > 4/5.
- (Newsletter confirmation-rate KPI owned by the Newsletter epic.)

## 13. Cost
**One-off**: design + build labor (6–9 wk, in-house/volunteer). Figma free tier. Ladle free/OSS. Brand social SVGs €0.
**Monthly at this scale**:
- Cloudflare (Workers/D1/R2/Image Transformations/Turnstile/WAF rate-limit) — within the existing plan; **Image Transformations free up to 5,000 unique transforms/mo (fail-closed past it), ~67 businesses stays €0**.
- Resend — free tier (3k emails/mo) covers lead mail; €0 until volume grows.
- Plausible — €9/mo Cloud or €0 self-hosted. Cloudflare Web Analytics — €0. Turnstile — €0. OpenFreeMap — €0.
**Total incremental: ~€0–10/month** (only optional Plausible Cloud is non-zero), comfortably inside the lean €0–25 budget. No new mandatory paid processor.

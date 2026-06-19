# Operating Framework — Ondernemers van de Kamp

> The program-office layer that makes the 12-epic roadmap runnable by a small, part-volunteer team on a ~€0–25/month budget. It defines who owns what, how decisions get made, what we measure, what it costs, and what must be true before we ship.

**Reality check that shapes everything below:** the team is tiny (estimate 1–2 part-time engineers, 1 designer-leaning generalist, a content/owner-relations volunteer or two from the district association, and an admin/founder doing PM + ops). Almost everyone wears 2–4 hats. "Teams" below are *roles*, not headcount — most map to the same 3–4 humans plus targeted contractors. The framework is written so that one person can act as the named owner of a charter without a dedicated department behind them.

Phasing anchor (from the epic metadata):
- **Phase 4** — `launch` (ship + harden), then in parallel: `design-system`, `analytics` (M1), `owner-ops`, `discovery`, `google-reviews` M0.
- **Phase 5** — `google-reviews` (full), `agenda`, `newsletter`, `owner-story`, `cadeaukaart`.
- **Phase 6** — `bilingual`.

---

## Team charters

### 1. Engineering — Frontend

**Mission.** Keep the public site fast, accessible, and on-brand while wiring every new backend feature into a UI that never regresses Core Web Vitals or the JSON-LD surface.

**Responsibilities across the roadmap.**
- `launch`: branded 404/500/error pages, focus-ring + contrast a11y fixes, hero LCP preload, portal `noindex` chrome.
- `design-system`: token foundation, `src/components/ui/*` primitives (KampInput/Button/Alert/Card/Modal), portal + admin brand uplift, drag-drop PhotoUpload, Cloudflare Image Transformations front of `/media`.
- `discovery`: URL-addressable faceted explorer (Suspense + `useSearchParams`), MapLibre formalisation, accessible non-map list fallback, loop-de-kamp itinerary UI.
- `agenda`, `owner-story`, `newsletter`, `cadeaukaart`: all storefront/portal UIs, forms, PWA till, lightbox, archive pages.
- `google-reviews`: `GoogleReviewsStrip`, QR card, owner respond-to-review UI.
- `bilingual`: `LanguageSwitcher`, `[locale]` route group rendering, hreflang plumbing.

**Key deliverables.** Shared `ui/` primitive library; `src/lib/motion.ts` presets + reduced-motion guard; `src/lib/nav.ts` IA single-source; every form an island Server Action with inline validation; CWV held at p75 LCP<2.0s / INP<200ms / CLS<0.1.

**Cadence/rituals.** Weekly async standup (Mon); PR-driven (squash-merge, 1 approval); preview:cf smoke before every merge; joins the monthly CWV/a11y review.

**Lean-team note.** Frontend and Backend are very likely the **same one or two engineers**. Use the design-system contractor for the Ladle catalog + Figma library so the in-house engineer doesn't burn a sprint on tooling.

---

### 2. Engineering — Backend / Infra / Cloudflare *(roadmap lead track)*

**Mission.** Own the platform: EU-resident D1/R2, edge-safe code, money-correct ledgers, cron, rate-limiting, and the cache/invalidation contract. Backend is the headline deliverable per the owner directive.

**Responsibilities across the roadmap.**
- `launch` (lead): `wrangler d1 create --jurisdiction eu` + real `database_id`, `scripts/preflight.mjs`, `d1-next-tag-cache` + `NEXT_TAG_CACHE_D1`, custom `worker.ts` wrapper for `scheduled()`, nightly backup+prune cron, WAF rate-limits, Turnstile fail-closed, `login_throttle` (migration 0003), CSP/HSTS/security headers, `[env.staging]`.
- `cadeaukaart` (lead): append-only D1 ledger, `db.batch` issuance, conditional `INSERT…SELECT…WHERE` redemption, Mollie Payments API + self-verifying webhook, SEPA payout export.
- `google-reviews` (lead): `business_google`, AES-GCM refresh-token storage (consumes `AUTH_SECRET` via HKDF), GBP OAuth handlers, `/api/reviews` no-store, token-refresh + aggregate-sync crons.
- `agenda`: events tables, RRULE+tz materialiser, **dedicated cron Worker**.
- `newsletter`, `owner-story`, `bilingual`, `analytics`, `owner-ops`, `discovery`: all D1 migrations, route handlers, cron consumers, FTS5 seam, tile serving, translation store.

**Key deliverables.** Every `0003_*.sql` migration (one concern per epic, additive, indexed); the single shared `scheduled()`/cron strategy; `gdpr.ts` erasure completeness for every new PII table; rate-limiting via in-D1 sliding window (Free plan has ONE WAF rule).

**Cadence/rituals.** Owns migration review (2 approvals for schema PRs); maintains the cron registry; runs the restore drill; weekly standup.

**Lean-team note.** This is the **critical-path person**. Protect their time ruthlessly — defer nice-to-have UI to keep launch + reviews + gift-card backends moving. Mollie/PSD2 and AES token work are the two places to buy a few hours of a specialist contractor or fintech-lawyer review rather than self-teaching.

---

### 3. SEO / GEO / AEO

**Mission.** Win AI citations and local-pack ranking; never regress the shipped structured-data surface; keep `src/lib/site.ts` the single NAP source.

**Responsibilities.** Owns `schema.ts` evolution (additive builders only): `dateModified`, district/Org `sameAs` (Wikidata/OSM), `eventSchema`/`eventSeriesSchema` (`agenda`), `articleSchema`/`personSchema` (`owner-story`), `TouristTrip` (`discovery`), gift-card `Product` (`cadeaukaart`), hreflang (`bilingual`). Enforces the **no self-serving `aggregateRating`** rule. Keeps `llms.txt`, sitemap, robots fresh-from-data. Sets the 40–60-word answer-chunk standard.

**Key deliverables.** Per-PR SEO checklist (in CI where possible: Vitest assert schema never emits `aggregateRating`); Rich Results pass on 5 routes per release; the monthly AI-citation prompt panel.

**Cadence/rituals.** SEO checklist gate on every public-facing PR; monthly AI-citation audit (20-query NL panel across ChatGPT/Perplexity/AI Overviews); quarterly crawl audit (Screaming Frog).

**Lean-team note.** Almost certainly the **same person as Content/Localization** and overlapping with Product. Lean on the `anthropic-skills:geo-seo-optimizer` skill for audits.

---

### 4. Design / UX

**Mission.** Tokenise "De Kamp leeft." into an accessible, documented system; make the owner portal feel like the brand, not a CMS.

**Responsibilities.** `design-system` lead: type/spacing/motion tokens in `@theme`, dual-tone WCAG-AA focus ring, component state matrix, Ladle catalog, Figma "De Kamp — Foundations" library. A11y gate (axe, contrast) across all epics. Map keyboard/skip-link flow (`discovery`). Review QR card + claim-card PDF layouts. UX copy collaboration with Content.

**Key deliverables.** `globals.css` token layers; `src/components/ui/` specs; Figma var names = CSS var names 1:1; per-component a11y checklist; EAA/WCAG 2.1 AA sign-off (a legal obligation, not just polish).

**Cadence/rituals.** Design critique on new UI; a11y review before handoff (`design:accessibility-review`); joins monthly CWV/a11y review.

**Lean-team note.** Likely a **generalist who also does some frontend**. Use a **contractor for the one-time Figma library + Ladle setup**; in-house keeps tokens in sync after.

---

### 5. Content / Localization

**Mission.** Keep every public word warm, honest, NL-first, and AEO-shaped (40–60-word answer chunks), with mandatory human review for EN.

**Responsibilities.** Business descriptions (formula: shortDescription 90–140 chars; longDescription answer-first lede); FAQ/category/district copy; moderation + error + empty-state microcopy; alt-text assigned at approval; `owner-story` editorial strand (style guide, consent scripts, ≥1 story/month); `priceBand` normalisation pass over ~67 rows (`discovery`); EN review of DeepL drafts (`bilingual`); newsletter/digest copy; help-centre articles (`owner-ops`).

**Key deliverables.** Content style guide + terminology glossary; `scripts/lint-content.ts` CI guard (length, banned superlatives, hours-in-prose leaks); consent text versions.

**Cadence/rituals.** Editorial calendar (2-story buffer); content lint in CI; reviews copy never authored/incentivised.

**Lean-team note.** Strong fit for an **association volunteer** (knows the owners, speaks the voice). Photography + interviews batch ~3 per outing to protect cadence.

---

### 6. Growth / Marketing

**Mission.** Convert anonymous SEO/AI traffic into owned audience and owner adoption; drive gift-card GMV and review acquisition.

**Responsibilities.** Owner-acquisition outreach (`owner-ops`): claim campaign, leave-behind QR cards. Newsletter list growth + digest distribution (`newsletter`). Review-acquisition program QR/deep-link rollout (`google-reviews`). Gift-card launch campaign + ≥15-merchant recruitment (`cadeaukaart`). Connected socials + `/links` page; fills `SITE.social`. Bilingual soft-launch outreach (VVV/concierge).

**Key deliverables.** Owner claim funnel (60% claimed by month 3, 80% by month 6); ≥300 subscribers/6mo; gift-card pilot → district-wide.

**Cadence/rituals.** Monthly owner digest; campaign retros tied to analytics KPIs.

**Lean-team note.** **Association/founder volunteer role.** Most "marketing" here is in-person owner relations on De Kamp itself — leverage the physical district, not paid ads (budget is ~€0 for acquisition).

---

### 7. Legal / Compliance *(heavy on payments, reviews, newsletter)*

**Mission.** Keep the project GDPR-defensible, EU-resident, and out of regulated-fintech scope.

**Responsibilities.** RoPA + sub-processor list + DSAR/breach registers in `/docs/compliance/`. Lawful-basis sign-off before any new PII table merges. **Correctly classify Resend as a US processor** (SCCs + DPF + TIA — never "EU-resident"). `cadeaukaart`: fintech-lawyer sign-off on the PSD2 limited-network exclusion (Wft 1:5a(2)(k)), Wwft carve-out, €1M/DNB meter, MPV-VAT (accountant). `google-reviews`: Places API no-cache (only `place_id`), Google attribution, no self-serving `aggregateRating`. `newsletter`: double opt-in + unbundled consent + consent_text proof. EAA/WCAG AA as legal obligation. Privacy + cookie pages live before any send (hard blocker).

**Key deliverables.** Signed DPAs (Cloudflare, Resend, Mollie, DeepL); LIA/no-consent analytics memo; consent-text changelog; gift-card consumer terms + wind-down clause.

**Cadence/rituals.** Compliance gate on any epic touching PII/payments/reviews; 72h breach clock runbook.

**Lean-team note.** **External Dutch lawyer + accountant on retainer for the gift card only** — this is the one place where DIY is genuinely dangerous (PSD2/e-money reclassification, VAT). Day-to-day GDPR can be founder-run against the playbook.

---

### 8. Data / Analytics

**Mission.** Measure everything that matters, cookieless and GDPR-native, at ~€0.

**Responsibilities.** `analytics` lead: Cloudflare Web Analytics beacon, first-party `POST /api/collect` collector (daily-salt HMAC, no raw IP, 35-day retention), `analytics_daily_rollup`, GSC/Bing import, `/admin/analytics` + per-owner stats, AI-citation log, North-Star tracking. Funnel instrumentation hooks for claim/newsletter/giftcard/reviews (no-throw stubs first). D1 write-budget monitoring (100k/day Free cap; alert at 50k).

**Key deliverables.** Rollup dashboards; monthly KPI report against the OKRs below; D1 quota alarm + Queue upgrade path documented.

**Cadence/rituals.** Monthly metrics review feeding governance; weekly glance at 5xx/uptime/CWV.

**Lean-team note.** Mostly the **same engineer + founder reading dashboards**. The collector is real backend work — sequence it after the features it measures exist.

---

### 9. QA / Release

**Mission.** No release without a green security regression suite; protect the hermetic-seed build and money/auth correctness.

**Responsibilities.** Maintain the test pyramid (Vitest unit on `src/lib`, `@cloudflare/vitest-pool-workers` integration on real D1/R2, thin Playwright e2e). **P0 security gate**: S1 cross-tenant `submitEdit` rejected, S2 cross-tenant pending `/media` returns 404. Mollie webhook idempotency + redemption double-spend tests (`cadeaukaart`). axe AA + Lighthouse CWV gates against preview:cf. Forward-only migration discipline + mandatory `wrangler d1 export` before prod migrations. Rehearsed `wrangler rollback`.

**Key deliverables.** GitHub Actions CI (lint, tsc, migrate:local, unit, integration, security, hermetic build, e2e smoke); restore drill pre-launch; incident postmortems that add the missing test.

**Cadence/rituals.** CI gate on every PR; pre-launch QA gate; nightly full suite.

**Lean-team note.** QA is a **discipline the engineers own**, not a separate hire. The non-negotiable is the security suite — write S1/S2 first, before any owner outreach.

---

### 10. Product / PM

**Mission.** Sequence the roadmap, hold the phase gates, keep scope cut to a lean team's capacity, own decision records.

**Responsibilities.** Phase gating (launch before everything; gift card last and only with legal/financial foundation). Prioritisation calls + ADRs. Cross-epic dependency tracking (e.g. `newsletter` M3 hard-gated on `agenda` backend; `discovery` price facet on Content's `priceBand` pass). Go/no-go on each launch-readiness checklist. Owns this framework.

**Key deliverables.** Decision log (`/docs/roadmap/adr/`); per-epic go/no-go; quarterly OKR setting.

**Cadence/rituals.** Weekly triage; monthly roadmap + metrics review; ADR on every cross-epic or stack decision.

**Lean-team note.** This is the **founder/admin**. Keep ceremony light — a one-page ADR and a Monday triage are enough at this size.

---

### 11. Owner-relations / Operations

**Mission.** The human engine: get listings claimed, moderate within SLA, support owners in plain Dutch.

**Responsibilities.** `owner-ops` lead: outreach → `/aanmelden` lead → admin invite → magic-link claim; moderation playbook (edits <48h, photos <72h) + audit log; help centre + support routing; freshness/seasonal-hours nudges. Review-request operations + verifying each `writereview` deep-link (`google-reviews`). Gift-card merchant onboarding + redemption support (`cadeaukaart`). Event moderation (`agenda`). Consent capture for owner stories.

**Key deliverables.** Moderation SLA + rota + rejection-reason templates; claim-card kit; support first-response <2 business days.

**Cadence/rituals.** Moderation rota (2-person); weekly queue-health check (oldest-pending age); monthly owner digest with Growth.

**Lean-team note.** **Core association volunteer role**, ideally someone who walks De Kamp weekly. Moderation tooling must let a non-technical 2-person team run it — that's a design requirement, not a nice-to-have.

---

## Consolidated risk register

| # | Risk | Epic(s) | Likelihood | Impact | Owner | Mitigation |
|---|------|---------|-----------|--------|-------|-----------|
| R1 | Gift card re-classified as e-money / breaches PSD2 limited-network, or crosses €1M/12mo DNB threshold | cadeaukaart | Med | Critical | Legal | Dutch fintech-lawyer sign-off on Wft 1:5a(2)(k) before go-live; closed-loop, non-reloadable, no cash-out, €150 cap; running-12-month issuance meter with alert well below €1M |
| R2 | Double-spend / overdraw race (D1 has no interactive transactions) | cadeaukaart | Med | High | Eng-Backend | Debit as single conditional `INSERT…SELECT…WHERE SUM≥amt`; pair inserts in `db.batch`; UNIQUE idempotency_key; append-only ledger, never a mutable balance |
| R3 | Mollie webhook spoof/replay issues free or duplicate card | cadeaukaart | Med | High | Eng-Backend | Trust only server-side re-fetch of `GET /v2/payments/{id}`; verify `status=paid` + amount; dedupe table; status-guarded `UPDATE…WHERE status='draft'`; WAF allow Mollie IPs |
| R4 | VAT mis-classification (SPV vs MPV) creates wrong tax liability | cadeaukaart | Med | High | Legal | Classify as multi-purpose voucher (VAT at redemption); accountant sign-off; settlement statements not consumer invoices |
| R5 | Float/insolvency exposure on prepaid balances | cadeaukaart | Low | High | Legal/PM | Ring-fenced stichting account; published wind-down procedure; outstanding-liability reconciled to €0 variance each period |
| R6 | Caching Google review TEXT anywhere (edge/HTTP/D1) breaches Places API ToS | google-reviews | Med | Critical | Eng-Backend/Legal | `/api/reviews` `Cache-Control: private, no-store`; client-fetched so text never enters ISR cache; only aggregate numbers cached; acceptance grep proves no text stored |
| R7 | Self-serving `aggregateRating`/review JSON-LD → ineligible snippet or manual action | google-reviews, owner-story, all | Low | High | SEO | Keep schema.ts omission; Vitest asserts no `aggregateRating`; SEO weight on GBP + acquisition |
| R8 | GBP API access approval is multi-week (needs verified 60-day-old GBP) — blocks display/replies | google-reviews | High | Med | Eng-Backend/Ops | Submit access request day 1; ship M0 place_id + QR/deep-link half with zero Google-API dep; widen estimate to 6–9 wk |
| R9 | OAuth refresh-token leakage or AUTH_SECRET rotation breaks owner Google access | google-reviews | Low | High | Eng-Backend | AES-GCM-256, HKDF-from-AUTH_SECRET, fresh IV, decrypt in-memory only, revoke on disconnect/erase, documented rotation runbook (forces re-consent) |
| R10 | EU data-residency violation: stores created with `--location weur` (a hint) not `--jurisdiction eu` (immutable) | launch, all | Med | Critical | Eng-Backend | Create every D1/R2 with `--jurisdiction eu`; `preflight.mjs` asserts it; recreate-and-copy if wrong (cheap at ~67 rows) |
| R11 | Resend treated as "EU-resident" — undocumented Chapter V transfer | launch, newsletter, owner-ops, all | High | High | Legal | Classify Resend as US processor lawful via SCCs+DPF; record in RoPA + TIA + privacy policy; never claim residency; Brevo/Scaleway FR fallback if strict EU mandated |
| R12 | GDPR erasure leaves PII behind (new tables have no FK cascade) | owner-ops, agenda, owner-story, newsletter, design-system, all | High | High | Legal/Eng-Backend | Every new PII table wired into `purgeBusiness`/`purgeProfile` in the same PR; email-match sweep for leads/invites/nudge_log; nightly retention cron |
| R13 | Cron never fires — OpenNext `worker.js` exports only `fetch`, not `scheduled()` | launch, agenda, analytics, discovery, all | High | High | Eng-Backend | Custom `worker.ts` wrapper re-exporting `fetch`+`scheduled` (or dedicated cron Worker for agenda); verify in staging; M1 spike resolves mechanism |
| R14 | Tag cache is dummy no-op → "instant invalidation" promises are false (5-min ISR only) | launch, all | High | Med | Eng-Backend/Content | Wire `d1-next-tag-cache` + `NEXT_TAG_CACHE_D1` before launch; until then owner copy says the honest 5-min window |
| R15 | Cross-owner edit via directly-invoked Server Action bypassing page guard | launch, all | Med | Critical | QA/Eng-Backend | Re-check `canEdit`/`requireAdmin` inside every action; P0 security tests S1/S2; per-business `/media` pending gate |
| R16 | Auth abuse: magic-link spam / token enumeration (Free plan has ONE WAF rule) | launch, owner-ops | Med | High | Eng-Backend | In-D1 sliding-window limiter as primary control + `login_throttle` atomic UPSERT + Turnstile fail-closed; single free WAF rule on highest-risk path |
| R17 | Email deliverability hit on shared sender breaks magic-link login | newsletter, launch | Med | High | Eng-Backend/Growth | Isolate bulk subdomain `mail.…` + separate `resend_newsletter_from`; DMARC ramp; double opt-in; complaint rate <0.1% |
| R18 | Mid-send crash / 100-email/day free cap → double or partial send | newsletter | Med | Med | Eng-Backend | `newsletter_deliveries` per-recipient ledger makes sends idempotent/resumable; ledger doubles as multi-day spread; kill-mid-batch test |
| R19 | Owner adoption stalls — listings never claimed, freshness signal dies | owner-ops, owner-story, all | Med | High | Ops/Growth | In-person district outreach; claim-card kit; invite-to-portal flow; freshness nudge cron; 60%/80% claim KPIs tracked |
| R20 | Editorial/cadence collapse — volunteer strand quietly dies | owner-story, newsletter | High | Med | Content | 2-story ready buffer; batch ~3 interviews/outing; 9-month stale-flag cron surfaces aging stories (flags only) |
| R21 | Key-person / volunteer capacity loss (one engineer or one volunteer = single point of failure) | all | High | High | PM | Document everything (this framework, ADRs, runbooks); favour boring/reused patterns; contractors for spiky one-offs (Figma, fintech, lawyer); protect the backend critical-path person's time |
| R22 | D1 free-tier 100k writes/day exhausted by analytics collector | analytics | Low | Med | Data/Eng-Backend | Sample page_view (CF beacon covers raw); alert at 50k/day; documented Cloudflare Queue batch-insert / paid-plan upgrade |
| R23 | Faceted-nav generates thin near-duplicate indexable URLs, dilutes crawl budget | discovery, bilingual | Med | Med | SEO | Filters stay query params on `/`; `X-Robots-Tag: noindex,follow` on `?…`; canonical to clean `/`; no crawlable `<a>` into filter combos; sitemap unchanged |
| R24 | Map tiles leak user IP to US/third-party processor (consent + transfer law) | discovery | Low | Med | Eng-Backend/Legal | Self-host Protomaps `.pmtiles` on R2 (Cloudflare DPA, zero egress); OpenFreeMap documented fallback only; Google Maps JS rejected |
| R25 | RRULE/DST bug shifts recurring events by an hour across Mar/Oct transitions | agenda | Med | Med | Eng-Backend | Pair rrule with zone-aware tz lib vs Europe/Amsterdam; materialise to UTC epoch-ms occurrences; explicit Oct+Mar boundary unit tests |
| R26 | Thin auto-translated EN pages indexed, drag domain quality | bilingual | Med | Med | SEO/Content | EN ships `noindex` + absent from sitemap until `status='reviewed'`; machine rows excluded from serve query; flip atomically on human review |
| R27 | Cutover regresses CWV / breaks JSON-LD / `*.workers.dev` indexed splitting signal | launch | Med | High | QA/Eng-Frontend | QA gate (Lighthouse budget + Rich Results on 5 routes); canary then noindex `*.workers.dev`; www→apex 301; low DNS TTL for rollback |
| R28 | Image-transform over-quota (Free 5,000/mo) fails with 9422 | design-system | Low | Low | Eng-Frontend | ~67 businesses stay well under 5,000/mo; fail-closed falls back to immutable R2 original; monitor transform count |

---

## KPIs & OKRs

### North-Star metric

**Monthly outbound action clicks** — website / call / menu / order / route-plan / reviews clicks across all business pages. It is the single number that proves the guide creates real value for owners (the people we must retain) and is cookielessly measurable via the `analytics` collector. Reach (page views) and discovery (GSC/AI citations) are leading indicators that feed it.

### Phase 4 — Launch, Hardening, Discovery, Reviews-M0, Owner-ops

**O1: Be live, fast, and EU-compliant.**
- KR1: Live at `ondernemersvandekamp.nl`; uptime ≥99.9% (30-day rolling).
- KR2: CWV field p75 on home + business detail: LCP<2.0s, INP<200ms, CLS<0.1.
- KR3: Zero data-residency incidents — D1/R2 in `jurisdiction=eu`, all processors under signed DPAs, the one US transfer (Resend) documented under SCCs.

**O2: Turn static listings into an owner-maintained guide.**
- KR1: 60% of businesses claimed (≈40/67) by end of phase.
- KR2: Median moderation time-to-approve: edits <48h, photos <72h.
- KR3: `place_id` coverage ≈67/67 (unblocks all review work).

**O3: Make discovery measurable.**
- KR1: Cookieless pageviews + CWV flowing; GSC + Bing verified, sitemap indexed within 2 weeks.
- KR2: North-Star baseline established (outbound action clicks/month).
- KR3: 0 axe critical/serious across public + portal routes.

### Phase 5 — Reviews, Agenda, Newsletter, Owner-story, Gift card

**O4: Build owned audience + reputation.**
- KR1: ≥300 confirmed newsletter subscribers in 6 months (double opt-in confirm rate >55%).
- KR2: Owner GBP-connection coverage 30%+; net-new reviews per business trending up.
- KR3: ≥6 upcoming events live on `/agenda` at all times; ≥1 owner story/month published.

**O5: Launch the Kamp Cadeaukaart safely.**
- KR1: Legal/financial foundation complete (stichting, KvK, ring-fenced account, Mollie live, lawyer + accountant sign-off) before any euro is taken.
- KR2: Float reconciliation variance = €0; running 12-month issuance tracked vs €1M.
- KR3: ≥15 participating merchants; redemption + breakage tracked at 90/180/365 days.

**O6: Grow AI/search share-of-answer.**
- KR1: Rising AI-citation count on the 20-query NL panel (ChatGPT/Perplexity/AI Overviews).
- KR2: ≥80% of published stories within the 6-month `dateModified` freshness window.
- KR3: Event rich-result impressions rising MoM (GSC).

### Phase 6 — Bilingual

**O7: Open the English-language surface without harming NL.**
- KR1: 0 errors in bidirectional hreflang crawl (Screaming Frog + Search Console).
- KR2: NL URLs byte-identical/unchanged; CWV parity on `/en/*`.
- KR3: EN organic sessions + EN AI-citations established as a tracked quarterly baseline.

---

## Budget & running-cost model

Scale assumptions: ~67 businesses, low-thousands of monthly visitors growing, lean part-volunteer team. Currency EUR. "Expected" assumes modest growth within the phase; "Low" is the floor at current traffic.

### Recurring monthly — infrastructure

| Item | Low | Expected | Notes |
|------|-----|----------|-------|
| Cloudflare Workers Paid plan | €5 | €5 | Needed for D1 write headroom, Cron, Time Travel, rate-limiting. The single must-have upgrade. |
| D1 (SQLite) | €0 | €0 | Within Free tier at this scale; watch the 100k writes/day cap (analytics). |
| R2 (photos + ISR cache + backups + tiles) | €0 | €1 | Storage tiny at ~67 businesses; egress free on R2. |
| Cloudflare Web Analytics | €0 | €0 | Cookieless, EU-OK, no banner. |
| Image Transformations | €0 | €0–1 | Free up to 5,000 unique/mo; ~67 businesses stay under. |
| Domain (`ondernemersvandekamp.nl`) | ~€1 | ~€1 | ~€10–15/yr amortised. |
| **Infra subtotal** | **~€6** | **~€8** | |

### Recurring monthly — per-epic third-party

| Item | Epic | Low | Expected | Notes |
|------|------|-----|----------|-------|
| Resend (email) | launch, newsletter, owner-ops | €0 | €0–20 | Free 100/day, 3k/mo. Paid (~€20) only when newsletter list/sends exceed free tier. |
| Mollie / PSP fees | cadeaukaart | €0 | variable | No monthly fee; ~€0.29 + small % per iDEAL transaction. Cost scales with GMV, offset by revenue. |
| Google Business Profile API | google-reviews | €0 | €0 | GBP API is free; Places API avoided (no caching) so no per-call spend. |
| DeepL API Pro | bilingual | €0 | ~€5–25 | Only in Phase 6; ~€5/mo base + usage. EU/DE servers, signed DPA. |
| UptimeRobot / monitoring | launch | €0 | €0 | Free tier sufficient. |
| **Third-party subtotal (steady state, pre-gift-card)** | | **€0** | **€0–25** | |

**Total recurring: ~€6–10/mo (Phase 4) rising to ~€10–35/mo at peak feature load** — within the lean budget. Gift-card transaction fees are revenue-offset, not overhead.

### One-off / project costs

| Item | Epic | Low | Expected | Notes |
|------|------|-----|----------|-------|
| Figma library + Ladle setup (contractor) | design-system | €0 (in-house) | €500–1,500 | Optional contractor; in-house generalist can do it slower. |
| Photography (district + maker portraits) | owner-story, design-system | €0 (volunteer) | €300–1,000 | Batch shoots; owner-submitted photos reduce this. |
| Translation human review | bilingual | €0 (volunteer) | €300–800 | 67 businesses + 6 pages; DeepL drafts, human-reviewed. |
| Fintech-lawyer sign-off (PSD2/Wwft/terms) | cadeaukaart | €1,500 | €2,500–5,000 | **Non-negotiable** for the gift card. Single biggest line item. |
| Accountant (MPV-VAT + breakage) | cadeaukaart | €300 | €500–1,200 | Sign-off before launch. |
| Stichting incorporation + KvK | cadeaukaart | €50 | €300–700 | Notary + registration. |
| GDPR/privacy legal review | launch, newsletter | €0 (founder-run) | €500–1,500 | Optional external review of RoPA/privacy/cookie pages. |

**One-off reality:** everything except the **gift-card legal/financial foundation (~€3,000–7,000)** can be deferred or volunteer-covered. Do not start `cadeaukaart` until that money is budgeted.

---

## Governance & decision rights

**Cadence.**
- **Weekly (Mon, async):** standup + triage. PM sets the week's one or two priorities respecting phase order.
- **Monthly:** roadmap + metrics review (Data presents KPIs vs OKRs; PM adjusts), CWV/a11y review, AI-citation panel.
- **Quarterly:** OKR setting + per-phase go/no-go.

**Lightweight ADRs.** Any decision that is (a) cross-epic, (b) a stack/dependency choice, or (c) hard to reverse gets a one-page ADR in `/docs/roadmap/adr/NNNN-title.md`: context, options, decision, consequences. Examples already implied by the roadmap: native i18n dictionaries vs next-intl; instant tag cache vs ISR-300; Resend vs EU ESP; D1-store stories vs MDX. Use the `engineering:architecture` skill. No ADR = no merge for those three categories.

**Decision rights.**
- Technical/architecture: Eng-Backend lead decides, PM ratifies, documented as ADR.
- SEO surface (`schema.ts`, robots, sitemap): SEO owns; additive-only; veto on anything that regresses JSON-LD.
- Legal/compliance: Legal has a **hard veto** on anything touching PII, payments, or reviews — release-blocking.
- Scope/prioritisation/phase gates: PM decides.
- Content voice + EN publish: Content owns; EN is never published without human review.

**Prioritisation rules.**
1. **Phase order is law:** `launch` before everything; `cadeaukaart` last and only with the financial/legal foundation.
2. **Backend-first** within each epic (owner directive) — ship the data/correctness layer before the UI polish.
3. **Security + GDPR are release-blocking**, never "fast-follow."
4. **Never regress** the SEO/JSON-LD surface or the hermetic-seed build.
5. **Protect the critical-path person** (Eng-Backend): cut UI scope before cutting backend correctness.
6. **Honest copy:** no UI promises "instant" until `d1-next-tag-cache` ships.

---

## Launch-readiness checklist

### A. Before production launch (`ondernemersvandekamp.nl` go-live)

**Infra / data residency**
- [ ] D1 + all R2 buckets created with `--jurisdiction eu` (verified by `preflight.mjs`); real `database_id` pasted (no `REPLACE_WITH_`).
- [ ] Migrations 0001–0003 applied `--remote`; app reads live EU D1.
- [ ] `d1-next-tag-cache` + `NEXT_TAG_CACHE_D1` wired; per-page `revalidate` lowered to 3600 backstop; approve-to-live demonstrated in seconds on preview.
- [ ] Custom `worker.ts` exports `fetch` + `scheduled`; nightly backup+prune cron verified firing in staging.
- [ ] `[env.staging]` live with own EU stores + `noindex`.

**Security / auth**
- [ ] In-D1 `login_throttle` + Turnstile fail-closed; single WAF rate-limit rule on highest-risk path.
- [ ] `canEdit`/`requireAdmin` re-checked inside every Server Action; `/media` pending gate per-business.
- [ ] CSP/HSTS/nosniff/referrer-policy/permissions-policy set; `X-Robots-Tag: noindex` on `/beheer` + `/admin`.
- [ ] Secrets via `wrangler secret put` (none in `wrangler.jsonc`); `AUTH_SECRET` documented (reserved/used by reviews later).

**Compliance**
- [ ] Signed DPAs: Cloudflare, Resend; Resend recorded as US processor (SCCs+DPF+TIA) — **not** "EU-resident."
- [ ] RoPA + sub-processor list live; privacy + cookie pages published (no `#` placeholders).
- [ ] Every PII table wired into `purgeBusiness`/`purgeProfile`; nightly retention prune confirmed.

**Quality / SEO / a11y**
- [ ] Green CI: lint, tsc, unit, integration, **security suite S1+S2**, hermetic seed-only build, e2e smoke.
- [ ] ≥1 verified restore drill from backup.
- [ ] Rich Results pass on 5 routes; sitemap/robots/llms.txt fresh; no self-serving `aggregateRating`.
- [ ] `<html lang="nl">`; focus-ring contrast fixed; 0 axe critical/serious; Lighthouse CWV budget met on preview:cf.
- [ ] `SITE.social` filled; district `sameAs` (Wikidata/OSM) added; `dateModified` emitting.

**Cutover**
- [ ] Apex + `www`→apex 301; Universal SSL + HSTS; `*.workers.dev` deindexed; low DNS TTL for rollback.
- [ ] Cloudflare Web Analytics + Logpush to EU R2; UptimeRobot + 5xx + cron-failure alerts.
- [ ] GSC/Bing verified; last-good Worker version id recorded; go-live runbook executed.

### B. Before launching the Kamp Cadeaukaart (additional, all blocking)

**Legal / financial foundation**
- [ ] Stichting incorporated + KvK + **ring-fenced** dedicated bank account.
- [ ] Mollie **live** approval (sandbox tested end-to-end first).
- [ ] Fintech-lawyer sign-off: PSD2 limited-network exclusion (Wft 1:5a(2)(k)) + Wwft carve-out + €1M/DNB mechanics.
- [ ] Accountant sign-off: multi-purpose voucher VAT (no VAT at issuance) + breakage treatment.
- [ ] Consumer terms + privacy clauses + published wind-down procedure for outstanding balances.
- [ ] DPAs signed: Mollie, Resend, Cloudflare.

**Backend correctness**
- [ ] Append-only ledger; balance = `SUM(amount_cents)`; **no mutable balance column**.
- [ ] Redemption = single conditional `INSERT…SELECT…WHERE SUM≥amt`; issuance via `db.batch`; UNIQUE idempotency keys.
- [ ] Mollie webhook self-verifies via server re-fetch (`status=paid` + amount), dedupes, status-guarded.
- [ ] Tests pass: balance math, idempotency, **overdraw race (concurrent tills)**, expiry, €25→€18→€7 partial-redeem, webhook replay.
- [ ] Running 12-month issuance meter live on admin dashboard with alert below €1M.
- [ ] Owner `merchant_business_id` always derived from session; redemption gated to `gift_card_merchants`.
- [ ] GDPR erase honours 7-year fiscal retention (strip PII, preserve ledger).

**Operations / readiness**
- [ ] ≥3-merchant pilot completed; ≥15 merchants onboarded for district-wide.
- [ ] SEPA `pain.001`/CSV payout export + `payout_id` stamping (no double-pay) verified.
- [ ] Owner till PWA (`/beheer/kassa`) tested by a real merchant; receipt + history working.
- [ ] Float reconciliation = €0 variance on the admin dashboard.
- [ ] Rate-limiting (WAF + in-D1) on `/saldo`, order-status, redeem; fraud monitoring on.

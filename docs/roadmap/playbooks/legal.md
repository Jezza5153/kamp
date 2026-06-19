# Legal, GDPR & Compliance Master Playbook

> **Owner:** Legal/Compliance lead (with the district association as legal **controller**) · **Status:** living standard · **Applies to:** every epic
> **Stack:** Next.js 16 (App Router) · React 19 · Cloudflare Workers (OpenNext) · D1 · R2 · Resend · Mollie (planned) · Google Business Profile API (planned)
> **Canonical identity / NAP source:** `src/lib/site.ts` (`SITE`) · **Erasure engine:** `src/lib/gdpr.ts`
> **Jurisdiction:** Netherlands (EU). Lead supervisory authority: **Autoriteit Persoonsgegevens (AP)**. Consumer/marketing law: **ACM**. Payments oversight: **DNB** (relevant to our PSP, not to us — see §7).

This is the compliance backbone for an EU consumer + B2B product that handles **personal data** (owners, subscribers, leads), **photos** (which can be personal data and carry portrait/copyright rights), **payments** (the Kamp Cadeaukaart gift card), **third-party review data** (Google), and **direct marketing** (newsletter). Every epic plugs into the obligations below. The governing rule of thumb: **lean budget, EU data residency for every processor, consent only where required, minimise everything, document the basis.**

---

## 0. Controller, processors, and the no-regress invariants

**The legal entity.** Before launch, the district association (a Dutch *stichting* or *vereniging* — "Ondernemers van de Kamp" or equivalent) must be named as the **data controller** in the privacy policy, with a real postal address, **KvK number**, and a monitored contact. `info@ondernemersvandekamp.nl` (from `SITE.email`) is the privacy contact. Until the entity is confirmed, this is a **launch blocker** (§15).

**Roles.** We are the **controller** for owner accounts, leads, and newsletter subscribers. For each owner's *own* Google reviews accessed via OAuth, the owner remains controller of their listing; we are a processor/conduit. Cloudflare, Resend, Mollie, and Google are **processors** (or independent controllers, for Google's own crawling).

**Invariants — a PR that breaks any of these is a release blocker:**

- [ ] **No personal data stored without a documented lawful basis** (§2 RoPA). A new table/field holding personal data requires a RoPA row before merge.
- [ ] **EU data residency for every processor.** No US-only or residency-unknown service may touch personal data (§4).
- [ ] **The permission-gated image model holds** — no photo goes public without owner submission + admin approval (`business_media.status='approved'`) (§6).
- [ ] **No cookies/identifiers before consent** beyond strictly-necessary (`kamp_session`). We stay cookieless on the public site (§3).
- [ ] **Erasure stays complete** — any new table holding personal data is wired into `purgeBusiness()`/`purgeProfile()` in `src/lib/gdpr.ts` in the same PR (§5).
- [ ] **No Google Places review content is cached/stored** beyond `place_id` (§8).
- [ ] **No marketing email without double opt-in + recorded consent** (§9).
- [ ] **NAP in JSON-LD/metadata derives from `src/lib/site.ts`** — never hardcoded per page (consistency = both SEO and accuracy/consumer obligation).

---

## 1. Data inventory (what we hold, where, how long)

| Data | Where | Table / store | Personal data? | Special category? |
|---|---|---|---|---|
| Owner email | D1 | `profiles.email` | Yes | No |
| Session id | D1 + cookie | `sessions`, `kamp_session` | Yes (pseudonymous) | No |
| Magic-link token | D1 | `auth_tokens` | Yes (links to email) | No |
| Owner→business link | D1 | `owner_business` | Yes (relational) | No |
| Owner-submitted edits | D1 | `business_overrides.fields` (JSON) | Sometimes (phone, contact name, founder) | No |
| Uploaded photos | R2 + D1 | `kamp-photos` + `business_media` | Possibly (people in shot) | Possibly (if identifiable individuals) |
| App settings | D1 | `app_settings` (admin emails, Resend key) | Admin emails = personal | No |
| Newsletter subscriber | D1 (planned) | `newsletter_subscriptions` | Yes | No |
| Aanmelden lead | D1 (planned) | `leads` | Yes (name, email, phone, story) | No |
| Gift-card order | D1 (planned) | `gift_cards`, `gift_card_orders` | Yes (buyer email, payment ref) | No (financial, not special) |
| Google review snippets | **request-time only, never stored** | — | Yes (reviewer name) | No |
| `place_id` | D1 / seed (planned) | `businesses.placeId` | No (it is an exempt opaque id) | No |

**The seed is not personal-data-free.** `src/data/businesses.ts` contains publicly-listed business NAP plus, in some rows, a named *founder/person* (`publicPersonName`) used in the `founder` JSON-LD node. That is personal data of an identifiable individual published with their consent for promotion — treat the named-person field as consent-gated (§6).

---

## 2. RoPA — lawful basis per processing activity (Art. 30 GDPR)

Maintain this as the **Register of Processing Activities**. Add a row before any new processing ships.

| # | Activity | Categories | Lawful basis (Art. 6) | Retention | Owner |
|---|---|---|---|---|---|
| 1 | Owner account + magic-link auth | email, session, token | **6(1)(b)** contract (managing their listing) | Account life + 30 days; tokens 15 min; sessions 30 days | Backend |
| 2 | Owner listing edits | contact/phone/founder | **6(1)(b)** contract | Until changed or erased | Backend |
| 3 | Photo upload + moderation | image, possibly faces | **6(1)(a)** consent (uploader warrants rights) | Until superseded/erased | Owner-ops |
| 4 | Public listing display | business NAP, founder name | **6(1)(f)** legitimate interest (district promotion) + **6(1)(a)** for named persons | Until delisted | Content |
| 5 | Aanmelden lead | name, email, phone, story | **6(1)(b)** pre-contract steps | 12 months if not onboarded, then purge | Owner-ops |
| 6 | Newsletter | email, consent record | **6(1)(a)** consent + ePrivacy | Until unsubscribe + 3 yr consent-proof | Growth |
| 7 | Gift-card purchase | buyer email, amount, Mollie ref | **6(1)(b)** contract | **7 years** (Dutch tax — *bewaarplicht*) | Backend/Finance |
| 8 | Reviews via GBP OAuth (owner's own) | review text, OAuth token | **6(1)(b)** + owner consent (their data) | Token until revoked; reviews never persisted | Backend |
| 9 | Security/abuse logging | IP, rate-limit counters | **6(1)(f)** legitimate interest (security) | Rolling, ≤ 30 days | Backend |
| 10 | Cookieless analytics | aggregated, non-PII | **6(1)(f)** + cookieless ⇒ no consent | Provider default | Data/Analytics |

**DPIA trigger:** none of our activities individually meets the Art. 35 high-risk threshold (no large-scale special-category processing, no systematic monitoring). Document this conclusion once in writing. **Re-assess if** photo uploads grow to include systematic face data or if reviews are ever aggregated at scale.

---

## 3. Cookies, consent & cookieless analytics

**Position: stay cookieless and consent-banner-free on the public site.** Under the Dutch *Telecommunicatiewet* (ePrivacy) + GDPR, a consent banner is only mandatory if we set non-essential cookies/identifiers. We avoid that entirely.

**Strictly-necessary only — no banner required:**
- `kamp_session` — httpOnly, Secure, SameSite=Lax, set *only after login*. Functional/necessary ⇒ exempt. Document it in the cookie statement anyway.

**Analytics must be cookieless and EU-resident (§10).** Approved: **Cloudflare Web Analytics** (no cookies, no cross-site identifier, aggregated, free) or self-hosted **Plausible/Umami** on EU infra. **Forbidden without a consent banner:** Google Analytics (GA4), Meta Pixel, any tool that sets a client identifier or sends PII to the US.

**Checklist:**
- [ ] No `Set-Cookie` on any public route except post-login `kamp_session`.
- [ ] Analytics snippet (if added) is cookieless — verify DevTools → Application → Cookies is empty pre-login.
- [ ] `/cookies` page documents `kamp_session` (purpose, lifetime, necessary classification).
- [ ] If any future feature needs a non-essential cookie, a CMP and prior-consent gate ship in the same PR — no exceptions.

---

## 4. Sub-processors & DPAs (EU residency mandatory)

Every processor needs a signed/accepted **DPA** (Art. 28) and EU/EEA data residency. Maintain a public **sub-processor list** linked from the privacy policy.

| Processor | Role | EU residency | DPA | Notes |
|---|---|---|---|---|
| **Cloudflare** (Workers, D1, R2) | Hosting, DB, storage | D1+R2: pin to **EU location** at creation. Cloudflare DPA covers SCCs. | Cloudflare DPA (auto-accepted in dashboard) | **Action:** create D1/R2 with EU data location; confirm in dashboard. |
| **Resend** | Transactional + newsletter email | Use **EU region** sending | Resend DPA | Set sending region to EU; verify domain with EU DKIM. |
| **Mollie** | PSP / iDEAL (gift card) | Amsterdam HQ, EU-resident, DNB-licensed | Mollie DPA in dashboard | We never store full card/PAN data (§7). |
| **Google** (Places API, GBP API) | Reviews | Google as independent controller for its data; we don't store its content | Google Maps Platform / GBP ToS | No DPA needed for *us* since we don't persist their PII (§8). |
| **OpenFreeMap / MapLibre tiles** | Map basemap | No PII sent (no API key, no user id) | n/a | Verify tile requests carry no identifiers. |

**Cloudflare EU residency commands/config:**
```bash
# D1 — create with EU data location (jurisdiction restriction)
wrangler d1 create kamp-db --location weur   # Western Europe
# R2 — set EU jurisdiction at bucket creation
wrangler r2 bucket create kamp-photos --location weur
wrangler r2 bucket create kamp-next-cache --location weur
```
> Note: `wrangler.jsonc` currently has `database_id: "REPLACE_WITH_D1_DATABASE_ID"` — the app has never been deployed. When you run `wrangler d1 create`, do it with the EU location flag and paste the id. **Residency must be set at creation; it cannot be changed later without a migrate.**

**Checklist:**
- [ ] Sub-processor list published at `/privacy#subprocessors`.
- [ ] Each new third-party that touches PII is added to this table + the public list **before** going live.
- [ ] Resend sending region = EU; verify in API/dashboard.
- [ ] D1 and both R2 buckets created with `weur`/EU location.

---

## 5. Retention & the extended erasure engine

**Current engine:** `src/lib/gdpr.ts` exposes `purgeBusiness(businessId)` and `purgeProfile(profileId)`. They delete R2 objects then D1 rows in correct order (`profiles` cascades to `sessions` + `owner_business`). **This is the canonical erase path — extend it, never duplicate it.**

**The completeness rule (invariant):** any new table holding personal data **must** be wired into the relevant purge function *in the same PR that creates it*. A purge that misses a table is a GDPR Art. 17 failure.

```ts
// When adding e.g. newsletter_subscriptions + leads + gift_card_orders,
// extend purgeProfile() and add a purgeByEmail() entry point:
await db.prepare("DELETE FROM newsletter_subscriptions WHERE email = ?").bind(email).run();
await db.prepare("DELETE FROM leads WHERE email = ?").bind(email).run();
// EXCEPTION: gift_card_orders are retained 7 years (tax). Do NOT hard-delete;
// pseudonymise instead — null the email, keep amount + Mollie ref + timestamp.
await db.prepare(
  "UPDATE gift_card_orders SET buyer_email = NULL, pseudonymised_at = ? WHERE buyer_email = ?"
).bind(Date.now(), email).run();
```

**Retention schedule:**

| Data | Retention | Mechanism |
|---|---|---|
| `auth_tokens` | 15 min (validity); purge nightly | **Cron Trigger** (gap: no cron yet) |
| `sessions` (expired) | 30 days; purge nightly | **Cron Trigger** |
| Aanmelden lead | 12 months if not onboarded | Cron + manual review |
| Newsletter subscriber | Until unsubscribe; consent proof +3 yr | On unsubscribe + cron |
| Photos (superseded/rejected) | Delete on supersede; sweep orphans nightly | Sync + R2 lifecycle / cron |
| Gift-card order (financial) | **7 years** then pseudonymise/delete | Cron + tax rule |
| Account on erasure request | Immediate | `purgeProfile()` |

**Gap to close (Backend):** expired `auth_tokens` and `sessions` accumulate — there is no cron. Add a Cloudflare **Cron Trigger** (scheduled Worker export) to prune nightly. Zero cost.
```jsonc
// wrangler.jsonc
"triggers": { "crons": ["0 3 * * *"] }   // 03:00 nightly
```
```ts
// worker scheduled handler
export default {
  async scheduled(_ev, env) {
    const now = Date.now();
    await env.DB.prepare("DELETE FROM auth_tokens WHERE expires_at < ?").bind(now).run();
    await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run();
  }
};
```

**DSAR (data-subject request) SLA:** acknowledge ≤ 5 days, fulfil ≤ **1 month** (Art. 12). Provide: access (export), rectification (owner self-serves via `/beheer`), erasure (`purgeProfile`), portability (JSON export of `profiles`+`overrides`+`media` metadata). Log every DSAR (who, when, action) in an append-only `dsar_log` table.

---

## 6. Owner consent for personal data & photos (permission-gated image model)

**The image model is a compliance feature, not just UX.** No photo is public until: (1) the owner uploads it, and (2) an admin approves it (`business_media.status` flips `pending → approved`). The `/media/[...key]` route gates pending objects behind `getCurrentUser` + `canEdit`. Keep this invariant.

**Consent capture at upload (Owner-ops + Frontend):** the upload form in `/beheer/[id]` must show and require a checkbox warranting:
> "Ik heb het recht om deze foto te publiceren. Staan er herkenbare personen op, dan heb ik hun toestemming (portretrecht)." *(I have the right to publish this photo. If recognisable people appear, I have their consent — portrait rights.)*

- Persist the consent flag + timestamp on the `business_media` row (`uploader_consent INTEGER`, `consent_at INTEGER`) — proof of consent (Art. 7(1)).
- **Portretrecht (Dutch portrait law, Art. 21 Auteurswet):** recognisable individuals in commercial photos need permission. The warranty shifts responsibility to the uploading owner but we must (a) capture it and (b) provide a fast takedown path.
- **Copyright:** the uploader warrants they own/licensed the image. Same checkbox covers it.

**Named persons in the seed/listing:** `publicPersonName` / `founder` is personal data published for promotion. Capture the named individual's consent (offline is fine — record it). Provide removal on request — already covered by an approved override that clears the field.

**Takedown path:** a "Meld een foto / verzoek tot verwijdering" link on each business page → email to `info@…` → admin uses `/admin` to reject/purge. Target turnaround: 72 h.

**Checklist:**
- [ ] Consent checkbox + DB columns on upload.
- [ ] Pending media stays auth-gated (no regression in `/media/[...key]`).
- [ ] Takedown link present on business pages; rejection deletes R2 bytes (already done in `rejectMedia`).
- [ ] MIME magic-byte sniff + 5 MB cap retained (security, not just legal).

---

## 7. Payments / financial compliance — Kamp Cadeaukaart

**The licence question (PSD2 / e-money).** Issuing a stored-value gift card *can* fall under the **Wet op het financieel toezicht (Wft)** e-money rules. We avoid licensing two ways:

1. **Use Mollie as the licensed PSP** for the *payment* leg. Mollie is DNB-supervised; iDEAL settles bank-to-bank. We never touch card/PAN data ⇒ **PCI-DSS scope = SAQ-A** (fully outsourced; Mollie hosts the payment page / redirect). **Never POST card data to our Worker.**
2. **Stay inside the e-money exemption** for the voucher itself. The **limited-network exemption** (PSD2 Art. 3(k) / Wft) covers vouchers usable only within a **limited network of service providers** — i.e. *only the De Kamp businesses*. As long as the card is redeemable **exclusively at participating De Kamp ondernemers** (a closed, named network), it is exempt from an e-money licence. **Do not** allow redemption outside the district, or the exemption breaks.

**VAT — single- vs multi-purpose voucher (EU VAT Voucher Directive, NL implementation):**
- A De Kamp card redeemable across many businesses with **different VAT rates** (9% horeca/food vs 21% retail) is a **multi-purpose voucher (MPV)**. **VAT is due at redemption, not at sale.** The *sale* of an MPV is **not** a taxable event.
- Keep it MPV (the natural model here). This simplifies issuance: no VAT charged when the customer buys the card; each redeeming business accounts for VAT on their own sale. Document this in the gift-card terms and brief participating businesses.

**Dutch voucher validity law (consumer protection / ACM):**
- Vouchers may **not** have an unreasonably short expiry. Market norm + ACM guidance: **minimum 2 years**; many issuers use no expiry. **Set validity ≥ 2 years** and state it clearly at purchase.
- No fees that erode the balance during validity.

**Consumer rights:**
- A prepaid digital voucher is safest treated as a service the consumer can withdraw from within **14 days** **unless already redeemed**. State the withdrawal terms explicitly; refund unredeemed cards on request within 14 days.
- Show full **pre-contractual information** (price, validity, where redeemable, issuer identity, complaints route) before payment — Dutch *Wet koop op afstand*.

**Data & retention:** store buyer email + amount + Mollie payment id + voucher code (hashed) + status. **Retain 7 years** for the *bewaarplicht* (tax). On erasure request, **pseudonymise** (null email) rather than delete — financial-record retention overrides erasure (Art. 17(3)(b)).

**Mollie integration shape (Backend):**
```
POST /api/cadeaukaart/checkout   → create Mollie payment (redirect URL), insert gift_card_order(status='open')
GET  /api/cadeaukaart/return     → user returns; show pending
POST /api/cadeaukaart/webhook    → Mollie calls us; verify by re-fetching payment status from Mollie API
                                    (NEVER trust the webhook body); on 'paid' → issue voucher + email code via Resend
```
- Webhook **must** re-fetch payment status from Mollie's API (don't trust the POST body).
- Idempotency: webhook may fire multiple times — key issuance on `mollie_payment_id`.
- Use **Mollie test mode** (sandbox) for all non-prod.

**Checklist:**
- [ ] Mollie live key as `wrangler secret put MOLLIE_API_KEY` (never in `wrangler.jsonc`).
- [ ] Redemption restricted to participating De Kamp businesses (exemption).
- [ ] Card modelled + taxed as MPV (VAT at redemption).
- [ ] Validity ≥ 2 years, stated at purchase.
- [ ] Pre-contractual info + withdrawal terms + complaints route shown before payment.
- [ ] PCI scope kept to SAQ-A (no card data on our infra).
- [ ] Orders retained 7 yr; erasure = pseudonymise.

---

## 8. Google reviews compliance

Two distinct Google APIs, two compliance regimes. **Pick the right one per use case.**

**A) Places API (display reviews on a business page) — heavily restricted:**
- **No caching/storing** of Places API content (reviews, ratings, names, photos) beyond the documented exceptions. **The `place_id` IS exempt** and may be stored — store it (`businesses.placeId`).
- Fetch reviews **at request time only** (Next.js route handler `/api/reviews/[id]`, `force-dynamic`, no D1 write). Returns **max 5 reviews** per request — that is the API limit; design the UI around 5.
- **Attribution is mandatory:** when displaying review data you **must link back to Google Maps**. If no Google **map** is present on the page, the **Google logo + attributions must be shown unobscured**. (We have MapLibre, *not* a Google map — so logo + attribution are required.)
- Do **not** reorder, filter, or alter Google's review content/ranking.

**B) Google Business Profile API (owner reads/responds to their OWN reviews) — OAuth, the compliant owner route:**
- Each owner authenticates with **their own Google account** (OAuth 2.0) in `/beheer`. Scope: business management. They can read and respond to **their own** listing's reviews.
- Store the **OAuth refresh token encrypted** in D1, tied to the owner profile; never the reviews themselves. Token is the owner's credential — purge on account erasure and on disconnect.
- This is the route for an owner to *manage* reviews and for a **review-acquisition** flow.

**C) Review structured-data rule (2024+ self-serving policy) — do NOT chase star snippets:**
- `aggregateRating` / `review` markup for an entity's reviews shown **on that entity's own page** is **self-serving** and **NOT eligible** for review rich snippets for `LocalBusiness`/`Organization`. `src/lib/schema.ts` **correctly omits** `aggregateRating`/`review`. **Keep it omitted.**
- If we ever surface a star count, the visible number **must exactly match** a real user-sourced figure — but since markup won't earn a snippet anyway, put the SEO weight on **GBP local-pack ranking + a review-acquisition program**, not schema.

**Review-acquisition program (highest local-SEO ROI — Growth + Owner-ops):**
- After GBP OAuth, surface a **"Vraag een review"** button in `/beheer` that generates the Google review deep-link for that `place_id` (`https://search.google.com/local/writereview?placeid=...`).
- Generate a printable **QR** to that link for in-store use.
- Encourage owners to **respond to reviews** (a ranking + trust signal). NAP consistency anchored on `src/lib/site.ts`.

**Checklist:**
- [ ] `placeId` field added to Business model + D1 + seed (the only Places field we persist).
- [ ] Reviews fetched request-time, never cached/stored.
- [ ] Google logo + attribution shown unobscured (no Google map present).
- [ ] GBP OAuth refresh token stored **encrypted**, purged on erasure.
- [ ] `aggregateRating`/`review` stays absent from JSON-LD.

---

## 9. Marketing-consent law — newsletter (double opt-in + ePrivacy)

**Current state is non-compliant:** the footer "Schrijf je in" is a `mailto:` link and `/aanmelden` posts via `mailto:`. No consent record, no opt-in. Replace before any newsletter ships.

**Requirements (GDPR 6(1)(a) + ePrivacy/Telecommunicatiewet direct-marketing rules):**
- **Double opt-in:** signup writes a `pending` row + sends a confirmation email (Resend); only a clicked confirmation link flips to `confirmed`. Never email marketing to an unconfirmed address.
- **Granular, unbundled consent:** a dedicated checkbox, **not** pre-ticked, **not** bundled with the privacy policy or a lead form. Separate "newsletter" consent from "submit my business" consent.
- **Proof of consent (Art. 7(1)):** store `email`, `consent_text` (the exact wording shown), `consent_at`, `ip` (hashed/short-lived), `double_optin_confirmed_at`, `source`.
- **Easy unsubscribe:** one-click link in every email + a tokenised unsubscribe endpoint; honour immediately.
- **Soft opt-in (B2B):** Dutch law allows emailing existing customers about *similar* offerings, but given our volunteer scale, **default to explicit opt-in for everyone** — simpler and safer.

**Schema:**
```sql
CREATE TABLE newsletter_subscriptions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL DEFAULT 'nl',
  status TEXT NOT NULL DEFAULT 'pending',     -- pending | confirmed | unsubscribed
  consent_text TEXT NOT NULL,                  -- exact wording shown
  consent_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  token TEXT NOT NULL,                          -- confirm + unsubscribe
  source TEXT
);
```
**Endpoints:** `POST /api/newsletter/subscribe` (insert pending, send confirm) · `GET /api/newsletter/confirm?token=` (→ confirmed) · `GET /api/newsletter/unsubscribe?token=` (→ unsubscribed). Wire into `purgeProfile`/`purgeByEmail`. Resend EU region for both transactional + broadcast.

**Checklist:**
- [ ] Replace all `mailto:` signups with the double-opt-in flow.
- [ ] Unticked, unbundled consent checkbox with exact `consent_text` persisted.
- [ ] One-click unsubscribe in every email.
- [ ] Resend sending region = EU.

---

## 10. Analytics & measurement compliance

- **Cookieless + EU-resident only** (see §3). Approved: Cloudflare Web Analytics (free, no cookies) or self-hosted Plausible/Umami on EU infra.
- **No PII in analytics.** Never put email, business owner id, or session id into event payloads.
- **No GA4 / Meta Pixel** unless a CMP + prior consent ship — out of scope for the lean budget; avoid.
- IP-based security/rate-limit logging is `6(1)(f)` legitimate interest, kept ≤ 30 days, separate from analytics.

---

## 11. EU Accessibility Act / WCAG obligations

**The European Accessibility Act (EAA) applies from 28 June 2025** to consumer-facing e-commerce. The **Kamp Cadeaukaart purchase flow makes us an e-commerce service** ⇒ **WCAG 2.1 AA is a legal obligation**, not just best practice, for at least the public site + checkout. (Micro-enterprise exemptions exist for *services* under thresholds, but do not rely on it — the public guide should be AA regardless.)

**Standard: WCAG 2.1 AA (EN 301 549).** Known gaps to fix (from the design audit — own them as legal-adjacent):
- [ ] `<html lang="nl">` set in `layout.tsx` (currently missing — **zero-cost, fix immediately**).
- [ ] Focus-visible ring contrast: `--amber` (#c9822b) on `--background` is ~3.2:1; SC 1.4.11 needs ≥ 3:1 against *all* adjacent surfaces and it's invisible on dark surfaces — switch to `--amber-ink`/white or a dual-tone ring.
- [ ] `HoursTable` `text-white/40` on charcoal likely < 4.5:1 — verify and raise.
- [ ] `DistrictMap` keyboard flow: skip-link, keyboard-reachable popups, Escape to close.
- [ ] Checkout flow (Mollie redirect) keyboard + screen-reader tested end-to-end.
- [ ] Publish an **accessibility statement** (EAA requires it) at `/toegankelijkheid` describing conformance + a feedback contact.

Use the `design:accessibility-review` skill for audits at handoff.

---

## 12. Security & data-breach process

**Security baselines (Backend):**
- [ ] **Rate-limit `/login` and `/auth/callback`** — currently open to brute-force/token enumeration. Add a Cloudflare WAF rate-limit rule (e.g. 5 req/min/IP on `/login` POST) — zero code, free tier. Token enumeration mitigated by 64-char hex tokens + 15-min TTL + single-use, but add the WAF rule.
- [ ] Secrets via `wrangler secret put` only — never in `wrangler.jsonc`. (`RESEND_API_KEY`, `MOLLIE_API_KEY`, `ADMIN_EMAILS`, GBP OAuth client secret.)
- [ ] `AUTH_SECRET` is declared but unused (sessions are opaque D1 lookups). Either consume it for cookie HMAC or document it as reserved — don't leave a dead secret that lints as a hazard.
- [ ] Session cookie stays httpOnly + Secure + SameSite=Lax.
- [ ] Photo upload keeps magic-byte MIME sniff + 5 MB cap.
- [ ] No personal data in HTML source of `/admin` or `/beheer` (they're crawlable but auth-gated at runtime — verify no leakage).
- [ ] OAuth refresh tokens (GBP) stored **encrypted at rest** in D1.

**Breach process (Art. 33/34):**
1. **Detect & contain** — Backend on-call; revoke keys, isolate.
2. **Assess risk** to data subjects within hours.
3. **Notify the AP (Autoriteit Persoonsgegevens) within 72 hours** of becoming aware, if the breach poses a risk. Use the AP's *Meldloket datalekken*.
4. **Notify affected individuals** without undue delay if high risk.
5. **Log every breach** (even non-notifiable ones) in a breach register: what, when, scope, action, decision rationale.
- **Roles:** Backend = technical lead; Legal/Compliance = AP notification + individual comms; PM = coordination.
- Pre-draft the AP notification + a user-comms email template now so the 72h clock is never a scramble.

Use `engineering:incident-response` for the runbook + postmortem.

---

## 13. Public legal pages (launch blockers)

| Page | Route | Must contain | Owner |
|---|---|---|---|
| Privacy policy | `/privacy` | Controller identity (KvK), RoPA summary, lawful bases, retention, sub-processor list, DSAR rights + contact, AP complaint right | Legal |
| Cookie statement | `/cookies` | `kamp_session` (necessary), cookieless-analytics statement, "no tracking cookies" | Legal |
| Terms (gift card) | `/voorwaarden-cadeaukaart` | Issuer, validity ≥2yr, where redeemable, MPV/VAT note, withdrawal, complaints | Legal + Finance |
| General terms | `/voorwaarden` | Listing service terms (B2B), owner obligations, content rules | Legal |
| Accessibility statement | `/toegankelijkheid` | WCAG 2.1 AA conformance, known issues, feedback contact | Design + Legal |
| Imprint / contact | footer | KvK, address, email | Legal |

The footer currently links Privacy/Cookies to `#` placeholders — **wire these to real pages before launch.**

---

## 14. Applies to which epics

| Epic | Primary obligations from this playbook |
|---|---|
| **launch** | §0 controller, §3 cookieless, §4 EU residency (D1/R2/Resend), §5 cron + erasure, §11 `lang`/a11y/statement, §12 rate-limit + breach process, §13 all legal pages |
| **cadeaukaart** | §7 entire (PSD2 exemption, MPV VAT, validity, consumer rights, Mollie SAQ-A), §5 7-yr retention/pseudonymise, §11 EAA checkout, §13 gift-card terms |
| **google-reviews** | §8 entire (Places no-cache + attribution, GBP OAuth, self-serving schema), §1 `placeId` |
| **agenda** | §1 inventory (owner-submitted events = listing data, 6(1)(b)), §6 image consent for event photos, §5 expiry/retention |
| **owner-story** | §6 named-person + photo consent, §1 founder personal data, §5 erasure of story content |
| **newsletter** | §9 entire (double opt-in, ePrivacy, proof of consent, unsubscribe), §4 Resend EU, §5 retention |
| **bilingual** | §13 legal pages translated (EN privacy/cookies/terms); consent text per-locale stored in `consent_text` |
| **design-system** | §11 WCAG tokens (focus ring, contrast), accessibility statement inputs |
| **analytics** | §3 + §10 (cookieless, EU, no PII), §2 RoPA row #10 |
| **owner-ops** | §6 upload consent + takedown, §5 DSAR handling + lead retention, §8 review-acquisition, §0 controller comms |
| **discovery** | §1 inventory of any new personal-data fields, §3 no new cookies/identifiers |

---

## 15. Launch compliance gate (sign-off checklist)

Hard blockers — none ship to production until all are ✅:

- [ ] District association named as **controller** with KvK + address in `/privacy`.
- [ ] D1 + both R2 buckets created with **EU location**; `database_id` filled in `wrangler.jsonc`.
- [ ] Resend **EU region** + verified domain.
- [ ] Sub-processor list published; all DPAs accepted (Cloudflare, Resend, +Mollie when live).
- [ ] `/privacy`, `/cookies`, `/voorwaarden`, `/toegankelijkheid` live and linked from footer (no `#`).
- [ ] No non-essential cookies; analytics cookieless + EU.
- [ ] `<html lang="nl">` set; focus-ring contrast fixed; accessibility statement published.
- [ ] WAF rate-limit on `/login`; secrets via `wrangler secret put`; OAuth tokens encrypted.
- [ ] Nightly **cron** prunes expired tokens/sessions.
- [ ] Every personal-data table wired into `purgeProfile`/`purgeBusiness`; DSAR SLA + breach (72h) runbook documented; breach + DSAR registers exist.
- [ ] **Gift card (if live):** MPV/VAT modelled, validity ≥2yr, redemption limited to De Kamp, Mollie SAQ-A, 7-yr retention/pseudonymise, terms page live.
- [ ] **Newsletter (if live):** double opt-in, unbundled consent, one-click unsubscribe, consent proof stored.
- [ ] **Reviews (if live):** request-time only, Google logo+attribution shown, no caching beyond `place_id`, schema has no `aggregateRating`.

---

## Tooling & recommendations

- **Cloudflare WAF rate-limiting** — magic-link spam / token enumeration defence (free, no code).
- **Cloudflare Web Analytics** — cookieless, EU, consent-free, free.
- **Cloudflare Cron Triggers** — nightly D1 retention sweeps (free).
- **Mollie** (test + live mode) — DNB-licensed PSP, iDEAL, EU-resident, keeps us at PCI SAQ-A.
- **Resend (EU region)** — transactional + double-opt-in newsletter, EU data residency, DPA.
- **Google Business Profile API (OAuth)** — compliant owner-review route; **Places API** only for request-time display with attribution.
- **`design:accessibility-review` skill** — WCAG 2.1 AA audits at design handoff.
- **`engineering:incident-response` skill** — breach/incident runbook + blameless postmortem.
- **AP *Meldloket datalekken*** — 72h breach notification channel; pre-draft the form.
- **Registers to maintain** (plain markdown in `/docs/compliance/`): RoPA, sub-processor list, DSAR log, breach register, consent-text changelog.

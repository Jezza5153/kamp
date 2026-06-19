# Audit — Ondernemers van de Kamp

_Next.js 16 (App Router, React 19) on Cloudflare Workers via @opennextjs/cloudflare · D1 (SQLite) + R2 · magic-link auth · EU/GDPR-mandatory · edge runtime (no Node-only APIs, no D1 interactive transactions)._

All findings below were re-verified against the actual code under `src/`, `worker/`, and `migrations/` at audit time. File:line references are current.

---

## Executive summary

Overall health: **structurally strong, launch-blocked by two money-path correctness bugs and a cluster of dead/unwired UI.** The backend (Steps 1–10) is coherent, follows good patterns (overdraw-safe conditional writes, server-side sessions, double-opt-in, fail-soft external calls), and is test-covered. But the gift-card flow — the one money-handling subsystem — has a webhook bug that silently never issues paid cards, and a non-atomic redeem that can take money without recording a settlement. Several conversion/SEO surfaces are built but not wired (the review-QR funnel, `track()`, sitemap/llms.txt coverage), so revenue- and discovery-driving features are inert.

### Counts by severity
- **Critical:** 1
- **High:** 2
- **Medium:** 14
- **Low:** 16

### Top 5 to fix first
1. **Mollie webhook never issues the card** — dedupe records the payment id on the *first* (non-paid) callback, so the real `paid` callback is dropped. Buyer pays, card stays draft, balance 0. (`src/lib/giftcard.ts:104-133`)
2. **`redeem()` is non-atomic** — ledger debit and the `redemptions` settlement row are two separate writes; a crash between them charges the customer but never records the row the SEPA payout reads, so the merchant is never paid. (`src/lib/giftcard.ts:202-220`)
3. **Magic-link consumption is racy** — read-then-write single-use check lets a prefetch + real click both mint a session. Make it a conditional `UPDATE … WHERE used=0 RETURNING email`. (`src/lib/auth.ts:108-114`)
4. **Review-QR funnel has no entry point** — `createReviewRequest()` is never called, so `/r/[token]` is permanently dead. Add the admin "generate QR" action. (`src/lib/reviews.ts:100`)
5. **`track()` fires nowhere + sitemap/llms.txt omit verhalen & nieuwsbrief** — analytics conversions are always empty and the richest content sections are invisible to crawlers/answer-engines.

---

## Critical & High findings

### [CRITICAL] Mollie webhook dedupe drops the real `paid` callback; card never issued
**File:** `src/lib/giftcard.ts:104-133` (PK is `payment_id`, `migrations/0009_cadeaukaart.sql:52`)

`handleMollieWebhook` short-circuits at line 108 (`if (seen) return`) when a row for `payment_id` already exists, but at line 118-121 it INSERTs that `payment_id` **before** the `if (payment.status !== 'paid') return` check at line 123. Mollie fires a webhook on *every* status transition for the same payment id (iDEAL/card almost always send a non-paid callback first). The first non-paid webhook records the id as seen and returns at 123 without issuing; when the genuine `paid` webhook arrives, line 108 treats it as already processed and returns before reaching `issueGiftCard()` at line 133. Net result: **buyer pays, no ledger row written, card stays `draft` (balance 0).** The dedupe is also redundant — `issueGiftCard` is already idempotent via the draft-only `UPDATE` (line 146) and the ledger `UNIQUE idempotency_key issue:<cardId>` (line 152).

**Fix:** Remove the early `if (seen) return;` (lines 104-108) and rely on the existing idempotency guards. If a dedupe marker is still wanted, only record/short-circuit **after** confirming `status==='paid'` (key it `paid:<id>`), so non-paid callbacks never mask the subsequent paid callback.

### [HIGH] `redeem()` debits the ledger and writes the `redemptions` row non-atomically
**File:** `src/lib/giftcard.ts:202-220`

The overdraw-safe conditional ledger INSERT (lines 202-211, via `.first()` with `RETURNING`) commits the `-amountCents` debit on its own. A **second, independent** `INSERT INTO redemptions` (lines 214-220) follows but is **not** batched with it. D1 has no interactive transactions (the file's own header, line 7), so if the worker is evicted or the second INSERT throws, the card is debited (money gone) yet no `redemptions` row exists. Migration 0009 confirms `redemptions` is the settlement table the SEPA payout reads (`payout_id` "stamped when settled", line 36; `idx_redemptions_merchant`, line 39) — a missing row means **the merchant is never paid for a redemption the customer was charged for.** The `catch` at line 223 cannot roll back the committed debit. The same file's `issueGiftCard()` (lines 145-153) correctly uses `db.batch([...])`, proving `redeem()` deviates from the established pattern.

**Fix:** Make the two writes atomic with `db.batch([...])`. Make the `redemptions` INSERT conditional on the same overdraw guard, e.g. `INSERT INTO redemptions (...) SELECT … WHERE EXISTS (SELECT 1 FROM gift_card_ledger WHERE id = <ledgerId>)`, so it is skipped on overdraw but atomic with the debit. Alternatively, drop `redemptions` entirely and derive settlements from `gift_card_ledger WHERE kind='redeem'` at payout time (carry a `payout_id`/settled marker on the ledger). Add a test that an aborted `redemptions` INSERT leaves no orphaned debit.

### [HIGH] Review-acquisition QR funnel has no token generator — `createReviewRequest()` is never called
**File:** `src/lib/reviews.ts:100`

`createReviewRequest(businessId)` is the only writer to `review_requests`, and grep across `src/` finds it referenced **nowhere** but its own definition. Importers of `reviews.ts` use only `setPlaceId`, `listBusinessGoogle`, `getBusinessGoogle`, `resolveReviewRequest`, `writeReviewUrl` — none mint a token. `/admin/google` renders only the place_id linking form; there is no `src/app/beheer` review-QR UI. Consequently **no `review_requests` row can ever be created**, so `/r/[token]` always falls into the `if (!res)` branch and redirects to `/`, and `resolveReviewRequest` is dead in production. The funnel is structurally complete but missing its entry point. Not on the known-deferred list — a genuine, undocumented wiring gap.

**Fix:** Add `createReviewRequestAction` in `src/app/admin/actions.ts` (mirror `setPlaceIdAction` with `requireAdmin`) that calls `createReviewRequest(businessId)` and returns the token. On `/admin/google/page.tsx`, add a per-business "Genereer review-QR" button that surfaces `/r/<token>` as a printable QR. Optionally guard generation on a place_id already being linked.

---

## Medium findings

### [MED] Magic-link token single-use is racy (read-then-write, not atomic)
**File:** `src/lib/auth.ts:108-114`
`completeLogin()` does `SELECT auth_tokens` → JS check (`!row || row.used || expired`) → separate `UPDATE auth_tokens SET used=1`. Two statements, no conditional guard. D1 has no interactive transactions, so two concurrent requests with the same still-valid token can both pass the check before either UPDATE commits, each minting a profile+session. A magic link becomes replayable in a tight window (email-scanner prefetch + the user's real click, or an intercepted link). The whole auth model rests on the token being single-use.
**Fix:** `UPDATE auth_tokens SET used=1 WHERE token=? AND used=0 AND expires_at>? RETURNING email` and only continue when a row is returned. Drop the separate SELECT+UPDATE. (Mirrors the overdraw-safe pattern in `giftcard.redeem()`.)

### [MED] Gift-card balance rate limit is keyed on the guessed code, not the caller
**File:** `src/app/api/cadeaukaart/saldo/[code]/route.ts:13`
The route's own comment calls this "a code-guessing oracle," yet the rate-limit key (`saldo:${code}`) includes the **attacker-supplied code**. Each distinct guessed code gets its own fresh 10/hour bucket, so an enumerating attacker is never throttled (only repeated lookups of the *same* code are). The only real protection is code entropy (~32^8 ≈ 1.1e12). The control as written gives ~zero protection against the stated threat.
**Fix:** Rate-limit by caller: `saldo:ip:${cf-connecting-ip}` (e.g. 30/hour) plus a global `saldo:global` ceiling. Keep returning a uniform `{found:false}` on miss; consider collapsing "found but wrong status" and "not found" to one response shape.

### [MED] Balance-oracle rate limit keys on the raw, un-normalized code
**File:** `src/app/api/cadeaukaart/saldo/[code]/route.ts:13`
The key uses the raw path param `code`, but `getBalanceByCode()`/`hashCode()` normalize with `.trim().toUpperCase()`. So `kamp-aaaa-bbbb`, `KAMP-AAAA-BBBB`, ` KAMP-AAAA-BBBB` all resolve to the same card but get **separate buckets** — an attacker multiplies their budget with case/whitespace permutations.
**Fix:** Normalize before building the key: `const norm = code.trim().toUpperCase(); rateLimit(db, 'saldo:'+norm, …)`. Better still, also rate-limit per client IP (see prior finding).

### [MED] Retried till redeem with the same idempotency_key returns a hard failure instead of the original success
**File:** `src/lib/giftcard.ts:202-225`
The redeem path blocks the double-spend via the `UNIQUE idempotency_key` — but it does so by *throwing* on the UNIQUE violation, caught at line 223 → `{ ok:false, reason:'duplicate_or_error' }`. So a network-retried till submit (the exact scenario the key exists for) reports **failure** to the cashier even though the first attempt succeeded and the customer was charged. A cashier seeing "failed" will re-key with a fresh idempotency key, **double-charging** the card.
**Fix:** On the conditional INSERT, branch on whether a `redeem` row with this idempotency_key already exists: if so, return `{ ok:true, balanceCents }` (the prior result). Distinguish `insufficient` (no row, balance too low) from `duplicate` (key already used) so the till can act safely.

### [MED] `inviteOwnerAction` mints an unthrottled magic-link login token for any admin-typed email
**File:** `src/app/admin/actions.ts`
`inviteOwnerAction` calls `inviteOwner()` then, `if (res.ok) await requestMagicLink(email, { skipThrottle: true })`. The `skipThrottle:true` mints an **unthrottled** auth token for any email the admin types. If an admin mistypes the email of a valid business, the invite binds an address the real owner doesn't control and a login link is mailed to the wrong address — and `skipThrottle` bypasses the 5/15min bucket entirely, so a compromised/abused admin session can mass-mint login tokens. The email-match boundary limits blast radius, but the unthrottled mint with no confirmation is a real operational hazard.
**Fix:** Keep `skipThrottle` for legitimate invites but add a coarse per-admin limit (`rateLimit('invite:admin:<adminId>', …)`). Surface the bound email back for confirmation before the token is minted. Log the mint to the moderation log with the admin id and alert on bursts.

### [MED] `track()` conversion beacon is never fired from any component _(known-deferred, confirmed)_
**File:** `src/lib/track.ts`; surfaces in `src/components/BusinessDetailClient.tsx:176-215`
`track(type, businessId, detail)` posts to `/api/collect`, but grep across `src/` shows it is imported/called **nowhere** (the only references are its own docstring and a literal `<code>track()</code>` in `/admin/statistieken`). The obvious conversion surfaces are unwired: the reserveren/bestellen/menukaart/website/Instagram anchors in `BusinessDetailClient.tsx` (lines 176-215) have no `track('action_click', …)`. So `analytics_events` action_click data will always be empty.
**Fix:** Import `track` in `BusinessDetailClient.tsx` and add `onClick={() => track('action_click', b.id, { kind:'reserveren' })}` (etc.) to the booking/order/menu/website anchors; fire `track('story_view', …)` on `/verhalen/[slug]`. Pageviews still need Cloudflare Web Analytics.

### [MED] `sitemap.ts` omits `/verhalen`, every story slug, and `/nieuwsbrief`
**File:** `src/app/sitemap.ts:25-36`
`staticPages` lists 8 URLs (home, kaart, agenda, cadeaukaart, loop-de-kamp, praktisch, over-de-kamp, aanmelden) and the return spreads only `staticPages + categoryUrls + businessUrls`. The real indexable routes `verhalen/page.tsx`, `verhalen/[slug]/`, and `nieuwsbrief/page.tsx` never appear. Story pages emit Article JSON-LD yet aren't enumerated, so Google won't discover them via the sitemap. `getPublishedStories` (`stories.ts`) already returns `[]` during `phase-production-build`, so adding it keeps the sitemap hermetic.
**Fix:** Add `{ url: base+'/verhalen', priority:0.7 }` and `{ url: base+'/nieuwsbrief', priority:0.4 }`; import `getPublishedStories`, await it, and map each story to `${base}/verhalen/${s.slug}` with `lastModified` from `dateModified ?? publishedAt`. Spread into the returned list.

### [MED] `llms.txt` "Belangrijke pagina's" omits the new `/verhalen` and `/nieuwsbrief` sections
**File:** `src/app/llms.txt/route.ts:30-38`
The curated AI-index lists `/`, `/kaart`, `/agenda`, `/cadeaukaart`, `/loop-de-kamp`, `/praktisch`, `/over-de-kamp`, `/aanmelden` but never mentions `/verhalen` (the richest narrative section) or `/nieuwsbrief`, and has no per-story enumeration. Answer engines indexing via this file won't surface or cite the owner stories.
**Fix:** Add lines for `/verhalen` and `/nieuwsbrief`, and a `## Verhalen` section looping `getPublishedStories()` emitting `- {title}: {dek}; ${SITE.url}/verhalen/{slug}`. The file is force-static and already pulls live data, so it stays self-updating.

### [MED] `/nieuwsbrief` `?status=` variants are indexable, thin/confusing duplicates
**File:** `src/app/nieuwsbrief/page.tsx:8-16,21-41`
The page renders different content for `?status=bevestigd|uitgeschreven|mislukt` (transactional states reached from email links). Canonical is hard-pinned to `/nieuwsbrief` (line 8, good) but there is **no robots noindex**, so an indexed "Uitgeschreven" or "Link verlopen" page is a poor SERP result for a "nieuwsbrief De Kamp" query. The page already reads `searchParams`.
**Fix:** Convert to `generateMetadata({ searchParams })` returning `{ ...base, robots: status ? { index:false, follow:true } : undefined }`. Bare `/nieuwsbrief` stays indexable.

### [MED] Primary `/admin` (moderation) page doesn't link to the new admin sections
**File:** `src/app/admin/page.tsx:25-35`
The admin landing header links only to `/admin/instellingen`, `/beheer`, and logout. The new sections `/admin/{google,agenda,nieuwsbrief,verhalen,statistieken}` are linked **only** from `/admin/instellingen` (verified at `instellingen/page.tsx:25-40`). So they're reachable but one hop away and absent from the page an admin lands on most — a discoverability gap.
**Fix:** Add the same nav cluster (Agenda / Nieuwsbrief / Verhalen / Statistieken / Google) to the `/admin/page.tsx` header, or extract a shared `<AdminNav>` used by both Moderatie and Instellingen.

### [MED] Owner self-submission entry points absent — no owner UI for pending events or stories _(known-deferred, confirmed)_
**File:** `src/app/beheer/[id]/page.tsx`
`events.ts createEvent()` accepts status `'pending'` and the admin agenda page already renders an approve/reject queue for pending events — but the only caller of `createEvent` is `src/app/admin/actions.ts` (admin, submitting approved). No owner-facing form creates a pending event (grep of `beheer/[id]/page.tsx` for `createEvent`/`event`/`story` = 0 matches); the page exposes only field edits + photo upload. So the `pending` path and the admin pending-event queue can never be exercised by an owner.
**Fix:** Add an owner "Evenement aanmelden" form on `/beheer/[id]` that calls `createEvent(input, 'pending', user.id)`; optionally a story-suggestion form. The admin approval UI is already present.

### [MED] Form status changes (success/error) are not announced — no `aria-live` anywhere
**File:** `src/components/NewsletterSignup.tsx:31-37,64` (and the login/aanmelden banners)
A grep for `aria-live` / `role="status"` / `role="alert"` across `src/` returns **zero** matches. In NewsletterSignup the form is swapped for a success `<p>` (line 33) and an error `<p>` appears on failure (line 64), but neither is in a live region — a screen-reader user gets no announcement of success or failure. WCAG 4.1.3 (Status Messages, AA). _(Note: the submit button **is** disabled on `sending` at line 58, so this component does handle the busy state — the gap is the unannounced result.)_
**Fix:** Wrap the success paragraph in `role="status" aria-live="polite"` and the error in `aria-live="assertive"`, keeping the live region mounted so the change is announced.

### [MED] Lead form (and most server-action forms) has no pending/loading state
**File:** `src/components/AanmeldenForm.tsx` (plus login + all `/admin` + `/beheer` forms)
`AanmeldenForm` posts a server action that does a DB write + email + redirect with no `useFormStatus`/disabled-on-pending on the submit button (grep for `useFormStatus`/`useActionState`/`isPending` across `src/` = 0 hits). On a slow connection the user sees no spinner and can click again; the per-email 3/hr limit softens duplicate leads but gives zero feedback during the round trip. Same gap on login and all admin/beheer plain non-JS submit forms. _(NewsletterSignup is the lone exception — it disables on `sending`.)_
**Fix:** A shared `<SubmitButton>` client component using `useFormStatus()` to set `disabled` + a "Bezig…" label while pending, applied to the highest-traffic forms (AanmeldenForm, login) and reused across admin/beheer.

### [MED] Mobile menu toggle is an icon-only button with no `aria-label`/`aria-expanded`; collapsed links stay focusable
**File:** `src/components/Navbar.tsx:78-83,89-153`
The hamburger button (lines 78-83) renders only a `<Menu>`/`<X>` icon — no accessible name, no `aria-expanded`/`aria-controls`. SR users hear an unlabeled "button." The mobile menu (lines 89-153) collapses by animating height to 0 / opacity 0, but the `<Link>` children **stay in the DOM and remain tabbable** while visually hidden, so keyboard/SR users can tab into invisible nav items when the menu is closed.
**Fix:** Add `aria-label={isOpen ? 'Menu sluiten' : 'Menu openen'}`, `aria-expanded={isOpen}`, `aria-controls="mobile-menu"`; give the container `id="mobile-menu"` and `hidden`/`inert` when closed.

---

## Low / polish

### [LOW] Gift-card order endpoint has no honeypot/rate-limit/email-validation
**File:** `src/app/api/cadeaukaart/order/route.ts:7-14`; `src/lib/giftcard.ts:51-71`
`POST /api/cadeaukaart/order` parses amount+email and calls `createGiftCardOrder`, which INSERTs a draft row (storing `buyer_email` PII) and POSTs to Mollie — with **no** rate limit, **no** honeypot, and **no** email-format validation (`buyer_email` is written raw-lowercased). Every other public write path (aanmelden, newsletter/subscribe) has honeypot + per-email rateLimit; this one doesn't. Fail-soft until `MOLLIE_API_KEY` is set, but once live it lets anonymous callers spam draft rows + Mollie payment creations and store arbitrary unvalidated PII.
**Fix:** Before `createGiftCardOrder`: add a honeypot check, per-IP and per-email `rateLimit` (mirror newsletter/subscribe), and validate `buyer_email` with the shared `EMAIL_RE`. Required hardening before the legal gate lifts.

### [LOW] `analytics_events` is not touched by `purgeProfile`/`purgeBusiness`
**File:** `src/lib/gdpr.ts:15-44,49-85`
Both purges were extended to the new PII tables (leads, owner_invites, business_google, review_requests, events, story_business, newsletter_subscribers) but **neither deletes from `analytics_events`**. The `visitor_hash` is a daily-salted HMAC (effectively unlinkable, acceptable) — genuinely low — but the `detail` JSON column is caller-supplied and unbounded (see next finding); if any caller ever puts identifying data there it survives an erasure request. Retention pruning lives only in `worker/index.ts`, inactive by default, so nothing prunes analytics today.
**Fix:** Either (a) contractually enforce no-PII by whitelisting/size-capping `body.detail` in `/api/collect`, or (b) add `DELETE FROM analytics_events WHERE business_id=?` to `purgeBusiness`. Note in DEPLOY docs that retention pruning doesn't run until the cron wrapper is activated.

### [LOW] Analytics `detail` JSON accepted unbounded/unsanitised from anonymous clients
**File:** `src/app/api/collect/route.ts:29-33`
`body.detail` (unknown) is passed straight into `recordEvent` → `JSON.stringify` into `analytics_events.detail` with no size limit, key whitelist, or type check (only `type` and `businessId` are validated/truncated). An anonymous caller can stuff arbitrary content — including PII or large payloads — into the table, undermining the cookieless/no-PII posture and giving a cheap storage-bloat vector (only guard: 200 events/hour per IP).
**Fix:** Whitelist/shape `detail` per event type (small set of string keys with length caps) and size-cap the stored value; reject/drop anything outside the shape.

### [LOW] Mollie webhook endpoint is an unauthenticated, unthrottled outbound-fetch trigger
**File:** `src/app/api/webhooks/mollie/route.ts:9-14`
The handler correctly never trusts the POST body and re-fetches with the secret key (good). Residual: the endpoint is fully public, so any caller can POST `id=tr_…` to make the server perform an outbound authenticated Mollie call (fetch-amplification / recon vector), with no rate limit and no id-format check. Dedupe only protects already-seen ids; a flood of distinct/garbage ids each triggers a fresh outbound fetch. Mollie doesn't sign webhooks, but the request can still be constrained.
**Fix:** Add a per-IP `rateLimit` and short-circuit malformed ids (`/^tr_[A-Za-z0-9]+$/`) before fetching. Optionally restrict to Mollie source IPs via the WAF.

### [LOW] `createGiftCardOrder` leaves an orphaned `draft` row when Mollie returns no checkout URL
**File:** `src/lib/giftcard.ts:64-94`
The draft `gift_cards` row is INSERTed (lines 65-71) **before** the Mollie payment is created. If `res.ok` is false (line 85) or there's no checkout href (line 91), the function returns `ok:false` but the draft row is never cleaned up — over time, failed/abandoned orders accumulate orphaned `draft` rows holding `buyer_email` PII with no payment. No stale-draft sweep exists (the `worker/index.ts` TODO at line 53-54 only mentions it as future work).
**Fix:** Create the Mollie payment first and INSERT the draft only once a checkout URL is obtained; or add a nightly `DELETE FROM gift_cards WHERE status='draft' AND created_at < ?` (24-48h) to the maintenance batch (also reclaims the PII per data-minimisation).

### [LOW] `getApprovedEvents` has no secondary sort, so date-less events reorder nondeterministically
**File:** `src/lib/events.ts:97`
`ORDER BY start_date IS NULL, start_date ASC` — date-less D1 events (`start_date NULL`, valid for whenText-only events) all sort into one trailing block with no tiebreaker, so SQLite's return order can shift between ISR regenerations and looks buggy to owners.
**Fix:** `ORDER BY start_date IS NULL, start_date ASC, submitted_at ASC` (or title).

### [LOW] Cron worker maintenance batch has drifted out of sync with `maintenance.ts`
**File:** `worker/index.ts:41-49` vs `src/lib/maintenance.ts:10-29`
The inlined worker batch includes `DELETE FROM analytics_events WHERE created_at < (now - 35d)` (line 48) which does **not** exist in `maintenanceStatements()` (the canonical, unit-tested version stops at newsletter, lines 24-28). The two prune definitions have diverged. Because `worker/index.ts` is inactive by default, in the default deploy `analytics_events` is **never pruned** (GDPR retention drift), and a future edit to `maintenance.ts` won't reach the worker.
**Fix:** Pick one source of truth — generate the worker SQL from `maintenanceStatements()` at build time, or add the analytics prune to `maintenance.ts` and a test asserting the two lists match. Confirm a Cloudflare cron trigger is actually wired before launch (today nothing prunes sessions/tokens/rate_limit/analytics in production).

### [LOW] `createReviewRequest` can silently fail (returns null) with no observability
**File:** `src/lib/reviews.ts:100-113`
Uses `randomToken(16)` (128-bit) with `token` as PK. Collision is astronomically unlikely, but if the INSERT fails for any reason the catch at 110-112 returns `null` with no retry/log — the admin's "generate QR" action just silently yields nothing.
**Fix:** Log the failure (`console.error`) for debuggability and/or one retry on conflict. Non-blocking.

### [LOW] Newsletter unsubscribe route is unreachable by mail clients
**File:** `src/lib/email.ts`; `src/app/api/newsletter/unsubscribe/route.ts`
`/api/newsletter/unsubscribe` supports GET (link) + POST (RFC 8058 one-click), but `sendEmail(to, subject, html)` has no header parameter, so the `List-Unsubscribe`/`List-Unsubscribe-Post` headers are never sent. The only newsletter email sent (the double-opt-in confirm) contains just the confirm link — no unsubscribe link. With no campaign-send feature yet, subscribers have no path to the unsubscribe route; `unsub_token` is generated but unused end-to-end.
**Fix:** Extend `sendEmail` to accept optional headers, set `List-Unsubscribe`/`List-Unsubscribe-Post` on bulk mail, and include a visible unsubscribe link in every newsletter. Tie to the not-yet-built campaign sender.

### [LOW] No audit trail for money-in (gift card issued) or newsletter confirm
**File:** `src/lib/giftcard.ts:99-137`; `src/app/api/newsletter/confirm/route.ts`
Invite claim IS audited (`invites.ts claimInvitesForEmail` batches a moderation stmt). But `handleMollieWebhook` (gift card issued — the most audit-worthy "money-in" event) writes no `moderation_log`/analytics, and `confirmSubscriber` logs only an internal `subscriber_events` row, not a `logServerEvent`.
**Fix:** In `handleMollieWebhook` after a successful issue, `logModeration({ actorId:'system', action:'giftcard_paid', targetType:'gift_card', targetId, detail:{ amountCents } })`. Optionally log newsletter confirm for funnel stats.

### [LOW] Footer social icon is a dead `href="#"` plus Privacy/Cookie stubs
**File:** `src/components/Footer.tsx:19,90-91`
The social (Camera) icon button (line 19) has `href="#"` and goes nowhere. The "Privacy" (line 90) and "Cookiestatements" (line 91) links are also `href="#"`. For a GDPR-mandatory site, dead Privacy/Cookie links are visible broken wiring.
**Fix:** Point the social icon at the real Instagram/Facebook URL or remove it; create `/privacy` and `/cookies` pages and link them. These must exist before launch.

### [LOW] Admin moderation landing doesn't link to the new admin sections _(duplicate-grouped with the MED nav finding)_
**File:** `src/app/admin/page.tsx:25-35` vs `src/app/admin/instellingen/page.tsx:25-40`
All five new admin pages link back only to `/admin/instellingen`, and the cross-links to them live solely inside the Instellingen header. The primary entry point `/admin` exposes only Instellingen / Vermeldingen / Uitloggen — inconsistent hub-and-spoke nav.
**Fix:** Add the admin-section nav row to `/admin/page.tsx`, or extract a shared `<AdminNav>`. _(Same root cause as the medium "primary /admin doesn't link" finding — fix once.)_

### [LOW] "Verhalen" is in the footer but missing from desktop and mobile primary nav
**File:** `src/components/Navbar.tsx:46-66,94-152`; present in `Footer.tsx:36`
`/verhalen` is a full content hub with ISR + Article JSON-LD, listed in the Footer (line 36) but absent from the Navbar — neither the desktop link row nor the mobile menu includes it. `/nieuwsbrief` is also only reachable via the footer signup (more acceptable). Stories are hard to discover for users who don't scroll to the footer.
**Fix:** Add a "Verhalen" link to the desktop nav row and mobile menu, mirroring Agenda/Cadeaukaart.

### [LOW] `--amber` used as link/focus color despite token comment flagging it as failing AA on light
**File:** `src/app/globals.css:20,96,119`; usages in `BusinessExplorer.tsx:196,79`, `BusinessDetailClient.tsx:165,170`
The token comment (line 20) says `--amber (#c9822b)` is "DECORATION / FILL ONLY — fails AA as text on light," yet (a) the `:focus-visible` outline uses `var(--amber)` (line 96) over cream, borderline for 3:1 UI contrast (WCAG 1.4.11), and (b) `.text-amber` (line 119) is applied as interactive text in light-surface hover states (BusinessExplorer chip/clear-search hover; BusinessDetailClient phone/email `hover:text-amber` at lines 165/170), dropping to ~3:1 amber-on-cream, below the 4.5:1 AA text minimum.
**Fix:** Use `var(--amber-ink)` (#8a5a16, the AA-safe text amber already defined) for hover/link text on light surfaces, and switch the `:focus-visible` outline to `--amber-ink` or `--deep-green`.

### [LOW] Google review author photo & profile link are parsed but never rendered
**File:** `src/components/GoogleReviews.tsx:8-9,81`; `src/lib/places.ts:13-14,47-48`
`places.ts` populates `photoUrl`/`authorUrl` on each review (lines 47-48) and the `Review` interface declares them (lines 8-9), but the render shows only `{r.author}` as plain text (line 81) — no avatar, no link to the reviewer's Google profile. Google Places attribution guidance expects name + photo + profile link.
**Fix:** Render `r.photoUrl` as a small rounded avatar next to the name, and wrap `r.author` in `<a href={r.authorUrl} target="_blank" rel="noopener noreferrer">` when set.

### [LOW] GoogleReviews renders nothing during load and silently nothing on error
**File:** `src/components/GoogleReviews.tsx:61`
Returns `null` until loaded and whenever `reviews.length === 0` or the fetch fails (line 61). On the detail page the section simply never appears with no indication it was attempted; on a slow API the area pops in late (layout shift). Combined with the separate "Reviews op Google" chip in `BusinessDetailClient`, a user may expect inline reviews that never materialise on error. Acceptable as a product decision.
**Fix (optional):** Render a lightweight skeleton while `!loaded` to reserve space; leave empty/error returning null.

### [LOW] Verhalen index OpenGraph has no description and no image
**File:** `src/app/verhalen/page.tsx:13`
The `openGraph` block sets only `title` and `url` — no `og:description`, no `og:image`. Shares of the verhalen hub render as a bare title card. The agenda page sets an OG description; verhalen should match.
**Fix:** Expand to `openGraph: { title, description: 'De verhalen achter de winkels, ateliers en horeca van De Kamp in Amersfoort.', url:'/verhalen' }`. The site already has a default `/opengraph-image.tsx`.

### [LOW] Story cards and Article pages surface no visible publish/updated date
**File:** `src/app/verhalen/page.tsx`; `src/app/verhalen/[slug]/page.tsx`; data in `src/lib/stories.ts:53-54`
`getPublishedStories()` carries `publishedAt` + `dateModified` and the detail page emits them into Article JSON-LD, but neither the index cards nor the article body render a human-visible date (no `<time datetime>` — grep confirms none). Visible on-page dates are a freshness/E-E-A-T signal for AI answer engines and Google.
**Fix:** Render a `<time dateTime={…}>` with the Dutch date on the card and at the top of the article; show "Bijgewerkt op …" when `dateModified` differs.

### [LOW] Event JSON-LD lacks recommended `image` (and offers/organizer)
**File:** `src/app/agenda/page.tsx` (`eventSchema()`)
Emits a valid Event node for concrete dated occurrences (correctly skipping vague recurrences), but Google's Event rich-result guidelines list `image` as recommended and (for ticketed events) `offers`/`organizer` — none present, so events are valid but not eligible for the richest treatment. Optimization gap, not a bug.
**Fix:** Add `image` where an event has a hero (or a generic De Kamp image); optionally `organizer: { '@type':'Organization', name: SITE.name }` and `offers` (price '0') for free festivals. Keep skipping date-less recurring items.

### [LOW] `/nieuwsbrief` has no crawlable internal link in nav or footer (orphaned)
**File:** `src/components/Footer.tsx:32-41`
Footer nav and Navbar link to `/agenda` and `/verhalen`, but the dedicated `/nieuwsbrief` page is only reachable via the inline signup form (which posts to the API and redirects), never via a plain `<a href>`. Combined with its sitemap absence, the page may struggle to be indexed at all.
**Fix:** Add `{ href:'/nieuwsbrief', label:'Nieuwsbrief' }` to the footer Navigatie list (or wrap the footer newsletter heading in a `Link`).

### [LOW] Unused `abs` import in `agenda/page.tsx`
**File:** `src/app/agenda/page.tsx:8`
`import { SITE, abs } from "@/lib/site";` — only `SITE` is used; `abs` is never referenced (grep confirms one occurrence: the import line itself). A latent `no-unused-vars` lint nit on a new page.
**Fix:** `import { SITE } from "@/lib/site";`

---

## Missing API calls & dead wiring _(the owner's scannable checklist)_

Every item here is a UI/route/function that exists but has no live counterpart. Severity in brackets.

| # | What's dead/unwired | Where it is | Where to wire it |
|---|---------------------|-------------|------------------|
| 1 | **`createReviewRequest()` has no caller** → `/r/[token]` is permanently dead, `resolveReviewRequest` unreachable | `src/lib/reviews.ts:100` | Add `createReviewRequestAction` in `src/app/admin/actions.ts` + a "Genereer review-QR" button on `/admin/google/page.tsx` **[HIGH]** |
| 2 | **`track()` fired nowhere** → `analytics_events` action_click always empty | `src/lib/track.ts`; conversion anchors at `BusinessDetailClient.tsx:176-215` | `onClick` `track('action_click', b.id, {kind})` on each outbound anchor; `track('story_view')` on `/verhalen/[slug]` **[MED]** |
| 3 | **Gift-card purchase UI not wired to `/api/cadeaukaart/order`** | `src/app/cadeaukaart/page.tsx` (no form posting to the order route) | Build the purchase form posting amount+email to `POST /api/cadeaukaart/order` (after order-route hardening, Low #1) _(known-deferred)_ |
| 4 | **`/beheer/kassa` till/redeem UI missing** → `redeem()` + `isMerchant()` have no caller | `src/lib/giftcard.ts:183,228`; no `src/app/beheer/kassa` | Build a merchant till page (auth → `isMerchant` → `redeem`) _(known-deferred)_ |
| 5 | **Owner event self-submission form missing** → `createEvent(…, 'pending')` path + admin pending queue never exercised | `src/app/beheer/[id]/page.tsx` (no event form) | Add "Evenement aanmelden" form calling `createEvent(input,'pending',user.id)` **[MED]** _(known-deferred)_ |
| 6 | **Owner story-suggestion form missing** | `src/app/beheer/[id]/page.tsx` | Optional owner story-suggestion form → admin verhalen queue _(known-deferred)_ |
| 7 | **Newsletter `unsubscribe` route unreachable by mail** → `unsub_token` unused end-to-end | `src/app/api/newsletter/unsubscribe/route.ts`; `src/lib/email.ts` | Add `List-Unsubscribe` headers in `sendEmail` + visible unsub link in every newsletter (needs campaign sender) **[LOW]** |
| 8 | **New admin sections only reachable via Instellingen** | `/admin/{google,agenda,nieuwsbrief,verhalen,statistieken}` linked only from `instellingen/page.tsx:25-40` | Add `<AdminNav>` to `/admin/page.tsx` **[MED]** |
| 9 | **"Verhalen" missing from Navbar** (footer-only) | `src/components/Navbar.tsx:46-66,94-152` | Add desktop + mobile nav link **[LOW]** |
| 10 | **`/nieuwsbrief` has no crawlable internal link** (orphaned) | `src/components/Footer.tsx:32-41` | Add footer Navigatie entry **[LOW]** |
| 11 | **Footer social icon `href="#"`** (dead) | `src/components/Footer.tsx:19` | Real Instagram/Facebook URL or remove **[LOW]** |
| 12 | **Footer Privacy / Cookiestatements `href="#"`** (stubs) | `src/components/Footer.tsx:90-91` | Create `/privacy` + `/cookies` pages and link **[LOW]** _(known-deferred)_ |
| 13 | **GoogleReviews `photoUrl`/`authorUrl` parsed but never rendered** | `GoogleReviews.tsx:8-9,81`; `places.ts:47-48` | Render avatar + link reviewer name **[LOW]** |
| 14 | **No `track()`/audit on money-in (giftcard issued) or newsletter confirm** | `giftcard.ts:99-137`; `api/newsletter/confirm` | `logModeration('giftcard_paid')` post-issue; optional confirm log **[LOW]** |
| 15 | **SEPA payouts missing** → `redemptions.payout_id` never stamped | `migrations/0009` (`redemptions`) | Payout job reading unsettled `redemptions` _(known-deferred; depends on redeem atomicity fix, High #2)_ |

---

## Known deferred — with effort to close

| Item | Status | Effort to close |
|------|--------|-----------------|
| Gift-card **purchase UI** wired to `/api/cadeaukaart/order` | Backend present; UI absent | **S–M** — one form; first harden the order route (honeypot/rate-limit/email validation, Low #1) |
| **`/beheer/kassa` till/redeem UI** | `redeem()`/`isMerchant()` present, no UI | **M** — auth-gated merchant page; fix redeem atomicity (High #2) and idempotency-return (Med) first |
| **SEPA payouts** | `redemptions` schema present; no job | **M–L** — payout batch + `payout_id` stamping; gated on the atomicity fix |
| **Owner event/story submission UI** | `createEvent('pending')` + admin queue ready | **S–M** — owner forms on `/beheer/[id]`; admin approval UI already lights up |
| **`track()` instrumentation** | beacon + `/api/collect` ready | **S** — add `onClick`/`useEffect` calls; pageviews need Cloudflare Web Analytics (no code) |
| **Discovery text-search box** | category/open-now filtering exists in BusinessExplorer | **S** — add a client text filter input |
| **NL/EN i18n routing** | not built | **L** — locale routing, message catalogs, hreflang, per-locale sitemaps |
| **Privacy / Cookie pages** | footer links are `#` | **S–M** — required before launch (GDPR); two static pages + cookie statement |
| **sitemap / llms.txt coverage** of verhalen/stories/nieuwsbrief | confirmed missing (Med ×2) | **S** — add static entries + map `getPublishedStories()` |

---

## Recommended fix order

**Before any live gift-card operation (money correctness):**
1. Mollie webhook dedupe — never issues the card **(Critical)** · `giftcard.ts:104-133`
2. `redeem()` atomicity — money taken, no settlement row **(High)** · `giftcard.ts:202-220`
3. Retried-redeem returns failure instead of original success (double-charge risk) **(Med)** · `giftcard.ts:202-225`
4. Order-route hardening + balance-oracle rate-limit by caller/normalized key **(Low + Med ×2)**

**Auth / security:**
5. Magic-link atomic single-use **(Med)** · `auth.ts:108-114`
6. Per-admin rate limit on `inviteOwnerAction` **(Med)**
7. Mollie webhook id-format + rate limit; `/api/collect` detail whitelist **(Low ×2)**

**Revenue/discovery wiring (cheap, high leverage):**
8. Review-QR generator action + admin button **(High)** · `reviews.ts:100`
9. `track()` instrumentation on conversion anchors **(Med)**
10. sitemap + llms.txt coverage of verhalen/nieuwsbrief/stories; `/nieuwsbrief` `?status=` noindex **(Med ×3)**
11. AdminNav shared component; Verhalen + Nieuwsbrief in nav/footer **(Med + Low ×2)**

**Launch hygiene (GDPR + a11y):**
12. Create `/privacy` + `/cookies` pages; fix footer dead links **(Low)**
13. Reconcile worker/maintenance prune divergence; confirm cron is actually wired; add `analytics_events` to purge **(Low ×2)**
14. `aria-live` status regions; mobile-menu `aria-*` + inert; `<SubmitButton>` pending state **(Med ×3)**

**Polish (post-launch):** owner event/story forms · amber AA color fix · GoogleReviews avatar/link + skeleton · verhalen OG/visible dates · agenda `image` schema + unused `abs` import · event sort tiebreaker · orphan-draft sweep.

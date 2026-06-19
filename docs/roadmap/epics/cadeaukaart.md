# Kamp Cadeaukaart — Local Multi-Merchant Gift Card

> A district-wide, multi-purpose digital gift card (with optional printable-QR card) spendable across participating De Kamp businesses. Issued by a **stichting** that ring-fences the float, paid via **Mollie iDEAL (Payments API)**, balance tracked in an **append-only D1 ledger**, redeemed at the till through a **no-POS owner web app**, and settled to merchants through an **admin reconciliation + payout dashboard**.
>
> **Recommended phase:** Phase 5 — after production launch/hardening (real `database_id`, WAF rate-limiting, `d1-next-tag-cache`) + GBP/reviews + events; and only once the **stichting legal entity, KvK registration, ring-fenced bank account, and Mollie live approval exist**. **Effort:** 12–18 weeks of engineering, gated behind a 4–6 week legal/financial foundation that runs in parallel but blocks go-live. **Teams:** Backend/Infra (lead), Frontend, SEO/GEO/AEO, Design/UX, Content/Localization, Legal/Compliance, Data/Analytics, Growth, Operations/Owner-relations, QA/Release, PM.
>
> **Reviewer note (why estimates rose vs. the draft):** the engineering surface is genuinely large (storefront funnel + idempotent payment webhook + append-only ledger + owner till PWA + admin reconciliation + SEPA export), the stack has real constraints (D1 has **no interactive transactions**, OpenNext **dummy tag cache**, no Node-only APIs at the edge), and the legal foundation (stichting, MPV-VAT, PSD2 limited-network, Wwft) is non-trivial. Treating this as a 10-week build under-prices the compliance and reconciliation work.

---

## 1. Goal & value

**The problem.** De Kamp's ~67 independent shops, cafés and makers compete individually against chains and webshops that all sell gift cards. Visitors who want to "give Amersfoort" or "give De Kamp" as a present have no single instrument; locals who love the district can't spread spend across multiple small businesses with one purchase. Each shop issuing its own paper voucher is fragmented, hard to track, and legally risky (no voucher terms, no ledger, lost-card disputes).

**The solution.** One **Kamp Cadeaukaart**: buy €10–€150 online, give it as a digital card (email + QR) or printable card, and the recipient spends it at *any* participating De Kamp business — €18 at Toko Tjin today, €7 at a café three weeks later — with the remaining balance carried automatically.

**Why it matters:**
- **District:** keeps money inside De Kamp (a true local multiplier), creates a flagship commercial reason to visit, and gives the stichting a recurring brand moment (Sinterklaas, Kerst, Moederdag, verjaardagen).
- **Owners:** zero hardware, zero per-shop liability, new footfall from gift recipients who discover shops they'd never have entered, and a clean monthly payout instead of paper-voucher chaos.
- **Visitors/locals:** a meaningful, flexible, *local* gift; a trustworthy purchase backed by clear terms and a balance-check page.
- **Strategically:** the headline monetisable feature and the strongest "why buy / why visit De Kamp" answer for AI engines and search.

---

## 2. How it works in real life

**Personas**
- **Sanne** (gifter) — lives in Amersfoort, wants a present for her sister.
- **Bram** (recipient) — will spend the card.
- **Mei** — owner of **Toko Tjin** (Indonesian deli on De Kamp), a participating merchant.
- **Joost** — owner of a participating café on De Kamp.
- **Wendy** — the stichting admin/treasurer who reconciles and pays out.

**Journey 1 — Buying (Sanne).**
1. Sanne lands on `ondernemersvandekamp.nl/cadeaukaart` from the homepage teaser. She reads a 40–60-word answer-first explainer and a short FAQ ("Waar kan ik de kaart besteden?", "Hoe lang is hij geldig?").
2. She picks **€25**, a design ("Winter op De Kamp"), enters Bram's email + a personal message, her own email for the receipt, and ticks the privacy/terms consent box.
3. She clicks **Betaal met iDEAL**. The server validates, creates a **draft** card row and a **Mollie payment** (Payments API), then redirects her to Mollie's hosted iDEAL checkout (her bank: ING).
4. She approves in her banking app. Mollie redirects her back to a "bedankt" page: *"We bevestigen je betaling — je ontvangt zo de kaart per e-mail."*
5. Behind the scenes Mollie calls our webhook with only a payment `id`; we **re-fetch** the payment from Mollie, confirm `status:"paid"`, atomically flip the card `draft→issued` (guarded by status), write an `issue` ledger row of **+€25**, set a 730-day expiry, then email **both** Sanne (receipt) and Bram (the card with QR + claim link).

**Journey 2 — Receiving (Bram).**
6. Bram gets an email: *"Sanne geeft je €25 om te besteden op De Kamp."* It shows the card design, the balance, a QR code, a 16-character code, and a "Bekijk je kaart" claim link to a balance page. He can save it as a PDF/PNG or print it.

**Journey 3 — Spending, part 1 (Toko Tjin, €18).**
7. Weeks later Bram buys €18 of food at **Toko Tjin** and pays with the Kamp Cadeaukaart.
8. **Mei** opens `/beheer/kassa` on the shop tablet (logged in as a participating owner). She taps **Scan**, points the camera at Bram's QR (or types the 16-char code), and the screen shows **Saldo: €25,00**.
9. She enters **€18,00** and taps **Afschrijven**. The server runs a **single conditional ledger insert** that only writes if live balance ≥ €18, then records the redemption, and returns **Nieuw saldo: €7,00**. Mei sees a green success screen and an optional printable mini-receipt showing the remaining €7.

**Journey 4 — Spending, part 2 (café, €7).**
10. Three weeks later Bram has coffee + appeltaart at **Joost's** café for €7. Joost scans the same code → **Saldo: €7,00**, enters €7,00, taps **Afschrijven** → **Nieuw saldo: €0,00**. The card is now inert; any further scan shows "Saldo: €0,00 — kaart is leeg."

**Journey 5 — Reconciliation & payout (Wendy).**
11. At month-end Wendy opens `/admin/cadeaukaart`. The dashboard shows: total issued this month, **outstanding liability** (sum of all unredeemed balances) to reconcile against the stichting bank balance, and a **per-merchant redeemed table**: Toko Tjin **€18**, Joost's café **€7**, etc.
12. She clicks **Genereer uitbetaling** for the period. The system produces a payout run: Toko Tjin gets €18 (minus any agreed scheme fee), the café €7, each a `merchant_payouts` row with the merchant's IBAN, and stamps the included redemptions/ledger rows with the `payout_id`. She exports a **SEPA pain.001 batch / CSV**, uploads it to the stichting's bank, and marks each payout **Betaald** with the bank reference. The ledger records the settlement so those redemptions are never paid twice.
13. VAT is accounted **by each shop** on its own redeemed amount (multi-purpose voucher rule): Mei accounts 9% on her €18 food sale, Joost 9% on his €7 horeca sale; the stichting accounts **no VAT** at the €25 sale.

This exact **€25 → €18 → €7** path is the canonical QA/acceptance scenario.

---

## 3. Scope — In / Out / Later

**In (v1):**
- Digital gift card: buy €10–€150 (integer euros), choose a design, recipient email + message, gifter receipt.
- **Mollie Payments API** with iDEAL (primary) + cards + Bancontact/Apple/Google Pay; idempotent webhook; `paid` → `issued`.
- Append-only D1 ledger; balance = `SUM(amount_cents)`; QR + 16-char human code (stored hashed).
- Owner till PWA `/beheer/kassa`: scan/type, balance check, partial redemption, remaining-balance receipt, owner-isolated history.
- Public balance-check page (`/cadeaukaart/saldo`) and recipient claim page (`/cadeaukaart/claim/[token]`).
- Admin reconciliation dashboard + payout-run generation (SEPA pain.001 / CSV export) + refund/void.
- Multi-purpose voucher VAT model; ≥730-day validity; consumer terms; GDPR consent + transactional emails via Resend (EU).
- Schema.org Product/Offer + FAQPage + HowTo; `llms.txt` section; sitemap freshness; `dateModified`.

**Out (v1):**
- Physical cards mailed by us (we provide a printable PDF; bulk printed cards are an ops add-on, not engineering).
- POS/cash-register integration (no till hardware; the web app *is* the integration).
- Automatic bank payouts via API (v1 exports a SEPA batch Wendy uploads manually; auto-SEPA is Later).
- Reloadable/top-up cards, corporate bulk ordering, scheduled future delivery.
- Loyalty points, discounts, dynamic pricing.

**Later:**
- Automated payouts via the bank's API or **Mollie Connect** marketplace split-settlement (note: split-settlement may change the PSD2/e-money analysis — re-confirm with the fintech lawyer before adopting).
- Bulk/corporate orders + invoicing; scheduled-delivery ("verstuur op 5 december").
- EN/bilingual storefront + claim emails (depends on the i18n epic).
- Physical card fulfilment partner; in-store "koop hier een kaart" QR for owners.
- Apple/Google Wallet pass (PassKit) instead of PDF.

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

> **Stack reminder:** this is Next.js 16 on Cloudflare Workers/OpenNext. Read `node_modules/next/dist/docs/` before coding — APIs differ from older Next. No Node-only APIs at the edge. Server Actions already have `bodySizeLimit: "6mb"` in `next.config.ts`.

**Public storefront (`/cadeaukaart`)** — upgrade the placeholder to a real funnel.
- `src/app/cadeaukaart/page.tsx` (Server Component, **stays ISR** `revalidate=300`): marketing/answer-first copy, FAQ, HowTo, JSON-LD. Renders a client `<GiftCardPurchase>` island. This page holds no financial data, so ISR is safe.
- `<GiftCardPurchase>` (`"use client"`): amount selector (preset chips €10/€25/€50/€75 + custom min €10 / max €150, **integer euros only**), design picker (radio of 3–4 designs from `src/data/giftCardDesigns.ts`), recipient email, optional message (textarea, 280 char), gifter email, **GDPR/terms consent checkbox** (required, unchecked by default). On submit, `POST /api/cadeaukaart/checkout`, receive `{ checkoutUrl }`, `window.location.href = checkoutUrl` (Mollie hosted page — **never collect card data ourselves**, no Mollie components on our marketing page).
  - Use React 19 `useActionState` / `useState` for pending/error; client-side validation **mirrors** the server (amount bounds, email format, consent) — server is the source of truth.
  - Reuse the planned shared `<KampInput>/<KampTextarea>` design-system components (see Design) so the form is on-brand.
- **Return pages:** `/cadeaukaart/bedankt` (`force-dynamic`, reads `?payment=`; shows "betaling wordt bevestigd" with a soft poll to `GET /api/cadeaukaart/order-status?payment=` to flip to "verzonden naar e-mail" — **display only, never the source of issuance truth**). `/cadeaukaart/geannuleerd` for cancelled/failed.
- **Balance check** `/cadeaukaart/saldo` (`force-dynamic`, `no-store`; client form posts the code, server hashes + looks up): renders balance, last activity, expiry. `robots:{index:false}` (utility page).
- **Recipient claim** `/cadeaukaart/claim/[token]/page.tsx` (`force-dynamic`, `no-store`, `robots:{index:false,follow:false}`): card design, balance, QR (generated server-side as a data-URI in the page/route via the `qrcode` lib — pure-JS, edge-safe), "voeg toe aan je telefoon" (download PNG/PDF), and a where-to-spend list linking to participating `/ondernemers/[id]` pages (internal-linking win).

**Owner till app (`/beheer/kassa`)** — new route, `requireUser` + participant check.
- `src/app/beheer/kassa/page.tsx` (Server: gate to owners whose business is in `gift_card_merchants`; if none, show "doe mee" CTA). Renders `<Kassa>` client island. Add a minimal **PWA manifest + offline-aware messaging** so owners can "add to home screen" on the shop tablet (full offline redemption is out of scope — redemption must hit the server).
- `<Kassa>` (`"use client"`): camera QR scan via **`BarcodeDetector`** where available with a **`@zxing/browser`** fallback (lazy-loaded only on this route), **or** manual 16-char input with grouping; "Controleer saldo" → Server Action `lookupCard(code)` returning masked card + balance; amount input (≤ balance, enforced client **and** server); **Afschrijven** → Server Action `redeemCard(code, amountCents, idempotencyKey)`.
  - **Idempotency key:** generated **once** with `crypto.randomUUID()` when the owner first opens the redeem dialog for a given card+amount, kept stable across retries/network errors, and regenerated only when the owner starts a *fresh* redemption. This is what makes a double-tap or a retried request a no-op.
  - States: `idle`, `found`, `insufficient`, `empty`, `expired`, `processing`, `success` (new balance + print receipt), `error`.
- `/beheer/kassa/historie` — this owner's own redemptions (date, amount, card last4) — owner-isolated server query.

**Admin (`/admin/cadeaukaart`)** — new route, `requireAdmin`.
- Dashboard cards (issued this period, outstanding liability, redeemed this period), per-merchant redeemed table, payout-run button (Server Action), payout history, single-card lookup with full ledger, refund/void buttons (with typed confirm). Reuse the planned `<Alert>` + table components. No pagination needed at ~67 merchants, but paginate the **card/ledger** views (volume grows).

**Cross-cutting:** **integer cents end to end**; never floats. Format with `Intl.NumberFormat('nl-NL', {style:'currency', currency:'EUR'})`. **No financial data on any cached/ISR surface** — every gift-card *data* route is `force-dynamic` + `Cache-Control: private, no-store`. QR generated on demand; card designs are static assets in `/public/cadeaukaart/` or R2.

### Engineering — Backend & Infra (Cloudflare) — **primary, most detailed**

> **Three hard stack constraints the draft glossed over — engineers must internalise these:**
> 1. **D1 has NO interactive transactions.** There is no `BEGIN`/`COMMIT` over the Workers binding. The only atomic primitives are (a) a **single SQL statement** and (b) **`db.batch([...])`**, which runs an array of prepared statements as one auto-commit SQL transaction that rolls back entirely on any failure. Every "transaction" below is implemented as *either* one conditional statement *or* a `db.batch()` — never a multi-round-trip read-then-write that could interleave.
> 2. **OpenNext tag cache is the dummy no-op today.** `revalidatePath()`/`revalidateTag()` do nothing in production until the `d1-next-tag-cache` override lands (hardening epic). Gift-card routes are all `force-dynamic` anyway, so they are **unaffected** — do **not** rely on `revalidatePath` for any gift-card correctness.
> 3. **Edge runtime, no Node APIs.** Use Web Crypto (`crypto.subtle`, `crypto.randomUUID`, `crypto.getRandomValues`) — already the pattern in `src/lib/auth.ts`. Mollie/Resend are plain `fetch()` to public HTTPS (allowed by `global_fetch_strictly_public`). Use pure-JS libs only (`qrcode`); no `sharp`, no Node `crypto` module.

**Source-of-truth principle.** Balance is **never** a mutable column. It is `SUM(amount_cents)` over an **append-only** `gift_card_ledger`. Rows are only ever *inserted*, never updated/deleted (except `payout_id` stamping, which is monotonic and additive in meaning). This makes double-spend, refunds, void, breakage and reconciliation auditable and race-safe.

**D1 schema — `migrations/0003_cadeaukaart.sql`** (full DDL in §5). Tables follow the existing `migrations/000N_*.sql` + `wrangler d1 migrations apply` convention. Add the same **`NEXT_PHASE` build guard** as `getOverrides()` so issuance/ledger reads are never hit at build time.

**Web Crypto helpers (edge-safe):**
```ts
// 16-char base32 (Crockford) human code, ~80 bits entropy
function newCardCode(): string { /* crypto.getRandomValues over a 32-char alphabet, no I/O/0/1 */ }
async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.toUpperCase().replace(/[^0-9A-Z]/g, ""));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}
```

**Route handlers** (signatures in §5). Key rules:

- **`POST /api/cadeaukaart/checkout`** (`force-dynamic`): validate amount (1000–15000 cents) / email / consent server-side → generate code + `code_hash` + `claim_token` → `INSERT` a `draft` `gift_cards` row (**no ledger row yet**) → create a **Mollie payment** (`POST https://api.mollie.com/v2/payments`, Bearer `MOLLIE_API_KEY`) with `amount{currency:"EUR",value:"25.00"}`, `description`, `redirectUrl`, `webhookUrl`, `method:["ideal","creditcard","bancontact","applepay"]`, `metadata:{cardId}` → store `mollie_payment_id` on the draft → return `{ checkoutUrl: payment._links.checkout.href }`. **No card is issued and no money is on the ledger until payment is confirmed.**
  - **Use the Payments API, NOT the Orders API.** Mollie has deprecated the Orders API (2025) and now routes all 35+ methods through Payments. The draft's `POST /v2/orders` is wrong for a 2026 build.

- **`POST /api/webhooks/mollie`** (`force-dynamic`, **public, no session** — Mollie cannot authenticate to us, so the handler must self-verify): Mollie posts `id=<paymentId>` as `application/x-www-form-urlencoded`. The handler **re-fetches** `GET /v2/payments/{id}` server-side with `MOLLIE_API_KEY` and trusts **only** that response (a spoofed POST with a fake id either 404s at Mollie or returns a payment we don't recognise). Steps, all idempotent:
  1. `INSERT OR IGNORE INTO gift_card_webhook_events(mollie_id, processed_at)`; if it already existed, ack `200` and stop (dedupe).
  2. Re-fetch the payment. If `status != "paid"` → ack `200` and stop (don't issue on `open/pending/failed/expired/canceled`).
  3. If `paid`: run a **`db.batch([...])`** containing, in order: (a) `UPDATE gift_cards SET status='issued', issued_at=?, expires_at=? WHERE id=? AND status='draft'` (**status-guarded** — if a concurrent webhook already issued it, this affects 0 rows), and (b) `INSERT INTO gift_card_ledger(...,'issue', +amount, idempotency_key=:paymentId,...)` with `idempotency_key` = the Mollie payment id (so a re-run can't double-credit — the `UNIQUE` constraint rejects it and the batch rolls back, which is fine because the card is already issued).
  4. After the batch commits, enqueue the Resend delivery email (best-effort; failure is recoverable via admin resend — never block the 200).
  - **Always return `200` quickly.** Mollie retries non-2xx with backoff; heavy/duplicate work must be a safe no-op.
  - **Defence note:** also confirm `amount.value` from the re-fetched payment matches the draft's `initial_amount_cents` before issuing (guards against a tampered draft or amount mismatch).

- **`GET /api/cadeaukaart/order-status?payment=`** — display-only status for the bedankt page (`pending|delivered|failed`); **rate-limited**; reveals nothing about balance or codes.

- **`POST /cadeaukaart/saldo`** (balance check) — hash the submitted code, look up card, return balance + expiry; **rate-limit hard** (Cloudflare WAF 5/min/IP **+** an in-D1 token-bucket keyed by IP) to prevent code enumeration; never distinguish "code doesn't exist" from "code is empty" — always return generic "ongeldige of lege kaart" on any miss.

**Server Actions** (POST to page origin, gated):

- `lookupCard(code)` — `requireUser()`; assert the caller's owned business ∈ `gift_card_merchants`; returns `{ last4, balanceCents, status }`. No write.

- **`redeemCard(code, amountCents, idempotencyKey)`** — the critical path. **Single conditional INSERT makes overdraw impossible without a transaction:**
  ```sql
  -- Derive merchant_business_id from the SESSION, never the client.
  -- 1) Idempotency short-circuit: if a redemption with this key exists, return its result.
  -- 2) The debit is ONE statement whose WHERE clause re-reads the live balance:
  INSERT INTO gift_card_ledger
    (id, card_id, entry_type, amount_cents, merchant_business_id, redemption_id, idempotency_key, created_by, created_at)
  SELECT :id, :cardId, 'redeem', -:amt, :merchant, :redemptionId, :key, :profileId, :now
  WHERE (SELECT COALESCE(SUM(amount_cents),0) FROM gift_card_ledger WHERE card_id = :cardId) >= :amt
    AND (SELECT status FROM gift_cards WHERE id = :cardId) = 'issued'
    AND (SELECT expires_at FROM gift_cards WHERE id = :cardId) > :now;
  ```
  - D1 serialises writes and a single statement is atomic, so the `SUM >= :amt` guard is evaluated against the committed balance at write time. **Affected-rows = 0 → insufficient balance / expired / not-issued** (re-read and return the precise reason). **Affected-rows = 1 → success.**
  - Wrap the ledger insert **and** the `redemptions` insert in **`db.batch([...])`** so both land atomically; if the ledger insert wrote 0 rows, skip the batch and return the failure reason. The `idempotency_key UNIQUE` on both `gift_card_ledger` and `redemptions` turns a double-submit into a constraint violation → caught → return the already-recorded result.
  - Return `{ newBalanceCents }` computed by re-`SUM` after the batch.

- **Admin actions:**
  - `generatePayoutRun(periodStart, periodEnd)` — `requireAdmin()`. In one pass per merchant: `SELECT` redemptions with `payout_id IS NULL` in the period, sum gross, compute fee + net, `INSERT merchant_payouts`, then `UPDATE redemptions SET payout_id=? WHERE id IN (...)` **and** stamp the corresponding `gift_card_ledger` rows — all via `db.batch()` so a half-stamped run can't occur. Block if the merchant has no IBAN.
  - `markPayoutPaid(payoutId, reference)` — `UPDATE merchant_payouts SET status='paid', reference=?, paid_at=?`.
  - `refundCard(cardId, reason)` — `INSERT` a negative `refund` ledger row, set card `status='void'`, **and** call Mollie `POST /v2/payments/{id}/refunds` where the original payment funded it. Guard: cannot refund more than `initial_amount` minus already-redeemed; document the policy (refund only unredeemed balance, or full goodwill refund with accountant sign-off).
  - `voidCard(cardId, reason)` — `INSERT` a `void` row equal to `-currentBalance` (zeroes it), set `status='void'`. Used for fraud/lost-card.

**Bindings & secrets** (`wrangler.jsonc`): reuse `DB` (D1) and the existing Resend settings path (`getResendConfig()`). Add **secrets** `MOLLIE_API_KEY` (separate test/live via environments) and a **var** `MOLLIE_WEBHOOK_BASE`/reuse `NEXT_PUBLIC_SITE_URL` for `redirectUrl`/`webhookUrl`. **No new R2 bucket** (QR generated, not stored; card designs static or in existing R2). Confirm the Mollie host is reachable under `global_fetch_strictly_public` (it is — public HTTPS).

**Cron / scheduled Worker** (`scheduled` export — **note: with OpenNext, the cron handler is added to the generated Worker; confirm the OpenNext mechanism for a `scheduled()` export and add a `triggers.crons` entry in `wrangler.jsonc`. If OpenNext does not surface the scheduled handler cleanly, fall back to a Cloudflare Cron Trigger hitting an internal authenticated route**). Nightly job, piggybacking the auth-token-pruning cron from the hardening epic:
  - (a) **Prune drafts:** delete `draft` cards with no `paid` Mollie payment older than 24h (optionally `DELETE`/cancel the Mollie payment).
  - (b) **Expiry sweep:** cards past `expires_at` with balance > 0 → `INSERT` a `breakage` ledger row capturing the remaining balance, set `status='expired'`. **Breakage revenue recognition is an accountant decision** — do not recognise it as stichting income without sign-off; it may need to remain a liability for a defined period.
  - (c) Write a reconciliation snapshot row for the dashboard.

**Security & owner-isolation:**
- Redemption only by owners present in `gift_card_merchants`; `merchant_business_id` is **always derived server-side** from the session's owned business, never from the client.
- Every mutating money path carries an **idempotency key** with a `UNIQUE` constraint so retries are safe.
- Webhook trusts **only** the server-side re-fetch + amount check; processed-id dedupe table.
- Rate-limit `/cadeaukaart/saldo`, `/api/cadeaukaart/order-status`, and `redeemCard` (per owner) via Cloudflare WAF rules **+** an in-D1 token bucket. A WAF allow-list on `/api/webhooks/mollie` to Mollie's published IP ranges is defence-in-depth (not the primary control — the re-fetch is).
- Codes are random base32 (~80 bits), stored **hashed** (`code_hash`), with only `display_last4` in clear for support. Plaintext lives only in the delivery email and the recipient's possession.

**Caching:** every gift-card data route is `force-dynamic` + `Cache-Control: private, no-store`. The marketing `/cadeaukaart` page stays ISR. When `d1-next-tag-cache` lands it does not touch these dynamic routes — no interaction risk.

### SEO / GEO / AEO

- **Schema.org (add to `src/lib/schema.ts`, emit via the existing `<JsonLd>`/`graph()`):** on `/cadeaukaart` add a `Product` (name "Kamp Cadeaukaart", `brand` = the stichting `Organization` `@id`, `category`: "GiftCard") with an `Offer` (`priceCurrency:"EUR"`, `priceSpecification` with `minPrice:10`/`maxPrice:150` **or** `lowPrice/highPrice` on an `AggregateOffer`, `availability:"https://schema.org/InStock"`, `areaServed` = Amersfoort City, `url`). Add a **`HowTo`** ("Zo werkt de Kamp Cadeaukaart": kies bedrag → betaal met iDEAL → ontvang per e-mail → besteed bij elke deelnemer) and keep the existing **`FAQPage`**, tightening every answer to the **40–60-word answer-first** standard. **Do NOT add `aggregateRating`/`review`** — no ratings exist and it would be self-serving/invalid.
- **Entity-first:** the **stichting** becomes a clearly-defined `Organization` with `sameAs` (KvK/openKvK page, socials) and is the `brand`/issuer of the card — anchoring "Kamp Cadeaukaart" as a resolvable entity. Link the card to the district `Place` `@id` via `areaServed`/`isPartOf`. **This requires `src/lib/site.ts` to gain the stichting's KvK number and filled social URLs** (today `SITE.social` is empty).
- **Metadata/OG:** unique title ("Kamp Cadeaukaart — cadeaubon voor heel De Kamp | …"), answer-first description (≤155 chars), canonical, dedicated OG image (extend the `opengraph-image` route with a gift-card variant or add a static branded card). Add **`dateModified`** to the page's schema + a visible "laatst bijgewerkt" stamp — directly addresses the 2026 freshness signal (>83% of AI citations updated <12mo, >60% <6mo).
- **Sitemap/robots:** `/cadeaukaart` already present (p=0.8) — set `changeFrequency=weekly`, real `lastModified`. `/cadeaukaart/saldo` → `noindex` via metadata, keep crawlable. **`/cadeaukaart/claim/[token]` and `/beheer/kassa`:** exclude from sitemap, set `robots:{index:false,follow:false}` in metadata, **and** add `Disallow: /cadeaukaart/claim/` to `robots.ts` (the token is bearer-capability-adjacent — keep it out of indexes). Do **not** add tokens to any AI-crawler-readable surface.
- **llms.txt:** add an `## Cadeaukaart` section (one answer-first paragraph: what it is, €10–€150 range, where to spend, ≥2yr validity, link) generated from live config — a high-value AEO answer for "cadeaubon Amersfoort binnenstad". **Do not** emit any card codes or per-card data into `llms.txt`.
- **Internal linking:** participating-merchant list on the claim page + an "ook te besteden met de Kamp Cadeaukaart" badge on participant `/ondernemers/[id]` pages linking back to `/cadeaukaart` — a topical-authority cluster.
- **Keywords/topics (NL):** "cadeaubon Amersfoort", "cadeaukaart De Kamp", "lokaal cadeau Amersfoort binnenstad", "winkelbon Amersfoort", "Sinterklaas/Kerst cadeau Amersfoort lokaal".
- **hreflang:** none in v1 (NL-only); reserve `/en/cadeaukaart` for the i18n epic.
- **CWV:** Server Component marketing page + one small client island; lazy-load QR/scanner libs only on the till/claim routes; **no Mollie scripts on the marketing page** (Mollie loads only after redirect).

### Design / UX

- **Screens:** (1) storefront/purchase, (2) bedankt/geannuleerd, (3) recipient email + claim page, (4) saldo-check, (5) till app (scan / amount / result), (6) admin reconciliation + payout. Deliver in **Figma** using the design-system tokens — **prerequisite: formalise the type-scale + spacing tokens flagged in the design audit first**, and ship the shared `<KampInput>/<KampTextarea>/<Alert>` components, otherwise this epic will re-introduce ad-hoc form styles. Plus a printable **card PDF** template and the digital-card email HTML.
- **States per flow:** empty (no participants yet → "binnenkort"), loading (Mollie redirect spinner, balance skeleton), error (payment failed, invalid code, insufficient, expired), success (paid; redeemed-new-balance), disabled (amount > balance). The till app must be **glanceable on a tablet at arm's length**: huge balance number, big amount keypad, unmistakable green success / red insufficient.
- **Responsive:** till app phone/tablet-first; storefront mobile-first.
- **Motion:** subtle success-check animation on redeem; respect `prefers-reduced-motion` via the shared motion presets (and a JS-layer guard for Framer per the design audit).
- **WCAG AA (also an EAA 2025 legal requirement for e-commerce, see Legal):** **fix the focus-ring contrast — use `--amber-ink`/white, not `--amber`** (current amber ring is ~3.2:1, below SC 1.4.11) — *critical* on money screens; status must not rely on colour alone (icon + text for success/insufficient); **44px** touch targets on the keypad; `aria-live` announcement of "Nieuw saldo €7,00"; QR scanner must have a fully keyboard-accessible manual-entry fallback.
- **Deliverables:** Figma screens + redlines, 3–4 card designs (SVG/PNG with Dutch alt text), email HTML, printable PDF, tokens update.

### Content / Localization

- **Copy (NL-first, warm editorial voice "De Kamp leeft."):** storefront hero + answer-first explainer (≤60 words), amount/design labels, FAQ (waar besteden? geldigheid? saldo kwijt? kaart verloren? btw/bon? privacy?), HowTo steps, consent + terms microcopy, recipient email subject + body ("… geeft je €25 om te besteden op De Kamp"), gifter receipt, till labels (Scan, Controleer saldo, Afschrijven, Nieuw saldo), all error strings, owner payout-statement wording.
- **Legal copy:** voucher **algemene voorwaarden** (validity ≥2 jaar, where redeemable, geen uitbetaling in contanten, lost-card policy, MPV-VAT note, breakage) + privacy clauses for purchaser/recipient — drafted **with Legal**, in plain Dutch.
- **EN/bilingual:** out of scope v1, but **structure every string so it can move into `src/messages/nl.json` when i18n lands** — do not hardcode in a way that blocks the i18n epic.
- **Alt text:** each card design and the OG image get descriptive Dutch alt; QR images get `alt="QR-code van je Kamp Cadeaukaart"`.

### Legal / Compliance (GDPR + Dutch financial/voucher/consumer law) — **expanded; this is the gating workstream**

- **Lawful basis (GDPR):** purchase + redemption data = **contract performance** (Art. 6(1)(b)). Sending the gift to the recipient = contract/legitimate interest (Art. 6(1)(f)). Any **marketing** to purchaser *or* recipient requires **separate, granular opt-in** (Art. 6(1)(a)) — **no pre-ticked boxes**, logged consent. The terms+privacy consent at purchase is explicit and timestamped.
- **Retention vs. erasure:** financial/voucher transaction records carry the **Dutch 7-year fiscal retention** obligation (art. 52 AWR), which **overrides** GDPR erasure for the *transactional* fields (amounts, ledger, payout records, IBANs needed for accounting). Personal contact fields not needed after delivery + the dispute window can be minimised earlier. **Wire gift-card data into the existing GDPR-erase path with a documented fiscal-retention carve-out** (the erase should pseudonymise/strip personal fields while preserving the legally-required financial ledger).
- **Processors + DPAs:** **Mollie** (Amsterdam — PSP; DPA + EU residency), **Resend** (select **EU region**; DPA), **Cloudflare** (D1/Workers/R2 — confirm EU data-localisation posture + DPA; D1 region placement). Update the processor register + privacy policy. The bank (bunq/Knab/Rabobank) is a separate controller for payout data.
- **Payments / e-money / PSD2 — corrected citations:**
  - Using **Mollie as a licensed PSP** means **we do not hold regulated payment accounts at the point of purchase** — Mollie processes the consumer payment.
  - The card is a **multi-purpose voucher** redeemable only within a **closed/limited network** (the De Kamp participating merchants), so the issuance is assessed under the **PSD2 limited-network exclusion** — in the EU directive this is **Art. 3(k) PSD2**, implemented in the Netherlands as **art. 1:5a(2)(k) Wft**.
  - **Threshold/notification:** if the **total value of payment transactions over the preceding 12 months exceeds €1,000,000** (calculated **at issuer level**), the issuer (the stichting) must **notify DNB** of reliance on the exclusion. Build a running-12-month issuance counter into the admin dashboard and **alert well before €1M**.
  - **Get a Dutch fintech/payments lawyer to confirm** the limited-network scope, the closed-loop definition (a curated district of independent merchants is exactly the grey area the EBA tightened), the e-money analysis, and the threshold mechanics **before go-live**. Merchant payouts are **commercial settlements** from the stichting, not payment services.
- **AML/Wwft (added — the draft missed this):** anonymous gift cards purchasable for unknown recipients touch the **Wwft** anti-money-laundering rules. DNB guidance (on the Wwft customer-identification carve-out for low-value, non-reloadable, limited-use instruments) generally exempts small closed-loop gift cards, but the **€150 max, non-reloadable, no cash-out** parameters should be **explicitly confirmed against the Wwft carve-out** as part of the lawyer review — do not allow reload or cash redemption in v1, which keeps the instrument inside the exemption.
- **VAT — multi-purpose voucher (MPV):** because the final goods/service and VAT rate are unknown at sale (9% food/horeca vs 21% retail), it is an **MPV** → **no VAT at issuance**; **each merchant accounts VAT on redemption** for its own sale. The stichting issues **settlement statements** (not consumer VAT invoices). **Accountant sign-off is mandatory** and must confirm the MPV classification and the breakage treatment.
- **Consumer/voucher law (NL):** minimum **2-year validity** (we set 730 days; communicate validity clearly, ideally generously); transparent terms; no hidden consumer fees; documented **breakage** handling. Distance-selling **14-day herroepingsrecht**: a gift card is typically excluded once delivered/used, but **state the withdrawal stance explicitly** in the terms (and confirm with Legal, since the buyer is a consumer buying remotely).
- **Float / insolvency:** ring-fenced stichting account; **published wind-down procedure**; outstanding-liability transparency. The stichting bylaws should address what happens to outstanding balances on dissolution.
- **Accessibility (EAA / Toegankelijkheidswet, in force June 2025):** the purchase + till flows are e-commerce and must meet **WCAG 2.1 AA** as a **legal** requirement (not just best practice) — this ties the Design WCAG items to a compliance gate.

### Data / Analytics

- **Events (server-side, cookieless, privacy-friendly):** `giftcard_storefront_view`, `_amount_selected`, `_checkout_started`, `_payment_succeeded`/`_failed`, `_delivered`, `_claim_viewed`, `_balance_checked`, `_redeemed` (amount, merchant), `_emptied`, `payout_generated`, `payout_marked_paid`. Capture into a lightweight `analytics_events` D1 table **or** a GDPR-clean EU tool (**Plausible EU** / **Simple Analytics** — both EU, cookieless, no consent banner). **The financial KPIs come straight from ledger aggregates — no separate pipeline.**
- **KPIs/dashboards:** GMV issued (€/mo) + cards sold; redemption rate at 90/180/365d + breakage; avg card value + avg redemption basket; participating-merchant count + active-redeemer share; **float reconciliation variance (target €0)**; purchase-funnel conversion; payment success by method + **webhook success rate**; time-to-payout + payout error rate; `/cadeaukaart` organic + AI-referral traffic + HowTo/FAQ rich-result impressions; support tickets per 100 cards; **running 12-month issuance total vs. the €1M DNB threshold**.

### Operations / Owner-relations

- **Merchant onboarding:** owner opts in via `/beheer` ("Doe mee met de Cadeaukaart"), agrees to merchant terms (scheme fee, payout cadence), provides **IBAN** → admin approves → `INSERT INTO gift_card_merchants`. Provide a 1-page "zo werkt de kassa" guide + a 5-minute training. **Recruit ≥15 merchants before public launch** so the card is genuinely district-wide.
- **Support/SLAs:** balance-dispute + lost-card flow (admin looks up the full ledger and can `void`/reissue); **webhook-failure runbook** (manual "mark paid" with Mollie proof); payment-failure refunds. Target: balance disputes resolved < 1 business day.
- **Payout cadence:** monthly (fortnightly in peak December); Wendy runs the payout, exports SEPA pain.001/CSV, uploads to the bank, marks paid; owners get an emailed statement.
- **Seasonal campaigns:** Growth runs Sinterklaas/Kerst/Moederdag pushes; ops ensures enough participating merchants and stocked printable designs before each peak.

---

## 5. Data model & API

**D1 DDL — `migrations/0003_cadeaukaart.sql`** (integer cents everywhere; append-only ledger; matches existing `IF NOT EXISTS` + uuid-PK conventions):

```sql
CREATE TABLE IF NOT EXISTS gift_cards (
  id                   TEXT PRIMARY KEY,                    -- uuid
  code_hash            TEXT NOT NULL UNIQUE,                -- sha256(normalized plaintext code)
  display_last4        TEXT NOT NULL,                       -- last 4 chars, support only
  status               TEXT NOT NULL DEFAULT 'draft',       -- draft|issued|expired|void
  design               TEXT NOT NULL DEFAULT 'classic',
  initial_amount_cents INTEGER NOT NULL CHECK (initial_amount_cents BETWEEN 1000 AND 15000),
  currency             TEXT NOT NULL DEFAULT 'EUR',
  purchaser_email      TEXT,
  recipient_email      TEXT,
  message              TEXT,
  mollie_payment_id    TEXT,                                -- Payments API id (NOT order id)
  claim_token          TEXT UNIQUE,                         -- opaque token for the claim URL
  issued_at            INTEGER,
  expires_at           INTEGER,                             -- issued_at + 730d (>=2yr NL)
  created_at           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gc_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gc_mollie ON gift_cards(mollie_payment_id);

-- Append-only money truth. balance = SUM(amount_cents) WHERE card_id = ?
CREATE TABLE IF NOT EXISTS gift_card_ledger (
  id                   TEXT PRIMARY KEY,
  card_id              TEXT NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  entry_type           TEXT NOT NULL,                       -- issue|redeem|refund|void|adjust|breakage
  amount_cents         INTEGER NOT NULL,                    -- signed: +issue/-redeem/-void/-breakage
  merchant_business_id TEXT,                                -- set on redeem
  redemption_id        TEXT,                                -- set on redeem
  payout_id            TEXT,                                -- set when settled to merchant
  idempotency_key      TEXT NOT NULL UNIQUE,                -- payment id (issue) | redeem key
  created_by           TEXT NOT NULL,                       -- profile id | 'system' | 'mollie'
  created_at           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_card ON gift_card_ledger(card_id);
CREATE INDEX IF NOT EXISTS idx_ledger_merchant ON gift_card_ledger(merchant_business_id, payout_id);

CREATE TABLE IF NOT EXISTS redemptions (
  id                   TEXT PRIMARY KEY,
  card_id              TEXT NOT NULL REFERENCES gift_cards(id),
  merchant_business_id TEXT NOT NULL,
  owner_profile_id     TEXT NOT NULL,
  amount_cents         INTEGER NOT NULL CHECK (amount_cents > 0),
  idempotency_key      TEXT NOT NULL UNIQUE,
  status               TEXT NOT NULL DEFAULT 'done',        -- done|reversed
  payout_id            TEXT,
  ip                   TEXT,
  created_at           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_redemptions_merchant ON redemptions(merchant_business_id, payout_id);

CREATE TABLE IF NOT EXISTS merchant_payouts (
  id                   TEXT PRIMARY KEY,
  merchant_business_id TEXT NOT NULL,
  period_start         INTEGER NOT NULL,
  period_end           INTEGER NOT NULL,
  gross_redeemed_cents INTEGER NOT NULL,
  fee_cents            INTEGER NOT NULL DEFAULT 0,
  net_payout_cents     INTEGER NOT NULL,
  iban                 TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending',     -- pending|exported|paid
  reference            TEXT,
  paid_at              INTEGER,
  created_at           INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS gift_card_webhook_events (
  mollie_id    TEXT PRIMARY KEY,                            -- dedupe processed webhooks
  processed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS gift_card_merchants (
  business_id      TEXT PRIMARY KEY,                        -- references seed business id
  owner_profile_id TEXT,
  iban             TEXT,
  joined_at        INTEGER NOT NULL,
  payout_status    TEXT NOT NULL DEFAULT 'active'           -- active|paused
);
```

**Atomicity recap (stack-correct):** issuance = `db.batch([status-guarded UPDATE, issue INSERT])`; redemption = single conditional `INSERT … SELECT … WHERE SUM(...) >= :amt` then `db.batch([ledger INSERT, redemptions INSERT])`; payout stamping = `db.batch([INSERT payout, UPDATE redemptions…, UPDATE ledger…])`. **No `BEGIN/COMMIT` anywhere — D1 doesn't support it.**

**R2 key conventions:** no new bucket. Card design assets in `/public/cadeaukaart/<design>.png` (or R2 `assets/giftcard/<design>.png`). QR codes generated per request (data-URI) — never stored. Printable PDFs generated on demand.

**Route handlers** (METHOD /path → request → response):
- `POST /api/cadeaukaart/checkout` → `{ amountCents, design, recipientEmail, message?, purchaserEmail, consent:true }` → `201 { checkoutUrl }` | `400` validation.
- `POST /api/webhooks/mollie` → form body `id=<paymentId>` → always `200 ""` (idempotent; issues only on re-fetched `paid` + amount match).
- `GET /api/cadeaukaart/order-status?payment=` → `{ status:'pending'|'delivered'|'failed' }` (display only; rate-limited).
- `POST /cadeaukaart/saldo` (page action) → `{ balanceCents, expiresAt }` | generic "ongeldige of lege kaart" (rate-limited).
- `GET /cadeaukaart/claim/[token]` (page) → card view (`noindex`, robots-blocked).

**Server Actions:**
- `lookupCard(code)` → `{ last4, balanceCents, status }` (owner-gated, no write).
- `redeemCard(code, amountCents, idempotencyKey)` → `{ newBalanceCents }` | `{ error:'insufficient'|'empty'|'expired'|'not_participant' }` (single-statement debit; idempotent; double-spend-safe).
- `listMyRedemptions()` → owner-isolated list.
- `generatePayoutRun(periodStart, periodEnd)`, `markPayoutPaid(payoutId, reference)`, `refundCard(cardId, reason)`, `voidCard(cardId, reason)` (admin).

**Third-party calls + webhooks:**
- **Mollie Payments API** `POST /v2/payments` with `amount`, `description`, `redirectUrl`, `webhookUrl`, `method`, `metadata.cardId` → returns `_links.checkout.href`. **(Orders API is deprecated — do not use.)**
- Webhook → `GET /v2/payments/{id}` server-side; trust only that status + amount.
- **Mollie** `POST /v2/payments/{id}/refunds` for refunds.
- **Resend** `POST https://api.resend.com/emails` for card delivery + receipt (reuse `getResendConfig()`; **EU region**).
- **Bank:** SEPA **pain.001** XML / CSV export (manual upload v1; bank API later).

---

## 6. User flows & state machine

**Card lifecycle:** `draft` → `issued` → (`issued` balance>0 ↔ redemptions) → `issued` balance=0 (inert) | `expired` (sweep + breakage) | `void` (refund/fraud).

**Purchase flow & failures:**
1. Submit checkout → validate (1000–15000 cents, email, consent) → INSERT `draft` (with code+hash+token) → create Mollie payment → redirect.
   - *Validation fail* → `400`, stay on form. *Mollie create fail* → "betaling kon niet starten"; draft pruned by cron in 24h.
2. User pays / cancels at Mollie.
   - *Cancelled/expired/failed* → return to `/cadeaukaart/geannuleerd`; draft pruned.
3. Webhook `paid` → re-fetch + amount check → `db.batch`(`draft→issued` guarded, `+amount` ledger, expiry) → Resend deliver.
   - *Duplicate webhook* → dedupe table / 0-affected-rows → no-op, `200`.
   - *Webhook never arrives* → bedankt poll stays "in behandeling"; nightly job + admin manual "mark paid" with Mollie proof as fallback.
   - *Email bounce* → admin resend; the claim link always works via the balance/claim pages.

**Redemption flow & failures:**
1. Owner scans/types code → `lookupCard` → balance.
   - *Code invalid* → "kaart niet gevonden". *Expired* → "kaart is verlopen". *Empty* → "saldo €0". *Owner not a participant* → "doe mee" CTA, no lookup.
2. Owner enters amount ≤ balance → `redeemCard` with stable idempotency key.
   - *Concurrent till overdraw* → conditional insert affects 0 rows → "onvoldoende saldo, huidig saldo €X" (no debit).
   - *Double-submit (same key)* → `UNIQUE` violation caught → returns the existing redemption result (no second debit).
   - *Partial* → debit, show remaining + receipt; card stays `issued`. *Exact* → balance 0, inert.
3. Disputes → admin views full ledger; `voidCard` / `refundCard` / `adjust`.

**Settlement flow:**
1. `generatePayoutRun(period)` → per merchant, sum redemptions `payout_id IS NULL` → `db.batch`(INSERT `merchant_payouts`, stamp `payout_id` on those redemptions + ledger rows) → prevents double-pay.
2. Export SEPA pain.001/CSV → Wendy uploads → `markPayoutPaid(id, ref)`.
   - *Merchant IBAN missing* → payout blocked, ops notified.

---

## 7. Third-party choices

| Need | Options | EU residency / GDPR | Fit | Cost | Pick |
|---|---|---|---|---|---|
| **PSP / payments** | **Mollie** (Amsterdam) vs Stripe (IE, US parent) vs Adyen (Amsterdam, enterprise) | All EU-operable; Mollie & Adyen NL-domiciled, clean DPAs | Mollie = native **iDEAL** (dominant NL method), simple **Payments API** callable from Workers `fetch()`, hosted checkout (no PCI burden), test mode, Bancontact/Apple/Google Pay; Adyen is heavyweight/contract-gated; Stripe iDEAL is less NL-native + adds US-transfer questions | Mollie: no monthly fee; ~€0.29 per iDEAL txn; cards ~1.8%+€0.25 | **Mollie (Payments API)** |
| **Card delivery email** | **Resend** (EU region) vs Brevo vs Postmark | Resend EU keeps data in EU; already integrated | Reuse `getResendConfig()`; transactional templates | Free tier → ~€20/mo | **Resend (existing)** |
| **Float / bank account** | bunq / Knab / Rabobank business | NL banks, SEPA pain.001 | Dedicated ring-fenced stichting account + batch upload; bunq/Knab have APIs for later auto-SEPA | ~€0–15/mo | **bunq or Knab** |
| **Analytics** | Plausible EU / Simple Analytics vs GA4 | Plausible & Simple = EU, cookieless, GDPR-clean; GA4 has EU-transfer baggage + consent banner | Cookieless = no consent friction | ~€9–19/mo | **Plausible EU / Simple Analytics** |
| **QR generation** | `qrcode` (pure-JS, server) vs hosted QR API | Local = no data leaves us, edge-safe | Generate on demand in a route/action | €0 | **`qrcode` (local)** |
| **Fintech legal review** | Dutch fintech/payments lawyer | — | Confirm limited-network exclusion (Wft 1:5a(2)(k)), Wwft carve-out, MPV-VAT, €1M/DNB | one-off ~€2–4k | **required one-off** |

**Recommendation: Mollie (Payments API) + Resend (EU) + a ring-fenced bunq/Knab stichting account + Plausible EU + local `qrcode`**, with a one-off Dutch fintech-lawyer + accountant sign-off **before** go-live.

---

## 8. Milestones & sequencing

1. **M0 — Legal & financial foundation (4–6 wk, parallel, BLOCKING go-live):** stichting incorporation + KvK + ring-fenced bank account; Mollie live approval; MPV-VAT + breakage sign-off (accountant); fintech-lawyer sign-off on limited-network exclusion (Wft 1:5a(2)(k)) + Wwft carve-out + €1M/DNB mechanics; consumer terms + privacy clauses; DPAs (Mollie, Resend, Cloudflare).
2. **M1 — Backend ledger core (2.5 wk):** migration 0003; code/hash helpers; issuance/balance/redeem logic using `db.batch` + the single conditional debit; **Vitest** unit tests (balance math, idempotency, the overdraw race, expiry).
3. **M2 — Payment + delivery (2 wk):** Mollie **Payments** create + hosted checkout; idempotent webhook (re-fetch + amount verify + dedupe + status-guarded issue); `paid→issued`; Resend card email + receipt; QR generation.
4. **M3 — Owner till PWA (2 wk):** `/beheer/kassa` scan/type + redeem + partial + receipt + owner-isolation + history; PWA manifest; `gift_card_merchants` onboarding in `/beheer`.
5. **M4 — Admin reconciliation + payouts (2 wk):** dashboard (issued / outstanding liability / per-merchant); payout-run generation; SEPA pain.001/CSV export; mark-paid; refund/void; single-card ledger view; 12-month issuance vs €1M meter.
6. **M5 — Public storefront + SEO/AEO (1.5 wk):** purchase UI; bedankt/saldo/claim pages; schema (Product/Offer/HowTo/FAQ + `dateModified`); `llms.txt`; sitemap freshness; OG image; internal-linking badges; robots/noindex for claim+saldo.
7. **M6 — Hardening + launch (2 wk):** cron pruning/expiry/breakage; rate-limiting (WAF + in-D1); fraud monitoring; full QA incl. the **€25→€18→€7** scenario + concurrency/idempotency tests; **3-merchant pilot**, then district-wide (≥15 merchants) + Growth campaign.

**Engineering total ≈ 12–14 wk** sequential (M1–M6), **14–18 wk** wall-clock once M0's blocking items and inter-team review are accounted for. Backend-first ordering (M1–M2 before any UI polish) honours the owner directive.

## 9. Dependencies

- **Production launch + Cloudflare hardening first:** real `database_id` in `wrangler.jsonc` (today `REPLACE_WITH_D1_DATABASE_ID` — never deployed), WAF rate-limiting, and the auth-token cron this epic piggybacks on. `d1-next-tag-cache` is *not* required (gift-card routes are dynamic).
- **Stichting + ring-fenced bank account + Mollie live** (legal/ops — off the engineering critical path but **blocking go-live**).
- **Owner-acquisition flow + `owner_business`** so each redeeming shop has an authenticated, IBAN-bearing account (the current state has *no* owner self-service; admins insert rows manually — close this gap or onboarding won't scale).
- **Resend** already wired (`getResendConfig()`); **EU region** must be selected.
- **`src/lib/site.ts` / Organization schema** updated so the stichting (with KvK number + filled socials) is the issuer entity — also unblocks the empty-`sameAs` SEO gap.
- **Accountant + Dutch fintech-lawyer sign-off** (MPV-VAT, limited-network, Wwft).
- **Design-system token formalisation + shared form/Alert components** (from the design audit) — soft dependency that keeps the UI on-brand.
- **i18n epic** — only for the EN storefront (Later).

## 10. Risks & mitigations

The six load-bearing risks are in the structured `top_risks` (PSD2/e-money scope, double-spend race, MPV-VAT mis-classification, float/insolvency, webhook spoofing, redemption fraud). Each is mitigated in §4-Backend and §6. Additional:
- **Mollie Orders API assumption (was in the draft)** → **mitigated by switching to the Payments API** (Orders is deprecated as of 2025); avoids building on a sunset endpoint.
- **D1 "transaction" misconception** → every money path is implemented as a single conditional statement or `db.batch()`; no code assumes interactive transactions.
- **Wwft/AML exposure on anonymous cards** → cap €150, non-reloadable, no cash-out keeps the instrument inside the carve-out; confirmed by the lawyer.
- **Low pilot volume** → seasonal Growth pushes + printable cards owners can sell in-store.
- **Merchant non-participation** → recruit ≥15 merchants before public launch so the card is genuinely "district-wide".
- **€1M DNB threshold creeping up unnoticed** → running 12-month issuance meter on the admin dashboard with an alert.

## 11. Acceptance criteria / Definition of Done

- [ ] Stichting + ring-fenced bank account live; Mollie **live** approved; DPAs (Mollie, Resend, Cloudflare) signed; consumer terms + privacy published; fintech-lawyer + accountant sign-off on file (limited-network Wft 1:5a(2)(k), Wwft carve-out, MPV-VAT, breakage).
- [ ] Migration 0003 applied to **remote** D1; balance is computed **only** from the append-only ledger (no mutable balance column anywhere).
- [ ] Buying a €25 card via iDEAL issues **exactly one** card; duplicate/spoofed/replayed webhooks never issue a second or free card (verified by server-side re-fetch + amount check + dedupe + status-guarded `db.batch`).
- [ ] Concurrent redemptions **cannot overdraw** a card (race test passes against the single conditional debit); idempotent redeem never double-debits (`UNIQUE` key test passes).
- [ ] **Reference scenario passes:** €25 → €18 (Toko Tjin) → €7 (café) → €0; each step shows correct remaining balance + receipt; further scan shows "kaart is leeg".
- [ ] Admin reconciliation shows issued, outstanding liability (= sum of unredeemed balances), and per-merchant redeemed totals reconciling to **€0 variance** against test data; payout run generates correct per-merchant SEPA pain.001/CSV and stamps `payout_id` so redemptions are never paid twice.
- [ ] Cards have **≥730-day** validity; expiry sweep + breakage ledger entry work; refund/void work and call Mollie refund where applicable.
- [ ] **No gift-card data route is cached/ISR**; all are `force-dynamic` + `no-store`; `/saldo` + `order-status` + `redeemCard` are rate-limited; codes stored **hashed**; `merchant_business_id` derived server-side; claim route `noindex` + robots-blocked.
- [ ] Mollie integration uses the **Payments API** (not Orders); no Node-only APIs used at the edge.
- [ ] Schema.org Product/Offer + HowTo + FAQ validate (Rich Results Test); `/cadeaukaart` emits `dateModified`/freshness; `llms.txt` + sitemap updated; **no card codes leak into `llms.txt`/sitemap/schema**.
- [ ] WCAG AA on purchase + till flows (focus-ring contrast fixed to `--amber-ink`/white, non-colour status, 44px keypad targets, keyboard QR fallback, `aria-live` balance announcement) — also satisfies the EAA 2025 e-commerce obligation.
- [ ] GDPR erase honours the fiscal-retention carve-out (strips personal fields, preserves the legally-required financial ledger); marketing consent is separate and unticked by default.
- [ ] **Vitest** unit tests + an integration test of the reference scenario green in CI (this epic also establishes the first CI test job, currently absent).

## 12. KPIs & success metrics

GMV issued (€/mo) + cards sold; redemption rate at 90/180/365d + breakage %; avg card value + avg redemption basket; participating-merchant count + active-redeemer share; **float reconciliation variance (target €0)**; purchase-funnel conversion; payment success by method + webhook success rate; time-to-payout + payout error rate; `/cadeaukaart` organic + AI-referral traffic + HowTo/FAQ rich-result impressions; support tickets per 100 cards; **running 12-month issuance vs. €1M DNB threshold**.

## 13. Cost (at this scale)

**One-off:** Dutch fintech-lawyer review ~€2–4k; accountant VAT/float/breakage setup ~€0.5–1k; stichting incorporation (notary + KvK) ~€400–700; card design + printable template (internal/design); engineering 12–18 wk (team time).

**Monthly:** Mollie ~€0.29/iDEAL txn + ~1.8%+€0.25 for cards (pay-per-use, revenue-funded; at pilot volume a few €); Resend free→~€20; bunq/Knab business account ~€0–15; Plausible EU / Simple Analytics ~€9–19; Cloudflare D1/Workers within the existing ~€0–25 budget. **Net new fixed monthly ≈ €30–55** plus variable Mollie fees that are revenue-funded (and recoverable via an optional small scheme fee to merchants or a service fee at purchase — **note: any consumer-facing service fee must be disclosed in the terms per consumer law**).

---

### Reviewer changelog (draft → final)
- **Corrected Mollie integration to the Payments API** (Orders API deprecated 2025); updated DDL (`mollie_payment_id`), webhook (`GET /v2/payments/{id}`), and route signatures accordingly.
- **Removed the "D1 transaction" misconception**: D1 has no interactive `BEGIN/COMMIT`; all money paths re-specified as a single conditional `INSERT…SELECT…WHERE` and/or `db.batch()`. Added a status-guarded `db.batch` for issuance and an explicit affected-rows contract for the debit.
- **Hardened the webhook**: added amount re-verification against the draft, not just status.
- **Fixed legal citations**: PSD2 limited-network = Art. 3(k) PSD2 / **Wft 1:5a(2)(k)**; €1M/12-month **issuer-level** DNB notification threshold with a dashboard meter. **Added the missing Wwft/AML analysis** for anonymous cards (kept inside the carve-out via €150 cap, non-reloadable, no cash-out). Tied WCAG AA to the **EAA 2025** legal obligation.
- **Strengthened GDPR**: explicit fiscal-retention (art. 52 AWR) carve-out wired into the erase path; separate, unticked marketing consent.
- **Edge-runtime correctness**: Web Crypto for code/hash; pure-JS `qrcode`; no Node APIs; explicit note that OpenNext's dummy tag cache is irrelevant (routes are dynamic) and a flag that the `scheduled()` export mechanism under OpenNext must be verified (with a Cron-Trigger fallback).
- **Re-estimated effort up** (10–16 → 12–18 wk) and lengthened M0 (legal foundation 4–6 wk) to reflect the real compliance + reconciliation surface; added missing dependencies (owner self-service onboarding, `site.ts` KvK/socials, design tokens, first CI job).

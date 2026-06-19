# Newsletter + Connected Social Profiles — Owned-Audience Growth for Ondernemers van de Kamp

> **One-liner.** A GDPR-clean, self-hosted email program (Resend on its EU data region + a D1 `newsletter_subscribers` table) with double opt-in, a token-gated preference center, RFC 8058 one-click unsubscribe, and a monthly **auto-assembled** district digest — plus consent-gated (facade-loaded) Instagram/Facebook embeds and a `/links` link-in-bio page — turning De Kamp's existing SEO/AI-Overview traffic into an owned, re-engageable audience the association controls.
> **Recommended phase.** Phase 5, after production launch (Phase 4) and the Agenda/events D1 backend; runs in parallel with the owner-stories editorial strand.
> **Effort.** 5–7.5 weeks (ship the "capture + opt-in" slice first; digest automation depends on the Agenda backend).
> **Teams.** Backend/Infra (lead), Frontend, SEO/GEO/AEO, Design/UX, Content/Localization, **Legal/Compliance (heavy)**, Data/Analytics, Operations/Owner-relations, Product/PM, QA/Release.

---

## 0. Adversarial review notes (what changed from the draft and why)

This is the finalized document; the following issues were found and corrected during the skeptical pass:

1. **`/links` is NOT a `sameAs`.** The draft proposed adding the site's own `/links` page to the Organization `sameAs` array. `sameAs` is for **external** entity references (the brand's Instagram/Facebook/Wikidata URLs), never self-referential same-domain pages — adding `/links` would be a schema-correctness error and could dilute the entity signal. Corrected in §SEO: `sameAs` = the filled `SITE.social` external URLs only; `/links` is a normal internal page linked in nav/footer.
2. **Resend "EU region endpoint" is wrong.** Resend's API host is `https://api.resend.com` for everyone; **EU data residency is a region setting selected at domain/account creation**, not a different endpoint. Corrected throughout: the requirement is "create the sending domain in Resend's EU region and sign the DPA," not "call an EU endpoint."
3. **Bounce webhook hard/soft split.** Resend emits `email.bounced` and `email.complained`; the **bounce type (hard vs soft/transient) is read from the payload** (`data.bounce.type` / classification), not from a separate event name. Corrected: only **hard/permanent** bounces suppress immediately; soft bounces increment a counter and suppress after N consecutive fails. The draft's "`email.bounced` (hard) → suppress" would have suppressed transient failures.
4. **DMARC ramp.** Jumping straight to `p=quarantine` before DKIM/SPF alignment is proven in `rua` reports risks silently quarantining your own first sends. Corrected M0: launch DMARC `p=none` with `rua`, observe 1–2 weeks of aligned reports, then ramp to `p=quarantine`. Acceptance criterion updated accordingly.
5. **One-click unsubscribe needs BOTH headers AND a GET fallback.** RFC 8058 `List-Unsubscribe-Post: List-Unsubscribe=One-Click` is only honored by Gmail/Apple when the mail is DKIM-aligned and the sender meets bulk-sender rules; a visible footer link (GET) is mandatory regardless. Kept both; clarified the GET handler must be idempotent and CSRF-safe (it's a state change via GET, acceptable only because the token is the single unguessable capability and the action is opt-OUT, never opt-in).
6. **Cron timezone math corrected.** `0 4 1 * *` is 04:00 **UTC** = 06:00 CEST **only during summer (DST)**; in winter (CET) it is 05:00 local. Cloudflare cron is UTC-only with no DST awareness. This is acceptable for a "draft created overnight, admin reviews next morning" flow, but documented so nobody files a bug. Same applies to the nightly prune.
7. **No Vercel/Node-only assumptions found that survive** — but three latent traps were closed: (a) no `nodemailer`/SMTP (Workers can't open raw TCP for SMTP; Resend HTTP API only); (b) Svix signature verification must use the **Web Crypto** `crypto.subtle` HMAC path, not Node `crypto.createHmac` (the `svix` npm lib's default may pull Node APIs — verify it runs under `nodejs_compat`, or hand-roll HMAC-SHA256 with Web Crypto); (c) MJML compilation is a **build-time/local** step, not a runtime Worker dependency (MJML's compiler is heavy and Node-oriented) — store pre-compiled HTML templates and interpolate at the edge.
8. **Idempotent send needs per-recipient tracking, not just an issue-status flag.** The draft's "refuse if already sending/sent" guards against a double-click but NOT against a mid-batch crash resuming and re-sending the first batches. Added a `newsletter_deliveries` table so resume skips already-sent recipients. This is the single biggest correctness gap in the draft.
9. **VAT/e-money/PSD2/voucher law is correctly out of scope** for this epic (that's Cadeaukaart). Confirmed: nothing here touches payments. The only money-adjacent risk is the GBP review deep-link in the digest footer, governed by the Reviews epic's Places API rules — cross-referenced, not duplicated.
10. **Resend's "EU region" is sending-region only — account data/logs are US-stored (DPF+SCC).** Verified against Resend's regions/GDPR docs: selecting the EU (Ireland) sending region governs where mail is *transmitted*, but **account data, recipient email metadata, delivery logs, and analytics are stored in the United States** regardless, made lawful by Resend's **EU-US Data Privacy Framework certification + Standard Contractual Clauses** in its DPA. This is legally adequate but is NOT "pure EU residency," so the MEMORY directive ("EU data residency for all processors") is satisfied **via the DPF/SCC transfer mechanism, not by storage location** — it must be recorded as a US transfer in the ROPA and disclosed in the privacy policy. Corrected the §7 table and Legal section; added the strict-EU fallback (minimise PII held in Resend, or migrate to MailerLite/Brevo).
11. **Svix npm package is Node-targeted — verify Web Crypto path.** The `svix` library's signature verifier may pull Node `crypto`; under partial `nodejs_compat` this is a trap. The webhook handler hand-rolls HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${rawBody}` with `crypto.subtle`, base64-comparing constant-time against the `svix-signature` values, with a ±5-min timestamp tolerance. (Already implied in §4; made explicit.)
12. **Resend batch hard limit is 100/request; free tier caps at 100 emails/day & 3,000/mo.** A list larger than 100 cannot send in one day on the free tier — the delivery-ledger resume mechanism doubles as the multi-day spread. Stated in §7 and §8 M3.

---

## 1. Goal & value

The site already wins discovery: dense JSON-LD, `llms.txt`, AI-crawler permissioning, ISR freshness. But **all that traffic is anonymous and one-shot.** A visitor who finds "leuke koffie op De Kamp" in an AI Overview lands, reads, and leaves — the district has no way to bring them back for the kerstmarkt, a new shop, or a koopzondag. Owners get a listing but no recurring channel to the district's collective audience. The footer "newsletter" is a `mailto:` — it captures nothing.

This epic builds the **owned-audience layer**: the one marketing asset no algorithm change can take away.

- **For the district/association:** a direct, free, recurring channel to hundreds of locals — the lever to fill events, announce new ondernemers, and demonstrate value to member businesses (justifying the association's existence and any membership fees).
- **For owners** (e.g. the teams at **Bagels & Beans**, **Saint Sushi**, **Bloem & Zo**): collective reach they could never buy alone. A new shop opening or a one-day promotion reaches the whole district mailing list, not just their own 200 Instagram followers. Owners get a QR/share link to grow the shared list and benefit from it.
- **For visitors/locals** (e.g. **Sanne**, a 32-year-old Amersfoorter): one trustworthy monthly email — what's on, who's new, what to try — instead of following 67 separate Instagram accounts. Low-frequency, high-signal, easy to leave.
- **The freshness flywheel (2026 AEO):** the monthly digest is published as a **web-archive page** with `datePublished`/`dateModified`, feeding the >83%-of-AI-citations-are-fresh signal and giving AI engines a recurring, dated, district-authoritative source to cite.

The problem solved: **anonymous traffic → re-engageable, consented, owned audience**, assembled automatically so a part-volunteer team can actually sustain it.

---

## 2. How it works in real life

**Personas:** *Sanne* (visitor/local), *Mark* (owner of **Saint Sushi**), *Eva* (district admin/moderator).

### Journey A — Sanne subscribes (visitor double opt-in)
1. Sanne reads the **Saint Sushi** detail page after finding it via Google. In the footer (and an inline block under the detail body) she sees a calm prompt: *"Eén keer per maand: wat er speelt op De Kamp. Nieuwe ondernemers, events, verhalen."* with an email field and an **unchecked** consent box linking the privacy policy.
2. She types her email, ticks *"Ik ga akkoord met de privacyverklaring"*, hits **Inschrijven**. The form (a Server Action with `useActionState`) shows an inline spinner, then: *"Bijna klaar! Check je inbox en bevestig je inschrijving."* No page reload; works without JS via progressive enhancement.
3. The action runs the same logic as `POST /api/newsletter/subscribe`: rate-limit + honeypot pass → a `newsletter_subscribers` row is inserted `status='pending'` with a 64-hex `confirm_token`, a stable `unsub_token`, the `consent_text_version`, `consent_ip`, timestamps, and `source='business:saint-sushi'`. A confirmation email goes out via Resend from `nieuwsbrief@mail.ondernemersvandekamp.nl`.
4. Sanne opens the email *"Bevestig je inschrijving"* and clicks the single button → `GET /api/newsletter/confirm?token=…` flips her to `status='confirmed'`, nulls `confirm_token`, writes a `confirm` event to the audit trail, sends a welcome email (with a visible unsubscribe), and redirects to **/nieuwsbrief/bevestigd** (*"Je bent erbij!"*).
5. She is now `confirmed` in segment `visitors`. **Edge case:** had she never clicked, she'd stay `pending` and never be emailed again; a nightly cron prunes `pending` rows older than 30 days (with no second nag email — a single confirm request only, to stay clearly opt-in).

### Journey B — Mark grows and benefits from the shared list (owner)
1. Mark logs into **/beheer** for Saint Sushi. A new panel: *"Help de nieuwsbrief groeien."* It shows his personal share link `…/nieuwsbrief?bron=saint-sushi` and a downloadable QR poster for his counter.
2. A diner scans the QR → lands on **/nieuwsbrief** → subscribes with `source='owner:saint-sushi'`. Mark's dashboard later shows *"12 mensen ingeschreven via jouw zaak."* (owner-attributed signups KPI).
3. When Saint Sushi launches a new ramen menu, Mark submits it as an **event/story** through his portal (existing moderation pattern). Eva approves it; it becomes eligible content for next month's digest — Mark gets district-wide reach without sending anything himself.

### Journey C — Eva assembles and sends the monthly digest (admin)
1. On the 1st of the month a **Cloudflare Cron Trigger** fires `assembleDigest()` inside the Worker's `scheduled()` handler. It queries upcoming agenda events (next 6 weeks), owner-stories published in the last 30 days, and `owner_business` joins from the last 30 days. It writes a `newsletter_issues` draft (`status='draft'`, structured `body_json`) and emails Eva: *"Concept nieuwsbrief juli klaar voor review."*
2. Eva opens **/admin/nieuwsbrief**. She sees the auto-built draft: hero, "Deze maand op De Kamp" event list, "Nieuw op De Kamp", and a featured owner-story. She tweaks the intro, removes one event, clicks **Preview** (renders the exact HTML in a sandboxed iframe), then **Goedkeuren & versturen**.
3. `approveAndSendDigestAction` (admin-gated): sets `approved`, renders `body_html`, loads all `confirmed` subscribers in the target segment, **excludes anyone `unsubscribed`/`bounced`/`complained`**, writes one `newsletter_deliveries` row per recipient, and batch-sends via Resend with a per-recipient `List-Unsubscribe` (RFC 8058) header + footer link. `status` → `sending` → `sent`; `recipient_count` stored. A mid-batch crash resumes by skipping deliveries already marked `sent`.
4. Sanne receives the digest, clicks "Kerstmarkt op De Kamp" → lands on `/agenda` (UTM-tagged). Three months later she clicks the header unsubscribe → `GET /api/newsletter/unsubscribe?token=…` flips her to `unsubscribed` in one click, no login. An `unsubscribe` event is logged; she's excluded from all future sends.
5. **Edge case** — a dead address: Resend POSTs `email.bounced` to `/api/webhooks/resend` (Svix-signed); if the payload classifies it **hard/permanent**, the subscriber → `bounced` + suppressed. A spam complaint → `complained` + permanent suppression.

---

## 3. Scope

**In (this epic):**
- Self-hosted subscriber store in D1 + double opt-in + token-gated preference center + RFC 8058 one-click unsubscribe.
- Immutable consent/audit trail (`subscriber_events`) and per-send delivery tracking (`newsletter_deliveries`) for idempotent resumable sends.
- `<NewsletterForm>` Server-Action component replacing the footer `mailto:`; placements (footer, post-detail, `/agenda`, standalone `/nieuwsbrief`).
- Segments `visitors` and `owners` (extensible JSON array).
- Welcome automation + monthly auto-assembled district digest with admin approve-to-send gate.
- Deliverability: dedicated `mail.` subdomain with SPF/DKIM, DMARC ramp (`none`→`quarantine`), bounce/complaint webhook + suppression.
- Public web-archive of issues at `/nieuwsbrief/[issue]` (AEO freshness, `Article`/`NewsArticle` schema).
- Connected socials: fill `SITE.social`, brand-correct icons, consent-gated (facade) Instagram embed, `/links` link-in-bio page, Organization `sameAs` (external URLs only).
- Admin newsletter dashboard + privacy-friendly analytics events.

**Out (explicitly not now):**
- Full third-party ESP migration (MailerLite/Brevo) — documented exit only (see §7).
- Auto cross-posting site content **to** Instagram/Facebook (Meta Graph API publishing) — high maintenance, low ROI; link-in-bio + manual posting instead.
- Paid acquisition, lead magnets, SMS/WhatsApp.
- Per-owner individual newsletters (owners contribute to the shared digest; no per-owner sender).
- Drip/behavioural automation beyond welcome + monthly digest.
- Any payments/voucher/e-money flow (that is the Cadeaukaart epic — no PSD2/VAT surface here).

**Later (next iterations):**
- EN-language digest variant once the bilingual epic ships (`locale` column already designed in).
- Interest-based segmentation (horeca vs winkels vs events) in the preference center.
- A/B subject-line testing.
- Owner-controlled per-business embedded feed.

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16, App Router)

> Next.js 16 + React 19: route handlers and Server Components are the norm; `params`/`searchParams` are async (await them). No Node-only APIs at the edge.

- **`<NewsletterForm>` (server shell + tiny client island).** Use a **Server Action** with `useActionState` (not a client `fetch`) so the form is progressive-enhancement-friendly and works without JS. The action calls the shared `subscribe()` lib function (same code path as the route handler). Fields: `email`, `consent` (required checkbox), hidden `source`, hidden honeypot `website`. The client island only renders pending/success/error UI.
- **Placements:**
  - Footer — replace the `mailto:` block in `Footer.tsx` with `<NewsletterForm variant="footer" source="footer" />`.
  - Business detail — below the owner-acquisition CTA in `BusinessDetailClient.tsx`: `<NewsletterForm variant="inline" source={"business:"+b.id} />`.
  - `/agenda` — prominent block: *"Mis geen event — krijg de maandelijkse agenda."*
- **Pages (App Router; await `searchParams`):**
  - `/nieuwsbrief` — landing + signup (server component, ISR ok). Capture `?bron=` into `source`.
  - `/nieuwsbrief/bevestigd` — confirm success (static).
  - `/nieuwsbrief/uitgeschreven` — unsubscribe confirmation + one-click "opnieuw inschrijven" + "voorkeuren beheren".
  - `/nieuwsbrief/voorkeuren` — preference center; reads `?token=`, server-fetches current segments, posts back. `export const dynamic = 'force-dynamic'`, no-store — token-gated, never cached.
  - `/nieuwsbrief/[issue]` — public web-archive of a sent issue (ISR, indexable, carries `dateModified`).
  - `/links` — link-in-bio page (static).
- **Shared form components (design-system uplift):** build `<KampInput>`, `<KampCheckbox>`, `<Alert variant>` and reuse them in `AanmeldenForm` too (retiring its `mailto:` and ad-hoc field strings — see Design).
- **State:** `useActionState` (idle / submitting / success / already-subscribed / error). Confirm/unsubscribe/preference pages are stateless server renders.
- **Icons & embeds:** brand-correct Instagram/Facebook SVG glyphs (not lucide `Camera`/`Share2`). Instagram embed uses a **facade**: a `next/image` thumbnail that loads the Meta `embed.js` only on click → no Meta SDK or cookie on page load (CWV + GDPR win). The facade must be keyboard-operable (`<button>`, Enter/Space) and the loaded embed focus-managed.
- **CWV:** no third-party script on initial load anywhere; form island is tiny; archive pages are static HTML.
- **Sitemap/noindex wiring:** ensure `/nieuwsbrief/voorkeuren`, `/nieuwsbrief/uitgeschreven`, and all token URLs emit `<meta name="robots" content="noindex">` and are excluded from `sitemap.ts`.

### Engineering — Backend & Infra (Cloudflare) — PRIMARY, most detail

**Migrations** (`migrations/0003_newsletter.sql`, applied via existing `db:migrate` / `db:migrate:local`):

```sql
-- 0003_newsletter.sql

CREATE TABLE newsletter_subscribers (
  id                   TEXT PRIMARY KEY,           -- crypto.randomUUID()
  email                TEXT NOT NULL UNIQUE,       -- lowercased on write
  status               TEXT NOT NULL DEFAULT 'pending',
                       -- pending | confirmed | unsubscribed | bounced | complained
  locale               TEXT NOT NULL DEFAULT 'nl',
  segments             TEXT NOT NULL DEFAULT '["visitors"]', -- JSON array
  confirm_token        TEXT,                       -- 64-hex, nulled after confirm
  unsub_token          TEXT NOT NULL,              -- 64-hex, stable, unguessable
  consent_text_version TEXT NOT NULL,              -- e.g. 'nl-2026-06'
  consent_ip           TEXT,                       -- captured at opt-in (truncate last octet, see Legal)
  source               TEXT,                       -- footer | business:<id> | owner:<id> | agenda | links
  soft_bounce_count    INTEGER NOT NULL DEFAULT 0,
  confirmed_at         INTEGER,
  unsubscribed_at      INTEGER,
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL
);
CREATE INDEX idx_subs_status  ON newsletter_subscribers(status);
CREATE INDEX idx_subs_confirm ON newsletter_subscribers(confirm_token);
CREATE INDEX idx_subs_unsub   ON newsletter_subscribers(unsub_token);

-- Immutable consent/audit trail (GDPR accountability, Art. 5(2)).
-- Never UPDATE; only INSERT, and DELETE/anonymise on erasure.
CREATE TABLE subscriber_events (
  id            TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL,                     -- soft ref (kept on anonymise)
  type          TEXT NOT NULL,
                -- subscribe | confirm | unsubscribe | bounce_soft | bounce_hard
                -- | complaint | preference_change | resubscribe | erased
  detail        TEXT,                              -- JSON (consent text version, segment diff, bounce reason)
  ip            TEXT,
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_subevents_sub ON subscriber_events(subscriber_id);

CREATE TABLE newsletter_issues (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,            -- 'nieuwsbrief-2026-07'
  subject         TEXT NOT NULL,
  preheader       TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',   -- draft | approved | sending | sent | failed
  segment         TEXT NOT NULL DEFAULT 'visitors',
  body_json       TEXT NOT NULL,                   -- structured blocks (events, stories, new shops)
  body_html       TEXT,                            -- rendered, set at approve time
  created_by      TEXT,                            -- 'cron' | profile id
  approved_by     TEXT,                            -- profile id
  sent_at         INTEGER,
  recipient_count INTEGER,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Per-recipient delivery ledger → idempotent, resumable sends (crash-safe).
CREATE TABLE newsletter_deliveries (
  id            TEXT PRIMARY KEY,
  issue_id      TEXT NOT NULL,
  subscriber_id TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued',    -- queued | sent | failed
  resend_id     TEXT,                              -- Resend message id (for webhook correlation)
  error         TEXT,
  created_at    INTEGER NOT NULL,
  sent_at       INTEGER,
  UNIQUE(issue_id, subscriber_id)
);
CREATE INDEX idx_deliveries_issue ON newsletter_deliveries(issue_id, status);
```

**Route handlers** (App Router `route.ts`; `export const dynamic = 'force-dynamic'`, never cached):

- `POST /api/newsletter/subscribe` → body `{ email, consent, source?, website? }`. Reject if `website` filled (bot → return generic 200). Validate email format; require `consent===true` (else generic 200, no row). Lowercase email. Rate-limit (below). Then:
  - existing `confirmed` → idempotent `{ ok:true }`, **no re-email** (anti-enumeration).
  - existing `unsubscribed` → resubscribe: back to `pending`, new `confirm_token`, send confirm, log `resubscribe`.
  - existing `bounced`/`complained` → **do not silently resubscribe**; require the explicit confirm click (set `pending` + new token, send confirm) and log it.
  - else INSERT `pending`, send confirm, log `subscribe`.
  - Always return `{ ok:true }` (200) regardless of pre-existing state.
- `GET /api/newsletter/confirm?token=…` → lookup by `confirm_token`; if valid + still `pending` → `confirmed`, null token, set `confirmed_at`, log `confirm`, send welcome, 302 → `/nieuwsbrief/bevestigd`. If already confirmed → 302 with friendly "al bevestigd". If unknown/expired → 302 → `/nieuwsbrief?fout=token`. Confirm tokens expire after 14 days; pruned with `pending` rows.
- `GET /api/newsletter/preferences?token=…` (uses `unsub_token`) → render preference center server-side. `POST` same → update `segments`, log `preference_change`, 302 → `?opgeslagen=1`.
- `GET /api/newsletter/unsubscribe?token=…` → flip `unsubscribed`, set `unsubscribed_at`, log `unsubscribe`, 302 → `/nieuwsbrief/uitgeschreven`. **Also** accept `POST` for RFC 8058 one-click (`List-Unsubscribe-Post: List-Unsubscribe=One-Click`) → 200. GET-as-state-change is acceptable here because the token is the sole unguessable capability and the action is opt-OUT only (never opt-in via GET).
- `POST /api/webhooks/resend` → verify the **Svix signature** with `RESEND_WEBHOOK_SECRET` using **Web Crypto** (`crypto.subtle`, HMAC-SHA256) — do NOT rely on a Node-`crypto`-based path. On `email.bounced`: read the payload's bounce classification — **hard/permanent** → `bounced` + suppress + log `bounce_hard`; **soft/transient** → increment `soft_bounce_count`, suppress + log `bounce_hard` only after 3 consecutive softs. On `email.complained` → `complained` + permanent suppress + log `complaint`. Optionally consume `email.delivered`/`email.opened`/`email.clicked` to update `newsletter_deliveries`/analytics. Always return 200 fast; reject unsigned/invalid (401).

**Server Actions (admin, `requireAdmin`-gated):**
- `previewDigestAction(issueId)` → render `body_html` from `body_json` (interpolate into the pre-compiled template), return for sandboxed-iframe preview.
- `approveAndSendDigestAction(issueId)` → guard: refuse unless `draft`/`approved` (idempotent — refuse if `sent`). Set `approved`, render HTML, load `confirmed` subscribers in `segment` **excluding `bounced`/`complained`/`unsubscribed`**, INSERT a `newsletter_deliveries` row per recipient (`queued`). Set issue `sending`. Batch through Resend (≤100/batch, backoff on 429), skipping deliveries already `sent` (crash-resume), injecting each recipient's `unsub_token` into the `List-Unsubscribe` header + footer link, recording `resend_id` and flipping each delivery to `sent`. When all delivered → issue `sent`, store `recipient_count`. On fatal error → `failed` (resumable by re-invoking — already-`sent` deliveries are skipped).

**Cron / `scheduled()`:** extend the Worker's `scheduled()` export (the same handler that prunes expired `auth_tokens`/`sessions` nightly — see Backend audit):

```jsonc
// wrangler.jsonc
"triggers": { "crons": ["0 4 * * *", "0 4 1 * *"] }
// UTC. "0 4 * * *" = nightly prune. "0 4 1 * *" = 1st of month digest assembly.
// NOTE: Cloudflare cron is UTC with no DST. 04:00 UTC = 06:00 CEST (summer) / 05:00 CET (winter).
// Acceptable for an overnight-draft → next-morning-review flow.
```

Nightly (`0 4 * * *`): prune `auth_tokens` and `sessions` past expiry, and `newsletter_subscribers` `status='pending'` older than 30 days (delete row + log `erased` once). Monthly (`0 4 1 * *`): `assembleDigest()` →
1. Query upcoming agenda events (next 6 weeks), recent owner-stories (last 30 days), recent `owner_business` joins (last 30 days).
2. If insufficient fresh content (e.g. 0 events AND 0 new shops AND 0 stories) → **skip** (log + optional admin notify) rather than send an empty digest.
3. Else INSERT `newsletter_issues` draft (`created_by='cron'`) and email admin to review at `/admin/nieuwsbrief`.

> **Dependency gate:** `assembleDigest()` requires the **Agenda/events D1 backend**. The current `src/data/events.ts` is a static array with mostly recurring/no-`startDate` entries and no D1 table — M3 cannot ship until that backend exists. The "capture + opt-in" slice (M0–M2) has no such dependency and should ship first.

**Settings / secrets:**
- New secret `RESEND_WEBHOOK_SECRET` (set via `wrangler secret put`; surface in `/admin/instellingen` like the existing Resend keys).
- Add `resend_newsletter_from` to `SETTING_KEYS` in `src/lib/settings.ts` so the bulk sender address is separate from the transactional one (deliverability isolation). Add a `getNewsletterFrom()` getter mirroring `getResendConfig()` (fall back to `nieuwsbrief@mail.…` default). Reuse the existing `getResendConfig()` `apiKey`.

**Bindings/Infra:** no new R2 or D1 binding required (reuse `DB`). If instant invalidation of `/nieuwsbrief/[issue]` on publish is wanted, it benefits from the `d1-next-tag-cache` override already recommended in the backend audit; otherwise the 5-min ISR window is acceptable (the dummy tag cache makes `revalidatePath` a no-op today).

**Security & isolation:**
- **Rate-limit `/api/newsletter/subscribe`** — Cloudflare WAF rate-limit rule (5 req/min/IP, zero-cost on Workers) + an in-app guard (per-IP + per-email throttle in D1 or a short-TTL KV/in-memory map). Pairs with the auth-endpoint rate-limit gap already flagged in the audit.
- Honeypot + strict email-format validation; no CAPTCHA initially.
- All tokens are 64-hex via `crypto.getRandomValues` (reuse the existing `randomToken()` helper from `auth.ts`) — unguessable. Unsubscribe/preferences are token-gated, not session-gated (subscribers have no login).
- Webhook Svix-signature verified (Web Crypto); reject unsigned/replayed (check timestamp tolerance).
- Never reveal whether an email exists (idempotent 200) → no enumeration.
- Admin send is `requireAdmin`; subscriber PII is never rendered on public routes; the `/admin/nieuwsbrief` recipient counts are aggregates, not email lists.

**No-Node traps closed:** no SMTP/`nodemailer` (Workers can't open raw TCP; Resend HTTP API only); MJML compiled **offline** to static HTML templates stored in-repo (no MJML at runtime); Svix verify via Web Crypto; all `fetch` to `https://api.resend.com` respects `global_fetch_strictly_public`.

**Migrations discipline:** apply `0003_newsletter.sql` `--local` first, Vitest the lib state machine, then `--remote`.

### SEO / GEO / AEO

- **Schema.org:**
  - `/nieuwsbrief/[issue]` archive pages emit **`Article`** (or `NewsArticle`) with `headline`, `datePublished` (= `sent_at`), `dateModified`, `author` + `publisher` → Organization `@id`, `image`, and `about` → district `@id`. This is the recurring **fresh, dated, district-authoritative** content AI engines reward.
  - Add a `WebPage` node (optionally a `Service`-style node describing the free district newsletter) to `/nieuwsbrief` for the "nieuwsbrief De Kamp" entity signal.
  - Newsletter archive index emits an `ItemList` linking each issue.
- **Organization `sameAs` — external URLs only.** Filling `SITE.social.instagram`/`facebook` (this epic) finally populates the empty `sameAs` array — the entity-anchoring win flagged in the SEO audit. **Do NOT add `/links` (a same-domain page) to `sameAs`** — `sameAs` is for external profile URLs that resolve the same entity elsewhere on the web. `/links` is a normal internal page (nav/footer link), not a `sameAs` target. If a Linktree/Wikidata URL exists for the brand, those external URLs may be added.
- **Metadata/OG:** each archive issue gets unique title/description/canonical + OG; `/nieuwsbrief` and `/links` get proper metadata. No hreflang yet (NL-only) but the `locale` column + page structure are EN-ready (`metadata.alternates.languages` later).
- **llms.txt:** add a `## Nieuwsbrief` section linking the archive + latest issue. Reflect upcoming events once the Agenda backend lands (reuse the same structured data the digest assembles).
- **sitemap/robots:** add `/nieuwsbrief`, `/nieuwsbrief/[issue]` (per issue, `lastModified`=`sent_at`, weekly), `/links`. Keep `/nieuwsbrief/voorkeuren`, `/nieuwsbrief/uitgeschreven`, `/api/*`, and all token URLs **out** of the sitemap and `noindex` them (token URLs must never be indexed — they're capabilities).
- **AEO answer-formatting:** the digest web-archive leads each section with a 40–60-word extractable answer chunk ("Deze maand op De Kamp: …"). The `/nieuwsbrief` FAQ ("Hoe vaak verschijnt de nieuwsbrief?", 40–60 words) feeds FAQPage schema.
- **Internal linking:** archive issues deep-link to `/ondernemers/[id]` and `/agenda` (topical authority + crawl paths); business pages link to `/nieuwsbrief`.
- **Local SEO / Reviews cross-ref:** the welcome + digest footers may embed the "laat een review achter" GBP deep-link — but that is governed by the **Reviews epic's** Places API rules (place_id is the only cacheable field; attribution rules apply if any review snippet is shown). Do not display Places-API-sourced review content in emails here.

### Design / UX

- **Screens:** `<NewsletterForm>` (footer/inline/standalone variants), `/nieuwsbrief` landing, preference center, confirm/unsubscribe pages, `/admin/nieuwsbrief` (draft list + sandboxed preview + approve), `/links`, and the email templates.
- **Component states (deliver all):** idle, focused, submitting (spinner), success ("check je inbox"), already-subscribed (soft), error (invalid email / network). Use a named `<Alert variant="success|warning|error|info">` — not the current ad-hoc `bg-sage/60` banners.
- **Brand fidelity:** forms use the design tokens (paper bg, deep-green CTA, amber-ink links, `--radius`), serif headings ("De Kamp leeft." voice). Introduce the shared `<KampInput>`/`<KampCheckbox>` and retire the orphaned portal/`AanmeldenForm` styles in the same pass.
- **Email design:** branded, **table-based, inline-CSS, dark-mode-tolerant** template (MJML compiled **offline** to static HTML, then interpolated at the edge), matching paper/green/amber. Single column, ~600px, big tap targets, visible unsubscribe + physical sender identity in the footer.
- **Responsive:** footer form stacks on mobile; preference center single-column.
- **Motion:** respect `prefers-reduced-motion`; subtle success-check only.
- **WCAG AA (European Accessibility Act applies):** consent checkbox has a real `<label>`; errors are `aria-live="polite"` and not colour-only; **fix the existing focus-ring bug** — new components use `--amber-ink`/white (the current `--amber` ring is ~3.2:1, below SC 1.4.11 3:1 on dark and borderline on light). Email templates keep ≥4.5:1 text contrast.
- **Deliverables:** Figma frames for all states + the email template + a handoff spec (tokens, copy, states); a **print-ready A5 QR poster** for owners.

### Content / Localization

- **Copy needed (NL, warm/informal je/jij):** signup headline + sub + consent label + button; confirmation email (subject, body, button); welcome email; the monthly digest template skeleton ("Deze maand op De Kamp", "Nieuw op De Kamp", "Uit de buurt — een verhaal"); confirm/unsubscribe page copy ("Jammer dat je gaat — je bent uitgeschreven."); preference center labels; `/links`; FAQ.
- **Tone:** consistent with "kloppend hart"/"straatportret" register; digest intros in editorial voice, transactional emails warm-but-clear.
- **Consent text is content + legal:** the exact opt-in sentence is versioned (`consent_text_version`) — Content drafts, Legal signs off, any change bumps the version.
- **Bilingual implication:** all strings live as constants ready to move into `src/messages/nl.json` when the i18n epic lands; the `locale` column means EN subscribers can later get an EN digest with zero schema change. No EN copy now.
- **Alt text:** every digest/archive image needs Dutch alt text.
- **Editorial workflow:** cron auto-assembles; a content owner writes only the ~2-sentence intro per issue and reviews — keeping human effort sustainable.

### Legal / Compliance (GDPR) — heavy

- **Lawful basis:** **consent** (Art. 6(1)(a)) for marketing email — no soft-opt-in existing-customer relationship exists here. Consent must be **freely given, specific, informed, unambiguous, opt-in** → unchecked checkbox + **double opt-in** is the defensible standard under GDPR + ePrivacy + the Dutch **Telecommunicatiewet** (spamverbod), enforced by **ACM** (and **AP** for the data side).
- **Stored consent:** persist consent text **version**, timestamp, IP, and source per subscriber, plus the immutable `subscriber_events` trail (accountability, Art. 5(2)). The confirm event is the proof of opt-in. **Data-minimisation on IP:** store a **truncated** IP (drop the last octet for IPv4 / last 80 bits for IPv6) — full IP is rarely necessary to evidence consent and minimisation is required; document the choice in the ROPA.
- **One-click unsubscribe:** RFC 8058 `List-Unsubscribe` + `List-Unsubscribe-Post` header in **every** send **and** a visible footer GET link; honour immediately. The welcome email (the first marketing-ish mail) also carries unsubscribe.
- **Right to access / erasure:** subscribers request deletion → hook into the existing `gdpr.ts` pattern (add `purgeSubscriber(email)`); deleting the `newsletter_subscribers` row, then either deleting or **anonymising** `subscriber_events` (replace `subscriber_id`/`ip` with a tombstone, keep only the minimum needed to evidence past lawful sending, then purge on schedule). A self-service "verwijder mijn gegevens" link on the unsubscribe page is recommended.
- **Retention:** `pending` > 30 days pruned (nightly cron). `unsubscribed`/`bounced`/`complained` retained **minimally** (an email **hash** on a suppression list) to honour the opt-out without keeping the plaintext address longer than necessary; document the period.
- **Processors + DPAs:** **Resend** is the email processor — sign Resend's **DPA** and create the sending domain in Resend's **EU sending region**. **Critical accuracy point:** the EU region governs only where mail is *transmitted*; **Resend stores account data, recipient email metadata, delivery logs, and analytics in the United States**, made lawful via Resend's **EU-US Data Privacy Framework certification + SCCs**. This is adequate but is a **US transfer** — record it as such in the ROPA and disclose it in the privacy policy (don't claim "all data stays in the EU"). Keep PII held in Resend minimal (D1 is the durable source of truth; consider per-recipient sends so Resend never holds a standing audience). If the association requires strict EU-only storage, fall back to **MailerLite EU**/**Brevo** (§7). Cloudflare (D1/Workers) is already a processor; confirm/record the EU data-residency (D1 location) configuration. **Meta** (Instagram/Facebook embeds) is a processor only when its scripts load → the **facade/click-to-load** pattern keeps the default page Meta-cookie-free (no consent needed until the user clicks, at which point the cookie/consent notice covers it).
- **Privacy + cookie pages — BLOCKER:** the current Footer `Privacy`/`Cookies` links are `#` placeholders. Publish a real privacy statement (data collected, basis, retention, processors incl. Resend + Cloudflare + Meta-on-click, rights, **ACM/AP complaint route**) and a cookie/consent notice covering the facade-gated embeds **before any sending**.
- **Out of scope (cross-refs):** no payments/PSD2/e-money/voucher/VAT here (Cadeaukaart epic). Any GBP review snippet rules live in the Reviews epic.
- **Sender identity:** every email carries a clear sender name + a physical/postal contact for the association (anti-spam + transparency).

### Data / Analytics

- **Events (cookieless, no Meta pixel):** `newsletter_signup_view` (by placement), `newsletter_signup_submit`, `newsletter_confirm`, `newsletter_unsubscribe`, `newsletter_preference_change`; from Resend webhooks: `digest_sent`, `digest_open`, `digest_click` (per-link UTM). Owner-attributed signups via `source`.
- **KPIs (see §12).** Funnel: view → submit → confirm → engaged.
- **Dashboards:** `/admin/nieuwsbrief` shows list size, confirm rate, monthly net growth, last-issue open/click/unsub, suppression count — all **aggregates**, never raw email lists. Optionally pipe Resend webhook stats into `newsletter_deliveries`/a stats table for a self-owned dashboard.
- **Instrumentation:** GDPR-friendly analytics (Plausible or self-hosted Umami, EU, cookieless) for page funnel; Resend webhooks for email metrics. UTM convention: `utm_source=nieuwsbrief&utm_medium=email&utm_campaign=<issue-slug>`.

### Operations / Owner-relations

- **Owner onboarding:** the `/beheer` share-link + QR poster; a one-page "groei de nieuwsbrief mee" explainer; track owner-attributed signups and celebrate top contributors.
- **Moderation/SLA:** digest content flows through the existing event/story moderation queue (Eva approves within 48h). Digest send: auto-draft on the 1st; admin reviews + sends within 5 business days, else skip the month.
- **Support:** an inbox for "ik kan me niet uitschrijven" / "verkeerd e-mailadres" → admin manually suppresses/erases from `/admin`. Bounce/complaint auto-handled; admin intervenes only on disputes.
- **Runbook:** complaint-rate spike → pause sends, review last issue; Resend outage → resumable send (delivery ledger) + backoff; DMARC reports show spoofing → tighten policy.

### Product / PM & QA/Release

- **Product/PM:** owns sequencing, the consent-text sign-off loop (Content → Legal → version bump), and the **go/no-go on the first real send** (a gated decision after a seed-list test send + mail-tester pass).
- **QA/Release:** Vitest the subscribe/confirm/resubscribe/suppress state machine and the Svix-verify (Web Crypto) path against fixtures; a Wrangler local-D1 integration test for the route handlers; a manual deliverability checklist (DKIM/SPF pass, one-click unsub from Gmail + Apple Mail, dark-mode render). First send goes to a small internal seed list, not the live list.

---

## 5. Data model & API

**D1 DDL:** see the four `CREATE TABLE` blocks in §4 Backend (`newsletter_subscribers`, `subscriber_events`, `newsletter_issues`, `newsletter_deliveries`).

**R2 key conventions:** none new. Digest images reference **approved** business media via absolute public URLs on the production domain (`https://ondernemersvandekamp.nl/media/{r2_key}`) — never `/media` pending-gated keys (those require a session and 404 publicly).

**Route handlers (METHOD /path → request → response):**
- `POST /api/newsletter/subscribe` → `{ email, consent:true, source?, website? }` → `200 { ok:true }` (idempotent; bad email / missing consent / honeypot → still generic 200).
- `GET /api/newsletter/confirm?token` → `302 → /nieuwsbrief/bevestigd` (or `?fout=token`).
- `GET /api/newsletter/preferences?token` → `200` HTML. `POST` → `302 → ?opgeslagen=1`.
- `GET /api/newsletter/unsubscribe?token` → `302 → /nieuwsbrief/uitgeschreven`. `POST` (RFC 8058 one-click) → `200`.
- `POST /api/webhooks/resend` → Svix-signed body → `200` (401 if invalid).

**Server Actions:** `previewDigestAction(issueId)`, `approveAndSendDigestAction(issueId)` (admin-gated).

**Third-party calls + webhooks:**
- **Resend** `POST https://api.resend.com/emails` (confirm, welcome, transactional) and `POST https://api.resend.com/emails/batch` for digest batches, from `nieuwsbrief@mail.ondernemersvandekamp.nl`. Domain created in Resend's **EU data region** (residency is account/domain config, not a different host).
- **Resend webhooks** → `/api/webhooks/resend` for `email.bounced` / `email.complained` (suppression; bounce type read from payload) and optionally `email.delivered`/`opened`/`clicked` (analytics).
- **Meta:** no API; embeds via facade (click-to-load static thumbnail).

---

## 6. User flows & state machine

**Subscriber status machine:**
`(none) → pending` (subscribe) `→ confirmed` (confirm click) `→ unsubscribed` (unsub) `→ pending` (resubscribe → new confirm) `→ confirmed`.
Terminal/suppressed: `confirmed → bounced` (hard, or 3 consecutive softs) and `confirmed → complained` (spam report) — both suppressed; re-entry only via a fresh, deliberate opt-in + confirm.
Pruned: `pending` > 30 days → deleted (nightly cron).

**Issue status machine:** `draft` (cron) `→ approved` (admin) `→ sending` `→ sent`; `sending → failed` on fatal error (resumable — delivery ledger skips already-`sent`). Guard: no send unless `approved`; idempotent at both issue and per-recipient level.

**Edge cases / failures:**
- Confirm token expired/unknown → friendly error page, offer re-signup.
- Already-confirmed email subscribes → idempotent 200, no duplicate mail (anti-enumeration).
- Previously-unsubscribed email subscribes → resubscribe path (pending + new confirm), logged.
- Previously-bounced/complained email subscribes → requires explicit fresh confirm; never auto-resurrected onto the send list.
- Bounce on the confirm email → never reaches confirmed; pruned with `pending`.
- Webhook replay/forgery → Svix signature + timestamp tolerance reject.
- Resend outage mid-digest → batches retry/backoff; issue → `failed`; admin re-runs `approveAndSendDigestAction`, delivery ledger prevents double-send.
- Honeypot filled / rate-limit exceeded → drop silently (generic 200).
- Cron runs with no fresh content → skip month, log, optional admin nudge.
- Native Gmail/Apple "unsubscribe" → RFC 8058 POST handled without a page visit.

---

## 7. Third-party choices

| Option | EU residency / GDPR | Fit | Cost @ ~300–800 subs, 1 send/mo |
|---|---|---|---|
| **Self-host: Resend (EU send region) + D1** ✅ RECOMMENDED | EU **sending** region (Ireland) + DPA; but account data/metadata/logs are **US-stored under DPF+SCC** (record the US transfer in ROPA). Consent + suppression owned in **D1 (EU)**. D1/Workers already in stack. | Reuses `getResendConfig()`, settings, admin, cron, moderation patterns. We build list/segment/unsub/suppression + delivery ledger (moderate, well-scoped, Vitest-covered). | **€0** on Resend free tier (3k emails/mo, **100/day** — caps single-day sends; ledger spreads across days); ~**€18–20/mo** at the next paid tier as volume grows. No per-contact fee. Batch endpoint is **≤100 emails/request**. |
| **MailerLite (EU/Cyprus)** | EU company, GDPR-friendly, DPA, EU hosting. | Full ESP: forms, automations, segmentation UI, unsubscribe handled. Least engineering. But splits source-of-truth from D1 and adds a second consent store + DPA. | Free to 1,000 subs / 12k emails; ~€9–15/mo above. |
| **Brevo (Sendinblue, FR/EU)** | EU-based, strong GDPR posture, DPA. | Full ESP + transactional; could replace Resend for auth mail too. Heavier than needed; UI-centric. | Free to 300 emails/day (unlimited contacts); ~€7–18/mo for volume. |
| **Buttondown (US)** | **US-hosted** — transfer concerns (SCCs/DPF), weaker EU residency story. | Markdown-first, solo-writer oriented; poor fit for auto-assembled, data-driven digests + our EU constraint. | $9/mo+. |

**Recommendation: self-host on Resend (EU send region) + the D1 `newsletter_subscribers` table.** Rationale: (1) **single source of truth** — consent, suppression, delivery state in **D1 (EU)** next to everything else, simplifying GDPR erasure + audit; (2) **zero extra processor** beyond Resend (already in stack for auth) → fewer DPAs; (3) **cost** stays €0 → ~€18/mo — fits the lean budget; (4) the digest is **auto-assembled from our own structured data**, which a generic ESP can't do natively; (5) reuses in-stack patterns (settings, moderation, cron, admin). **Trade-offs accepted & documented:** (a) Resend stores recipient metadata/logs in the **US under DPF+SCC** — adequate but must be in the ROPA + privacy policy, and PII held in Resend is kept minimal (D1 durable, optionally per-recipient sends); (b) we build and Vitest the list/double-opt-in/suppression/delivery logic ourselves; (c) Resend's **100/day free cap** forces the multi-day resumable send (covered by the delivery ledger). **Documented exit / strict-EU fallback:** if the list outgrows the homegrown layer, the team wants a marketing UI, or strict EU-only storage becomes mandatory, migrate to **MailerLite EU** — the `locale`/`segments`/`status` schema maps cleanly.

> **Deliverability isolation:** the bulk subdomain (`mail.ondernemersvandekamp.nl`) and `resend_newsletter_from` are **separate** from the transactional/auth sender, so a newsletter reputation hit can't break magic-link logins.

---

## 8. Milestones & sequencing

1. **M0 — Sending domain + deliverability** (3–4 days). Create `mail.ondernemersvandekamp.nl` in Resend's EU region; SPF + DKIM CNAMEs; DMARC **`p=none` with `rua`** first → observe 1–2 weeks of aligned reports → ramp to `p=quarantine`; move off `resend.dev`; mail-tester ≥9/10. *Deliverable: a domain that inboxes, with monitored alignment.*
2. **M1 — Subscribers backend + double opt-in** (6–7 days). `0003_newsletter.sql` (4 tables); subscribe/confirm/preferences/unsubscribe handlers + Svix-verified webhook (Web Crypto); rate-limit + honeypot; Resend confirm/welcome; Vitest on the state machine + suppression + resubscribe. *Deliverable: a GDPR-correct opt-in API.*
3. **M2 — Signup UI + preference center + legal** (4–5 days). `<NewsletterForm>` + shared `<KampInput>`/`<KampCheckbox>`/`<Alert>`; `/nieuwsbrief*` pages; replace footer `mailto:`; publish privacy + cookie pages; consent text v1 signed off; ROPA updated. *Deliverable: visitors subscribe end-to-end, compliantly.* **← shippable "capture + opt-in" slice ends here.**
4. **M3 — Monthly digest automation** (6–7 days; **gated on the Agenda/events D1 backend**). Cron `assembleDigest()`; `/admin/nieuwsbrief` draft + sandboxed preview + approve; batched resumable send (delivery ledger) + suppression + RFC 8058 one-click; `/nieuwsbrief/[issue]` archive with `Article` schema; first send to internal seed list + go/no-go. *Deliverable: a one-click, crash-safe monthly send.*
5. **M4 — Connected socials + measurement + owner growth** (3–4 days). Fill `SITE.social` + Organization `sameAs` (external URLs only); brand icons; facade Instagram embed; `/links`; `/beheer` owner share-link + QR; analytics events + admin dashboard. *Deliverable: list-growth loop + visibility.*

(Run M0–M2 first — no Agenda dependency. M3 waits for the events backend; M4 can run in parallel with M3.)

---

## 9. Dependencies
- Production launch + Cloudflare hardening (Phase 4): real `database_id` (still `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc`), live domain, secrets set.
- DNS control on the domain for SPF/DKIM/DMARC CNAMEs/TXT.
- Cron Triggers enabled on the Worker (shared nightly-prune + monthly-digest `scheduled()` handler).
- **Agenda/events D1 backend** with real dated events — **hard blocker for M3** (today only a static `src/data/events.ts` array exists).
- Owner-stories strand (soft — digest degrades gracefully without it).
- Published privacy + cookie pages (currently `#` — hard blocker for any send).
- `SITE.social` URLs (unblocks Organization `sameAs`).
- `RESEND_WEBHOOK_SECRET` secret + `resend_newsletter_from` setting key.

---

## 10. Risks & mitigations
- **Deliverability/reputation contagion onto auth mail** → isolate the bulk subdomain + sender; DMARC ramp; double opt-in only; webhook suppression; keep complaint rate <0.1%.
- **Consent non-compliance (ACM/AP, Telecommunicatiewet)** → unchecked double opt-in; immutable, versioned consent audit; one-click unsubscribe; preference center; Resend DPA + EU region; published privacy/cookie pages before first send.
- **Volunteer overload kills cadence** → auto-assembled digest (review-not-author); auto-draft on the 1st; skip-month fallback; 5-business-day SLA.
- **Mid-send crash → double-send or partial list** → `newsletter_deliveries` ledger makes sends resumable + idempotent per recipient.
- **Self-host suppression/state bugs** → Vitest the state machine + suppression + Svix-verify; D1 is the single source of truth; always check suppression before send; documented MailerLite exit.
- **Meta embeds → cookie/CWV cost** → facade click-to-load; no SDK on load; lazy.
- **Cron UTC/DST drift** → documented (overnight assembly, morning review tolerates the 1-hour seasonal shift).
- **Node-API assumptions at the edge** → no SMTP, MJML compiled offline, Svix via Web Crypto — all verified under `nodejs_compat`.

---

## 11. Acceptance criteria / Definition of Done
- [ ] `mail.` subdomain verified in Resend EU region; SPF/DKIM pass; DMARC live (`p=none`→`rua` monitored→`p=quarantine`); mail-tester ≥9/10; bulk isolated from transactional sender.
- [ ] Double opt-in works: `pending`→`confirm`→`confirmed`; **no marketing email before confirm**; only one confirm request (no nag); `pending` pruned >30d.
- [ ] Consent text **version** + timestamp + **truncated** IP + source stored; immutable `subscriber_events` trail; ROPA updated.
- [ ] RFC 8058 one-click unsubscribe (header + footer GET link) works from Gmail + Apple Mail; honoured instantly; GET handler idempotent. **DKIM must cover the `List-Unsubscribe`/`List-Unsubscribe-Post` headers** or native one-click silently fails — verified from a real Gmail account at M0.
- [ ] Preference center reachable via token; segment changes persist + logged; never indexed/cached.
- [ ] Bounce/complaint webhook **Svix-verified via Web Crypto**; hard bounce + 3-soft + complaint suppress automatically; soft bounces don't suppress prematurely.
- [ ] `<NewsletterForm>` replaces the footer `mailto:`; works without JS; all states on-brand; WCAG AA (focus ring fixed to `--amber-ink`/white, labelled checkbox, `aria-live` errors).
- [ ] Monthly cron auto-creates a draft; admin previews (sandboxed iframe) + approves + sends; skips empty months.
- [ ] Digest send excludes all suppressed/unsubscribed; per-recipient `unsub_token`; **resumable + idempotent** via `newsletter_deliveries` (verified by killing mid-batch and re-running).
- [ ] `/nieuwsbrief/[issue]` archive published with `Article` schema + `datePublished`/`dateModified`; in sitemap; token URLs `noindex` + sitemap-excluded.
- [ ] `sameAs` contains only **external** profile URLs (no `/links`); `SITE.social` filled; brand-correct icons; facade Instagram embed loads no Meta cookie until click.
- [ ] Privacy + cookie pages live (no `#`); Resend DPA signed; EU region configured.
- [ ] Owner share-link + QR in `/beheer`; cookieless analytics events firing; admin newsletter dashboard live (aggregates only, no raw email lists).
- [ ] Rate-limit (WAF + in-app) + honeypot on subscribe; no email enumeration (idempotent 200 in all states).
- [ ] `purgeSubscriber(email)` erasure path implemented and tested; first real send is to an internal seed list with explicit PM go/no-go.

---

## 12. KPIs & success metrics
Confirmed subscribers (≥300 in 6mo / ≥800 in 12mo); confirm rate >55%; monthly net growth +8%; signup conversion by placement; digest open rate >40%; CTR >8%; unsubscribe <0.5%/send; complaint <0.1%; hard-bounce <2%; inbox-placement (mail-tester) ≥9/10; digest→`/agenda` & `/ondernemers` referral sessions; owner-attributed signup share.

---

## 13. Cost
**One-off:** engineering (5–7.5 weeks, in-house/volunteer); designer time for templates + QR poster; legal review of consent text + privacy/cookie pages (a few hours if templated).
**Monthly at this scale:** **€0** initially — Resend free tier (3k emails/mo) covers ~300–800 subs × 1 send. **~€18–20/mo** once volume passes the free tier (Resend 50k tier). Cloudflare D1/Workers/cron: **€0** (free tier). Cookieless analytics (self-hosted Umami €0 / Plausible ~€9/mo). **Total: €0 now, ~€20–30/mo at growth** — within the lean budget.

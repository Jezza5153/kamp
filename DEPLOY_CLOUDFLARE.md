# Deploy on Cloudflare

The site runs on **Cloudflare Workers** (via the OpenNext adapter) with **D1**
(database), **R2** (image storage) and magic-link auth. Public pages stay
SSG/ISR; the owner/admin portal runs server-side on the Worker.

## One-time setup (needs a Cloudflare account + `wrangler login`)

```bash
npm install
npx wrangler login

# 1. Database
npx wrangler d1 create kamp-db
#   → copy the printed database_id into wrangler.jsonc (d1_databases[0].database_id)
npm run db:migrate            # applies migrations/0001_init.sql to the remote D1

# 2. Storage buckets
npx wrangler r2 bucket create kamp-photos        # owner photo uploads
npx wrangler r2 bucket create kamp-next-cache    # Next.js ISR incremental cache

# 3. Secrets (production)
npx wrangler secret put AUTH_SECRET        # REQUIRED — long random string
# Optional — these can ALSO be set in-app at /admin/instellingen after first login:
npx wrangler secret put RESEND_API_KEY     # magic-link emails (else links log to the Worker)
npx wrangler secret put ADMIN_EMAILS       # e.g. info@ondernemersvandekamp.nl
```

**Bootstrap:** the **first account to log in** on an empty database is made admin
automatically — so you don't need `ADMIN_EMAILS` to get started. Log in, open
**/admin/instellingen**, and set the Resend API key + sender, the admin email(s),
and the site URL there (stored in D1, no redeploy needed). Env secrets act as
fallbacks/overrides. Until a Resend key is set, magic links print to the Worker
logs (`wrangler tail`) so you can still log in.

## Local development
```bash
cp .dev.vars.example .dev.vars   # fill in secrets
npm run db:migrate:local         # migrate the local D1
npm run preview:cf               # build with OpenNext + run on a local Worker
```

## Deploy
```bash
npm run deploy:cf                # builds + deploys the Worker
```
Then point the domain `ondernemersvandekamp.nl` at the Worker in the Cloudflare
dashboard (Workers → custom domain) and set the env region to EU for GDPR.

## Cache freshness (approved edits/photos)
Public pages are statically cached in R2. No tag cache is configured (OpenNext
defaults to a "dummy" tag cache), so `revalidatePath()` is a **no-op in
production** — approved owner edits surface via **ISR**: the public pages
(`/`, `/kaart`, `/ondernemers/[id]`, `/categorie/[slug]`) set
`export const revalidate = 300`, so changes appear within ~5 minutes.

For **instant** invalidation instead, wire the D1 tag cache:
1. In `open-next.config.ts` add `tagCache: d1NextTagCache` (import from
   `@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache`).
2. Add a `NEXT_TAG_CACHE_D1` D1 binding in `wrangler.jsonc` (can reuse `kamp-db`).
3. `opennextjs-cloudflare` populates the tag table during `deploy:cf`.
Then the `revalidatePath` calls already in `src/lib/overrides.ts` take effect and
you can lengthen/remove the `revalidate` windows.

## Photos (R2)
- One private bucket `kamp-photos` (binding `PHOTOS`). Owner uploads land
  pending; bytes are served only via the access-gated `/media/[...key]` route.
- Local dev auto-creates the bucket under `.wrangler/state`; for prod run the
  one-time `wrangler r2 bucket create kamp-photos` (already in setup above).
- **GDPR / retention (Phase 3, do before production):** there is no automated
  purge yet when a business is delisted or an owner is revoked. Rejected and
  superseded photos ARE deleted from R2 immediately, but a delisted business's
  approved media + its system `imageUrl` override must be purged by hand until a
  `purgeBusinessMedia(businessId)` admin action is added.

## Notes
- `npm run build` / `npm run dev` still work for normal Next.js development; the
  Cloudflare scripts (`*:cf`) are only needed to run/deploy on Workers.
- Data: `src/data/businesses.ts` stays the seed + fallback. Approved owner edits
  live in D1 and are merged in `src/lib/businessData.ts` (`getOverrides()` — wired
  in Phase 1). No business data is lost if the DB is empty.
- EU/GDPR: create the D1 + R2 resources in an EU jurisdiction and set the Worker
  placement/region accordingly.

## Backend Step 1 — already wired in code

These pieces of the Backend Master Plan's Step 1 are now in the repo (no Cloudflare
account needed to build/test them):

- **`migrations/0003_launch.sql`** — `rate_limit` table. Apply it with the others
  (`npm run db:migrate` / `:local`).
- **Rate limiting** — magic-link requests are throttled per email (5 / 15 min) in
  `src/lib/rateLimit.ts`, wired into `requestMagicLink`. Fails open if D1 is absent.
- **Instant invalidation** — `open-next.config.ts` now wires `d1NextTagCache` and
  `wrangler.jsonc` has the `NEXT_TAG_CACHE_D1` binding. **Paste the real D1 id into
  BOTH bindings.** `opennextjs-cloudflare deploy` populates the tag table; then the
  existing `revalidatePath`/`revalidateTag` calls take effect.
- **Deploy preflight** — `npm run deploy:cf` runs `scripts/preflight.mjs` first and
  aborts if a `REPLACE_WITH_` placeholder or a required binding is missing.
- **Tests + CI** — `npm test` (Vitest) covers the rate limiter, the maintenance
  prune, and an **owner-isolation security regression**. `.github/workflows/ci.yml`
  runs test + build on every PR (lint is non-blocking until pre-existing Next 16
  lint debt is cleared).

**Enable cron at deploy time (one verified flip):**

The cron worker is written at **`worker/index.ts`** (re-exports the OpenNext
`fetch` handler + adds a `scheduled()` nightly-maintenance job; self-contained, no
`@/` alias). It's **inactive by default** so the standard deploy can't break on an
unverified wrapper. To turn it on:
1. In `wrangler.jsonc` set `"main": "worker/index.ts"` (was `.open-next/worker.js`).
2. In `wrangler.jsonc` add `"triggers": { "crons": ["0 3 * * *"] }`.
3. `npm run preview:cf` — confirm the site still serves and the scheduled handler
   fires (check `wrangler tail`). Then `npm run deploy:cf`.

The nightly job prunes expired tokens/sessions/rate-limit windows, stale unconfirmed
leads, expired invites, unconfirmed newsletter sign-ups, and analytics >35 days.

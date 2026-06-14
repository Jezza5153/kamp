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
npx wrangler secret put AUTH_SECRET        # long random string
npx wrangler secret put RESEND_API_KEY     # for magic-link emails (or use MailChannels)
npx wrangler secret put ADMIN_EMAILS       # e.g. info@ondernemersvandekamp.nl
```

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

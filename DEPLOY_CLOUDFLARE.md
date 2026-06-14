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

## Notes
- `npm run build` / `npm run dev` still work for normal Next.js development; the
  Cloudflare scripts (`*:cf`) are only needed to run/deploy on Workers.
- Data: `src/data/businesses.ts` stays the seed + fallback. Approved owner edits
  live in D1 and are merged in `src/lib/businessData.ts` (`getOverrides()` — wired
  in Phase 1). No business data is lost if the DB is empty.
- EU/GDPR: create the D1 + R2 resources in an EU jurisdiction and set the Worker
  placement/region accordingly.

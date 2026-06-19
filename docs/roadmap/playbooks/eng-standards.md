# Engineering Standards & Delivery Playbook

> **Scope:** How engineering works across *every* epic on the Ondernemers van de Kamp stack —
> **Next.js 16 (App Router) + React 19 + Tailwind v4** on **Cloudflare Workers via `@opennextjs/cloudflare`**, with **D1** (SQLite), **R2** (photos + ISR cache), magic-link auth, and **Wrangler** for deploy.
> This is the cross-cutting playbook. Feature playbooks (cadeaukaart, google-reviews, agenda, …) inherit *all* of it and only add feature-specific detail.
> **ID:** `eng-standards` · **Owner:** Engineering (Backend/Infra) + Engineering (Frontend) · **Status:** authoritative.

---

## 0. Why this exists (and the 3 non-negotiables)

1. **Never break the public SEO/GEO/AEO surface.** The site already ships entity-rich JSON-LD on every route, a data-driven `llms.txt`, image sitemap, and AI-crawler permissioning. A regression here is a P1 — AI citations and local-pack ranking are the product. Every PR that touches `src/lib/schema.ts`, `src/lib/site.ts`, `sitemap.ts`, `robots.ts`, `layout.tsx`, or any `generateMetadata` **must** pass the SEO checklist in §11.
2. **The seed is the source of truth; D1 is the approved delta.** `src/data/businesses.ts` (~67 businesses) is permanent. D1 stores only approved overrides merged at runtime in `src/lib/businessData.ts`. Build must stay **hermetically seed-only** (the `NEXT_PHASE=phase-production-build` guard in `getOverrides()`). Do not add D1 reads to the build path.
3. **It runs at the edge.** No Node-only APIs in request paths. No `fs`, no native `crypto` requiring Node, no `Buffer`-assuming libraries unless polyfilled by `nodejs_compat`. Use Web APIs (`crypto.subtle`, `fetch`, `Request`/`Response`, `ReadableStream`).

---

## 1. Next.js 16 conventions to respect

> ⚠️ **Read `AGENTS.md` first.** It says verbatim: *"This is NOT the Next.js you know … Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."* This is mandatory for every engineer and every AI agent. Next.js 16 has breaking changes from training-data-era Next.js (params/searchParams are async, caching defaults changed, route handler signatures differ).

| Rule | Why | Concrete |
|---|---|---|
| **Server Components by default** | Less JS to the edge, better LCP | Only add `"use client"` when you need state/effects/event handlers (`OpenBadge`, `BusinessExplorer`, `DistrictMap`). |
| **`params`/`searchParams` are Promises** | Next 16 async dynamic APIs | `export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; }` |
| **Route handlers are Web `Request`/`Response`** | Edge runtime | `export async function GET(req: Request) { return new Response(...) }`. See `src/app/auth/callback/route.ts`, `src/app/media/[...key]/route.ts`. |
| **Mutations go through Server Actions, not bespoke API routes** | Matches existing pattern | `submitEdit`, `uploadPhoto` (`beheer/actions.ts`); `approve`, `reject`, `purgeBusinessData` (`admin/actions.ts`). New mutating features follow this. |
| **`force-dynamic` only where required** | Auth/serving must not cache | `/auth/callback`, `/logout`, `/media/[...key]` are dynamic. Everything public is ISR. |
| **ISR via `export const revalidate = 300`** | 5-min freshness window | Public data pages already set this. Keep it — it is currently the *only* invalidation mechanism (see §6). |
| **No Node-only APIs at the edge** | Workers runtime | Use `crypto.randomUUID()`, `crypto.getRandomValues()`, `crypto.subtle`. `nodejs_compat` is on but treat it as a fallback, not a license to import Node libs. |
| **Body-size limit is raised to 6 MB** | Photo uploads (5 MB + multipart) | `next.config.ts → experimental.serverActions.bodySizeLimit`. Don't lower it; don't raise it without infra sign-off. |
| **Bindings in dev via `initOpenNextCloudflareForDev()`** | D1/R2 in `next dev` | Already wired in `next.config.ts`. Access via `getCloudflareContext()` (`src/lib/cf.ts`), never `process.env` for bindings. |

**Anti-patterns (reject in review):** importing `fs`/`path` in a request path; reading `process.env.DB` (it's a binding, use `getCloudflareContext().env.DB`); adding `getOverrides()`-style D1 reads without the `NEXT_PHASE` build guard; client components that fetch data that a server component could pass as props.

---

## 2. Git & branching

**Current reality:** `main` is the default and only protected branch. Two stale remote branches exist — `origin/roadmap-cadeaukaart-agenda` and `origin/ux-ui-upgrade`. **Action:** evaluate, cherry-pick anything live, then delete both. Do not branch new work off them.

### Branch model (trunk-based, short-lived)
- Branch from `main`. Name: `<epic>/<short-slug>` — e.g. `google-reviews/place-id-migration`, `cadeaukaart/mollie-webhook`, `design-system/type-tokens`.
- Keep branches < 3 days / < ~400 lines diff where possible. Rebase on `main` before opening the PR.
- One epic = one prefix. Map prefixes to the roadmap epics: `launch`, `cadeaukaart`, `google-reviews`, `agenda`, `owner-story`, `newsletter`, `bilingual`, `design-system`, `analytics`, `owner-ops`, `discovery`.

### Commit messages (Conventional Commits)
```
feat(google-reviews): add place_id to Business model + 0003 migration
fix(media): delete superseded R2 object before inserting new pending row
chore(ci): add typecheck job to GitHub Actions
docs(playbook): eng-standards v1
```
Types: `feat | fix | chore | docs | refactor | test | perf | ci | revert`. Scope = epic or subsystem (`auth`, `media`, `schema`, `d1`).

### Protected `main` rules (configure in GitHub once CI exists)
- Require PR + 1 approval + green CI (build, lint, typecheck, test).
- Linear history (squash-merge). No direct pushes to `main`.
- Migrations: a PR adding a migration requires a second reviewer who is on Backend/Infra.

---

## 3. Environments

Three environments, three secret stores. **Never** put secrets in `wrangler.jsonc` `vars`.

| Env | How to run | Bindings source | Secrets source | Data |
|---|---|---|---|---|
| **Local** | `npm run dev` (Next dev + CF bindings) or `npm run preview:cf` (full Worker) | `wrangler.jsonc` + `initOpenNextCloudflareForDev()` | `.dev.vars` (gitignored) | local D1 (`--local`), local R2 |
| **Preview** | `npm run preview:cf` against a preview/staging Worker, or a per-PR `wrangler versions upload` | `wrangler.jsonc` | `wrangler secret put` on the preview Worker | a **separate** preview D1 + R2 buckets |
| **Production** | `npm run deploy:cf` (from CI on `main`) | `wrangler.jsonc` | `wrangler secret put` on the prod Worker | prod D1 (`kamp-db`) + `kamp-photos` / `kamp-next-cache` |

### Local setup (one-time)
```bash
npm install
npx wrangler login
cp .dev.vars.example .dev.vars   # then fill AUTH_SECRET / RESEND_API_KEY / ADMIN_EMAILS
npm run db:migrate:local          # apply migrations to LOCAL D1
npm run dev                        # http://localhost:3000
```
First account to log in on an empty DB becomes admin (`ensureProfile` bootstrap) — no pre-seeding needed.

### Secrets matrix
| Secret | Local (`.dev.vars`) | Preview/Prod (`wrangler secret put`) | In-app override (`/admin/instellingen` → D1 `app_settings`) | Notes |
|---|---|---|---|---|
| `AUTH_SECRET` | yes | yes | no | Reserved for HMAC; **not yet consumed** in `auth.ts` (sessions are opaque D1 lookups). Set it anyway — required by deploy doc. |
| `RESEND_API_KEY` | optional | optional | **yes** (preferred) | If absent, magic links log to the Worker console. EU-resident transactional email. |
| `ADMIN_EMAILS` | yes | yes | **yes** | Comma-separated. Also overridable in-app. |

**Rule:** runtime-tunable config (Resend key/sender, admin emails, site URL) lives in D1 `app_settings` and is changed at `/admin/instellingen` — **no redeploy** for those. Worker secrets are the fallback. Document any new secret in `.dev.vars.example` *and* `DEPLOY_CLOUDFLARE.md` in the same PR.

### Before production exists — the launch blocker
`wrangler.jsonc` still has `"database_id": "REPLACE_WITH_D1_DATABASE_ID"`. The app has **never been deployed**. First unblocking step (epic: `launch`):
```bash
npx wrangler d1 create kamp-db          # paste id into wrangler.jsonc
npx wrangler r2 bucket create kamp-photos
npx wrangler r2 bucket create kamp-next-cache
npm run db:migrate                       # --remote
npx wrangler secret put AUTH_SECRET
npm run deploy:cf
```

---

## 4. CI/CD (GitHub Actions)

**Current reality:** there is **no `.github/workflows/` and no test script.** Building this is an early `launch` deliverable. Target pipeline:

### `ci.yml` — runs on every PR and push to `main`
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint          # eslint (next core-web-vitals + ts)
      - run: npx tsc --noEmit      # typecheck (add as `npm run typecheck`)
      - run: npm test --if-present # vitest (see §9) — once it exists
      - run: npm run build         # next build — must stay seed-only (NEXT_PHASE guard)
```
> The `build` step proves the hermetic-seed contract: it must succeed **without** D1 access. If a change makes `build` hit D1, CI catches it.

### `deploy.yml` — runs on push to `main` only (after `verify` passes)
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    needs: []                       # gate on the CI workflow via required checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - name: Apply D1 migrations (remote)
        run: npx wrangler d1 migrations apply kamp-db --remote
        env: { CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}, CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }} }
      - name: Build + deploy (OpenNext → Workers)
        run: npm run deploy:cf
        env: { CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}, CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }} }
```
**CI secrets (GitHub repo settings):** `CLOUDFLARE_API_TOKEN` (scoped: Workers Scripts edit, D1 edit, R2 edit), `CLOUDFLARE_ACCOUNT_ID`. App secrets (`AUTH_SECRET`, etc.) stay on the Worker via `wrangler secret put`, **not** in GitHub.

**Migration-before-deploy ordering is mandatory:** apply D1 migrations *before* the new Worker code that depends on them goes live. Migrations must be additive/backward-compatible (§5) so the old Worker keeps working during the brief window.

---

## 5. D1 migrations discipline

Migrations live in `migrations/` (`0001_init.sql`, `0002_settings.sql`). Wrangler applies them in order and tracks state in `d1_migrations`.

### Rules
- **One concern per migration.** New table or column = new file. Name: `000N_<concept>.sql` (e.g. `0003_place_id.sql`, `0004_events.sql`, `0005_subscribers.sql`).
- **Additive & backward-compatible.** `ADD COLUMN` with a default, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX`. **No** destructive `DROP`/rename in a migration that ships alongside running old code. SQLite has limited `ALTER` — plan column changes as add-new + backfill + (later) stop-writing-old.
- **Index every foreign-keyish lookup.** Existing pattern: `idx_sessions_profile`, `idx_overrides_business(business_id, status)`, `idx_media_business(business_id, status)`. New tables follow suit.
- **Cascade for GDPR.** Anything tied to a person/business must `ON DELETE CASCADE` from `profiles` or be purged explicitly in `src/lib/gdpr.ts`. GDPR erase must stay one-DELETE-cascades-cleanly.
- **Test locally first:** `npm run db:migrate:local`, exercise the feature, then ship. CI applies `--remote` on deploy.
- **No raw SQL in app code for schema.** All DDL is a migration. App code only does DML.

### Example — adding `place_id` (epic: `google-reviews`)
```sql
-- migrations/0003_place_id.sql
-- place_id is the ONE Places API field exempt from caching restrictions; safe to store.
ALTER TABLE business_overrides ADD COLUMN /* n/a — place_id lives in seed + a settings-style row */;
-- Preferred: a dedicated table keyed by seed business_id (no FK to seed, matches owner_business pattern)
CREATE TABLE IF NOT EXISTS business_gbp (
  business_id TEXT PRIMARY KEY,
  place_id    TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);
```
> Do **not** persist Places API review content. Only `place_id` is exempt. Reviews are fetched at request time (owner-OAuth GBP API for own listings) — see the `google-reviews` playbook.

### Migration review checklist
- [ ] Additive only (no destructive change to live columns)
- [ ] Indexes added for new lookups
- [ ] GDPR cascade / purge path covered
- [ ] Backfill plan for existing rows (if a new NOT NULL)
- [ ] Applied & exercised on local D1
- [ ] Rollback noted in PR (forward-fix preferred; SQLite has no auto down-migration)

---

## 6. Caching, ISR & the tag-cache gap

**Known issue:** `open-next.config.ts` has **no `tagCache`** → defaults to the dummy no-op. So `revalidatePath()`/`revalidateTag()` in `overrides.ts`, `media.ts`, `gdpr.ts` are **no-ops in production**. Approved edits/photos surface only when the `revalidate = 300` ISR window expires (≤5 min).

**Standard:**
- Until fixed, **do not promise instant invalidation** in any feature. Document the ≤5-min window in owner-facing copy.
- **Fix (epic: `launch` or `discovery`):** add `@opennextjs/cloudflare`'s `d1-next-tag-cache` override in `open-next.config.ts` + a second D1 binding `NEXT_TAG_CACHE_D1` in `wrangler.jsonc`. After that, on-demand `revalidateTag`/`revalidatePath` work — wire approval Server Actions to invalidate precise tags.
- ISR cache persists in R2 (`kamp-next-cache`). Don't add a parallel caching layer.
- Image serving: no CDN transform layer yet (Cloudflare Images/imgix). Images come straight from the Worker at original resolution. If a feature needs derivatives, propose Cloudflare Images in an ADR, don't hand-roll.

---

## 7. TypeScript strictness

`tsconfig.json` has `"strict": true`, `isolatedModules`, `moduleResolution: bundler`, path alias `@/*`. Keep it.

**Standards**
- **`strict` stays on.** No loosening compiler flags to make a PR pass.
- **No `any`.** Use `unknown` + narrowing, or a real type. `as` casts need a one-line comment justifying them (magic-byte sniffing, D1 row shape).
- **Type D1 rows explicitly.** `.first<T>()` / `.all<T>()` with a declared row interface — never trust `Record<string, unknown>` implicitly.
- **`Business` type is the contract.** New fields (e.g. `placeId`, `lang`) are added to the `Business` type *and* the seed *and* the merge in `businessData.ts` in one change. Optional (`?`) unless every seed row has it.
- **`npx tsc --noEmit` must be clean** locally before pushing — `next build` does its own typecheck but CI runs `tsc` explicitly so type-only errors fail fast.
- **`cf-typegen`:** after changing bindings in `wrangler.jsonc`, run `npm run cf-typegen` to regenerate `cloudflare-env.d.ts` (gitignored) so `getCloudflareContext().env` is typed.

---

## 8. Dependency policy

Lean, edge-safe, EU-conscious.

| Rule | Detail |
|---|---|
| **Edge-compatible only** | Must run on Workers (Web APIs, no Node-only core). Check the package before adding. |
| **EU/GDPR data residency** | Any service that processes personal data must offer EU residency. Approved: **Resend** (transactional email, EU region), **Mollie** (iDEAL payments, Amsterdam HQ), **Google Business Profile API** (owner OAuth, own-listing reviews). Avoid US-only processors for PII. |
| **Justify every new dep** | PR description states why a built-in/Web API won't do. Prefer zero-dep. The current tree is deliberately small (`next`, `react`, `framer-motion`, `lucide-react`, `maplibre-gl`, `@opennextjs/cloudflare`). |
| **Pin & lockfile** | `package-lock.json` committed; CI uses `npm ci`. No floating installs in CI. |
| **No client-bloat** | Heavy libs (e.g. maplibre) load via dynamic `import()` in client components only (see `DistrictMap.tsx`). Never ship them to SSR/edge bundles. |
| **Security** | Run `npm audit` in CI advisory mode; triage high/critical before merge. |

New runtime service decisions (Mollie, GBP, Resend Audiences, i18n lib) get a short ADR in `docs/roadmap/` capturing EU residency, pricing, and the edge-fetch integration shape.

---

## 9. Testing

**Current reality:** no tests, no test runner. Add **Vitest** (fast, edge-friendly) for the lib layer; add **Playwright** for a thin e2e smoke against local Wrangler. This is a `launch` deliverable and a Definition-of-Done gate for new backend logic.

### What to test (priority order)
1. **`src/lib/businessData.ts` merge** — approved-override spread-merge ordering (oldest→newest, newest field wins), seed fallback on D1 error, build-guard returns `{}`.
2. **`src/lib/auth.ts`** — token single-use flip, 15-min TTL expiry, session expiry check, `ensureProfile` admin bootstrap (first login) + `ADMIN_EMAILS` promotion.
3. **`src/lib/media.ts`** — magic-byte MIME sniffing (accept JPEG/PNG/WebP/AVIF, reject spoofed), 5 MB cap, supersede logic.
4. **`src/lib/schema.ts`** — JSON-LD shape: `aggregateRating` is **never** emitted; `@id`s stable; required fields present (regression guard for the SEO contract).
5. **GDPR purge order** — R2 objects deleted before D1 rows; cascade leaves no orphans.

### Setup sketch
```jsonc
// package.json scripts to add
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```
- Unit: Vitest with mocked D1 (`drizzle`-style fake or `better-sqlite3` in-memory) or `wrangler dev`'s local D1 for integration.
- E2e smoke (Playwright): home renders, a business detail page renders with JSON-LD present, `/login` POST is rate-aware, `/llms.txt` returns data. Run against `npm run preview:cf` in CI nightly (not per-PR if too slow).

**Definition of "tested":** new lib-layer logic ships with unit tests; new public route ships with at least a render + JSON-LD smoke assertion.

---

## 10. Code review & Definition of Done

### PR requirements
- [ ] Branch named `<epic>/<slug>`, rebased on `main`.
- [ ] Conventional-commit title; description states the *what* and *why*, names the epic.
- [ ] CI green: lint + typecheck + test + **build (seed-only)**.
- [ ] 1 approval (2 if it includes a D1 migration; second is Backend/Infra).
- [ ] No secrets committed; `.dev.vars.example` + `DEPLOY_CLOUDFLARE.md` updated for any new secret/binding.
- [ ] Screenshots/Looms for any user-facing UI (public, `/beheer`, `/admin`).

### Definition of Done (every story)
- [ ] Works in `npm run dev` **and** `npm run preview:cf` (real Worker runtime, not just Next dev).
- [ ] No Node-only API in any request path; verified runs at edge.
- [ ] D1 changes are a migration, additive, indexed, GDPR-cascade-safe, applied locally.
- [ ] **SEO contract intact** (§11) — JSON-LD, metadata, sitemap, `llms.txt`, `robots` unbroken; `aggregateRating` still absent.
- [ ] `dateModified`/`updatedAt` freshness signal updated where content changed (AEO freshness — 2026 guideline).
- [ ] Accessibility not regressed (focus-visible, `lang`, reduced-motion, AA contrast).
- [ ] Tests added for new lib logic; smoke for new routes.
- [ ] Docs updated: README/DEPLOY/playbook if behavior or ops changed.
- [ ] Owner-facing copy reflects the real ≤5-min ISR window (no false "instant").

### Reviewer focus by subsystem
| Touches | Reviewer must check |
|---|---|
| `schema.ts` / metadata / `sitemap.ts` / `robots.ts` | §11 SEO checklist; no fabricated ratings; `@id` stability |
| `auth.ts` / `/login` / `/auth/callback` | single-use tokens, TTLs, no rate-limit regression, no PII in logs |
| `media.ts` / `/media/[...key]` | MIME sniff, 5 MB cap, R2 supersede/cleanup, pending-access gate |
| migrations | §5 checklist |
| Server Actions | auth (`requireUser`/`requireAdmin`/`canEdit`), input validation, body-size |

---

## 11. SEO / GEO / AEO engineering checklist (2026 guidelines)

Any PR touching public pages, content, or data runs this:

- [ ] **JSON-LD intact** — `@graph` emits the right types for the route (see schema-by-route table in current-state). No `aggregateRating`/`review` on business/Org pages (self-serving-review rule — not eligible for star snippets; surface reviews for trust/AEO only, with Google link-back + logo when no map present).
- [ ] **Entity-first** — new entities (events, articles, district) get `@id`, `sameAs`, and link into the existing graph (founder ↔ business, story author ↔ Person `@id`).
- [ ] **Freshness signal** — content changes bump `updatedAt`/`dateModified`. ~83% of AI citations are pages updated <12 months; >60% <6 months. Approved owner edits must update `updatedAt`; add `dateModified` to on-page JSON-LD where missing.
- [ ] **Answer-first chunks** — new FAQ/answer copy is a 40–60-word extractable direct answer, matching visible Q&A exactly (schema must match page).
- [ ] **AI crawlers** — don't break `robots.ts` allow-list (GPTBot, PerplexityBot, Google-Extended, ClaudeBot, etc.) or the sitemap/`llms.txt`.
- [ ] **NAP single-source** — address/phone come from `src/lib/site.ts` (site) / seed (per-business). No hardcoded NAP elsewhere.
- [ ] **hreflang** (when `bilingual` ships) — `metadata.alternates.languages` with `nl`, `en`, `x-default`; `<html lang>` set.
- [ ] **`llms.txt`** stays data-driven; add sections for new content types (events, stories) when they ship.

---

## 12. Observability & performance budgets

`wrangler.jsonc` has `"observability": { "enabled": true }` — Workers logs/analytics are on. Use them.

**Observability standards**
- **Structured logs, no PII.** Never log email, token, or session id. Log event + business_id + outcome. (Existing magic-link fallback logs the link to console only when no Resend key — acceptable in dev, must be off-path in prod once Resend is configured.)
- **Tail in incidents:** `npx wrangler tail ondernemers-van-de-kamp`.
- **No third-party APM** unless EU-resident and ADR-approved. Cloudflare Workers Analytics + (future) a privacy-first analytics for the public site (epic: `analytics`) — EU-resident, cookieless preferred.
- **Error budget:** Server Actions and route handlers catch-wrap and degrade gracefully (the merge already falls back to seed silently). User-facing failures return a friendly state, not a stack trace.

**Performance budgets (public pages)**
| Metric | Budget |
|---|---|
| LCP (mobile, 4G) | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| Edge TTFB | < 200 ms (ISR hit from R2 cache) |
| Client JS per public route | keep maplibre/framer dynamically imported; no new heavy SSR deps |

Verify with Lighthouse/PageSpeed on a preview deploy before merging perf-sensitive changes. Keep `eslint-config-next/core-web-vitals` rules green (already enforced by `npm run lint`).

---

## 13. Operational hygiene (cron, rate-limit, lifecycle) — cross-epic

These are unowned gaps that any epic touching them must address per these standards:

- **Cron pruning (epic: `launch`/`owner-ops`):** expired `auth_tokens` and `sessions` accumulate forever. Add a Cloudflare Cron Trigger (scheduled `export` in the Worker) to prune nightly. Zero cost.
- **Auth rate-limiting (epic: `launch`/`owner-ops`):** `/login` POST and `/auth/callback` are open to brute-force/token-enumeration. Add a Cloudflare WAF rate-limit rule (e.g. 5 req/min/IP on `/login`) — zero-code. Don't ship an owner-facing auth feature without it.
- **R2 lifecycle:** `rejected`/`superseded` objects are only cleaned synchronously. Add an R2 lifecycle policy or include cleanup in the cron job.
- **AUTH_SECRET hazard:** declared in `KampEnv` + deploy doc but **not consumed** in `auth.ts` (sessions are opaque D1 lookups). Either wire HMAC or document it as reserved — don't let reviewers assume cookies are signed.

---

## 14. Applies to which epics

Every epic inherits this playbook. Specific hooks:

| Epic | What this playbook governs for it |
|---|---|
| **launch** | First D1 create + `database_id` paste; CI/CD build-out; cron pruning; WAF rate-limit; tag-cache fix; secrets matrix on prod Worker. **The unblocking epic.** |
| **cadeaukaart** | Mollie (EU, iDEAL) via edge `fetch`; webhook = Server Action/route handler; gift-card + redemption tables as migrations; no Node SDK. |
| **google-reviews** | `place_id` migration (only-exempt field); GBP owner-OAuth at edge; **no Places API caching**; reviews for trust/AEO only (no `aggregateRating` snippet markup); Google link-back + logo. |
| **agenda** | Events D1 table + CRUD via Server Actions/moderation pattern; move `eventSchema()` to `schema.ts`; `llms.txt` Evenementen section; cron expiry. |
| **owner-story** | Article/Person JSON-LD; `datePublished`/`dateModified` freshness; entity linking to founder; AEO answer chunks. |
| **newsletter** | `subscribers` table + double-opt-in; Resend Audiences (EU); GDPR consent + unsubscribe token; no mailto. |
| **bilingual** | hreflang + `[locale]` routing; `<html lang>`; translation namespaces; no URL migration later. |
| **design-system** | Type/spacing tokens in `globals.css`; shared form components; portal/admin brand uplift; A11y budgets; no perf regression. |
| **analytics** | EU-resident, cookieless analytics; Workers observability; no PII in logs; consent compliance. |
| **owner-ops** | Self-service owner request flow; moderation UX; rate-limit; cron hygiene. |
| **discovery** | Search/filter + MapLibre upgrade; dynamic imports; ISR/tag-cache correctness; perf budgets. |

---

## 15. Quick-reference commands

```bash
# Dev
npm run dev                       # Next dev + CF bindings
npm run preview:cf                # full OpenNext Worker locally (use before "Done")
npm run lint                      # eslint
npx tsc --noEmit                  # typecheck

# D1
npm run db:migrate:local          # apply migrations to local D1
npm run db:migrate                # apply to remote (prod) D1
npx wrangler d1 execute kamp-db --local --command "SELECT * FROM profiles"

# Cloudflare
npm run cf-typegen                # regen cloudflare-env.d.ts after binding changes
npx wrangler tail ondernemers-van-de-kamp   # live logs
npx wrangler secret put AUTH_SECRET          # set a prod secret
npm run deploy:cf                 # build (OpenNext) + deploy to Workers
```

---

*Playbook `eng-standards` v1 — the standards every epic follows. If a feature needs to deviate, write an ADR in `docs/roadmap/` and get Backend/Infra sign-off; don't silently break the contract.*

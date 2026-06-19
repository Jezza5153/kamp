# QA & Release Management Playbook

> **Scope:** How changes ship *safely* on Cloudflare Workers for Ondernemers van de Kamp —
> **Next.js 16 (App Router) + React 19 + Tailwind v4** on **`@opennextjs/cloudflare`**, with **D1** (SQLite), **R2** (photos + ISR cache), magic-link auth, Wrangler deploy.
> This is the cross-cutting QA + Release playbook. Every epic inherits it. Engineering owns implementation; QA owns the gates. It is a contract the two share.
> **ID:** `qa-release` · **Owners:** QA/Release + Engineering (Backend/Infra) · **Status:** authoritative.
> **Relationship to `eng-standards`:** `eng-standards.md` §9 (Testing) and §4 (CI/CD) are the *summary*; this playbook is the *authoritative deep-dive*. Where they overlap, this document wins on test/release detail and `eng-standards` wins on coding conventions.

---

## 0. The five non-negotiables

1. **No release without a green security regression suite.** The MUST-HAVE proof: an owner can **never** edit another business and can **never** read another business's *pending* private media. This is a P0 gate — a red security test blocks deploy, full stop. (§4)
2. **The build proves the hermetic-seed contract.** `next build` runs with `NEXT_PHASE=phase-production-build`, so `getOverrides()` returns `{}` and the build never touches D1. If a change makes the build read D1, CI catches it and the release is blocked. (§7)
3. **Migrations are forward-only and additive.** No `DROP COLUMN`, no destructive `ALTER` on a table holding live owner data without a documented expand→migrate→contract plan. D1 has no transactional DDL rollback at the platform level — a bad migration is a manual recovery. (§8.2)
4. **Every public-route change passes the SEO/AEO regression checks.** JSON-LD, `llms.txt`, sitemap, robots, and metadata are the product. A regression there is a P1. (§6.3)
5. **Rollback is rehearsed, not improvised.** Worker version rollback + a known-safe D1 state are documented per release before go-live, not discovered during the incident. (§10)

---

## 1. Test strategy & the pyramid

We run a classic pyramid, weighted toward fast `lib/`-layer unit tests because that is where the correctness-critical pure logic lives (hours, geo, overrides merge, MIME sniffing). Integration tests cover the D1 + route-handler seam. A thin, high-value e2e layer covers the irreversible business flows (publish, payment, review-connect). On top sits a non-functional layer (a11y, performance, security) that gates release.

```
            ╱ e2e (Playwright)  ── owner-edit→moderate→publish, gift-card, review-connect
          ╱   ~8–15 specs, runs against local Wrangler / preview:cf
        ╱ integration (Vitest + workers pool / local D1)
      ╱     route handlers, Server Actions, D1 reads/writes, webhooks
    ╱ unit (Vitest, no I/O)
  ╱       hours.ts, geo.ts, overrides merge, media MIME sniff, settings fallback
 ╱_______________________________________________________________________
  non-functional gates (cross-cutting): axe a11y · Lighthouse CWV · SECURITY REGRESSION
```

| Layer | Runner | Targets in *this* repo | Speed / where | Blocking? |
|---|---|---|---|---|
| **Unit** | Vitest (node env) | `src/lib/hours.ts`, `geo.ts`, `overrides.ts` (merge math), `media.ts` (MIME sniff), `settings.ts` (fallback), `related.ts` (`buildFaqs`), `schema.ts` (node shape) | <2 s, every PR | **Yes** |
| **Integration** | Vitest + `@cloudflare/vitest-pool-workers` **or** Vitest against `wrangler dev --local` D1 | Server Actions (`submitEdit`, `uploadPhoto`, `approve`, `reject`, `approvePhoto`, `purgeBusinessData`), `/media/[...key]`, `/auth/callback`, `/llms.txt`, Mollie webhook, GBP OAuth callback | 10–40 s, every PR | **Yes** |
| **e2e** | Playwright against `npm run preview:cf` (real Worker) | owner-edit→moderate→publish; gift-card buy→webhook→issue→redeem; review-connect OAuth; magic-link login | 1–4 min, smoke every PR + nightly full | **Yes** (smoke) |
| **Security regression** | Vitest integration + Playwright, tagged `@security` | cross-tenant edit denial, cross-tenant pending-media 404, role escalation, token reuse, rate-limit | inside integration+e2e | **Yes — P0** |
| **Accessibility** | `@axe-core/playwright` | home, business detail, `/beheer`, `/admin`, `/aanmelden`, newsletter, gift-card | nightly + UI PRs | **Yes** on UI PRs |
| **Performance / CWV** | Lighthouse CI (`@lhci/cli`) | home, a business detail, category page | nightly + perf PRs | Advisory→blocking on `launch` |

### 1.1 Coverage policy (pragmatic, not vanity)
- **`src/lib/` pure logic: 90%+ line coverage required.** A wrong "open now" badge or wrong override merge is user-visible on every page.
- **Route handlers / Server Actions: every auth branch and every error branch must have one test.** Branch coverage of security/failure paths, not a global line %.
- **No coverage target on React components** (covered by e2e + axe). Don't snapshot-test Framer Motion markup.

---

## 2. Tooling decisions (named, with rationale)

| Concern | Tool | Why this one (EU/edge/budget fit) |
|---|---|---|
| Unit + integration runner | **Vitest** | Fast, ESM-native, matches Next 16 / Vite tooling; `eng-standards` already names it. |
| Worker-runtime integration | **`@cloudflare/vitest-pool-workers`** | Runs tests *inside* `workerd` (the real Workers runtime) with real D1/R2 bindings from `wrangler.jsonc` — highest fidelity without deploying. |
| e2e | **Playwright** | Trace viewer, parallel, `@axe-core/playwright`; runs against the real Worker (`preview:cf`). |
| Accessibility | **`@axe-core/playwright`** | Automated WCAG 2.1 AA inside the e2e run; complements the design-system manual a11y review. |
| Performance | **`@lhci/cli`** (Lighthouse CI) | Free, CI-friendly, asserts CWV budgets (LCP/INP/CLS); results stored as build artifacts. |
| Mollie webhook testing | **Mollie Sandbox** + signature/replay tests | EU-resident (Amsterdam), free sandbox, deterministic test amounts. (§5) |
| Real-Worker manual smoke | **`npm run preview:cf`** | Only way to test the real Worker runtime locally (R2 streaming quirks, `getCloudflareContext`). |
| Synthetic uptime | **Cloudflare Health Checks** or free **UptimeRobot** (EU) | Lean budget; alerts to email/Slack. (§11) |
| Error tracking | **Cloudflare Workers Logs + Logpush**, optionally **Sentry (EU `de.sentry.io`)** | Native first; Sentry EU only if volume justifies cost. (§11) |

**Add to `package.json` scripts (a `launch` deliverable):**

```jsonc
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run src/lib",
    "test:integration": "vitest run --config vitest.workers.config.ts",
    "test:security": "vitest run -t @security && playwright test --grep @security",
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test --grep @smoke",
    "test:a11y": "playwright test --grep @a11y",
    "lhci": "lhci autorun"
  }
}
```

---

## 3. Unit tests — concrete examples (lib layer)

Pure-logic modules; **no D1, no network**. Mock `new Date()` with Vitest fake timers because all "now" math is anchored to `Europe/Amsterdam` (`hours.ts → nowInAmsterdam`).

### 3.1 `hours.ts` — "open now" is the highest-traffic computation
```ts
// src/lib/__tests__/hours.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { nowInAmsterdam } from "@/lib/hours";

afterEach(() => vi.useRealTimers());

describe("nowInAmsterdam", () => {
  it("maps a UTC instant to Amsterdam weekday + minutes (CEST, +2 in summer)", () => {
    vi.setSystemTime(new Date("2026-06-19T07:30:00Z")); // Fri 09:30 Amsterdam
    const now = nowInAmsterdam();
    expect(now.day).toBe("friday");
    expect(now.minutes).toBe(9 * 60 + 30); // 570
  });

  it("handles the winter offset (CET, +1) — no DST drift", () => {
    vi.setSystemTime(new Date("2026-01-09T08:30:00Z")); // Fri 09:30 Amsterdam
    expect(nowInAmsterdam().minutes).toBe(570);
  });
});
```
**Must-cover:** midnight boundary; a business open past midnight (period crossing 24:00); the `closing_soon` threshold; a closed day; empty `hours` → `unknown`; the DST switch weekends (late March / late October).

### 3.2 `geo.ts` — interpolation must never NaN (NaN coords break JSON-LD `geo`)
```ts
it("returns finite, in-bbox coords for every seed business", async () => {
  const { getActiveBusinesses } = await import("@/lib/businessData");
  for (const b of await getActiveBusinesses()) {
    const { lat, lng } = coordsFor(b);            // src/lib/geo.ts
    expect(Number.isFinite(lat) && Number.isFinite(lng)).toBe(true);
    expect(lat).toBeGreaterThan(52.15);           // inside Amersfoort centre
    expect(lat).toBeLessThan(52.16);
  }
});
// + a business with its own verified lat/lng overrides interpolation
// + an unknown street falls back to DISTRICT_CENTER, never NaN
```

### 3.3 `overrides.ts` — the merge math (newest approved field wins)
The merge is the heart of the data seam. Test it as a **pure function over rows**, independent of D1:
```ts
it("spread-merges approved rows oldest→newest so the newest field value wins", () => {
  const rows = [
    { business_id: "b1", fields: { phone: "033-1111111" }, reviewed_at: 100, submitted_at: 10 },
    { business_id: "b1", fields: { phone: "033-2222222" }, reviewed_at: 200, submitted_at: 20 },
  ];
  const merged = mergeApproved(rows);   // extract the pure reducer from getOverrides()
  expect(merged.b1.phone).toBe("033-2222222");
});
```
> **Refactor note for engineering:** extract the pure reducer (`mergeApproved(rows)`) from `getOverrides()` (ordering `reviewed_at ASC, submitted_at ASC`) so it is unit-testable without a D1 mock. The D1 query stays thin; the math gets tested in isolation.

### 3.4 `media.ts` — MIME sniff is a security boundary
Magic-byte sniffing (not filename/Content-Type) is the allowlist gate (JPEG/PNG/WebP/AVIF). Test with real byte signatures:
```ts
it("accepts a real JPEG header and rejects an SVG/HTML payload", () => {
  expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
  expect(sniffMime(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  expect(sniffMime(new TextEncoder().encode("<!doctype html>"))).toBeNull();
});
```
**Must-cover:** JPEG, PNG, WebP (`RIFF…WEBP`), AVIF; reject SVG, HTML, GIF; the 5 MB+1 size cap; and a JPEG header behind a `.png` filename (sniff wins over extension).

### 3.5 `settings.ts` — the fallback chain
`D1 app_settings → Worker env secret → hardcoded default`. Test all three rungs and the empty-string-clears semantics for `getResendConfig`, `getAdminEmails`, `getConfiguredSiteUrl`.

### 3.6 `schema.ts` / `related.ts`
- `localBusinessSchema()` for a Restaurant seed: asserts `@type` subtype override, stable `@id` (`{url}#business`), `geo` present, and **never** emits `aggregateRating`/`review` (2024+ self-serving policy).
- `buildFaqs()` returns FAQ entries whose text matches what the page renders (FAQ schema must equal visible content).

---

## 4. **Security regression suite — the MUST-HAVE (P0 gate)**

The single most important artifact here. It proves the multi-tenant isolation the whole owner-portal model rests on. **A red test blocks the release unconditionally.** Tag every test `@security`.

### 4.1 Threat model these tests encode
| # | Threat | Defended by | Test asserts |
|---|---|---|---|
| S1 | Owner A edits Owner B's business | `canEdit()` → `ownedBusinessIds()` in `submitEdit`/`beheer/[id]` | A's `submitEdit("B", …)` rejected; **no** `business_overrides` row for B |
| S2 | Owner A reads B's **pending** photo bytes | `/media/[...key]` pending branch (`getCurrentUser` + `canEdit`) | A requesting B's pending key → **404** (not 403 — don't reveal existence) |
| S3 | Anonymous reads any pending photo | same | anon → 404 |
| S4 | Rejected/superseded media reachable | `/media` `status !== 'approved'` branch | rejected/superseded key → 404 even for the owner |
| S5 | Owner reaches `/admin` | `requireAdmin()` redirect | owner session → redirect `/beheer`, no admin action runs |
| S6 | Magic-link token reused | `used=1` flip in `completeLogin` | 2nd `/auth/callback?token=X` mints no session |
| S7 | Expired token accepted | 15-min TTL check | `expires_at < now` → rejected |
| S8 | Forged/fixated cookie | opaque random UUID, server-side lookup | random cookie → `getCurrentUser()` null |
| S9 | Magic-link brute force | rate limit on `/login` POST (launch deliverable) | 6th req / 60 s / IP → 429 |
| S10 | Owner self-approves an override | only admin Server Actions call `moderateOverride` | owner cannot invoke `approve`/`approvePhoto` |
| S11 | GDPR purge by non-admin | `requireAdmin` on `purgeBusinessData` | owner → denied |
| S12 | Path traversal on media key | key join + `business/{id}/` namespace | `../`/encoded traversal → 404, never escapes namespace |

### 4.2 The two flagship tests (write these first)

**S1 — cross-tenant edit is impossible:**
```ts
// src/app/beheer/__tests__/cross-tenant-edit.security.test.ts
import { describe, it, expect } from "vitest";
import { seedTwoOwners, asUser } from "@/test/fixtures";
import { submitEdit } from "@/app/beheer/actions";

describe("@security owner cannot edit another business", () => {
  it("rejects submitEdit for a business the session does not own", async () => {
    const { ownerA, businessB } = await seedTwoOwners();      // A owns businessA only
    const fd = new FormData(); fd.set("phone", "033-9999999");

    await asUser(ownerA, async () => {
      await expect(submitEdit(businessB.id, fd)).rejects.toThrow(); // canEdit() === false
    });

    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM business_overrides WHERE business_id = ?"
    ).bind(businessB.id).first<{ n: number }>();
    expect(row!.n).toBe(0);   // nothing leaked into D1 for B
  });
});
```

**S2 — cross-tenant pending media is a 404:**
```ts
// src/app/media/__tests__/cross-tenant-media.security.test.ts
describe("@security pending media is private to the owning account", () => {
  it("404 when owner A requests owner B's PENDING photo", async () => {
    const { ownerA, pendingKeyB } = await seedPendingPhotoForB();
    const res = await SELF.fetch(`https://test/media/${pendingKeyB}`, {
      headers: { cookie: sessionCookie(ownerA) },
    });
    expect(res.status).toBe(404);     // NOT 200, NOT 403
  });

  it("200 + immutable cache once the same photo is APPROVED (public)", async () => {
    const { approvedKeyB } = await approvePhotoForB();
    const res = await SELF.fetch(`https://test/media/${approvedKeyB}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("immutable");
  });
});
```

> **Playwright complement:** one e2e per flagship — log in as owner A in a real browser, open `/beheer/{B}` (expect redirect/empty), and hit B's pending `/media` URL directly (expect a broken/404 image). Proves the wiring end-to-end through the real Worker.

### 4.3 Rule: every new tenancy edge gets a `@security` test
When an epic adds a new ownership boundary (gift-card redemption by another owner, GBP token of another business, reading another owner's events), it **must** add the matching `@security` test *before* merge. The suite grows with the surface area. No exceptions.

---

## 5. Webhook testing — Mollie (gift card / `cadeaukaart`)

The Mollie iDEAL flow is the only place real money moves; webhooks are the only authoritative signal of payment. **Webhooks are untrusted input** — the POST body contains only an `id`; the handler must **re-fetch** the payment from Mollie to learn the true status. Test that discipline.

### 5.1 What the handler MUST do (and tests assert)
| Rule | Test |
|---|---|
| Never trust the body's status | a `paid`-looking body for a payment Mollie reports `open` → no card issued |
| Re-fetch payment by `id` from Mollie | mock `GET /v2/payments/{id}`; assert it is called |
| Idempotent on duplicate delivery | deliver same `paid` webhook twice → exactly **one** card row, one issuance email |
| Order must be known | unknown `id` → 200 (ack) but no issuance, log warning |
| Always 200 quickly | even "still open" → 200 so Mollie stops retrying; heavy work stays idempotent |
| Amount/currency match the order | mismatch → flag, no issue, alert admin |
| Only `paid` issues | `expired`/`canceled`/`failed` issue nothing (parametrised) |

### 5.2 Example
```ts
// src/app/api/mollie/webhook/__tests__/webhook.test.ts
describe("Mollie webhook", () => {
  it("issues exactly one gift card and is idempotent on redelivery", async () => {
    mockMollie.payment("tr_abc", { status: "paid", amount: { value: "25.00", currency: "EUR" } });
    const body = new URLSearchParams({ id: "tr_abc" });

    const r1 = await SELF.fetch("https://test/api/mollie/webhook", { method: "POST", body });
    const r2 = await SELF.fetch("https://test/api/mollie/webhook", { method: "POST", body });

    expect([r1.status, r2.status]).toEqual([200, 200]);
    const cards = await env.DB.prepare(
      "SELECT COUNT(*) n FROM gift_cards WHERE payment_id='tr_abc'"
    ).first<{ n: number }>();
    expect(cards!.n).toBe(1);               // idempotent
    expect(mockResend.sent).toHaveLength(1); // one issuance email
  });

  it("does NOT issue when Mollie reports the payment still open", async () => {
    mockMollie.payment("tr_open", { status: "open" });
    await SELF.fetch("https://test/api/mollie/webhook", {
      method: "POST", body: new URLSearchParams({ id: "tr_open" }),
    });
    const cards = await env.DB.prepare("SELECT COUNT(*) n FROM gift_cards").first<{ n: number }>();
    expect(cards!.n).toBe(0);
  });
});
```

### 5.3 Manual sandbox checklist (before `cadeaukaart` go-live)
- [ ] Mollie **Sandbox** keys in the *preview* Worker secrets (never prod keys in CI).
- [ ] Use Mollie test amounts to force each terminal status (paid / canceled / expired / failed).
- [ ] Webhook URL points at a **publicly reachable preview deployment** (not localhost) so Mollie can call it.
- [ ] Redemption double-spend: redeem the same code twice concurrently → exactly one redemption (D1 conditional `UPDATE … WHERE status='active'`). Test under simulated concurrency.
- [ ] Refund path documented (Mollie dashboard refund → admin marks card void).

---

## 6. Non-functional gates

### 6.1 Accessibility (axe) — WCAG 2.1 AA
The design playbook flags real known issues (focus-ring contrast ~3.2:1 fails SC 1.4.11; `lang` missing on `<html>`; `white/40` text on charcoal; map keyboard gaps). axe catches the automatable subset; manual review (design-system playbook) catches the rest.

```ts
// e2e/a11y.spec.ts
import AxeBuilder from "@axe-core/playwright";
const PAGES = ["/", "/ondernemers/<known-id>", "/aanmelden", "/beheer", "/admin", "/cadeaukaart"];
for (const path of PAGES) {
  test(`@a11y ${path} has no serious/critical violations`, async ({ page }) => {
    await page.goto(path);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = r.violations.filter(v => ["serious", "critical"].includes(v.impact!));
    expect(serious).toEqual([]);
  });
}
```
**Hard gates (fail CI):** `html-has-lang`, `color-contrast` (serious), `button-name`/`link-name`, `image-alt`, `label`, `aria-*` validity. A **known-issue allowlist** is permitted *only* with a linked ticket + expiry date in the test-file comment.

### 6.2 Performance / Core Web Vitals (Lighthouse CI)
The public site is the SEO surface — slow pages lose AI citations and local-pack ranking. Budgets:

| Metric | Budget (mobile, p75) | Asserted on |
|---|---|---|
| LCP | ≤ 2.5 s | home, business detail |
| INP | ≤ 200 ms | home (BusinessExplorer interactions) |
| CLS | ≤ 0.1 | all |
| Performance score | ≥ 90 | home, category, detail |
| Home JS (gz) | ≤ 180 KB | budget assertion |

```jsonc
// lighthouserc.json
{
  "ci": {
    "collect": { "url": ["https://<preview>/","https://<preview>/ondernemers/<id>"], "numberOfRuns": 3 },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```
Stack-specific watch items: MapLibre is async-imported (don't let it block LCP; verify the placeholder doesn't cause CLS), Framer Motion hero parallax (INP), and the OG `next/og` route (server cost). Run LHCI **against `preview:cf`** (real Worker), never `next dev`.

### 6.3 SEO/AEO regression checks (automated)
A thin Playwright/Vitest suite so the structured-data contract never silently breaks:
- [ ] Every public route emits a `<script type="application/ld+json">` that **parses** and has a `@graph`.
- [ ] Business detail emits a `LocalBusiness` node and **never** `aggregateRating`/`review` (2024+ self-serving policy — see `seo-geo`/`aeo`).
- [ ] `/llms.txt` → 200, non-empty, contains the business count.
- [ ] `/sitemap.xml` lists ~67 business URLs with `lastmod`.
- [ ] `/robots.txt` allows GPTBot, PerplexityBot, Google-Extended, ClaudeBot.
- [ ] JSON-LD `address`/`telephone` equal `src/lib/site.ts` (NAP-consistency assertion).
- [ ] When `dateModified` ships (AEO freshness), assert it is present and within 12 months on business nodes.

---

## 7. Test data & the local D1 fixture

The seed (`src/data/businesses.ts`, ~67 businesses) is the **source of truth** — never invent fake businesses for unit logic. D1 fixtures layer **only** the override/auth/media delta on top.

### 7.1 Local D1 for tests
```bash
npm run db:migrate:local           # wrangler d1 migrations apply kamp-db --local
wrangler d1 execute kamp-db --local --file=src/test/fixtures/seed.sql
```

`src/test/fixtures/seed.sql` (deterministic IDs so assertions are stable):
```sql
INSERT INTO profiles (id, email, role, created_at) VALUES
  ('owner-a','a@test.local','owner',1750000000000),
  ('owner-b','b@test.local','owner',1750000000000),
  ('admin-1','admin@test.local','admin',1750000000000);
INSERT INTO owner_business (profile_id, business_id, created_at) VALUES
  ('owner-a','<real-seed-id-A>',1750000000000),
  ('owner-b','<real-seed-id-B>',1750000000000);
-- opaque session id == cookie value; far-future expiry
INSERT INTO sessions (id, profile_id, expires_at, created_at) VALUES
  ('sess-a','owner-a',4070908800000,1750000000000),
  ('sess-b','owner-b',4070908800000,1750000000000),
  ('sess-admin','admin-1',4070908800000,1750000000000);
```

### 7.2 Fixture helpers (`src/test/fixtures.ts`)
- `seedTwoOwners()` → `{ ownerA, ownerB, businessA, businessB }`, idempotent (`INSERT OR IGNORE`).
- `sessionCookie(user)` → `kamp_session=<sessionId>` matching a seeded session.
- `asUser(user, fn)` → runs a Server-Action call in the user's cookie context.
- `resetDb()` → `DELETE` from writable tables in FK-safe order (`sessions, owner_business, business_overrides, business_media, auth_tokens, profiles`) in `beforeEach`. **Never `DROP`** — keep the schema from migrations.

### 7.3 Isolation rules
- Clean D1 per test file via `resetDb()` in `beforeEach`; `@cloudflare/vitest-pool-workers` with `isolatedStorage: true` gives each file its own storage.
- Mock all external calls (Resend, Mollie, Google) — **no real network in CI.** Provide `mockResend`, `mockMollie`, `mockGoogle` in `src/test/mocks/`.
- R2 in tests uses local miniflare R2; assert object existence/deletion via the binding (e.g. supersede deletes old bytes).

---

## 8. CI pipeline & migration safety

### 8.1 GitHub Actions (extends `eng-standards` §4 with QA gates)
```yaml
name: ci
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run db:migrate:local                       # migrations apply cleanly
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:security                          # P0 — red here = no merge
      - run: NEXT_PHASE=phase-production-build npm run build # hermetic-seed contract
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e:smoke                         # against preview:cf
  nightly:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps: [ "full e2e", "axe", "lhci", "npm audit" ]
```
**Required status checks on `main`:** `verify` green. `test:security` and the hermetic `build` are the non-negotiable gates. App secrets stay on the Worker (`wrangler secret put`); CI only holds `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.

### 8.2 D1 migration safety (forward-only, expand→contract)
Migrations live in `migrations/` (`0001_init.sql`, `0002_settings.sql`) and are applied by `wrangler d1 migrations apply`. D1/SQLite has **no DDL transaction rollback** at the platform layer — treat every migration as irreversible-in-prod.

**Rules:**
- **Additive only by default:** new tables, new *nullable* columns, new indexes. A `NOT NULL` column needs a `DEFAULT`.
- **No destructive change to a live table in one step.** To remove/rename a column holding owner data, use **expand → migrate → contract** across ≥2 releases:
  1. *Expand:* add the new column, write both.
  2. *Migrate:* backfill + switch reads.
  3. *Contract:* drop the old column only after a release soaks **and** a backup exists.
- **Idempotent where possible:** `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
- **Mandatory backup before any non-trivial prod migration:**
  ```bash
  wrangler d1 export kamp-db --remote --output backups/kamp-$(date +%Y%m%d-%H%M).sql
  ```
- **Dry-run order:** `--local` (CI) → preview D1 → `--remote` prod **from CI on `main`** (never hand-applied to prod from a laptop mid-release).

| Migration shape | Allowed? | Note |
|---|---|---|
| `CREATE TABLE … IF NOT EXISTS` | ✅ | events, gift_cards, subscribers, leads, place_ids |
| `ADD COLUMN x TEXT` (nullable) | ✅ | additive |
| `ADD COLUMN x TEXT NOT NULL DEFAULT '…'` | ✅ | additive w/ default |
| `CREATE INDEX IF NOT EXISTS` | ✅ | perf |
| `DROP COLUMN` / `RENAME COLUMN` on live data | ⚠️ | expand→contract, backup first |
| `DROP TABLE` with live data | ❌ | explicit sign-off + export |

---

## 9. Preview environments per PR

Goal: every PR is testable as a **real Worker** against **isolated** D1 + R2 — never prod data.

### 9.1 Strategy: Workers preview versions + dedicated preview resources
- **Separate preview resources**, created once: `kamp-db-preview`, `kamp-photos-preview`, `kamp-next-cache-preview`, wired via a `--env preview` block in `wrangler.jsonc`. A PR can never touch prod `kamp-db`.
- Each PR uploads a **preview version** (no traffic shift):
  ```bash
  npx opennextjs-cloudflare build
  npx wrangler versions upload --env preview   # → https://<version>-<worker>.workers.dev
  ```
- A GitHub Action posts the preview URL as a PR comment. Playwright e2e, axe, LHCI run against it.
- Apply migrations to preview D1 before e2e: `wrangler d1 migrations apply kamp-db-preview --remote --env preview`.
- **Preview secrets only:** Mollie *sandbox* keys, a test Resend key (or console-log mode), test admin emails. Never prod secrets.

### 9.2 PR checklist (in the PR template)
- [ ] Preview URL renders home + a business detail + the touched feature.
- [ ] `@security` suite green (cross-tenant edit + pending media).
- [ ] Migration: backup command noted; `--local` + preview `--remote` clean; expand/contract plan if non-additive.
- [ ] UI: axe clean (or known-issue ticket linked); LHCI within budget.
- [ ] Webhook/payment: Mollie sandbox flow exercised; idempotency proven.
- [ ] SEO surface unchanged or improved (§6.3).

---

## 10. Release process, go-live & rollback

### 10.1 Standard release (low-risk, additive)
1. PR merged to `main` → CI green (incl. `@security` + hermetic build).
2. CI runs prod migrations (`npm run db:migrate`) **then** deploys (`npm run deploy:cf`).
3. Post-deploy smoke (automated, against prod): home 200, a business detail 200 with JSON-LD, `/llms.txt` 200, `/login` reachable, `/admin` redirects when unauthenticated.
4. Watch Workers Logs + the synthetic check for 15 min.

### 10.2 Go-live checklist (`launch` — run once, then keep as the release template)
**Infra / config**
- [ ] `wrangler d1 create kamp-db`; real `database_id` pasted into `wrangler.jsonc` (currently `REPLACE_WITH_D1_DATABASE_ID`).
- [ ] R2 buckets exist: `kamp-photos`, `kamp-next-cache`.
- [ ] Prod secrets set: `RESEND_API_KEY`, `ADMIN_EMAILS`, `AUTH_SECRET` (+ Mollie/Google when those epics ship).
- [ ] Migrations applied `--remote`; first-login bootstrap promotes the intended admin email.
- [ ] Custom domain `ondernemersvandekamp.nl` mapped; `NEXT_PUBLIC_SITE_URL` matches.
- [ ] Tag-cache decision recorded: accept the 5-min ISR window **or** wire `d1-next-tag-cache` + `NEXT_TAG_CACHE_D1` (see `eng-standards` §6). If wired, test on-demand invalidation on approval.

**Quality gates**
- [ ] Full e2e green on preview (owner-edit→moderate→publish end to end).
- [ ] `@security` suite green.
- [ ] axe: no serious/critical on public pages; `<html lang="nl">` set.
- [ ] LHCI: home + detail ≥ 90, LCP ≤ 2.5 s.
- [ ] SEO checks (§6.3) green; `SITE.social` filled (no empty `sameAs`).

**Safety**
- [ ] D1 export taken: `wrangler d1 export kamp-db --remote --output backups/launch.sql`.
- [ ] Current Worker version id recorded (rollback target).
- [ ] Rollback + incident runbook (§10.3, §11.3) linked in the release notes.
- [ ] On-call responder named for the launch window.

### 10.3 Rollback

**Code rollback — Cloudflare Workers version rollback (seconds, no rebuild):**
```bash
wrangler versions list                 # find the last-known-good version id
wrangler rollback <version-id>         # instant traffic shift back
# or gradual: wrangler versions deploy <good>@100%
```
> Versioned deploys make rollback a traffic shift, not a redeploy. Record the good version id **before** every release.

**Code-only vs. code+data:**
| Situation | Action |
|---|---|
| Bad code, schema unchanged | `wrangler rollback`. Done. |
| Bad code, additive migration already ran | Roll back code; the unused new column/table is harmless. No data rollback. |
| Bad migration corrupted/locked data | Roll back code **and** restore D1 from the pre-migration export. P1 incident. |
| ISR serving stale/wrong content | Deploy the fix (or `revalidateTag` if tag-cache wired); the 5-min window self-heals worst case. |

**D1 restore (last resort, rehearsed):**
```bash
wrangler d1 execute kamp-db --remote --file=backups/kamp-<ts>.sql   # targeted table restore
```
There is **no point-in-time restore** on the D1 free tier — **the export cadence IS the recovery point.** Export before every migration and nightly via cron (§11.4). RPO = time since last export.

### 10.4 Change management
- **Risk tiers:** *additive* (auto-merge on green) → *behavioral* (1 reviewer) → *data/migration* or *auth/payment* (2 reviewers, one backend owner, mandatory `@security` + migration plan).
- **Release window:** no Friday-afternoon prod deploys for payment/auth/migration changes (small team; weekend recovery is thin).
- **Changelog:** every release records migrations applied, the prior Worker version id, and the rollback command (GitHub Releases or `docs/roadmap/`).

---

## 11. Monitoring, alerting & incident response

### 11.1 Observability (already partly on)
`wrangler.jsonc` has `observability.enabled: true` → Workers Logs are on. Build on it:
- **Workers Logs** for request-level errors; add structured `console.error("[domain] msg", {ctx})` at every failure branch (auth, media, override, webhook).
- **Logpush** (optional) to an R2 bucket for retention beyond the tail window — EU-resident, cheap.
- **Sentry (EU `de.sentry.io`)** *optional*, only if volume justifies; wrap Server Actions + webhook handlers.

### 11.2 Synthetic monitoring & alerts (lean budget)
| Check | Tool | Alert |
|---|---|---|
| Home 200 + contains "De Kamp" | Cloudflare Health Check / UptimeRobot (EU) | email + Slack on 2 consecutive fails |
| `/llms.txt` 200 + non-empty | synthetic | SEO surface down |
| Mollie webhook endpoint 200 | synthetic ping (no side effects) | payments at risk |
| D1 query error rate | Workers Logs metric | spike alert |
| 5xx on `/media/*` | Workers Logs | photo serving broken |

### 11.3 Incident severity & response
| Sev | Definition | Examples | Response |
|---|---|---|---|
| **P0** | Data exposure / money loss / auth broken | Owner reads another's media; card issued without payment; wrong charge amount | Page responder; roll back; export D1; postmortem mandatory |
| **P1** | Public site down / SEO surface broken | Home 5xx; JSON-LD/sitemap/llms.txt gone; deploy wedged | Roll back to last-good version; fix forward |
| **P2** | Feature degraded, no data risk | Newsletter signup failing; map not loading; a category page error | Fix next deploy; track |
| **P3** | Cosmetic / minor | Contrast nit, copy typo | Backlog |

**P0/P1 runbook (first 15 min):**
1. **Confirm** scope (route, users) from Workers Logs.
2. **Roll back** the Worker version (`wrangler rollback`) — restore service first, diagnose second.
3. **Contain data risk:** for S1/S2-class exposure also consider `DELETE FROM sessions` (invalidate all sessions) and rotating the affected secret.
4. **Communicate** to the team channel; if user data was exposed, the **legal/compliance GDPR breach process** starts (72-hour AP notification clock).
5. **Snapshot:** `wrangler d1 export` for forensics *before* any cleanup.
6. **Postmortem** (blameless): timeline → root cause → the missing test → the gate that should have caught it. A P0 always ends with a **new `@security`/regression test** added to the suite.

### 11.4 Cron / hygiene (also QA-relevant)
A scheduled Worker (Cron Trigger) should prune expired `auth_tokens` + `sessions`, take a nightly `d1 export` to R2 (the recovery point), and sweep orphaned `superseded`/`rejected` R2 objects. **Test the cron handler** as an integration test: invoke the `scheduled()` export with a fake controller; assert expired rows deleted, fresh rows kept.

---

## 12. Definition of Done (QA sign-off gate)

A change is **done** only when:
- [ ] Unit tests for new `lib/` logic (≥90% on pure modules).
- [ ] Integration test for every new auth branch and error branch.
- [ ] **`@security` test added if the change touches ownership / auth / media / payment.**
- [ ] e2e smoke covers the new happy path (and, for irreversible flows, the failure path).
- [ ] Webhook changes: idempotency + re-fetch-truth tests (Mollie).
- [ ] axe clean on touched UI (or ticketed allowlist); LHCI within budget on public pages.
- [ ] SEO/AEO regression checks green (§6.3).
- [ ] Migration: additive or expand/contract plan + backup command; applied `--local` and preview `--remote`.
- [ ] Hermetic `build` green (no D1 in the build path).
- [ ] Rollback target version id recorded; preview URL verified.

---

## 13. Applies to which epics

| Epic | What this playbook mandates for it |
|---|---|
| **launch** | Owns *creation* of the whole suite: Vitest + Playwright + axe + LHCI + CI + preview env + go-live checklist + rollback runbook. Highest-priority consumer. |
| **cadeaukaart** | Mollie webhook idempotency + re-fetch-truth tests; redemption double-spend test; sandbox manual flow; additive `gift_cards` migration; payment = 2-reviewer + Friday-freeze. |
| **google-reviews** | `@security` test that an owner's GBP OAuth token can't read another business; additive `place_id` migration; Places API compliance asserted (Maps link-back, logo); no `aggregateRating` in schema. |
| **agenda** | Additive `events` migration; owner event-submission gets a cross-tenant `@security` test; Event JSON-LD regression check; scheduled-expiry cron test. |
| **owner-story** | Article JSON-LD regression; author-entity linkage assertion; `dateModified` freshness check. |
| **newsletter** | Double-opt-in e2e; consent + unsubscribe-token tests; additive `subscribers` migration; GDPR test (no email stored without confirmed consent). |
| **bilingual** | hreflang regression; per-locale `<html lang>` a11y assertion; canonical/alternate duplicate-content test; locale-routing e2e. |
| **design-system** | axe is the enforcement arm — focus-ring contrast, `lang`, dark-surface contrast, map keyboard flow become failing tests until fixed; LHCI guards CWV during the portal uplift. |
| **analytics** | Consent-gating test (no tracking before consent); EU-residency of the processor verified; events-fire test. |
| **owner-ops** | Owner self-service request flow e2e; `@security` that a request can't self-approve; admin-only moderation tests. |
| **discovery** | `BusinessExplorer` filter/search unit tests; map-upgrade LHCI (no LCP/CLS regression); a11y of the new search UI. |

---

## 14. Quick-reference commands

```bash
# the PR gate
npm run test:unit && npm run test:integration && npm run test:security

# full local check before pushing
npm run lint && npx tsc --noEmit && npm test && NEXT_PHASE=phase-production-build npm run build

# local D1 for tests
npm run db:migrate:local
wrangler d1 execute kamp-db --local --file=src/test/fixtures/seed.sql

# e2e against the REAL worker
npm run preview:cf          # terminal 1
npm run test:e2e            # terminal 2 (points at the preview URL)

# release
wrangler versions list                                                   # record last-good id FIRST
wrangler d1 export kamp-db --remote --output backups/kamp-$(date +%Y%m%d-%H%M).sql
npm run db:migrate                                                       # prod migrations
npm run deploy:cf                                                        # build + deploy

# rollback (seconds)
wrangler rollback <last-good-version-id>
```

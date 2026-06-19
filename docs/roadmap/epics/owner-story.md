# Owner-Story Editorial Strand — Long-form Maker Profiles for De Kamp

> Long-form, E-E-A-T-rich profiles and interviews of De Kamp's makers — a D1-backed editorial system that deepens entity authority for AI answer engines, lifts the linked business pages through contextual internal linking, and feeds the newsletter and socials.
> **Recommended phase:** Phase 5 (post-launch, after GBP/reviews + events; the authoring-model spike + ADR can start in Phase 4 in parallel). **Effort:** 6–9 weeks. **Teams:** Frontend, Backend/Infra, SEO/GEO/AEO, Design/UX, Content/Localization, Legal/Compliance, Data/Analytics, Operations/Owner-relations, Product/PM, Growth.

> **Reviewer's note (this is the finalized, adversarially-reviewed version).** The draft was sound and stack-accurate. Five corrections were folded in and are called out inline where they matter: (1) `generateStaticParams()` cannot enumerate published slugs at build time because the data seam is `NEXT_PHASE`-guarded to never touch D1 during `next build` — stories must render on-demand with `dynamicParams`; (2) `revalidateTag` only invalidates pages that *declared* the tag, so story and business pages must opt into named cache tags or the tag-cache override is wasted; (3) editor-authored Markdown must be sanitized server-side (micromark passes raw HTML through by default) — trusted-author is not the same as safe; (4) "410 Gone" is not cleanly returnable from a Next.js App Router page — archived/withdrawn stories use `notFound()` (404) plus removal from all listings/sitemap; (5) the `editor` role change touches shared `auth.ts` and must not regress the existing owner→`/beheer` redirect. Estimate bumped to 6–9 weeks to reflect the sanitizer, the on-demand-render verification on Next 16, and the legal review of the first three pieces.

---

## 1. Goal & value

The directory answers "*which* shops are on De Kamp." The owner-story strand answers "*who* makes them worth visiting, and *why*." That shift is the strategic point of this epic.

**Why it matters to the district.** De Kamp's competitive edge over a generic shopping street is its independent makers — a tailor, a roaster, a jeweller, a wine merchant with a story. Long-form profiles turn that human texture into durable, crawlable content. Per the 2026 guidelines, AI answer engines reward **entity-first depth** (clearly-defined people, brands, places with `sameAs`), **topical authority**, and **freshness** (~83% of AI citations are pages updated within 12 months, >60% within 6). A monthly cadence of original, photographed interviews is the single most efficient way to manufacture that freshness signal *and* net-new entity facts that no competitor scraping public listings can replicate.

**Why it matters to owners.** A profile is the highest-value thing the guide gives a B2B owner short of selling for them. It is shareable, evergreen, flattering, and — critically — it **lifts their own business page**: the story links into the profile with contextual anchor text, the profile is featured in the newsletter, and it produces social-ready assets the owner can repost. The illustrative test case is **Atelier Misura Sartoria** (a tailor — used here as a worked example; confirm it exists in `src/data/businesses.ts` before publishing, otherwise pick a real seed business): an editor profiles the craftsperson, the piece ranks for "maatkleding Amersfoort" and "kleermaker binnenstad," cites the atelier as the named entity, and the contextual link feeds qualified traffic onto the atelier's directory page — where the "bel" / "website" / "route" CTAs convert.

**Why it matters to visitors.** It converts a flat directory into a reason to visit *this* shop *today*. Visitors discover makers through "things to do in Amersfoort" and "wie maakt X in Amersfoort" queries, land on a story, and click through to hours/route/contact.

**Problem solved.** The current site has *zero* Article/author schema and no editorial path (confirmed: SEO audit gap #1). The directory is entity-broad but entity-shallow per business. This epic adds the depth layer — the E-E-A-T + AEO storytelling strand — without touching the canonical JSON-LD/SSG contract that already works.

---

## 2. How it works in real life

**Personas.** *Sanne* — the part-volunteer district editor (new `editor` role). *Marco* — owner of the profiled business. *Lotte* — a visitor in Utrecht planning a Saturday in Amersfoort.

**Step 1 — Pitch.** Sanne keeps a backlog in `/admin/verhalen`. She creates a story `idea` row: title "De laatste kleermaker van de Kamp," links it to the business (`relation='primary'`), and assigns herself as author. The row is invisible to the public (only `published` rows ever reach a public read path).

**Step 2 — Interview + consent (the gate).** Sanne visits the atelier, records a 40-minute interview, and shoots 12 photos of Marco at the cutting table. Before anything else, she has Marco complete a **consent step**: he confirms (a) his name and portrait may be published, (b) his quotes may be used and he wants quote-approval before publish, (c) the lawful basis is consent + editorial legitimate-interest. This writes a `story_consent` row with `consent_status='pending'`. **Publishing is blocked at the server action until this row is `granted`.**

**Step 3 — Draft.** Sanne writes ~900 words in the admin editor (Markdown). The system requires an **answer-first lede** (40–60 words, server-validated on word count) — e.g. "Atelier Misura Sartoria is het enige maatkledingatelier op De Kamp in Amersfoort; kleermaker Marco maakt sinds 2014 pakken en jurken op maat, van eerste schets tot laatste steek, in een werkplaats aan de Kamp." She uploads the hero portrait and a 4-photo gallery; each goes through the same magic-byte-sniffed (`sniff()` in `media.ts`), 5 MB-capped R2 upload + moderation flow the photo epic already built, now under the `story/{id}/...` key prefix.

**Step 4 — Quote approval + review.** Sanne moves the story to `in_review`. Marco gets a magic-link to a read-only preview, approves his quotes (flips `quote_approval=1`), and Sanne flips `story_consent` to `granted`. A second reviewer (or Sanne, if solo) does the editorial + legal sanity check: no superlatives stated as fact, no review-snippet markup, alt text present on every image, ≥3 net-new entity facts.

**Step 5 — Publish.** Sanne clicks Publish. The server action verifies consent is `granted` AND an approved hero exists, sets `status='published'`, stamps `published_at` and `date_modified=now()`, then calls `revalidateTag('stories')` and `revalidateTag('business:'+businessId)` for each linked business. **The story index/page and each linked business page must have declared those tags** (see §4 Backend "Caching") or the calls are no-ops; with the `d1-next-tag-cache` override wired (dependency), declared tags invalidate within seconds. The business page now shows a "Lees het verhaal" `StoryStrip` card.

**Step 6 — Discovery.** Lotte googles "kleermaker Amersfoort binnenstad." Google's AI Overview cites the story (answer-first lede, `Article` + `Person` author, `dateModified` last week, `about` → the atelier's `LocalBusiness @id`). She reads it, clicks the contextual "**Atelier Misura Sartoria**" link into the profile (same-page anchor and the `StoryStrip`), sees it's open till 17:00, taps "Route," and visits. Analytics records the story→business→route funnel.

**Step 7 — Distribution.** The story auto-surfaces in the next monthly newsletter's "Verhaal van de maand" block (pulled live from `getPublishedStories()` ordered by `published_at`), and Sanne exports the social card. Marco reposts it to the atelier's Instagram, a fresh `sameAs` backlink signal.

**Edge case (withdrawal).** Six months later Marco sells the shop and asks to be removed. Sanne sets `consent_status='withdrawn'`; the withdrawal handler flips the story to `archived`, the page returns **404 (`notFound()`)** and is dropped from `/verhalen`, the sitemap, `llms.txt`, and the business-page strip on next revalidation; R2 photos are purged via the existing R2-then-D1 purge ordering.

---

## 3. Scope

**In**
- D1-backed story content type (`stories`) with a moderation/workflow state machine reusing the override/media patterns.
- Admin/editor authoring (Markdown body) in `/admin/verhalen`; owner-submitted *ideas/drafts* limited to businesses they own.
- `/verhalen` index + `/verhalen/[slug]` detail reading experience (hero, answer-lede, pull quotes, moderated gallery, related/nearby), rendered **on-demand** (not pre-enumerated at build).
- Story↔business many-to-many linking (`story_business`) surfaced on both ends.
- `Article` + `Person`(author) + `about`/`mentions`→`LocalBusiness @id` JSON-LD with `dateModified` freshness, added to `schema.ts`.
- Server-side Markdown→HTML rendering **with sanitization**.
- Photography rights/consent model (`story_consent`, `story_media.credit/alt_text`) tied to R2 + GDPR erase.
- Sitemap + `llms.txt` + breadcrumb integration; answer-first content standard.
- New `editor` role (additive to `profiles.role`) + `requireEditor()` guard.
- Distribution hooks: newsletter featured-story block + exportable social card.
- Analytics instrumentation for the story→business funnel.

**Out (this epic)**
- A public WYSIWYG owner story editor (owners submit *structured drafts/ideas*, editors polish — no rich-text owner UI).
- AggregateRating/Review markup on stories (explicitly forbidden — policy).
- Audio/video embedding/hosting (link out only if needed).
- Paid promotion / sponsored content mechanics.
- Per-story dynamic OG-image route (hero image serves OG; see Later).

**Later**
- EN translations of stories (depends on i18n epic; schema + route group designed to accept it).
- `Article` → podcast/video `VideoObject` extension + dynamic OG image.
- Reader comments / community features.
- AI-assisted draft scaffolding from interview transcript (human-edited only; EU-resident ASR with DPA only).
- Series/collections (`/verhalen/serie/[slug]`) once volume justifies.

---

## 4. Team breakdown

### Engineering — Frontend (Next.js 16 App Router)

> **Hard requirement before any code:** read `node_modules/next/dist/docs/01-app/` for the current route-segment-config, `generateMetadata`, and caching APIs. This is Next.js 16 with breaking changes vs older Next.

**Routes (App Router).**
- `app/verhalen/page.tsx` — **Server Component**, `export const revalidate = 300`, reads `getPublishedStories()`. Editorial grid of `StoryCard`s. Gate the nav link on `count > 0`; the page itself renders a valid (empty-but-indexable) shell if somehow reached with zero stories — never a 500.
- `app/verhalen/[slug]/page.tsx` — **Server Component**, `export const revalidate = 300`, **`export const dynamicParams = true`** and **do NOT rely on `generateStaticParams()` to enumerate slugs** — the data seam is `NEXT_PHASE`-guarded to return nothing during `next build` (same guard `getOverrides()` uses), so a build-time slug list would be empty and you'd 404 every story. Render the slug on first request, then ISR-cache it. If `getStoryBySlug` returns null → `notFound()`. `generateMetadata()` per story (title, description = `answer_lede`, canonical, OG type `article` with hero image + `publishedTime`/`modifiedTime`/`authors`). Render `<JsonLd>` graph (Article + Person + BreadcrumbList).
- `app/admin/verhalen/page.tsx` + `app/admin/verhalen/[id]/page.tsx` — **Server Components**, gated by the new `requireEditor()` (admin OR editor). Authoring + queue UI.
- Owner-side: extend `app/beheer/[id]/page.tsx` with a "Verhalen" section listing stories linked to that business and a "Stel een verhaal voor" CTA (creates an `idea` row attributed to the owner; `requireUser` + `canEdit`).

**Server vs Client.**
- Story rendering = **Server** (SEO-critical; full text must be in HTML source for AI crawlers). Markdown→HTML rendered server-side with `micromark` + sanitizer (§7); **never** `allowDangerousHtml` — strip raw HTML and dangerous URLs even though authors are trusted.
- **Client** islands only for: gallery lightbox (`StoryGallery.tsx` — keyboard-accessible, focus-trapped, Escape-to-close — explicitly fixing the map-popup a11y debt), pull-quote reveal animation (guarded by `prefers-reduced-motion` via the planned `src/lib/motion.ts` presets), and a "share" button.

**Components (reusable, token-driven — not ad-hoc utility strings):**
- `StoryCard` (index + business-page strip + related rail) — Playfair headline, hero `aspect-[16/10]`, profiled-business chip, `dek` 2-line clamp, read-time.
- `StoryHero` — full-bleed hero with credit caption, dek, author byline + avatar initial, `published_at` + "bijgewerkt" `date_modified`.
- `PullQuote` — Playfair italic, amber rule (use `--amber-ink`/white, never `--amber` as text).
- `StoryGallery` — accessible lightbox served via `/media/[...key]`.
- `RelatedStories` + `NearbyBusinesses` (the latter reuses `coordsFor()` proximity).
- `StoryStrip` on `BusinessDetailClient.tsx` — "Lees het verhaal" card(s) for stories where this business is `relation='primary'`.

**State & forms.** Admin draft form posts to **Server Actions** (no REST). Autosave-on-blur to `saveStoryDraft`. Photo upload reuses the existing 6 MB Server-Action body limit already set in `next.config.ts`. No client-held trust — owner-isolation and role checks are enforced server-side inside each action.

**Images.** Hero + gallery served through the gated `/media/[...key]` route (approved → public immutable; pending/in-review → session+role gated). Use `next/image` with explicit `sizes`; lazy-load gallery, eager-load hero (LCP). No new CDN transform layer required, but stories are the best first candidate for a future Cloudflare Images pass.

### Engineering — Backend & Infra (Cloudflare) — PRIORITY DEPTH

**Migration `migrations/0003_stories.sql`.** Apply via existing `db:migrate` (`wrangler d1 migrations apply --remote`) and `db:migrate:local`. Forward-only; no destructive change to existing tables. Four tables: `stories`, `story_business`, `story_media`, `story_consent` (full DDL in §5). `id` = `crypto.randomUUID()`; epoch-ms integers for timestamps, consistent with existing tables.

**`editor` role (additive auth change — owned here, touches shared `auth.ts`).**
- `profiles.role` is a free-text TEXT column in SQLite — **no enum/CHECK to alter**; widening to `'owner' | 'editor' | 'admin'` is purely additive, no migration needed for the column itself.
- Add `requireEditor()` to `auth.ts`: `const u = await requireUser(); if (u.role !== 'admin' && u.role !== 'editor') redirect('/beheer'); return u;`. **Do not change `requireAdmin()`** — GDPR purge, settings, and business moderation stay admin-only.
- **Regression guard:** the existing `requireAdmin()` redirects owners to `/beheer`. Verify an `editor` hitting an admin-only page (e.g. `/admin/instellingen`) is still bounced to `/beheer`, and an `editor` hitting `/admin/verhalen` passes. Add a unit test for the three roles × the two guards.
- Promotion: admins set role via `/admin/instellingen` (extend the admin-emails pattern with an editor-emails list, or a one-row UPDATE action). Keep `ensureProfile()`'s first-login-becomes-admin bootstrap untouched.

**Read path — `src/lib/stories.ts`** (mirrors `businessData.ts`/`overrides.ts`/`media.ts` discipline):
- `getPublishedStories()` — `SELECT ... WHERE status='published' ORDER BY published_at DESC`. **Guard with `if (process.env.NEXT_PHASE === 'phase-production-build') return [];`** (identical to `getOverrides()`), and wrap the D1 access in try/catch → `[]` on any failure. Never breaks build or page.
- `getStoryBySlug(slug)` — single `published` story + joined hero/gallery media (`status='approved'` only) + linked businesses. Returns null if not found/not published (→ page calls `notFound()`).
- `getStoriesForBusiness(businessId)` — `published` stories where `story_business.business_id = ?`, for the business-page `StoryStrip` and `mentions` schema.
- `listStoryQueue()` — admin/editor, all statuses, ordered by `updated_at DESC`.

**Write path — `src/app/admin/story-actions.ts`** (Server Actions; role + owner-isolation checks inline at the top of every action — never trust the client):
- `createStory(fd)` — `idea` row. Owner path allowed only if `canEdit(user, businessId)`; sets `author_profile_id`. Editors/admins may create for any business.
- `saveStoryDraft(id, fd)` — UPDATE `body_md`/`dek`/`answer_lede`/`title`; allowed for `editor`/`admin`, or the owning author while `status ∈ {idea, drafting}` only. Server-validate `answer_lede` word count ∈ [40, 60].
- `uploadStoryPhoto(storyId, fd)` — reuse `uploadMedia()` logic with a `story/{storyId}/...` key prefix (parameterize the prefix, or add a sibling `uploadStoryMedia`), magic-byte sniff, 5 MB cap, supersede-old-pending. INSERT `story_media` pending. **Require non-empty `alt_text` before a photo can be approved** (a11y + accessibility-law duty).
- `submitStoryForReview(id)` — guard: `body_md` present, `answer_lede` valid, ≥1 hero media row. status→`in_review`.
- `recordConsent(storyId, fd)` / `grantConsent(storyId)` — write/flip `story_consent`. `grantConsent` editor/admin only.
- `publishStory(id)` — **assert in one logical step**: a `story_consent` row with `consent_status='granted'` exists AND a `story_media` hero row with `status='approved'` exists; else throw a surfaced error and leave status unchanged. On success set `status='published'`, `published_at` (if first publish), `date_modified=now()`; then `revalidateTag('stories')` + `revalidateTag('business:'+id)` for each linked business. **`publishStory` is editor/admin only** — owners can never publish.
- `archiveStory(id)` / consent-withdrawal handler — status→`archived`, purge story R2 objects (R2 delete then D1, the established order), `revalidateTag('stories')` + per-business tags so the strip and listings drop it.

> **D1 has no multi-statement transactions over the binding's `.prepare().run()` calls in the way Postgres does.** Use D1's `db.batch([...])` for the publish flip + media/consent reads-then-write where atomicity matters, or do the asserts as `SELECT`s immediately before the single `UPDATE` and accept the tiny race (acceptable: publish is a single low-frequency editor action). Document whichever you choose.

**Bindings.** No new R2 bucket — reuse `PHOTOS`. **Depends on** the second D1 binding `NEXT_TAG_CACHE_D1` and the `d1-next-tag-cache` override in `open-next.config.ts` (cross-epic dependency). This epic **consumes** that override; it does not implement it. Without it, `revalidateTag` is a no-op and stories lag the 5-minute ISR window (documented acceptable degradation, see §6).

**Caching — the tag mechanism must actually be wired:**
- `revalidateTag(tag)` only invalidates render outputs that **declared** `tag`. In App Router this means the story index and `[slug]` page (and the business detail page) must associate themselves with their tags. Achieve this by reading story data through a `unstable_cache(fn, keys, { tags: [...] })` wrapper (or the Next 16 `'use cache'` + `cacheTag()` directive — confirm the exact API in the local docs) so that `getPublishedStories` is tagged `'stories'` and the business page's story read is tagged `'business:'+id`.
- Public story pages keep `revalidate=300` as the time-based floor; tag invalidation is the instant path on top.
- `llms.txt` (force-static, 1 h) gains an `## Verhalen` section regenerated on its existing cadence — no per-publish invalidation needed.

**Cron.** Add to the shared `scheduled()` export (same Worker; zero extra cost): nightly job (1) flags `published` stories with `date_modified < now() - 9 months` into a "stale-refresh" admin view (freshness discipline; does **not** auto-unpublish); and (2) prunes `archived`-story R2 orphans older than 30 days. Co-locate with the auth-token/session prune cron the backend roadmap already calls for.

**Security & owner-isolation.**
- Owners may only `createStory`/`saveStoryDraft` for a `business_id` they own (`canEdit`) and only in `idea`/`drafting`; they can never publish, grant consent, or moderate media.
- Pending/in-review story media is access-gated in `/media/[...key]` exactly like business media (session + role/owner check on the owning story's business); approved is public-immutable. **Extend `mediaByKey` (or add `storyMediaByKey`) so the serving route can resolve a `story/...` key** — the current `mediaByKey` only reads `business_media`; add a `story_media` lookup branch keyed on the `story/` prefix.
- Rate-limit the owner `createStory` path with the same Cloudflare WAF rate-limit pattern recommended for `/login` (5 req/min/IP).
- Markdown is sanitized server-side before storage-render (XSS hardening even for trusted authors).

**Migrations discipline.** One forward-only migration. `profiles.role` widening is additive (no constraint to alter in SQLite).

### SEO / GEO / AEO

**Schema (`src/lib/schema.ts` additions — match the existing builder + `@graph` pattern in the file):**
- `articleSchema(story, businesses)` → `@type: "Article"` (default; use `NewsArticle` only if genuinely news), `@id: {storyUrl}#article`, `headline`, `description: story.answer_lede`, `image` (abs hero URL), `datePublished` (from `published_at`), **`dateModified`** (from `date_modified` — the freshness lever), `author: { "@type":"Person", "@id": {SITE.url}/auteur/{slug}#person, name }`, `publisher: { "@id": ID.organization }`, `inLanguage: SITE.lang`, `mainEntityOfPage: storyUrl`, `about: [{ "@id": "${businessUrl(primary.id)}#business" }]`, `mentions: [...secondary "#business" @ids]`. **Do NOT emit a duplicate `LocalBusiness` node on the story page** — reference by `@id` so the canonical business entity stays on the business page.
- `personSchema(author)` — author `@id` reused across stories to build a real author entity (E-E-A-T); add `sameAs` when the author has a public profile. Author `@id` is stable per author.
- **Cross-epic win flagged by the SEO audit:** add `dateModified` to `localBusinessSchema()` from `business.updatedAt` while in this file (≈3 lines). Confirm `Business` carries `updatedAt`; if not, this is gated on the businessData/override `updatedAt` plumbing.
- Reuse `breadcrumbSchema([{name:"Home",url:"/"},{name:"Verhalen",url:"/verhalen"},{name:title}])` and `faqSchema()` only if a story carries a genuine, visible Q&A block.

**Review policy (verified against 2026 guidelines).** Stories carry **no** `aggregateRating` and **no** `Review` markup — self-serving review structured data is ineligible for rich snippets for LocalBusiness/Organization, and the existing `schema.ts` correctly omits it. Stories may link out to the business's Google Maps/GBP page; **only if** an actual Google review snippet were ever rendered would the Google logo + attribution + Maps link-back become mandatory (Places API ToS: no caching beyond `place_id`, max 5 reviews/request, attribution required). This epic renders **no** review content, so no Places API surface is touched here.

**Metadata/OG.** Per-story `generateMetadata`: title, `description = answer_lede`, canonical = story URL, OG `type: 'article'` with hero `images`, `publishedTime`/`modifiedTime`/`authors`; Twitter `summary_large_image`. No new OG-image route (hero serves); dynamic per-story OG is a Later.

**Sitemap/llms.txt/robots/hreflang.** Add `published` stories to `sitemap.ts` (`lastModified = date_modified`, `changeFrequency: 'monthly'`, `priority: 0.7`, `images: [hero]`). **The sitemap read must tolerate the build guard** — `sitemap.ts` runs at build; if `getPublishedStories()` returns `[]` during build, stories appear in the sitemap only after the first ISR regeneration of the sitemap route. Keep the sitemap on a short `revalidate` (or accept post-build population) and document it. Add an `## Verhalen` section to `llms.txt` (title + answer-lede + linked business + URL per story — dense AEO signal, regenerated live). `robots.ts` unchanged (already AI-crawler-welcoming). hreflang: none now; design `metadata.alternates.languages` to slot EN in when i18n ships.

**Answer-formatting + freshness (AEO).** The **40–60 word answer-first lede** is a required, server-validated field (`answer_lede`); it doubles as the meta description and `Article.description`. Every publish updates `date_modified`; the 9-month stale-cron keeps the corpus inside the >6-month citation window where >60% of AI citations live.

**Internal linking.** Story → primary business (contextual in-body anchor + `StoryStrip`), story → 1–2 nearby businesses, business page → its stories, `/verhalen` index → all. Topical-cluster linking that lifts the business pages.

**Keywords/topics.** Per maker: "[craft] Amersfoort," "[craft] binnenstad," "maker/ambachtsman + Amersfoort," "wie maakt X." District-level: "verhalen De Kamp," "ondernemers Amersfoort verhaal."

**CWV.** Hero LCP discipline (eager), no layout shift on gallery (reserve aspect-ratio boxes), fully server-rendered HTML so AI crawlers see complete text.

### Design / UX

**Screens:** `/verhalen` index, `/verhalen/[slug]` detail, admin authoring + queue, owner "Verhalen" section, newsletter story block, social card template.

**Reading experience.** Full-bleed `StoryHero` with credit caption; answer-lede in larger serif; generous measure (~66ch); `PullQuote` components breaking the column; in-line gallery + end-of-article lightbox; author byline with avatar initial + `date_modified`; "Over [business]" card with hours/route CTA (the conversion bridge); `RelatedStories` + `NearbyBusinesses` rails. Apply the brand tokens — Playfair headings, paper/forest/amber palette — **not** the orphaned-CMS look the portal currently has.

**States.** Empty (index nav hidden until ≥1 story; page itself renders a valid shell), loading (gallery skeleton — fixes the current map content-flash), error/archived (story 404s cleanly; index just omits it), success (publish toast in admin).

**Responsive.** Single-column reading on mobile; gallery → swipeable; hero crop-aware.

**Motion.** Pull-quote + hero parallax via the shared `src/lib/motion.ts` presets, JS-guarded for `prefers-reduced-motion` (closing the current Framer gap).

**WCAG AA / EN 301 549.** Lightbox focus-trap + Escape (explicit fix for the map a11y debt); alt text required and server-enforced before image approval; contrast-checked credit captions; focus rings use `--amber-ink`/white on imagery, not `--amber` (the global amber-on-cream ring is ~3.2:1 and fails SC 1.4.11 — do not reuse it over photos).

**Deliverables.** Figma: story-detail + index + card + admin-editor frames, with the design-handoff spec (tokens, states, breakpoints, motion). Document `StoryCard`/`PullQuote`/`StoryHero` in the design-system/Storybook recommendation.

### Content / Localization

**Copy needed.** Per story: headline, dek, 40–60 word answer-lede, 700–1000 word body, 2+ pull quotes, photo captions + credits, alt text, profiled-business teaser. Plus an editorial style guide (warm, informal je/jij, the "De Kamp leeft." register), an interview-question bank, and a consent-script for owners.

**Dutch tone.** Matches existing voice — poetic-but-grounded, owner-as-protagonist. **Forbid superlatives stated as fact** ("beste kleermaker") — attribute any claim to a named source (both an accuracy and a self-serving-content safeguard).

**EN/bilingual.** NL-first now. Design `body_md`/`dek`/`answer_lede` to accept a future `locale` dimension — decide with the i18n epic between a `stories.locale` column + slug pairing vs a `story_translations` table. hreflang slot reserved in metadata.

**Workflow.** Pitch → interview → transcribe → draft → owner quote-approval → editorial/legal review → publish → distribute. Translation (Later) goes through the same review + consent gate.

**Alt text.** Mandatory, descriptive, Dutch; server-validated as non-empty before approve.

### Legal / Compliance (GDPR)

- **Lawful basis.** Editorial profiling of named individuals (owners/makers): **consent** for portrait + name + quotes, supported by **editorial legitimate interest**, documented in `story_consent.lawful_basis`. Quotes require explicit owner approval (`quote_approval=1`). Because consent is the operative basis for the portrait/name, withdrawal must be honoured (below).
- **Consent + model release.** A `story_consent` row is mandatory; `model_release_url` points to a stored signed release (R2 object or e-sign link). Publish is blocked until `consent_status='granted'`.
- **Retention/erasure.** Withdrawal → `consent_status='withdrawn'` → auto-archive + R2 purge (reuses the established R2-first-then-D1 ordering from `purgeBusiness`/`rejectMedia`). Article schema, sitemap entry, llms.txt entry, and business-page card all disappear on revalidation; the page 404s. Retain the story body only as long as consent stands; on withdrawal, purge media and either delete the row or strip personal data (name/quotes/portrait) and keep a minimal archived stub for audit.
- **Processors + DPAs.** No new data-layer processor (D1/R2 already EU-resident under Cloudflare's DPA). If transcription is automated it must be an EU-resident ASR under a DPA, or transcribe manually — never a US ASR without transfer safeguards (Schrems II). Resend (EU region) for distribution already sits under the newsletter epic's DPA.
- **Domain law (verified).** **No payments/PSD2/e-money/voucher-VAT in this epic** — that is exclusively the Cadeaukaart epic; nothing here issues or redeems value. **Review-API ToS:** stories embed **no** Places-API review text and **no** `aggregateRating`/`Review` markup; only an optional link-out to the GBP/Maps page (with Google logo + attribution *only if* a snippet is ever shown — it is not here). **Marketing consent:** story distribution rides the newsletter epic's double-opt-in consent; this epic adds no new marketing channel. **Accessibility:** EU EN 301 549 / WCAG 2.1 AA applies (lightbox, alt text, contrast).
- **Right of reply / accuracy.** Quote-approval + owner preview discharges the factual-accuracy duty; rejection reason retained for audit.

### Data / Analytics

**Events.** `story_view`, `story_scroll_depth` (25/50/75/100), `story_engaged_time`, `story_to_business_click` (with `business_id` + CTA type), `story_share_click`, `story_gallery_open`, `newsletter_story_click`, `ai_referral` (referrer/UA = GPTBot/PerplexityBot/Google-Extended/ChatGPT-User). Backend funnel facts (publish cadence, time-in-state) are derivable from D1 timestamps without extra event storage.

**KPIs.** See structured `kpis`. Headline: assisted CTA (story→business) ≥15%; freshness ≥80% within 6 months; cadence ≥1 story/month; business-page uplift +20% impressions/clicks in 30 days post-publish.

**Dashboards.** A "Verhalen" view: stories published/month, median word count, **consent completeness (must be 100%)**, per-story sessions + CTR-to-business, AI-referral share, stale-story count (from the cron flag).

**Instrumentation.** Privacy-first, EU-resident, cookieless analytics (§7 — Plausible EU and/or Cloudflare Web Analytics) so no cookie-banner burden. Avoid bloating D1 with raw event rows — keep aggregates only if needed.

### Operations / Owner-relations

**Human workflow.** Editor maintains calendar + backlog in `/admin/verhalen`. Batch ~3 interviews per outing to protect cadence. Keep a 2-story "ready" buffer.

**Onboarding owners.** A one-page "Zo werkt een verhaal" explainer + consent script; owner gets a preview link and quote-approval; owner receives social assets on publish (the incentive).

**Moderation/SLAs.** Owner-proposed `idea` → editor triage ≤5 business days. Quote-approval reminder after 3 days. Consent-withdrawal → archive within 24 h.

**Support.** "Mijn verhaal aanpassen/verwijderen" handled via the existing GDPR/erase channel; corrections via the editor.

*(Product/PM and Growth covered inline: PM owns the phase gate, cadence commitment, and the i18n/newsletter dependency sequencing; Growth owns the newsletter block + social distribution + owner-repost loop.)*

---

## 5. Data model & API

**`migrations/0003_stories.sql`**

```sql
-- Stories: the editorial content type.
CREATE TABLE stories (
  id            TEXT PRIMARY KEY,                 -- crypto.randomUUID()
  slug          TEXT NOT NULL UNIQUE,             -- /verhalen/{slug}
  title         TEXT NOT NULL,
  dek           TEXT,                             -- standfirst / subtitle
  answer_lede   TEXT,                             -- 40-60 word answer-first chunk (=meta desc / Article.description)
  body_md       TEXT,                             -- Markdown body (sanitized on render)
  status        TEXT NOT NULL DEFAULT 'idea',     -- idea|drafting|in_review|ready|published|archived
  hero_media_id TEXT,                             -- FK -> story_media.id (approved hero); nullable until approved
  author_profile_id TEXT,                         -- FK -> profiles.id (the editor/author)
  read_minutes  INTEGER,
  published_at  INTEGER,                          -- epoch ms, null until first publish
  date_modified INTEGER,                          -- epoch ms, freshness signal (bumped every publish)
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
-- composite index covers the hot "published, newest first" read
CREATE INDEX idx_stories_status_pub ON stories(status, published_at);
-- slug uniqueness already enforced by the column constraint; explicit index for lookups
CREATE UNIQUE INDEX idx_stories_slug ON stories(slug);

-- Many-to-many story <-> business (primary subject + mentions).
CREATE TABLE story_business (
  story_id    TEXT NOT NULL,
  business_id TEXT NOT NULL,                      -- references seed id, NO FK (matches owner_business pattern)
  relation    TEXT NOT NULL DEFAULT 'primary',   -- primary|mentions
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (story_id, business_id)
);
CREATE INDEX idx_story_business_business ON story_business(business_id);

-- Story photography (reuses PHOTOS R2 bucket + the business_media moderation pattern).
CREATE TABLE story_media (
  id          TEXT PRIMARY KEY,
  story_id    TEXT NOT NULL,
  kind        TEXT NOT NULL,                      -- hero|gallery
  r2_key      TEXT NOT NULL,                      -- story/{story_id}/{uuid}-{hex4}.{ext}
  public_url  TEXT,                               -- /media/{r2_key}, set on approval
  caption     TEXT,
  credit      TEXT,                               -- photographer / source attribution
  alt_text    TEXT,                               -- MANDATORY before approve (a11y + accessibility law)
  ordinal     INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'pending',    -- pending|approved|rejected|superseded
  submitted_by TEXT,
  submitted_at INTEGER NOT NULL,
  reviewed_by  TEXT,
  reviewed_at  INTEGER
);
CREATE INDEX idx_story_media_story ON story_media(story_id, status);
-- the /media route resolves by key; index it so the serving auth-check is O(1)
CREATE UNIQUE INDEX idx_story_media_key ON story_media(r2_key);

-- Consent / model-release gate. Publish is blocked unless a granted row exists.
CREATE TABLE story_consent (
  id              TEXT PRIMARY KEY,
  story_id        TEXT NOT NULL,
  subject_name    TEXT NOT NULL,                  -- the profiled person
  lawful_basis    TEXT NOT NULL,                  -- 'consent+legitimate_interest_editorial'
  model_release_url TEXT,                         -- stored signed release (R2 object or e-sign link)
  quote_approval  INTEGER NOT NULL DEFAULT 0,     -- 0/1 owner approved quotes
  consent_status  TEXT NOT NULL DEFAULT 'pending',-- pending|granted|withdrawn
  granted_at      INTEGER,
  granted_by      TEXT,                           -- profile id of granting editor/admin
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_story_consent_story ON story_consent(story_id);
```

> Note: D1/SQLite does not enforce the FKs above by default; mirror the existing schema's convention (logical FKs, app-enforced) and keep deletes ordered in app code. `business_id` deliberately has no FK to the seed (consistent with `owner_business`/`business_overrides`).

**R2 key convention.** `story/{storyId}/{uuid}-{hex4}.{ext}`, `Cache-Control: public, max-age=31536000, immutable`, served via the existing `/media/[...key]` route (pending → gated, approved → public). The route handler must add a `story_media` lookup branch for `story/`-prefixed keys.

**Server Actions (POST to page origin; no REST routes — consistent with current architecture):**
- `createStory(FormData)` → idea row (owner-isolation: `canEdit`).
- `saveStoryDraft(id, FormData)` → UPDATE (role/author + status guard; answer_lede word-count validation).
- `uploadStoryPhoto(storyId, FormData)` → R2 PUT + INSERT pending `story_media` (magic-byte sniff, 5 MB cap, supersede old pending).
- `submitStoryForReview(id)` → status `in_review` (requires body + valid answer_lede + ≥1 hero).
- `recordConsent(storyId, FormData)` / `grantConsent(storyId)` → `story_consent` (grant = editor/admin).
- `publishStory(id)` → assert granted consent + approved hero → `published` + `published_at` + `date_modified` → `revalidateTag('stories')` + `revalidateTag('business:'+id)` per linked business (editor/admin only).
- `archiveStory(id)` → archive + R2 purge + revalidate.

**Read handlers (server functions, not HTTP; tagged for cache invalidation):** `getPublishedStories()`, `getStoryBySlug(slug)`, `getStoriesForBusiness(businessId)`, `listStoryQueue()` — all `NEXT_PHASE`-guarded + try/catch → `[]`/null.

**Third-party calls/webhooks.** None at the data layer. Distribution: optional Resend broadcast (newsletter epic) — fire-and-forget on publish; no inbound webhook required for this epic.

---

## 6. User flows & state machine

**Story status machine:** `idea → drafting → in_review → ready → published → archived`
- `idea→drafting`: editor/owner starts writing.
- `drafting→in_review`: `submitStoryForReview` (requires body + valid answer_lede + ≥1 hero media).
- `in_review→ready`: editorial+legal pass; consent recorded; owner quote-approval may still be pending here.
- `ready→published`: `publishStory` — **guard: `consent_status='granted'` AND an approved hero exist**, else hard-fail with surfaced reason; status stays `ready`.
- `published→archived`: consent withdrawal, owner request, or de-listing → R2 purge + revalidate; page 404s and drops from all listings/sitemap/llms.txt.
- Any state → `archived` allowed; `archived` is terminal (re-publish requires a fresh consent grant + a new `idea`/`drafting` cycle if data was purged).

**Happy path:** §2 steps 1–7.

**Edge cases & failure handling:**
- **Publish without consent / without approved hero** → action throws; admin sees "Consent niet verleend" / "Geen goedgekeurde hero-foto"; status unchanged.
- **Slug collision** → `UNIQUE` constraint catch → auto-suffix `-2`, `-3`…; surfaced in admin.
- **Hero rejected/superseded after publish** → page falls back to no-hero layout (graceful), admin flagged via the stale/orphan view.
- **D1 unavailable at runtime** → `getPublishedStories()` returns `[]`; `/verhalen` renders a valid empty shell; a missing/failed slug → `notFound()` (404); never a 500.
- **Tag cache not wired (dependency unmet)** → publish succeeds but live update lags ≤5 min (ISR floor) — acceptable degradation, flagged in the runbook.
- **Build-time empty data** → `generateStaticParams` not used for slugs; `dynamicParams=true` renders on first hit. Sitemap may omit stories until its first post-build ISR regeneration — documented.
- **Withdrawal mid-review** → `in_review`/`ready` story cannot proceed to publish; auto-archive + purge.
- **Business de-listed/purged** → `story_business` row orphaned; story rendering tolerates a missing business (drops the strip + that `about`/`mentions` @id); nightly cron flags orphans.
- **Owner edits a published story's facts on their business page** → story `date_modified` unaffected; editor decides whether to refresh and re-publish (which bumps `date_modified`).
- **XSS via Markdown** → sanitizer strips raw HTML and `javascript:`/`data:` URLs server-side before render.

---

## 7. Third-party choices

| Need | Options | EU residency / GDPR | Fit | Cost | Recommendation |
|---|---|---|---|---|---|
| **Authoring model** | (a) MDX-in-repo, (b) D1-backed editor, (c) headless CMS (Sanity/Storyblok) | D1/R2 already EU (Cloudflare DPA); Storyblok has an EU region | (a) devs only, no owner/consent gating, redeploy per story; (b) reuses auth+moderation+R2+GDPR already built; (c) heavy, new processor + cost | (a) €0 (b) €0 (c) €90+/mo | **(b) D1-backed** — consent gating, owner-isolation, instant publish, and GDPR erase all reuse existing patterns; MDX can't gate consent and needs a redeploy per story. |
| **Markdown→HTML (edge-safe)** | `micromark`, `marked`, `markdown-it` | n/a (in-process) | Must run on Workers (no Node-only APIs); output **must be sanitized** | €0 | **`micromark`** (small, standards-compliant, edge-safe) with `allowDangerousHtml:false` + an explicit sanitize pass (allowlist tags/attrs, drop `javascript:`/`data:` hrefs). Render server-side. |
| **Analytics** | Plausible (EU), Cloudflare Web Analytics, GA4 | Plausible EU-hosted + GDPR-clean; CF Web Analytics EU + cookieless; GA4 = US-transfer/Schrems risk + banner | Cookieless = no banner; story funnel events | Plausible ~€9/mo; CF free | **Plausible EU** for custom story-funnel events; **Cloudflare Web Analytics** as the free baseline. Avoid GA4. |
| **Distribution email** | Resend (EU region) | EU region + DPA | Reuses newsletter epic | within newsletter budget | **Resend (EU)** — already the transactional + audience choice. |
| **E-sign / model release** | Manual signed PDF in R2, or an EU e-sign provider | R2 EU; pick an EU e-sign if automated | Low volume → manual is fine | €0 | **Manual signed release stored in R2** at this scale; revisit e-sign only at volume. |
| **Transcription** | Manual, or EU-resident ASR under DPA | Must be EU + DPA | Optional convenience | €0–low | **Manual** (or EU ASR with DPA) — never a US ASR without transfer safeguards. |

---

## 8. Milestones & sequencing

1. **M0 — Decision + DDL + role (0.5–1 wk).** ADR (D1 over MDX, on-demand render decision, sanitizer choice); `0003_stories.sql` written + applied local/remote; `editor` role + `requireEditor()` added with the 3-role × 2-guard unit test; `micromark` + sanitizer chosen. *Deliverable: migration green, role test green, ADR merged.*
2. **M1 — Backend CRUD + state machine (1.5–2 wk).** `stories.ts` read path (NEXT_PHASE-guarded + tagged), `story-actions.ts` write path, owner-isolation, consent gate, `publishStory` revalidate with declared cache tags, `/media` story-key branch, nightly stale/orphan cron. *Deliverable: full lifecycle in admin; consent + hero block publish; tag invalidation verified against the wired override (or fallback documented).*
3. **M2 — Reading experience + routes (1.5–2 wk).** `/verhalen` + `/verhalen/[slug]` (on-demand render verified on Next 16), `StoryCard/StoryHero/PullQuote/StoryGallery/RelatedStories`, business-page `StoryStrip`, owner "Verhalen" section, WCAG AA lightbox (focus-trap + Escape), sanitized Markdown render. *Deliverable: a published story renders on-brand, accessible, and 404s when archived.*
4. **M3 — Schema + AEO + sitemap/llms.txt (0.5–1 wk).** `articleSchema()`/`personSchema()`, `dateModified` on LocalBusiness, sitemap + `llms.txt` `## Verhalen`, per-story metadata/OG, answer-lede validation. *Deliverable: Rich Results test passes Article+Person; story in sitemap + llms.txt; no Review/aggregateRating present.*
5. **M4 — Editorial ops + 3 stories + distribution + analytics (1.5–2 wk).** Style guide, consent scripts, calendar; first real-business profile + 2 more published; newsletter block + social card; Plausible funnel + admin "Verhalen" dashboard; **legal review of the first 3 pieces** (consent, no superlatives-as-fact, no review markup). *Deliverable: 3 live stories, distribution loop closed, KPIs instrumented, legal sign-off.*

---

## 9. Dependencies
- **Production launch + real D1 `database_id` + first deploy** (the app has never been deployed — hard blocker; `database_id` is still the `REPLACE_WITH_…` placeholder).
- **`d1-next-tag-cache` override + `NEXT_TAG_CACHE_D1` binding** — for instant publish invalidation; without it, ≤5-min ISR lag (documented fallback, not a blocker).
- **R2 media + moderation model (Phase 2)** — reused; extended with `story_media` + consent + a `/media` story-key branch.
- **`editor` role addition** — small additive auth change owned here; touches shared `auth.ts`; ships with a regression test.
- **GBP/reviews + `place_id` epic** — soft; cross-link reviews on the uplifted business pages (stories themselves render no review data).
- **i18n epic (next-intl + `[locale]`)** — required only if EN stories are in scope; schema/routes pre-designed for it.
- **Newsletter/subscribers epic** — distribution target (and its consent basis).
- **Business `updatedAt` plumbing** — soft; needed for the `dateModified`-on-LocalBusiness cross-epic win.

## 10. Risks & mitigations
See structured `top_risks`: (1) cadence collapse → 2-story buffer + batch interviews + 9-month stale cron; (2) consent gap / withdrawal not honoured → mandatory `granted` `story_consent` blocking publish + auto-archive+purge on withdrawal; (3) self-serving/review over-claim → Article-only, no Review/aggregateRating, no superlatives-as-fact, legal review of first 3; (4) cannibalising the business page → `about`/`mentions` by `@id`, no duplicate LocalBusiness node, story canonical = story URL; (5) build/cache mis-wiring → on-demand render with `dynamicParams`, declared cache tags, and a verified ≤5-min ISR fallback; (6) Markdown XSS → server-side sanitizer.

## 11. Acceptance criteria / Definition of Done
- [ ] `0003_stories.sql` applied to local + remote D1; build stays green and hermetically seed-only (NEXT_PHASE guard verified in `stories.ts`).
- [ ] `editor` role + `requireEditor()` added; unit test proves owner/editor/admin each resolve correctly against `requireUser`/`requireEditor`/`requireAdmin` (owners still bounce to `/beheer`).
- [ ] Full lifecycle (idea→…→published→archived) works via Server Actions with role + owner-isolation enforced server-side.
- [ ] `publishStory` hard-fails without a `granted` consent row AND an approved hero; status stays `ready` and the reason is surfaced.
- [ ] `/verhalen/[slug]` renders **on-demand** (`dynamicParams=true`, no build-time slug enumeration) and `notFound()`s for missing/archived slugs; `/verhalen` index gates the nav link on count>0.
- [ ] Markdown body is rendered server-side and sanitized (raw HTML stripped; `javascript:`/`data:` URLs blocked).
- [ ] Business detail page shows a `StoryStrip` for its `primary` stories; story links back contextually.
- [ ] `articleSchema()` + `personSchema()` pass Google Rich Results test; `about`/`mentions` reference business `@id`; **no** Review/aggregateRating on stories.
- [ ] `dateModified` emitted on stories (and added to LocalBusiness); `answer_lede` is server-validated to 40–60 words and used as meta description.
- [ ] Published stories appear in `sitemap.ts` (image incl.) and `llms.txt` `## Verhalen`; archived stories are absent from both.
- [ ] Publish invalidates the story index + linked business pages within seconds via **declared** cache tags (tag cache wired), or the ≤5-min ISR fallback is documented and observed.
- [ ] `/media` serves `story/`-prefixed keys with pending→gated / approved→public; alt text enforced before approve.
- [ ] Consent withdrawal → archive + R2 purge + de-link + 404 within 24 h; nightly stale/orphan cron live.
- [ ] Analytics funnel (story_view → story_to_business_click) instrumented; admin "Verhalen" dashboard shows cadence + 100% consent completeness.
- [ ] First real-business profile + 2 more stories published; newsletter block + social card shipped; legal sign-off on the first 3.

## 12. KPIs & success metrics
See structured `kpis`. Primary: ≥1 story/month; ≥80% of stories within the 6-month freshness window; story→business CTA ≥15%; +20% impressions/clicks on the linked business page within 30 days of publish; newsletter featured-story CTR ≥8%; 100% consent completeness (hard gate, not a target).

## 13. Cost
- **One-off:** engineering time only (6–9 wk across teams); €0 in new infrastructure. Photography is the editor's own camera/phone; manual model-release PDFs in R2.
- **Monthly at this scale:** D1 + R2 + Workers stay within the existing lean €0–25/mo envelope (story rows + photos are tiny relative to the photo epic). Optional new line item: **Plausible EU ~€9/mo** (or €0 with Cloudflare Web Analytics only). Resend distribution rides the newsletter epic's plan. No CMS, no e-money, no per-story redeploy. **Net new ≈ €0–9/month.**

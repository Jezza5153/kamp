# Design System & Brand Playbook — "Ondernemers van de Kamp"

> **Status:** Authoritative cross-cutting standard. Every epic (launch, cadeaukaart, google-reviews, agenda, owner-story, newsletter, bilingual, design-system, analytics, owner-ops, discovery) MUST conform.
> **Owners:** Design/UX + Engineering (Frontend), jointly.
> **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (`@theme inline`) · Framer Motion · lucide-react · maplibre-gl. Cloudflare Workers (OpenNext) · D1 · R2.
> **Brand line:** **"De Kamp leeft."** Warm editorial; paper + forest-green + amber; Playfair Display × Inter.

This playbook is the shared contract between designers and front-end devs. It defines the **tokens**, the **component catalog with required states + a11y**, **iconography**, **imagery/R2 pipeline**, **responsive rules**, **motion principles**, the **WCAG 2.1 AA bar**, and **design-ops**. It is specific to the real files in this repo — token names, file paths, and class strings below are the ones actually in the codebase (`src/app/globals.css`, `src/lib/site.ts`, the component inventory). Do not invent parallel tokens.

---

## 0. Brand principles (the non-negotiables)

1. **Editorial, not "directory".** Every public surface should feel like a curated magazine of the district, not a Yelp clone. Playfair for voice, Inter for utility, generous whitespace, film-grain warmth.
2. **The portal is part of the brand.** `/beheer` and `/admin` are currently design-system orphans (plain CMS forms). They are B2B trust surfaces — an owner judges the whole product by them. All new portal work uses the same tokens + components as the public site.
3. **Tokens first, ad-hoc never.** No raw hex, no `text-[15vw]`, no one-off `px-7`. If a value isn't a token yet, add the token, then use it. A rebrand must be a one-file change in `globals.css`.
4. **AA is a gate, not a goal.** Color, focus, motion, keyboard, and touch all ship at WCAG 2.1 AA. A component is not "done" until its a11y row in the catalog is checked.
5. **Dutch-first, i18n-ready.** Copy is NL today; never hardcode strings in a way that blocks the `bilingual` epic. `<html lang>` is set from `SITE.lang`.
6. **Freshness is visible.** 2026 AEO weights recency heavily; the UI must expose `updatedAt`/`dateModified` where it builds trust (business detail, owner stories, agenda) — design treats "laatst bijgewerkt" as a first-class element, not an afterthought.

---

## 1. Design tokens

All tokens live in `src/app/globals.css` under `:root` and are surfaced to Tailwind v4 via `@theme inline`. **Tailwind v4 has no `tailwind.config.js` color block — `@theme inline` IS the config.** Adding a token = add the CSS var in `:root` + map it in `@theme inline`.

### 1.1 Color (shipped today — do not change values without a contrast re-audit)

| Token | Value | Tailwind class | Role | AA note |
|---|---|---|---|---|
| `--background` | `#f6f0e2` | `bg-background` | Page (cream paper) | base surface |
| `--paper` | `#fbf7ef` | `bg-paper` | Card surface | base surface |
| `--foreground` | `#211c17` | `text-foreground` | Body ink | 13:1 on bg ✓ |
| `--charcoal` | `#18140f` | `bg-charcoal` | Footer / hero overlay | dark surface |
| `--deep-green` | `#163a29` | `text/bg-deep-green` | Brand primary | 9.8:1 on bg ✓ |
| `--deep-green-600` | `#1f4d38` | `…-deep-green-600` | Hover | — |
| `--amber` | `#c9822b` | `text/bg-amber` | **Fill / decoration only** | ✗ fails AA as text on light (~3.2:1) |
| `--amber-600` | `#b3701f` | `…-amber-600` | Fill hover | — |
| `--amber-ink` | `#8a5a16` | `text-amber-ink` | **Amber TEXT / links / labels** | ~5.6:1 on bg ✓ |
| `--gold` | `#d9a86a` | `text/bg-gold` | Hero accent (on dark) | — |
| `--clay` | `#b5603e` | `…-clay` | Terracotta / **error** | verify per surface |
| `--warm-brown` | `#4a3326` | `text-warm-brown` | Secondary text | 7:1 on bg ✓ |
| `--sage` | `#d8e0d2` | `bg-sage` | Success surface | surface only |
| `--stone` | `#e7decf` | `border-stone` | Borders / dividers | non-text |
| `--stone-600` | `#c8bba4` | `…-stone-600` | Stronger borders | non-text |

**Hard rules:**
- **Amber as text → use `--amber-ink`, never `--amber`.** `--amber` is fill/decoration only (the comment in `globals.css` is law).
- **Status semantics:** open/success = emerald (`emerald-500/15` surface), closing-soon/pending = amber fill / `gold/20` surface, closed/neutral = stone, error/destructive = `--clay`. Never encode status by color alone (see §7).
- **Two color tokens are currently empty:** `SITE.social.instagram` and `SITE.social.facebook` in `src/lib/site.ts`. These are not visual tokens but they break the Organization `sameAs` entity anchor — **fill before `launch`** (Footer + schema both read them).

### 1.2 Type scale — **NEW token layer to add (design-system epic, do first)**

Today heading sizes are ad-hoc (`text-[15vw]`, `text-7xl`, `text-5xl`…). Codify a scale so a type change is one file. Add to `:root`:

```css
:root {
  /* Type scale — fluid where it matters, fixed elsewhere */
  --text-hero:        clamp(3.5rem, 12vw, 9rem);   /* Hero H1 only */
  --text-display:     clamp(2.5rem, 6vw, 3.5rem);  /* page H1 */
  --text-heading-lg:  2rem;                          /* section H2 */
  --text-heading:     1.5rem;                        /* card / block H3 */
  --text-body-lg:     1.25rem;                        /* lede */
  --text-body:        1rem;                           /* default */
  --text-label:       0.6875rem;                      /* 11px uppercase eyebrows */
  --leading-tight:    1.08;
  --leading-snug:     1.3;
  --leading-normal:   1.6;
  --tracking-eyebrow: 0.18em;
}
@theme inline {
  --text-hero: var(--text-hero);
  --text-display: var(--text-display);
  --text-heading-lg: var(--text-heading-lg);
  --text-heading: var(--text-heading);
  --text-body-lg: var(--text-body-lg);
  --text-body: var(--text-body);
  --text-label: var(--text-label);
}
```

Usage: `className="text-display"` (Tailwind v4 generates `text-*` from the `--text-*` namespace). Migration: replace `text-[15vw]`→`text-hero`, page `text-5xl/4xl`→`text-display`, section `text-3xl`→`text-heading-lg`, eyebrows `text-[11px/13px] uppercase tracking-widest`→`text-label tracking-[var(--tracking-eyebrow)]`.

| Role | Token | Font | Weight | Where |
|---|---|---|---|---|
| Hero H1 | `--text-hero` | Playfair | 700 | `Hero` only |
| Page H1 | `--text-display` | Playfair | 700 | every page top |
| Section H2 | `--text-heading-lg` | Playfair | 700 | section headers |
| Block H3 | `--text-heading` | Playfair | 700 | card titles, detail blocks |
| Lede | `--text-body-lg` | Inter | 400 | intro paragraphs |
| Body | `--text-body` | Inter | 400 | everything |
| Eyebrow/label | `--text-label` | Inter | 600 uppercase | category chips, meta |

Fonts are already wired: `--font-serif` (Playfair Display) and `--font-sans` (Inter) in `@theme inline`. Headings get Playfair globally via the `h1..h6` rule. **Do not put Playfair on UI controls** (buttons, inputs, badges) — those are Inter.

### 1.3 Spacing scale — **NEW token layer to add**

No `--space-*` exists today; padding is raw (`py-20`, `gap-16`). Adopt an 8px-based ladder (4px for fine work) and stop choosing per-component values.

```css
:root {
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem;    --space-6: 1.5rem; --space-8: 2rem;
  --space-12: 3rem;   --space-16: 4rem;  --space-20: 5rem;
  --space-section: clamp(4rem, 9vw, 7rem); /* vertical rhythm between page sections */
}
```

Rule: **section padding = `py-[var(--space-section)]`; card padding = `--space-6`; control padding = `--space-3`/`--space-4`.** Tailwind's default spacing scale stays available, but new work prefers the named ladder for sections.

### 1.4 Radius (shipped)

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `0.75rem` | chips, small badges |
| `--radius` (`-md`) | `1.25rem` | inputs, default cards |
| `--radius-lg` | `2rem` | feature cards, modals |
| `--radius-xl` | `2.75rem` | hero panels |
| pill | `rounded-full` | primary CTAs, toggles, status pills |

**Consistency fix for portal:** public CTAs are `rounded-full`; the owner-portal submit is `rounded-xl`. Standardize all primary action buttons to `rounded-full` (see Button component §4.1).

### 1.5 Elevation (shipped)

| Token | Use |
|---|---|
| `--shadow-card` | resting cards (subtle, green-tinted) |
| `--shadow-float` | hover/elevated cards, popovers, modals |

Only two levels. Don't introduce new shadows — promote to `--shadow-float` on hover, nothing in between.

### 1.6 Motion tokens — **NEW `src/lib/motion.ts` to add**

Framer durations/easings are hardcoded per component. Centralize:

```ts
// src/lib/motion.ts
export const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;
export const FADE   = { duration: 0.6, ease: EASE_EDITORIAL };
export const FADE_FAST = { duration: 0.3, ease: EASE_EDITORIAL };
export const SPRING = { type: "spring", stiffness: 260, damping: 24 } as const;
export const CARD_HOVER = { duration: 0.3, ease: EASE_EDITORIAL };

/** JS-layer reduced-motion guard (complements the CSS @media rule). */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

All Framer `transition={...}` props consume these constants. See §6.

---

## 2. Tailwind v4 + Figma mapping

### 2.1 Tailwind v4 contract
- Source of truth = `globals.css` `@theme inline`. **There is no JS color config.** Reviewers reject PRs that add raw hex in JSX/TSX or `style={{color:'#...'}}`.
- Custom tokens become utilities automatically: `--color-deep-green` → `bg-deep-green`, `--text-display` → `text-display`, `--radius-lg` → `rounded-lg`.
- Arbitrary values (`text-[15vw]`, `bg-[#fff]`) are **lint-flagged** for color/type/spacing — allowed only for genuinely one-off geometry (e.g. `min-h-[88vh]` on the hero is fine; a one-off hex is not).

### 2.2 Figma library (to stand up — design-system epic)
Create **"De Kamp — Foundations"** Figma file with these published libraries, names matching the CSS vars 1:1 so handoff is mechanical:
- **Color styles:** `background`, `paper`, `foreground`, `charcoal`, `deep-green`, `deep-green-600`, `amber`, `amber-600`, `amber-ink`, `gold`, `clay`, `warm-brown`, `sage`, `stone`, `stone-600`. Annotate `amber` with "FILL ONLY" and `amber-ink` with "text on light".
- **Text styles:** `Hero`, `Display`, `Heading LG`, `Heading`, `Body LG`, `Body`, `Label` — Playfair vs Inter per §1.2.
- **Effect styles:** `Shadow / Card`, `Shadow / Float`.
- **Variables (Figma modes):** one collection `theme` with the spacing + radius ladder so auto-layout uses real tokens.
- **Components** mirror the catalog in §4 with variant props matching the state matrix.

**Token sync:** keep Figma↔code in sync manually until volume justifies tooling. If automating, use **Tokens Studio for Figma** exporting W3C design-token JSON → a small script writing `globals.css` `:root`. EU/GDPR: no PII in design files; fine for any processor.

---

## 3. Iconography (lucide-react)

- **Library:** `lucide-react` only. No mixed icon sets. No inline custom SVG except **brand glyphs** (Instagram, Facebook, Google "G") which lucide doesn't carry authentically.
- **Sizing:** 16px (inline/meta), 20px (controls), 24px (nav/feature). Use `size={20}` prop, `strokeWidth={2}` default, `1.75` for large display icons.
- **Color:** inherit `currentColor`; never hardcode. Decorative icons get `aria-hidden="true"`; meaningful icons get an accessible name (visible label or `aria-label`).
- **Fixes mandated by current state:**
  - Footer "Instagram" uses `Camera` with `href="#"` → replace with a **real Instagram brand SVG** and the live URL from `SITE.social.instagram`. Email uses `Send` → acceptable but prefer `Mail`.
  - `BusinessDetailClient` Facebook link uses `Share2` (wrong) → use the **Facebook brand glyph**. Instagram `Camera` is acceptable but align with the footer's brand glyph for consistency.
  - **Google Reviews (google-reviews epic):** the Google "G" must be the official multicolor logo asset, shown **unobscured** with attribution when no map is present (Places policy). Store the official asset in `/public`, not a lucide stand-in.
- **Per-epic icon picks (consistency registry — add to it, don't reinvent):** `MapPin` (address), `Clock` (hours), `Star` (featured/rating), `ArrowUpRight` (card CTA), `Gift` (cadeaukaart), `CalendarDays` (agenda), `Mail`/`Send` (newsletter), `Languages`/`Globe` (bilingual toggle), `ShieldCheck` (GDPR/consent), `Pencil` (edit), `Check`/`X` (moderate).

---

## 4. Component catalog

Every component MUST implement the **required state matrix** below and pass its **a11y row**. "Implement" means the state is visually designed and reachable, not just theoretically possible.

**Required states (the contract):** `default · hover · focus-visible · active · disabled · loading · empty · error` — apply the ones that make sense for the component (a static badge has no loading; a list has empty; a form has error). The catalog notes which are mandatory.

### 4.1 Core primitives to build (`src/components/ui/`) — design-system epic

These replace the ad-hoc class strings duplicated across `AanmeldenForm`, `/beheer`, `/admin`.

| Component | Mandatory states | a11y must-haves |
|---|---|---|
| **`Button`** (variants: `primary` deep-green fill / `secondary` outline / `ghost` / `danger` clay) | default, hover, focus-visible, active, **disabled**, **loading** | role inferred; `aria-busy` when loading; spinner has `aria-label="Bezig…"`; min target 44×44 (§5); never color-only state — disabled also dims + `cursor-not-allowed` |
| **`KampInput` / `KampTextarea` / `KampSelect`** | default, focus, **disabled**, **error** | `<label>` always (no placeholder-as-label); `aria-invalid` + `aria-describedby` → error text on error; error text in `--clay` **plus** an `AlertCircle` icon |
| **`Alert`** (`success`/`warning`/`error`/`info`) | default | `role="status"` (success/info) or `role="alert"` (error); icon + text, not color alone; `--sage`/`gold`/`clay`/`sage` surfaces |
| **`Badge` / `Chip`** | default, active (for filters) | `aria-pressed` when interactive; `--radius-sm`; label readable at `--text-label` |
| **`Card`** | default, hover | focusable only if whole card is a link; one elevation step on hover |
| **`Skeleton`** | loading | `aria-hidden`; respects reduced-motion (no shimmer if reduced) |
| **`EmptyState`** | empty | icon + serif heading + reset CTA (pattern already good in `BusinessExplorer`) |
| **`Modal`/`ConfirmDialog`** | default, focus-trap | focus trap, `Esc` to close, `role="dialog"` `aria-modal`, return focus to trigger; **required for `/admin` GDPR purge** (currently text-only confirm) |

**Button — canonical primary (the standard everywhere, public + portal):**
```tsx
// rounded-full, deep-green, amber focus halo, 44px min height
"inline-flex items-center justify-center gap-2 rounded-full bg-deep-green
 px-6 py-3 min-h-11 text-body font-sans font-medium text-white
 transition-colors hover:bg-deep-green-600
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-ink focus-visible:ring-offset-2
 disabled:opacity-50 disabled:cursor-not-allowed"
```
Note the focus ring uses **`--amber-ink`**, not `--amber` (see §7.2 focus fix).

### 4.2 Existing public components (keep, with noted fixes)

| Component | Status | Required fixes |
|---|---|---|
| `Hero` | strong | migrate `text-[15vw]`→`text-hero`; parallax must no-op under reduced-motion (§6) |
| `Navbar` | strong | **IA mismatch:** desktop 6 vs mobile 7 items. Single source `src/lib/nav.ts` (`NAV_ITEMS`) consumed by both. Decide canonical IA (add `Praktisch` to desktop or footer-only) |
| `BusinessCard` | strong | add 2-line `shortDescription` (`line-clamp-2`, `text-warm-brown`) for UX + AEO entity signal |
| `OpenBadge` | strong (SSR-safe) | keep null-initial hydration pattern; ensure status conveyed by **text + dot**, not dot alone |
| `HoursTable` | good | **contrast:** `text-white/40` for closed slots on charcoal likely <4.5:1 → raise to `text-white/60` min and verify |
| `DistrictMap` | strong (real MapLibre) | **keyboard:** add "Sla kaart over" skip-link; markers are DOM-created → mirror an accessible list, `Esc` closes popup + returns focus; loading skeleton during async `maplibre-gl` import |
| `BusinessExplorer` | strong | reuse `Chip`, `KampInput` primitives once built |
| `Footer` | good | real social glyphs + live URLs; newsletter becomes real form (§ newsletter epic); Privacy/Cookies links must resolve before launch |
| `BusinessDetailClient` | strong | surface "laatst bijgewerkt" (`updatedAt`); Reviews section → real `GoogleReviewsStrip` (google-reviews epic) |

### 4.3 Portal/admin uplift (owner-ops + launch)

`/beheer` and `/admin` must adopt: a branded shell (`src/app/beheer/layout.tsx` with `Navbar` + business sub-header), Playfair page H1s, `KampInput`/`Alert`/`Button` primitives, and the `ConfirmDialog` for destructive actions. The diff view in `/admin` (clay strikethrough → green proposed) must add **icons + ARIA** (`Old:`/`New:` labels) so it's not color-only.

### 4.4 New components per epic (build to the catalog contract)

| Epic | New components | Notes |
|---|---|---|
| `cadeaukaart` | `GiftCardHero`, `AmountSelector`, `CheckoutForm` (Mollie/iDEAL), `RedeemStatus` | iDEAL bank-select is a `KampSelect`; success/error are `Alert`; loading on payment redirect |
| `google-reviews` | `GoogleReviewsStrip`, `ReviewCard`, `RequestReviewButton`, `GoogleLogo` | logo + attribution unobscured; ≤5 reviews; link back to Maps; **never** AggregateRating stars on own page |
| `agenda` | `EventCard`, `EventList` (grouped by month), `EventDateBadge` | empty state when no upcoming; `dateModified` visible |
| `owner-story` | `StoryHero`, `ArticleBody`, `AuthorCard`, `StoryCard` | author = founder Person; show datePublished + dateModified |
| `newsletter` | `NewsletterForm` (server action), `ConsentCheckbox`, `SubscribeResult` | GDPR consent required (§ a11y + legal); double opt-in |
| `bilingual` | `LanguageSwitcher` | `Globe`/`Languages` icon; `hreflang` is metadata, switcher is UI |

---

## 5. Responsive & mobile-first

- **Breakpoints (Tailwind defaults, do not add custom):** `sm 640 · md 768 · lg 1024 · xl 1280`. Design mobile-first; layer up with `md:`/`lg:`.
- **Canonical layouts:** card grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; control bars `flex-col gap-4 lg:flex-row`; content `max-w-3xl`/`max-w-2xl` for reading width.
- **Nav:** `hidden md:flex` desktop / `md:hidden` hamburger. Mobile menu uses `AnimatePresence` height animation (reduced-motion → instant).
- **Touch targets: 44×44 CSS px minimum** (WCAG 2.5.5 / AA 2.5.8 24px floor, but design to 44). Applies to nav links, toggles, map markers (currently 22px dots — bump hit area via padding/`::before`), and all `Button`s (`min-h-11`).
- **Map:** `height: min(68vh, 560px)`, full-width; never let it exceed viewport on mobile.
- **No fixed pixel widths on content.** Use `clamp()` for hero/display type (already tokenized in §1.2).

---

## 6. Motion (Framer Motion)

**Principles:**
1. Motion is **editorial polish, never required for comprehension.** Content must be fully usable with zero animation.
2. **Honor `prefers-reduced-motion` in two layers:** the CSS `@media` rule in `globals.css` (already present, collapses to `0.001ms`) AND a JS guard for Framer (parallax, layout animations, `AnimatePresence`) since CSS doesn't reach Framer's JS-driven transforms.
3. **Tokens, not magic numbers.** Use `FADE`, `FADE_FAST`, `SPRING`, `CARD_HOVER`, `EASE_EDITORIAL` from `src/lib/motion.ts` (§1.6).

**Reduced-motion pattern (mandatory for any Framer component):**
```tsx
import { FADE, prefersReducedMotion } from "@/lib/motion";
const reduce = prefersReducedMotion();
<motion.div
  initial={reduce ? false : { opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={reduce ? { duration: 0 } : FADE}
/>
```
For the Hero parallax and `BusinessExplorer` `AnimatePresence`, when `reduce` is true: disable scroll-scale transforms and use `mode="popLayout"` with `transition={{duration:0}}`.

**Standard motions:** card hover lift `y:-4` + shadow-card→float over `CARD_HOVER`; grid item enter/exit scale+opacity over `FADE`; nav frost over scroll (transform-only, no layout thrash); reveal-on-scroll via the CSS `.reveal` keyframe (already reduced-motion safe).

---

## 7. WCAG 2.1 AA — standard + checklist

The bar is **WCAG 2.1 Level AA**. The following are project-specific gates pulled from the current-state audit.

### 7.1 Color & contrast
- Text contrast ≥ **4.5:1** (normal), ≥ **3:1** (large ≥24px or 19px bold).
- **`--amber` is never text on light.** Use `--amber-ink`.
- `HoursTable` closed-slot text must clear 4.5:1 on charcoal (raise opacity).
- Non-text UI (borders, focus, icons conveying state) ≥ **3:1** (SC 1.4.11).

### 7.2 Focus — **fix shipped today**
The global `:focus-visible` ring is `2px solid var(--amber)` — `--amber` on `--background` is ~3.2:1 (borderline) and **invisible on dark surfaces**. **Change the ring to `--amber-ink` with a white offset halo** so it works on both light and dark:
```css
:focus-visible {
  outline: 2px solid var(--amber-ink);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(255,255,255,0.6); /* halo for dark surfaces */
  border-radius: 4px;
}
```
Verify ≥3:1 on `--background`, `--deep-green`, and `--charcoal`.

### 7.3 Keyboard
- Every interactive element reachable + operable by keyboard; visible focus everywhere.
- `DistrictMap`: skip-link before the map; popups keyboard-reachable; `Esc` closes and returns focus to the marker.
- `Modal`/`ConfirmDialog`: focus trap + `Esc` + restore focus.
- No keyboard traps; logical tab order matches visual/reading order.

### 7.4 Structure & semantics
- **`<html lang="nl">`** set from `SITE.lang` (currently missing — zero-cost fix, do at launch). Bilingual epic sets `lang` per locale.
- One `<h1>` per page; headings nest without skipping levels.
- Forms: `<label for>` on every field; errors via `aria-invalid` + `aria-describedby`; **never placeholder-as-label**.
- Status by **text/icon + color**, never color alone (`OpenBadge`, admin diff, alerts).
- Images: meaningful `alt`; decorative `alt=""`/`aria-hidden`.

### 7.5 Motion & media
- `prefers-reduced-motion` honored in CSS **and** Framer (§6).
- No auto-playing motion that can't be paused; `OpenBadge` 60s refresh is fine (no motion).

### 7.6 Per-component a11y sign-off checklist (paste into each PR)
```
[ ] Contrast AA (text 4.5:1 / large 3:1 / non-text 3:1)
[ ] Visible focus, amber-ink ring, works on light AND dark
[ ] Fully keyboard operable; logical tab order; Esc where modal
[ ] Labels/roles/aria-* correct; state not color-only
[ ] Touch target ≥44px
[ ] Reduced-motion path verified (CSS + Framer)
[ ] lang correct; copy externalized (no hardcoded string blocking i18n)
[ ] All required states present (default/hover/focus/active/disabled/loading/empty/error as applicable)
```
Run the **`design:accessibility-review`** skill on each new screen before handoff.

---

## 8. Imagery, photography & the R2 + placeholder pipeline

### 8.1 Style
- **Mood:** natural light, warm tones, real district/owners — documentary editorial, not stock. Crop to the brand `aspect-[4/5]` for cards, `16:9`/`21:9` for covers.
- **Legibility:** any text-over-image uses the existing dual-gradient overlay; never place body text on un-overlaid photos.
- **Film-grain** (`.grain`, 3.5%) is the house texture on premium surfaces — keep subtle.

### 8.2 Current pipeline (R2, shipped)
- Bucket `kamp-photos` (binding `PHOTOS`). Upload via owner Server Action → magic-byte MIME sniff (JPEG/PNG/WebP/AVIF) → 5MB cap → R2 key `business/{id}/{uuid}-{hex}.{ext}` → `business_media` pending row → admin approval → served via gated `/media/[...key]`.
- **No CDN transform layer yet** — images served at original resolution from the Worker. **Design implication:** specify and enforce export sizes at upload (owner-facing guidance: "min 1200px wide, landscape for covers, portrait 4:5 for cards"). Until a transform layer (Cloudflare Images) lands, the front-end must use `next/image` sizing + `sizes` to avoid shipping oversized bytes.

### 8.3 Generative placeholders (the design standard while photos are sparse)
Many of ~67 businesses lack photos. Until owners upload, render a **deterministic branded placeholder**, never a broken image or generic gray box:
- A `BusinessImage` placeholder that draws a paper-textured panel in the business's **category accent color** (same accents the map markers use) + the category lucide icon + the business initial in Playfair. Deterministic from `business.id` so it's stable across renders.
- This keeps the grid premium and on-brand, and gives AI crawlers a labeled visual. Pattern lives in `BusinessImage`/`BusinessCard`.
- OG image is already server-rendered branded fallback via `next/og` (`/opengraph-image`) — keep that as the social fallback.

### 8.4 Loading & empty
- Any client-loaded image area (the map, gallery) shows a `Skeleton` in the paper/category tone — no content flash on the `#f4ecdb` map background.
- Galleries with zero approved photos show the generative placeholder, not an empty region.

---

## 9. Design-ops

### 9.1 File structure
```
src/
  app/globals.css            # tokens (source of truth) + @theme inline
  lib/site.ts                # NAP, social, lang (brand constants)
  lib/motion.ts              # motion tokens (to add)
  lib/nav.ts                 # NAV_ITEMS single source (to add)
  components/ui/             # primitives: Button, KampInput, Alert, Badge, Card,
                             #   Skeleton, EmptyState, Modal  (to add)
  components/                # composed public components (existing)
docs/roadmap/playbooks/      # this playbook + siblings
```

### 9.2 Handoff specs
Use the **`design:design-handoff`** skill to produce a spec per screen: layout + token references (by name, never hex), component props, **all interaction states**, responsive behavior per breakpoint, edge/empty/error cases, and motion (durations reference `src/lib/motion.ts` names). Handoff is incomplete without the state matrix and the a11y checklist (§7.6).

### 9.3 Design QA (definition of done for any UI PR)
```
[ ] Uses tokens only — no raw hex / ad-hoc text-[..] / one-off spacing
[ ] Matches Figma component + variant names
[ ] All required states implemented and screenshotted
[ ] a11y checklist §7.6 passed (run design:accessibility-review)
[ ] Reduced-motion verified
[ ] Portal/admin work uses the shared primitives (no CMS-plain forms)
[ ] No hardcoded user-facing string that blocks bilingual epic
[ ] "Laatst bijgewerkt"/dateModified surfaced where the page carries it
```
Pair with **`design:design-critique`** for hierarchy/consistency review at exploration and final stages.

### 9.4 Versioning & change control
- **Tokens are versioned with the repo.** Any token add/rename = PR touching `globals.css` + `@theme inline` + Figma styles in the same change, with a one-line CHANGELOG note in this playbook's header area.
- **Never rename a shipped color value silently** — it's a contrast-audit trigger (§7.1).
- Component API changes (props/variants) follow semver intent: additive = minor, breaking variant rename = coordinate a sweep across `src/components`.
- Keep Figma and code names **1:1**; drift is a bug.

### 9.5 Documentation
- Stand up a lightweight component gallery — **Ladle** (lighter than Storybook, Vite-based, fits the lean budget) documenting `Button`, `KampInput`, `Alert`, `Badge`, `BusinessCard`, `OpenBadge`, `HoursTable`, `DistrictMap`, plus a tokens page. This is the onboarding surface for the multi-team setup; it also doubles as visual-regression fodder for QA.

---

## 10. Applies to which epics

| Epic | How this playbook governs it |
|---|---|
| **launch** | Set `<html lang="nl">`; fix focus ring (`--amber-ink`); fill `SITE.social`; real social glyphs + resolved Privacy/Cookies links; portal/admin brand uplift; HoursTable contrast fix; first full a11y pass. |
| **design-system** | Owns this doc. Build token layers (type/spacing/motion), `src/components/ui/` primitives, Figma foundations, Ladle gallery, `nav.ts`. |
| **cadeaukaart** | Build `GiftCardHero`/`AmountSelector`/`CheckoutForm` to the state matrix; iDEAL select = `KampSelect`; payment loading/error = `Button` loading + `Alert`. |
| **google-reviews** | `GoogleReviewsStrip` to policy (Google logo unobscured + attribution + Maps link-back, ≤5 reviews, no own-page AggregateRating stars); `RequestReviewButton` in portal. |
| **agenda** | `EventCard`/`EventList` with empty state + visible `dateModified`; consistent `CalendarDays` iconography. |
| **owner-story** | `ArticleBody`/`AuthorCard` editorial type scale; surface datePublished + dateModified; author = founder Person. |
| **newsletter** | `NewsletterForm` server action with GDPR `ConsentCheckbox`, success/error `Alert`, accessible labels; replaces the mailto: footer. |
| **bilingual** | `LanguageSwitcher`; copy externalized (no hardcoded NL in JSX); `lang` per locale; tokens are locale-agnostic. |
| **analytics** | UI for consent banner + any dashboards use the same primitives + a11y bar; events instrument the shared `Button`/form components. |
| **owner-ops** | Portal shell + `ConfirmDialog` for GDPR purge; admin diff view a11y; self-service signup form using `KampInput`/`Alert`. |
| **discovery** | `BusinessExplorer`/`BusinessCard`/`DistrictMap` refinements (card descriptions, map keyboard a11y, skeletons) all follow §4–§8. |

---

## 11. Quick reference — do / don't

**Do:** use `--amber-ink` for amber text · build to the 8-state matrix · run `design:accessibility-review` before handoff · keep Figma names = CSS var names · honor reduced-motion in CSS **and** Framer · make the portal as branded as the public site · surface freshness.

**Don't:** put raw hex or `text-[15vw]` in JSX · use `--amber` as text · ship a form with placeholder-as-label · encode status by color alone · animate something required for comprehension · leave `SITE.social` empty at launch · let desktop/mobile nav drift.

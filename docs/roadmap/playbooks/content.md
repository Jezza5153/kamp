# Content & Localization Style Guide

> Cross-cutting playbook · `id: content` · Owner: Content/Localization lead
> Every epic that ships words to a human or a crawler MUST follow this guide.
> Project: **Ondernemers van de Kamp** — the local guide to De Kamp, Amersfoort.
> Stack reality: Next.js 16 (App Router) · React 19 · Tailwind v4 · D1 + R2 on Cloudflare Workers · Resend for email · Dutch-first content, NL-only today, EN on the roadmap.

---

## 0. How to use this guide

This is the **words layer** of the roadmap. It does not decide *what* features ship (that's Product) or *how* schema is emitted (that's the SEO/GEO/AEO playbook) — it decides **how every string reads**, in NL and (later) EN, for three audiences:

- **B2C** — locals and visitors of Amersfoort discovering shops, cafés and restaurants.
- **B2B** — the ~67 business owners who self-manage their listing in `/beheer`.
- **Admin** — the district association curating/moderating in `/admin`.

When in doubt, the hierarchy is: **truthful → clear → warm → on-brand → SEO-shaped**. Never sacrifice an earlier item for a later one. A beautiful sentence that overstates what a shop offers is a defect.

### Single sources of truth (do not duplicate strings)

| What | Where it lives today | Rule |
|---|---|---|
| Site name, tagline, NAP, description | `src/lib/site.ts` (`SITE`) | All copy that names the guide pulls from here. Never hardcode "Ondernemers van de Kamp" or the domain in JSX. |
| District street list | `src/lib/site.ts` (`DISTRICT_STREETS`) | The five streets are canonical; never invent or reorder. |
| Category names + blurbs | `src/lib/categories.ts` (`CATEGORIES`) | Category copy is authored once here. |
| Per-business copy | `src/data/businesses.ts` seed → D1 approved overrides merged in `src/lib/businessData.ts` | Owner edits flow through moderation; the seed is the fallback. |
| UI microcopy (future) | `src/messages/nl.json` (to be created in the bilingual epic) | Once i18n lands, **no user-facing string lives in JSX**. |

---

## 1. Brand voice & tone

**Brand promise in three words:** *warm, local, knowledgeable.* The signature line is **"De Kamp leeft."** — it appears in the logo, hero, and footer and sets the register for everything else.

### Voice attributes

| We are | We are not | Litmus test |
|---|---|---|
| Warm & human ("kloppend hart", "straatportret van makers") | Corporate, salesy, hypey | Would a friendly local who actually walks De Kamp say this out loud? |
| Local & specific (street names, real people, real dishes) | Generic ("a great place for everyone") | Could this sentence describe any shopping street in NL? If yes, rewrite. |
| Knowledgeable (history, makers, provenance) | Show-offy, jargon-heavy | Does it teach the reader something true about De Kamp? |
| Confident but honest | Overclaiming ("the best", "world-famous") | Can we prove it from a public source or owner statement? |
| Inviting (je/jij, active voice) | Distant (u-form, passive) | See §1.1 below. |

### 1.1 Address & register (NL)

- **Use `je`/`jij`** throughout public B2C copy and the owner portal. This is already the house voice ("Ontdek elke ondernemer", "Beheer je zaak").
- **Exception:** legal/compliance text (privacy statement, cookie notice, GDPR copy) may use a more neutral register, but stay `je` where natural — formality is not the same as clarity.
- **Active voice, present tense.** "De Kamp telt 67 ondernemers" not "Er worden 67 ondernemers geteld op De Kamp."
- **No exclamation-mark inflation.** "De Kamp leeft." earns its period. One `!` per page maximum, and never in error copy.
- **No emoji** in body content, schema, alt-text, or metadata. (Emoji are acceptable only inside owner-submitted social handles we link out to, which we don't author.)

### 1.2 Tone shifts by surface

| Surface | Tone | Example |
|---|---|---|
| Hero / editorial / category blurbs | Poetic, evocative | "Het meest wereldse stukje horeca van Amersfoort." |
| Business descriptions | Warm but factual | "Napolitaanse pizza uit de houtoven, op een steenworp van de Kamperbinnenpoort." |
| Owner portal (`/beheer`) | Reassuring, plain, branded | "Je wijziging is ingediend. We controleren hem even — meestal binnen een werkdag." |
| Admin (`/admin`) | Terse, functional, neutral | "3 wijzigingen wachten op controle." |
| Errors / validation | Calm, helpful, no blame | "Dit e-mailadres ziet er niet helemaal goed uit. Controleer het even." |
| Transactional email (Resend) | Warm, signed by "Team De Kamp" | See §4.3. |

> **Gap to fix:** the owner portal copy today is plain/functional ("Wijzigingen worden ter controle ingediend") and misses the brand warmth. Owners judge the whole product by `/beheer`. The owner-ops and design-system epics MUST apply §1.2 portal tone.

---

## 2. Terminology glossary (NL canonical)

Use these exact terms. Consistency is an entity-SEO signal (the district as a named entity) and a UX signal.

| Use | Don't use | Notes |
|---|---|---|
| **De Kamp** | "de Kamp-buurt", "Kamp-wijk", "het Kampkwartier" (in body) | "De Kamp" is the entity. `Winkelgebied De Kamp` and `Kampkwartier` are registered `alternateName`s in schema only. |
| **ondernemer** | "merchant", "vendor", "zaak-eigenaar" | The people. Plural "ondernemers" is in the brand name. |
| **zaak / vermelding** | "listing" (in NL body), "bedrijf" (cold) | "vermelding" = the directory entry the owner manages. "zaak" = the physical business. |
| **de historische binnenstad van Amersfoort** | "het centrum", "downtown" | Anchors location for GEO. |
| **openingstijden** | "uren", "hours" (in NL) | — |
| **Nu open / Gesloten / Sluit zo** | "Open now"/"Closed" (NL pages) | Matches `OpenBadge` statuses. |
| **Kamp Cadeaukaart** | "giftcard", "tegoedbon", "voucher" | Product name is fixed-case. |
| **Koopzondag** | "shopping Sunday" | Event term. |
| **De Kamp leeft.** | any paraphrase | Tagline is sacred. Never translate in NL contexts; EN handling in §10.4. |
| **Beheer je zaak** | "Login", "Dashboard" (public-facing) | The owner entry point. "Login" only as a sub-label. |
| **Aanmelden** | "Register", "Sign up" | Owner acquisition CTA. |

### 2.1 The five streets (canonical spelling)

`Kamp` · `Achter de Kamp` · `Grote Sint Jansstraat` · `Zuidsingel` · `Weverssingel`

Never abbreviate ("Gr. St. Jansstraat"), never lowercase the street type. These map 1:1 to `DISTRICT_STREETS` and the `streetSegment` union in `src/data/businesses.ts`.

### 2.2 The business-description formula

Two fields exist on every `Business`: `shortDescription` and `longDescription`. They have distinct jobs.

**`shortDescription`** — used in cards, list views, llms.txt, and meta descriptions. **One sentence, 90–140 characters, answer-first.** It must state *what the business is + one distinctive thing*, with no fluff.

```
[Wat het is] + [één onderscheidend detail] + (optioneel) [locatie-anker].
```

| Good | Why |
|---|---|
| "Houtoven-pizzeria met Napolitaans deeg en seizoensgroenten, recht tegenover de Kamperbinnenpoort." | Type + detail + anchor, 1 sentence, extractable. |
| "Zelfgebrande koffie en huisgebakken taart in een lichte hoekzaak aan de Zuidsingel." | Concrete, sensory, located. |

| Bad | Fix |
|---|---|
| "Een gezellige plek voor iedereen!" | No type, no detail, no anchor, hype. → name the cuisine/product. |
| "Wij zijn een bedrijf dat zich richt op kwaliteit en service." | Says nothing. → what do they *sell/make*? |

**`longDescription`** — the editorial "Het verhaal" block. 60–160 words. Structure:

1. **Sentence 1 = the answer-first chunk (40–60 words max):** what the business is, where, and why it's distinctive. This sentence is the AEO extraction target — see §7.
2. **Body:** the people behind it (links to `publicPersonName`/`publicPersonRole`), the craft/provenance, what a visitor actually experiences.
3. **No opening hours, prices, or phone numbers in prose** — those are structured fields; duplicating them in prose causes drift and NAP inconsistency.

**Description checklist (every business):**
- [ ] `shortDescription` is one sentence, 90–140 chars, names the business type.
- [ ] `longDescription` opens with a 40–60 word self-contained answer.
- [ ] No claim that can't be sourced (no "beste", "enige", "wereldberoemd" without proof).
- [ ] Street/location anchor present at least once.
- [ ] No hours/price/phone duplicated from structured fields.
- [ ] Reads aloud naturally in `je`-register.
- [ ] No em-dash overuse; max one per sentence.

---

## 3. UX-writing / microcopy standards

### 3.1 Buttons & CTAs

- **Verb-first, specific, in `je`-register.** The button says what happens.
- Sentence case, no trailing punctuation, no ALL CAPS in the label text (uppercase is a *style* applied via CSS `tracking-widest`, not typed).

| Context | Label | Avoid |
|---|---|---|
| Owner acquisition | "Meld je zaak aan" | "Verzenden", "Submit" |
| Save an edit (portal) | "Wijziging indienen" | "Opslaan" (it isn't saved live — it's submitted for review) |
| Photo upload | "Foto uploaden" | "Bestand kiezen" |
| Newsletter | "Schrijf je in" | "Aanmelden" (reserved for owners) |
| Gift card | "Koop een Kamp Cadeaukaart" | "Kopen" |
| Review request (owner) | "Vraag een review" | "Google review" |
| Magic-link login | "Stuur me een inloglink" | "Login" |

> **Critical nuance:** in `/beheer`, owner edits are *not* saved live — they go to moderation (the D1 `business_overrides` queue). The button must say **"Wijziging indienen"** (submit), never "Opslaan" (save). Promising "saved" when it's queued is a trust bug.

### 3.2 The moderation / "in afwachting van goedkeuring" copy

This is the single most important microcopy in the product because it manages owner expectations across the D1 override + ISR-window pipeline (edits go live only after admin approval *and* the 300 s ISR window, or instant once the d1-next-tag-cache override lands). Copy must set **honest, calm expectations** without exposing internals.

| State | NL copy | When |
|---|---|---|
| Just submitted (edit) | "Bedankt! Je wijziging staat in de wachtrij. We controleren hem — meestal binnen één werkdag. Je hoeft niks te doen." | After `submitOverride` |
| Pending (returning to page) | "In afwachting van goedkeuring — je laatst ingediende wijziging wordt nog gecontroleerd." | `pendingFieldsFor` returns a row |
| Approved (live) | "Je wijziging is goedgekeurd en staat live op je pagina." | override `status='approved'` |
| Rejected (with reason) | "Deze wijziging is niet doorgevoerd. Reden: {reason}. Pas je tekst aan en dien hem opnieuw in." | `status='rejected'` |
| Rejected (no reason) | "Deze wijziging is niet doorgevoerd. Neem contact op via info@ondernemersvandekamp.nl als je vragen hebt." | reason null |
| Photo pending | "Je foto is geüpload en wacht op goedkeuring. Zodra hij is goedgekeurd, verschijnt hij op je pagina." | media `status='pending'` |
| Photo too large | "Deze foto is te groot (max 5 MB). Probeer een kleinere of comprimeer hem eerst." | `?photo=too_large` |
| Photo wrong type | "Dit bestandstype kunnen we niet gebruiken. Upload een JPEG, PNG, WebP of AVIF." | MIME sniff reject |

**Rules for moderation copy:**
- Never expose "D1", "ISR", "cache", "300 seconds". Say "binnen één werkdag" for review, "kan een paar minuten duren" for going live.
- Always tell the owner the **next action** (or explicitly "je hoeft niks te doen").
- Rejection copy is never punitive — it's a "try again" with a path forward.
- Status labels in admin (`/admin`) may be terse and English-ish enums internally, but anything an **owner** sees is full NL per the table.

### 3.3 Empty states

Pattern: **acknowledge → explain → offer one action.** The existing search empty state is the gold standard: *"Probeer een andere categorie of zoekterm — of zet 'Nu open' uit."*

| Surface | Empty state copy |
|---|---|
| Search/filter no results | "Niks gevonden. Probeer een andere categorie of zoekterm — of zet 'Nu open' uit." |
| Owner has no listings yet | "Je hebt nog geen zaak gekoppeld. Heb je een zaak op De Kamp? Meld hem aan, dan koppelen we hem aan je account." |
| Agenda no upcoming events | "Nog geen evenementen gepland. Kom snel terug — De Kamp staat nooit lang stil." |
| Admin moderation queue empty | "Geen wijzigingen in de wachtrij. Alles is bij." |
| Reviews not yet connected (owner) | "Koppel je Google-profiel om je reviews hier te tonen en te beantwoorden." |

### 3.4 Errors & validation

- **Calm, specific, no blame, no codes.** Tell the user what's wrong and how to fix it.
- Never "Er is iets misgegaan" alone — always add the recovery path.
- Form-field errors are inline and field-specific.

| Situation | NL copy |
|---|---|
| Empty required field | "Vul je {veld} in om verder te gaan." |
| Bad email | "Dit e-mailadres ziet er niet helemaal goed uit. Controleer het even." |
| Magic link expired | "Deze inloglink is verlopen. Vraag een nieuwe aan — ze zijn 15 minuten geldig." |
| Magic link already used | "Deze link is al gebruikt. Vraag voor de zekerheid een nieuwe aan." |
| Rate-limited login | "Je hebt net al een inloglink aangevraagd. Wacht even en check je inbox (ook de spam-map)." |
| Generic server error | "Er ging iets mis aan onze kant. Probeer het zo nog eens — blijft het misgaan, mail dan info@ondernemersvandekamp.nl." |
| Payment failed (Cadeaukaart) | "De betaling is niet gelukt. Er is niets afgeschreven. Probeer het opnieuw of kies een andere methode." |
| Newsletter double opt-in pending | "Bijna klaar! Check je inbox en klik op de bevestigingslink om je inschrijving af te ronden." |

### 3.5 Confirmation & destructive actions

- Destructive actions (GDPR purge, account deletion) require **typed confirmation** and explicit, plain-language consequence copy.
- Example for GDPR erase in `/admin`: "Hiermee verwijder je álle gegevens en foto's van **{naam}** — definitief en onomkeerbaar. Typ de naam van de zaak om te bevestigen."

---

## 4. Transactional & lifecycle email (Resend)

All system email goes through Resend (keep the EU region for GDPR). Copy rules:

### 4.1 Global email rules
- **Sender:** "Team De Kamp" <info@ondernemersvandekamp.nl> (from `getResendConfig()` / `app_settings.resend_from`).
- **One job per email.** A magic link is a magic link; don't bolt on a newsletter pitch.
- **Plain, warm, signed.** End with "Tot snel op De Kamp, Team De Kamp."
- **Unsubscribe** footer on any non-transactional email (newsletter) — required (see §9 / GDPR).
- Subject lines: sentence case, no emoji, under 50 chars.

### 4.2 Magic-link email
```
Onderwerp: Je inloglink voor De Kamp
---
Hoi,

Klik op de knop hieronder om in te loggen en je zaak te beheren.
De link is 15 minuten geldig en werkt één keer.

[ Inloggen op De Kamp ]   ({callbackUrl})

Heb je dit niet aangevraagd? Dan kun je deze mail negeren.

Tot snel op De Kamp,
Team De Kamp
```

### 4.3 Owner-application acknowledgement (owner-ops epic)
```
Onderwerp: We hebben je aanmelding ontvangen
---
Hoi {naam},

Bedankt voor het aanmelden van {zaak} op De Kamp. We bekijken je aanmelding
en nemen binnen een paar werkdagen contact met je op om je vermelding te koppelen.

Tot snel op De Kamp,
Team De Kamp
```

---

## 5. Editorial guidelines — owner stories

The owner-story strand turns a directory entry into a named-entity article. These pages carry `Article`/`BlogPosting` schema with `author` linking to the business's founder `Person` node (per the SEO playbook), so **the author entity and dates matter as much as the prose.**

### 5.1 Story structure
1. **Headline (≤ 65 chars):** concrete, names the person or craft. "Hoe Sanne van [zaak] haar koffie zelf brandt" beats "Een verhaal over koffie".
2. **Standfirst / dek (1 sentence, 40–60 words):** the answer-first summary — who, what, where on De Kamp, why it matters. This is the AEO extraction chunk and the meta description source.
3. **Body (400–800 words):** the person, the origin, the craft, a moment a visitor can picture. Quote the owner directly at least once.
4. **Close:** a soft pointer to visit + link to the business detail page (`/ondernemers/[id]`) — internal-linking for topical authority.

### 5.2 Editorial rules
- [ ] Every factual claim is attributable (owner quote or public source).
- [ ] `author` = a real person; map to the `publicPersonName`/`publicPersonRole` on the business so the schema `Person @id` resolves.
- [ ] `datePublished` set on publish; **`dateModified` updated on every substantive edit** — freshness is a primary 2026 AI-citation signal (>60% of AI citations are pages updated in the last 6 months).
- [ ] One internal link to the business detail page; one to a related category or the district page.
- [ ] No invented quotes. If we paraphrase, we don't wrap it in quotation marks.
- [ ] Photos credited; alt-text per §6.
- [ ] Refresh cadence: review every story at least 2×/year; bump `dateModified` when anything material changes (new owner, moved, menu shift).

> **Freshness policy (applies site-wide):** approved owner edits already touch `updatedAt`. The SEO playbook surfaces `dateModified` from `updatedAt` in JSON-LD. Content's job: make sure edits are *substantive enough to deserve* a fresh date — don't game freshness with whitespace changes.

---

## 6. Alt-text & caption standards

Alt-text is accessibility-first and AEO-second. The site serves owner photos via `/media/[...key]` and seed images.

### 6.1 Alt-text rules
- **Describe what's in the image, factually, in NL.** 8–16 words.
- **Front-load the subject.** "Houtoven met flammende pizza" not "Een foto van een pizza in...".
- **No "afbeelding van" / "foto van"** — screen readers already announce "image".
- **Name the business where natural** for hero/shopfront images: "Gevel van {zaak} aan de {straat}."
- **Decorative-only images** (grain texture, dividers) get `alt=""` (empty), never omitted.
- **Never stuff keywords.** Alt-text that reads like a search query is a defect and an a11y failure.

| Image | Good alt | Bad alt |
|---|---|---|
| Shopfront | "Groene gevel van Koffie & Co aan de Zuidsingel met terras" | "koffie amersfoort de kamp beste koffie zuidsingel" |
| Product | "Handgemaakte zilveren ring op een houten toonbank" | "foto van een ring" |
| Person | "Eigenaar Sanne achter de espressomachine" | "vrouw" |

### 6.2 Captions
- Captions are optional editorial text (not alt-text). Visible, warm, can add context alt-text can't ("Sanne brandt elke maandag een nieuwe batch").
- Credit owner-submitted photos: "Foto: {zaak}" when known.

### 6.3 Owner-submitted photos
When an owner uploads via `/beheer`, we get the binary but **no alt-text** (the `business_media` row stores no caption). Policy: the moderation step (`approveMedia`) is where an admin or the owner-ops flow assigns alt-text. **Never auto-generate keyword alt-text.** If no alt-text is provided at approval, use a safe factual default: "Foto van {zaak} op De Kamp, Amersfoort."

---

## 7. SEO / AEO copywriting (aligned to the SEO/GEO/AEO playbook)

This section is the **copy contract** behind the structured-data and freshness work owned by the SEO playbook. Schema lives in `src/lib/schema.ts`; *the words schema points at* live here.

### 7.1 Answer-first chunking (the 40–60 word rule)
2026 AI engines cite **direct, extractable answers**. Every FAQ answer, category intro, `shortDescription`, story dek, and the district description follows:

- **First 40–60 words answer the question completely**, as a standalone unit that makes sense pulled out of context.
- Then optional elaboration.
- No "Welkom! Op deze pagina vind je..." preambles before the answer.

**FAQ answer template:**
> **Q:** Wat voor zaken vind je op De Kamp?
> **A (40–60 woorden):** Op De Kamp in de historische binnenstad van Amersfoort vind je ruim 67 zelfstandige ondernemers: restaurants en cafés, winkels en makers, mode, interieur en verzorging. Het gebied loopt over vijf straten — Kamp, Achter de Kamp, Grote Sint Jansstraat, Zuidsingel en Weverssingel — en is gratis toegankelijk.

> **Audit fix:** existing FAQ answers vary from ~30 to ~150 words. Bring every answer (business detail `buildFaqs()`, category pages, `over-de-kamp`, `praktisch`, `cadeaukaart`) to the 40–60 word band. Track in §11 checklist.

### 7.2 Headings & meta
- **One `<h1>` per page**, contains the primary entity + location ("Restaurants op De Kamp in Amersfoort").
- **Title tag:** `{specifiek} | Ondernemers van de Kamp` (template already in `layout.tsx`); the specific part is ≤ 60 chars, leads with the entity.
- **Meta description:** 140–160 chars, answer-first, pulls naturally from `shortDescription`. No keyword stuffing, no duplicate descriptions across pages.
- **Internal link anchor text is descriptive**: "bekijk alle koffiezaken op De Kamp", never "klik hier" / "lees meer".

### 7.3 Entity-first writing
- Name **De Kamp**, **Amersfoort**, the **street**, and the **person** explicitly — pronouns and "ons gebied" don't anchor entities for AI.
- Reinforce the district as an entity: each page should mention "De Kamp" + "Amersfoort" at least once in body copy (not just nav).
- This complements the schema `sameAs`/`@id` work; copy and schema must agree (the visible NAP must equal `src/lib/site.ts`).

### 7.4 llms.txt copy
`/llms.txt` is generated from live data (`shortDescription`, hours, specialties). So **the quality of `/llms.txt` is the quality of `shortDescription`.** Fix descriptions per §2.2 and llms.txt improves automatically. When the agenda epic ships, add a clean `## Evenementen` section with one answer-first line per event.

### 7.5 SEO copy checklist (per page/epic)
- [ ] H1 names entity + Amersfoort/De Kamp.
- [ ] First on-page paragraph is a 40–60 word answer.
- [ ] Meta description 140–160 chars, unique, answer-first.
- [ ] FAQ answers in the 40–60 word band, matching visible text exactly (schema must mirror copy).
- [ ] Internal links use descriptive anchors.
- [ ] No fabricated ratings/claims; no copy implying star averages we can't show (self-serving review policy — schema correctly omits `aggregateRating`).
- [ ] `dateModified`-worthy content is genuinely fresh.

---

## 8. Reviews copy (google-reviews epic) — compliance-shaped

Google's Places API policy and the 2024+ self-serving-review rule constrain copy here. **Content rules:**

- **We do not author or paraphrase Google review text.** We display it as returned (via the owner's GBP OAuth read) with the required Google attribution, or we link out to Google Maps.
- **No "best-rated" / "5 sterren" marketing copy** derived from reviews on the business's own page — self-serving review snippets aren't eligible and overclaiming is a trust/compliance risk.
- **Review-request copy** (owner-facing button "Vraag een review") and the share message owners send customers must be neutral and never incentivized:
  > "Vond je het leuk bij {zaak}? Een korte review op Google helpt ons enorm. Dank je wel!"
  Never "Laat een 5-sterren review achter" / never offer a discount for a review (against Google policy).
- **Attribution copy** is mandatory when reviews are shown without a map: the Google logo + "Reviews via Google" + a "Bekijk op Google Maps" link, unobscured.

---

## 9. Newsletter & consent copy (newsletter epic) — GDPR-shaped

- **Double opt-in is mandatory.** Signup copy must state what they'll get and how often.
  > "Schrijf je in voor de De Kamp-nieuwsbrief: nieuwe ondernemers, events en koopzondagen. Eén mail per maand, niet vaker. Uitschrijven kan altijd."
- **Explicit consent checkbox**, unticked by default: "Ik ga akkoord met de [privacyverklaring] en wil de nieuwsbrief ontvangen."
- **Confirmation email** copy: §3.4 "double opt-in pending" + a single confirm button.
- **Unsubscribe** in every newsletter footer: "Geen zin meer? Uitschrijven kan met één klik." → working unsubscribe-token link.
- **No pre-checked consent, no bundling** newsletter consent into another action (e.g. buying a gift card) — separate, explicit opt-in.

> **Replace the mailto: stubs.** The footer "Schrijf je in" and `AanmeldenForm` currently use `mailto:`. Copy above assumes the real server-action + Resend + D1 `newsletter_subscriptions` flow from the newsletter/owner-ops epics.

---

## 10. Bilingual NL/EN workflow & quality bar (bilingual epic)

NL is the **source language and the canonical voice**. EN is a faithful, idiomatic translation — not a parallel rewrite, and never machine-only.

### 10.1 Architecture assumptions (set by the bilingual epic)
- `<html lang="nl">` is set immediately (zero-cost WCAG + SEO win) regardless of EN timing — today the lang attribute is missing.
- Strings move out of JSX into `src/messages/nl.json` (source) + `src/messages/en.json` (translation), per the i18n scaffolding.
- `hreflang` (`nl`, `en`, `x-default`) is emitted via Next's `metadata.alternates.languages` once EN exists (SEO playbook owns the tags; content owns the copy).
- The `Business` type gains EN fields only when we commit to translating per-business copy — until then EN business pages fall back to NL with a visible "Deze beschrijving is nog niet vertaald" note rather than auto-translating live.

### 10.2 Who translates what

| Content type | Translation method | Reviewer |
|---|---|---|
| UI microcopy (buttons, errors, nav, moderation) | Human translation by a Dutch-fluent EN speaker, from `nl.json` | Content lead sign-off |
| Marketing/editorial (hero, category blurbs, district story) | Human transcreation — meaning + tone over literal | Content lead |
| Owner stories | Human translation; quotes kept in original language with EN gloss | Content lead |
| Per-business `shortDescription`/`longDescription` | MT draft (DeepL, EU servers) → **mandatory human review** | Content lead or the owner |
| Owner-submitted text (any language) | See §10.5 | Moderation/admin |
| Legal/GDPR/privacy | Human, by someone who understands NL legal copy; do not MT | Legal/Compliance sign-off |

### 10.3 Quality bar
- **No raw machine output ships.** MT is a *draft*; a human always reviews tone, terminology (§2 glossary needs an EN column — build it), and false friends.
- **Terminology consistency:** maintain a NL↔EN glossary alongside §2. "ondernemer" → "local business / maker" (context-dependent, never "entrepreneur" in card copy). "De Kamp" and "Amersfoort" are **never translated**. Street names are **never translated**.
- **Length parity awareness:** EN runs ~10–20% longer than NL — verify buttons/badges don't overflow (coordinate with design-system tokens).
- **Locale formatting:** dates, currency (€), and 24h time follow each locale's convention; NL "ma/di/wo", EN "Mon/Tue/Wed".

### 10.4 The tagline & untranslatables
- **"De Kamp leeft."** stays Dutch even on EN pages (it's a brand mark). Optionally subtitle once on first EN encounter: *"De Kamp leeft." — "De Kamp is alive."* Decide once; document; don't vary.
- District/street names, "Koopzondag", "Cadeaukaart" stay NL with a parenthetical EN gloss on first use per page.

### 10.5 Handling owner-submitted text (any language)
Owners may submit edits in NL, EN, or mixed. Policy:
- **Store the owner's submission as-is in the override** (`business_overrides.fields`); never silently translate before moderation.
- **Moderation copy-check** (§11) applies regardless of language: factual, on-brand, no overclaiming.
- If an owner submits EN and we only show NL today: admin asks for NL (template: "Bedankt! Kun je deze tekst ook in het Nederlands aanleveren? Dan zetten we hem live.") or the admin translates and the owner approves.
- Once bilingual ships, an owner-submitted EN string becomes the EN field for that business after the same moderation pass.

---

## 11. Moderation copy-review checklist (admin runs this on every override)

The admin in `/admin` approves/rejects owner edits (`moderateOverride`). Beyond factual checks, run the **content gate**:

- [ ] **Truthful** — no unverifiable superlatives ("beste", "enige", "#1").
- [ ] **On-brand voice** — warm, `je`-register, no hype, no emoji.
- [ ] **Terminology** — uses glossary terms (§2); street names canonical.
- [ ] **Description formula** — `shortDescription` 1 sentence/90–140 chars; `longDescription` opens with a 40–60 word answer.
- [ ] **No structured-data duplication** — hours/price/phone not pasted into prose.
- [ ] **No prohibited content** — no competitor disparagement, no discount-for-review, no medical/legal claims.
- [ ] **Length sane** — fits the card and detail layouts.
- [ ] **Spelling/grammar** — NL spelling correct (de/het, capitalization of street names).
- [ ] If rejecting, **reason copy** follows §3.2 (specific, fixable, kind).

---

## 12. Tooling & recommendations

| Need | Tool | Notes |
|---|---|---|
| Machine translation drafts (NL→EN) | **DeepL** (EU servers, GDPR-clean) | Draft only; never ship raw. DeepL handles NL idiom better than generic MT. |
| Dutch spell/grammar + style | **LanguageTool** (self-host or EU cloud) | Run on `businesses.ts`, `categories.ts`, message files. Catches de/het, false friends in EN. |
| i18n message management | **next-intl** with `src/messages/{nl,en}.json` | Aligns with App Router; keys are typed. |
| Readability / answer-chunk length | Word-count lint script in CI | Fail if `shortDescription` > 140 chars or a FAQ answer > 60 words (see §13). |
| Glossary enforcement | A `terminology.json` + a grep/lint check in CI | Flags forbidden terms ("listing", "Kamp-buurt", em-dash overuse). |
| Email templates | **Resend** (EU region) + React Email | One template per lifecycle email; copy from §4. |
| Alt-text review | Manual at moderation + a CI check that no `alt` is empty on non-decorative images | Never auto-generate keyword alt-text. |

### 13. Suggested CI guards (lean, zero new services)
Add to the QA/Release epic. Example lint (Node, run in GitHub Actions):

```ts
// scripts/lint-content.ts — fail the build on content-contract violations
import { businesses } from "../src/data/businesses";

const errors: string[] = [];
for (const b of businesses) {
  if (b.shortDescription.length > 140)
    errors.push(`${b.id}: shortDescription ${b.shortDescription.length} > 140 chars`);
  if (b.shortDescription.length < 60)
    errors.push(`${b.id}: shortDescription too thin (${b.shortDescription.length})`);
  if (/\b(beste|enige|wereldberoemd|nummer 1|#1)\b/i.test(b.longDescription))
    errors.push(`${b.id}: unverifiable superlative in longDescription`);
  if (/\b\d{1,2}:\d{2}\b/.test(b.longDescription))
    errors.push(`${b.id}: looks like opening hours leaked into prose`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
```

```bash
# Run locally before commit
npx tsx scripts/lint-content.ts
```

---

## 14. Applies to which epics

| Epic | How this playbook applies |
|---|---|
| **launch** | Fill `SITE.social`; bring all FAQ answers to 40–60 words; set `<html lang="nl">`; audit every `shortDescription` (§2.2, §7); finalize all microcopy/error strings (§3). **Blocking for launch.** |
| **cadeaukaart** | Product name "Kamp Cadeaukaart" fixed; purchase/error/confirmation copy (§3.4, §3.5); no incentivized-review tie-in. |
| **google-reviews** | §8 in full — attribution copy, non-incentivized review-request copy, no self-serving overclaim. |
| **agenda** | Event copy voice, empty state (§3.3), answer-first event lines into llms.txt (§7.4), `Koopzondag` terminology. |
| **owner-story** | §5 in full — structure, author entity, dates/freshness, internal linking, alt-text. |
| **newsletter** | §9 in full — double opt-in, consent checkbox, unsubscribe, confirmation copy. |
| **bilingual** | §10 in full — workflow, quality bar, glossary EN column, owner-submitted text handling, tagline policy. |
| **design-system** | Portal/admin tone uplift (§1.2); button labels (§3.1); shared form/input copy; EN length-parity coordination (§10.3). |
| **analytics** | Names of events/funnels should use glossary terms; consent-banner copy aligns with §9 GDPR tone. |
| **owner-ops** | Moderation copy checklist (§11); owner-acquisition + application emails (§4.3); rejection-reason copy (§3.2); alt-text assignment at approval (§6.3). |
| **discovery** | `shortDescription`/`longDescription` formula (§2.2) directly powers cards, search, and llms.txt; BusinessCard description excerpt copy. |

---

## 15. Quick reference card (pin this)

- Voice: **warm · local · knowledgeable**, `je`-register, active, no emoji, one `!` max.
- Description: short = 1 sentence/90–140 chars; long opens with a 40–60 word answer.
- Buttons say what happens: **"Wijziging indienen"** not "Opslaan".
- Moderation copy: honest, calm, always a next step; never expose internals.
- Errors: what's wrong + how to fix; never blame, never a bare "iets misgegaan".
- SEO/AEO: answer-first 40–60 words; name **De Kamp + Amersfoort + the street + the person**.
- Reviews: never author/paraphrase, never incentivize, always attribute.
- Newsletter: double opt-in, explicit consent, working unsubscribe.
- EN: human-reviewed always; **De Kamp / Amersfoort / street names never translated**; tagline stays Dutch.
- Single sources of truth: `src/lib/site.ts`, `src/lib/categories.ts`, `src/data/businesses.ts`, `src/messages/nl.json`.

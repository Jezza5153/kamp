# Backend plan — owner self-service for Ondernemers van de Kamp

*Audit of 7 specialists + lead-architect synthesis. Status: plan for approval (not yet built).*

## Goal
A business owner emails the admin → the admin issues a login → the owner logs in and edits **only their own listing** (text, opening hours, photos, contact/socials/price/tags). The admin **moderates** (approves/rejects) every change and photo before it goes live. The public site must stay fast and SEO-strong.

## Recommendation: Supabase + an "overrides" layer (keep the static site)
**Stack**
| Layer | Choice | Why |
|---|---|---|
| App / hosting | Next.js 16 on **Vercel, EU (fra1)** | Public pages stay SSG/ISR exactly as today; only the new portal/API routes run server-side. |
| Database | **Supabase Postgres, EU (Frankfurt)** | Adds the write store the project lacks today; row-level security (RLS) enforces "edit only your own business" at the DB. |
| Auth | **Supabase Auth — magic link**, admin-issued invites | Matches the real flow: admin adds the owner's email, owner clicks a one-time link. No passwords to manage. |
| Image storage | **Supabase Storage** — private `owner-uploads` + public `business-photos` buckets | One EU provider/DPA; uploads land private + pending until approved, then promoted to public. |
| Admin/CMS | **Custom thin `/admin`** in the app (no third-party CMS) | The moderation surface is small and bespoke (approve a diff). Avoids per-seat CMS fees for ~96 owners. |

**Why this over Payload CMS** (the runner-up): the synthesis (and 2 of 3 stack specialists) favoured Supabase because it keeps **`businesses.ts` as the seed + permanent fallback** and layers approved edits on top — so all the existing SEO (JSON-LD, sitemap, OG, `/ondernemers/[id]` SSG) stays untouched until an edit is approved. Payload is more batteries-included but turns the whole app stateful and is a heavier migration. Payload remains a solid alternative if you'd prefer a full off-the-shelf admin.

## How it works
**Owner journey**
1. Owner requests access on `/aanmelden` (emails the admin — unchanged front door).
2. Admin invites them in `/admin` (links their email to their `business_id`; Supabase sends a magic-link invite).
3. Owner logs in at `/login` → lands on `/beheer` (their dashboard).
4. Owner edits text, hours (the existing structured day/period UI), photos, contact/socials/price/tags. Mobile-first.
5. Submit → writes a **pending** `business_overrides` / `business_media` row. **The live value is never touched.** Owner sees "in afwachting van goedkeuring".
6. Admin reviews a **field-by-field diff** + photo preview in the moderation queue → approve/reject.
7. On approve: the override flips to `approved`, the photo is promoted private→public, and `revalidateTag('business:<id>')` regenerates just that page via ISR — live, with intact JSON-LD, no redeploy.

**Data seam:** a single `src/lib/businessData.ts` that merges the static seed with approved overrides; all ~27 consumers import from it instead of `businesses.ts` directly.

## Phased build
| Phase | Scope | Effort |
|---|---|---|
| **0** | Data-layer refactor: introduce `businessData.ts`, point all consumers at it. *No behaviour change.* Stack-agnostic, safe. | ~1–2 days |
| **1 (MVP)** | Supabase EU; `profiles`, `owner_business`, `business_overrides` + RLS; auth (magic link); `/login`, `/beheer` (edit text/hours/fields); `/admin` moderation queue with diffs + approve/reject + revalidate. | ~1–1.5 weeks |
| **2** | Photo upload: `business_media` + private/public buckets + RLS; mobile drag-drop in `/beheer` (hero + gallery), EXIF-strip, approval + promotion. | ~1–1.5 weeks |
| **3** | Hardening + GDPR: authorization test suite (owner can't touch another's data), rate limiting, consent/retention, privacy policy, backups. | ~3–5 days |

## Cost
**€0–25/month** at this scale. Supabase free tier (500 MB DB, 1 GB storage, 50k users) covers ~96 businesses + admins — but it **pauses when idle**, so either add a Vercel Cron keep-alive ping, or use Supabase **Pro (~$25/mo)** for no pausing + daily backups (recommended at launch).

## Decisions needed from you
1. **Stack**: Supabase overrides-layer (recommended) or Payload CMS?
2. **Supabase tier**: free + keep-alive cron now, or Pro (~$25/mo) for no pausing + backups?
3. **Owner-editable fields** (proposed): descriptions, hours, phone, website, socials, price, tags, specialties, perfect-voor, dietary, photos. **Admin-only**: name, category, address, lat/lng, featured, sortOrder, status. OK?
4. **Multiple logins per business** (owner + manager) or one login each?
5. **Portal/email language**: Dutch only (recommended) or NL + EN?
6. **Photo policy**: max gallery count, max size, types (jpeg/png/webp/avif; reject HEIC), auto-strip EXIF/GPS (recommended yes).
7. **Admin email(s)** to seed the first `/admin` account.
8. **Email sender**: Supabase's built-in magic-link email, or a custom sender on `ondernemersvandekamp.nl` for better deliverability/branding?

*Full specialist audit: `research/backend_audit.json`.*

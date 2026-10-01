# Royal Fitness Club — Website

Website for **Royal Fitness Club**, Gejha, Sector 93, Noida. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and three.js.

## Features

- **3D hero**: a three.js scene with a gold hex dumbbell, orbit rings and particles. It follows the pointer and scroll, is lazy-loaded, pauses when off-screen, and shows a still frame for reduced-motion users.
- **Interactive UI**: 3D tilt cards with glare, a 3D coverflow gallery with swipe and lightbox, scroll reveals and animated counters.
- **11 calculators** (`/tools`): BMI with Asian-Indian cut-offs, calories (BMR/TDEE), body fat (U.S. Navy method), one-rep max, macros, ideal weight, water intake, heart-rate zones, Indian Diabetes Risk Score, waist-to-height ratio and an intermittent-fasting planner.
- **Health & Fitness Hub** (`/health-hub`). Everything runs on local data (`src/lib/fitness/`), with no external API calls:
  - Workout planner: 2–6 day plans for gym or home, which you can edit, save, print or share on WhatsApp.
  - Exercise library of 39 exercises with an interactive body map and HowTo schema.
  - Indian food tracker covering 60+ foods, with protein sorting and daily targets.
  - Four veg/non-veg diet plans whose totals are calculated from the food database.
  - Gym timers: Tabata, HIIT, rest and breathing.
  - Weight and waist progress tracker.
- **Membership**: single and couple pricing with a toggle, savings computed against the monthly rate, and a full price list.
- **Interactive blog**: markdown posts with embedded live calculators, quizzes, a trial-booking CTA card, a table of contents, a reading-progress bar, share buttons, search and category filters, and an RSS feed.
- **Admin panel** (`/admin`): edit business info, hours, hero, stats, programs, plans, trainers, gallery, testimonials, FAQs, blog posts (with live preview), SEO and brand colours. It also handles image uploads, lets you view and export trial enquiries as CSV, and downloads or restores a JSON backup.
- **SEO**:
  - JSON-LD for `HealthClub`/`LocalBusiness` (geo, hours, rating, offers), `FAQPage`, `BlogPosting`, `BreadcrumbList`, `WebApplication` and `ItemList`.
  - Per-page canonical and Open Graph tags, plus generated OG images.
  - A dynamic sitemap, robots.txt, geo meta tags and a web manifest.
- **Leads**: a free-trial form (with honeypot and rate limit) that hands off to WhatsApp, plus floating WhatsApp and call buttons.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000 — without Supabase env: admin at /admin, password royal-admin
npm test             # calculator, markdown and validation unit tests
npm run lint && npm run typecheck && npm run build
```

## Backend: Supabase

Supabase provides the database, Google sign-in and image storage. The schema and security rules live in `supabase/migrations/`, and every table uses row-level security:

| Table / bucket | Who can read | Who can write |
|---|---|---|
| `site_content` | everyone | admins |
| `leads` (trial enquiries) | admins | anyone (insert only, validated by CHECK constraints) |
| `user_data` (member plan, food log, progress) | that member | that member |
| `admins` | the admin themself | nobody through the API (SQL editor only) |
| storage bucket `media` | everyone (public URLs) | admins |

- **Admin:** sign in with Google at `/admin`. The account's email must be listed in `public.admins`. To add someone, run this in the Supabase SQL editor:
  `insert into public.admins (email) values ('name@gmail.com');`
- **Members:** the header's **Sign in** button uses Google. The workout planner, food tracker and progress tracker then sync to the member's account.
- **Without Supabase env vars** (local dev), the site falls back to JSON files in `.data/` and a password login.

### One-time setup
1. **Vercel env vars:** set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, plus `NEXT_PUBLIC_SITE_URL`.
2. **Google OAuth client:** in Google Cloud Console → APIs & Services → Credentials, create an OAuth client ID of type Web application.
   - Authorized redirect URI: `https://trcnjdtbaydmtmdmpxbj.supabase.co/auth/v1/callback`.
3. **Enable Google in Supabase:** Authentication → Providers → Google, then paste the client ID and secret.
4. **Allow your URLs in Supabase:** Authentication → URL Configuration.
   - Site URL: your domain.
   - Redirect URLs: `https://yourdomain/**` and `https://*-aman-sh-projects.vercel.app/**` for previews.

### After launch
- Submit `https://yourdomain/sitemap.xml` in Google Search Console.
- Add the website link to your Google Business Profile and Instagram bio.

## Two sites, one app: the portal

One Next.js app, one Vercel project (`premium-health-platform`), one Supabase project:

| Site | URL | Code |
| --- | --- | --- |
| Royal Fitness Club (gym) | `/` | `src/app/(gym)`, `src/components`, `src/lib` |
| Premium Health Platform | `/health` | `src/app/(health)/health`, `src/health/**` (imported as `@/health/...`) |

The two sites have separate root layouts, styles and navigation (moving between them
is a full page load), but share the domain — so **one Google sign-in covers both**
(same Supabase session cookie) — plus the admin list (`public.admins`) and env vars.

- **Chooser:** on a visitor's first visit to `/`, a full-screen 3D chooser offers both
  sites. It is skipped for returning visitors, for people arriving from Google/Bing
  (they searched for the gym), and for crawlers. `/portal` always shows it and is
  the link to share. `?portal=1` forces it, `?portal=0` hides it.
- **Database:** the health site's 75 tables live in their own `health` schema
  (`supabase/health-drizzle/0000_health_init.sql`, already applied), reached only by
  the server connection in `DATABASE_URL`. The gym's tables stay in `public`.
  Schema changes: `npx drizzle-kit generate --config drizzle.health.config.ts`.
- **Premium** on the health site is read from `health.premium_subscriptions`
  (status `active`); nothing on the client can grant it. There's no payment gateway
  yet, so "Join Premium" opens WhatsApp.
- **Health docs** (audit, monetization, data sources) are in `docs/health/`.

## Editing content

Everything visible on the site lives in one content document. The seed data is in `src/lib/content/defaults.ts` and `default-posts.ts`. Once you save in `/admin`, the stored version is used; any section you never saved falls back to the defaults.

Blog shortcodes:

```
[[calculator:bmi]]          # bmi, tdee, body-fat, one-rep-max, macro, ideal-weight, water, heart-rate
[[quiz:Question|Option A|*Correct option|Option C|Explanation]]
[[cta]]
```

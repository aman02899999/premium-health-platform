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
npm run dev          # http://localhost:3000, admin at /admin (dev password: royal-admin)
npm test             # calculator, markdown and validation unit tests
npm run lint && npm run typecheck && npm run build
```

## Deploying

1. Set `NEXT_PUBLIC_SITE_URL` and `ADMIN_PASSWORD`.
2. On Vercel or another serverless host, also set `DATABASE_URL` to a PostgreSQL database (Neon, Supabase, etc.). Admin edits, uploads and enquiries are stored there. The tables are created automatically.
3. After launch, submit `/sitemap.xml` in Google Search Console and link the site from your Google Business Profile and Instagram bio.

## Editing content

Everything visible on the site lives in one content document. The seed data is in `src/lib/content/defaults.ts` and `default-posts.ts`. Once you save in `/admin`, the stored version is used; any section you never saved falls back to the defaults.

Blog shortcodes:

```
[[calculator:bmi]]          # bmi, tdee, body-fat, one-rep-max, macro, ideal-weight, water, heart-rate
[[quiz:Question|Option A|*Correct option|Option C|Explanation]]
[[cta]]
```

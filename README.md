# Bharat Health Guide — Premium Indian Health Platform

A premium, content-rich health platform for India — modern medicine, Ayurveda,
nutrition and traditional wellness. Built with **Next.js 16 (App Router) +
React 19 + TypeScript + Tailwind CSS 4**, with an optional **PostgreSQL**
backed newsroom (Drizzle ORM).

## Quick start

```bash
npm install

# optional but recommended — full CMS functionality
cp .env.example .env
#   - set DATABASE_URL to any PostgreSQL instance (see "Database" below)
#   - set NEWS_ADMIN_TOKEN to a long random string

npx drizzle-kit push   # create/upgrade tables from src/db/schema.ts

npm run dev            # http://localhost:3000
```

The site **boots without a database**: the news feed falls back to seed
content (`src/data/news.ts`) and `/api/health` reports `db: "unconfigured"`.
With a database, the newsroom publish API writes real CMS content.

## Database

PostgreSQL with the schema in [`src/db/schema.ts`](src/db/schema.ts)
(21 tables). The only tables used by running code today are:

| Table | Purpose |
|---|---|
| `news_items` | Newsroom CMS — published/draft articles, read by `/api/news` and rendered at `/news/[slug]` |
| `newsletter_subscribers` | Indian Health Weekly sign-ups — written by `POST /api/newsletter` |

The remaining tables (`diseases`, `medicines`, `herbs`, `products`, …) are
schema-reserved; their public APIs currently serve from static data in
`src/data/`.

`drizzle.config.json` defaults to `postgresql://postgres:postgres@127.0.0.1:5432/app_db`.

### Zero-install local Postgres (optional)

```bash
npm i -D embedded-postgres   # platform binaries ship via npm
npx drizzle-kit push         # after starting a cluster on 127.0.0.1:5432
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | no | PostgreSQL connection string for Drizzle ORM |
| `NEWS_ADMIN_TOKEN` | no | Locks `POST/PUT /api/news/publish` behind the `x-news-token` header |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical URL for SEO/OG/RSS (defaults to `https://bharathealthguide.in`) |

See [`.env.example`](.env.example). Never commit real `.env` files.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |

## Newsroom publish API

```bash
# create or update (idempotent by slug)
curl -X POST "$BASE/api/news/publish" \
  -H "Content-Type: application/json" \
  -H "x-news-token: $NEWS_ADMIN_TOKEN" \
  -d '{
    "title": "…(≥ 8 chars, no cure/guarantee claims)",
    "summary": "…(≥ 20 chars)",
    "category": "Research Digest",
    "body": [{ "heading": "…", "paragraphs": ["…"] }]
  }'

# idempotent daily briefing — safe from cron
curl -X PUT "$BASE/api/news/publish" -H "x-news-token: $NEWS_ADMIN_TOKEN"
```

Editorial safety policy is enforced server-side: headlines/summaries containing
*cure / guaranteed / 100% / miracle / stop medicine* claims are rejected.

## Public API

`GET /api/news`, `GET /api/news/[slug]`, `POST /api/newsletter`,
`GET /api/diseases`, `GET /api/medicines`, `GET /api/herbs`,
`GET /api/products`, `GET /api/articles`, `GET /api/lab-tests`,
`GET /api/search?q=…`, `GET /api/realtime/drug?name=…`,
`GET /api/realtime/food?q=…`, `GET /api/realtime/pulse`, `GET /api/health`
— plus `/news/rss.xml`, `/sitemap.xml`, `/robots.txt`.

`POST /api/newsletter` accepts `{"email", "consent"}`, is idempotent
(duplicates → `already-subscribed`), validates email client- and
server-side, and stores rows in `newsletter_subscribers`.

## Content sections

Home, News (daily briefings + research digests), Diseases, Medicines, Herbs,
Ayurveda, Nutrition & Recipes, Lab Tests, Products, Health Calculators,
Symptom Checker, Mental Wellness, Women's/Men's/Child Health, Yoga,
Homeopathy, Diet, Search, and legal pages (Privacy, Terms, Disclaimer,
Affiliate Disclosure).

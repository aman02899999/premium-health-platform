# Bharat Health Guide — Premium Indian Health Platform

A premium, content-rich health platform for India — modern medicine, Ayurveda,
nutrition and traditional wellness. Built with **Next.js 16 (App Router) +
React 19 + TypeScript + Tailwind CSS 4**, with an optional **PostgreSQL**
backed newsroom (Drizzle ORM) + modular Health Data Integration Layer.

## Quick start

```bash
npm install

# optional but recommended — full CMS functionality
cp .env.example .env
#   - set DATABASE_URL to any PostgreSQL instance (see "Database" below)
#   - set NEWS_ADMIN_TOKEN to a long random string
#   - configure health providers (ENABLE_* flags, API keys where needed)

npx drizzle-kit push   # create/upgrade tables from src/db/schema.ts + health-schema.ts

npm run dev            # http://localhost:3000
```

The site **boots without a database**: the news feed falls back to seed
content (`src/data/news.ts`) and `/api/health` reports `db: "unconfigured"`.
With a database, the newsroom publish API writes real CMS content.

## Database

PostgreSQL with schema in:
- [`src/db/schema.ts`](src/db/schema.ts) — original 21 tables (news, newsletter, diseases, medicines, herbs, etc.)
- [`src/db/health-schema.ts`](src/db/health-schema.ts) — extended health platform (50+ tables)

| Table | Purpose |
|---|---|
| `news_items` | Newsroom CMS — published/draft articles, read by `/api/news` and rendered at `/news/[slug]` |
| `newsletter_subscribers` | Indian Health Weekly sign-ups — written by `POST /api/newsletter` |
| `data_sources` | Provider metadata, license, attribution |
| `api_providers` | Provider status, health, enabled/disabled |
| `api_request_logs` | Request logging, errors, latency |
| `data_sync_jobs` | Background sync progress |
| `foods`, `food_nutrients`, `food_ingredients`, `food_allergens` | Nutrition normalized |
| `muscles`, `equipment`, `exercises`, `workout_plans`, `workout_exercises` | Fitness |
| `disease_aliases`, `disease_codes` | ICD-10/SNOMED mapping |
| `drug_aliases`, `drug_ingredients`, `drug_warnings`, etc. | Drug safety |
| `chemical_compounds` | PubChem |
| `medical_articles`, `clinical_trials` | Research |
| `ayurvedic_herbs`, `ayurvedic_formulations` | Ayurveda traditional |
| `homeopathic_remedies` | Homeopathy traditional |
| `indian_medicines` | Indian branded |
| `user_health_profiles`, `user_measurements`, etc. | User health (future) |

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
| `ENABLE_WGER` | no | Enable wger fitness (default true, no key) |
| `ENABLE_OPENFOODFACTS` | no | Enable Open Food Facts (default true) |
| `ENABLE_USDA` | no | Enable USDA (requires USDA_API_KEY) |
| `ENABLE_OPENFDA` | no | Enable openFDA (default true) |
| `ENABLE_RXNORM` | no | Enable RxNorm (default true) |
| `ENABLE_PUBCHEM` | no | Enable PubChem (default true) |
| `ENABLE_PUBMED` | no | Enable PubMed (default true) |
| `ENABLE_CLINICALTRIALS` | no | Enable ClinicalTrials.gov (default true) |
| `ENABLE_ICD10` | no | Enable ICD-10 local (default true) |
| `ENABLE_SNOMED` | no | Enable SNOMED CT (requires self-hosted Snowstorm) |
| `ENABLE_AYURVEDA` | no | Enable Ayurveda local (default true) |
| `ENABLE_HOMEOPATHY` | no | Enable Homeopathy local (default true) |
| `ENABLE_INDIAN_MEDICINE` | no | Enable Indian medicines (LICENSE_REVIEW) |
| `ENABLE_WORLDBANK` | no | Enable World Bank (default true) |
| `ENABLE_OPENMETEO` | no | Enable Open-Meteo (default true) |
| `USDA_API_KEY` | no | USDA FoodData Central free key |
| `REDIS_URL` | no | Optional Redis for distributed cache |

See [`.env.example`](.env.example). Never commit real `.env` files.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Vitest — health providers + realtime |

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

Existing:
`GET /api/news`, `GET /api/news/[slug]`, `POST /api/newsletter`,
`GET /api/diseases`, `GET /api/medicines`, `GET /api/herbs`,
`GET /api/products`, `GET /api/articles`, `GET /api/lab-tests`,
`GET /api/search?q=…`, `GET /api/realtime/drug?name=…`,
`GET /api/realtime/food?q=…`, `GET /api/realtime/pulse`, `GET /api/health`
— plus `/news/rss.xml`, `/sitemap.xml`, `/robots.txt`.

New Health Data Layer:
- `GET /api/health/search?q=diabetes` — unified categorized search
- `GET /api/health/providers` & `?health=true`
- `GET /api/health/status` — db, cache, providers
- `GET /api/health/food?q=apple&provider=openfoodfacts|usda`
- `GET /api/health/barcode/:code` — Open Food Facts barcode
- `GET /api/health/exercises?q=pushup`
- `GET /api/health/workouts?q=beginner`
- `GET /api/health/drugs?q=metformin&provider=openfda|rxnorm|pubchem`
- `GET /api/health/diseases?q=diabetes&provider=icd10`
- `GET /api/health/herbs?q=ashwagandha`
- `GET /api/health/ayurveda?q=turmeric`
- `GET /api/health/homeopathy?q=arnica`
- `GET /api/health/medical-literature?q=diabetes` — PubMed
- `GET /api/health/clinical-trials?q=diabetes`
- `GET /api/health/symptoms?q=fatigue`
- Realtime: `/api/realtime/pubmed`, `/api/realtime/trials`, `/api/realtime/worldbank`, `/api/realtime/research`, `/api/realtime/pulse`

`POST /api/newsletter` accepts `{"email", "consent"}`, is idempotent
(duplicates → `already-subscribed`), validates email client- and
server-side, and stores rows in `newsletter_subscribers`.

## Health Data Integration Layer

See docs:
- `docs/HEALTH_API_ARCHITECTURE.md` — architecture, fallback, caching, security
- `docs/API_PROVIDERS.md` — provider status, keys, licenses
- `docs/MEDICAL_DATA_POLICY.md` — safety, provenance, evidence grading
- `docs/DATA_LICENSES.md` — license compliance
- `docs/HEALTH_API.md` — internal API reference
- `docs/DEPLOYMENT.md` — deployment guide
- `api-providers.json` — machine-readable provider metadata

### Provider Abstraction

All providers in `src/services/health/providers/*` implement:

```ts
interface HealthProvider {
  search()
  getById()
  getDetails()
  healthCheck()
  getCapabilities()
}
```

Centralized in `src/services/health/registry.ts` with enable/disable flags.

### Frontend Never Calls External APIs Directly

```
External APIs → Provider Adapters → Normalization → Safety → Cache → DB → Internal Health API → Frontend
```

No API keys exposed to browser.

### Admin

- `/admin/health` — provider status, cache stats, DB, quick actions
- `/api/health/providers?health=true` — health checks
- `/api/health/status` — full status

## Content sections

Home, News (daily briefings + research digests), Diseases, Medicines, Herbs,
Ayurveda, Nutrition & Recipes, Lab Tests, Products, Health Calculators,
Symptom Checker, Mental Wellness, Women's/Men's/Child Health, Yoga,
Homeopathy, Diet, Search, and legal pages (Privacy, Terms, Disclaimer,
Affiliate Disclosure).

New:
- Exercise library (`/api/health/exercises`)
- Food database + barcode (`/api/health/food`, `/api/health/barcode/:code`)
- Drug info with RxNorm + PubChem (`/api/health/drugs`)
- Ayurveda knowledge base (`/api/health/ayurveda`)
- Homeopathy knowledge base (`/api/health/homeopathy`)
- Medical research search (`/api/health/medical-literature`, `/api/health/clinical-trials`)
- Unified health search (`/api/health/search`)
- Health admin (`/admin/health`)

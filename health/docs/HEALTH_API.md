# Health API — Internal

Base: `/api/health`

## Endpoints

- `GET /api/health/search?q=diabetes&limit=5` — unified categorized search
- `GET /api/health/providers` — list providers
- `GET /api/health/providers?health=true` — health checks
- `GET /api/health/status` — db, cache, providers
- `GET /api/health/food?q=apple&limit=10&provider=openfoodfacts|usda`
- `GET /api/health/food/:id` — by barcode or id
- `GET /api/health/barcode/:code` — barcode lookup (8-14 digits)
- `GET /api/health/exercises?q=pushup&limit=10&offset=0`
- `GET /api/health/exercises/:id`
- `GET /api/health/muscles` — wger muscles (unique)
- `GET /api/health/equipment` — wger equipment (unique)
- `GET /api/health/workouts?q=beginner`
- `GET /api/health/drugs?q=metformin&provider=openfda|rxnorm|pubchem`
- `GET /api/health/drugs/:id?provider=openfda`
- `GET /api/health/diseases?q=diabetes&provider=icd10|snomed`
- `GET /api/health/diseases/:id`
- `GET /api/health/symptoms?q=fatigue`
- `GET /api/health/herbs?q=ashwagandha`
- `GET /api/health/herbs/:id`
- `GET /api/health/ayurveda?q=turmeric`
- `GET /api/health/homeopathy?q=arnica`
- `GET /api/health/medical-literature?q=diabetes`
- `GET /api/health/clinical-trials?q=diabetes`
- `GET /api/health/sync` — list sync jobs + capabilities
- `POST /api/health/sync` — trigger sync { type: foods|exercises|drugs|herbs|literature|trials|all }
- `DELETE /api/health/sync` — clear cache
- `POST /api/health/qa` — retrieval-first Q&A with citations (unique)
- `GET /api/health/qa` — info about QA endpoint

Also existing realtime:
- `/api/realtime/pulse`, `/api/realtime/drug`, `/api/realtime/food`, `/api/realtime/pubmed`, `/api/realtime/trials`, `/api/realtime/worldbank`, `/api/realtime/research`

Unique pages (frontend):
- `/thali-builder`, `/millet-swap`, `/india-risk`, `/yoga-timer`, `/ritucharya`, `/herb-interaction`, `/barcode-scanner`, `/child-growth`, `/health-qa`, `/live-advisory`, `/dosha-meals`, `/fasting-planner`, `/hinglish-search`, `/nutrition-tracker`, `/workout-builder`

## Pagination

- `limit` (1-30), `offset`
- Response: `{ data, total, limit, offset, hasMore, source, live, cached, fetchedAt }`

## Rate Limiting

- 60 req/min per IP per endpoint (in-memory)
- Returns 429 if exceeded

## Validation

- Query required, trimmed, max 200 chars
- Barcode regex: ^\d{8,14}$
- Proper HTTP codes: 400, 404, 429, 500, 503

## Caching

- TTL per provider (see cache/index.ts)
- Cache-Control headers on responses
- Stale fallback on failure

## Q&A (Unique)

POST /api/health/qa body: { question: string (3-500), lang?: en|hi|hinglish }

Flow:
1. unifiedHealthSearch(question)
2. Build answer lines from categories (diseases, medicines, food, exercises, ayurveda, research, trials)
3. Add India tips (millets GI, IDRS) if keywords match
4. Return answer + citations[] (id, title, source, url, snippet) + confidence

Example:
```json
{
  "question": "madhumeh diet ragi",
  "lang": "hinglish"
}
```
Returns citations from OFF, PubMed, Ayurveda, ICD-10 etc — no hallucinations.

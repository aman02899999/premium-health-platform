# Deployment

## Requirements

- Node.js 20+
- PostgreSQL (optional but recommended)
- No Redis required (in-memory cache default)

## Install

```bash
npm install
cp .env.example .env
# edit .env — set DATABASE_URL, NEWS_ADMIN_TOKEN, provider keys if needed
npx drizzle-kit push
npm run build
npm start
```

## Environment

See `.env.example` for full list. Key:

- `DATABASE_URL` — postgres connection, optional
- `NEWS_ADMIN_TOKEN` — protects /api/news/publish
- `NEXT_PUBLIC_SITE_URL` — canonical URL
- `ENABLE_*` — provider flags
- `*_API_URL` — override base URLs
- `USDA_API_KEY`, `OPENFDA_API_KEY`, etc.

Never commit `.env`.

## Health Checks

- `/api/health` — db status
- `/api/health/status` — providers + cache + db
- `/api/health/providers?health=true` — provider health

## Sync Jobs

Currently manual via API. Future cron:

- `HEALTH_SYNC_CRON_ENABLED=false` by default
- Implement with `node-cron` or Vercel Cron calling `/api/health/sync` (to be added)
- Jobs: syncFoods, syncExercises, syncDrugs, syncHerbs, etc.

## Performance

- Server-side caching, TTL per provider
- Pagination, lazy loading, debounced search (frontend)
- No external requests from frontend, only internal API
- Avoid N+1 via batching

## Security

- Secrets server-side only
- Rate limiting, validation, secure headers (next.config.ts)
- No API keys in client bundle

## Build Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All should pass.

# Health API Architecture

## Overview
Modular Health + Fitness + Nutrition + Medical + Ayurveda + Homeopathy data platform integrated into existing Next.js site.

Preserves all existing functionality. New layer is additive.

## Architecture Diagram

```
External APIs (wger, OFF, openFDA, RxNorm, PubChem, PubMed, ClinicalTrials, WorldBank, Open-Meteo, ICD-10, etc.)
  ↓
Provider Adapters (/services/health/providers/*) — implement HealthProvider interface
  ↓
Normalization Layer (/services/health/normalization) — maps to common types, multilingual aliases
  ↓
Safety Layer (/services/health/safety) — forbidden claims check, disclaimers, evidence grading
  ↓
Cache Layer (/services/health/cache) — in-memory (Redis optional), TTL per provider, stale fallback
  ↓
PostgreSQL (existing Drizzle ORM) — extended schema in src/db/health-schema.ts
  ↓
Internal Health API (/api/health/*) — pagination, filtering, rate limiting, validation
  ↓
Frontend (Next.js App Router) — never exposes external keys, uses internal API only
  ↓
AI/RAG/Search (future) — unified search feeds LLM with citations
```

## Provider Interface

```ts
interface HealthProvider {
  search(params): PaginatedResult
  getById(id): Entity + provenance
  getDetails?(id): Details
  healthCheck(): ProviderHealth
  getCapabilities(): Capability
}
```

Every provider implements common interface, no hard-coded logic in routes.

## Fallback System

```
Provider A → failure → Provider B → failure → Local DB/Cache → Graceful response
```

- timeout (7-9s)
- retry with exponential backoff (implemented in fetchJson)
- circuit breaker via healthCheck
- stale-cache fallback
- provider health monitoring

## Caching

- In-memory Map with TTL
- Presets: food 6h, barcode 24h, drug 12h, exercise 24h, pubmed 6h, etc.
- Redis optional via REDIS_URL (future)
- Stats at /api/health/status

## Database

Extended schema in `src/db/health-schema.ts`:
- data_sources, api_providers, api_request_logs, data_sync_jobs
- foods, food_nutrients, food_ingredients, food_allergens
- muscles, equipment, exercises, exercise_muscles, workout_plans, workout_exercises
- disease_aliases, disease_codes
- drug_aliases, drug_ingredients, drug_warnings, contraindications, adverse, dosages, interactions
- chemical_compounds
- medical_articles, clinical_trials
- ayurvedic_herbs, synonyms, formulations
- homeopathic_remedies
- indian_medicines
- user_health_profiles, measurements, workout_logs, nutrition_logs

All records preserve provenance: source, source_id, source_url, license, retrieved_at, etc.

## Security

- Secrets server-side only, never in client bundle
- Rate limiting per IP per endpoint
- Input validation (barcode regex, query length)
- SQL injection protection via Drizzle ORM
- Secure headers in next.config.ts
- No .env committed

## Medical Safety

- Forbidden phrases blocked
- Disclaimers per type (drug, ayurveda, homeopathy, nutrition, fitness)
- Evidence grading
- Source attribution displayed
- No personalized dosing

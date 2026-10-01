# Phase 2 — Monetization, SEO, SSO, Earning, A/B Testing & Performance

Companion to [MONETIZATION.md](./MONETIZATION.md) and [docs/SEO_SSO_EARNING.md](./docs/SEO_SSO_EARNING.md).

Phase 2 turned Bharat Health Guide from a health-content site into a complete
health **platform**: it can be crawled end-to-end, signed into, monetized through
four independent revenue lines, and optimized with real experiments.

---

## Pillar 1 — Health data platform

| Layer | Contents |
| --- | --- |
| APIs | 21 route handlers under `src/app/api/health/*` |
| Providers | 15 integrations in `src/services/health/providers/*` (openFDA, RxNorm, PubChem, PubMed, USDA, OpenFoodFacts, wger, ClinicalTrials, ICD-10, SNOMED, World Bank, Open-Meteo, Ayurveda, Homeopathy, Indian medicines) |
| Schema | `src/db/health-schema.ts` — provenance preserved for every record (source, source_id, source_url, license, retrieved_at) |
| Safety | `src/services/health/safety/*` — no diagnosis, no dosing, escalation-first triage |

## Pillar 2 — SEO

- **Sitemap** (`src/app/sitemap.ts`) — every static route, all dynamic collections
  (diseases, herbs, medicines, nutrition, lab tests, symptoms, blog, products,
  ayurveda, store, affiliate products, providers, **news briefings**), all
  **blog categories**, plus `/blog/latest` and `/blog/trending`. De-duplicated
  before emit — a duplicate `<loc>` is an SEO defect.
- **Robots** (`src/app/robots.ts`) — optimized allow-list for public pages;
  `/api/`, `/admin/`, `/profile`, `/login`, `/register`, `/orders`,
  `/my-purchases` and `/download/` disallowed. Per-bot rules for Googlebot,
  Googlebot-Image and Bingbot.
- **Structured data** (`src/components/seo/JsonLd.tsx`) — BreadcrumbList, FAQPage,
  Article, BlogPosting, Product and ItemList.
- **Metadata** (`src/lib/seo.ts`) — canonical URLs, hreflang, Open Graph and
  Twitter cards on every page.
- **Internal linking** — blog category pages surface related, latest and trending
  articles via `RelatedArticles`, `LatestArticles` and `BlogCategories`.

## Pillar 3 — SSO

- `src/components/auth/AuthContext.tsx` — session context, **Google OAuth-ready**
  placeholder (no credentials required to run).
- Pages: `/login`, `/register`, `/profile`.
- API: `/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`, `/api/auth/me`.
- Header renders a signed-in user menu with sign-out.

## Pillar 4 — Digital marketing

| Concern | Implementation |
| --- | --- |
| GA4 / Meta Pixel | `src/components/marketing/Analytics.tsx` — placeholder IDs via env |
| UTM tracking | `UTMTracker.tsx` — persists attribution in `localStorage` key `bhg-utm` |
| Affiliate tracking | Amazon tag `bharathealthguide-21` + `bhg_ref`, `bhg_ts` and UTM params |
| AdSense | `AdComponents.tsx` — placeholder slots, lazy-loaded on `IntersectionObserver` |
| Lead magnet | Newsletter popup offering the Thali Builder PDF |
| Retention | `ExitIntent.tsx`, `WhatsAppOptIn.tsx`, push subscription |

## Pillar 5 — Blog

- `/blog/category/[slug]` — one page per category.
- `/blog/latest`, `/blog/trending`, `/blog/search`, `/blog/author`.
- Related-article scoring in `src/data/blog-enrichment.ts` (category + tag
  overlap, recency weighting).
- `/api/blog/related`, `/api/blog/latest`, `/api/blog/trending`.

## Pillar 6 — Earning platform

| Revenue line | Detail |
| --- | --- |
| Premium | ₹199/month via Razorpay (`src/lib/monetization/payment.ts`, paise-based) |
| Affiliate | 8% Amazon commission, tag `bharathealthguide-21` |
| Advertising | AdSense placeholder slots |
| Lead generation | Rate limited to 5 submissions/minute |
| Digital products | `/store/[slug]`, `/orders`, `/my-purchases`, `/download/[token]` |

- Download tokens are HMAC-signed, expire in **72 hours**, and allow **3 downloads**.
- `src/db/monetization-schema.ts` — 13 tables (subscriptions, affiliate products,
  clicks, conversions, orders, order items, digital products, download tokens,
  download audit, leads, monetization events, coupons, ad events). Money is stored
  in **paise** as integers — never floats.
- `src/lib/monetization/storage.ts` — AWS SigV4 presigned GET URLs for S3 and
  Cloudflare R2; degrades to a dev URL when unconfigured.
- Dashboards: `EarningCharts.tsx`, `AdminManager.tsx`, `/admin/earning`.

## Pillar 7 — Real product images

Eight generic, non-branded product photographs ship in `public/products/`:

`millet-combo.jpg`, `glucometer.jpg`, `bp-monitor.jpg`, `yoga-mat.jpg`,
`whey-protein.jpg`, `mustard-oil.jpg`, `diabetes-guide.jpg`, `weight-management.jpg`

- `src/lib/monetization/config.ts` references `/products/*.jpg`.
- `getProductImageUrl()` in `src/lib/images.ts` strips query strings and falls
  back to the static `/og-default.jpg`, keeping immutable cache headers effective.

## Pillar 8 — A/B testing

`src/lib/ab-testing.ts`

- `CTA_EXPERIMENTS` — 3 experiments (`cta-disease`, `cta-nutrition`, `cta-blog`),
  each with variants **A/B/C** and a weighted `trafficSplit` (34/33/33).
- Variants are **sticky** — persisted in `localStorage` as `bhg-ab-{experimentId}`.
- `trackABEvent()` writes to `bhg-ab-events-{experimentId}`, capped at 500 events.
- `getABStats()` reports impressions, clicks, conversions, **CTR** and
  **conversion rate** per variant, and declares a winner only after 10+
  impressions with a non-zero rate — never on noise.
- `MonetizationCTA` reorders its CTAs by variant and tracks impressions + clicks.
- `EarningCharts` renders the live experiment dashboard.

**Hydration safety:** the server always renders variant A; the sticky variant is
applied after mount, so server and client markup always match.

## Pillar 9 — Performance

`next.config.ts`

- `remotePatterns` for Pexels, Amazon CDNs, S3 and R2.
- `optimizePackageImports: ["lucide-react", "recharts"]` — tree-shakes barrel imports.
- `Cache-Control`: `/products/*` and brand assets immutable for 1 year, OG images
  86 400 s, `sitemap.xml` / `robots.txt` / RSS 3 600 s.
- `X-DNS-Prefetch-Control: on` so affiliate hostnames resolve ahead of a click.
- AVIF/WebP output, tuned `deviceSizes`/`imageSizes`, lazy-loading and
  reserved aspect boxes to protect LCP, CLS and INP.

---

## Verification

```bash
npm ci
npm run typecheck
npm run build
```

Verified build output:

| Metric | Value |
| --- | --- |
| Pages generated by `next build` | **359 / 359** |
| Prerendered HTML files | 313 |
| API route handlers | 73 |
| Unique `sitemap.xml` URLs | 323 (0 duplicates) |
| Unit tests | 23 passing (9 files) |
| `tsc --noEmit` | clean |

`/sitemap.xml` emits every public URL, de-duplicated, including blog categories,
`/blog/latest`, `/blog/trending` and news briefings. `/robots.txt` allows public
content and disallows private routes (`/api/`, `/admin/`, `/profile`, `/orders`,
`/my-purchases`, `/download/`).

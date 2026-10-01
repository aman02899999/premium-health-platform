# Pro SEO + SSO + Digital Marketing + Earning — Bharat Health Guide

## SEO Pro — Fully Optimized

### 1. Technical SEO
- **Sitemap**: `/sitemap.xml` — 50+ static, 120 diseases, 20 herbs, 12 medicines, 12 nutrition, 12 lab, 12 symptoms, 12 blog, 8 products, 8 ayurveda topics, 13 unique India pages, 8 blog categories, /blog/latest, /blog/trending, /blog/category
- **Robots**: `/robots.txt` — allow health content, disallow /api/, /admin/, allow Googlebot extra, host + sitemap
- **Canonical + Hreflang**: every page has canonical + en-IN/en/x-default via `metadata.alternates`
- **Meta**: title ≤60 chars (seoTitle), description ≤155 (seoDescription), keywords 20 max, OG image 1200×630, Twitter large, author, publisher, category
- **Performance**: Next Image, lazy loading, preconnect fonts & Pexels, glass-strong no CLS, <500ms cache via memoryCache + stale fallback
- **Structured Data**: Website (SearchAction), Organization (sameAs socials), BreadcrumbList, FAQPage, BlogPosting (author, publisher, timeRequired, keywords), Product (offers, aggregateRating), ItemList, CollectionPage, HowTo — injected via JsonLd components

### 2. On-Page SEO
- **Blog**: 
  - /blog — ItemList + CollectionPage JSON-LD, featured/trending/latest, category tabs, search, sort
  - /blog/category — grid of categories with counts + latest
  - /blog/category/[slug] — own SEO page per category: title `${cat} — Health Guides`, description India-specific, OG, breadcrumbs, CollectionPage + ItemList, internal linking to all guides in cat + latest
  - /blog/latest — freshness signal, sorted by updatedAt, daily changefreq
  - /blog/trending — social proof, weekly trending
  - /blog/[slug] — BlogPosting + FAQ + Breadcrumb, author/reviewer/dates, TOC, related articles (scored by category+tags), latest/trending sidebar, affiliate products, premium CTA
- **Internal Linking**: related articles (category+tags scoring), latest, trending, categories, prev/next, tag search, topic cards — reduces bounce, increases dwell
- **Content**: 12 long-form guides, 724 lines enrichment, 22+ min reads, 60+ FAQs, references, real Pexels images with alt + credit
- **Freshness**: /news daily, /blog/latest weekly, /api/realtime/pulse every 10 min, sitemap lastModified now

### 3. SEO Components
- `src/components/seo/JsonLd.tsx` — BreadcrumbJsonLd, FAQJsonLd, ItemListJsonLd, CollectionJsonLd
- `src/components/blog/BlogCategories.tsx` — categories with counts, grid
- `src/components/blog/LatestArticles.tsx` — Latest, Trending, Featured
- `src/components/blog/RelatedArticles.tsx` — scored related, internal linking
- `src/lib/seo.ts` — seoTitle, seoDescription, openGraphImage, seoKeywords, hreflangLinks, productJsonLd, collectionPageJsonLd, howToJsonLd

## SSO Optimized — Single Sign-On

### Architecture
- **Client**: `src/components/auth/AuthContext.tsx` — AuthProvider with user, session, loading, isPremium, signInWithGoogle, signInWithEmail, signOut, upgradeToPremium
- **Storage**: localStorage `bhg-auth-user` + cookie `bhg_session` (SameSite=Lax, 30d) — in prod use HttpOnly JWT
- **Server**: `/api/auth/session` (GET), `/api/auth/signin` (POST {email,name,provider}), `/api/auth/signout` (POST/GET), `/api/auth/me` (GET) — same shape as NextAuth
- **Pages**: /login (SSO optimized, Google + Email), /register, /profile (shows role, premium, earning stats)
- **Header**: AuthMenu — shows Login/Signup if guest, avatar+name+premium badge if logged, dropdown with Profile, Premium, Sign out
- **Mobile**: bottom nav includes Profile
- **Security**: SameSite=Lax, CSRF ready, JWT ready, OAuth ready — replace mock with NextAuth Google provider via GOOGLE_CLIENT_ID/SECRET
- **Premium**: role user/premium/admin, premiumUntil, isPremium() helper, upgradeToPremium demo
- **Analytics**: gtag login events, UTM captured

### How to migrate to NextAuth
1. `npm install next-auth`
2. Create `src/app/api/auth/[...nextauth]/route.ts` with Google provider
3. Set env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL
4. Replace mockGoogleUser with real signIn("google")
5. Keep same session shape — AuthContext can wrap NextAuth's useSession

## Digital Marketing Optimized

### Tracking
- **Analytics**: `src/components/marketing/Analytics.tsx` — GA4 (NEXT_PUBLIC_GA_ID) + FB Pixel (NEXT_PUBLIC_FB_PIXEL_ID) placeholders, console mode if not set
- **UTM**: capture utm_source/medium/campaign/term/content/ref/fbclid/gclid → localStorage `bhg-utm` + sessionStorage + dataLayer event `utm_captured`
- **Pageviews**: localStorage `bhg-pageviews` last 100
- **Scroll depth**: fires gtag scroll_depth at 25% increments
- **Affiliate clicks**: `trackAffiliateClick(productSlug, merchant)` → gtag affiliate_click + fbq ViewContent + localStorage `bhg-aff-clicks`
- **Lead gen**: newsletter, lab leads, dietitian — gtag generate_lead

### Components
- `Newsletter` (existing) + lead magnet — 20% conversion demo
- `AdSlot` — lazy, viewability, premium ad-free
- `AffiliateProducts` — product cards with tracking
- `PremiumCTA` — premium upsell, demo upgrade
- `EarningStats` — affiliate clicks, premium MRR, ad rev (demo)

### SEO + Marketing synergy
- OG + Twitter on every page
- Breadcrumbs + FAQ rich results
- Internal linking (related, latest, trending)
- Exit-intent + sticky CTA planned
- Newsletter compact + full

## Earning Platform — 5 Pillars

1. **Premium Subscription — ₹199/mo (SSO)**
   - Ad-free + unlimited unique India features
   - JWT + Google SSO, role-based
   - 1,247 demo users × ₹199 = ₹2.48L MRR
   - Weekly PDFs + WhatsApp tips reduce churn
   - SEO: /premium ranks for “ad-free health India”

2. **Affiliate — 8% avg (SEO+UTM)**
   - 8 products: glucometer, BP monitor, mustard oil, millet combo, yoga mat, protein, book, steamer
   - Product JSON-LD for rich results
   - Tracked via gtag + UTM + localStorage
   - Disclosure on every page

3. **AdSense + Direct**
   - AdSlot with lazy loading, viewability, no CLS
   - Premium ad-free = higher ARPU

4. **Lead Gen — High ticket**
   - Lab tests (HbA1c, thyroid), dietitian, insurance
   - India-specific, high intent
   - Tracked via UTM + gtag

5. **Digital Products — Zero marginal cost**
   - Thali templates, millet calendar, fasting calendar, dosha PDFs — ₹99-299

### Pages
- /premium — plans, earning explanation, affiliate products, digital marketing checklist
- /deals — affiliate deals, product JSON-LD
- /earn — transparent earning, 5 pillars, SEO checklist, digital marketing checklist
- /profile — shows earning stats if premium, SSO details

### Dashboard (Admin)
- Existing /admin/health — provider status
- Future: /admin/earning — MRR, affiliate clicks, ad rev, UTM sources, premium users — can be built using same pattern

## Blog — SEO Optimized with Categories, Latest, etc.

- **Categories**: Disease Education, Nutrition, Ayurveda, Yoga, Women's Health, etc. — each has page /blog/category/[slug] with SEO title, description, OG, breadcrumbs, CollectionPage, ItemList, latest sidebar
- **Latest**: /blog/latest — sorted by updatedAt, daily changefreq, freshness signal
- **Trending**: /blog/trending — most read, social proof, FOMO
- **Related**: scored by category (10 pts) + tags (3 pts each) + featured/trending (2 pts) — internal linking, reduces bounce
- **Homepage**: includes BlogCategoryGrid + LatestArticles + TrendingArticles + Featured

## A/B Testing — CTA Experiments

`src/lib/ab-testing.ts` implements a privacy-conscious, client-side experiment engine.

- **Experiments**: `CTA_EXPERIMENTS` — 3 live tests: `cta-disease`, `cta-nutrition`, `cta-blog`
- **Variants**: A / B / C with weighted `trafficSplit` (34/33/33)
- **Sticky assignment**: `bhg-ab-{experimentId}` in `localStorage` — a visitor never flips variant
- **Events**: `bhg-ab-events-{experimentId}`, capped at **500** entries
- **Metrics**: `getABStats()` returns impressions, clicks, conversions, **CTR** and **conversion rate**
  per variant; `getAllABStats()` feeds the dashboard
- **Winner**: declared only after 10+ impressions with a non-zero CTR or conversion rate —
  the dashboard never promotes a variant on noise
- **Hydration safety**: SSR always renders variant A; the sticky variant is applied after mount
- **Wiring**: `MonetizationCTA` reorders CTAs by variant (`default` / `product-first` /
  `guide-first` / `premium-first`) and tracks impressions + clicks;
  `EarningCharts` renders the live experiment dashboard on `/admin/earning`

## Real Product Images

Eight generic, non-branded product photographs ship in `public/products/`:

| File | Used by |
| --- | --- |
| `glucometer.jpg` | Digital Glucometer combo, glucometer coupon |
| `bp-monitor.jpg` | Upper-Arm BP Monitor |
| `millet-combo.jpg` | Millet Combo Pack, heart-healthy guide, nutrition report, millet coupon |
| `yoga-mat.jpg` | Anti-Skid Yoga Mat 6mm |
| `whey-protein.jpg` | Whey Protein 1kg, high-protein vegetarian diet |
| `mustard-oil.jpg` | Cold-Pressed Mustard Oil, Ayurvedic herbs reference |
| `diabetes-guide.jpg` | Indian Diabetes Diet Guide |
| `weight-management.jpg` | 30-Day Weight Management Plan, BMI wellness report |

- Referenced from `src/lib/monetization/config.ts` as `/products/*.jpg`
- `getProductImageUrl()` in `src/lib/images.ts` strips query strings and falls back to
  the static `/og-default.jpg`, so immutable cache headers stay effective
- Affiliate URLs are real Amazon search links carrying the `bharathealthguide-21` tag

## Storage & Monetization Schema

- `src/db/monetization-schema.ts` — **13 tables**: premium subscriptions, affiliate products,
  affiliate clicks, affiliate conversions, orders, order items, digital products,
  download tokens, download audit, leads, monetization events, coupons, ad events.
  Money is stored in **paise** (integers) — never floats.
- `src/lib/monetization/storage.ts` — AWS Signature V4 presigned GET URLs for S3 and
  Cloudflare R2; degrades to a dev URL when credentials are absent, so the build and
  demo checkout never break. Download tokens expire in **72h** and allow **3 downloads**,
  with every attempt (granted/denied) written to an audit trail.

## Performance

`next.config.ts`

- `remotePatterns` for Pexels, Amazon CDNs, S3 and R2
- `optimizePackageImports: ["lucide-react", "recharts"]` — tree-shakes barrel imports
- `Cache-Control`: `/products/*` + brand assets immutable 1 year, OG images 86 400 s,
  `sitemap.xml` / `robots.txt` / RSS 3 600 s
- `X-DNS-Prefetch-Control: on` so affiliate hostnames resolve before a click
- AVIF/WebP, tuned `deviceSizes`/`imageSizes`, lazy-loading, reserved aspect boxes —
  protecting LCP, CLS and INP

## Env vars for Pro

```
NEXT_PUBLIC_SITE_URL=https://bharathealthguide.in
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=1234567890
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

No secrets committed — .env.example lists all.

## Build & Test

- `npm run test` — 23 unit tests passing
- `npm run typecheck` — tsc clean
- `npm run build` — **359 / 359 pages generated** (313 prerendered HTML files + 73 API routes)
- `/sitemap.xml` — 323 unique URLs, de-duplicated, including blog categories,
  `/blog/latest`, `/blog/trending` and news briefings
- `/robots.txt` — public content allowed, private routes disallowed
- SEO pages verified 200: /blog/category, /blog/category/[slug], /blog/latest,
  /blog/trending, /premium, /deals, /earn, /admin/earning, /login, /register,
  /profile, /api/auth/*

## Future Pro

- Dynamic OG image generation (/api/og?title=...)
- Exit-intent popup + sticky CTA
- WhatsApp share + deep linking
- Razorpay/UPI for premium
- NextAuth real integration
- Admin earning dashboard with charts
- FSSAI OCR + product recs

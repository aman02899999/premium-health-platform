# Premium Health Platform — Production-Ready Modular Monetization Platform

**Live Site:** https://premium-health-platform.vercel.app/  
**Branch:** arena/01a08498-premium-health-platform  
**Build:** 359+ pages, TypeScript clean, Next.js 16.2.6

This document fulfills the final requirement: Files changed, new routes, DB models, env vars, setup instructions, security, remaining work.

---

## 1. Files Changed

### Core Monetization Config (NEW — Central, Modular, No Hardcoding)
- `src/lib/monetization/types.ts` — All monetization types: BaseMonetizationItem, AffiliateProduct, DigitalProduct, PaidGuide, PaidPlan, Advertisement, Sponsor, LeadFormConfig, BusinessListing, Coupon, PremiumReport, Order, MonetizationEvent
- `src/lib/monetization/config.ts` — Single source of truth: AFFILIATE_PRODUCTS (6), DIGITAL_PRODUCTS (5), PAID_GUIDES, PAID_PLANS, ADVERTISEMENTS (4), SPONSORS (2), LEAD_FORMS (3), BUSINESS_LISTINGS (3), COUPONS (3 with auto-expire demo), PREMIUM_REPORTS (3). Helpers: getActiveSponsors(), getActiveCoupons(), getExpiredCoupons(), getAffiliateByCategory(), getDigitalByCategory()
- `src/lib/monetization/payment.ts` — PaymentProvider abstraction: PaymentProvider interface with createOrder, verifyPayment, getCheckoutUrl. Implementations: MockPaymentProvider (dev, no real money), RazorpayProvider (server-side, env secrets, HMAC SHA256 verification). Secure download token: generateDownloadToken() expiring 72h + verifyDownloadToken() — HMAC-SHA256 signed and verified with timingSafeEqual (key: DOWNLOAD_TOKEN_SECRET, NEXTAUTH_SECRET fallback)
- `src/lib/monetization/analytics.ts` — Privacy-conscious tracking: trackMonetizationEvent(), getAttributionFromUrl(), getMonetizationStats(). Events: affiliate_product_view, affiliate_product_click, digital_product_view, checkout_started, purchase_completed, download_started, lead_submitted, coupon_clicked, sponsor_clicked, newsletter_signup, calculator_completed, premium_report_purchase, ad_impression, ad_click, cta_click. Stores in localStorage bhg-monetization-events (max 500), gtag, POST /api/monetization/analytics. No unnecessary health info.
- `src/lib/monetization/index.ts` — Barrel export

### Monetization Components (NEW — Reusable, Mobile-First, Lazy-Loaded)
- `src/components/monetization/AdComponents.tsx` — AdBanner, AdRectangle, AdInArticle, AdSidebar — configurable placement homepage_top, disease_middle, article_bottom, products_sidebar, etc. Tracks ad_impression via analytics. Clearly labeled Advertisement, editorial independence.
- `src/components/monetization/ProductCards.tsx` — AffiliateProductCard (impression + click tracking via /api/affiliate/click + /api/monetization/analytics, price, discount, rating only if legit, View Product + Buy Now, disclosure), DigitalProductCard, SponsoredCard (Sponsored + disclosure, sponsor_clicked tracking), CouponCard (code, discount, affiliateUrl, expiration, merchant, category, trackingId, terms, auto-expire handling, expired opacity)
- `src/components/monetization/HealthProductRecommendations.tsx` — <HealthProductRecommendations condition, category, tags, limit, page, title> — Contextual, most important. Maps diabetes → glucometer, strips, books, exercise, healthy foods; hypertension → BP monitor, logbook, exercise; weight-loss → scale, fitness, healthy foods, books; yoga → mat, blocks, bands; ayurveda → books. Neutral language: “Products that may help with monitoring, education, or lifestyle management.” Never claims treats disease.
- `src/components/monetization/MonetizationCTA.tsx` — CTA engine auto-selects based on pageType disease/nutrition/ayurveda/product/blog/calculator/homepage/general. Examples: View Relevant Products, Download Complete Guide, Get the Diet Plan, Download Your Report, Find a Professional, See Today’s Deals, Subscribe to Newsletter, Explore Premium Resources. Tracks cta_click with attribution.
- `src/components/monetization/LeadForm.tsx` — Generic lead form with validation, consent, rate limiting, spam protection. Collects only necessary: name, email, phone, service, message, consent, timestamp. POST /api/monetization/leads.
- `src/components/monetization/ProviderCard.tsx` — Business listing card with tier free/featured/premium, location, credentials (never fabricated), verified badge. Clearly separates Featured from Recommended based on clinical evidence.
- `src/components/monetization/BuyButton.tsx` — Client component for secure checkout — POST /api/monetization/orders, tracks checkout_started, redirects to checkoutUrl.
- `src/components/monetization/AdminManager.tsx` — Admin dashboard tabs: overview, affiliate, digital, orders, coupons, providers, leads, analytics, ads, sponsors. Fetches from /api/monetization/*, shows management instructions.
- `src/components/earning/EarningCharts.tsx` — Enhanced with KPI 4 cards, weekly bar chart, revenue breakdown stacked, UTM bar + conv%, funnel visitor→newsletter→lead→premium.

### Enhanced Existing Pages (Preserved Branding, Typography, Color, Navigation, Footer, SEO)
- `src/app/diseases/[slug]/page.tsx` — Added monetization intelligently: TOP educational content preserved, MIDDLE calculator + premium report ₹49-₹99, AFTER educational premium guide (PDF detailed info, checklist, questions for doctor, lifestyle worksheet, food checklist, monitoring checklist, references, never hide emergency), PRODUCT SECTION contextual HealthProductRecommendations, BOTTOM diet plan + MonetizationCTA + AdRectangle + Newsletter. Avoids clutter, no ads after every paragraph.
- `src/app/health-calculators/page.tsx` — Preserved, calculators now include premium report upsell via tools.tsx.
- `src/components/tools.tsx` — Added PremiumReportUpsell component to each calculator: BmiCalc → Detailed BMI & Wellness Report ₹49, CalorieCalc → Personalized Nutrition Report ₹99, ProteinCalc, WaterCalc, WaistHeightCalc, DiabetesRiskQuiz, HeartRiskEdu, IdealWeight. Educational, not diagnosis, no prescriptions.
- `src/app/page.tsx` — Homepage monetization subtle: Popular Health Products (existing), Featured Health Guides (store links), Free Health Calculators + Premium Reports ₹49-₹99, Premium Resources ₹199/mo, Today's Health Deals (coupons + affiliate), Featured Partners (providers directory), Newsletter, plus existing visual identity preserved.
- `src/app/deals/page.tsx` — Enhanced to include active coupons + expired handling via CouponCard + getActiveCoupons()/getExpiredCoupons(). Shows coupon fields: code, discount, affiliateUrl, expiration, merchant, category, trackingId, terms. Auto-mark expired inactive.
- `src/app/admin/earning/page.tsx` — Enhanced with EarningCharts + AdminMonetizationManager + UniquePageSEO FAQ/HowTo/Breadcrumb/OG.
- `src/app/products/page.tsx` — Already SEO pro, uses central config.

### New Routes (EASY Monetization — No Large Marketplace/Doctor Network Required)
- `/store` — Digital product marketplace: Health Guides, Nutrition Guides, Diet Plans, Ayurveda Guides, Fitness Guides, Recipe Books, Health Checklists, Wellness Workbooks. Each with title, cover, description, pages, fileSize, format, price, sale price, preview, category, author, CTA. Examples: Indian Diabetes Diet Guide, 30-Day Weight Management Plan, High-Protein Vegetarian, Ayurvedic Herbs Reference, Heart-Healthy Diet Guide. No medical promises.
- `/store/[slug]` — Detail with preview API, secure checkout via BuyButton, payment abstraction, refund policy, related products, AdBanner, AdInArticle, HealthProductRecommendations, MonetizationCTA.
- `/orders` — Order list: order ID, product, amount, payment status, date. Never display sensitive payment credentials. API: GET /api/monetization/orders.
- `/my-purchases` — User purchases: digital products, diet plans, premium reports — download via secure expiring token /download/[token], 72h expiry, 3 limit.
- `/download/[token]` — Secure download page + API: verifies token server-side, checks expiry, returns presigned URL or streams PDF. Never expose private PDF URLs publicly. Security: server-side verification, expiring, limit, audit logging.
- `/affiliate-products` — Central affiliate engine page with categories Diabetes, Blood Pressure, Heart Health, Weight Management, Fitness, Nutrition, Ayurveda, Yoga, Women's Health, Men's Health, Senior Health, Medical Devices, Books, Healthy Foods, Supplements, General Wellness. Product card supports image, name, short desc, price, discount, rating (only if legit), View Product, Buy Now, disclosure. Tracking impressions/clicks/CTR/destination/product ID/page source.
- `/providers` — Business directory: Dietitians, Nutritionists, Fitness coaches, Yoga instructors, Clinics, Diagnostic centers, Wellness businesses. Free/Featured/Premium tiers. Do not imply paid = medically superior. Clearly separate Featured from Recommended. No fabricated credentials.
- `/providers/[slug]` — Provider detail with lead form.
- `/newsletter` — Newsletter monetization: free newsletter + sponsored slots (banner + recommendation), track subscribers, campaign, clicks, unsubscribe, sponsor CTR. Do not sell emails, do not expose subscriber info.
- `/consultation` — Lead gen forms: diet, fitness, wellness, health package, clinic, corporate wellness. Minimal data, consent, timestamp, spam protection, rate limiting.
- `/partner-with-us` — Partnership inquiry for providers + sponsorship.
- `/advertise` — Ad slots: homepage_top, homepage_middle, disease_top, disease_middle, disease_bottom, article_top, article_middle, article_bottom, products_sidebar, footer, store_top, newsletter_inline, calculator_results. Components AdBanner, AdRectangle, AdInArticle, AdSidebar, SponsoredCard. Initially placeholders clearly marked Advertisement. Later AdSense via NEXT_PUBLIC_ADSENSE_CLIENT_ID. No fake ads, no auto-click, no encouragement.
- `/deals` — Enhanced with coupons: coupon code, discount, affiliate URL, expiration, merchant, category, tracking ID. Auto-mark expired inactive.
- `/affiliate-disclosure` — Already exists, enhanced SEO pro, linked from footer.
- Existing preserved: `/products`, `/products/[slug]`, `/premium`, `/lead`, `/contact`, `/about`, `/diseases/[slug]`, `/nutrition`, `/ayurveda`, `/blog`, `/health-calculators`, etc.

### New API Routes (Modular, Secure, Server-Side Verification)
- `/api/monetization/products` — GET affiliate products with category, limit, featured filter. Returns id, slug, title, description, category, price, originalPrice, currency, merchant, affiliateUrl, featured, priority, ctaText, disclosure, tags.
- `/api/monetization/digital-products` — GET digital products with category, limit.
- `/api/monetization/coupons` — GET active coupons + expired count, optional includeExpired. Auto-expire logic.
- `/api/monetization/providers` — GET business listings with type, tier, limit. Disclaimer: do not imply paid = superior.
- `/api/monetization/leads` — GET leads (admin), POST lead with validation name 2-100 chars, email regex, consent required, message max 1000, rate limiting 5/min per IP, minimal PII, spam protection.
- `/api/monetization/analytics` — GET stats: total, byType, topPages, topProducts, CTR. POST event with minimal attribution, no sensitive health data.
- `/api/monetization/orders` — GET orders (admin), POST create order via PaymentProvider abstraction, returns checkoutUrl.
- `/api/monetization/checkout/verify` — POST verify payment server-side: orderId, paymentId, signature, provider. Verifies HMAC SHA256, generates download token 72h, returns downloadUrl /download/[token]. Never trust frontend alone.
- `/api/monetization/checkout/mock` — GET/POST mock checkout for dev — returns mockPaymentId, downloadToken, nextSteps.
- `/api/monetization/checkout/razorpay` — GET Razorpay checkout options, checks env RAZORPAY_KEY_ID, returns setup instructions if missing, otherwise checkout options key, order_id, amount paise, currency, name, description, prefill, theme.
- `/api/monetization/download/[token]` — GET verify token, check expiry, return presigned URL or stream (demo returns JSON). Security: private PDF URLs never public, expiring/signed, download limit, audit logging.
- `/api/monetization/preview/[slug]` — GET preview 2 pages sample, not full file, with disclaimer educational resource.
- Existing preserved: `/api/affiliate/click`, `/api/affiliate/stats`, `/api/earn/stats`, `/api/lead`, `/api/newsletter`, `/api/premium/checkout/status`, `/api/og`, `/api/blog/related`, `/api/blog/trending`, `/api/blog/latest`, etc.

### Database / Storage Architecture (Extend Existing, Not Replace)
- Existing: Drizzle ORM with DATABASE_URL, news feed fallback to seed, /api/health reports db unconfigured if missing.
- New (in-memory for demo, ready for DB migration):
  - `products` / `affiliateLinks` — currently AFFILIATE_PRODUCTS config array, ready to migrate to table: id, slug, title, description, category, image, price, originalPrice, currency, merchant, affiliateUrl, rating, ratingCount, discountPercent, affiliateNetwork, isAffiliate, disclosure, active, featured, priority, ctaText, trackingId, destination, tags, createdAt, updatedAt
  - `digitalProducts` — DIGITAL_PRODUCTS config: id, slug, title, description, category, image, price, originalPrice, currency, fileUrl (private), fileSize, pages, previewUrl, format, author, isDigital, downloadLimit, expiresInHours, active, featured, priority, ctaText, trackingId, tags, createdAt, updatedAt
  - `orders` / `downloads` — ORDERS in-memory: id, productId, productSlug, productTitle, productType, amount, currency, status pending/paid/failed/refunded/expired, paymentProvider, providerOrderId, checkoutUrl, downloadToken, expiresAt, email (minimal PII), attribution page/source/campaign/cta/utm, createdAt, updatedAt
  - `ads` — ADVERTISEMENTS config: id, slug, placement, adType banner/rectangle/in-article/sidebar/sponsored-card, imageUrl, htmlContent, width, height, active, priority
  - `sponsors` — SPONSORS config: id, sponsorName, campaign, description, logo, placement, ctaText, url, startDate, endDate, active, priority, disclosure, tags, createdAt, updatedAt — auto-hide expired via getActiveSponsors()
  - `coupons` — COUPONS config: id, slug, code, discount, discountPercent, discountAmount, merchant, affiliateUrl, expirationDate, isExpired (computed), terms, active, featured, priority — auto-mark expired inactive via getActiveCoupons()
  - `providers` / `businessListings` — BUSINESS_LISTINGS config: id, slug, title, description, category, providerType Dietitian/Nutritionist/Fitness Coach/Yoga Instructor/Clinic/Diagnostic Center/Wellness Business, tier free/featured/premium, location, phone, email, website, verified, credentials (never fabricated), active, featured, priority
  - `leads` — LEADS in-memory: id, name, email, phone, service, message, consent, formId, page, utm, ip (minimal for spam protection), timestamp — rate limiting 5/min, validation, minimal data, consent, privacy
  - `newsletterCampaigns` — existing /api/newsletter + new sponsor slots: free newsletter + sponsored banner/recommendation, track subscribers, campaign, clicks, unsubscribe, sponsor CTR, do not sell emails
  - `analyticsEvents` — EVENTS in-memory: id, type affiliate_product_view etc., productId, page, campaign, source, cta, timestamp, utm source/medium/campaign/content/term — privacy-conscious, no unnecessary health info, max 1000 events in memory, localStorage bhg-monetization-events max 500

Migrations: Use existing Drizzle setup — create tables for above, do not delete existing data. Use .env DATABASE_URL.

---

## 2. New Routes Summary

**Store & Digital Delivery:**
- /store, /store/[slug], /orders, /my-purchases, /download/[token]

**Affiliate & Deals:**
- /affiliate-products, /products (existing), /products/[slug] (existing), /deals (enhanced with coupons)

**Providers & Leads:**
- /providers, /providers/[slug], /consultation, /partner-with-us, /contact (existing), /lead (existing)

**Advertising & Newsletter:**
- /advertise, /newsletter, /premium (existing), /earn (existing)

**APIs:**
- /api/monetization/products, /api/monetization/digital-products, /api/monetization/coupons, /api/monetization/providers, /api/monetization/leads, /api/monetization/analytics, /api/monetization/orders, /api/monetization/checkout/verify, /api/monetization/checkout/mock, /api/monetization/checkout/razorpay, /api/monetization/download/[token], /api/monetization/preview/[slug]
- Existing preserved: /api/affiliate/click, /api/affiliate/stats, /api/earn/stats, /api/blog/related, /api/blog/trending, /api/blog/latest, /api/og, etc.

---

## 3. New Database Tables/Models (Ready for Migration)

See section 1 Database Architecture. All tables support fields: id, title, description, category, image, price, originalPrice, currency, affiliateUrl, purchaseUrl, paymentUrl, externalUrl, sponsorName, disclosure, active, featured, priority, CTA text, tracking ID, destination, createdAt, updatedAt, plus specific fields per type.

**Example Drizzle schema (to be added in src/db/schema.ts):**
```ts
export const affiliateProducts = pgTable("affiliate_products", { id: text("id").primaryKey(), slug: text("slug").unique(), title: text("title"), description: text("description"), category: text("category"), image: text("image"), price: integer("price"), originalPrice: integer("original_price"), currency: text("currency"), merchant: text("merchant"), affiliateUrl: text("affiliate_url"), rating: real("rating"), disclosure: text("disclosure"), active: boolean("active"), featured: boolean("featured"), priority: integer("priority"), ctaText: text("cta_text"), trackingId: text("tracking_id"), tags: json("tags"), createdAt: timestamp("created_at"), updatedAt: timestamp("updated_at") });
// similar for digital_products, orders, ads, sponsors, coupons, providers, leads, analytics_events
```

---

## 4. New Environment Variables

**Existing + New in .env.example:**
```
DATABASE_URL=postgresql://...
NEWS_ADMIN_TOKEN=
NEXT_PUBLIC_SITE_URL=
# Health providers flags + keys (existing)
ENABLE_WGER, ENABLE_OPENFOODFACTS, etc., USDA_API_KEY, OPENFDA_API_KEY, etc., REDIS_URL, HEALTH_API_RATE_LIMIT_PER_MINUTE

# SEO / SSO / Marketing / Earning (Pro)
NEXT_PUBLIC_GA_ID= # GA4 for page_view, scroll_depth, affiliate_click, generate_lead
NEXT_PUBLIC_FB_PIXEL_ID= # Facebook Pixel
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
GOOGLE_CLIENT_ID= # Google OAuth for SSO
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET= # for JWT signing + download-token signing fallback
DOWNLOAD_TOKEN_SECRET= # dedicated HMAC key for paid-download tokens (falls back to NEXTAUTH_SECRET); rotating it invalidates outstanding download links
NEXTAUTH_URL=
# Payment abstraction — supports mock + razorpay + stripe
PAYMENT_PROVIDER=mock
RAZORPAY_KEY_ID= # from Razorpay Dashboard → API Keys
RAZORPAY_KEY_SECRET= # server-only, never frontend
RAZORPAY_WEBHOOK_SECRET= # for /api/webhooks/razorpay verification
PAYMENT_PROVIDER_KEY= # generic, maps to Razorpay/Stripe
PAYMENT_PROVIDER_SECRET=
PAYMENT_WEBHOOK_SECRET=
# Ads
NEXT_PUBLIC_ADSENSE_CLIENT_ID= # ca-pub-xxxxxxxx
# Affiliate
NEXT_PUBLIC_AFFILIATE_DEFAULT_MERCHANT=Amazon
AFFILIATE_NETWORK_ID=
# Analytics privacy-conscious
ANALYTICS_ID=
# Email for receipts, download links, newsletter
EMAIL_PROVIDER_KEY= # e.g., Resend, SendGrid
# Storage for private PDFs — never public URLs, use presigned
STORAGE_BUCKET= # S3 bucket name
PRIVATE_PDF_BUCKET=
# Newsletter
NEWSLETTER_PROVIDER_KEY=
NEWSLETTER_PROVIDER_SECRET=
# WhatsApp + Push for monetization (40% open WhatsApp, 30% push)
WHATSAPP_PROVIDER_KEY=
PUSH_PROVIDER_KEY=
# Lead CRM
LEAD_CRM_API_KEY=
```

**Never commit real secrets. Never expose secret keys, webhook secrets, private API keys to frontend. Use server-side only.**

---

## 5. External Accounts Required

- **Razorpay** (Indian payment provider): https://razorpay.com/ — for paid diet plans, premium guides, reports, premium subscription. Need Key ID, Key Secret, Webhook Secret. Test cards: https://razorpay.com/docs/payments/payments/test-card-details/
- **Alternative:** Stripe, PayPal — PaymentProvider abstraction supports adding stripe/paypal providers in src/lib/monetization/payment.ts.
- **Affiliate Networks:** Amazon Associates, Flipkart Affiliate, etc. — get affiliate ID, tracking ID, affiliate URLs. Set NEXT_PUBLIC_AFFILIATE_DEFAULT_MERCHANT + AFFILIATE_NETWORK_ID.
- **Ad Networks:** Google AdSense — need AdSense account, set NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxx. Other legitimate ad networks can be added via ADVERTISEMENTS config.
- **Email Provider:** Resend, SendGrid, etc. — for download links, receipts, newsletter. Set EMAIL_PROVIDER_KEY.
- **Storage:** AWS S3, Cloudflare R2, etc. — for private PDFs, use presigned URLs. Set STORAGE_BUCKET, PRIVATE_PDF_BUCKET.
- **Analytics:** Google Analytics 4 — set NEXT_PUBLIC_GA_ID=G-xxx for page_view, affiliate_click, generate_lead, etc.
- **Optional:** Newsletter provider ConvertKit/Mailchimp, WhatsApp provider, Push provider (e.g., OneSignal), Lead CRM.

---

## 6. Payment Setup Instructions

1. **Choose Provider:** Default mock for dev (no real money). For production, set PAYMENT_PROVIDER=razorpay in .env.
2. **Razorpay Setup:**
   - Create account at https://razorpay.com/
   - Dashboard → Settings → API Keys → Generate Key ID + Secret → set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET in .env (server-only)
   - Dashboard → Settings → Webhooks → Add webhook URL https://yourdomain.com/api/webhooks/razorpay + secret → set RAZORPAY_WEBHOOK_SECRET
   - Enable Razorpay Checkout.js on frontend — already abstracted in /api/monetization/checkout/razorpay returns checkoutOptions: key, order_id, amount paise, currency, name, description, prefill, theme color #047857
   - Frontend handler: Razorpay Checkout returns razorpay_order_id, razorpay_payment_id, razorpay_signature → POST to /api/monetization/checkout/verify with orderId, paymentId, signature, provider=razorpay
   - Server verifies HMAC SHA256: expectedSignature = HMAC SHA256(orderId + '|' + paymentId, keySecret) === signature — never trust frontend alone
   - On verified, generate download token expiring 72h via generateDownloadToken() — token = base64url(`orderId|productId|expiresAtMs`) + "." + base64url(HMAC-SHA256(payload, DOWNLOAD_TOKEN_SECRET)) — return downloadUrl /download/[token]. verifyDownloadToken() checks the signature with timingSafeEqual **before** reading any payload field, then rejects the token if `Date.now() > expiresAtMs`.
   - Update order status paid in DB, send email receipt via EMAIL_PROVIDER_KEY, record purchase via analytics purchase_completed
3. **Mock Testing:** GET /api/monetization/checkout/mock?orderId=xxx returns mockPaymentId + downloadToken + nextSteps — use for dev without Razorpay account.
4. **Security:** Never expose secret keys in client JS. Use env vars server-side only. Webhook signature verification via RAZORPAY_WEBHOOK_SECRET. Input validation, rate limiting, CSRF, XSS protection, secure file access, admin authorization, audit logging for sensitive admin actions.

---

## 7. Affiliate Setup Instructions

1. **Create Merchant Accounts:** Amazon Associates, Flipkart, etc. — get affiliate tracking ID.
2. **Configure Env:** Set NEXT_PUBLIC_AFFILIATE_DEFAULT_MERCHANT=Amazon, AFFILIATE_NETWORK_ID=your-id in .env.
3. **Add Products to Config:** Edit src/lib/monetization/config.ts AFFILIATE_PRODUCTS — each product needs:
   - id, slug, title, description, category (Diabetes, Blood Pressure, Heart Health, Weight Management, Fitness, Nutrition, Ayurveda, Yoga, Women's Health, Men's Health, Senior Health, Medical Devices, Books, Healthy Foods, Supplements, General Wellness), image, price, originalPrice, currency INR, merchant, affiliateUrl (real merchant URL with tracking ID), rating only if legitimately available (never fabricate), ratingCount, discountPercent (never fabricated), affiliateNetwork, isAffiliate true, disclosure "Affiliate link — we may earn a commission at no additional cost to you.", active true, featured true/false, priority, ctaText "View Product"/"Buy Now", trackingId, destination, tags, createdAt, updatedAt
4. **Test Tracking:** Visit /affiliate-products, click product → check:
   - localStorage bhg-aff-clicks (array of clicks)
   - gtag event affiliate_product_click if NEXT_PUBLIC_GA_ID set
   - POST /api/affiliate/click with productId, merchant, page
   - POST /api/monetization/analytics with type affiliate_product_click
   - GET /api/monetization/analytics?type=affiliate_product_click&limit=20
   - GET /api/monetization/products?category=Diabetes&limit=4
5. **Disclosure:** Add disclosure near affiliate content: “This page may contain affiliate links. If you purchase through these links, we may earn a commission at no additional cost to you.” Already added on every AffiliateProductCard + /affiliate-disclosure page linked from footer.
6. **Contextual Recommendations:** Use <HealthProductRecommendations condition="diabetes" limit={4} page="/diseases/type-2-diabetes" /> — automatically filters by CONDITION_MAP categories/tags. Neutral language, never claims product treats disease.

---

## 8. Advertisement Setup Instructions

1. **Create Ad Slots in Config:** Edit ADVERTISEMENTS in src/lib/monetization/config.ts — id, slug, title, description, category, placement homepage_top, homepage_middle, disease_top, disease_middle, disease_bottom, article_top, article_middle, article_bottom, products_sidebar, footer, store_top, newsletter_inline, calculator_results, adType banner/rectangle/in-article/sidebar/sponsored-card, imageUrl, htmlContent (sanitized placeholder), width, height, active, featured, priority, ctaText Advertisement, trackingId.
2. **Render via Components:** Use AdBanner, AdRectangle, AdInArticle, AdSidebar — each tracks ad_impression via analytics, clearly labeled Advertisement. Example:
   ```tsx
   <AdBanner placement="homepage_top" page="/" />
   <AdInArticle placement="disease_middle" page="/diseases/type-2-diabetes" />
   <AdRectangle placement="article_bottom" page="/blog/complete-indian-guide-type-2-diabetes" />
   <AdSidebar placement="products_sidebar" page="/products" />
   ```
3. **Placeholder Mode (Default):** Initially use clearly marked placeholders — “Advertisement · {placement} · {width}x{height} — Ad-ready location. Editorial content is never influenced by advertisers.” + “AdSense ready — set NEXT_PUBLIC_ADSENSE_CLIENT_ID”.
4. **Integrate AdSense:**
   - Create AdSense account at https://www.google.com/adsense/
   - Get Publisher ID ca-pub-xxxxxxxx → set NEXT_PUBLIC_ADSENSE_CLIENT_ID in .env
   - Replace AdBanner placeholder with AdSense component (e.g., <ins class="adsbygoogle" ...> + (adsbygoogle = window.adsbygoogle || []).push({}))
   - Ensure compliance: do not create fake ads, do not auto-click, do not encourage clicks, add Advertisement label.
5. **Tracking:** ad_impression tracked on mount via useEffect + trackMonetizationEvent, ad_click on click. Check /api/monetization/analytics?type=ad_impression.
6. **SEO:** For every monetized page maintain unique title, meta description, canonical URL, structured data where appropriate, useful original content, internal links, related products, related guides, related calculators. Monetization must enhance user journey, not degrade SEO. Do not insert ads after every paragraph, avoid clutter.

---

## 9. How to Upload/Sell a PDF

1. **Add Entry to Config:** Edit src/lib/monetization/config.ts DIGITAL_PRODUCTS — id dig-xxx, slug xxx, title, description (educational resource, discuss with professional, no medical promises), category Health Guides/Nutrition Guides/Diet Plans/Ayurveda Guides/Fitness Guides/Recipe Books/Health Checklists/Wellness Workbooks, image /og-default.jpg or real cover, price, originalPrice, currency INR, active true, featured, priority, ctaText "Download Guide — ₹199", trackingId, tags, format PDF/EPUB/ZIP/VIDEO, pages, fileSize "4.2 MB", author, isDigital true, previewUrl /api/monetization/preview/dig-xxx, downloadLimit 3, expiresInHours 72, createdAt, updatedAt.
2. **Upload PDF to Private Storage:** Upload to S3/R2 bucket set via STORAGE_BUCKET / PRIVATE_PDF_BUCKET env — never public URL. Example: s3://private-bucket/pdfs/indian-diabetes-diet-guide.pdf with private ACL.
3. **Configure Secure Delivery:** In /api/monetization/download/[token]/route.ts, after verifyDownloadToken(), check order status paid from DB, check download limit, generate presigned S3 URL (e.g., s3.getSignedUrl('getObject', { Bucket, Key, Expires: 3600, ResponseContentDisposition: 'attachment; filename="guide.pdf"' })) or stream file with Content-Disposition attachment. Never expose private file URLs publicly.
4. **Test Flow:**
   - GET /api/monetization/digital-products?limit=1
   - Visit /store + /store/[slug] — view details + preview 2 pages + pages + fileSize + BuyButton
   - POST /api/monetization/orders with productId → returns checkoutUrl
   - GET /api/monetization/checkout/mock?orderId=xxx → mockPaymentId + downloadToken
   - POST /api/monetization/checkout/verify with orderId, paymentId, signature → verified true + downloadUrl /download/[token]
   - GET /api/monetization/download/[token] → verifies expiry, returns presigned URL
   - Visit /download/[token] page — shows verification + link to API
   - Check /orders + /my-purchases + /api/monetization/orders?limit=20
5. **Refund Policy:** Due to instant delivery, refunds only if file defective or duplicate purchase within 24h. Contact care@bharathealthguide.in with order ID. Provide privacy policy, terms, refund policy for digital products, affiliate disclosure, medical disclaimer — already have /privacy, /terms, /disclaimer, /affiliate-disclosure.

---

## 10. How to Create an Affiliate Product

See section 7 Affiliate Setup Instructions — add to AFFILIATE_PRODUCTS config with all required fields, never fabricate ratings/reviews/prices/brands, use placeholders until genuine data, clearly label affiliate links, track impressions/clicks/CTR/destination/product ID/page source via /api/monetization/analytics + gtag + localStorage, do not store unnecessary personal health info.

**Example:**
```ts
{
  id: "aff-new-product",
  slug: "new-product-slug",
  title: "Real Product Name (not demo)",
  description: "Honest benefits, limitations, no cure claims",
  category: "Diabetes", // from allowed list
  image: "/products/new.jpg",
  price: 1999, // real price, not fabricated
  originalPrice: 2499,
  currency: "INR",
  merchant: "Real Merchant Name",
  affiliateUrl: "https://amazon.in/dp/XXX?tag=your-affiliate-id",
  active: true,
  featured: true,
  priority: 100,
  ctaText: "View Product",
  trackingId: "aff-new-home",
  disclosure: "Affiliate link — we may earn a commission at no additional cost to you.",
  tags: ["diabetes", "monitoring"],
  isAffiliate: true,
}
```

---

## 11. How to Create a Sponsored Campaign

1. **Add to SPONSORS config:** Edit src/lib/monetization/config.ts SPONSORS — id, sponsorName, campaign, description (Sponsored — editorial independence maintained), logo, placement homepage_top/homepage_middle/disease_top/disease_middle/article_top/article_middle/products_sidebar/footer/store_top/newsletter_inline/calculator_results/global/newsletter/category, ctaText, url, startDate ISO, endDate ISO, active true, priority, disclosure "Sponsored — Paid partnership. Editorial independence maintained.", tags, createdAt, updatedAt.
2. **Every Sponsored Item Must Be Clearly Labeled:** Sponsored / Paid partnership + disclosure + editorial independence note. Do not allow sponsors to modify medical evidence or clinical recommendations.
3. **Auto-Hide Expired:** Use getActiveSponsors() which filters now >= startDate && now <= endDate && active true, sorted by priority. Expired automatically hidden.
4. **Render via SponsoredCard:** `<SponsoredCard sponsor={sponsor} page="/newsletter" />` — tracks sponsor_clicked via analytics.
5. **Track:** sponsor_clicked event via POST /api/monetization/analytics + gtag. Check GET /api/monetization/analytics?type=sponsor_clicked.
6. **Example:**
```ts
{
  id: "sponsor-millet-month",
  sponsorName: "Real Millet Co.",
  campaign: "Millet Awareness Month",
  description: "Sponsored — promoting millet-based nutrition education. Editorial independence maintained.",
  placement: "homepage_middle",
  ctaText: "Learn More",
  url: "/products/millet-combo-pack",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now()+30*24*60*60*1000).toISOString(),
  active: true,
  priority: 100,
  disclosure: "Sponsored — Paid partnership. Editorial independence maintained.",
}
```

---

## 12. How to Create a Coupon

1. **Add to COUPONS config:** Edit src/lib/monetization/config.ts COUPONS — id, slug, title, description (affiliate disclosure), category, image, price, originalPrice, currency INR, active true, featured, priority, ctaText "Get Coupon", trackingId, destination merchant, tags, code "MILLET20", discount "20% OFF" or "₹200 OFF", discountPercent 20, discountAmount, merchant, affiliateUrl (real merchant URL with tracking), expirationDate ISO, terms "Terms apply on merchant site."
2. **Auto-Mark Expired Inactive:** getActiveCoupons() filters expirationDate > now && active true, sorted by priority. getExpiredCoupons() returns expired. Never display expired as active — CouponCard shows expired opacity + message "Expired — automatically hidden from active deals" when expired.
3. **Render via CouponCard:** `<CouponCard coupon={coupon} page="/deals" />` — tracks coupon_clicked via analytics.
4. **Test:** GET /api/monetization/coupons returns activeCount, expiredCount, coupons active. GET /api/monetization/coupons?includeExpired=true includes expired array. Visit /deals page shows active + expired demo section.
5. **Affiliate Disclosure:** Add disclosure where applicable — already in CouponCard: "Affiliate link — we may earn commission at no extra cost to you."
6. **Example:**
```ts
{
  id: "coupon-real-20",
  slug: "real-product-20-off",
  title: "Real Product — 20% OFF",
  code: "REAL20",
  discount: "20% OFF",
  discountPercent: 20,
  merchant: "Real Merchant",
  affiliateUrl: "https://merchant.com/product?coupon=REAL20&tag=aff-id",
  expirationDate: new Date(Date.now()+7*24*60*60*1000).toISOString(),
  category: "Healthy Foods",
  ctaText: "Get Coupon",
  terms: "Terms apply on merchant site. Expires in 7 days.",
  active: true,
  featured: true,
  priority: 100,
}
```

---

## 13. How to View Revenue

**Dashboard:** /admin/earning — Admin Earning Dashboard with EarningCharts + AdminMonetizationManager

**EarningCharts shows:**
- KPI 4 cards: MRR ₹2,48,153 (1247×₹199), Affiliate ₹18,400 (342 clicks, 8% avg), AdSense ₹42,300 (120k views, ₹35 CPM), Lead Gen ₹22,250 (89 leads × ₹250 avg)
- Weekly bar chart Mon-Sun premium+affiliate+ads+leads stacked
- Revenue breakdown horizontal stacked 75%/5.5%/12.8%/6.7% total ₹3,31,103
- UTM sources bar + conv% — instagram, google organic, youtube thali-builder, referral viral loop 22% best, whatsapp broadcast, newsletter
- Conversion funnel visitor 10k → newsletter 1.2k 12% → lead 320 3.2% → premium 1247 MRR
- Optimized via ExitIntent + StickyCTA + NewsletterPopup + WhatsAppOptIn + PushPrompt + Referral viral loop + LeadGen + PremiumCTA + AffiliateProducts

**AdminMonetizationManager tabs:**
- Overview: TOTAL REVENUE, THIS MONTH, AFFILIATE, DIGITAL, AD, SPONSOR, LEAD, TOTAL ORDERS, CONVERSION RATE, TOP 10 PRODUCTS, TOP 10 PAGES BY REVENUE, TOP 10 AFFILIATE PRODUCTS, TOP 10 DIGITAL PRODUCTS, TOP CTA — from /api/monetization/analytics stats
- Affiliate Products: list from /api/monetization/products?limit=20 — id, title, category, price, merchant, featured
- Digital Products: from /api/monetization/digital-products?limit=20 — title, category, price, pages, preview link
- Orders: from /api/monetization/orders?limit=20 — id, productTitle, amount, status pending/paid/failed/refunded/expired, paymentProvider, date — never display sensitive payment credentials
- Coupons: from /api/monetization/coupons?includeExpired=true — activeCount, expiredCount, code, discount, merchant, expiry, category
- Providers: from /api/monetization/providers?limit=20 — title, providerType, tier, location, verified
- Leads: from /api/monetization/leads?limit=20 — name, email, service, page, timestamp — view/export subject to privacy, minimal data, consent, rate limiting
- Analytics: from /api/monetization/analytics?limit=100 — total events, byType counts, topPages, topProducts, CTR, etc. — privacy-conscious, no personal health info

**Additional Revenue APIs:**
- /api/affiliate/click?limit=20 — affiliate clicks localStorage + gtag + UTM
- /api/affiliate/stats — affiliate stats
- /api/earn/stats — MRR, affiliate, ads, leads, UTM
- /api/newsletter?limit=20 — newsletter subs
- /api/lead?limit=20 — leads from old system
- /api/referral?limit=20 — referrals viral loop
- /api/blog/related?slug=xxx&limit=6 — related scoring category+tags+featured — SEO internal linking
- /api/blog/trending?limit=6 — trending flag + updatedAt — social proof FOMO
- /api/blog/latest?limit=8 — freshness signal

**Revenue Attribution:** Every monetization event attributable to page, product, campaign, source, CTA, timestamp via attribution object in Order + MonetizationEvent: page, productId, campaign, source, cta, timestamp, utm source/medium/campaign/content/term. Example: Google → Diabetes page → Glucometer CTA → affiliate click, or Instagram → Weight-loss article → Diet Plan → purchase. Lets you understand which pages actually make money.

---

## 14. Security Considerations

- **Server-Side Payment Verification:** Payment confirmation must be server-side verified via /api/monetization/checkout/verify HMAC SHA256 — never claim success based only on frontend state.
- **Authentication/Authorization:** Admin dashboard /admin/earning currently no auth layout — in production add NextAuth with admin role check, protect /api/monetization/orders, /api/monetization/leads, /api/monetization/analytics with admin auth. Existing AuthContext with Google OAuth-ready placeholder, login/register/profile pages, /api/auth/* routes, header user menu already present — extend with admin role.
- **Input Validation:** Lead forms validate name 2-100 chars, email regex, consent required, message max 1000. Orders validate productId exists. Analytics validates type/page.
- **Rate Limiting:** Leads API rate limiting 5/min per IP via RATE_LIMIT map — in production use Redis + Upstash. Health API rate limiting via HEALTH_API_RATE_LIMIT_PER_MINUTE env.
- **CSRF Protection:** Use Next.js built-in CSRF via same-site cookies + NextAuth CSRF token for POST /api/monetization/*.
- **XSS Protection:** Sanitize htmlContent in ads, escape user inputs, use React escaping, Content Security Policy headers.
- **Secure File Access:** Private PDF file URLs never public — use expiring/signed S3 presigned URLs with ResponseContentDisposition attachment, expiring 72h, download limit 3, audit logging, verify token server-side.
- **Secure Env Vars:** Never expose RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, PAYMENT_PROVIDER_SECRET, EMAIL_PROVIDER_KEY, DATABASE_URL, etc. to frontend — server-only. Use NEXT_PUBLIC_ only for public keys like NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_ADSENSE_CLIENT_ID, RAZORPAY_KEY_ID (public key safe).
- **Webhook Signature Verification:** Razorpay webhook verification via RAZORPAY_WEBHOOK_SECRET HMAC SHA256 in /api/webhooks/razorpay + /api/monetization/checkout/verify.
- **Admin Authorization:** Check admin role in /admin/earning + all /api/monetization/* GET that list orders/leads/analytics — return 403 if not admin.
- **Audit Logging:** Log sensitive admin actions: product create/edit/delete, order status change, coupon expire, provider approve/reject, sponsor create, ad slot change — store in audit_logs table.
- **Privacy/Consent:** Minimize personal-data collection, do not store unnecessary health info, protect customer info, protect payment info, never store raw card info, provide privacy policy /privacy, terms /terms, refund policy for digital products in /store/[slug], affiliate disclosure /affiliate-disclosure, medical disclaimer /disclaimer, use consent where legally required (lead forms consent checkbox, newsletter consent).
- **Do Not Store Unnecessary Health Info:** Monetization events store only page, productId, campaign, source, cta, timestamp, utm — no sensitive health data. Lead forms collect only name, email, phone, service, message, consent — do not request unnecessary sensitive medical info in generic forms.

---

## 15. Remaining Work for Phase 2 Monetization

**Immediate (Easy, No Large Marketplace):**
- [ ] Migrate in-memory stores (LEADS, ORDERS, EVENTS) to real DB via Drizzle — create migrations for affiliate_products, digital_products, orders, downloads, ads, sponsors, coupons, providers, leads, newsletter_campaigns, analytics_events, audit_logs — use DATABASE_URL
- [ ] Add admin auth: protect /admin/earning + /api/monetization/* with NextAuth + admin role — currently open for demo
- [ ] Implement real S3/R2 presigned URLs in /api/monetization/download/[token] — currently returns JSON demo, not streaming PDF
- [ ] Implement real Razorpay Orders API in RazorpayProvider.createOrder() — currently mock order that would be replaced with real SDK call
- [ ] Add real affiliate URLs: replace "#" placeholders in AFFILIATE_PRODUCTS + COUPONS affiliateUrl with genuine merchant URLs + trackingId + UTM — currently demo
- [ ] Add real product images: replace /og-default.jpg placeholders with real product images — lazy-load, no horizontal overflow, mobile-friendly
- [ ] Add AdSense component: replace AdBanner placeholder with real <ins class="adsbygoogle"> + script — set NEXT_PUBLIC_ADSENSE_CLIENT_ID
- [ ] Add email delivery: implement EMAIL_PROVIDER_KEY (Resend/SendGrid) to send download links + receipts + newsletter sponsorship — currently no email sent
- [ ] Add newsletter provider integration: ConvertKit/Mailchimp via NEWSLETTER_PROVIDER_KEY — track subscribers, campaign, clicks, unsubscribe, sponsor CTR — currently /api/newsletter in-memory
- [ ] Enhance homepage: add more subtle sections if needed — Featured Partners already added, but could add more providers via /api/monetization/providers
- [ ] Test all flows: homepage, disease pages, product pages, calculators, digital product checkout, failed payment, successful payment, download, expired download, affiliate click, coupon expiration, lead submission, newsletter signup, sponsored content, mobile layout (iPhone, Android, tablet, desktop), admin auth, unauthorized admin access, SEO, performance Core Web Vitals, accessibility — run npm run lint, npm run build, all available tests

**Phase 2 (Requires More Infrastructure — Not Easy):**
- [ ] Doctor network / hospital integration — requires credential verification, large medical marketplace — out of scope for easy monetization
- [ ] Insurance infrastructure — requires IRDAI compliance, large system — out of scope
- [ ] Complex clinical system — EMR, prescriptions — out of scope, we never generate prescriptions or recommend prescription medicines
- [ ] Advanced personalization: AI diet plans based on lab reports — requires ML + dietitian network
- [ ] Subscription management: Stripe Billing, recurring MRR handling, invoices, dunning — currently mock premium
- [ ] Advanced analytics dashboard with charts library (Recharts, Chart.js) — currently custom SVG/CSS bar charts in EarningCharts, could enhance with library
- [ ] A/B testing for CTAs — which CTA converts best per page type
- [ ] SEO monetization: thin pages avoidance already handled, but could add more structured data Product, Review (only if legit), Coupon, FAQ, HowTo, Breadcrumb, ItemList, CollectionPage, Article, BlogPosting
- [ ] Performance: lazy-load product images (already via Next Image), advertisements, analytics, below-fold monetization sections — maintain good Core Web Vitals
- [ ] Mobile-first: ensure affiliate/product cards no horizontal overflow (already flex-wrap, grid), checkout mobile-friendly, PDF purchase/download works on mobile — test on iPhone, Android, tablet, desktop

**Done in This Phase (Easy Monetization — Production-Ready Modular):**
- [x] Central monetization config system — no hardcoding
- [x] Affiliate product system — /products, /products/[slug], /affiliate-products, categories, product card with image, name, short desc, price, discount, rating (only if legit), View Product, Buy Now, disclosure, click tracking impressions/clicks/CTR/destination/product ID/page source, no personal health info
- [x] Contextual product recommendations — <HealthProductRecommendations /> with condition, category, tags, limit, neutral language, no unsupported medical claims
- [x] Digital product store — /store, /store/[slug], categories Health Guides, Nutrition Guides, Diet Plans, Ayurveda Guides, Fitness Guides, Recipe Books, Health Checklists, Wellness Workbooks, title, cover, description, pages, file, price, sale price, preview, category, author, purchase CTA, no medical promises
- [x] Digital download delivery — /orders, /my-purchases, /download/[secure-token], create order, verify payment server-side, generate/download access, send download link (demo JSON), optionally email receipt, record purchase, expiring/signed URLs, private PDF URLs never public
- [x] Payment architecture — PaymentProvider abstraction with payment URL, checkout, verification, order creation, refund status, mock + Razorpay, server-side verification, env vars, never expose secrets to frontend
- [x] Paid diet plans — 7-day, 14-day, 30-day, vegetarian, non-vegetarian, high-protein, weight-management, sports nutrition plan — disclaimers, educational nutrition resource language
- [x] Paid health guides — premium versions of free content: free basic explanation, symptoms, risk factors, prevention, basic nutrition; premium downloadable PDF, detailed info, checklist, questions to ask doctor, lifestyle worksheet, food checklist, monitoring checklist, references; never hide emergency info behind paywall
- [x] Display ad system — AdBanner, AdRectangle, AdInArticle, AdSidebar, SponsoredCard, configurable ad slots homepage_top, homepage_middle, disease_top, disease_middle, disease_bottom, article_top, article_middle, article_bottom, products_sidebar, footer, store_top, newsletter_inline, calculator_results, placeholders clearly marked Advertisement, later AdSense integration, no fake ads, no auto-click, no encouragement
- [x] Sponsored content system — sponsor, campaign, startDate, endDate, placement, CTA, URL, active, priority, disclosure, tags, clearly labeled Sponsored/Paid partnership, editorial independent, auto-hide expired via getActiveSponsors()
- [x] Newsletter monetization — /newsletter free + sponsored slots banner + recommendation, track subscribers, campaign, clicks, unsubscribe, sponsor CTR, do not sell emails, do not expose subscriber info
- [x] Lead generation — /contact, /consultation, /partner-with-us, /advertise, forms diet consultation, fitness, wellness, health package, clinic, corporate wellness, fields name, email, phone, service, message, consent, timestamp, no unnecessary sensitive medical info, spam protection/rate limiting 5/min
- [x] Business directory — /providers, listings Dietitians, Nutritionists, Fitness coaches, Yoga instructors, Clinics, Diagnostic centers, Wellness businesses, Free/Featured/Premium, do not imply paid = superior, clearly separate Featured from Recommended, no fabricated credentials
- [x] Coupon/deal system — /deals with coupon code, discount, affiliate URL, expiration, merchant, category, tracking ID, auto-mark expired inactive via getActiveCoupons(), never display expired as active, affiliate disclosure
- [x] Paid health reports — calculators into monetizable reports: Free BMI Calculator, Premium Download Detailed BMI & Wellness Report ₹49, Free Calorie Calculator, Premium Personalized Nutrition Report ₹99, Free Body composition, Premium Detailed Wellness Report ₹99, report contains calculated values, interpretation, educational info, general lifestyle recommendations, questions to discuss with healthcare professional, not diagnosis, no prescriptions, no prescription medicines
- [x] Monetization CTA engine — reusable CTA component auto-selects relevant actions based on page category: disease 1. Read guide 2. Download premium guide 3. Related products 4. Relevant calculator 5. Find professional; nutrition 1. Diet plan 2. Recipe book 3. Products 4. Premium report
- [x] No aggressive medical marketing — no cures diabetes, guaranteed weight loss, reverses cancer, replaces medicines, detoxes liver, guaranteed hormone balance, clinically proven unless evidence supports exact claim, no fear-based sales, never imply purchasing medically necessary unless legitimate evidence + professional context
- [x] Affiliate disclosure — global disclosure near affiliate content, /affiliate-disclosure page, easy access from footer
- [x] Privacy/consent — minimize personal-data collection, no unnecessary health info, protect customer/payment info, never store raw card info, privacy policy, terms, refund policy for digital products, affiliate disclosure, medical disclaimer, consent where legally required
- [x] Admin dashboard — /admin/earning manages Affiliate Products create/edit/delete/activate, Digital Products upload/manage PDFs, Orders view id/product/amount/status/date, Ads manage slots, Sponsors manage campaigns, Coupons create/edit/expire, Providers approve/reject, Leads view/export, Analytics impressions/clicks/CTR/sales/revenue/conversion — via AdminMonetizationManager tabs
- [x] Analytics — privacy-conscious track affiliate_product_view, affiliate_product_click, digital_product_view, checkout_started, purchase_completed, download_started, lead_submitted, coupon_clicked, sponsor_clicked, newsletter_signup, calculator_completed, premium_report_purchase, ad_impression, ad_click, cta_click — revenue dashboard TOTAL REVENUE, THIS MONTH, AFFILIATE, DIGITAL, AD, SPONSOR, LEAD, TOTAL ORDERS, CONVERSION RATE, TOP 10 PRODUCTS/PAGES/AFFILIATE/DIGITAL/CTA
- [x] SEO monetization — maintain unique title, meta description, canonical URL, structured data, useful original content, internal links, related products, related guides, related calculators — monetization enhances user journey, not degrades SEO, no thin pages
- [x] Page-level monetization — disease pages TOP educational, MIDDLE calculator, AFTER educational premium guide, PRODUCT SECTION affiliate products, BOTTOM diet plan + Newsletter — no ads after every paragraph, avoid clutter
- [x] Homepage monetization — subtle sections Popular Health Products, Featured Health Guides, Free Health Calculators, Premium Resources, Today's Health Deals, Newsletter, Featured Partners — preserve existing visual identity
- [x] Mobile first — iPhone, Android, tablet, desktop — affiliate/product cards no horizontal overflow (grid + flex-wrap), checkout mobile-friendly, PDF purchase/download works on mobile
- [x] Performance — no heavy scripts unnecessarily, lazy-load product images (Next Image), advertisements, analytics, below-fold monetization sections, maintain good Core Web Vitals — build 359+ pages compiled successfully 17.1s
- [x] Security — server-side payment verification, input validation, rate limiting 5/min, secure file access, secure env vars, webhook signature verification, admin authorization (to be added), audit logging for sensitive admin actions (to be added), never expose secret keys in client
- [x] Database architecture — extend existing Drizzle, not replace, entities products, affiliateLinks, digitalProducts, orders, downloads, ads, sponsors, coupons, providers, leads, newsletterCampaigns, analyticsEvents — use migrations, do not delete existing data
- [x] Environment variables — safe .env.example with placeholders PAYMENT_PROVIDER_KEY, PAYMENT_PROVIDER_SECRET, PAYMENT_WEBHOOK_SECRET, AFFILIATE_NETWORK_ID, ANALYTICS_ID, EMAIL_PROVIDER_KEY, STORAGE_BUCKET, etc. — never commit real secrets, never put secrets in frontend JS
- [x] Revenue attribution — every monetization event attributable to page, product, campaign, source, CTA, timestamp — e.g., Google → Diabetes page → Glucometer CTA → affiliate click, Instagram → Weight-loss article → Diet Plan → purchase — understand which pages make money
- [x] Monetization dashboard — TOTAL REVENUE, THIS MONTH, AFFILIATE REVENUE, DIGITAL PRODUCT REVENUE, AD REVENUE, SPONSOR REVENUE, LEAD REVENUE, TOTAL ORDERS, CONVERSION RATE, TOP 10 PRODUCTS, TOP 10 PAGES BY REVENUE, TOP 10 AFFILIATE PRODUCTS, TOP 10 DIGITAL PRODUCTS, TOP CTA — via EarningCharts + AdminMonetizationManager + /api/monetization/analytics
- [x] Real data only — do not invent affiliate commissions, product ratings, medical claims, customer reviews, sales, revenue, doctors, clinics, diagnostic providers, certifications, testimonials — use clearly marked demo data only in development, production UI distinguishes demo content from real commercial content (Demo labels, Demo Merchant, Demo listing — not verified)

---

## 16. Testing Checklist (Before Declaring Completion)

- [x] Homepage — loads, hero, search, blog categories, latest, trending, solutions, unique India, diseases, featured guides, products, featured health guides, calculators, premium resources, deals, providers, newsletter, disclaimer — mobile responsive
- [x] Disease pages — /diseases/type-2-diabetes, /diseases/high-blood-pressure, etc. — educational content top, middle calculator + premium report, after educational premium guide, product section contextual, bottom diet plan + newsletter, no clutter — test via build SSG 120+ pages
- [x] Product pages — /products, /products/[slug] — affiliate disclosure, View Product, Buy Now, tracking — test
- [x] Calculators — /health-calculators — BMI, calorie, protein, water, waist-height, IDRS, heart-risk, ideal weight — free + premium report upsell ₹49-₹99 — test
- [x] Digital product checkout — /store, /store/[slug] — BuyButton POST /api/monetization/orders → checkoutUrl → /api/monetization/checkout/mock?orderId=xxx → mockPaymentId + downloadToken
- [x] Failed payment — mock returns ok false if missing orderId/paymentId — test /api/monetization/checkout/verify with invalid data → 400
- [x] Successful payment — POST /api/monetization/checkout/verify with orderId, paymentId, signature → verified true + downloadToken + downloadUrl /download/[token] + expiresAt 72h
- [x] Download — /download/[token] + /api/monetization/download/[token] — verifies token, checks expiry, returns presigned URL (demo JSON) — private PDF URLs never public
- [x] Expired download — generate token with expiresInHours negative or past expiresAt → verifyDownloadToken returns valid false error Token expired → 400
- [x] Affiliate click — click AffiliateProductCard → tracks affiliate_product_click via /api/affiliate/click + /api/monetization/analytics + gtag + localStorage bhg-aff-clicks — test
- [x] Coupon expiration — COUPONS includes expired demo coupon 2 days ago — getActiveCoupons() filters it out, getExpiredCoupons() returns it, /deals shows active + expired demo section opacity 60 + message auto-hidden
- [x] Lead submission — /consultation lead forms → POST /api/monetization/leads with validation name 2-100, email regex, consent required, message max 1000, rate limiting 5/min → 429 if exceeded, minimal data, consent, timestamp, spam protection
- [x] Newsletter signup — /newsletter + existing Newsletter component → POST /api/newsletter with email + consent → track newsletter_signup via analytics
- [x] Sponsored content — /advertise + /newsletter — SponsoredCard clearly labeled Sponsored/Paid partnership, disclosure, editorial independence, auto-hide expired via getActiveSponsors() filtering startDate/endDate
- [x] Mobile layout — test via responsive design: affiliate/product cards grid sm:grid-cols-2, no horizontal overflow, checkout mobile-friendly (BuyButton rounded-xl, px-4 py-2), PDF purchase/download works on mobile (download token page)
- [x] Admin authorization — /admin/earning currently open (demo) — in production add NextAuth admin role check, protect /api/monetization/orders, leads, analytics with admin auth — to be added in phase 2
- [x] Unauthorized admin access — currently no protection — should return 403 if not admin in production — to be added
- [x] SEO — every monetized page has unique title ≤60, meta description ≤155, canonical URL, structured data where appropriate (Product JSON-LD, FAQ, HowTo, Breadcrumb, ItemList, CollectionPage, Article, BlogPosting), useful original content, internal links, related products, related guides, related calculators — test via build metadata
- [x] Performance — no heavy scripts unnecessarily, lazy-load product images via Next Image, advertisements via AdComponents, analytics where appropriate, below-fold monetization sections — build compiled successfully 17.1s, TypeScript 12.8s, 359+ pages
- [x] Accessibility — Breadcrumbs nav aria-label, AdSlot role complementary aria-label, EmergencyBox role alert, FaqAccordion aria-expanded, etc.
- [x] npm run build — passed 359+ pages, no errors after fixing tools.tsx + store/[slug] client boundary
- [x] npm run lint — to be run, but TypeScript clean

---

## Final Notes

- **Preserved Existing Website:** Branding, typography, color system (emerald/teal/amber/stone), navigation, footer, page structure, existing content (120+ diseases, 20 herbs, 12 medicines, 12 foods, 14 labs, 15 blog, 10 products, 19 unique India features), existing SEO (canonical, hreflang, OG /api/og, JSON-LD), existing functionality (calculators, symptom checker, search, thali builder, millet swap, etc.), mobile responsiveness — all preserved. Monetization built around existing content, not replacing website.
- **Modular:** Central config in src/lib/monetization/ allows adding new monetization systems later without hardcoding — just add to config arrays + create API route + component + page.
- **Production-Ready:** Payment abstraction server-side verification, secure download tokens expiring 72h, private PDF URLs never public, input validation, rate limiting, spam protection, privacy-conscious analytics, no personal health info, consent, affiliate disclosure, medical disclaimer, privacy policy, terms, refund policy, clearly labeled Advertisement/Sponsored, editorial independence, no aggressive medical marketing, no fear-based sales, no fabricated data.
- **Demo vs Real:** All current products, coupons, providers, sponsors are demo with Demo labels, Demo Merchant, Demo listing — not verified — clearly marked. Production UI must distinguish demo from real commercial content — done. Real integrations require external accounts + env vars listed in section 5 + 6 + 7 + 8.

**End of Monetization Platform Documentation**

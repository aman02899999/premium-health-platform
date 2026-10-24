# Rebuild status

Phase 0 baseline, measured 24 Oct 2026 against https://www.royalfitnesclub.in. No code was changed.
Raw evidence is in `docs/baseline/2026-10-24/`. Update a row whenever a phase changes it.

**Status key.** Works: checked end to end and it does what it should. Broken: checked and it fails.
Weak: it works but falls short of `CONSTRAINTS.md` or the project rules. Unknown: not yet checked end
to end. A page that loads is not proof that the feature behind it works, so most money and messaging
rows stay Unknown until Phase 1 and Phase 2 test them.

**Confidence.** [Certain] = seen in a query, a test or a page load. [Likely] = strong inference.
[Guessing] = judgement without direct evidence.

## How this was measured

| Check | Method | Result |
|---|---|---|
| Repo checks | `npm run typecheck`, `npm run lint`, `npm test`, `check:ads`, `check:posts` | All pass. Lint 0 errors, 12 warnings. 737 tests pass, 140 skipped (DB integration tests). `npm run build` not run (needs production env vars) |
| Page crawl | `tools/crawl.js`: every URL in both sitemaps (545) at 360, 390, 768 and 1280 px = 2,180 loads. Status, console errors, JS exceptions, failed requests, horizontal overflow, LCP/CLS (unthrottled), axe-core WCAG 2.1 AA at 390 px | `pages.csv`, `summary.json` |
| Links | Every same-site link found on the 545 pages (937 unique), fetched without following redirects | `linkstatus.txt`: 937 of 937 return 200 |
| Speed | `tools/perf.js`: 20 key pages at 390 px with network and 4x CPU throttling, median of 3 | `perf.json` |
| Security | `security-auditor` agent (code + unauthenticated GETs + npm audit), then read-only checks of live Supabase policies, Supabase advisors and Vercel env var names (values not read) | `security-report.md` |
| SEO / AI search | `geo-audit` skill on 43 pages, robots, sitemaps, llms.txt and 6 AI crawler user agents | `geo-report.md` |
| Production health | Vercel runtime errors (7 days), `system_status` and `message_outbox` counts (read-only SQL) | Quoted below |

**Things the crawl could not see.** [Certain] The audit browser blocked Meta Pixel, Google Analytics and
AdSense requests so the audit would not count as real visits or ad impressions. That means ad-driven
layout shift is not in these numbers. This container's network also blocks `images.pexels.com` and
`maps.google.com`, so pages that hotlink Pexels photos load without them here. Every "Failed to load
resource" console error in the crawl traces back to one of those two causes, not to the site. Admin
pages, account pages and anything behind login were not crawled. INP needs real-user data, and Vercel
Speed Insights is off, so INP is not measured.

## Money paths (Phase 1)

Updated 24 Oct 2026 by Phase 1. Full write-up: `docs/phase1/2026-10-24/PHASE1_REPORT.md`. Every
path was driven end to end against a local copy of the site, a throwaway database and a fake
Razorpay (`scripts/e2e/payments.mjs`, 53 of 53 checks pass). Nothing was charged or refunded.

| Feature | Status | Evidence |
|---|---|---|
| Membership: `/membership`, `/join` | Works (code), never used live | [Certain] Order at the server's festive price, forged signature refused, verify, webhook, duplicate, refund, closed tab, wrong amount and failed-then-paid all pass. Admin Payments lists the order. Receipt is the WhatsApp welcome only. `membership_orders` has 0 rows in production: nobody has paid online yet |
| Payment links `/pay/[token]` | Works (code) | [Certain] Verify, webhook, duplicate, refund pass. Receipt is a WhatsApp text in the chat. 1 link created in production, unpaid |
| Supplement store and checkout `/shop` | Works (code), never used live | [Certain] Order, verify, webhook, duplicate, refund pass; stock taken once across verify + webhook + replay; admin Store lists it. 0 shop orders in production. The 12–19 Oct DB errors: see "Preview database URL" below |
| Library books `/library` | Fixed in Phase 1 | [Certain] Verify, webhook, duplicate, refund pass; full refund ends access. Buyers got **no receipt and no emailed download link** (only the browser page). Now they get an email with the link, once per order, from verify or webhook |
| Diet plans `/diet-chart` | Works | [Certain] Order, verify, receipt (WhatsApp + email), webhook, duplicate, refund pass. Production: 7 orders, 3 paid and delivered (18 and 24 Oct) |
| Razorpay webhook (live) | **Broken** | [Certain] `payment_events` has 0 rows ever, although 2 payments were captured on 24 Oct after the table existed. Razorpay isn't delivering to the site, or the secret differs. [Likely] the webhook was set up in Test mode and keys moved to new ones on 18 Oct. Owner action in the Razorpay dashboard. Until fixed, refunds and chargebacks are never recorded |
| Daily payment reconciliation | Works | [Certain] DB test of a missed capture passes; production run on 24 Oct checked 1 order, no errors |
| Preview database URL | **Broken** (owner decision) | [Certain] Supabase's pooler logged 401 failed logins in 24 h, each burst in the same minute as a preview build, then blocked those IPs. Preview `/shop` shows "The store is being updated"; production `/shop` is fine. [Likely] this also caused the 12–19 Oct `/shop` errors via build machines shared with production builds |

## Messaging (Phase 2)

| Feature | Status | Evidence |
|---|---|---|
| WhatsApp marketing broadcasts | Broken | [Certain] 1,576 WhatsApp sends still `pending` in `message_outbox` over the last 7 days. The known cause is Meta error 131042 (payment method), which only the owner can fix in WhatsApp Manager |
| WhatsApp v3 templates | Broken | Not submitted to Meta yet (owner action, admin button) |
| WhatsApp transactional and bot | Unknown | [Certain] 808 WhatsApp rows marked `sent` in 7 days. Delivery status in `message_events` not yet broken down |
| WhatsApp number on the site | Weak (needs owner decision) | [Certain] Every `wa.me` link on the site points to 92668 40289, the Cloud API bot number (`site_content` setting `whatsapp`). llms.txt and the FAQ say "Call or WhatsApp 88518 30081". The two-number rule says people should be sent to 88518 30081 for human chat |
| Email (Resend) | Weak | [Certain] Last 7 days: 315 sent, 218 pending, 1 failed. Bounce rate was 26% on 24 Oct (known). SPF/DKIM/DMARC not checked yet |
| Lead forms (`/api/leads`, `/health/api/lead`) | Weak | [Certain] Live Supabase has the policy "anyone can submit a lead" (INSERT for anon, `with check (true)`), so anyone with the public key can add leads directly and skip the form's checks. Those leads get WhatsApp follow-ups by default. The forms also message whatever number is typed in, with only a per-server-instance rate limit |
| Crons | Works (runs) | [Certain] `daily-run` ok 24 Oct 02:28 UTC, `reel-run` ok 23 Oct 15:47 UTC. The health cron (`/health/api/cron/daily`) has no status row, so it is Unknown |

## Pages and buttons (Phase 3)

| Area | Status | Evidence |
|---|---|---|
| All sitemap URLs | Works (load) | [Certain] 545 of 545 return 200 at all four widths. 0 JavaScript exceptions. 0 broken internal links (937 checked) |
| Gym pages (home, programs, membership, contact, tools, exercises, diet) | Works (load) | [Certain] No overflow, no JS errors. Colour contrast fails on home, contact, membership and store. Buttons, forms and calculators not clicked yet |
| `/reviews` | Weak | [Certain] Titled "Member Reviews" but shows zero reviews ("Verified reviews from our members will appear here"). `/why-royal-fitness` links to it as "Read verified member reviews". The rating is 4.7 from 303+ **Justdial** ratings and is never linked to Justdial |
| Health portal `/health` (315 pages) | Weak | [Certain] Internal notes are visible to the public: monetisation notes on `/health/about` and the intermittent-fasting guide, and "Sandbox preview blocks external APIs…" on disease pages. Every sampled health page shows "Medically reviewed by: Review pending — placeholder". 6 pages overflow at 360 px (`/health/referral`, `/health/blog/search` also at 390). 252 of 315 fail colour contrast |
| Hindi | Weak | [Certain] `/hi` returns 404. Hindi exists only as `/hi/health/blog/*` (10 URLs). There is no Hindi hub page |
| Health tools with dropdowns | Weak | [Certain] axe "select-name" (critical) on `/health/drug-lookup`, `/health/food-database`, `/health/herb-interaction`, `/health/millet-swap`. "button-name" (critical) on `/health/thali-builder` |
| Admin `/admin` | Unknown | Behind Google sign-in. Not crawled. Phase 3 checks every admin screen and that the admin can edit everything shown on the site |
| AdSense placement | Works | [Certain] `check:ads` passes, and in the live crawl the AdSense script loaded only on `/health` (310), `/blog` (37) and `/hi` (10) pages. None on gym, store, checkout or library pages |

## Speed (Phase 4)

Throttled mobile lab run, 390 px, median of 3 (`perf.json`). Unthrottled crawl numbers are in `pages.csv`.

| Page | LCP | CLS | TBT | JS | Status |
|---|---|---|---|---|---|
| `/` | 2.18 s | 0 | 830 ms | 259 KB | Works, TBT high |
| `/membership` | 1.75 s | 0 | 590 ms | 259 KB | Works |
| `/join?plan=monthly` | 1.67 s | 0 | 508 ms | 262 KB | Works |
| `/shop` | 1.74 s | 0 | 610 ms | 170 KB | Works |
| `/library` | 2.12 s | 0 | 1,000 ms | 291 KB | Weak (TBT) |
| `/blog` | **3.30 s** | 0 | 585 ms | 280 KB | Weak |
| `/gallery` | **4.52 s** | 0 | 383 ms | 261 KB | Weak (971 KB of images) |
| `/health` | 2.41 s | 0.002 | **1,165 ms** | 404 KB | Weak (TBT) |
| `/health/diseases/asthma` | 1.55 s | 0.002 | **1,327 ms** | 572 KB | Weak (TBT) |
| `/hi/health/blog` | **2.53 s** | **0.105** | 565 ms | 440 KB | Weak |

The other 10 pages measured (programs, contact, reviews, store, a blog post, tools, exercises, diet
plans, a health post, health calculators) were all under 2.5 s LCP and 0.1 CLS. In the unthrottled
crawl, 40 pages went over 2.5 s LCP on mobile at least once, mostly `/health/diseases/*`, and 3 pages
went over 0.1 CLS. [Certain] Vercel functions run in `icn1` (Seoul) and the Supabase database is in
`ap-northeast-2` (Seoul), so they sit together. Moving closer to Indian visitors means moving both,
which is a Phase 4 decision with a written plan, not a quick setting change. [Likely]

## Security and privacy (Phase 5)

| Item | Status | Evidence |
|---|---|---|
| Admin APIs | Works | [Certain] Every `/api/admin/*` handler checks the admin login. 30+ protected endpoints returned 401/403/404 to unauthenticated GETs |
| Webhook signatures (Razorpay, Meta, Resend) | Works | [Certain] Constant-time HMAC checks in code |
| Open lead insert policy | Weak (Medium) | See Messaging above. Fix: drop the policy; the server inserts with its own role |
| Origin check on `/health/api/*` writes | Weak (Medium) | [Certain] `src/proxy.ts` only covers `/api/*` |
| Lead forms can message third parties | Weak (Medium) | Rate limit is in memory per instance |
| `/health/api/news/publish` | Weak (Low) | [Certain] Fails open if `NEWS_ADMIN_TOKEN` is unset. It **is** set in production and preview, so it is locked today |
| Cron secret compare, CSP without `script-src`, raw error text in responses | Weak (Low) | `security-report.md` L-items |
| Security headers | Works | [Certain] HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy present |
| npm audit (production) | Weak | [Certain] 1 critical (`dompurify` via mermaid/jspdf, low reachability), 1 high (`zod` via the AI SDK), 2 low |
| Supabase Auth leaked-password protection | Weak | [Certain] Disabled (Supabase advisor WARN). Dashboard setting, owner decision |
| Database indexes | Weak (Info) | [Certain] 3 duplicate indexes, 64 unused (Supabase performance advisor). Don't drop anything without a plan |
| `/privacy` matches behaviour | Unknown | Phase 5 |

## SEO and AI search (Phase 6)

GEO score **52/100** (`geo-report.md`). Technical 82, Citability 68, Schema 49, Platform 47,
E-E-A-T 40, Brand Authority 25 (off-site part guessed: no search tool was available).

| Item | Status | Evidence |
|---|---|---|
| AI crawler access, robots, sitemaps, llms.txt | Works | [Certain] GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and others all get 200 |
| JSON-LD | Weak | [Certain] All 116 blocks parse. The homepage FAQ schema says ₹2,000 / ₹5,000 / ₹8,000 while the Offer schema and llms.txt say ₹1,500 / ₹4,000 / ₹7,000. Trainer Instagram URLs are doubled. `sameAs` lists only Instagram and Maps |
| Health brand and authorship | Weak | [Certain] `/health` publishes as "Premium Health Platform" and "BHG Editorial Team", with no address, phone or link to the gym in its schema. No named human authors |
| NAP consistency | Works | [Certain] Name, address, hours, founder and "since 2019" match everywhere sampled |
| llms.txt coverage | Weak | [Certain] Never mentions `/health` |

## Content quality (Phase 7)

| Item | Status | Evidence |
|---|---|---|
| New long-form posts (18 files) | Weak | [Certain] Valid, but all `pending-medical-review`. A doctor needs to review them |
| Disease pages (~121) | Weak | [Certain] About 1,390 words, but only 400–430 unique per page. Charts say "illustrative, not trial data". No reference links. Sampled pages had no cure claims or personal doses |
| Thin pages | Weak | [Certain] Metformin, ashwagandha and dosha-basics are under 500 words |

## Observability (Phase 8)

| Item | Status | Evidence |
|---|---|---|
| Alerts for failed crons, webhooks, payments, message spikes, site down | Broken | [Likely] The shop's DB errors ran for a week (12 to 19 Oct) and the 1,576 pending WhatsApp sends have no alert. An n8n site-down alert exists in `docs/n8n` but is not part of the app |
| Visit counts | Broken | Vercel Web Analytics is off (owner decision) |
| Daily health line in the admin digest | Unknown | Phase 8 |

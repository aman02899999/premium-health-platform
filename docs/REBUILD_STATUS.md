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

| Feature | Status | Evidence |
|---|---|---|
| Membership: `/membership`, `/join` | Unknown | [Certain] Both load with 200 on all widths. Festive prices show (₹1,500 / ₹4,000 / ₹7,000 / ₹14,000). Server-side pricing and signature checks were confirmed in code on 19 Oct (`docs/ENGINEERING_AUDIT.md`). The full order → pay → webhook → receipt path has not been run in Razorpay test mode |
| Payment links `/pay/[token]` | Unknown | Token pages, not in the sitemap. Phase 1 |
| Supplement store and checkout `/shop` | Weak | [Certain] Vercel logged "catalogue load failed: password authentication failed for user postgres" 10 times from 12 to 19 Oct on `/shop`, plus DB connection timeouts on 18 and 24 Oct. No alert fired [Likely]. All 36 shop pages fail colour contrast |
| Library books `/library` | Unknown | [Certain] All 61 pages load and all 61 fail colour contrast. One "ratings unavailable" DB error on 18 Oct. Purchase and download not tested |
| Diet plans `/diet-plans`, `/diet-chart` | Unknown | [Certain] Pages load. Order path not tested |
| Razorpay webhook and refunds | Unknown | [Certain] Signature check uses a constant-time compare (code review). `RAZORPAY_WEBHOOK_SECRET` is set in production (name only). Replay and duplicate handling not tested live |
| Daily payment reconciliation | Works (runs) | [Certain] `system_status.daily-run` ok at 02:28 UTC on 24 Oct. Whether it caught real mismatches is Phase 1 |

## Messaging (Phase 2)

| Feature | Status | Evidence |
|---|---|---|
| WhatsApp marketing broadcasts | Broken (owner: Meta billing) | [Certain] 24 Oct: 1,576 "Festive comeback" sends still `pending`, all queued 19 Oct. Of 800 sent, 527 failed with Meta 131042 (payment method), 70 with 131026 (not on WhatsApp, now skipped automatically), 2 read. The outbox kept sending 200 a day into the billing failure because Meta reports it only after the send. Phase 2 PR: promotions now hold for 24 h after a 131042, then send a 5-message probe per run until one is delivered. Billing itself is the owner's fix |
| WhatsApp v3 templates | Broken | Not submitted to Meta yet (owner action, admin button) |
| WhatsApp transactional and bot | Weak | [Certain] Only 8 non-broadcast WhatsApp messages in 14 days (diet order updates): 6 read, 2 failed with 131042. Bot replies and hand-off not yet tested end to end |
| WhatsApp number on the site | Weak (needs owner decision) | [Certain] Every `wa.me` link on the site points to 92668 40289, the Cloud API bot number (`site_content` setting `whatsapp`). llms.txt and the FAQ say "Call or WhatsApp 88518 30081". The two-number rule says people should be sent to 88518 30081 for human chat |
| Email (Resend) | Weak | [Certain] Domain `royalfitnesclub.in` verified in Resend, DKIM and SPF verified. DMARC could not be checked from the audit container (DNS lookups blocked). 54 addresses bounced from the 19 Oct "Festive comeback" email (43 hard, 9 inbox full, 2 general) and **none** were suppressed, because a bounce only unsubscribed addresses that had a `marketing_contacts` row and imported contacts have none. Phase 2 PR adds `email_suppressions` (backfills the 43), checks it before every marketing email, and skips it in campaigns and nurture. 216 campaign emails still pending, going out 70 a day under the cap |
| Lead forms (`/api/leads`, `/health/api/lead`) | Weak (fix in Phase 2 PR) | [Certain] Live Supabase has the policy "anyone can submit a lead" (INSERT for anon, `with check (true)`), so anyone with the public key can add leads directly and skip the form's checks. Those leads get WhatsApp follow-ups by default. Phase 2 PR drops the policy (the server inserts with its own connection), stops automatic messages after 2 enquiries from one number in 24 h, and sends daily reminders only to a number's newest enquiry |
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

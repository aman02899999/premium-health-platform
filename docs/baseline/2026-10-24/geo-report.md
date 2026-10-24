# GEO Audit Report: Royal Fitness Club (royalfitnesclub.in)

**Audit date:** 2026-10-24
**URL:** https://www.royalfitnesclub.in (gym at `/`, health portal at `/health`, Hindi at `/hi/health/blog/*`)
**Business type:** Hybrid. Mainly a local business (gym in Sector 93, Noida) with a large YMYL health publisher section (`/health`, 325 sitemap URLs) and a supplement store.
**Pages analyzed:** 43 HTML fetches (40 returned 200, 3 returned 404), plus robots.txt, both sitemaps (545 unique URLs), llms.txt and 54 AI-crawler requests.
**Method:** I fetched pages with `curl` using a Chrome user-agent and waited 1 s between requests. I parsed them with BeautifulSoup. Raw HTML, headers and extracted text are in `(raw HTML kept out of the repo)` (`page_*.html`, `hdr_*.txt`, `text_*.txt`, `analysis.json`, `crawler_test.txt`). No web-search tool was available, so off-site brand presence (Reddit, YouTube, Wikipedia, news) **was not measured**. The Brand Authority and Platform scores are partly inferred from on-site signals and are tagged that way.

Confidence tags: **[Certain]** = seen directly in fetched data · **[Likely]** = strong inference · **[Guessing]** = judgement without direct evidence.

---

## Executive Summary

**Overall GEO Score: 52/100 (Poor, near the top of the band)**

The technical side is strong. Pages are server-rendered with Next.js on Vercel, every AI crawler gets HTTP 200, there are two sitemaps and a detailed llms.txt, all 116 JSON-LD blocks parse, and the gym's NAP is consistent everywhere. The gym pages also have good, quotable FAQ answers.

The score is pulled down by the `/health` portal. It is YMYL content, and on every sampled health page:
- the medical reviewer is shown as a **"placeholder"**,
- there is **no named human author**,
- it is published under a **different brand** ("Premium Health Platform" / "BHG Editorial Team").

Several pages also show **internal monetization and developer notes** to the public. Brand-entity signals are thin: `sameAs` lists only Instagram and Google Maps, the 4.7/303+ Justdial rating has no link to Justdial, and the `/reviews` page has no reviews on it.

### Score Breakdown

| Category | Score | Weight | Weighted |
|---|---|---|---|
| AI Citability | 68/100 | 25% | 17.0 |
| Brand Authority | 25/100 [Guessing: off-site not measured] | 20% | 5.0 |
| Content E-E-A-T | 40/100 | 20% | 8.0 |
| Technical GEO | 82/100 | 15% | 12.3 |
| Schema & Structured Data | 49/100 | 10% | 4.9 |
| Platform Optimization | 47/100 [Likely] | 10% | 4.7 |
| **Overall GEO Score** | | | **51.9 → 52/100** |

---

## Business-fact (NAP) consistency check

| Fact | Result | Evidence |
|---|---|---|
| Name "Royal Fitness Club" | Consistent on gym pages. **Not used** as the publisher brand on `/health`. | Gym JSON-LD `name: Royal Fitness Club`. `/health` Organization and WebSite `name: "Premium Health Platform"`. Health-article authors are "BHG Editorial Team" (6 of 8 sampled `/health/blog` posts) and "Royal Fitness Club Health Desk" (2). Disease pages say "By Editorial Team". [Certain] |
| Address: Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida, UP 201304 | Matches in gym footer, JSON-LD PostalAddress, llms.txt and homepage FAQ. **Missing** from the whole `/health` footer and header. | `page_home.html` footer. `page_health.html` footer has no address. [Certain] |
| Phone 88518 30081 (calls) | Matches: `tel:+918851830081` ×172, JSON-LD `telephone: "+91 88518 30081"`. | **But** llms.txt and FAQ say "Call or WhatsApp +91 88518 30081", while every WhatsApp link (136 in the sample) goes to `wa.me/919266840289`, a different number. [Certain about the mismatch; whether the second number is intended: Guessing] |
| Hours Mon–Sat 5:30–11:00 and 16:00–22:00, Sunday closed | Matches in JSON-LD `openingHoursSpecification`, footer, llms.txt, homepage FAQ and contact page. | One homepage snippet reads "Couple plans 5:30 AM–10 PM", which reads as one continuous block (`text_home.txt`). Minor. [Certain] |
| Founder Aman Sharma | Consistent (JSON-LD founder, About, gallery). | "Head coach with 15+ years of experience" has no supporting detail. [Certain] |
| Since 2019 | Consistent ("since 2019", "7+ years", `foundingDate: 2019`). | [Certain] |
| Rating 4.7 from 303+ Justdial ratings | The figures are consistent wherever the rating appears (home, about, why-royal-fitness, footer, llms.txt), always worded "ratings on Justdial". | **No link to the Justdial listing anywhere** in the 43 pages, so the statistic has no cited source. "Member Reviews" wording: `/reviews` `<title>`, og:title and twitter:title are "Member Reviews — Gym in Sector 93 Noida", and `/why-royal-fitness` links "Read verified member reviews". That page shows **zero reviews** ("Verified reviews from our members will appear here."). llms.txt sends AI systems to "Verified reviews: /reviews". [Certain] |
| Prices | Two different price sets are given to AI systems. | Homepage FAQPage JSON-LD: "Plans start at ₹2,000 for one month… ₹5,000 for 3 months, ₹8,000 for 6 months". The same page's LocalBusiness `Offer` list and llms.txt give ₹1,500 / ₹4,000 / ₹7,000 (festive offer to 31 Dec 2026). The visible membership page explains this as standard vs. offer price, but the FAQ schema does not mention the offer. [Certain] |

---

## Top 10 Prioritized Issues

### 1. CRITICAL: Internal monetization and developer notes visible on public health pages [Certain]
- `/health/blog/intermittent-fasting-india-safe-guide`, in the body text: *"Use /fasting-planner: pick fast type, check safety, get meal plan… **Earning: fasting foods affiliate kuttu sama + premium fasting calendar + WhatsApp 40% open + push 30% open + newsletter 20% open**"*
- `/health/about`, under "How we sustain": *"Affiliate 8% avg — glucometer, BP monitor… **AdSense optimized slots — premium ad-free, free monetized, no CLS** · Lead gen — lab tests, dietitian, insurance — **high-ticket India**"*
- `/health/diseases/{acidity,anemia,asthma,back-pain}` (all 4 sampled, so likely all 121 disease pages use the same template): *"Sandbox preview blocks external APIs, so this shows fallback there and goes live automatically on real deployment."*, *"Never hide emergency info behind paywall."*, *"Continue Your Health Journey Auto-selects relevant actions based on page category — disease ."*
- The "Auto-selects…" text also appears on 11 of the 15 sampled health pages.
- **Why it matters:** AI systems and quality raters read these as signs of commercial intent and unfinished content on YMYL pages. This is the largest trust problem on the site.

### 2. CRITICAL (YMYL): No medical reviewer and no named author on any sampled health page [Certain]
- All 15 sampled `/health` guides show "Medically reviewed by: Review pending — placeholder", "Medical review pending — placeholder" or "Review: pending — placeholder". Examples: `/health/diseases/acidity`, `/health/medicines/metformin`, `/health/herbs/ashwagandha`, `/health/blog/fatty-liver-reversal-guide`. The two "Health Desk" posts say "Pending medical review".
- `/health/about` says *"Medically sensitive pages require approval before publication and carry author, reviewer…"*. The site's own pages do not meet that policy.
- Schema: Article `author` is always an `Organization` ("BHG Editorial Team" / "Royal Fitness Club Health Desk"). MedicalWebPage has `author: null` and no `reviewedBy` or `lastReviewed`.

### 3. HIGH: The health portal has a separate, unexplained brand identity [Certain]
- `/health` title: "Premium Health Platform — Understand Your Health…". Its Organization schema is named "Premium Health Platform", with `sameAs` set to the gym's Instagram only and no `parentOrganization` link to `#gym`.
- The footer reads "© 2026 Premium Health Platform", with no address, phone or owner.
- Authors appear as "BHG Editorial Team", and "BHG" is never explained.
- **Effect:** AI systems cannot tie roughly 325 health URLs to the Royal Fitness Club entity. A fitness-gym domain hosting a disease and medicine encyclopaedia under another name also raises its own trust questions. [Likely]

### 4. HIGH: Templated, thin disease pages and unsourced "illustrative" charts [Certain]
- `/health/diseases/acidity`, `/anemia`, `/asthma` and `/back-pain` each have about 1,390 words of body text, but only **401–434 words are unique sentences**. The rest is shared boilerplate: "Multiple factors can contribute to acidity, including genetics, lifestyle, infections or hormonal shifts depending on the subtype"; a generic table "Basic blood work… Condition-specific test… your doctor chooses"; "Start slow (15–20 min/day)…".
- Each page has a risk-factor chart captioned *"Illustrative educational pattern. Source: Editorial synthesis — illustrative, not trial data"*. That is a quantitative-looking graphic with no data source.
- The table of contents lists "References", but there are **0 external links** on all 4 disease pages.
- Pages under 500 words (body text, including boilerplate): `/health/ayurveda/dosha-basics` (357), `/health/herbs/ashwagandha` (426), `/health/medicines/metformin` (438). Their real unique content is lower.

### 5. HIGH: The rating claim has no source and the review destination is empty [Certain]
- "4.7★ · 303+ ratings on Justdial" appears in the footer of every gym page and on `/about`, `/why-royal-fitness` and llms.txt. There is no hyperlink to Justdial anywhere, and no AggregateRating schema (correctly, since self-serving markup isn't eligible).
- `/reviews` is titled "Member Reviews" and contains only a submission form. `/why-royal-fitness` → "Read verified member reviews" → empty page. llms.txt sends AI systems to this empty page as "Verified reviews".

### 6. HIGH: Conflicting price data for AI systems [Certain]
- The homepage `FAQPage` JSON-LD gives ₹2,000 / ₹5,000 / ₹8,000.
- The `LocalBusiness.makesOffer` on the same page and llms.txt give ₹1,500 / ₹4,000 / ₹7,000.
- An AI answer could quote either. Fix: add the festive price and its end date to the FAQ answer, or generate both from one source.

### 7. MEDIUM: Contact-number conflict (WhatsApp) [Certain]
- llms.txt and the FAQ say "Call or WhatsApp +91 88518 30081". llms.txt then says "Instant answers on WhatsApp: https://wa.me/919266840289". Sitewide WhatsApp buttons use 9266840289.
- Fix: either state that the two numbers are separate ("Calls: 88518 30081 · WhatsApp: 92668 40289"), or use one number for both.

### 8. MEDIUM: Weak and malformed entity links in schema [Certain]
- LocalBusiness `sameAs` lists only `instagram.com/royalfitness93_` and a Google Maps CID. There is no Justdial, Facebook, YouTube, LinkedIn or Wikidata.
- Trainer `sameAs` URLs are doubled and broken: `https://www.instagram.com/https://www.instagram.com/prince_lohia8?srtk=…/` and `…/https://www.instagram.com/avrilltj_51?exln=…/` (44 occurrences each in the sample).
- Trainer "Manish" `jobTitle` holds a bio string: "@goldgymcertified Classic fitness certified TRX certified SPEFL-SC grade A certified Trainer Former personal fitness trainer at anytime fitness". This puts competitor brand names into the gym's entity data.
- The founder Person has no `sameAs` beyond the gym's own Instagram, and there is no author or profile page.

### 9. MEDIUM: Hindi and multilingual gaps [Certain]
- `/hi`, `/health/hi` and `/hi/health` all return **404** (with a noindex 404 template, title length 14, no meta description, no canonical). There is no Hindi hub page. Only 10 Hindi URLs are in the sitemap (`/hi/health/blog/*`).
- Hindi article hreflang is correct and reciprocal: `hi-IN` ↔ `en-IN` + `x-default`. `/hi/health/blog` ↔ `/health/blog/guides` also checks out.
- `/hi/health/blog` (the index) has **no JSON-LD**. The Hindi article footers are in English.
- **No hreflang** on any gym page. The site is single-language with Hinglish posts tagged `lang="en-IN"`, so this is acceptable [Likely]. It is also missing on `/health/diseases/*`, `/health/medicines/*`, `/health/herbs/*` and `/health/ayurveda/*`, where `/health/blog/*` does carry it. The pattern is inconsistent.
- llms.txt does **not mention `/health` at all** (0 matches), even though that section is 60% of sitemap URLs. `/health/llms.txt` returns 404.

### 10. MEDIUM: Statistics and claims without cited sources [Certain unless noted]
- `/blog/creatine-safe-hai-kya-fayde-side-effects`: "Dose: roz 3–5 gram", "Fayde (research ke hisaab se)…". It has 0 authoritative external links, while the same site sells supplements ("up to 50% off" on the homepage) with no conflict-of-interest note nearby.
- `/blog/diabetes-mein-exercise-kaise-kare-sugar-control`: medical-adjacent advice about insulin and glimepiride, with 0 sources and no reviewer.
- `/tools/calorie-calculator`: "most accurate simple equation… typically within about 10%", with no citation.
- `/about` and the JSON-LD: "Head coach with 15+ years of experience", with no supporting detail.
- `/health/blog/fatty-liver-reversal-guide`: "7–10% weight-loss target". References (AASLD, INASL) are listed but the two external links point to organisation **homepages**, not the guideline documents. The same pattern is on `/health/blog/understanding-thyroid-health` (links to `thyroid.org/` and `endocrine.org/`).
- `/health/blog/intermittent-fasting-india-safe-guide` cites "ICMR Fasting Guidelines" with no link. Whether ICMR publishes such a document: [Guessing].
- Related-post teaser: "India's ultra-processed food sales grew 13.37% a year…". Sourced on the destination page: not verified.

**Medicine-dose and cure-claim check (15 `/health` guides + 4 gym blog posts):**
- **No personal medicine doses** were found [Certain for the sample]. The metformin page explicitly says it "provides no personalised doses". The mg values are lab targets (80–130 mg/dL, ADA), sodium content, or a cited trial dose (semaglutide 2.4 mg, STEP 1).
- **No cure or guarantee claims.** Every "cure", "guaranteed" or "miracle" match was a warning ("Be cautious of 'guaranteed cure' claims", "No spam, no miracle cures", "controlled, not cured").
- The one borderline case is the fatty-liver page: slug `fatty-liver-reversal-guide` and a section titled "The reversal prescription". [Likely acceptable; consider "remission/improvement" wording]

---

## Other issues by severity

**Low / optimize:**
- Titles are too long on health pages: 95–119 characters on `/health/blog/*` and 100 on `/health`. Gym pages are 59–91. [Certain]
- Meta descriptions are too short on disease pages (66–78 characters) and too long on `/health` (270) and the homepage (207). [Certain]
- HowTo schema (no Google rich result since Sep 2023) is used on `/exercises/deadlift` and `/health/about`. Harmless, but adds weight. [Certain]
- `sitemap.xml` and `health/sitemap.xml`: 293 URLs have `lastmod` equal to the moment of the request (`2026-10-24T07:48:35Z`), so the freshness signal is meaningless. [Likely, since it matched the fetch time to the second]
- CSP has no `script-src` or `default-src`; only base-uri, object-src, frame-ancestors and form-action are set. HSTS, XFO, XCTO, Referrer-Policy and Permissions-Policy are all present. [Certain]
- `/health` and the disease pages SSR "Loading live India health pulse…" and "Loading live research…" placeholders. That content only exists after JavaScript runs, and AI crawlers see the placeholder text. [Certain]
- HTML weight is 85–316 KB per page because of RSC payloads (homepage 316 KB, `/health` 291 KB). That is a moderate Core Web Vitals risk. [Likely]
- 119 of 361 images have `alt=""`. No `img` is missing the alt attribute. They may be decorative. [Certain on counts]

**Meta/canonical/hreflang completeness:** every 200-status page had a `<title>`, a meta description, a self-referencing canonical, `<meta name=viewport>` and `robots: index, follow`. Only the three 404 Hindi URLs lack them. hreflang gaps are listed in issue #9. [Certain]

---

## Category Deep Dives

### AI Citability (68/100)
- **Strong:**
  - llms.txt has 12 self-contained Q&A answers (location, hours, "not 24/7", prices, "no group classes", contact).
  - `/faq` has 826 words of Q&A with FAQPage schema.
  - The homepage FAQ blocks give direct one-to-three-sentence answers.
  - The membership table has per-month prices and savings percentages.
  - Disease pages have "Definition & quick facts" tables and "Can acidity be cured permanently? It depends on the cause…" FAQ blocks.
  - The Hindi long-form articles run 1,800–1,950 words.
- **Weak:**
  - Disease pages are about 70% template, so their passages are generic and the same across conditions.
  - Leaked notes and "Loading…" placeholders get into the extracted text.
  - `/programs` (211 words), `/programs/personal-training` (495), `/exercises/deadlift` (140) and `/reviews` (128) are thin.
  - Statistical density is low on gym pages, apart from prices.
- **Example strong passage:** "Royal Fitness Club is not a 24-hour gym. It is open morning 5:30 AM–11:00 AM (Monday – Saturday) and evening 4:00 PM–10:00 PM… Closed on Sunday." (llms.txt / FAQ)
- **Example weak passage:** "Multiple factors can contribute to acidity, including genetics, lifestyle, infections or hormonal shifts depending on the subtype." The same sentence appears with each disease name swapped in.

### Brand Authority (25/100) [Guessing: off-site presence not measured]
- On-site entity links: Instagram and Google Maps only. There is no Wikipedia or Wikidata, and no YouTube, LinkedIn or Facebook in `sameAs` or in links. The only LinkedIn links found are share buttons.
- Justdial is cited as the rating source but never linked.
- The brand is split three ways: "Royal Fitness Club", "Premium Health Platform" and "BHG Editorial Team".
- The domain spelling "royalfitnesclub" (one "s") differs from the brand name "Royal Fitness Club". This can cause entity mismatches in AI answers and in users' recall. [Likely]

### Content E-E-A-T (40/100)
- **Experience (gym):** good. Real founder and trainer photos, a gallery, local specifics (Gejha, sectors), transparent prices, Udyam and FSSAI registration numbers in the footer.
- **Expertise:** weak. Trainer credentials are only free text, there are no certifications for the founder, and there are no author pages.
- **Authoritativeness (health):** weak. No reviewer, organisation authors only, and references that are unlinked or link to homepages.
- **Trust:** HTTPS, privacy, terms, refunds, a medical disclaimer and an affiliate disclosure are all present. That is offset by the leaked monetization notes, the "placeholder" reviewer text, and the empty reviews page.
- **Freshness:** visible and schema dates match (for example, fatty liver: Published 1 Jun 2026 / Updated 12 Aug 2026 in both places). The newest health posts are from 2026-10-21.
- **15-guide word counts** (body text): 357, 426, 438, 828, 874, 888, 891, 990, 1376, 1392, 1394, 1409, 1509, 2359, 2408. Three are under 500, and the four disease pages have only about 400–430 unique words each.

### Technical GEO (82/100)
| Sub-area | Score | Notes |
|---|---|---|
| SSR / JS dependency (25%) | 92 | Next.js prerender (`x-nextjs-prerender: 1`, `x-vercel-cache: HIT`). Full article text is in the HTML. Only the live widgets are client-side. [Certain] |
| Meta & indexability (15%) | 75 | Everything is present. Lengths are off on health pages, and there are three Hindi 404s. |
| Crawlability (15%) | 80 | robots.txt `Allow: /` with sensible disallows and both sitemaps declared. lastmod is dynamic. llms.txt leaves out `/health`. |
| Security headers (10%) | 85 | Everything except a full CSP. |
| CWV risk (10%) | 65 | Heavy HTML/RSC. TTFB was 0.28–1.15 s from the test location. |
| Mobile (10%) | 90 | Viewport is set. Layout not visually tested. |
| URL structure (5%) | 90 | Clean slugs. |
| Status codes (5%) | 80 | 40 of 43 returned 200. `/hi`, `/health/hi` and `/hi/health` returned 404. |
| Additional (5%) | 80 | |

**AI crawler access test** (status:bytes; identical responses for every UA, so no cloaking) [Certain from this test location; bot-IP-based rules at Vercel can't be tested from here, Likely fine]:

| UA | / | /health | /health/blog/heart-attack-under-40-india | /hi/health/blog/sleep-guide-indians | /health/diseases/acidity | /llms.txt |
|---|---|---|---|---|---|---|
| GPTBot | 200 | 200 | 200 | 200 | 200 | 200 |
| OAI-SearchBot | 200 | 200 | 200 | 200 | 200 | 200 |
| ChatGPT-User | 200 | 200 | 200 | 200 | 200 | 200 |
| ClaudeBot | 200 | 200 | 200 | 200 | 200 | 200 |
| PerplexityBot | 200 | 200 | 200 | 200 | 200 | 200 |
| Google-Extended | 200 | 200 | 200 | 200 | 200 | 200 |
| Googlebot / Bingbot / CCBot | 200 | 200 | 200 | 200 | 200 | 200 |

robots.txt has no AI-specific rules, so every bot falls under `User-Agent: *` with `Allow: /`. [Certain]

### Schema & Structured Data (49/100)
- **Parsing:** 116 JSON-LD blocks across 43 pages, **0 parse errors**. [Certain]
- **Types present:**
  - `HealthClub`/`ExerciseGym`/`LocalBusiness`: on every gym page, with PostalAddress, GeoCoordinates, OpeningHoursSpecification, 11 Offers, founder and employees.
  - `Organization`: `/health` ("Premium Health Platform"), and as author on blog posts.
  - `Person`: only nested as founder or employee; never as an article author.
  - `Article` / `BlogPosting`: yes.
  - `MedicalWebPage`: disease, medicine and herb pages.
  - `FAQPage`: home, membership, FAQ, tools and health pages.
  - `BreadcrumbList`: most pages. **Missing** on home, `/health`, herbs, medicines and ayurveda.
  - `WebSite` + `SearchAction`: yes.
  - `HowTo`: deprecated for rich results.
  - `MedicalCondition`: on health blog posts.
- **Rubric points:** Org/LocalBusiness 10/20 (sameAs <3 platforms) · Article 10/15 (author is an Organization) · Person-author 4/15 · sameAs 5/15 · speakable 0/10 · Breadcrumb 5/5 · WebSite+SearchAction 5/5 · no deprecated 2/5 (HowTo) · JSON-LD format 5/5 · validation 3/5 (malformed trainer `sameAs` URLs, bio stuffed into `jobTitle`). **Total 49.**
- **Missing:**
  - `reviewedBy` and `lastReviewed` on MedicalWebPage.
  - Person authors with credentials.
  - `parentOrganization` linking the health Organization to `#gym`.
  - Justdial and Facebook in `sameAs`.
  - `speakable`.

### Platform Optimization (47/100) [Likely]
| Platform | Score | Rationale |
|---|---|---|
| Google AI Overviews | 60 | Good structure, FAQs and SSR. YMYL pages lack a reviewer. A Google Maps CID exists. |
| ChatGPT search | 45 | Crawlable, and llms.txt is good. Entity recognition is weak (few sameAs, no Wikipedia). |
| Perplexity | 35 | No community validation visible (Reddit not measured). References link only to homepages. |
| Gemini | 50 | Google Business Profile implied by the Maps CID. No YouTube. |
| Bing Copilot | 45 | No LinkedIn or Microsoft-ecosystem signals. Bingbot allowed. |

---

## Quick Wins (this week)
1. **Remove the leaked internal text** (the "Earning:…" line on the IF guide; the "How we sustain" bullets on `/health/about`; the "Sandbox preview…", "Never hide emergency info behind paywall" and "Auto-selects relevant actions…" template strings). It's one template fix plus one article fix, with the biggest trust gain.
2. **Assign a real, named medical reviewer** (with credentials and a profile page) to the top 20 health guides. Until then, **hide the "placeholder" line** rather than showing it. Add `reviewedBy` (Person) and `lastReviewed` to the schema.
3. **Link the 4.7/303+ rating to the Justdial listing.** Rename `/reviews` to "Reviews" (not "Member Reviews") until real reviews are published, or embed or link the Google and Justdial reviews. Change "Read verified member reviews" and the llms.txt pointer to match.
4. **Fix the homepage FAQPage price answer** so it states the festive price and end date, matching the `Offer` and llms.txt data.
5. **State both numbers explicitly** ("Calls: +91 88518 30081 · WhatsApp: +91 92668 40289") in llms.txt, the FAQ and the contact page, or use one number for both.
6. **Fix the trainer `sameAs` URLs** (remove the doubled `https://www.instagram.com/` prefix and the tracking params), move Manish's certifications out of `jobTitle`, and add Justdial and Facebook profiles to the LocalBusiness `sameAs`.
7. **Add a `/health` section to llms.txt** (top guides, editorial policy, who runs it), add a `parentOrganization` link from "Premium Health Platform" to Royal Fitness Club, and either explain "BHG" or replace it.

## 30-Day Action Plan
- **Week 1: Trust cleanup**
  - [ ] Remove leaked notes across all `/health` templates (grep for "Earning:", "Sandbox preview", "Auto-selects", "paywall")
  - [ ] Hide reviewer placeholders and fix the rating source link and `/reviews` wording
- **Week 2: Entity consolidation**
  - [ ] One publisher identity on `/health` with an "operated by Royal Fitness Club" disclosure, NAP in the footer, and schema `parentOrganization`
  - [ ] Clean up `sameAs`. Create author or profile pages (Aman Sharma, trainers, medical reviewer) with Person schema
- **Week 3: Content depth**
  - [ ] Rewrite the disease template so each page has 600+ unique words. Drop or source the "illustrative" charts. Link references to specific guideline documents
  - [ ] Expand metformin, ashwagandha and dosha-basics past 600 unique words with linked sources. Add citations to the creatine and diabetes-exercise blog posts
- **Week 4: Multilingual and technical**
  - [ ] Publish a `/hi/health` hub (or redirect `/hi` and `/health/hi` there), add JSON-LD to `/hi/health/blog`, and translate the Hindi page footers
  - [ ] Use real `lastmod` values, shorten health titles to 60 characters or less and descriptions to 150–160, drop HowTo, and add a full CSP

---

## Appendix: Pages Analyzed
Columns: words = body text excluding nav/header/footer/aside (includes in-body boilerplate) · T/D = title/description length · can = canonical · hl = hreflang count · key schema types.

| Path | Words | T | D | can | hl | Key schema |
|---|---|---|---|---|---|---|
| / (home) | 1968 | 59 | 207 | Y | 0 | FAQPage, HealthClub, LocalBusiness, Person |
| /about | 386 | 61 | 120 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /membership | 1411 | 83 | 145 | Y | 0 | BreadcrumbList, FAQPage, HealthClub, LocalBusiness, Person |
| /contact | 173 | 66 | 166 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /reviews | 128 | 60 | 130 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /faq | 826 | 74 | 177 | Y | 0 | BreadcrumbList, FAQPage, HealthClub, LocalBusiness, Person |
| /programs | 211 | 83 | 129 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /programs/personal-training | 495 | 91 | 159 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /why-royal-fitness | 344 | 77 | 151 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /gallery | 209 | 44 | 114 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /blog | 1331 | 75 | 136 | Y | 0 | BlogPosting, BreadcrumbList, HealthClub, LocalBusiness, Person |
| /blog/best-gym-in-sector-93-noida-checklist | 553 | 80 | 140 | Y | 0 | BlogPosting, BreadcrumbList, HealthClub, Organization, Person |
| /blog/gym-fees-in-noida-membership-cost-guide | 584 | 81 | 165 | Y | 0 | BlogPosting, BreadcrumbList, HealthClub, Organization, Person |
| /blog/creatine-safe-hai-kya-fayde-side-effects | 546 | 86 | 147 | Y | 0 | BlogPosting, BreadcrumbList, HealthClub, Organization, Person |
| /blog/diabetes-mein-exercise-kaise-kare-sugar-control | 524 | 85 | 143 | Y | 0 | BlogPosting, BreadcrumbList, HealthClub, Organization, Person |
| /tools | 319 | 83 | 142 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /tools/bmi-calculator | 208 | 71 | 126 | Y | 0 | BreadcrumbList, FAQPage, HealthClub, LocalBusiness, Person |
| /tools/calorie-calculator | 328 | 69 | 128 | Y | 0 | BreadcrumbList, FAQPage, HealthClub, LocalBusiness, Person |
| /exercises/deadlift | 140 | 80 | 165 | Y | 0 | BreadcrumbList, HealthClub, HowTo, LocalBusiness, Person |
| /diet-plans/vegetarian-fat-loss-diet-plan | 280 | 76 | 169 | Y | 0 | BreadcrumbList, HealthClub, LocalBusiness, Person |
| /health | 2503 | 100 | 270 | Y | 3 | Organization (no Breadcrumb) |
| /health/about | 486 | 86 | 155 | Y | 3 | BreadcrumbList, FAQPage, HowTo, Organization |
| /health/blog/complete-indian-guide-type-2-diabetes | 1509 | 119 | 194 | Y | 3 | BlogPosting, BreadcrumbList, FAQPage, Organization |
| /health/blog/fatty-liver-reversal-guide | 828 | 95 | 171 | Y | 3 | BlogPosting, BreadcrumbList, FAQPage, Organization |
| /health/blog/generic-semaglutide-india-guide | 2408 | 119 | 143 | Y | 3 | Article, BreadcrumbList, FAQPage, Organization |
| /health/blog/heart-attack-under-40-india | 2359 | 110 | 151 | Y | 3 | Article, BreadcrumbList, FAQPage, Organization |
| /health/blog/indian-guide-blood-pressure | 990 | 105 | 155 | Y | 3 | BlogPosting, BreadcrumbList, FAQPage, Organization |
| /health/blog/intermittent-fasting-india-safe-guide | 874 | 96 | 148 | Y | 3 | BlogPosting, BreadcrumbList, FAQPage, Organization (leaked "Earning:" note) |
| /health/blog/pcos-complete-guide-indian-women | 888 | 108 | 165 | Y | 3 | BlogPosting, BreadcrumbList, FAQPage, Organization |
| /health/blog/understanding-thyroid-health | 891 | 104 | 172 | Y | 3 | BlogPosting, BreadcrumbList, FAQPage, Organization |
| /health/diseases/acidity | 1394 (~416 unique) | 77 | 78 | Y | 0 | BreadcrumbList, FAQPage, MedicalWebPage, Organization |
| /health/diseases/anemia | 1376 (~401 unique) | 76 | 75 | Y | 0 | BreadcrumbList, FAQPage, MedicalWebPage, Organization |
| /health/diseases/asthma | 1392 (~417 unique) | 76 | 71 | Y | 0 | BreadcrumbList, FAQPage, MedicalWebPage, Organization |
| /health/diseases/back-pain | 1409 (~434 unique) | 79 | 66 | Y | 0 | BreadcrumbList, FAQPage, MedicalWebPage, Organization |
| /health/medicines/metformin | 438 | 79 | 98 | Y | 0 | FAQPage, MedicalWebPage, Organization |
| /health/herbs/ashwagandha | 426 | 77 | 92 | Y | 0 | FAQPage, MedicalWebPage, Organization |
| /health/ayurveda/dosha-basics | 357 | 76 | 94 | Y | 0 | MedicalWebPage, Organization |
| /hi/health/blog | 486 | 74 | 116 | Y | 3 | none |
| /hi/health/blog/heart-attack-under-40-india | 1803 | 114 | 153 | Y | 3 | Article, BreadcrumbList, FAQPage, Organization |
| /hi/health/blog/sleep-guide-indians | 1949 | 108 | 153 | Y | 3 | Article, BreadcrumbList, FAQPage, Organization |
| /hi | **404** | 14 | 0 | N | 0 | none |
| /health/hi | **404** | 14 | 0 | N | 0 | none |
| /hi/health | **404** | 14 | 0 | N | 0 | none |

Also fetched: `/robots.txt` (200), `/sitemap.xml` (200, 545 URLs — includes all health URLs), `/health/sitemap.xml` (200, 325 URLs, subset), `/llms.txt` (200, 6.4 KB), `/sitemap_index.xml` (404), `/llms-full.txt` (404), `/health/llms.txt` (404), `/health/blog/guides` (200, hreflang check). No forms were submitted and the repo was not modified.

# Phase 7: content quality inventory (25 Oct 2026)

Crawled every article-type URL in the live `/health/sitemap.xml` (246 pages) with
`crawl.js`, then scored each page with `an.js`. Per-page results: `inventory.csv`.

- **words**: words in the page's main content.
- **uniqWords**: 5-word phrases that appear on no other page of the same type. This is
  the "how much of this page is actually its own" number. Template text scores 0.
- **doses**: number/unit patterns (mg, IU, g/day…). Food nutrition values show up here
  too and were checked by hand.

## What we found

| Page type | Pages | Median words | Median own words | Under 150 own words | Ads on page |
|---|---|---|---|---|---|
| Diseases `/health/diseases/*` | 120 | 1,118 | **35** | **117** | yes (3 slots) |
| Herbs | 20 | 202 | 152 | 10 | yes |
| Nutrition | 12 | 206 | 104 | 12 | yes |
| Lab tests | 14 | 132 | 88 | 14 | yes |
| Symptoms | 12 | 105 | 79 | 12 | yes |
| Ayurveda | 6 | 253 | 124 | 6 | yes |
| Medicines | 12 | ~265 | n/a | 7 | yes |
| News | 12 | 271 | 196 | 4 | yes |
| Older blog (`editorial.ts` + `blog-enrichment.ts`) | 14 | ~760 | ~550 | 0 | yes |
| New long-form posts (`content/blog`) | 10 EN + 9 HI | ~2,250 | ~2,100 | 0 | yes |

1. **Disease pages are one template with the name swapped.** `genericDetail()` in
   `src/health/data/diseases-detail.ts` writes the same definition, causes, diagnosis,
   treatment, Ayurveda, nutrition, FAQ and references for every disease. 117 of 120 pages
   have under 150 words of their own; the median is 35. Only type 2 diabetes,
   hypothyroidism and arthritis have real content. Google treats this as scaled,
   low-value content, and AdSense reviews it the same way. This is the biggest risk on
   the site, much bigger than the old ~300-word articles.
2. **Reference pages are thin** (herbs, nutrition, labs, symptoms, Ayurveda, medicines:
   ~76 pages at 100–250 words) and all carry ad slots.
3. **Medicine doses** (rule 7): vitamin D 60,000 IU protocol, paracetamol 3–4 g/day,
   ginger 1 g/day, semaglutide 2.4 mg. **Fixed in this PR.**
4. **Made-up chart:** every disease page drew a "risk factors" bar chart with invented
   values (90, 76, 62, 48, 34), labelled "illustrative". **Removed in this PR.**
5. **Cure language: no real problem.** Every "cure" hit was a disclaimer ("no miracle
   cures", "be cautious of guaranteed cure claims") or an FAQ answering "can it be cured?"
   with "it depends; usually managed, not cured".
6. **Older blog articles (14)** are 700–1,300 words, not 300. Their weak point is sources
   (about 6 outbound links each, mostly site links) and uncited numbers, not length.

## Plan

| Slice | What | Needs owner? |
|---|---|---|
| 7.1 (this PR) | Remove doses and the made-up chart | No |
| 7.2 | 117 templated disease pages: `noindex`, no ads, out of the sitemap, until each is rewritten. Pages stay live for visitors and internal links. | **Yes** |
| 7.3 | Thin reference pages (~76): keep indexed, take ad slots off until they pass 600 own words with sources | **Yes** |
| 7.4 | Rewrite disease pages to the post standard, highest-search first (diabetes family, BP, thyroid, PCOS, fatty liver, anemia…), ~10/week, each `pending-medical-review`, then re-index | No |
| 7.5 | Older blog: add cited sources to every statistic, move to `reviewStatus: pending-medical-review` | No |

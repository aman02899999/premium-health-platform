# Phase 4 (speed), slice 1: the three pages that failed LCP/CLS

Measured 25 Oct 2026 with `perf2.js` (the Phase 0 `perf.js` plus `BASE`, `OUT` and `PAGES` env vars):
390 px phone, 150 ms RTT, 1.6 Mbps down, 4x CPU slowdown, median of 3 loads. Ad and analytics
scripts are blocked so they don't add noise.

## Which 20 pages

There is no visit data: Vercel Web Analytics is off and `health.page_views` is empty. So the
"top 20" are the 20 key pages picked in Phase 0 (`docs/baseline/2026-10-24/tools/perf.js`): the
money pages, the main gym pages and the busiest health templates. This is an assumption, not traffic.

## Results

`live-before.jsonl`: production on 25 Oct, all 20 pages. 17 pass. Fail: `/gallery` LCP 4.6 s,
`/blog` LCP 3.4 s, `/hi/health/blog` CLS 0.105 (LCP 2.48 s, just under).

Same machine, local production build (`next build && next start`, no env vars), before and after:

| Page | LCP before | LCP after | CLS before | CLS after | Page weight before → after |
|---|---|---|---|---|---|
| `/gallery` | 4.82 s | 1.65 s | 0 | 0 | 1,282 → 613 KB |
| `/blog` | 3.15 s | 1.70 s | 0 | 0 | 623 → 536 KB |
| `/hi/health/blog` | 2.62 s | 1.60 s | 0.105 | 0.001 | 826 → 827 KB |
| `/health/blog/guides` (not in the 20) | 2.59 s | 1.49 s | 0.001 | 0.001 | 707 → 708 KB |

`local-before.json` and `local-after.json` hold these runs. `local-after-first-pass.jsonl` is all 20
pages after the image fix, with a first Hindi attempt (preloading the Devanagari font) that made
`/hi/health/blog` worse (LCP 3.4 s, CLS unchanged), so it was replaced by `font-display: optional`.

## Causes (from `lcpdiag.js`)

- `/gallery`: the LCP is the first carousel photo. All 10 carousel photos (1,400 px originals,
  50–135 KB each) started downloading at once because "hidden" cards are still in the viewport, so
  the first photo shared the connection with nine others and finished at 4.7 s.
- `/blog`: the LCP is the first post cover, a 91 KB 1,400 px original marked `loading="lazy"`.
- `/hi/health/blog`: the 120 KB Devanagari font arrived at 3.7 s, after first paint, and swapping it
  in re-wrapped the category buttons and card grid (shift 0.104).

## Not done in this slice

- Total Blocking Time is 600–900 ms on `/`, `/library`, `/health` and disease pages. It doesn't
  break LCP/CLS, but it is the risk for INP (responsiveness), which can only be measured with field data.

## Slice 2: blocked main thread on health pages (25 Oct, later)

`prof.js` (CPU profile per script during load) showed recharts (~300 KB, chunk `1__k-r_…`) costing
~0.5 s of main-thread time on every disease page, though its only chart sits far down the page.
Charts now load through `src/health/components/LazyChart.tsx` when they come within 300 px of the screen.

Same machine, local production build, 5 loads each (`perf3.js`, `RUNS=5`):

| Page | Total Blocking Time before → after | JS before → after |
|---|---|---|
| `/health/diseases/asthma` | 1,096 → 545 ms | 558 → 437 KB |
| `/health/diseases/type-2-diabetes` | 1,174 → 683 ms | 558 → 437 KB |
| `/health/nutrition/oats` | 922 → 804 ms | the chart is on screen at load, so it still loads |
| `/health` | 900 → 871 ms | unchanged (no chart at load) |

LCP and CLS unchanged. Still open: `/` and `/health` spend ~0.8 s on React start-up, layout and paint,
with no single library to cut.

## Slice 3: slow taps on the home page, `/health` and the library (25 Oct, later)

`trace2.js` (long tasks during load, by cause) showed no single heavy library on these pages. The
phone spends its time styling and laying out the whole page (1,600+ elements on the home page) in
two ~450 ms blocks, then starting React. Most of that work is for sections far below the screen.

Below-the-fold sections now carry a `cv-auto` class (`content-visibility: auto`, defined in both
`globals.css` files), so the browser skips their layout and paint until they come near the screen.
The hero and first screen are untouched. Checked by `src/lib/content-visibility.test.ts`.

Same machine, local production build, 5 loads each (`perf3.js`, `RUNS=5`):

| Page | Total Blocking Time before → after | LCP before → after | CLS |
|---|---|---|---|
| `/` | 604 → 370 ms | 2.02 → 1.81 s | 0 → 0 |
| `/health` | 721 → 446 ms | 2.31 → 2.17 s | 0.001 → 0.001 |
| `/library` | 746 → 370 ms | 2.04 → 1.66 s | 0 → 0 |

Behaviour checks (390 px and 1280 px, `anchor.js` compares the page with and without `cv-auto`):
the links that point into these pages (`/library#combos` from sales emails, `/library#complete`)
land in the same place as before. Typing a bare section id that nothing links to can land
differently on desktop (`/library#books` stops ~0.8 screen early, `/health#faq` now scrolls where it
didn't before); on phones every tested id lands as before. Scrolling the whole page shifts layout by at most 0.006; scroll
animations all play; no horizontal overflow; no page errors. Full-page screenshots show blank
areas for off-screen sections, which is how `content-visibility` works; normal scrolling shows them.

Found, not fixed here: `/health/news` links to `/#newsletter`, but the home page has no such section.

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

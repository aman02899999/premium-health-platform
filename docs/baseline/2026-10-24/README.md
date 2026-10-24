# Phase 0 baseline, 24 Oct 2026

Evidence behind `docs/REBUILD_STATUS.md` and `CONSTRAINTS.md`. Read-only: no forms were submitted,
no payments or messages were triggered, and no settings were changed.

| File | What it is |
|---|---|
| `pages.csv` | One row per sitemap URL (545): status, overflow widths, errors, LCP/CLS at 360/390/1280, axe issues |
| `summary.json` | Totals from the crawl |
| `linkstatus.txt` | Every same-site link found on the pages (937) and its status |
| `perf.json` | Throttled mobile run on 20 key pages, median of 3 |
| `security-report.md` | Security audit, plus live Supabase checks at the end |
| `geo-report.md` | SEO and AI-search audit (GEO score) |
| `tools/` | The scripts used, so the next baseline is comparable |

## Re-running

The scripts need Playwright with Chromium and `axe-core` installed next to them
(`npm i axe-core@4.10.2` in a scratch copy of `tools/`). Then, from that copy:

```
node crawl.js     # reads urls.txt, writes results.jsonl (resumable). WIDTHS and CONC env vars optional
node analyze.js   # writes pages.csv, summary.json, links.txt
node perf.js      # writes perf.json
```

`crawl.js` and `perf.js` block Meta Pixel, Google Analytics and AdSense so audit visits don't count
as real traffic or ad impressions.

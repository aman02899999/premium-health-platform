# Constraints

Last reviewed: 24 Oct 2026 (Phase 0 draft, waiting for the owner to confirm).

This is the quality bar for every change to this repo. Read it before writing code. Do not weaken
it to make a change pass. Changing a number here is a decision for the owner, made in its own PR.

The numbers below are the defaults from the rebuild program (project instructions, section 6),
measured against the live site on 24 Oct 2026. Evidence: `docs/baseline/2026-10-24/`.

## Floor (always enforced)

- No new suppression comments: `@ts-ignore`, `@ts-expect-error`, `eslint-disable`. Today there are 44
  `eslint-disable` lines in `src/` and `scripts/`; that number must not grow.
- No unimplemented stubs (`throw new Error("Not implemented")`, empty `catch {}`).
- Tests are never skipped or deleted to get to green. Today: 737 passing, 140 skipped. The 140
  skipped are the `*.integration.test.ts` files that need `TEST_DATABASE_URL`. Neither the passing
  count nor the set of test files may go down.
- No secrets in source. Env var values are never printed, committed or pasted into chat.
- No model names in commits, PR text, code or the site, other than the required attribution lines.
- This file is not edited in the same PR as a change that would fail it.

## Enforced with numbers (run before every PR)

| Dimension | Rule | Checked by | Today (24 Oct) |
|---|---|---|---|
| Types | Zero type errors | `npm run typecheck` | 0 errors |
| Lint | Zero errors; warnings must not grow | `npm run lint` | 0 errors, 12 warnings |
| Unit tests | All pass; count not reduced | `npm test` | 737 passed, 140 skipped (115 files) |
| Posts | Every post valid | `npm run check:posts` (also in prebuild) | 18 files OK (9 EN, 9 HI) |
| AdSense placement | Ads only on `/health`, `/blog`, `/hi` | `npm run check:ads` (also in prebuild) | OK. Live crawl agrees: the AdSense script loaded on 357 pages, all under `/health`, `/blog` or `/hi` |
| Build | Production build passes | `npm run build` | Not run in Phase 0 (needs env vars) |

## Measured on the live site (enforced from Phase 3/4 on)

These need a running site, so they are checked against production or a preview deploy with the
scripts in `docs/baseline/2026-10-24/tools/` (Playwright + axe-core). They are not in CI yet.

| Dimension | Target | Checked by | Today (24 Oct) |
|---|---|---|---|
| LCP, mobile | under 2.5 s on throttled mobile (390 px, ~1.6 Mbps, 150 ms RTT, 4x CPU) | `tools/perf.js` | 17 of 20 key pages pass. Fail: `/gallery` 4.5 s, `/blog` 3.3 s, `/hi/health/blog` 2.5 s |
| CLS, mobile | under 0.1 | `tools/perf.js`, `tools/crawl.js` | 3 of 545 pages over 0.1 in the crawl; `/hi/health/blog` 0.105 throttled |
| INP | under 200 ms | Field data only (Vercel Speed Insights is off) | **Not measured.** Proxy: Total Blocking Time is 1.1–1.3 s on `/health` and disease pages, so INP is at risk there |
| Accessibility | 0 axe serious/critical (WCAG 2.1 AA) | `tools/crawl.js` at 390 px | **370 of 545 pages fail.** 365 colour-contrast, 27 scrollable-region-focusable, 4 select-name, 1 button-name |
| Console errors | 0 on every page | `tools/crawl.js` | 0 from the site itself (see the note in `docs/REBUILD_STATUS.md`) |
| JS exceptions | 0 on every page | `tools/crawl.js` | 0 |
| Horizontal overflow | none at 360/390/768/1280 px | `tools/crawl.js` | 6 health pages overflow at 360 px |
| Broken internal links | 0 | `tools/crawl.js` + link check | 0 of 937 |
| HTTP status | every sitemap URL returns 200 | `tools/crawl.js` | 545 of 545 |

## Measured, not yet enforced (direction only)

| Metric | Today | Direction |
|---|---|---|
| JS per page, mobile (transfer) | gym 170–290 KB, health 400–570 KB | must not grow |
| npm audit, production deps | 1 critical (`dompurify`, via mermaid/jspdf), 1 high (`zod`, via the AI SDK), 2 low | must fall to 0 high/critical (Phase 5) |
| GEO score | 52/100 | must rise (Phase 6) |

## Exceptions

None yet. An exception needs a rule, a path, a reason, an owner and an expiry date.

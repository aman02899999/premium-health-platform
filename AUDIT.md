# Post-Merge Audit — PR #5 (Phase 2: monetization, SEO, SSO, earning, images, A/B testing, performance)

Audited revision: `c7e7362` (merge of PR #5 into `main`).

Six real defects were found and fixed. Everything else that was flagged during the
audit is recorded under [Deliberately not changed](#deliberately-not-changed) so it
does not get "re-fixed" later.

> **Provenance note.** The follow-up patch (`audit-fixes.patch`) referenced by the
> hand-off notes was **not present** in this checkout, and no local commit or remote
> ref contained it (the fixes were committed locally in a session whose remote access
> was revoked). The six fixes below were therefore re-implemented from the audit
> findings and re-verified end-to-end in this session: `npm run typecheck`,
> `npm run test` (65 passing / 13 files), `npm run build` (359/359 pages),
> `npm run lint` (81 pre-existing problems, 0 in changed files).

## Summary

| # | Severity | Defect | Fix | Files |
|---|----------|--------|-----|-------|
| 1 | **Critical (security)** | Download tokens were forgeable — the embedded secret was never validated, so anyone could mint a token for any product and download paid digital products for free | HMAC-SHA256 signing + `timingSafeEqual` verification before the payload is trusted | `src/lib/monetization/payment.ts` |
| 2 | High | Download tokens never expired — the payload was colon-delimited but carried an ISO timestamp, so `split(":")` truncated the expiry and produced an `Invalid Date` comparison that was always false | Epoch-millisecond expiry, `\|` delimiter | `src/lib/monetization/payment.ts` |
| 3 | High (SEO) | Six sitemap URLs returned 404 — `/affiliate-products/{slug}` was advertised for 6 products but no such route existed | Removed from sitemap; permanent 308 redirects to the canonical `/products/{slug}` | `src/app/sitemap.ts`, `next.config.ts` |
| 4 | High | `/api/lead` had no rate limiting despite the 5/min requirement — scriptable lead spam | `rateLimitFromRequest()` at 5/min per IP, `429` + `Retry-After` | `src/app/api/lead/route.ts` |
| 5 | Low (perf) | Four internal links on `/blog` used `<a href>` instead of `next/link`, forcing full page reloads | Converted to `<Link>` | `src/app/blog/page.tsx` |
| 6 | Medium | `AuthContext` recomputed `session.expires` with `Date.now()` on every render, so the expiry drifted and never expired; state was loaded with a `setState` inside `useEffect` | Client-only external store read via `useSyncExternalStore`, expiry anchored to the persisted sign-in time (30-day TTL) | `src/components/auth/AuthContext.tsx` |

Supporting changes: `src/lib/monetization/payment.test.ts` (8 regression tests),
`src/app/download/[token]/page.tsx` (security copy now describes the signed format),
`.env.example` (`DOWNLOAD_TOKEN_SECRET`).

---

## 1. Forgeable download tokens (critical)

`verifyDownloadToken()` base64-decoded the token, split it, and checked only that
`orderId`, `productId` and `expiresAt` were **present**. The payload's fourth field
was a secret that was never compared — so the "signature" was decorative. Anyone
could construct `base64url("anything|anything|2099-01-01T00:00:00.000Z|anything")`
and receive the paid product for free.

**Fix** — the token is now `base64url(payload) + "." + base64url(HMAC-SHA256(payload))`
with `payload = orderId|productId|expiresAtMs`. Verification recomputes the HMAC and
compares with `timingSafeEqual` (length-checked first) **before** any field of the
payload is read. Key: `DOWNLOAD_TOKEN_SECRET`, falling back to `NEXTAUTH_SECRET`,
then a demo default for local runs. Rotating the secret invalidates outstanding links.

## 2. Download tokens never expired

`expiresAt` was `new Date(...).toISOString()`, e.g. `2026-09-12T10:31:07.123Z`, but
the payload used `:` as its delimiter. `split(":")` therefore returned
`expiresAt = "2026-09-12T10"` (the hour segment only), `new Date("2026-09-12T10")`
is an `Invalid Date` (`NaN`), and `Date.now() > NaN` is `false` forever. Tokens never
expired — the 72-hour guarantee in the UI was fiction.

**Fix** — expiry is stored as epoch milliseconds in a payload that uses `|` as its
delimiter (`orderId|productId|expiresAtMs`), so splitting is unambiguous, `Number()`
parses it, and `Date.now() > expiresAtMs` is a real comparison. `verifyDownloadToken()`
still returns an ISO `expiresAt` for API consumers.

## 3. Six sitemap URLs returned 404 (SEO)

`src/app/sitemap.ts` pushed `/affiliate-products/{slug}` for every active affiliate
product, but only the `/affiliate-products` index route exists — there is no `[slug]`
child route. A full crawl of the sitemap found six non-200 URLs.

**Fix** — the six per-product URLs are no longer emitted (the `/affiliate-products`
index stays in the sitemap, and canonical product pages are already emitted from
`/products`). `next.config.ts` now 308-redirects each legacy slug to its canonical
`/products/{slug}` page, so previously crawled/shared links keep their link equity
instead of 404ing. The slugs exist in `src/data/editorial.ts` (`PRODUCTS`), which is
what `/products/[slug]` renders.

## 4. `/api/lead` had no rate limiting

The endpoint accepted unlimited POSTs from a single IP.

**Fix** — `rateLimitFromRequest(req, 5)` (the existing in-memory limiter already used
by `/api/health/food`) is applied before validation. The 6th submission within a
minute returns `429` with `Retry-After: 60`.

## 5. `<a href>` on `/blog`

Four hero-chip links (`/blog/category`, `/blog/latest`, `/blog/trending`, `/premium`)
used raw anchors, causing full document reloads and losing client-side navigation.
Converted to `next/link`.

## 6. `AuthContext` session drift + setState-in-effect

`expires: new Date(Date.now() + 30 days)` was recomputed on every render, so the
session expiry moved forward forever (it could never expire), and hydration ran
`setUser(...)`/`setLoading(...)` inside `useEffect`.

**Fix** — auth state lives in a module-level external store read with
`useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)`:

- the snapshot is built once per client (and on sign-in/sign-out) and is
  referentially stable, so `expires` is a fixed timestamp;
- it is derived from the persisted sign-in time (`user.createdAt` + 30 days), so the
  session survives reloads and **genuinely expires** — an elapsed TTL clears the
  stored session instead of resurrecting it;
- `getServerSnapshot()` returns the signed-out state, so SSR never touches
  `localStorage` and there is no setState-in-effect.

Provider methods are `useCallback`-stable and the context value is memoised.

---

## Regression tests

`src/lib/monetization/payment.test.ts` adds 8 tests (57 → 65 total, 13 files):

1. token round-trips and preserves order/product ids;
2. expiry is exactly the requested window (default 72h, custom honoured);
3. a token in the **legacy, unsigned** format is rejected (the actual exploit);
4. a token signed with the wrong secret is rejected;
5. a tampered payload that keeps the original signature is rejected;
6. an expired token is rejected (previously it never expired);
7. malformed / signature-less tokens are rejected;
8. `NEXTAUTH_SECRET` fallback works, and rotating `DOWNLOAD_TOKEN_SECRET`
   invalidates tokens minted under the previous key.

## Verification performed

- `npm run typecheck` — clean
- `npm run test` — 65 passing / 13 files
- `npm run build` — 359/359 pages
- `npm run lint` — 81 problems, all pre-existing, 0 in the files touched here
- Full crawl of every sitemap URL: 317 URLs, 0 non-200
- Download flow: forged token → rejected; valid token → 200, expires exactly 72h later
- Lead endpoint: 5 × 201, then 429
- Affiliate redirects: `/affiliate-products/{slug}` → 308 → `/products/{slug}`
- End-to-end + adversarial sweep (re-run against a production build): the real
  `/api/monetization/checkout/mock` → `/api/monetization/download/[token]` path was
  exercised end to end (checkout 200 → download 200 → `/download/[token]` page 200),
  plus 10 tamper variants — payload swapped, expiry extended, signature truncated /
  wrong length / empty, missing separator, legacy colon format, junk, path traversal
  and a 5 KB input — all rejected with 400 (13/13 checks passed)
- Google Fonts reachability re-tested (curl and `fetch()`): still blocked, so the
  `next/font` migration remains correctly deferred

## Residual risks and recommended follow-ups (found while sweeping for the same defect classes)

These were found by a follow-up sweep (hardcoded secret fallbacks, non-constant-time
comparisons, unsigned tokens, unauthenticated write endpoints). None of them are
exploitable as shipped — there is no real paid file storage behind the download route
and no entitlement is granted by the webhook — so they are **reported rather than
changed**, to keep this PR to the audited defects.

1. **`downloadTokenSecret()` falls back to the in-repo constant `"demo-secret"`.**
   Setting neither `DOWNLOAD_TOKEN_SECRET` nor `NEXTAUTH_SECRET` means the HMAC key is
   a value anyone can read in this repository — tokens would be forgeable again, which
   is exactly defect #1. The verified demo flow runs on that fallback (no env vars are
   set in CI), which is why it is left in place. **Deployment requirement: set
   `DOWNLOAD_TOKEN_SECRET` (or `NEXTAUTH_SECRET`) in production.** Recommended
   follow-up: fail closed in production when neither is configured.
2. **`/api/webhooks/razorpay` does not verify `RAZORPAY_WEBHOOK_SECRET`.** It is a
   stub that only logs — it does not mark orders paid or grant premium, so nothing is
   currently exploitable. Signature verification **must** be implemented before that
   route is wired to entitlements.
3. **Other write endpoints have no rate limiting** (`/api/newsletter`, `/api/referral`,
   `/api/whatsapp/optin`, `/api/push/subscribe`, `/api/monetization/analytics`,
   `/api/affiliate/click`, `/api/auth/signin`). Only `/api/lead` had an explicit 5/min
   requirement (defect #4) and was fixed; the rest are unauthenticated but low-impact.
4. **No non-constant-time signature comparisons remain** — the only `===` signature
   comparison in the tree is a commented-out example in `RazorpayProvider`. Checks out.

## Deliberately not changed

These were reviewed and left alone on purpose — please do not "fix" them:

- **54 `react-hooks/static-components` warnings.** All five affected files are server
  components statically rendered once at build time, so the remount cost the rule
  warns about never materialises. Refactoring would churn five content pages for no
  measurable gain.
- **17 `react/no-unescaped-entities` and 9 `react-hooks/set-state-in-effect`.**
  Pre-existing, in files unrelated to this work.
- **Affiliate/lead/product demo data.** Prices, ratings and merchants stay clearly
  marked as demo placeholders — nothing is fabricated.

## Outstanding (not fixed here)

- **Google Fonts → `next/font` migration.** `layout.tsx` loads Inter and Fraunces via
  a render-blocking `<link>` to `fonts.googleapis.com`. `next/font` would self-host
  them, but **`next/font` fetches at build time** and Google Fonts is unreachable from
  the CI sandbox, so the change broke the build and was reverted. The `<link>` carries
  a comment explaining this. Re-tested in this environment (curl and `fetch()` both
  fail to reach `fonts.googleapis.com`), so the migration is confirmed still blocked
  here. Only attempt it from a build environment with network access to
  `fonts.googleapis.com`, and confirm with `npm run build`.
- **Visual review of the 8 AI-generated product images in `public/products/`.** All 8 were
  inspected this session and are clean studio photography: unbranded, no garbled text, no
  invented logos, medically plausible. Two cosmetic notes: `mustard-oil.jpg` is a small
  screw-cap glass bottle while the affiliate listing says "5L" (a tin would be right), and
  `millet-combo.jpg` shows five grain varieties where the copy says three
  (foxtail + barnyard + ragi). Neither blocks anything.

- **Image-to-product *pairing* on `/store` — one clear mismatch.** Reviewing the images
  themselves is not the same as reviewing what they are attached to. Checking the rendered
  pages against the mapping in `getProductImageForSlug()` (`src/lib/monetization/config.ts`)
  turned up this:

  | Digital product card | Image currently mapped | Assessment |
  |---|---|---|
  | Indian Diabetes Diet Guide | `diabetes-guide.jpg` | correct |
  | **Ayurvedic Herbs Reference Guide — 50 Herbs** | **`mustard-oil.jpg`** | **wrong** — a bottle of cooking oil illustrates a herbal-medicine guide |
  | Indian Heart-Healthy Diet Guide | `millet-combo.jpg` | generic but defensible (food theme) |
  | 30-Day Indian Weight Management Plan | `weight-management.jpg` | correct |
  | Indian High-Protein Vegetarian Diet | `whey-protein.jpg` | loose — a supplement photo for a diet guide, but the protein theme is relevant |

  Render order itself is correct (each card shows its own image); it is the mapping data that
  is off. The affiliate products on `/store` and both deals on `/deals` pair correctly.

  This is a creative decision rather than a code defect, so it is reported and not changed:
  the only fully correct fix is one new herb-themed image (there is no herbs image in
  `public/products/`), which is exactly the regeneration the hand-off asked to avoid. The
  alternatives — leaving the card without an image so it falls back to the branded gradient
  placeholder, or swapping in a generic food shot — are one-line changes either way.

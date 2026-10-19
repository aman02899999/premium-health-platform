# Engineering audit: payments, orders and webhooks

Date: 19 October 2026. Branch: `claude/audit-payment-hardening-zv4ko2`, cut from `main` at `52caf50`.

Scope of this pass: Phase 1 (baseline) and Phase 2 (payment and order reliability) of the master brief.
Everything else in the brief (sales pipeline, attribution, messaging, checkout recovery, retention,
financial reporting, UX) is **not audited in depth here** and is listed under "Not covered" at the end.

Evidence labels used below:

- **CONFIRMED**: read in the code and, where marked, reproduced by a test on a real Postgres.
- **NOT VERIFIED**: depends on production configuration (Vercel env vars, Razorpay dashboard, Supabase) that this audit could not see.

## 1. Baseline

| Check | Command | Result before changes |
| --- | --- | --- |
| Working tree | `git status` | Clean, on the feature branch, identical to `main` |
| Type check | `npm run typecheck` | Pass |
| Lint | `npm run lint` | Pass (0 problems) |
| Unit tests (no DB) | `npm test` | 69 files passed, 14 skipped; 565 tests passed, 71 skipped |
| All tests on a real DB | `TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/rfc_test npm test` | 83 files, 636 tests, all passed |
| Production build | `npm run build` | Pass |
| Migrations | all 21 files in `supabase/migrations/` plus `supabase/health-drizzle/0000_health_init.sql`, applied in order to a fresh PostgreSQL 16 with stub `auth`/`storage` schemas | All applied without error |
| Dependencies | `npm audit --omit=dev` | 4 advisories: `next` (critical), `postcss` (high, via next), `sharp` (high), `source-map-js` (high) |

The disposable database was a local PostgreSQL 16 in the container. No production database, Razorpay
account, Vercel project or Supabase project was contacted.

## 2. What already works well (keep it)

These were checked and should not be changed without a reason:

- **Server-side pricing everywhere on the gym side.** Membership (`src/app/api/membership/order/route.ts` via `quoteMembership`), store (`src/app/api/shop/order/route.ts` via `quoteCart` on a fresh catalogue), diet chart (`dietPlan()` price list) and library (`quoteCart` in `src/lib/library/pricing.ts`) all price on the server. The browser sends ids, never amounts. CONFIRMED.
- **Checkout signature verification is correct.** `src/lib/payments/signature.ts` computes `HMAC-SHA256(order_id|payment_id, key secret)` and compares in constant time; missing secret or input returns false. CONFIRMED (existing tests).
- **Webhook signature verification is correct.** It is computed over the raw request text (`req.text()` before parsing) with `RAZORPAY_WEBHOOK_SECRET`. CONFIRMED.
- **Forged browser callbacks cannot mark an order paid.** Every verify route (`membership`, `shop`, `diet-chart`, `library`) refuses without a valid signature, and the signature binds the Razorpay order id we created. CONFIRMED.
- **Membership extension is applied exactly once.** `applyPaidOrder` (`src/lib/growth/members.ts`) locks the order row, checks `applied_at`, and does member insert or extension plus referral reward in one transaction. Concurrent calls tested. CONFIRMED (existing integration test).
- **Referral rewards are one-time.** `referral_rewards.order_id` is unique and the insert uses `on conflict do nothing`. CONFIRMED.
- **Store stock is deducted once per order and never below zero.** `markShopPaid` locks the order and products and sets `stock_applied`. CONFIRMED (existing integration test).
- **Diet order confirmation is sent once.** `markDietPaid` returns `firstTime` from a locked read. CONFIRMED.
- **A late `payment.failed` cannot undo a paid order.** All `mark*Failed` functions only move `status = 'created'`. CONFIRMED (new test).
- **Order tables are server-only.** RLS on, no policies, `revoke all from anon, authenticated` in the migrations. CONFIRMED in migrations; NOT VERIFIED in the live Supabase project.
- **Admin APIs check `isAdmin()` on the server** (Google sign-in plus `public.admins`), and `src/proxy.ts` adds an origin check on admin and account writes. CONFIRMED for every route under `src/app/api/admin` except `login`/`logout`, which don't need it.
- **The health site's simulated payment flows are switched off in production.** `healthPaymentsLive()` returns false when `VERCEL_ENV=production`; the mock checkout routes return 404 there. CONFIRMED in code; NOT VERIFIED on the live deployment.

## 3. Findings

### F1. Refunds and chargebacks were invisible to the site. High. CONFIRMED. Fixed in this branch.

- **Where:** `src/app/api/webhooks/razorpay/route.ts` handled only `payment.captured` and `payment.failed`. No order table had a refund or dispute field.
- **Effect:** a refunded library order kept its download link for the full access period; a refunded or charged-back membership or store order stayed counted in the admin "All time" revenue, which was gross, not net; nobody was told about a chargeback.
- **Reproduce (before):** send a signed `refund.processed` event for a paid book order; the response is `{ ok: true }` and nothing changes.
- **Fix:** additive columns `refunded_paise`, `refunded_at`, `disputed_at` on all four order tables; webhook handles `refund.processed` (stores the payment's running `amount_refunded`, so replays never double count) and `payment.dispute.created`; a fully refunded library order loses download access; the admin payments card shows refunds, disputes and net revenue.
- **Not changed on purpose:** a refunded membership is not shortened and a refunded store order is not restocked automatically. Those are business decisions (partial refunds, goods already shipped); the admin sees the flag and acts.

### F2. A captured payment's amount and currency were never compared with the order. Medium. CONFIRMED. Fixed.

- **Where:** the webhook marked whatever order id the payload named as paid.
- **Why only Medium:** Razorpay fixes the amount when an order is created, so in normal operation a mismatch can't occur. It becomes real if the webhook secret leaks, an order id is reused across accounts, or the account is misconfigured.
- **Fix:** before applying, the webhook loads the order (`findOrder` in `src/lib/payments/ledger.ts`) and refuses to apply a capture whose amount differs or whose currency isn't INR (`captureProblem` in `src/lib/payments/webhook-event.ts`). It answers 200 so Razorpay doesn't retry forever, logs the event as `amount_mismatch`, and the admin sees it.

### F3. No record of webhook deliveries; retries were only safe by accident of each table. Medium. CONFIRMED. Fixed.

- **Where:** the webhook ran four table updates for every event and kept no log.
- **Effect:** duplicates were harmless only because each update happens to be idempotent; there was no way to see what Razorpay had sent, what was refused, or which deliveries failed.
- **Fix:** new table `public.payment_events`, keyed by Razorpay's `X-Razorpay-Event-Id`. A finished event delivered again is skipped; a delivery that failed mid-way stays open and the retry completes it. The outcome (`applied`, `ignored`, `unknown_order`, `amount_mismatch`, `error`) and a short reason are stored.

### F4. No recovery for a payment the site never heard about. Medium. CONFIRMED. Fixed.

- **Where:** if the buyer closed the tab before the verify call and the webhook was missing, misconfigured or failed all its retries, the order stayed `created` while Razorpay held the money.
- **Fix:** `reconcilePayments()` (`src/lib/payments/reconcile.ts`) runs at the start of the existing daily cron. It asks Razorpay (read-only `GET /v1/orders/{id}/payments`) about unpaid orders created between 20 minutes and 72 hours ago, at most 60 per run, and applies a captured payment through the same idempotent path as the webhook. Amount mismatches and captured-then-refunded payments are reported, not applied.
- **Limit:** daily cadence, so a missed payment can wait up to about a day. NOT VERIFIED against the live Razorpay API (only a stubbed one).

### F5. A second payment on an already paid order went unnoticed. Low. CONFIRMED. Fixed (flag only).

- The webhook now flags "Second payment on an order already paid by pay_…: refund one of them" and does not report it to Meta as another sale.

### F6. The JSON body of a signed webhook was parsed without a guard. Low. CONFIRMED. Fixed.

- A signed but malformed body threw inside the route (a generic 500). It now returns 400.

### F7. Store stock is not reserved at checkout, so the last unit can be oversold. Medium. CONFIRMED. Not changed.

- `markShopPaid` never lets stock go below zero and writes a warning into the order's admin notes when it was short, but two buyers can both pay for the last unit. A reservation at order creation would need expiry handling for abandoned checkouts; worth doing with the abandoned-checkout work (Phase 6), not in this PR.

### F8. Browser verify trusts the signature without checking the payment is captured. Low. NOT VERIFIED.

- Razorpay signs the checkout result once the payment is authorised. With automatic capture (Razorpay's default) authorised payments are captured straight away. If the Razorpay account is set to manual capture, an authorised-but-uncaptured payment would be marked paid. Check Razorpay → Account & Settings → Payment capture. No code change made.

### F9. One trial diet plan per phone number can be beaten by paying two open orders at once. Low. CONFIRMED in code. Not changed.

- `hasPaidTrial` is checked when the order is created, not when it is paid.

### F10. In-memory rate limits on public order and lead endpoints. Low. CONFIRMED. Not changed.

- `recent` maps in the order and lead routes are per serverless instance, so the effective limit is higher than the number in the code. Razorpay order creation costs nothing, so the main risk is junk rows. A shared limiter (database or Vercel KV) would fix it.

### F11. Download tokens on the health site fall back to a hard-coded secret. Medium. CONFIRMED in code. Not changed.

- `src/health/lib/monetization/payment.ts` signs tokens with `DOWNLOAD_TOKEN_SECRET || NEXTAUTH_SECRET || "demo-secret"`. Today the download route only returns demo JSON and the minting routes are off in production, so nothing paid is exposed. It must be made to fail closed before that store goes live.

### F12. `next` 16.2.6 has published advisories, including a middleware/proxy bypass. High (dependency). CONFIRMED by `npm audit`. Not changed in this PR.

- The fix is `next@16.4.2` (not a major version). The site uses `src/proxy.ts` for the Supabase session refresh and an origin check on admin writes; the admin APIs check `isAdmin()` themselves, so a bypass weakens defence in depth rather than opening the admin. Upgrade in its own PR with a full build and smoke test, not mixed into payment changes.

### F13. The outbox holds a database transaction open while it calls WhatsApp or email. Low. CONFIRMED. Not changed.

- `dispatch()` in `src/lib/growth/outbox.ts` sends inside `begin … commit` with the row locked. It is correct (no duplicate sends) but ties up a pooled connection for the length of the HTTP call.

## 4. Answers to the brief's Phase 1 questions (payments scope)

1. **Can the same payment event be processed twice?** No duplicated membership days, referral rewards, stock deductions or confirmation messages, confirmed by tests. Now also logged and skipped by event id.
2. **Can a forged browser callback mark an unpaid order paid?** No. A valid HMAC with the key secret is required.
3. **Are amounts from trusted server data?** Yes, on all four gym checkouts. Webhook captures are now also checked against the stored amount.
4. **Webhook signatures against the right secret and raw body?** Yes.
5. **Transactional where several records change together?** Yes for membership plus referral and for store order plus stock. Library and diet are single-row updates.
6. **Can one customer reach another's data?** Not audited in depth in this pass beyond: order tables are server-only, the store's "my orders" filters by signed-in user id or email, and library access needs a 32-character random token. NOT VERIFIED for the health site.
7. **Admin endpoints protected server-side?** Yes (see section 2).
8. **Scheduled jobs authenticated?** `/api/cron/daily` and `/api/cron/reel` require `Bearer $CRON_SECRET` and refuse in production without it. `/health/api/cron/daily` runs without the secret but is rate-limited to once every 6 hours. Whether `CRON_SECRET` is set in Vercel is NOT VERIFIED.
9. **Marketing suppressed for opted-out recipients?** WhatsApp marketing kinds are cancelled for numbers in `whatsapp_optouts` at send time. Email not audited in this pass.
10. **Attribution?** Before this branch, UTM tags were added to outgoing links but never read back: no lead or order recorded where it came from, campaign revenue ignored supplement and book orders and refunds, and `/health/admin/earning` and the public `/health/api/earn/stats` showed invented figures ("1247 users × ₹199"). Fixed in the second round; see the implementation report.
11. **Behaviour when PostgreSQL or Razorpay is down?** Order creation returns 502 or 503 with a WhatsApp fallback message; verify routes return "pending" after a valid signature so the buyer isn't told the payment failed; the webhook answers 500 so Razorpay retries; reconciliation skips Razorpay errors per order.
12. **Missing migrations, stale env vars?** All migrations apply cleanly in order. The new migration must be applied before this code is deployed (see the operations runbook).

## 5. Not covered in this pass

In the first pass, phases 3 to 8 and 12 were not covered. The second round added attribution, real revenue reporting and supplement checkout reminders. Still not covered: post-purchase retention, profit reporting (no cost data exists), WhatsApp checkout reminders and UX. Lead stages, trial follow-ups and the funnel scoreboard are in a separate pull request.

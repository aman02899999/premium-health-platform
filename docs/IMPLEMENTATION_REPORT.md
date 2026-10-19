# Implementation report: payments, attribution and revenue reporting

Branch `claude/audit-payment-hardening-zv4ko2`. Findings referenced as F1 to F13 are in
[ENGINEERING_AUDIT.md](ENGINEERING_AUDIT.md).

## Status of each change

Status words as defined in the brief. Nothing here is INTEGRATION VERIFIED, PREVIEW VERIFIED or
PRODUCTION VERIFIED: Razorpay was replaced by built events and a stubbed API, and nothing was deployed.

| Change | Finding | Status |
| --- | --- | --- |
| Webhook event log and dedupe by `X-Razorpay-Event-Id` (`payment_events`) | F3 | IMPLEMENTED, TESTED (real Postgres) |
| Amount and currency check before applying a captured payment | F2 | IMPLEMENTED, TESTED |
| Refunds (`refund.processed`) recorded as a running total on the order | F1 | IMPLEMENTED, TESTED |
| Chargebacks (`payment.dispute.created`) flagged on the order | F1 | IMPLEMENTED, TESTED |
| Fully refunded library orders lose download access and recovery | F1 | IMPLEMENTED, TESTED |
| Admin payments card: net-of-refund totals, refund and dispute tags, "Needs a look in Razorpay" list for all products | F1 to F5 | IMPLEMENTED, type-checked and built; not clicked through in a browser |
| Daily reconciliation of unpaid orders against Razorpay (read-only) | F4 | IMPLEMENTED, TESTED with a stubbed Razorpay API; NOT VERIFIED against the real API |
| Double payment on a paid order flagged, not reported to Meta twice | F5 | IMPLEMENTED, TESTED |
| Malformed signed webhook body returns 400 | F6 | IMPLEMENTED, TESTED |
| Webhook says in the log when `RAZORPAY_WEBHOOK_SECRET` is missing | | IMPLEMENTED, TESTED |
| Unpaid supplement checkouts hold their stock for 20 minutes; a buyer's own retry isn't blocked | F7 | IMPLEMENTED, TESTED (real Postgres) |
| Health download tokens fail closed in production without a signing secret | F11 | IMPLEMENTED, TESTED |
| F8 to F10, F12, F13 | | Not changed; see the audit for why and what to do |
| First- and last-touch attribution cookie (`rfc_attr`), stored once on leads and all four order tables | Phase 4 | IMPLEMENTED, TESTED (unit and real Postgres); not clicked through in a browser |
| Campaign results count supplement and book orders, net of refunds | Phase 4 | IMPLEMENTED, TESTED |
| `/health/admin/earning`: real collected, refunded and net revenue, conversion and channel tables; fabricated numbers removed | Phases 4, 9 | IMPLEMENTED, type-checked, built and query-tested; page not opened in a browser |
| `/health/api/earn/stats` admin-only, real figures (it was public and returned invented numbers) | Phase 9, security | IMPLEMENTED, built |
| Checkout reminder email for unpaid supplement orders (consent, stock and cancellation checks) | Phase 6 | IMPLEMENTED, TESTED (real Postgres) |

## Files changed

Second round (attribution, revenue, supplement reminders):

- `supabase/migrations/20261019150000_attribution.sql`: nullable `attribution jsonb` (size-capped) on `leads` and the four order tables. Additive only.
- `src/lib/attribution.ts`, `src/components/ui/AttributionTracker.tsx` (in the gym layout), `src/lib/attribution-store.ts`: cookie, re-validation on the server, one-line save after each lead or order insert.
- `src/lib/growth/campaigns.ts`: campaign revenue unions all four order tables, net of refunds.
- `src/lib/revenue/report.ts`, `src/health/components/earning/RevenueDashboard.tsx`, `src/app/(health)/health/admin/earning/page.tsx`, `src/app/(health)/health/api/earn/stats/route.ts`; `EarningCharts.tsx` (demo data) deleted.
- `src/lib/growth/daily.ts`, `src/lib/growth/sales-emails.ts`: supplement orders in the checkout reminder.
- `/privacy`: describes the attribution cookie.
- Tests: `src/lib/attribution.test.ts`, `src/lib/revenue/report.integration.test.ts`, additions to `campaigns.integration.test.ts`, `sales.integration.test.ts`, `sales.test.ts`.

First round (payments):


New:

- `supabase/migrations/20261019120000_payment_events.sql`: the `payment_events` table; `refunded_paise`, `refunded_at`, `disputed_at` on `membership_orders`, `book_orders`, `diet_orders`, `shop_orders`; indexes on `razorpay_payment_id` and on unpaid orders. Additive only.
- `src/lib/payments/webhook-event.ts`: pure parsing of Razorpay events; `captureProblem`, `isDoublePayment`.
- `src/lib/payments/ledger.ts`: cross-table order lookup, event claim and finish, refund and dispute recording, the reconciliation query, flagged events for the admin.
- `src/lib/payments/process.ts`: `applyCapturedPayment` (the one place a captured payment is applied) and `handleRazorpayEvent`.
- `src/lib/payments/reconcile.ts`: `reconcilePayments`.
- `src/lib/payments/webhook.test.ts`: 12 unit tests (parser, checks, webhook route with mocks).
- `src/lib/payments/payments.integration.test.ts`: 11 tests on a real database.
- `docs/ENGINEERING_AUDIT.md`, `docs/IMPLEMENTATION_REPORT.md`, `docs/SECURITY_REVIEW.md`, `docs/OPERATIONS_RUNBOOK.md`.

Modified:

- `src/app/api/webhooks/razorpay/route.ts`: verifies, parses, hands the event to `handleRazorpayEvent`; Meta Purchase only for accepted payments.
- `src/app/api/cron/daily/route.ts`: runs `reconcilePayments()` first, isolated so a Razorpay failure can't stop the daily reminders; its result is included in the run summary.
- `src/lib/payments/razorpay.ts`: `fetchOrderPayments` (read-only `GET /v1/orders/{id}/payments`).
- `src/lib/payments/orders.ts`: membership orders carry `refundedPaise` and `disputedAt`.
- `src/lib/library/orders.ts`: access and recovery require `refunded_paise < amount_paise`.
- `src/app/api/admin/payments/route.ts`: also returns `flagged` events.
- `src/components/admin/AdminApp.tsx`: the payments card shows the above.

The browser verify routes, order creation routes, pricing, `applyPaidOrder`, `markShopPaid` and
`markDietPaid` are unchanged.

## Tests run after the changes

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npm run typecheck` | Pass |
| Lint | `npm run lint` | Pass |
| Unit tests (no DB) | `npm test` | 70 files passed, 15 skipped; 577 passed, 82 skipped |
| All tests on a real DB | `TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/rfc_test npm test` | 85 files, 659 tests, all passed |
| Production build | `npm run build` | Pass |
| Migration | applied twice to the test database | Second run is a no-op (all `if not exists`) |
| Test sensitivity | removed the amount check, then the refund condition on library access, and re-ran | Each removal made its test fail; code restored |

What the payment tests cover, against the brief's list:

| Brief asks for | Covered by |
| --- | --- |
| Valid payment | captured membership, store and library payments applied |
| Invalid signature, tampered body | webhook route returns 401 and nothing is processed |
| Missing secret | webhook route returns 401 with the secret unset |
| Duplicate webhooks | same event three times concurrently, and a resend under a new event id: one member, one welcome message, stock taken once |
| Duplicate browser callbacks | existing tests: concurrent `applyPaidOrder` and `markShopPaid` |
| Mismatched amounts and currency | refused, flagged, order untouched |
| Wrong order id | `unknown_order`, nothing changed |
| Failed payments | failed then captured ends paid; captured then late failed stays paid |
| Database failure | a constraint that makes the update fail: first delivery returns 500 and stays open, the retry applies it |
| Concurrent processing | three concurrent deliveries of one event |
| Refunds | partial, repeated and out-of-order refund totals; full refund ends access |
| Reconciliation | captured payment recovered once; mismatched amount reported; orders younger than 20 minutes skipped; no keys means no calls |

No real charge, refund or message was made. The Razorpay API was never called.

## Rollback

Application: revert the merge commit. The old webhook ignores the new columns and table.

Database: not needed for a rollback; the new columns have defaults and nothing old reads them. To
remove them anyway, after confirming you no longer need the refund and event history:

```sql
drop table if exists public.payment_events;
alter table public.membership_orders drop column if exists refunded_paise, drop column if exists refunded_at, drop column if exists disputed_at;
alter table public.book_orders drop column if exists refunded_paise, drop column if exists refunded_at, drop column if exists disputed_at;
alter table public.diet_orders drop column if exists refunded_paise, drop column if exists refunded_at, drop column if exists disputed_at;
alter table public.shop_orders drop column if exists refunded_paise, drop column if exists refunded_at, drop column if exists disputed_at;
```

This deletes data, so it needs a backup and the owner's approval first.

## Outstanding

- Apply both migrations in Supabase **before** deploying this code (the new queries read the new columns).
- Add `refund.processed` and `payment.dispute.created` to the Razorpay webhook's events.
- Confirm in Razorpay that payments are captured automatically (F8).
- Then test on a preview deployment with Razorpay test keys: one paid order, one refund, one webhook resend from the Razorpay dashboard.
- Upgrade `next` to 16.4.2 in its own PR (F12).
- Not started: post-purchase retention, WhatsApp checkout reminders (no approved template and no recorded WhatsApp marketing consent at checkout, so email only), recording ad spend and product costs so CAC, ROAS and profit can be computed.

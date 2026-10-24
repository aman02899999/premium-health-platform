# Operations runbook: payments

## Environment variables (names only; never commit values)

| Variable | Where | Needed for |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | Server; key id reaches the browser through the order APIs | Creating orders, reconciliation |
| `RAZORPAY_KEY_SECRET` | Server only | Creating orders, checkout signature, reconciliation |
| `RAZORPAY_WEBHOOK_SECRET` | Server only | Webhook signature. Without it every webhook is refused (401) and the log says so |
| `POSTGRES_URL` or `DATABASE_URL` | Server only | All order tables |
| `CRON_SECRET` | Server only | `/api/cron/daily` (which now also reconciles payments) and `/api/cron/reel`; without it they refuse to run in production |
| `RAZORPAY_API_URL` | Tests only | Points Razorpay calls at a local stand-in. Leave unset in every Vercel environment |

Use `rzp_test_` keys on Preview and Development, live keys only on Production.

## Deploying this change (in this order)

1. In Supabase → SQL editor, run `supabase/migrations/20261019120000_payment_events.sql`, then `supabase/migrations/20261019150000_attribution.sql`. Both only add tables, columns and indexes, and both are safe to run twice.
2. In Razorpay → Webhooks, on the existing `https://<site>/api/webhooks/razorpay` webhook, tick `refund.processed` and `payment.dispute.created` in addition to `payment.captured` and `payment.failed`.
3. In Razorpay → Account & Settings, confirm payments are captured automatically.
4. Deploy to Preview with test keys and check: one paid membership, one refund from the Razorpay dashboard, and a resend of the same webhook from the dashboard (the second delivery should answer `"outcome":"duplicate"`).
5. Deploy to Production only after the owner approves.

If step 1 is skipped, the library download page, the earnings dashboard, campaign results, the admin payments card and the webhook fail
because the new columns don't exist; Razorpay keeps retrying the webhook, so no payment is lost, but
buyers can't open their books until the migration runs.

## What runs on a schedule

| Job | Schedule (UTC) | Payments part |
| --- | --- | --- |
| `/api/cron/daily` | 02:15 daily | `reconcilePayments()`: unpaid orders created 20 minutes to 72 hours ago, at most 60, checked against Razorpay; captured ones applied. Result is in the daily-run summary under `payments` |

## Watching it

- **Admin → Payments → "Needs a look in Razorpay"** lists refused captures (amount mismatch), payments for unknown orders, double payments, refunds, chargebacks and failed deliveries, for all products.
- **Vercel logs:** search for `[razorpay webhook]` (failures and items needing a person) and `[payments] reconciliation:` (anything recovered or refused).
- **Database:** `select event, outcome, detail, received_at from public.payment_events order by received_at desc limit 50;`

## When something goes wrong

- **Buyer says they paid but the order shows "not paid":** look the order up in Razorpay. If the payment is captured, the next daily run applies it; to apply it immediately, resend the `payment.captured` webhook from the Razorpay dashboard.
- **Amount mismatch flagged:** don't apply it by hand. Compare the order in Razorpay with the row in the database and find out why before refunding or fulfilling.
- **Double payment flagged:** refund the newer payment in Razorpay. The refund webhook records it.
- **Chargeback flagged:** respond in Razorpay with the order details. Membership days and stock are not changed automatically.
- **Refund recorded on a membership or store order:** shorten the membership or restock by hand if that's what was agreed with the customer. The site doesn't guess.
- **WhatsApp promotions stopped going out:** check Vercel logs for `[outbox] WhatsApp promotions held` or `probing`. That means Meta returned error 131042 (it couldn't charge the payment method) on a promotion in the last day. Fix the payment method in WhatsApp Manager → Billing. Nothing else needs doing: each daily run sends a 5-message probe, and the first one Meta delivers reopens the full daily cap. Utility messages (receipts, plans, reminders) are never held.
- **Email bounce rate is high:** `select reason, count(*) from public.email_suppressions group by 1;` shows how many addresses were blocked. Hard bounces and spam complaints are added by the Resend webhook automatically; marketing email to them is cancelled at send time. Receipts and plans still go.

## Messaging hardening (migration `20261024120000_messaging_hardening.sql`)

Run it in Supabase → SQL editor **before** the code deploys. Without the `email_suppressions` table the outbox
stops at the first marketing email and nothing after it in that run is sent (receipts included). The migration
adds the table, fills it from bounces already recorded (43 addresses on 24 Oct), and drops the public
"anyone can submit a lead" policy. Safe to run twice.

## Rollback

See [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md#rollback). Reverting the code is enough; the
database change can stay.

## Attribution and the earnings dashboard

- Visitors get a first-party cookie `rfc_attr` (90 days) holding the first and latest campaign tags, referring site and landing page. It is listed on `/privacy`. When they send the trial form or start any checkout, it is copied once into the `attribution` column of the lead or order; it is never overwritten afterwards.
- `/health/admin/earning` (admin only) shows money collected, refunds and net revenue per product, leads, lead-to-customer conversion, returning buyers and results by first-touch channel, last-touch channel and campaign, for any IST date range up to a year. `/health/api/earn/stats` returns the same as JSON to admins only.
- Ad spend, product cost, shipping cost and payment fees are not recorded anywhere, so cost per lead, CAC, ROAS and profit show "Data not available". Desk payments (cash or UPI at the gym) are not in these tables either.
- Orders and leads from before the attribution migration show as "Unknown".

## Checkout reminders

The daily cron emails one reminder 2 to 72 hours after an unpaid diet-plan, library or supplement
order, at most one per person every 14 days, never to anyone who unsubscribed or paid since, and
for supplements never when the order was cancelled or an item is now inactive or out of stock.
Payment reconciliation runs first in the same cron, so an order Razorpay captured without a webhook
is marked paid before reminders are chosen.

## Supplement stock holds

When someone opens a supplement checkout, the units in their cart are held for 20 minutes
(`HOLD_MINUTES` in `src/lib/shop/store.ts`) so another shopper can't buy the last one while they pay.
Their own retry isn't blocked. Holds are computed from unpaid orders, so nothing needs releasing.
A payment that arrives after its hold expired can still take stock below what's on the shelf; the
order's admin notes say so, as before.

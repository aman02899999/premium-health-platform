# Phase 1: money paths, 24 Oct 2026

What was checked, what was found, and what the owner has to do. No real charge, refund or payment
link was made. Razorpay was replaced by a local stand-in (`scripts/e2e/fake-razorpay.mjs`), and
the site ran against a throwaway local Postgres with every migration applied.

**Confidence.** [Certain] = seen in a query, a test or a page load. [Likely] = strong inference.
[Guessing] = judgement without direct evidence.

## 1. Every path, end to end

`scripts/e2e/payments.mjs` drives the running site over HTTP. Result: **53 of 53 checks pass**
(`e2e-payments-run.txt`). Before the library fix in this PR it was 51 of 52.

| Path | Order at server price | Browser verify | Webhook | Same webhook again | Refund webhook | Receipt | Admin view |
|---|---|---|---|---|---|---|---|
| Membership `/join` | Pass (₹1,500 festive monthly) | Pass, forged signature refused | Pass | `duplicate` | Pass, recorded | WhatsApp welcome, queued once | Payments tab lists it |
| Diet plans | Pass | Pass | Pass | `duplicate` | Pass | WhatsApp + email | (Diet Pro, not driven) |
| Supplement store | Pass | Pass, stock taken once | Pass | `duplicate` | Pass | Email to buyer and shop (not sent here: no email keys locally) | Store tab lists it |
| Library books | Seeded (needs PDFs in Supabase storage) | Pass, download link returned | Pass | `duplicate` | Pass, full refund ends access | **Was none. Fixed: email with the download link** | (not driven: needs Supabase storage) |
| Payment links `/pay` | Seeded | Pass | Pass | `duplicate` | Pass | WhatsApp text in the chat | (not driven) |

Also checked [Certain]: a payment whose browser tab was closed is recorded by the webhook alone; a
capture for the wrong amount is refused and flagged; a failed attempt followed by a successful one
ends paid; an unsigned webhook gets 401. The full test suite, including the 141 database tests
that are normally skipped, passes on the real database: 879 of 879.

`reconcilePayments()` [Certain]: the database test "reconciliation applies a payment Razorpay
captured but the site never heard about" passes, and production's `system_status.daily-run` on 24
Oct shows `payments: {checked: 1, recovered: [], mismatched: [], errors: []}`. It was not run
through the cron route here because that route also publishes the Instagram story and submits
IndexNow.

## 2. What the live data says

[Certain] (read-only SQL on 24 Oct):

- `membership_orders`, `shop_orders`, `book_orders`: **0 rows ever.** Nobody has paid online for a
  membership, a supplement or a book. Only the diet plan path has been used: 7 orders, 3 paid
  (₹49 each, 18 Oct and twice on 24 Oct), all three delivered.
- `payment_events`: **0 rows ever**, although the table has existed since 19 Oct and two payments
  were captured on 24 Oct. The webhook handler writes a row for every signed delivery before doing
  anything else. So Razorpay is either not sending webhooks to the site, or sending them with a
  different secret (refused with 401 before any row is written). [Likely] the webhook was set up
  in Razorpay's Test mode, the site moved to new keys on 18 Oct (`RAZORPAY_KEY_ID` and
  `RAZORPAY_KEY_SECRET` were both changed then), and Live mode has no webhook. Only the Razorpay
  dashboard can confirm this.
- What this costs today: the three diet payments were saved by the browser verify step. Without
  the webhook, a buyer who closes the tab waits for the next morning's reconciliation, and
  **refunds and chargebacks are never recorded**, because only the webhook tells the site about
  them.

## 3. The "password authentication failed" errors

**Root cause [Likely, strong evidence]: the Preview environment's `DATABASE_URL` holds a wrong
password. Production is not affected directly.**

Evidence [Certain]:

- It is still happening. Supabase's pooler (Supavisor) logged **401 failed logins for user
  `postgres` in the last 24 hours**, first at 06:22 UTC on 24 Oct, each burst followed by about 80
  "circuit breaker open … too many authentication failures, new connections are temporarily
  blocked" lines for the same IP.
- Each burst starts in the same minute a preview deployment was built: 07:23 (preview 07:22),
  07:40 (preview 07:39), 11:04 (preview 11:03), 11:47 (preview 11:47). Production deploys at
  07:37, 07:47, 08:07 and 11:10 caused none. The 06:15–07:00 burst covers 12 previews built in
  that window.
- Most failing IPs are in AWS us-east-1, where Vercel runs builds. Each failed 24–32
  times (one build's worth of pages) and logged in successfully zero times.
- Opening `/shop` on the latest preview at 11:52:58 UTC produced a failed login from Vercel's
  Seoul IP in the same second, and the page said "The store is being updated". Production `/shop`
  at the same time showed 32 product links.
- Production has two database URLs: `POSTGRES_URL` (written by the Supabase integration, used
  first by `src/health/db/index.ts`) and a hand-pasted `DATABASE_URL` (1 Oct). Preview only has
  the hand-pasted `DATABASE_URL`. Every production query works, so production uses the good one.

Why it matters for production [Likely]: two build machines that failed also built production
successfully. The pooler blocks an IP after repeated failures, so a production build that lands on
a machine a preview build just got blocked on can prerender the store with "being updated" and an
empty catalogue, until the 5-minute cache refresh. That matches the shape of the 12–19 Oct
`/shop` errors (10 errors, 2 visitors, spread over a week). Vercel's logs for 12–19 Oct are gone
(Hobby keeps 1 hour) and those deployments were deleted, so this part cannot be proven.
[Guessing] The DB connection timeouts on 18 and 24 Oct (04:40 UTC, no preview build nearby) may
have another cause; they are not explained here.

What I did not do: change any Vercel or Supabase setting (project rule 3), or read the env values.

## 4. What the owner needs to do

1. **Razorpay webhook (most important).** Razorpay Dashboard, switched to **Live mode** →
   Account & Settings → Webhooks. Check whether a webhook for
   `https://www.royalfitnesclub.in/api/webhooks/razorpay` exists. If not, add it with the events
   `payment.captured`, `payment.failed`, `refund.processed` and `payment.dispute.created`, and the
   same secret that is saved in Vercel as `RAZORPAY_WEBHOOK_SECRET`. If it exists, open it and
   look at the recent deliveries: a 401 means the secret differs from Vercel's.
2. **Preview database URL (a decision).** Choose one: clear the Preview `DATABASE_URL` so previews
   stop trying to log in (recommended: previews then show empty store and library pages, and can
   never write test data into the live database), or paste the current pooler string from Supabase
   → Connect into it (previews then read and write the live database).
3. **One real ₹1 test, after step 1.** Pay ₹1 on a payment link from the admin, refund it in the
   Razorpay dashboard, then tell me. I will check that `payment_events` got the capture and the
   refund. That is the only part of the chain that cannot be tested without Razorpay itself.

## 5. Not covered

- Receipt emails were queued, not delivered: no Resend key locally. Deliverability is the Phase 2
  messaging thread's job.
- The Razorpay Checkout popup itself (it loads from Razorpay's servers).
- Admin screens for diet orders, library and payment links were not driven (they need Supabase
  storage or sign-in).
- The membership receipt is WhatsApp only. If WhatsApp fails, a new member gets nothing in
  writing. Worth an email receipt later; not changed in this PR.

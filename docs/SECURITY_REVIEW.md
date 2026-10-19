# Security review (payments scope)

Date: 19 October 2026. This covers the payment, order, webhook, admin-authorisation and cron
surfaces read for [ENGINEERING_AUDIT.md](ENGINEERING_AUDIT.md). It is not a full Phase 9 review:
Supabase RLS in the live project, storage policies, XSS, logging of personal data and the health
site's API keys were not reviewed in this pass.

## Fixed in this branch

| Risk | Fix |
| --- | --- |
| A webhook with a leaked secret, or a misconfigured account, could mark an order paid for a different amount | Capture amount and currency must equal the stored order; otherwise refused and flagged |
| Refunded digital goods stayed downloadable | Full refund removes library access and token recovery |
| Chargebacks went unnoticed | Disputes recorded on the order and listed for the admin |
| No trail of what Razorpay sent | `payment_events` stores each delivery's id, type, order and payment ids, amount and outcome. It stores no card, bank, email or phone data |

## Checked and sound

- Razorpay key secret and webhook secret are read only in server modules (`import "server-only"` in `src/lib/payments/razorpay.ts`); the key id is the only value sent to the browser.
- Signature comparisons use `timingSafeEqual`.
- Order, member, referral and payment-event tables have RLS on and no policies, and grants are revoked from `anon` and `authenticated`, so the public Supabase key can't read them.
- Admin route handlers check `isAdmin()` (Supabase session plus `public.admins`) on the server.
- Reconciliation only reads from Razorpay (`GET`), validates the order id format before putting it in the URL, and applies payments through the same checks as the webhook.

## Residual risks, ranked

1. **`next` 16.2.6 advisories (critical per npm audit).** Upgrade to 16.4.2 in its own PR. The admin APIs still check authorisation themselves, so a proxy bypass would remove the origin check, not the login.
2. **Health download tokens can be signed with `"demo-secret"`** if neither `DOWNLOAD_TOKEN_SECRET` nor `NEXTAUTH_SECRET` is set. Fixed: in production, minting now throws and every token is rejected when no secret is set.
3. **Per-instance rate limits** on order and lead endpoints. Junk orders and leads are possible at scale.
4. **`sharp` and `postcss` advisories.** `sharp` needs a major upgrade; review separately.
5. **Cron secret comparison is a plain string compare**, not constant-time. Low practical risk over the network; easy fix when that file is next touched.
6. **Settings NOT VERIFIED from here:** whether `CRON_SECRET`, `RAZORPAY_WEBHOOK_SECRET` and the live Razorpay keys are set only for Production in Vercel, and whether previews use test keys and a separate database. If previews point at the production database, the health site's demo payment routes (live on previews) can write demo rows into production tables.

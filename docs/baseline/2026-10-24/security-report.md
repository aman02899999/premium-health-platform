# Security Audit Report — Phase 0 baseline (read-only)

Repo: premium-health-platform @ 486647b · Site: https://www.royalfitnesclub.in · Date: 2026-10-24
Method: I read code (`src/app/**/route.ts`, `src/proxy.ts`, `next.config.ts`, auth/payment/webhook libs, `supabase/migrations`, `supabase/health-drizzle`), ran `npm audit` (read-only), and sent plain unauthenticated GET/HEAD requests to the live site. I modified no files and sent no POST/PUT/DELETE, webhook or cron call with credentials.
Prior review: docs/SECURITY_REVIEW.md (19 Oct 2026, payments scope). Since then `next` has moved to 16.4.2, which clears the earlier critical Next advisory.

## Summary

- Critical: 0
- High: 1
- Medium: 3
- Low: 8
- Info: 4

Overall the gym-side (Royal Fitness Club) surface is in good shape. Every `/api/admin/*` handler calls `isAdmin()`/`adminRole()` itself. Razorpay, Meta and Resend webhooks verify HMAC with `timingSafeEqual`. Gym crons fail closed in production. All 49 `public` tables have RLS on, and the `health` schema is revoked from anon/authenticated with RLS on every table. Redirects are allowlisted. `dangerouslySetInnerHTML` never carries user data. The live site rejected all 30+ protected endpoints I probed with 401/403/404.

The main problem is in the legacy `/health` code. One write endpoint lets anyone in when an env var is missing (`/health/api/news/publish`). The `/health/api/*` tree also sits outside the proxy's Origin check. On the gym side, the public lead flow sends outbound WhatsApp and email to whatever phone or address is submitted, with only per-instance rate limits, and Supabase RLS lets anon insert leads directly.

## Findings

| # | Sev | Tag | Location | Evidence | Recommended fix |
|---|---|---|---|---|---|
| H1 | ~~High~~ **Low** (re-rated) | [Certain] code; [Certain] `NEWS_ADMIN_TOKEN` IS set in Vercel production and preview (checked by name, value not read, 24 Oct) | `src/app/(health)/health/api/news/publish/route.ts:11-15, 31, 74` | `authorised()` returns `true` when `NEWS_ADMIN_TOKEN` is unset ("Optional protection"). POST creates or **overwrites by slug** any health news article, with author, reviewer, sourceUrl and body taken from the caller, and publishes it live (`status` defaults to `published`, read by `src/health/lib/news.ts:10`). The variable is missing from `.env.example`, so it is probably unset. There is no Origin check either (the proxy only covers `/api/*`). The token compare is a plain `===`. The 500 response returns `detail: String(error)` (DB error text). | Fail closed: `if (!token) return false`. Compare with `timingSafeEqual`, or better, require `isAdmin()`. Validate `sourceUrl` as `https:`. Drop `detail` from responses. Confirm in Vercel whether `NEWS_ADMIN_TOKEN` is set, and check `health.news_items` for rows you didn't write. PoC (not executed): `curl -X POST /health/api/news/publish -d '{"title":"…","summary":"…","category":"…","body":[{…}],"slug":"<existing-slug>"}'`. |
| | | | | **Re-rating note (lead reviewer, 24 Oct):** the variable exists in production, so the route is locked today. The fail-open design and plain `===` compare remain a Low hardening item. | Same fix, lower priority. |
| M1 | Medium | [Certain] code / [Likely] impact | `src/app/api/leads/route.ts:13-21,31-32,60+`; `src/app/(health)/health/api/lead/route.ts:20`; `src/health/services/health/cache/rate-limit.ts:24` | Public lead POST queues a WhatsApp thank-you and, if `marketing:true`, an email to the **submitted** phone or address (`afterLeadSaved`). Daily follow-ups then go to rows with `follow_ups` (default true). The rate limit is an in-memory `Map` per serverless instance (5 per 10 min), keyed on `x-forwarded-for`, so many instances or IPs get around it. Effect: attacker-driven messages to third parties, WhatsApp quality and template spend, email reputation damage. The Maps also grow without bound. | Use a shared limiter (Upstash, Vercel KV or a Postgres counter) per IP **and** per destination phone/email. Add Turnstile or hCaptcha on the public forms. Send no outbound message until the number is verified, or cap first-touch sends per day. |
| M2 | Medium | [Likely] (migration Certain; live grants not verified) | `supabase/migrations` (combined line ~68): `create policy "anyone can submit a lead" on public.leads for insert to anon, authenticated with check (true)` | With the public anon key (shipped to browsers), anyone can insert into `public.leads` through Supabase REST. That skips all API validation, honeypot and rate limits. Inserted rows get `follow_ups=true` by default (migration line ~294), so the daily cron sends them WhatsApp follow-ups (`src/lib/growth/leads.ts:32,105`). The server already writes leads through `pool` (service connection), so the policy is unused. | `drop policy "anyone can submit a lead" on public.leads; revoke insert on public.leads from anon, authenticated;`. Check the result with the Supabase security advisor. |
| M3 | Medium | [Certain] | `src/proxy.ts:15-18, 60-69` | The Origin/CSRF check only runs for paths starting `/api/`. None of the `/health/api/*` writes are covered (lead, newsletter, whatsapp/optin, push/subscribe, referral, v1/keys POST/DELETE, v1/billing DELETE, affiliate/click, monetization/*, news/publish). Handlers use `req.json()`, which ignores Content-Type, so a cross-site `text/plain` form post works. Cookie-authenticated ones are partly covered by SameSite=Lax Supabase cookies, but the anonymous writes are open to drive-by spam. | Extend the Origin check to `^/(health/)?api/` (excluding webhooks and cron), and add `/health/api/:path*` to the matcher (session refresh can stay limited). Optionally require `Content-Type: application/json`. |
| L1 | Low | [Certain] | `src/app/api/cron/daily/route.ts:14`, `api/cron/reel/route.ts:15`, `(health)/health/api/cron/daily/route.ts:15`, `(health)/health/api/health/sync/route.ts:8` | `CRON_SECRET` is compared with plain `!==`/`===`. The health cron and health sync **fail open** when `CRON_SECRET` is unset; health cron is only throttled to once per 6 h. In prod the health cron returned 401, so the secret is set there. | Use a shared `cronAuthorized(req)` with `timingSafeEqual`, and fail closed when the secret is unset in production. |
| L2 | Low | [Certain] | `src/proxy.ts:46-57`; `src/lib/auth.ts:72-81` | Team-role limits (agent/manager) are enforced **only** in the proxy. A DB error there lets the request through ("let the route decide"), and the routes only check `isAdmin()`, not the role. A lower-role admin could reach owner-only APIs during a DB blip or a proxy bypass. `team/route.ts` does check `owner`. | Enforce role in a route-level helper (`requireRole(path)`), and fail closed on the proxy query error for `/api/admin`. |
| L3 | Low | [Certain] | `(health)/health/api/monetization/orders/route.ts:8,17-60`; `monetization/analytics/route.ts:50`; `monetization/leads/route.ts:29` | Unauthenticated POSTs push to module-level in-memory arrays. `ORDERS` is never trimmed and holds caller-supplied email and UTM data, so memory grows per instance. The payment provider falls back to mock. These are leftover demo code; the admin GETs read only per-instance memory. | Remove these demo endpoints or return 410 in production (as `checkout/mock` does). |
| L4 | Low | [Certain] | `src/app/api/library/recover/route.ts:6-15`, `src/lib/auth.ts:107-117`, `api/diet-preview`, `api/shop/order`, `api/membership/order`, `api/library/order`, `api/reviews` | Every limiter on login, recovery, forms and orders is an in-memory per-instance `Map` keyed on `x-forwarded-for`, so it doesn't hold across instances. Login is moot in prod (password login returns 403 once Supabase is configured). Recovery needs email plus `pay_` id, so brute force is impractical. | The same shared limiter as M1. |
| L5 | Low | [Certain] | `src/app/api/admin/media/route.ts:12` + `src/app/api/media/[id]/route.ts:7-13` | Upload type is checked against the **client-declared** `file.type` only. Served bytes get the stored MIME with `nosniff`. Allowed types are raster images, so the risk is low (admin-only upload). | Sniff magic bytes (or re-encode with sharp) before saving. |
| L6 | Low | [Certain] | `next.config.ts:69-83` (live headers confirm) | CSP is structural only (`base-uri`, `object-src`, `frame-ancestors`, `form-action`), with no `script-src`/`default-src`, so it gives no XSS mitigation. `X-Frame-Options: SAMEORIGIN` (not DENY). | Add a report-only `script-src` with nonces (Next supports nonce via proxy), list Razorpay, GTM, AdSense and Meta, then enforce. |
| L7 | Low | [Certain] | npm audit (prod) | `dompurify@3.4.16` **critical** (via `mermaid@11.17.2`, `jspdf@4.2.1`). Mermaid runs client-side with `securityLevel:"strict"` on repo-authored diagrams, so reachability from user input is low. `zod@4.5.4` **high** (via `@anthropic-ai/sdk`) is a memory exhaustion on oversized collections; it parses API responses server-side, so low reachability. `katex`/`mermaid` low. | `npm audit fix` (dompurify ≥3.4.17, zod ≥4.6.6), upgrade mermaid ≥12.2.0 in its own PR, and review the changelogs. |
| L8 | Low | [Certain] | `src/app/(health)/health/api/news/publish/route.ts:69,98`, `health/sync/route.ts:70`, `health/cron/daily/route.ts:26`, `api/admin/media/route.ts:19` | Raw `error.message`/`String(error)` returned in JSON responses (DB or driver details). | Return generic errors and log details server-side. |
| I1 | Info | [Certain] | `/health/api/webhooks/razorpay` (live GET 200) | Mock webhook. POST returns 503 in production (`healthPaymentsLive()`), and GET only returns a description. Dead code that confuses audits. | Delete it, or return 404 in production. |
| I2 | Info | [Certain] | `/health/api/health/sync` GET (live 200) | Public listing of sync jobs and capabilities. No PII. | Gate behind admin if not needed publicly. |
| I3 | Info | [Certain] | `src/lib/ai/agent.ts` | The WhatsApp AI agent is text-only (no tools), has a daily cap and `max_tokens` 4000, and hands off. Prompt injection can only affect the reply to the injecting sender (LLM01/LLM05 low). | Keep tool-less; log and monitor handoffs. |
| I4 | Info | [Certain] | `src/lib/auth.ts:15` | `DEV_PASSWORD = "royal-admin"` is used only when `NODE_ENV !== "production"` and Supabase is unconfigured. Not a secret. | None (consider requiring ADMIN_PASSWORD even in dev). |

No hardcoded secrets were found in tracked files: I scanned for Razorpay live keys, Anthropic, Resend, Meta, AWS, Google, Supabase secret keys, `whsec_`, private keys and inline Postgres URLs. `.env` and `.env*.local` are gitignored, and only `.env.example` is tracked (placeholders).

## Checked and sound (positive observations)

- **Admin auth.** Every handler in all 30 `src/app/api/admin/**` routes begins with `isAdmin()` or `adminRole()`; `team` additionally requires owner. `isAdmin()` = verified Supabase JWT (`getClaims`) plus the `public.is_admin()` RPC (security invoker, JWT email in `public.admins`). Health admin APIs use the same mechanism.
- **Razorpay.** `src/lib/payments/signature.ts` computes HMAC-SHA256 and compares with `timingSafeEqual` for both the checkout signature and the webhook (raw body). The webhook refuses when the secret is unset. The amount/currency match and event-id logging are described in the prior review. All five `*/verify` routes require a valid checkout signature.
- **Meta.** `src/lib/social/meta.ts:26-34` checks `X-Hub-Signature-256` (HMAC over the raw body, `timingSafeEqual`, either app secret). GET verify-token handshake works; live GET without a token returned 403.
- **Resend.** Svix signature with a ±5 min timestamp window and `timingSafeEqual`. Returns 503 if unconfigured.
- **Gym crons** fail closed in production when `CRON_SECRET` is unset; live returned 401.
- **Open redirects.** `/r/[code]` only redirects to `SITE_URL`. `/q/[code]` targets are re-checked with `allowedTarget()` and are admin-created. Auth callbacks use `safeNext()` (relative, rejects `//` and `/\`). `/ig` is a static page.
- **SQL.** All `pool.query` calls are parameterised. The interpolated fragments (`within()`, `IST_DAY()`, `SQL_TAG()`, `keyExpr`, `since`, table names) are code constants. Drizzle elsewhere.
- **XSS.** `dangerouslySetInnerHTML` is used only for JSON-LD (with `<` escaped), env-only analytics bootstraps, QR SVG generated server-side, and Mermaid output (`securityLevel:"strict"`). The markdown renderer builds React nodes and `safeHref()` filters links. React 19 also blocks `javascript:` hrefs.
- **IDOR.** `account/plan/file` joins `diet_orders.user_id = session user`. `shop/my-orders` is scoped to the session's id or verified email and strips `adminNotes`/`razorpayOrderId`. API keys and billing check ownership in the lib and return 404 for others'. Library downloads use 192-bit random tokens with slug membership and download-count claims, then a 60 s signed URL. Pay links use ~93-bit tokens.
- **Unsubscribe.** HMAC token with `timingSafeEqual`.
- **RLS.** All 49 public tables have `enable row level security`. Sensitive tables have no policies plus `revoke all … from anon, authenticated`. The `health` schema has `REVOKE ALL ON SCHEMA` and RLS on every table through a loop. The only anon-permissive policies are `site_content` select (public content) and `leads` insert (M2).
- **Health demo payment flows** (`checkout/mock`, `checkout/razorpay`) return 404 in production (live confirmed). `premium/checkout`, `checkout/verify`, `v1/billing/*` and the health webhook return 503 in production. The download-token secret throws in production if unset.
- **HTTPS and headers.** http redirects to https (308). HSTS 2 years with includeSubDomains. nosniff. Referrer-Policy. Permissions-Policy. COOP. `poweredByHeader:false`.

## npm audit

| Scope | Critical | High | Moderate | Low | Total |
|---|---|---|---|---|---|
| `npm audit --omit=dev` (prod) | 1 | 1 | 0 | 2 | 4 |
| `npm audit` (all) | 1 | 1 | 4 | 2 | 8 |

- critical `dompurify` ≤3.4.16 (via mermaid, jspdf). Fix available.
- high `zod` <4.6.6 (via @anthropic-ai/sdk). Fix available.
- low `katex`, `mermaid` (fix: mermaid@12.2.0, a major upgrade).
- moderate (dev only) `esbuild` ≤0.24.2, `@esbuild-kit/*`, `drizzle-kit` (dev-server exposure only).
- `next` is at 16.4.2 (installed), and the prior critical Next advisory no longer appears. `sharp` and `postcss` no longer appear.

## Live header check (GET https://www.royalfitnesclub.in/ and /health)

| Header | Value | Verdict |
|---|---|---|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` | OK (consider `preload`) |
| Content-Security-Policy | `base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self' https://api.razorpay.com https://checkout.razorpay.com; upgrade-insecure-requests` | Partial: no script-src (L6) |
| X-Frame-Options | `SAMEORIGIN` | OK (CSP frame-ancestors also set) |
| X-Content-Type-Options | `nosniff` | OK |
| Referrer-Policy | `strict-origin-when-cross-origin` | OK |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | OK |
| Cross-Origin-Opener-Policy | `same-origin-allow-popups` | OK |
| X-Powered-By | absent | OK |
| http://royalfitnesclub.in/ | 308 to https | OK |

## Live unauthenticated GET checks (no credentials sent)

401: `/api/admin/{me,leads,payments,contacts,team,chats,growth,shop}`, `/api/cron/daily`, `/api/cron/reel`, `/health/api/cron/daily`, `/health/api/{newsletter,push/subscribe,whatsapp/optin,affiliate/click,monetization/orders,monetization/leads,monetization/analytics,earn/stats,v1/keys,v1/keys/usage,v1/billing/subscription,auth/me,referral,v1/export/food,v1/usage}`, `/api/shop/my-orders`, `/api/account/plan/file`.
403: `/api/webhooks/meta`. 404: `/health/api/monetization/checkout/{mock,razorpay}`, `/health/admin`. 307 to /admin/login: `/admin`.
200 (expected public): `/health/api/premium/status` (returns `session:false`), `/health/api/webhooks/razorpay` (mock description, I1), `/health/api/health/sync` (I2).
Not probed (would need POST): `/health/api/news/publish` (H1).

## Routes reviewed and auth status

Legend: **Admin** = isAdmin/adminRole in handler · **Session** = verified Supabase user · **Sig** = HMAC signature · **Cron** = CRON_SECRET · **Token** = unguessable capability token · **Public** = intentionally unauthenticated · **Prod-off** = 404/503 when VERCEL_ENV=production.

### Gym (src/app)
| Route | Methods | Auth |
|---|---|---|
| api/admin/* (ads, ai-agent, audience, call-list, chats, chats/[peer], chats/media/[id], contacts, content, diet-pro/clients, diet-pro/foods, growth, growth/diet-order, growth/diet-plan, leads, library, library/reviews, media, members/import, notifications, payments, qr, reviews, shop, shop/seo, social/reel/[file], usda, whatsapp-templates, me) | GET/POST/PUT/PATCH/DELETE | Admin (every handler) |
| api/admin/team | GET, POST | Admin + owner |
| api/admin/login | POST | Public (403 when Supabase configured; throttled) |
| api/admin/logout | POST | Public (sign-out only) |
| api/cron/daily, api/cron/reel | GET | Cron (fail-closed in prod; plain compare L1) |
| api/webhooks/razorpay | POST | Sig (timingSafeEqual) |
| api/webhooks/meta | GET verify-token / POST | Sig (X-Hub-Signature-256) |
| api/webhooks/resend | POST | Sig (Svix) |
| api/account/plan/file, plan/update, welcome | GET/POST | Session + ownership |
| api/shop/my-orders | GET | Session |
| api/shop/order, membership/order, library/order, diet-chart/order | POST | Public, in-memory rate limit, Origin check |
| api/shop/verify, membership/verify, library/verify, diet-chart/verify, pay/verify | POST | Razorpay checkout signature |
| api/pay/[token] | POST | Token |
| api/library/download/[token]/[slug] | GET | Token + download cap |
| api/library/recover | POST | email + pay_id, in-memory limit |
| api/library/review | POST | Token (buyer) |
| api/leads, api/reviews, api/diet-preview | POST | Public, in-memory limit (M1) |
| api/shop/quote | POST | Public (read-only quote) |
| api/unsubscribe | GET/POST | HMAC token |
| api/media/[id], social/post-image/[file], social/story-image/[file], feeds/meta-catalog, membership/plans-pdf, proof-of-results | GET | Public (read-only) |
| auth/callback | GET | OAuth code; safeNext |
| r/[code], q/[code] | GET | Public; allowlisted redirect |
| llms.txt, blog/rss.xml | GET | Public |

### Health (src/app/(health)/health)
| Route | Methods | Auth |
|---|---|---|
| api/news/publish | POST, PUT | **x-news-token, fail-open when unset (H1)** |
| api/cron/daily | GET | Cron (fail-open when unset, throttled; set in prod) |
| api/health/sync | GET public; POST/DELETE | Admin or Cron (fail-open w/o secret only for cron branch) |
| api/newsletter, push/subscribe, whatsapp/optin, affiliate/click | POST public / GET Admin | No Origin check (M3) |
| api/lead | POST public (in-memory limit), GET docs | M1/M3 |
| api/referral | GET/POST | Session |
| api/auth/me, auth/session, premium/status | GET | Session (anonymous allowed, returns nothing private) |
| api/auth/signout | POST | Session sign-out |
| api/earn/stats | GET | Admin |
| api/monetization/orders, leads, analytics | GET Admin / POST public in-memory (L3) | |
| api/monetization/checkout/mock, checkout/razorpay | GET/POST | Prod-off (404) |
| api/monetization/checkout/verify, premium/checkout, v1/billing/checkout, v1/billing/verify, webhooks/razorpay (POST) | POST | Prod-off (503) |
| api/monetization/download/[token] | GET | HMAC token (throws in prod w/o secret) |
| api/v1/keys, keys/[keyId], keys/usage, v1/billing/subscription | GET/POST/DELETE | Session + ownership |
| api/v1/* data routes, export/[dataset], usage | GET | API key (keyedRoute), plan gates |
| api/v1, v1/openapi.json, v1/plans | GET | Public docs |
| api/health/*, realtime/*, search, articles, blog/*, diseases, herbs, medicines, lab-tests, products, monetization/{coupons,digital-products,preview,products,providers}, affiliate/stats, news, news/[slug], og, news/rss.xml | GET | Public read-only (third-party lookups; `health/food` rate-limited) |
| api/health/qa | POST | Public read-only retrieval (no LLM) |
| auth/callback | GET | OAuth code; safeNext |

## Recommendations (priority order)

1. Fix H1 today: make `news/publish` fail closed or require `isAdmin()`, and check `health.news_items` for foreign rows.
2. Drop the anon insert policy on `public.leads` (M2).
3. Add a shared, per-destination rate limit and a CAPTCHA to the public lead and opt-in flows that cause outbound WhatsApp or email (M1).
4. Extend the proxy Origin check to `/health/api/*` (M3).
5. Add one `cronAuthorized()` helper (constant-time, fail closed) and route-level role checks (L1, L2).
6. Delete the health demo/mock endpoints (L3, I1) and generic-ise error bodies (L8).
7. `npm audit fix` for dompurify and zod; plan the mermaid 12 upgrade (L7).
8. Plan a nonce-based `script-src` CSP in report-only mode first (L6).

Not verified from here: Vercel env (`NEWS_ADMIN_TOKEN`, preview vs production keys and DB), live Supabase grants and policies versus the migrations, storage bucket policies in the live project, and whether the Supabase `health` schema is exposed in API settings.

## Lead reviewer verification (24 Oct 2026, read-only Supabase queries)

- [Certain] `public.leads` live policies: `anyone can submit a lead` INSERT for `{anon,authenticated}` WITH CHECK `true` exists in production. M2 confirmed live.
- [Certain] `anon` and `authenticated` hold the default Supabase table grants on `public.leads` (incl. UPDATE/DELETE/TRUNCATE). RLS blocks UPDATE/DELETE/SELECT for anon (no policy), and PostgREST cannot issue TRUNCATE, so the practical exposure is the INSERT policy only. Revoking unused grants is defence in depth.
- [Certain] All other `public`/`storage` policies gate on `is_admin()` or `auth.uid() = user_id`; `site_content` is public-read by design.
- [Certain] Supabase security advisor: 118 INFO "RLS enabled, no policy" (intended: server-only tables) and 1 WARN: leaked-password protection disabled in Supabase Auth (a dashboard setting; owner decision).
- [Certain] Supabase performance advisor: 64 unused indexes (INFO), 3 duplicate indexes (WARN) on `health.api_keys`, `health.clinical_trials`, `public.social_inbox`.

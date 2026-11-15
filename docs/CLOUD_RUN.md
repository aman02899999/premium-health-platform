# Running the website on Google Cloud Run

Vercel paused the Hobby account on 11 Nov 2026 (Fluid Active CPU, until 11 Dec). The site now has a
second home on Google Cloud Run. The code is the same; only where it runs changes.

**How it works:** every push to `main` triggers `.github/workflows/cloud-run.yml`. It builds the
`Dockerfile` into a container, deploys it to Cloud Run (Tokyo, `asia-northeast1`, the region with
custom domains that is closest to the Supabase database in Seoul), and keeps one Cloud Scheduler job
that calls `/api/cron/tick` every 5 minutes. The tick runs the same jobs listed in `vercel.json` at
the same times.

**What stays the same:** the database (Supabase), the domain, and every webhook URL (Razorpay, Meta,
Resend, YouTube sign-in), because the domain doesn't change.

**What doesn't come along:** Vercel Analytics and Vercel preview links for pull requests.

## Owner steps

Nothing here goes in chat. Paste values only into Google or GitHub screens.

### 1. Google Cloud project with billing (10 min)
1. console.cloud.google.com → choose or create the project (for example `royal-fitness-site`).
2. Billing → link a billing account and add your card.
3. Billing → Budgets & alerts → create a ₹200/month budget with email alerts. (Google can't hard-stop
   spending; the alert is the safety net.)
4. Note the **project ID** from the dashboard.

### 2. Tell GitHub the project ID (1 min)
GitHub repo → Settings → Secrets and variables → Actions → **Variables** tab → New variable:
`GCP_PROJECT_ID` = your project ID.
Until this exists the deploy workflow does nothing, so merging the code changes nothing.

### 3. A deploy key for GitHub (5 min)
1. Google Cloud → IAM & Admin → Service accounts → Create: name `github-deploy`.
2. Give it these roles: Cloud Run Admin, Service Account User, Artifact Registry Administrator,
   Cloud Scheduler Admin, Service Usage Admin.
3. Open it → Keys → Add key → JSON. A file downloads.
4. GitHub → Settings → Secrets and variables → Actions → **Secrets** → New secret `GCP_SA_KEY`, and
   paste the whole file's text. Then delete the downloaded file.

### 4. The settings (about 1–2 hours, the big step)
Vercel won't show secret values again, so each one is collected from where it came from. Write them
as one text, one per line, `NAME=value`, and save it as the GitHub secret **`APP_ENV`**.

| Name | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string → "Transaction pooler" (URI). If you don't know the password: Database → Reset password (nothing else uses it while Vercel is down). |
| `POSTGRES_URL` | Same value as `DATABASE_URL`. |
| `SUPABASE_URL` | `https://trcnjdtbaydmtmdmpxbj.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys (reveal). |
| `SUPABASE_JWT_SECRET` | Supabase → Project Settings → API / JWT Keys → legacy JWT secret. **Keep the same value**: it signs the unsubscribe links already in people's emails. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay → Account & Settings → API Keys. The secret is shown only when generated: press **Regenerate** and copy both. |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Webhooks → edit the site's webhook → set a new secret and save; use the same text here. |
| `RESEND_API_KEY` | Resend → API Keys → Create (sending access). |
| `RESEND_WEBHOOK_SECRET` | Resend → Webhooks → the site's webhook → signing secret. |
| `EMAIL_FROM` | The sender you use, for example `Royal Fitness Club <hello@royalfitnesclub.in>`. |
| `COACH_EMAIL` | The inbox that gets lead/chat alerts. |
| `WHATSAPP_TOKEN` | Meta Business Settings → System users → generate token (whatsapp_business_messaging, whatsapp_business_management). |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp Manager / developers.facebook.com → your app → WhatsApp → API Setup. |
| `META_APP_SECRET`, `INSTAGRAM_APP_SECRET` | developers.facebook.com → your app → App settings → Basic → App secret (and the Instagram app's). |
| `META_VERIFY_TOKEN` | The word you typed when setting up the Meta webhook. If unknown: choose a new one, put it here, and enter the same in the app's Webhooks settings after the move. |
| `INSTAGRAM_ACCESS_TOKEN`, `FACEBOOK_PAGE_TOKEN`, `FACEBOOK_PAGE_ID` | Graph API Explorer / Business Settings. (The Instagram token the site refreshes itself is stored in the database, so this is a fallback.) |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | Google Cloud → APIs & Services → Credentials → the OAuth client (add a new secret if the old one is hidden). |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | New pair is fine (0 members subscribed to notifications on 11 Nov). Claude can generate the public half; you run one command for both. |
| `CRON_SECRET` | The value you saved on 10 Nov, or a new one (then update the GitHub secret `CRON_SECRET` to match). |
| `NEWS_ADMIN_TOKEN` | Any long random text. |
| `DIET_AUTO_SEND` | `no-conditions` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.royalfitnesclub.in` |

### 5. First deploy (Claude does this)
GitHub → Actions → Deploy to Cloud Run → Run workflow. It prints the Google test address
(`https://royal-fitness-site-….a.run.app`). Claude checks the pages there before anything else changes.

### 6. Point the domain (10 min, only after the test address works)
1. Google Cloud → Cloud Run → Manage custom domains → Add mapping → `royalfitnesclub.in` and
   `www.royalfitnesclub.in` (verify the domain with Google if asked).
2. Google shows DNS records. In GoDaddy → DNS, replace **only** the `@` A record(s) and the `www`
   CNAME with what Google shows. **Don't touch MX or TXT records** (email and Resend).
3. HTTPS certificates appear within 15–60 minutes.

## Going back to Vercel later
Point the two DNS records back to Vercel. If both stay live, remove the crons from one of them,
or every daily job runs twice.

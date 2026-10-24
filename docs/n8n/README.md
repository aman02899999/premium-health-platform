# n8n workflows

The website already runs its own automations in `src/lib/growth/`: website leads and lead alerts,
email nurture, WhatsApp templates, Google review requests, renewal reminders, daily posts and reels
(see `vercel.json` for the schedules). n8n workflows here must not repeat any of those, or leads
and members get every message twice.

Nothing in this folder runs by itself. It needs an n8n instance (self-hosted with the official
Docker image, or n8n Cloud). Import a file with **Workflows → Import from file**, add the
credential it asks for, then switch it on.

## Workflows

| File | What it does | Needs |
| --- | --- | --- |
| `site-down-alert.json` | Opens royalfitnesclub.in every 5 minutes and sends one Telegram message when it goes down (no answer or a 5xx) and one when it is back. | A Telegram bot (free, from @BotFather) and `TELEGRAM_CHAT_ID` set in n8n's environment. |

## Free templates that were checked and left out

From [awesome-n8n-templates](https://github.com/enescingoz/awesome-n8n-templates), templates that
need no paid API, with the reason each one is not here:

- **Website leads to Google Sheets with Telegram alert and auto-reply**: the site already saves
  leads and emails the coach about each one (`leads.ts`, `lead-alerts.ts`).
- **Automatic payment reminders from Google Sheets**: renewal reminders already go out on WhatsApp and email from
  the daily run, using the members table.
- **ClientFlow Lite (client onboarding)**: the site already handles new sign-ups (`welcome.ts`).
- **Capture WhatsApp leads / escalating WhatsApp reminders (WAHA)**: these drive WhatsApp Web
  through an unofficial server, which breaks WhatsApp's terms and can get the gym's number banned.
  The site uses the official Meta Cloud API instead.
- **VoiceAgent Lite call logger**: needs a phone-AI provider to post calls to it; the gym has none.
- `devops/disk-space-watchdog`, `docker-compose-controller` and `linux-update-via-webhook` run
  shell commands on the n8n server and must never be imported.

`site-down-alert.json` is adapted from the template's `devops/uptime-ping-alert.json` by
Enes Cingoz, licensed CC BY 4.0. It was translated from Italian and pointed at the gym's site.

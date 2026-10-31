-- Free app notifications (web push) for signed-in gym members.
-- public.push_subscriptions already exists (20261008130000_growth_automation.sql) for /health visitors,
-- with 0 rows on 31 Oct 2026. This adds the columns a member's subscription needs; existing rows and
-- the /health sign-up keep working (email stays null for anonymous visitors).
-- keys stays the browser's { p256dh, auth } object. No message text is stored here.
-- Turning notifications off, or the push service saying the subscription is gone, sets disabled_at:
-- the app never deletes rows.
-- Additive only. To undo: drop the added columns and the index.

alter table public.push_subscriptions
  add column email text check (email is null or (email = lower(email) and char_length(email) between 3 and 254)),
  add column updated_at timestamptz not null default now(),
  add column user_agent text not null default '' check (char_length(user_agent) <= 300),
  add column last_sent_at timestamptz,
  add column last_error text not null default '' check (char_length(last_error) <= 300),
  add column disabled_at timestamptz,
  add column disabled_reason text not null default '' check (disabled_reason in ('', 'member', 'gone'));

create index push_subscriptions_email_idx on public.push_subscriptions (email) where disabled_at is null and email is not null;

-- Still server-only (RLS on, no policies, no grants), as set in the first migration.

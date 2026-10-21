-- Notifications, additive only.
--
-- The bell in the admin shows what happened (WhatsApp messages, leads, payments, hand-offs,
-- failed messages, orders, reviews), built live from the tables that already hold it. Only
-- "what has each person already seen" is stored here.

create table if not exists public.admin_notification_state (
  email text primary key check (char_length(email) between 3 and 200),
  seen_at timestamptz not null default now()
);

alter table public.admin_notification_state enable row level security;
revoke all on public.admin_notification_state from anon, authenticated;

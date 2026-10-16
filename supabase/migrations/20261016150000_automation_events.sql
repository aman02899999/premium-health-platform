-- One row per automation event already sent to Resend (e.g. one "membership.expiring" per member
-- per end date), so running the daily job twice in a day never starts an email series twice.
-- Server-only: row-level security on, no policies.
create table if not exists public.automation_events (
  key text primary key check (char_length(key) <= 200),
  created_at timestamptz not null default now()
);
alter table public.automation_events enable row level security;

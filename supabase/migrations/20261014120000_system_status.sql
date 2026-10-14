-- Small key/value record of background jobs (e.g. the last daily automation run), so the admin
-- can see the schedule actually ran. Server-only: row-level security on, no policies.
create table if not exists public.system_status (
  key text primary key check (char_length(key) <= 60),
  value jsonb not null check (pg_column_size(value) < 8000),
  updated_at timestamptz not null default now()
);
alter table public.system_status enable row level security;

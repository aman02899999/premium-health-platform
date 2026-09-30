-- Royal Fitness Club: site content, trial enquiries, member data, admins, media.
-- Every table has RLS; access rules live here, not in the app.

create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- Single-row document with everything the admin panel edits.
create table public.site_content (
  id smallint primary key default 1 check (id = 1),
  content jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.site_content enable row level security;

-- Free-trial enquiries: anyone may submit, only admins may read or delete.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^[0-9+ -]{10,20}$'),
  goal text not null default '' check (char_length(goal) <= 60),
  message text not null default '' check (char_length(message) <= 600),
  source text not null default 'website' check (char_length(source) <= 40)
);
alter table public.leads enable row level security;
create index leads_created_at_idx on public.leads (created_at desc);

-- Per-member data synced from the Health Hub tools (food log, plan, progress).
create table public.user_data (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (key in ('rfc-plan', 'rfc-food-log', 'rfc-food-target', 'rfc-progress')),
  value jsonb not null check (pg_column_size(value) < 200000),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.user_data enable row level security;

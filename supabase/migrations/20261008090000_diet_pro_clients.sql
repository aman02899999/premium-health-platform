-- Diet Pro: coach-managed client records and coach-added foods.
-- Client health data is personal data (DPDP Act 2023): rows only exist with a recorded
-- consent, and only admins (public.is_admin()) can read, write or delete them.

create table public.diet_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  profile jsonb not null,
  swaps jsonb not null default '{}'::jsonb,
  extras jsonb not null default '{}'::jsonb,
  note text not null default '' check (char_length(note) <= 2000),
  log jsonb not null default '[]'::jsonb,
  consent_at timestamptz not null,
  consent_by text not null check (char_length(consent_by) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text not null default '' check (char_length(updated_by) <= 200),
  constraint diet_clients_profile_size check (pg_column_size(profile) < 20000),
  constraint diet_clients_log_size check (pg_column_size(log) < 200000)
);
alter table public.diet_clients enable row level security;
create index diet_clients_updated_idx on public.diet_clients (updated_at desc);

create policy "admins read diet clients" on public.diet_clients
  for select to authenticated using ((select public.is_admin()));
create policy "admins insert diet clients" on public.diet_clients
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins update diet clients" on public.diet_clients
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete diet clients" on public.diet_clients
  for delete to authenticated using ((select public.is_admin()));

-- Foods added from USDA FoodData Central by the coach (id = "usda-<fdcId>").
create table public.diet_foods (
  id text primary key check (id ~ '^usda-[0-9]{1,10}$'),
  item jsonb not null check (pg_column_size(item) < 4000),
  created_at timestamptz not null default now(),
  created_by text not null default ''
);
alter table public.diet_foods enable row level security;

create policy "admins read diet foods" on public.diet_foods
  for select to authenticated using ((select public.is_admin()));
create policy "admins insert diet foods" on public.diet_foods
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins update diet foods" on public.diet_foods
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins delete diet foods" on public.diet_foods
  for delete to authenticated using ((select public.is_admin()));

revoke all on public.diet_clients, public.diet_foods from anon;

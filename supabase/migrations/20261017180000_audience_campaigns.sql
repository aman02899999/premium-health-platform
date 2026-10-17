-- Marketing audience beyond the live member list: old members and other contacts imported from a
-- sheet (name, mobile, email), and the campaigns sent to the audience. Messages themselves go
-- through message_outbox (dedupe key campaign:<id>:<address>), so opt-outs, retries and the
-- outbox history all apply. Server-only: row-level security on, no policies.
create table if not exists public.audience_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null default '' check (char_length(name) <= 100),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  email text check (email is null or char_length(email) <= 120),
  status text not null default 'past' check (status in ('past', 'current', 'other')),
  tag text not null default '' check (char_length(tag) <= 60),
  check (phone is not null or email is not null)
);
create unique index if not exists audience_contacts_phone_key on public.audience_contacts (phone) where phone is not null;
create unique index if not exists audience_contacts_email_key on public.audience_contacts (lower(email)) where phone is null and email is not null;
alter table public.audience_contacts enable row level security;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text not null default '' check (char_length(created_by) <= 200),
  name text not null check (char_length(name) between 1 and 80),
  segment text not null check (char_length(segment) <= 40),
  channel text not null check (channel in ('whatsapp', 'email')),
  offer text not null check (char_length(offer) between 5 and 160),
  link text not null check (char_length(link) <= 300),
  subject text not null default '' check (char_length(subject) <= 120),
  audience integer not null default 0,
  queued integer not null default 0,
  skipped integer not null default 0,
  -- Recurring campaigns run again on next_run (the daily job), for whoever is newly eligible.
  repeat text not null default 'none' check (repeat in ('none', 'weekly', 'monthly')),
  next_run date,
  active boolean not null default true
);
create index if not exists campaigns_created_idx on public.campaigns (created_at desc);
alter table public.campaigns enable row level security;

-- Social automation: daily Instagram auto-post, and automatic first replies to WhatsApp
-- messages, Instagram DMs and Instagram comments. Server-only tables: row-level security on and
-- no policies, so only the site's direct database connection can read or write them.

-- One row per channel per day: the cron can run any number of times and posts once.
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  channel text not null check (channel in ('instagram')),
  post_date date not null,
  theme text not null default '' check (char_length(theme) <= 80),
  status text not null default 'pending' check (status in ('pending', 'published', 'failed')),
  external_id text check (char_length(external_id) <= 100),
  permalink text check (char_length(permalink) <= 300),
  error text check (char_length(error) <= 300),
  unique (channel, post_date)
);
alter table public.social_posts enable row level security;

-- Every inbound message or comment, keyed by the platform's id (Meta retries webhooks, so the
-- same message can arrive twice; the primary key makes the second copy a no-op).
create table if not exists public.social_inbox (
  id text primary key check (char_length(id) <= 200),
  created_at timestamptz not null default now(),
  channel text not null check (channel in ('whatsapp', 'instagram')),
  kind text not null check (kind in ('message', 'comment')),
  from_id text not null check (char_length(from_id) <= 100),
  from_name text not null default '' check (char_length(from_name) <= 80),
  body text not null default '' check (char_length(body) <= 1000),
  intent text not null default '' check (char_length(intent) <= 20),
  replied boolean not null default false,
  reply_error text check (char_length(reply_error) <= 300),
  lead_id uuid references public.leads (id) on delete set null
);
alter table public.social_inbox enable row level security;
create index if not exists social_inbox_from_idx on public.social_inbox (channel, from_id, created_at desc);
create index if not exists social_inbox_created_idx on public.social_inbox (created_at desc);

-- Long-lived access tokens that the site refreshes itself (Instagram tokens last 60 days).
create table if not exists public.integration_tokens (
  name text primary key check (char_length(name) <= 40),
  value text not null check (char_length(value) <= 1000),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.integration_tokens enable row level security;

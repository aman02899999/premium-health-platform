-- Growth automation: members register (online + desk), renewals, referrals, lead pipeline,
-- paid diet charts, a message outbox, and durable storage for the health site's sign-ups.
--
-- Every table here is server-only: RLS on, no policies, no grants to anon/authenticated.
-- The site reaches them through its direct database connection, after its own admin check.

-- ───────── Members (every paying member, whether they paid online or at the desk) ─────────
create table public.members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null unique check (phone ~ '^[6-9][0-9]{9}$'),
  email text check (email is null or char_length(email) <= 120),
  plan_name text not null check (char_length(plan_name) between 1 and 80),
  start_on date not null,
  expires_on date not null check (expires_on >= start_on),
  source text not null default 'desk' check (source in ('online', 'desk')),
  -- Shared with friends; a paid join that quotes it earns both people bonus days.
  referral_code text not null unique check (referral_code ~ '^[A-Z0-9-]{4,20}$'),
  -- Unguessable token for the one-tap renewal link (/join?renew=...).
  renew_token uuid not null unique default gen_random_uuid(),
  reminders boolean not null default true,
  notes text not null default '' check (char_length(notes) <= 1000)
);
create index members_expires_on_idx on public.members (expires_on);

-- Each paid order extends a membership once (webhook and browser may both report it).
alter table public.membership_orders
  add column member_id uuid references public.members (id) on delete set null,
  add column applied_at timestamptz,
  add column referral_code text check (referral_code is null or referral_code ~ '^[A-Z0-9-]{4,20}$');

-- One reward per referred order; days are added to both memberships when it is created.
create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  referrer_id uuid not null references public.members (id) on delete cascade,
  referred_id uuid not null references public.members (id) on delete cascade,
  order_id uuid not null unique references public.membership_orders (id) on delete cascade,
  referrer_days integer not null check (referrer_days between 0 and 60),
  referred_days integer not null check (referred_days between 0 and 60),
  check (referrer_id <> referred_id)
);

-- ───────── Lead pipeline ─────────
alter table public.leads
  add column status text not null default 'new' check (status in ('new', 'contacted', 'trial', 'joined', 'lost')),
  add column contacted_at timestamptz,
  add column notes text not null default '' check (char_length(notes) <= 1000),
  add column follow_ups boolean not null default true;

-- ───────── Paid personal diet charts ─────────
create table public.diet_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  amount_paise integer not null check (amount_paise > 0),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email text check (email is null or char_length(email) <= 120),
  -- The client's answers (age, sex, height, weight, goal, food preference, conditions...).
  intake jsonb not null check (pg_column_size(intake) < 8000),
  consent_at timestamptz not null,
  paid_at timestamptz,
  -- Coach workflow after payment.
  stage text not null default 'new' check (stage in ('new', 'in_progress', 'sent', 'refunded')),
  diet_client_id uuid references public.diet_clients (id) on delete set null,
  sent_at timestamptz
);
create index diet_orders_created_at_idx on public.diet_orders (created_at desc);

-- ───────── Message outbox ─────────
-- Every automated message is written here first. dedupe_key makes re-runs harmless:
-- the same reminder for the same member and expiry date can only be queued once.
create table public.message_outbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  channel text not null check (channel in ('whatsapp', 'email')),
  to_address text not null check (char_length(to_address) between 5 and 120),
  to_name text not null default '' check (char_length(to_name) <= 80),
  kind text not null check (char_length(kind) <= 40),
  body text not null check (char_length(body) <= 2000),
  template text,
  params jsonb not null default '[]'::jsonb,
  dedupe_key text not null unique check (char_length(dedupe_key) <= 200),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  sent_by text check (sent_by is null or char_length(sent_by) <= 200)
);
create index message_outbox_status_idx on public.message_outbox (status, created_at);

-- ───────── Health site sign-ups (previously kept only in server memory) ─────────
create table public.marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  channel text not null check (channel in ('email', 'whatsapp')),
  address text not null check (char_length(address) between 5 and 120),
  name text check (name is null or char_length(name) <= 100),
  source text check (source is null or char_length(source) <= 100),
  utm_source text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 100),
  consent_at timestamptz not null,
  unsubscribed_at timestamptz,
  unique (channel, address)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  endpoint text not null unique check (char_length(endpoint) <= 1000),
  keys jsonb,
  utm_source text check (utm_source is null or char_length(utm_source) <= 100)
);

create table public.affiliate_clicks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  product_id text not null check (char_length(product_id) <= 100),
  utm_source text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 100)
);
create index affiliate_clicks_created_at_idx on public.affiliate_clicks (created_at desc);

create table public.health_referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  referrer_email text not null check (char_length(referrer_email) <= 120),
  referred_email text not null check (char_length(referred_email) <= 120),
  status text not null default 'pending' check (status in ('pending', 'converted')),
  unique (referrer_email, referred_email),
  check (referrer_email <> referred_email)
);

-- Indexes for the foreign keys (joins and cascading deletes).
create index membership_orders_member_id_idx on public.membership_orders (member_id);
create index referral_rewards_referrer_id_idx on public.referral_rewards (referrer_id);
create index referral_rewards_referred_id_idx on public.referral_rewards (referred_id);
create index diet_orders_diet_client_id_idx on public.diet_orders (diet_client_id);

-- Lock everything down: server connection only.
alter table public.members enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.diet_orders enable row level security;
alter table public.message_outbox enable row level security;
alter table public.marketing_contacts enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.health_referrals enable row level security;
revoke all on public.members, public.referral_rewards, public.diet_orders, public.message_outbox,
  public.marketing_contacts, public.push_subscriptions, public.affiliate_clicks, public.health_referrals
  from anon, authenticated;

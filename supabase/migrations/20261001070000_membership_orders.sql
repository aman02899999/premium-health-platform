-- Online membership purchases (Razorpay). Written only by the server through
-- the database connection (POSTGRES_URL / DATABASE_URL): row-level security is
-- on with no policies, so the browser's publishable key can't read or write it.

create table if not exists public.membership_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  plan_id text not null,
  plan_name text not null,
  duration text not null,
  couple boolean not null default false,
  amount_paise integer not null check (amount_paise > 0),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 10 and 20),
  email text check (email is null or char_length(email) <= 120),
  partner_name text check (partner_name is null or char_length(partner_name) <= 80),
  start_date date,
  referred_by text check (referred_by is null or char_length(referred_by) <= 80),
  paid_at timestamptz
);

create index if not exists membership_orders_created_at_idx on public.membership_orders (created_at desc);

alter table public.membership_orders enable row level security;
revoke all on public.membership_orders from anon, authenticated;

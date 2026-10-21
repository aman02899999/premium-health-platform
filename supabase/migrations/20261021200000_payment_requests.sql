-- Payment requests ("WhatsApp Payments"), additive only.
--
-- From a WhatsApp chat the desk asks for a payment (purpose + amount); the customer gets
-- royalfitnesclub.in/pay/<token>, which opens the site's Razorpay checkout. The row is one more
-- Razorpay order table: the same webhook, verify call, refund and dispute handling and
-- reconciliation apply (src/lib/payments/ledger.ts), and paid requests count in revenue.

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text not null default '' check (char_length(created_by) <= 200),
  token text not null unique check (token ~ '^[A-Za-z0-9]{12,24}$'),
  purpose text not null check (char_length(purpose) between 2 and 120),
  amount_paise integer not null check (amount_paise between 100 and 50000000),
  name text not null default '' check (char_length(name) <= 80),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  email text check (email is null or char_length(email) <= 120),
  status text not null default 'created' check (status in ('created', 'paid', 'cancelled')),
  expires_at timestamptz not null,
  razorpay_order_id text unique check (razorpay_order_id is null or char_length(razorpay_order_id) <= 60),
  razorpay_payment_id text check (razorpay_payment_id is null or char_length(razorpay_payment_id) <= 60),
  paid_at timestamptz,
  refunded_paise integer not null default 0 check (refunded_paise >= 0),
  refunded_at timestamptz,
  disputed_at timestamptz,
  attribution jsonb check (attribution is null or pg_column_size(attribution) < 2000)
);
create index if not exists payment_requests_phone_idx on public.payment_requests (phone, created_at desc);

alter table public.payment_requests enable row level security;

-- Payment reliability (additive only: no existing column, constraint or row changes).
--
-- 1. public.payment_events: every Razorpay webhook delivery we accepted, keyed by
--    Razorpay's X-Razorpay-Event-Id, so a retried delivery is recognised and skipped,
--    and anything we refused to apply (amount mismatch, unknown order) is visible.
-- 2. Refund and dispute columns on the four order tables. The existing status column
--    ('created' | 'paid' | 'failed') keeps its meaning; a refund is recorded beside it,
--    so a partly refunded order is still a paid order with refunded_paise > 0.
--
-- Server-only like the order tables: RLS on, no policies.

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique check (char_length(event_id) between 1 and 100),
  event text not null check (char_length(event) <= 60),
  razorpay_order_id text check (razorpay_order_id is null or char_length(razorpay_order_id) <= 60),
  razorpay_payment_id text check (razorpay_payment_id is null or char_length(razorpay_payment_id) <= 60),
  amount_paise bigint,
  currency text check (currency is null or char_length(currency) <= 10),
  -- received (in progress or failed mid-way) | applied | ignored | unknown_order | amount_mismatch | error
  outcome text not null default 'received' check (outcome in ('received', 'applied', 'ignored', 'unknown_order', 'amount_mismatch', 'error')),
  detail text not null default '' check (char_length(detail) <= 500),
  attempts integer not null default 1,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists payment_events_order_idx on public.payment_events (razorpay_order_id);
create index if not exists payment_events_payment_idx on public.payment_events (razorpay_payment_id);
create index if not exists payment_events_flagged_idx on public.payment_events (received_at desc) where outcome in ('unknown_order', 'amount_mismatch', 'error');

alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;

alter table public.membership_orders
  add column if not exists refunded_paise integer not null default 0 check (refunded_paise >= 0),
  add column if not exists refunded_at timestamptz,
  add column if not exists disputed_at timestamptz;
alter table public.book_orders
  add column if not exists refunded_paise integer not null default 0 check (refunded_paise >= 0),
  add column if not exists refunded_at timestamptz,
  add column if not exists disputed_at timestamptz;
alter table public.diet_orders
  add column if not exists refunded_paise integer not null default 0 check (refunded_paise >= 0),
  add column if not exists refunded_at timestamptz,
  add column if not exists disputed_at timestamptz;
alter table public.shop_orders
  add column if not exists refunded_paise integer not null default 0 check (refunded_paise >= 0),
  add column if not exists refunded_at timestamptz,
  add column if not exists disputed_at timestamptz;

-- Refund and dispute webhooks identify the payment, not the order.
create index if not exists membership_orders_payment_idx on public.membership_orders (razorpay_payment_id);
create index if not exists book_orders_payment_idx on public.book_orders (razorpay_payment_id);
create index if not exists diet_orders_payment_idx on public.diet_orders (razorpay_payment_id);
create index if not exists shop_orders_payment_idx on public.shop_orders (razorpay_payment_id);
-- Reconciliation scans unpaid orders from the last few days.
create index if not exists membership_orders_unpaid_idx on public.membership_orders (created_at) where status <> 'paid';
create index if not exists book_orders_unpaid_idx on public.book_orders (created_at) where status <> 'paid';
create index if not exists diet_orders_unpaid_idx on public.diet_orders (created_at) where status <> 'paid';
create index if not exists shop_orders_unpaid_idx on public.shop_orders (created_at) where status <> 'paid';

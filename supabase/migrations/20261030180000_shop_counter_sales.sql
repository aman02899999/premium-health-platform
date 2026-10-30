-- Royal Supplements: bills for sales made at the gym counter (scanned in admin, paid in cash/UPI/card).
-- No online payment is taken: the bill only records how the customer paid.
-- Server-only like the rest of the store (RLS on, no policies, no grants to anon/authenticated).
-- Additive only. To undo: drop the table and the sequence (and remove 'cancelled-bill' handling in code).

create sequence public.shop_counter_sale_no;

create table public.shop_counter_sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- RB-000001, RB-000002 … one number per bill, never reused.
  number text not null unique check (number ~ '^RB-[0-9]{6,}$'),
  -- Snapshot of what was sold, at what price: [{ productId, name, variant, code, qty, mrp, unitPrice }].
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 100 and pg_column_size(items) < 40000),
  mrp_total integer not null check (mrp_total >= 0),
  -- Items at their selling prices, before the bill discount.
  subtotal integer not null check (subtotal >= 0),
  bill_discount integer not null default 0 check (bill_discount >= 0),
  total integer not null check (total >= 0 and total = subtotal - bill_discount),
  payment text not null check (payment in ('cash', 'upi', 'card', 'other')),
  customer_name text not null default '' check (char_length(customer_name) <= 80),
  customer_phone text not null default '' check (customer_phone = '' or customer_phone ~ '^[6-9][0-9]{9}$'),
  note text not null default '' check (char_length(note) <= 300),
  made_by text not null default '' check (char_length(made_by) <= 120),
  status text not null default 'paid' check (status in ('paid', 'cancelled')),
  cancelled_at timestamptz,
  cancel_reason text not null default '' check (char_length(cancel_reason) <= 300)
);
create index shop_counter_sales_created_idx on public.shop_counter_sales (created_at desc);

alter table public.shop_counter_sales enable row level security;
revoke all on public.shop_counter_sales from anon, authenticated;
revoke all on sequence public.shop_counter_sale_no from anon, authenticated;

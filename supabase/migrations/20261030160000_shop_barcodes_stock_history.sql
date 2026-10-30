-- Royal Supplements: barcodes on products and a history of every stock change.
-- Server-only tables like the rest of the store (RLS on, no policies, no grants to anon/authenticated).
-- Additive only: no existing column or row changes. To undo, drop the trigger, the function and the two tables.

-- One row per code printed on a pack. A product can have several (one per flavour or size, or an
-- old and a new pack). A code belongs to one product only.
create table public.shop_barcodes (
  code text primary key check (char_length(code) between 4 and 200 and code !~ '\s'),
  product_id uuid not null references public.shop_products (id) on delete cascade,
  -- Which flavour / size this code is, when the product has several. Empty = the product itself.
  variant text not null default '' check (char_length(variant) <= 60),
  created_at timestamptz not null default now()
);
create index shop_barcodes_product_idx on public.shop_barcodes (product_id);

-- Written by the trigger below whenever a product's stock changes, so every number can be explained.
create table public.shop_stock_moves (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- Kept when a product is deleted, with its name, so the history survives.
  product_id uuid references public.shop_products (id) on delete set null,
  product_name text not null default '',
  delta integer not null,
  stock_after integer not null,
  reason text not null default 'edit' check (reason in ('stock-in', 'count', 'sold', 'damaged', 'returned', 'online-order', 'edit', 'new-product', 'other')),
  note text not null default '' check (char_length(note) <= 300)
);
create index shop_stock_moves_product_idx on public.shop_stock_moves (product_id, created_at desc);

-- The writer sets the reason for its transaction with set_config('shop.stock_reason', 'stock-in', true)
-- (and optionally 'shop.stock_note'); anything else, like a save in the product form, is an 'edit'.
create or replace function public.shop_log_stock_move() returns trigger
language plpgsql
set search_path = public
as $$
declare
  r text := coalesce(nullif(current_setting('shop.stock_reason', true), ''), case when tg_op = 'INSERT' then 'new-product' else 'edit' end);
  n text := left(coalesce(current_setting('shop.stock_note', true), ''), 300);
  d integer := new.stock - case when tg_op = 'INSERT' then 0 else old.stock end;
begin
  if d <> 0 then
    insert into public.shop_stock_moves (product_id, product_name, delta, stock_after, reason, note)
    values (new.id, new.name, d, new.stock, case when r in ('stock-in', 'count', 'sold', 'damaged', 'returned', 'online-order', 'edit', 'new-product', 'other') then r else 'other' end, n);
  end if;
  return new;
end;
$$;

create trigger shop_products_stock_move
  after insert or update of stock on public.shop_products
  for each row execute function public.shop_log_stock_move();

alter table public.shop_barcodes enable row level security;
alter table public.shop_stock_moves enable row level security;
revoke all on public.shop_barcodes, public.shop_stock_moves from anon, authenticated;
revoke all on function public.shop_log_stock_move() from anon, authenticated;

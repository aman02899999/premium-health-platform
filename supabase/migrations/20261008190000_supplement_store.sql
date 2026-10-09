-- Royal Supplements store: catalogue, combos, orders, blog and settings.
-- Server-only tables (RLS on, no policies, no grants to anon/authenticated): the site reads
-- and writes them through its direct database connection after its own admin/customer checks.
-- Money is stored in whole rupees.

create table public.shop_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (char_length(name) between 2 and 60),
  description text not null default '' check (char_length(description) <= 600),
  -- Store-wide discount for the category, 0–90 %. A product can override it.
  discount_pct integer not null default 0 check (discount_pct between 0 and 90),
  sort integer not null default 0,
  image text check (image is null or char_length(image) <= 500),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.shop_products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null check (char_length(name) between 2 and 120),
  brand text not null default '' check (char_length(brand) <= 60),
  category_id uuid references public.shop_categories (id) on delete set null,
  sku text check (sku is null or char_length(sku) <= 60),
  -- The "real" price shown crossed out.
  list_price integer not null check (list_price between 1 and 1000000),
  -- Overrides the category discount when set.
  discount_pct integer check (discount_pct is null or discount_pct between 0 and 90),
  stock integer not null default 0 check (stock >= 0),
  size text not null default '' check (char_length(size) <= 60),
  flavours text[] not null default '{}',
  images text[] not null default '{}',
  short_description text not null default '' check (char_length(short_description) <= 300),
  description text not null default '' check (char_length(description) <= 20000),
  highlights text[] not null default '{}',
  -- [{ "label": "Protein", "value": "24 g" }, ...] per serving.
  nutrition jsonb not null default '[]'::jsonb check (pg_column_size(nutrition) < 8000),
  how_to_use text not null default '' check (char_length(how_to_use) <= 2000),
  warnings text not null default '' check (char_length(warnings) <= 2000),
  featured boolean not null default false,
  active boolean not null default true,
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170)
);
create index shop_products_category_idx on public.shop_products (category_id);

create table public.shop_combos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  image text check (image is null or char_length(image) <= 500),
  -- [{ "productId": uuid, "qty": 1 }, ...]
  items jsonb not null check (jsonb_typeof(items) = 'array' and pg_column_size(items) < 4000),
  -- Extra discount on top of the products' sale prices.
  extra_pct integer not null default 10 check (extra_pct between 0 and 50),
  featured boolean not null default false,
  active boolean not null default true
);

create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  number text not null unique check (number ~ '^RS-[0-9A-Z]{6,12}$'),
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  fulfilment text not null default 'new' check (fulfilment in ('new', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded')),
  user_id uuid,
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 120),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  -- { line1, line2, city, state, pincode, landmark }
  address jsonb not null check (pg_column_size(address) < 2000),
  -- Snapshot of what was bought, at what price (never re-read from the catalogue).
  items jsonb not null check (jsonb_typeof(items) = 'array' and pg_column_size(items) < 40000),
  list_total integer not null check (list_total >= 0),
  discount_total integer not null check (discount_total >= 0),
  shipping integer not null default 0 check (shipping >= 0),
  total integer not null check (total > 0),
  note text not null default '' check (char_length(note) <= 500),
  courier text not null default '' check (char_length(courier) <= 60),
  tracking text not null default '' check (char_length(tracking) <= 120),
  admin_notes text not null default '' check (char_length(admin_notes) <= 2000),
  paid_at timestamptz,
  stock_applied boolean not null default false
);
create index shop_orders_created_at_idx on public.shop_orders (created_at desc);
create index shop_orders_user_idx on public.shop_orders (user_id);
create index shop_orders_email_idx on public.shop_orders (lower(email));

create table public.shop_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,100}$'),
  title text not null check (char_length(title) between 5 and 140),
  excerpt text not null default '' check (char_length(excerpt) <= 400),
  body text not null check (char_length(body) <= 60000),
  cover text check (cover is null or char_length(cover) <= 500),
  category_slug text check (category_slug is null or char_length(category_slug) <= 60),
  tags text[] not null default '{}',
  published boolean not null default true,
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170)
);

-- One row: store name, banners, contact, shipping rules, licence numbers, order email.
create table public.shop_settings (
  id smallint primary key default 1 check (id = 1),
  settings jsonb not null check (pg_column_size(settings) < 20000),
  updated_at timestamptz not null default now()
);

create index shop_combos_active_idx on public.shop_combos (active);

alter table public.shop_categories enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_combos enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_posts enable row level security;
alter table public.shop_settings enable row level security;
revoke all on public.shop_categories, public.shop_products, public.shop_combos, public.shop_orders, public.shop_posts, public.shop_settings from anon, authenticated;

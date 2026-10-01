-- Premium Library reviews: only verified buyers can review, one review per book per order,
-- and nothing is shown until an admin approves it.

create table if not exists public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_id uuid not null references public.book_orders (id) on delete cascade,
  slug text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 20 and 1500),
  display_name text not null check (char_length(display_name) between 2 and 40),
  city text check (char_length(city) <= 60),
  country text not null check (char_length(country) between 2 and 60),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  unique (order_id, slug)
);

create index if not exists book_reviews_slug_status_idx on public.book_reviews (slug, status);
create index if not exists book_reviews_created_at_idx on public.book_reviews (created_at desc);

-- Server-only, like book_orders: reached through the direct database connection.
alter table public.book_reviews enable row level security;
revoke all on public.book_reviews from anon, authenticated;

-- Premium Library: paid PDF books.
-- PDFs live in the PRIVATE bucket "library" (books/<slug>.pdf). Buyers never get a
-- storage path — the server checks the paid order and issues a 60-second signed URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library', 'library', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Only admins (public.is_admin()) may manage library files; nobody else can read them directly.
create policy "admins read library" on storage.objects
  for select to authenticated using (bucket_id = 'library' and (select public.is_admin()));
create policy "admins upload library" on storage.objects
  for insert to authenticated with check (bucket_id = 'library' and (select public.is_admin()));
create policy "admins update library" on storage.objects
  for update to authenticated using (bucket_id = 'library' and (select public.is_admin()));
create policy "admins delete library" on storage.objects
  for delete to authenticated using (bucket_id = 'library' and (select public.is_admin()));

create table if not exists public.book_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  item_id text not null,
  title text not null,
  slugs text[] not null,
  amount_paise integer not null check (amount_paise > 0),
  name text not null,
  email text not null,
  phone text not null,
  access_token text not null unique,
  downloads jsonb not null default '{}'::jsonb,
  paid_at timestamptz
);

create index if not exists book_orders_created_at_idx on public.book_orders (created_at desc);
create index if not exists book_orders_email_idx on public.book_orders (lower(email));

-- Server-only: reached through the direct database connection, never the public API.
alter table public.book_orders enable row level security;
revoke all on public.book_orders from anon, authenticated;

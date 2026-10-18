-- Verified customer reviews shown on /reviews and the home page. Only a phone number that belongs
-- to a member or a paid diet-plan client can submit one; the admin approves each review before it
-- is shown (to stop spam and abuse, not to hide criticism). Server-only: RLS on, no policies.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  city text not null default '' check (char_length(city) <= 60),
  rating smallint not null check (rating between 1 and 5),
  title text not null default '' check (char_length(title) <= 80),
  body text not null check (char_length(body) between 20 and 1200),
  verified_as text not null check (verified_as in ('member', 'diet-client')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_at timestamptz,
  decided_by text not null default '' check (char_length(decided_by) <= 200)
);
-- One review per customer: a second submission replaces the first and goes back for approval.
create unique index if not exists reviews_phone_key on public.reviews (phone);
create index if not exists reviews_status_created_idx on public.reviews (status, created_at desc);
alter table public.reviews enable row level security;

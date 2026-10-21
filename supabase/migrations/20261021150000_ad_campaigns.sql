-- Ads Manager: one row per ad campaign (additive only).
--
-- The slug is the campaign's tag everywhere: utm_campaign on website links, and "(ad <slug>)"
-- at the end of a Click-to-WhatsApp ad's pre-filled message, which the bot turns into the
-- lead source "ad:<slug>". Results (leads, orders, revenue) are counted from the leads and order
-- tables; spend is typed in by the admin from the ad platform's bill, so it is never estimated.

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null default '' check (char_length(created_by) <= 200),
  name text not null check (char_length(name) between 1 and 80),
  platform text not null check (platform in ('meta', 'google', 'youtube', 'other')),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  landing text not null default '/membership' check (char_length(landing) <= 100),
  start_on date not null,
  end_on date check (end_on is null or end_on >= start_on),
  spend_paise bigint not null default 0 check (spend_paise >= 0),
  notes text not null default '' check (char_length(notes) <= 500),
  active boolean not null default true
);

alter table public.ad_campaigns enable row level security;

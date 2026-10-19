-- Where each lead and order came from (additive only).
--
-- One jsonb column per table, written by the server from the visitor's first-party
-- attribution cookie (src/lib/attribution.ts): first touch and last touch, each with
-- utm_source/medium/campaign/content/term, the referring site's host, the landing
-- path, the time, and a derived channel. No personal data, no click ids' contents
-- beyond presence. Null for rows created before this migration or without the cookie:
-- reports show those as "unknown", never guessed.

alter table public.leads add column if not exists attribution jsonb check (attribution is null or pg_column_size(attribution) < 2000);
alter table public.membership_orders add column if not exists attribution jsonb check (attribution is null or pg_column_size(attribution) < 2000);
alter table public.book_orders add column if not exists attribution jsonb check (attribution is null or pg_column_size(attribution) < 2000);
alter table public.diet_orders add column if not exists attribution jsonb check (attribution is null or pg_column_size(attribution) < 2000);
alter table public.shop_orders add column if not exists attribution jsonb check (attribution is null or pg_column_size(attribution) < 2000);

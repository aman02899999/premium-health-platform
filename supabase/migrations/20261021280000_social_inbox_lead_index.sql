-- Performance, additive only: the foreign key social_inbox.lead_id had no index (Supabase
-- performance advisor), so deleting or looking up a lead's messages scanned the whole inbox.
create index if not exists social_inbox_lead_id_idx on public.social_inbox (lead_id);

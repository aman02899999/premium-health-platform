-- Archive instead of delete. Additive only.
--
-- "Delete" on a member or a website enquiry used to erase the row (and a member's referral
-- rewards with it). Now the row moves here first, in one transaction, together with what was
-- linked to it, so it can be put back. Nothing in the app reads this table for messages, so an
-- archived person can't be messaged by mistake. RLS is on with no policies: only the server
-- (service role) reads it.
--
-- Put one back (SQL editor), for example a member:
--   insert into public.members select * from jsonb_populate_record(null::public.members, data)
--     from public.archived_records where id = '<archive id>';
--   then re-link their orders / referral rewards from the "links" column.
create table if not exists public.archived_records (
  id uuid primary key default gen_random_uuid(),
  archived_at timestamptz not null default now(),
  archived_by text not null default '' check (char_length(archived_by) <= 200),
  kind text not null check (kind in ('member', 'lead')),
  original_id uuid not null,
  data jsonb not null,
  links jsonb not null default '{}'::jsonb
);
alter table public.archived_records enable row level security;
create index if not exists archived_records_kind_idx on public.archived_records (kind, original_id);

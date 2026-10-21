-- Call list, additive only.
--
-- The desk's calls to people who replied to an offer or clicked its link: who was called, by
-- whom, and what happened. Interested people become leads; "no answer" brings them back the
-- next day (up to three tries); anything else takes them off the list.

create table if not exists public.prospect_calls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- An Indian mobile (10 digits), or the email address when that's all we have.
  contact text not null check (char_length(contact) between 5 and 120),
  outcome text not null check (outcome in ('interested', 'not-interested', 'no-answer')),
  note text not null default '' check (char_length(note) <= 300),
  by_user text not null default '' check (char_length(by_user) <= 200)
);
create index if not exists prospect_calls_contact_idx on public.prospect_calls (contact, created_at desc);

alter table public.prospect_calls enable row level security;
revoke all on public.prospect_calls from anon, authenticated;

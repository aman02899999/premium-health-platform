-- The YouTube Short queue (src/lib/youtube/queue.ts): Shorts written outside the hand-checked bank,
-- such as the weekly answer to a viewer's comment question. Each item is a draft until the owner
-- taps Approve in Admin; approved items go out in the midday Short slot, one a day. seq gives
-- each item its own music. Additive only: nothing existing changes.
create table if not exists public.youtube_queue (
  id uuid primary key default gen_random_uuid(),
  seq bigserial not null,
  kind text not null check (kind in ('answer', 'trend')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  source_ref text not null check (char_length(source_ref) <= 200),
  source_text text not null default '' check (char_length(source_text) <= 1000),
  draft jsonb,
  note text not null default '' check (char_length(note) <= 500),
  reply_id text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text
);
create unique index if not exists youtube_queue_source on public.youtube_queue (kind, source_ref);
create index if not exists youtube_queue_status on public.youtube_queue (status, created_at);
alter table public.youtube_queue enable row level security;
-- No policies: only the server (service role / direct connection) reads or writes it.

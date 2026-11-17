-- YouTube growth job (src/lib/youtube/engagement.ts): remembers what it already did on the channel,
-- so a comment, playlist or description link is never posted twice. Keys look like
-- "playlist:<topic>", "pl:<topic>:<videoId>", "comment:<videoId>", "desc:<videoId>"; ref holds the
-- YouTube id it made (playlist, comment) or a note ("disabled", "skipped"). Additive only.
create table if not exists public.youtube_actions (
  key text primary key check (char_length(key) <= 120),
  ref text not null default '' check (char_length(ref) <= 200),
  created_at timestamptz not null default now()
);
alter table public.youtube_actions enable row level security;
-- No policies: only the server (service role / direct connection) reads or writes it.

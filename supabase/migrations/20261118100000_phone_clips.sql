-- The owner's phone clips (src/lib/youtube/clips.ts): uploaded in Admin with a hook and captions,
-- rendered on the GitHub runner with captions, original music and the end card, then posted as a
-- YouTube Short (and an Instagram / Facebook Reel when those are connected). consent must be true:
-- the owner confirms it's their own recording and everyone in it agreed. Additive only.
create table if not exists public.phone_clips (
  id uuid primary key default gen_random_uuid(),
  seq bigserial not null,
  status text not null default 'uploading' check (status in ('uploading', 'ready', 'pending', 'published', 'failed', 'cancelled')),
  source_path text not null check (char_length(source_path) <= 200),
  hook text not null check (char_length(hook) <= 100),
  captions jsonb not null default '[]'::jsonb,
  medical boolean not null default false,
  consent boolean not null check (consent),
  final_path text,
  youtube_id text,
  youtube_url text,
  reel_status text,
  reel_permalink text,
  error text,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index if not exists phone_clips_status on public.phone_clips (status, created_at);
alter table public.phone_clips enable row level security;
-- No policies: only the server (service role / direct connection) reads or writes it.

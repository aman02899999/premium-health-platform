-- Per-customer settings for the admin WhatsApp chat: the coach's private notes, and a pause on
-- auto-replies so the bot never talks over the coach. The coach's own reply pauses the bot for
-- 2 hours; the pause button sets it far ahead. Server-only: row-level security on, no policies.
create table if not exists public.chat_contacts (
  peer text primary key check (peer ~ '^\d{8,20}$'),
  notes text not null default '' check (char_length(notes) <= 2000),
  bot_paused_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.chat_contacts enable row level security;

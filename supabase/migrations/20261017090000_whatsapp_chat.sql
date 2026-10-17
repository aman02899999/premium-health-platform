-- WhatsApp chat in /admin: the coach replies to customers from the website once the gym's number
-- runs on the WhatsApp API (the phone app can't be used on the same number).
--   social_inbox  gains the photo / voice note / document a customer sent (Meta media id; the
--                 file itself is fetched through the admin route only when the coach opens it).
--   chat_replies  everything the site sends inside a conversation: auto-replies and the coach's
--                 own messages. Scheduled template messages stay in message_outbox.

alter table public.social_inbox add column if not exists media_type text check (media_type is null or char_length(media_type) <= 20);
alter table public.social_inbox add column if not exists media_id text check (media_id is null or char_length(media_id) <= 100);

create table if not exists public.chat_replies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'instagram', 'facebook')),
  to_id text not null check (char_length(to_id) between 1 and 100),
  kind text not null default 'text' check (kind in ('text', 'document')),
  body text not null check (char_length(body) <= 4000),
  sent_by text not null default 'auto-reply' check (char_length(sent_by) <= 200),
  ok boolean not null default false,
  error text check (error is null or char_length(error) <= 300),
  external_id text check (external_id is null or char_length(external_id) <= 200)
);

create index if not exists chat_replies_peer_idx on public.chat_replies (channel, to_id, created_at desc);
create index if not exists social_inbox_peer_idx on public.social_inbox (channel, from_id, created_at desc);

-- Server-side only (the site connects as the database owner); no client access.
alter table public.chat_replies enable row level security;

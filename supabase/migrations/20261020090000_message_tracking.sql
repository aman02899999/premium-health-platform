-- What happened to each message after it left (additive only).
--
-- WhatsApp: Meta's status webhooks (sent / delivered / read / failed, with the error code).
-- Email: Resend's webhooks (delivered / bounced / complained / opened / clicked).
-- Links: campaign links go through /r/<code>, which counts the click and redirects.
-- The provider's own message id is kept so a status can be matched to its message.

alter table public.message_outbox add column if not exists provider_id text check (provider_id is null or char_length(provider_id) <= 200);
alter table public.message_outbox add column if not exists delivery text check (delivery is null or delivery in ('delivered', 'read', 'failed', 'bounced', 'complained'));
alter table public.message_outbox add column if not exists delivered_at timestamptz;
alter table public.message_outbox add column if not exists read_at timestamptz;
alter table public.message_outbox add column if not exists failed_at timestamptz;
alter table public.message_outbox add column if not exists fail_code text check (fail_code is null or char_length(fail_code) <= 40);
alter table public.message_outbox add column if not exists fail_reason text check (fail_reason is null or char_length(fail_reason) <= 300);
alter table public.message_outbox add column if not exists link_code text check (link_code is null or link_code ~ '^[A-Za-z0-9]{6,16}$');
alter table public.message_outbox add column if not exists link_url text check (link_url is null or char_length(link_url) <= 1000);
alter table public.message_outbox add column if not exists clicks integer not null default 0;
alter table public.message_outbox add column if not exists first_click_at timestamptz;

create index if not exists message_outbox_provider_idx on public.message_outbox (provider_id) where provider_id is not null;
create unique index if not exists message_outbox_link_code_idx on public.message_outbox (link_code) where link_code is not null;
create index if not exists message_outbox_to_sent_idx on public.message_outbox (to_address, sent_at desc) where status = 'sent';

-- Every status and click, in order, for the admin's message history.
create table if not exists public.message_events (
  id bigint generated always as identity primary key,
  outbox_id uuid not null references public.message_outbox (id) on delete cascade,
  event text not null check (event in ('delivered', 'read', 'failed', 'bounced', 'complained', 'opened', 'clicked')),
  at timestamptz not null default now(),
  detail jsonb check (detail is null or pg_column_size(detail) < 2000)
);
create index if not exists message_events_outbox_idx on public.message_events (outbox_id, at);

-- Numbers WhatsApp reports as unable to receive messages (not on WhatsApp, or Meta keeps
-- rejecting them). Campaigns skip them, so nobody pays for messages that can't arrive.
create table if not exists public.whatsapp_unreachable (
  phone text primary key check (phone ~ '^[0-9]{8,15}$'),
  code text not null check (char_length(code) <= 40),
  reason text not null default '' check (char_length(reason) <= 300),
  failures integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.message_events enable row level security;
alter table public.whatsapp_unreachable enable row level security;

-- WhatsApp voice-call webhook events (field "calls"), one row per call id and event, with the raw
-- payload: kept so the shape can be checked against a real call before the follow-up is switched
-- on (CALL_FOLLOWUP=on). The follow-ups themselves are rows in message_outbox (kind call-followup).
-- Server-only: row-level security on, no policies.
create table if not exists public.whatsapp_calls (
  id text not null check (char_length(id) <= 200),
  event text not null default '',
  from_id text not null,
  status text not null default '',
  direction text not null default '',
  payload jsonb,
  created_at timestamptz not null default now(),
  primary key (id, event)
);
create index if not exists whatsapp_calls_from_idx on public.whatsapp_calls (from_id, created_at desc);
alter table public.whatsapp_calls enable row level security;

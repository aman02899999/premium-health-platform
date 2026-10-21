-- AI Agent, additive only.
--
-- One settings row (mode, model, daily cap, extra knowledge the desk writes) and a log of every
-- answer the agent wrote: what was asked, what it said, whether it handed the chat to a person,
-- and the tokens it used, so the desk can read it back and the owner can see the cost.

create table if not exists public.ai_agent_settings (
  id smallint primary key default 1 check (id = 1),
  settings jsonb not null check (pg_column_size(settings) < 20000),
  updated_at timestamptz not null default now(),
  updated_by text not null default '' check (char_length(updated_by) <= 200)
);

create table if not exists public.ai_agent_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- auto: answered a customer on WhatsApp; draft: suggested a reply in Live chat; test: the admin playground.
  source text not null check (source in ('auto', 'draft', 'test')),
  peer text check (peer is null or peer ~ '^[0-9]{6,20}$'),
  inbox_id text check (inbox_id is null or char_length(inbox_id) <= 200),
  question text not null check (char_length(question) <= 1000),
  answer text not null default '' check (char_length(answer) <= 2000),
  handoff boolean not null default false,
  reason text not null default '' check (char_length(reason) <= 200),
  sent boolean not null default false,
  model text not null default '' check (char_length(model) <= 60),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_tokens integer not null default 0 check (cached_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  error text check (error is null or char_length(error) <= 300),
  by_user text not null default '' check (char_length(by_user) <= 200)
);
create index if not exists ai_agent_log_created_idx on public.ai_agent_log (created_at desc);
create index if not exists ai_agent_log_peer_idx on public.ai_agent_log (peer, created_at desc);

alter table public.ai_agent_settings enable row level security;
alter table public.ai_agent_log enable row level security;
revoke all on public.ai_agent_settings, public.ai_agent_log from anon, authenticated;

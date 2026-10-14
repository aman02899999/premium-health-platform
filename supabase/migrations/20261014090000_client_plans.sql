-- Client plan dashboard: a paid diet order becomes an entitlement the client sees after signing in
-- (matched by the verified email of their account), with a number of plan updates set by the
-- package. Every plan built for the order is kept as a version. Server-only tables: row-level
-- security on and no policies, so only the site's direct database connection can touch them.

alter table public.diet_orders
  -- The signed-in account that claimed this order (set the first time its email signs in).
  add column if not exists user_id uuid,
  -- Admin adjustments: extra plan updates on top of the package, a different end date, or no access.
  add column if not exists extra_generations integer not null default 0 check (extra_generations between -50 and 50),
  add column if not exists access_until date,
  add column if not exists revoked_at timestamptz;
create index if not exists diet_orders_email_idx on public.diet_orders (lower(email));
create index if not exists diet_orders_user_idx on public.diet_orders (user_id);

create table if not exists public.client_plan_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_id uuid not null references public.diet_orders (id) on delete cascade,
  -- 1 = the plan built at checkout; each update the client (or coach) asks for adds one.
  version integer not null check (version between 1 and 200),
  source text not null check (source in ('checkout', 'client', 'coach')),
  -- draft: waiting for the coach (health condition or medicines); sent: visible to the client.
  status text not null default 'draft' check (status in ('draft', 'sent', 'rejected')),
  plan_path text not null check (char_length(plan_path) <= 300),
  -- The answers this version was built from (weight, waist, conditions on that day).
  intake jsonb not null check (pg_column_size(intake) < 8000),
  note text not null default '' check (char_length(note) <= 600),
  sent_at timestamptz,
  unique (order_id, version)
);
alter table public.client_plan_versions enable row level security;
create index if not exists client_plan_versions_order_idx on public.client_plan_versions (order_id, version desc);

-- Plans already built before this migration become version 1.
insert into public.client_plan_versions (order_id, version, source, status, plan_path, intake, sent_at, created_at)
select o.id, 1, 'checkout', case when o.stage = 'sent' then 'sent' else 'draft' end, o.plan_path, o.intake, o.sent_at, coalesce(o.plan_generated_at, o.paid_at, o.created_at)
  from public.diet_orders o
 where o.status = 'paid' and o.plan_path is not null
on conflict (order_id, version) do nothing;

-- Facebook Page joins WhatsApp and Instagram in the social automation.
alter table public.social_inbox drop constraint if exists social_inbox_channel_check;
alter table public.social_inbox add constraint social_inbox_channel_check check (channel in ('whatsapp', 'instagram', 'facebook'));
alter table public.social_posts drop constraint if exists social_posts_channel_check;
alter table public.social_posts add constraint social_posts_channel_check check (channel in ('instagram', 'facebook'));

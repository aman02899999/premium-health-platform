-- Sales automation: WhatsApp pre-chat leads with email + interest, marketing-email consent,
-- diet plan packages, an auto-generated draft plan per paid order, and email attachments.
-- Additive only; safe to run on the live database.

-- ───────── Leads: who they are and what they asked about ─────────
alter table public.leads
  add column if not exists email text check (email is null or char_length(email) <= 120),
  add column if not exists interest text not null default '' check (interest in ('', 'diet', 'pt', 'membership', 'other')),
  -- Set only when the visitor ticked "email me plans, tips & offers".
  add column if not exists marketing_consent_at timestamptz;
create index if not exists leads_email_idx on public.leads (lower(email)) where email is not null;

-- ───────── Diet orders: the package bought and the generated plan ─────────
alter table public.diet_orders
  add column if not exists plan text not null default 'starter' check (plan ~ '^[a-z0-9-]{2,20}$'),
  -- Path of the plan PDF in the private "diet-plans" storage bucket.
  add column if not exists plan_path text check (plan_path is null or char_length(plan_path) <= 200),
  add column if not exists plan_generated_at timestamptz;
alter table public.diet_orders drop constraint if exists diet_orders_stage_check;
alter table public.diet_orders add constraint diet_orders_stage_check check (stage in ('new', 'draft_ready', 'in_progress', 'sent', 'refunded'));

-- ───────── Outbox: email subject, attachment, longer bodies ─────────
alter table public.message_outbox
  add column if not exists subject text check (subject is null or char_length(subject) <= 200),
  -- Storage path of a file to attach (email) or link as a document header (WhatsApp).
  add column if not exists attachment text check (attachment is null or char_length(attachment) <= 200);
alter table public.message_outbox drop constraint if exists message_outbox_body_check;
alter table public.message_outbox add constraint message_outbox_body_check check (char_length(body) <= 6000);

-- ───────── Private bucket for plan PDFs (served only through signed links) ─────────
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') and exists (select 1 from pg_tables where schemaname = 'storage' and tablename = 'buckets') then
    insert into storage.buckets (id, name, public) values ('diet-plans', 'diet-plans', false) on conflict (id) do nothing;
  end if;
end $$;

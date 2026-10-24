-- Messaging hardening (rebuild Phase 2). Additive, plus one policy removed.

-- 1. Email addresses that must never get another marketing email: hard bounces and spam
--    complaints. Until now a bounce only unsubscribed an address that already had a
--    marketing_contacts row, and imported contacts have none, so on 24 Oct 54 bounced addresses
--    were still eligible for the next campaign. The outbox checks this table before every
--    marketing email; receipts and plans still go out.
create table if not exists public.email_suppressions (
  address text primary key check (address = lower(address) and char_length(address) between 3 and 200),
  reason text not null check (reason in ('bounced', 'complained')),
  detail text not null default '' check (char_length(detail) <= 300),
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
revoke all on public.email_suppressions from anon, authenticated;

-- Backfill from what the Resend webhook already recorded. Full inboxes and "general" bounces may
-- clear, so only hard bounces and complaints are suppressed.
insert into public.email_suppressions (address, reason, detail)
select distinct on (lower(to_address)) lower(to_address), case when delivery = 'complained' then 'complained' else 'bounced' end, left(coalesce(fail_reason, ''), 300)
  from public.message_outbox
 where channel = 'email'
   and (delivery = 'complained' or (delivery = 'bounced' and fail_reason ilike '%hard bounce%'))
 order by lower(to_address), failed_at desc nulls last
on conflict (address) do nothing;

-- 2. Leads are inserted only by the server (/api/leads and /health/api/lead, using the server
--    connection). The public "anyone can submit a lead" policy let anyone holding the public
--    Supabase key add leads directly, skipping the form's checks, and those leads then got the
--    automatic WhatsApp follow-ups.
drop policy if exists "anyone can submit a lead" on public.leads;

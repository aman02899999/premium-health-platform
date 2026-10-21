-- Team & Agents (additive only).
--
-- Every existing admin becomes an owner, so nobody loses access. Roles:
--   owner    everything, including adding and removing team members
--   manager  everything except the team page
--   agent    the desk's daily work: chats, contacts, leads/members/today, QR codes
-- The role is enforced where every admin request passes (src/proxy.ts), not page by page.
-- A WhatsApp chat can be assigned to one team member, who sees it under "Mine".

alter table public.admins add column if not exists name text not null default '' check (char_length(name) <= 80);
alter table public.admins add column if not exists role text not null default 'owner' check (role in ('owner', 'manager', 'agent'));
alter table public.admins add column if not exists added_by text not null default '' check (char_length(added_by) <= 200);

alter table public.chat_contacts add column if not exists assigned_to text check (assigned_to is null or (assigned_to = lower(assigned_to) and char_length(assigned_to) <= 120));
alter table public.chat_contacts add column if not exists assigned_at timestamptz;
create index if not exists chat_contacts_assigned_idx on public.chat_contacts (assigned_to) where assigned_to is not null;

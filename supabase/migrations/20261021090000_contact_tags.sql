-- Contacts: tags and attributes for everyone the gym knows (additive only).
--
-- A person is keyed by their 10-digit Indian mobile, or by lowercase email when there is no
-- mobile, the same key campaigns use to send each person one message. Members, leads, imported
-- lists, WhatsApp chats, subscribers and buyers stay in their own tables; these two tables only
-- add labels on top.
--   contact_tags        lists: a tag is also a campaign audience ("tag:<name>")
--   contact_attributes  user attributes: goal, preferred time, area, …

create table if not exists public.contact_tags (
  contact_key text not null check (contact_key ~ '^[6-9][0-9]{9}$' or (contact_key ~ '^[^@\s]+@[^@\s]+$' and char_length(contact_key) <= 120)),
  tag text not null check (tag ~ '^[a-z0-9][a-z0-9 _-]{0,29}$'),
  created_at timestamptz not null default now(),
  created_by text not null default '' check (char_length(created_by) <= 200),
  primary key (contact_key, tag)
);
create index if not exists contact_tags_tag_idx on public.contact_tags (tag);

create table if not exists public.contact_attributes (
  contact_key text not null check (contact_key ~ '^[6-9][0-9]{9}$' or (contact_key ~ '^[^@\s]+@[^@\s]+$' and char_length(contact_key) <= 120)),
  name text not null check (name ~ '^[a-z][a-z0-9_]{0,29}$'),
  value text not null check (char_length(value) between 1 and 200),
  updated_at timestamptz not null default now(),
  primary key (contact_key, name)
);

alter table public.contact_tags enable row level security;
alter table public.contact_attributes enable row level security;

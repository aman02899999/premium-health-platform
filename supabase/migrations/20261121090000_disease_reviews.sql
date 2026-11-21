-- Medical review of the Gemini disease-page drafts (src/health/data/disease-drafts.generated.json).
-- A draft reaches the public page and Google only while it has an 'approved' row here whose
-- draft_hash matches the bundled draft: if the draft text changes later, the approval no longer
-- applies and the page falls back to the old noindex template until it is reviewed again.
-- Also adds the 'reviewer' admin role (a doctor who can open only the review area). Additive only.
create table if not exists public.disease_reviews (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,80}$'),
  status text not null check (status in ('approved', 'changes')),
  draft_hash text not null check (char_length(draft_hash) = 64),
  reviewer_name text not null default '' check (char_length(reviewer_name) <= 80),
  reviewer_qualification text not null default '' check (char_length(reviewer_qualification) <= 80),
  reviewer_registration text not null default '' check (char_length(reviewer_registration) <= 60),
  note text not null default '' check (char_length(note) <= 2000),
  reviewed_by text not null default '' check (char_length(reviewed_by) <= 200),
  reviewed_at timestamptz not null default now()
);
alter table public.disease_reviews enable row level security;
-- No policies: only the server (service role / direct connection) reads or writes it.

-- Every decision is kept, including withdrawn approvals (never deleted).
create table if not exists public.disease_review_log (
  id bigserial primary key,
  slug text not null,
  action text not null check (action in ('approved', 'changes', 'withdrawn')),
  draft_hash text not null default '',
  reviewer_name text not null default '',
  note text not null default '',
  reviewed_by text not null default '',
  at timestamptz not null default now()
);
create index if not exists disease_review_log_slug on public.disease_review_log (slug, at desc);
alter table public.disease_review_log enable row level security;

alter table public.admins drop constraint if exists admins_role_check;
alter table public.admins add constraint admins_role_check check (role in ('owner', 'manager', 'agent', 'reviewer'));

-- Blood report analyser. Additive only.
--
-- Health data is "sensitive personal data": the server encrypts each saved report (AES-256-GCM,
-- key LAB_DATA_KEY in Vercel) before it reaches this table, so the database never holds the
-- values in plain text. Uploaded PDFs are never stored. Every admin look at a member's reports
-- is written to lab_access_log. RLS is on with no policies: only the server (service role)
-- reads these tables.

-- Who may use the analyser (the owner grants it to gym members and diet clients).
create table if not exists public.lab_access (
  email text primary key check (email = lower(email) and char_length(email) between 3 and 120),
  granted_at timestamptz not null default now(),
  granted_by text not null default '' check (char_length(granted_by) <= 200),
  expires_on date,
  note text not null default '' check (char_length(note) <= 300),
  revoked_at timestamptz,
  revoked_by text not null default '' check (char_length(revoked_by) <= 200)
);

-- Reports a member chose to keep. payload = base64(iv | tag | ciphertext) of the typed values,
-- sex and age. Hidden after expires_at; the member can delete any of them at any time.
create table if not exists public.lab_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '12 months',
  email text not null check (email = lower(email) and char_length(email) between 3 and 120),
  source text not null default 'typed' check (source in ('typed', 'pdf')),
  label text not null default '' check (char_length(label) <= 80),
  payload text not null check (char_length(payload) < 60000),
  key_version smallint not null default 1,
  consent_at timestamptz not null,
  consent_version text not null check (char_length(consent_version) <= 20)
);
create index if not exists lab_reports_email_idx on public.lab_reports (email, created_at desc);

-- Every admin action on the analyser: access grants, marker edits, and any look at a member's reports.
create table if not exists public.lab_access_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  admin text not null check (char_length(admin) <= 200),
  action text not null check (action in ('grant', 'revoke', 'view-reports', 'edit-marker', 'reset-marker')),
  subject text not null default '' check (char_length(subject) <= 200),
  reason text not null default '' check (char_length(reason) <= 300)
);
create index if not exists lab_access_log_at_idx on public.lab_access_log (at desc);

-- Admin edits on top of the marker library in code (names, synonyms, ranges, text, hidden).
create table if not exists public.lab_marker_overrides (
  marker_id text primary key check (marker_id ~ '^[a-z0-9-]{1,60}$'),
  data jsonb not null check (pg_column_size(data) < 20000),
  updated_at timestamptz not null default now(),
  updated_by text not null default '' check (char_length(updated_by) <= 200)
);

-- How many analyses run a day (counts only, nothing about the person).
create table if not exists public.lab_usage_daily (
  day date primary key,
  analyses integer not null default 0,
  saved integer not null default 0
);

alter table public.lab_access enable row level security;
alter table public.lab_reports enable row level security;
alter table public.lab_access_log enable row level security;
alter table public.lab_marker_overrides enable row level security;
alter table public.lab_usage_daily enable row level security;

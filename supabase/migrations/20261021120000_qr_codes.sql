-- QR codes with scan tracking (additive only).
--
-- Each printed QR points at /q/<code>, which counts the scan and redirects. The destination is
-- checked when the QR is made (this site, the gym's own WhatsApp numbers, or its Google review
-- link) and again on every scan, so a printed code can never be pointed somewhere else.

create table if not exists public.qr_codes (
  code text primary key check (code ~ '^[A-Za-z0-9]{6,12}$'),
  created_at timestamptz not null default now(),
  created_by text not null default '' check (char_length(created_by) <= 200),
  label text not null check (char_length(label) between 1 and 60),
  kind text not null check (kind in ('bot', 'desk', 'optin', 'page', 'review')),
  target text not null check (char_length(target) <= 1000),
  scans integer not null default 0,
  last_scan_at timestamptz,
  active boolean not null default true
);

create table if not exists public.qr_scans (
  id bigint generated always as identity primary key,
  code text not null references public.qr_codes (code) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists qr_scans_code_at_idx on public.qr_scans (code, at);

alter table public.qr_codes enable row level security;
alter table public.qr_scans enable row level security;

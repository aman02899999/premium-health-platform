-- Royal Knowledge Challenge (/challenge): monthly fitness quiz with levels, certificates, a
-- leaderboard and capped prizes collected at the gym. Additive only. Every table is server-only:
-- RLS on, no policies, so the browser can never read answers, other people's data or prizes.

-- One row per player: what the leaderboard, the prize desk and the sales follow-up need.
create table if not exists public.challenge_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (char_length(email) <= 200),
  first_name text not null check (char_length(first_name) between 2 and 40),
  last_initial text not null default '' check (char_length(last_initial) <= 1),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  area text not null check (area in ('ncr', 'outside')),
  leaderboard boolean not null default false,
  contact_consent boolean not null default false,
  last_lead_month text,
  -- Referral: the player's own code, and who referred them (set once, when the profile is created).
  referral_code text not null unique check (referral_code ~ '^[A-Z0-9]{6,10}$'),
  referred_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (referred_by is null or referred_by <> user_id)
);
-- One account per mobile number: stops one person playing (and referring) with many accounts.
create unique index if not exists challenge_profiles_phone on public.challenge_profiles (phone);
alter table public.challenge_profiles enable row level security;

-- A referral earns the referrer one retry once the friend (new account, own number) finishes a
-- Beginner quiz from a different network, up to the monthly cap.
create table if not exists public.challenge_referrals (
  referred_user uuid primary key references auth.users (id) on delete cascade,
  referrer uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'qualified', 'rejected-network', 'capped')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  check (referrer <> referred_user)
);
create index if not exists challenge_referrals_referrer on public.challenge_referrals (referrer, status);
alter table public.challenge_referrals enable row level security;

-- Admin approval of the built-in questions (src/lib/challenge/bank-data.ts). Only approved
-- questions whose hash still matches the wording are ever served.
create table if not exists public.challenge_question_reviews (
  question_id text primary key check (question_id ~ '^[a-z][0-9]{3}$'),
  status text not null check (status in ('approved', 'retired')),
  hash text not null check (char_length(hash) = 64),
  reviewed_by text not null default '' check (char_length(reviewed_by) <= 200),
  reviewed_at timestamptz not null default now()
);
alter table public.challenge_question_reviews enable row level security;

-- Questions an admin writes in the admin. Live as soon as they are saved; retired, never deleted.
create sequence if not exists public.challenge_custom_seq;
create table if not exists public.challenge_custom_questions (
  id text primary key default ('c' || lpad(nextval('public.challenge_custom_seq')::text, 4, '0')),
  level text not null check (level in ('beginner', 'intermediate', 'advance')),
  topic text not null default '' check (char_length(topic) <= 40),
  prompt text not null check (char_length(prompt) between 10 and 300),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer smallint not null check (answer between 0 and 3),
  why text not null default '' check (char_length(why) <= 300),
  source text not null default '' check (char_length(source) <= 200),
  created_by text not null default '',
  created_at timestamptz not null default now(),
  retired_at timestamptz
);
alter table public.challenge_custom_questions enable row level security;

-- Attempts. A level can be taken again 30 days after the last attempt started, or sooner with a
-- referral retry (via = 'retry'). `month` (India time) groups attempts for the leaderboard and
-- prizes. `state` holds the drawn questions, the shuffled option order and the answers; it is
-- never sent to the browser as is.
create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level text not null check (level in ('beginner', 'intermediate', 'advance')),
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  state jsonb not null,
  correct smallint,
  total_ms integer,
  tab_switches integer not null default 0,
  ip_hash text not null default '',
  certificate_code text unique,
  created_at timestamptz not null default now(),
  via text not null default 'free' check (via in ('free', 'retry')),
  finished_at timestamptz
);
-- At most one unfinished attempt per player, so a double-click or two tabs can't start two.
create unique index if not exists challenge_attempts_one_open on public.challenge_attempts (user_id) where finished_at is null;
create index if not exists challenge_attempts_user_level on public.challenge_attempts (user_id, level, created_at desc);
create index if not exists challenge_attempts_board on public.challenge_attempts (month, level, correct desc, total_ms) where finished_at is not null;
create index if not exists challenge_attempts_ip on public.challenge_attempts (ip_hash, created_at);
alter table public.challenge_attempts enable row level security;

-- Prizes handed out when a month is finalised. Voided, never deleted.
create table if not exists public.challenge_prizes (
  id bigserial primary key,
  month text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid not null references public.challenge_attempts (id),
  prize text not null check (prize in ('gym-3m', 'gym-1m', 'gym-15d', 'diet-1m', 'pass-7d', 'pass-3d')),
  claim_code text not null unique,
  status text not null default 'won' check (status in ('won', 'redeemed', 'void')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by text not null default '',
  note text not null default '' check (char_length(note) <= 500),
  unique (month, user_id)
);
alter table public.challenge_prizes enable row level security;

-- A month is finalised once; the row stops a second run handing out prizes twice.
create table if not exists public.challenge_months (
  month text primary key,
  finalised_at timestamptz not null default now(),
  finalised_by text not null default '',
  awards integer not null default 0
);
alter table public.challenge_months enable row level security;

-- Extra attempts ("retries") a player has earned: from a referral, or from the watch-and-share
-- task. used_attempt marks one spent. Never deleted.
create table if not exists public.challenge_credits (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('referral', 'share')),
  ref text not null,
  created_at timestamptz not null default now(),
  used_attempt uuid,
  unique (source, ref)
);
create index if not exists challenge_credits_open on public.challenge_credits (user_id) where used_attempt is null;
alter table public.challenge_credits enable row level security;

-- Watch-and-share task: one per player per month. The player shares a link to a Royal Fitness Club
-- YouTube video on our site; when 5 different people (different networks, not the player's own)
-- open it and stay a few seconds, the player earns one retry.
create table if not exists public.challenge_shares (
  code text primary key check (code ~ '^S[A-Z0-9]{8}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  video_id text not null check (video_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  owner_ip_hash text not null default '',
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  unique (user_id, month)
);
alter table public.challenge_shares enable row level security;

create table if not exists public.challenge_share_visits (
  code text not null references public.challenge_shares (code) on delete cascade,
  ip_hash text not null,
  visited_at timestamptz not null default now(),
  primary key (code, ip_hash)
);
alter table public.challenge_share_visits enable row level security;

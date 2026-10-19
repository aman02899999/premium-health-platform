-- Free-trial booking: the time a visitor picked on the website (or the desk set), and whether
-- they came. Drives the trial reminders and after-trial messages in the daily run.
alter table public.leads
  add column if not exists trial_at timestamptz,
  add column if not exists showed_up boolean;

create index if not exists leads_trial_at_idx on public.leads (trial_at) where trial_at is not null;

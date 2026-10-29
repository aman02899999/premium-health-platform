-- Register members: renewal reminders only, no offers, until they agree. Additive only.
--
-- People added from an uploaded member register have no record of agreeing to promotional
-- messages (owner's decision, 29 Oct 2026). They still get membership reminders (UTILITY
-- templates), but the sender skips offers, win-back, review asks and campaigns for them until
-- the owner ticks "Agreed to get offers" in Growth or they reply START PROMOTIONS on WhatsApp.
-- Everyone already on the list keeps getting what they got before (default true).
alter table public.members add column if not exists offers_ok boolean not null default true;

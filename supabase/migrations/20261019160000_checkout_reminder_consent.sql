-- Checkout reminders only go to buyers who asked for one. The membership, library and supplement
-- checkouts get an unticked "remind me if my payment doesn't go through" box; ticking it stamps the
-- order. (Diet-plan buyers already have the marketing tick, recorded in marketing_contacts.)
alter table public.membership_orders add column if not exists reminder_consent_at timestamptz;
alter table public.book_orders add column if not exists reminder_consent_at timestamptz;
alter table public.shop_orders add column if not exists reminder_consent_at timestamptz;

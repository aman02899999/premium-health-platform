-- Numbers that tapped "Stop promotions" (or typed it) on WhatsApp. Marketing templates are never
-- sent to them; utility messages (renewals, orders, trial replies) still are. "Start promotions"
-- removes the row. Server-only: row-level security on, no policies.
create table if not exists public.whatsapp_optouts (
  phone text primary key check (phone ~ '^\d{8,20}$'),
  created_at timestamptz not null default now()
);
alter table public.whatsapp_optouts enable row level security;

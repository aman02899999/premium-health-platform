import "server-only";
import { pool } from "@/health/db";
import { addDays } from "./dates";
import type { LeadLike } from "./messages";
import type { Interest, NurtureLead } from "./nurture";

// The lead pipeline on public.leads (status, notes, follow-ups), via the server connection.

export type LeadStatus = "new" | "contacted" | "trial" | "joined" | "lost";
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "trial", "joined", "lost"];

/** trialAt: the booked free-trial time. showedUp: what the desk marked (null until someone does). */
export type PipelineLead = LeadLike & { goal: string; message: string; source: string; status: LeadStatus; contactedAt: string | null; notes: string; email: string | null; interest: string; trialAt: string | null; showedUp: boolean | null };

type Row = { id: string; created_at: Date; name: string; phone: string; goal: string; message: string; source: string; status: LeadStatus; contacted_at: Date | null; notes: string; follow_ups: boolean; email: string | null; interest: string; trial_at: Date | null; showed_up: boolean | null };
const fromRow = (r: Row): PipelineLead => ({ id: r.id, createdAt: r.created_at.toISOString(), name: r.name, phone: r.phone, goal: r.goal, message: r.message, source: r.source, status: r.status, contactedAt: r.contacted_at?.toISOString() ?? null, notes: r.notes, followUps: r.follow_ups, email: r.email, interest: r.interest, trialAt: r.trial_at?.toISOString() ?? null, showedUp: r.showed_up });
const COLUMNS = "id, created_at, name, phone, goal, message, source, status, contacted_at, notes, follow_ups, email, interest, trial_at, showed_up";

export async function listPipeline(limit = 1000): Promise<PipelineLead[]> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.leads order by created_at desc limit $1`, [limit]);
  return rows.map(fromRow);
}

/**
 * Leads still due a follow-up: open leads created in the last 21 days (the trial offer is day
 * 14–20), and anyone with a trial booked in the last 8 days who hasn't joined or been closed
 * (the after-trial messages run up to day 7).
 */
export async function openLeads(today: string): Promise<PipelineLead[]> {
  const { rows } = await pool.query<Row>(
    `select ${COLUMNS} from public.leads where follow_ups and (
        (status in ('new', 'contacted') and created_at >= ($1::date - interval '5 hours 30 minutes'))
        or (status in ('new', 'contacted', 'trial') and trial_at >= ($2::date - interval '5 hours 30 minutes')))`,
    [addDays(today, -21), addDays(today, -8)],
  );
  return rows.map(fromRow);
}

/** The lead a visitor just submitted (the public insert can't read its own row back). */
export async function latestLeadByPhone(phone: string): Promise<PipelineLead | null> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.leads where phone = $1 and created_at > now() - interval '10 minutes' order by created_at desc limit 1`, [phone]);
  return rows[0] ? fromRow(rows[0]) : null;
}

/**
 * trialAt: a new trial time (null clears it); a new time also clears the attendance mark.
 * showedUp: the desk's mark. "Came" moves an open lead to status "trial"; "didn't come" keeps it open.
 */
export async function updateLead(id: string, patch: { status?: LeadStatus; notes?: string; followUps?: boolean; trialAt?: string | null; showedUp?: boolean | null }): Promise<void> {
  if (patch.status && !LEAD_STATUSES.includes(patch.status)) throw new Error("Invalid status");
  const status = patch.status ?? null;
  await pool.query(
    `update public.leads set
        status = coalesce($2, case when $7 and status in ('new', 'contacted') then 'trial' when $8 and $7 = false and status = 'trial' then 'contacted' else status end),
        contacted_at = case when (coalesce($2, 'new') <> 'new' or $7) and contacted_at is null then now() else contacted_at end,
        notes = coalesce($3, notes),
        follow_ups = coalesce($4, follow_ups),
        trial_at = case when $5 then $6::timestamptz else trial_at end,
        showed_up = case when $5 then null when $8 then $7 else showed_up end
      where id = $1`,
    [id, status, patch.notes?.slice(0, 1000) ?? null, patch.followUps ?? null, patch.trialAt !== undefined, patch.trialAt ?? null, patch.showedUp ?? null, patch.showedUp !== undefined],
  );
}

export type NewLead = { name: string; phone: string; email: string | null; interest: Interest | "other" | ""; goal: string; message: string; source: string; marketing: boolean; trialAt?: string | null };

/** Saves a website lead with the server connection and returns its id. */
export async function insertLead(l: NewLead): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.leads (name, phone, email, interest, goal, message, source, marketing_consent_at, follow_ups, trial_at)
     values ($1, $2, $3, $4, $5, $6, $7, case when $8 then now() else null end, $9, $10) returning id`,
    // WhatsApp chats are answered by a person, and the free diet tool's visitors asked about food, not a
    // gym trial, so the automatic WhatsApp trial reminders stay off for both (diet leads get the diet emails).
    [l.name, l.phone, l.email, l.interest, l.goal, l.message, l.source, l.marketing, !/^(whatsapp|diet-tool)/.test(l.source), l.trialAt ?? null],
  );
  return rows[0].id;
}

/**
 * Leads due a marketing email: opted in, not unsubscribed, created in the last 12 days, still
 * open, and not already a buyer (a paid diet order or a membership with the same phone or email).
 */
export async function nurtureLeads(today: string): Promise<NurtureLead[]> {
  const { rows } = await pool.query<{ id: string; name: string; email: string; interest: Interest; created_at: Date }>(
    `select distinct on (lower(l.email), l.interest) l.id, l.name, l.email, l.interest, l.created_at
       from public.leads l
      where l.email is not null and l.marketing_consent_at is not null
        and l.interest in ('diet', 'pt', 'membership')
        and l.status in ('new', 'contacted')
        and l.created_at >= ($1::date - interval '5 hours 30 minutes')
        and not exists (select 1 from public.marketing_contacts c where c.channel = 'email' and c.address = lower(l.email) and c.unsubscribed_at is not null)
        and not exists (select 1 from public.diet_orders o where o.status = 'paid' and (o.phone = right(regexp_replace(l.phone, '\\D', '', 'g'), 10) or lower(o.email) = lower(l.email)))
        and not (l.interest <> 'diet' and exists (select 1 from public.members m where m.phone = right(regexp_replace(l.phone, '\\D', '', 'g'), 10)))
      order by lower(l.email), l.interest, l.created_at desc`,
    [addDays(today, -12)],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email, interest: r.interest, createdAt: r.created_at.toISOString() }));
}

export async function getLead(id: string): Promise<(PipelineLead & { email: string | null; interest: string; marketing: boolean }) | null> {
  const { rows } = await pool.query<Row & { marketing_consent_at: Date | null }>(`select ${COLUMNS}, marketing_consent_at from public.leads where id = $1`, [id]);
  const r = rows[0];
  return r ? { ...fromRow(r), marketing: !!r.marketing_consent_at } : null;
}


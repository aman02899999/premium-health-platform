import "server-only";
import { pool } from "@/health/db";
import { addDays } from "./dates";
import type { LeadLike } from "./messages";

// The lead pipeline on public.leads (status, notes, follow-ups), via the server connection.

export type LeadStatus = "new" | "contacted" | "trial" | "joined" | "lost";
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "trial", "joined", "lost"];

export type PipelineLead = LeadLike & { goal: string; message: string; source: string; status: LeadStatus; contactedAt: string | null; notes: string };

type Row = { id: string; created_at: Date; name: string; phone: string; goal: string; message: string; source: string; status: LeadStatus; contacted_at: Date | null; notes: string; follow_ups: boolean };
const fromRow = (r: Row): PipelineLead => ({ id: r.id, createdAt: r.created_at.toISOString(), name: r.name, phone: r.phone, goal: r.goal, message: r.message, source: r.source, status: r.status, contactedAt: r.contacted_at?.toISOString() ?? null, notes: r.notes, followUps: r.follow_ups });
const COLUMNS = "id, created_at, name, phone, goal, message, source, status, contacted_at, notes, follow_ups";

export async function listPipeline(limit = 1000): Promise<PipelineLead[]> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.leads order by created_at desc limit $1`, [limit]);
  return rows.map(fromRow);
}

/** Open leads young enough to still get a follow-up (created in the last 10 days). */
export async function openLeads(today: string): Promise<PipelineLead[]> {
  const { rows } = await pool.query<Row>(
    `select ${COLUMNS} from public.leads where follow_ups and status in ('new', 'contacted') and created_at >= ($1::date - interval '5 hours 30 minutes')`,
    [addDays(today, -10)],
  );
  return rows.map(fromRow);
}

/** The lead a visitor just submitted (the public insert can't read its own row back). */
export async function latestLeadByPhone(phone: string): Promise<PipelineLead | null> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.leads where phone = $1 and created_at > now() - interval '10 minutes' order by created_at desc limit 1`, [phone]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function updateLead(id: string, patch: { status?: LeadStatus; notes?: string; followUps?: boolean }): Promise<void> {
  if (patch.status && !LEAD_STATUSES.includes(patch.status)) throw new Error("Invalid status");
  await pool.query(
    `update public.leads set
        status = coalesce($2, status),
        contacted_at = case when $2 is not null and $2 <> 'new' and contacted_at is null then now() else contacted_at end,
        notes = coalesce($3, notes),
        follow_ups = coalesce($4, follow_ups)
      where id = $1`,
    [id, patch.status ?? null, patch.notes?.slice(0, 1000) ?? null, patch.followUps ?? null],
  );
}

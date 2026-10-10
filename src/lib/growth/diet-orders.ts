import "server-only";
import { pool } from "@/health/db";
import type { DietBuyer, DietIntake } from "./diet-intake";

// public.diet_orders: paid personal diet charts (server-only table).

export type DietOrder = {
  id: string;
  createdAt: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: "created" | "paid" | "failed";
  amountPaise: number;
  name: string;
  phone: string;
  email: string | null;
  intake: DietIntake;
  paidAt: string | null;
  stage: "new" | "draft_ready" | "in_progress" | "sent" | "refunded";
  sentAt: string | null;
  plan: string;
  planPath: string | null;
  planGeneratedAt: string | null;
};

type Row = { id: string; created_at: Date; razorpay_order_id: string; razorpay_payment_id: string | null; status: DietOrder["status"]; amount_paise: number; name: string; phone: string; email: string | null; intake: DietIntake; paid_at: Date | null; stage: DietOrder["stage"]; sent_at: Date | null; plan: string; plan_path: string | null; plan_generated_at: Date | null };
const COLUMNS = "id, created_at, razorpay_order_id, razorpay_payment_id, status, amount_paise, name, phone, email, intake, paid_at, stage, sent_at, plan, plan_path, plan_generated_at";
const fromRow = (r: Row): DietOrder => ({ id: r.id, createdAt: r.created_at.toISOString(), razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, status: r.status, amountPaise: r.amount_paise, name: r.name, phone: r.phone, email: r.email, intake: r.intake, paidAt: r.paid_at?.toISOString() ?? null, stage: r.stage, sentAt: r.sent_at?.toISOString() ?? null, plan: r.plan, planPath: r.plan_path, planGeneratedAt: r.plan_generated_at?.toISOString() ?? null });

export async function insertDietOrder(razorpayOrderId: string, amountPaise: number, buyer: DietBuyer, intake: DietIntake, plan = "starter"): Promise<void> {
  await pool.query(
    `insert into public.diet_orders (razorpay_order_id, amount_paise, name, phone, email, intake, consent_at, plan) values ($1, $2, $3, $4, $5, $6, now(), $7)`,
    [razorpayOrderId, amountPaise, buyer.name, buyer.phone, buyer.email, JSON.stringify(intake), plan],
  );
}

/** True when this number already paid for a 7-day trial (one trial per person). */
export async function hasPaidTrial(phone: string): Promise<boolean> {
  const { rows } = await pool.query(`select 1 from public.diet_orders where phone = $1 and plan = 'trial' and status = 'paid' limit 1`, [phone]);
  return rows.length > 0;
}

/** Records the generated plan PDF; moves a new order to "draft_ready" (never moves a sent order back). */
export async function setDietPlanFile(id: string, path: string): Promise<void> {
  await pool.query(
    `update public.diet_orders set plan_path = $2, plan_generated_at = now(), stage = case when stage = 'new' then 'draft_ready' else stage end, updated_at = now() where id = $1`,
    [id, path],
  );
}

/**
 * Marks a diet order paid. Returns { order, firstTime } — firstTime is true only for the call
 * that actually flipped it to paid, so the confirmation message is queued once.
 */
export async function markDietPaid(razorpayOrderId: string, paymentId: string): Promise<{ order: DietOrder; firstTime: boolean } | null> {
  const { rows } = await pool.query<Row & { was_paid: boolean }>(
    `update public.diet_orders o set status = 'paid', razorpay_payment_id = coalesce(o.razorpay_payment_id, $2), paid_at = coalesce(o.paid_at, now()), updated_at = now()
       from (select id, status = 'paid' as was_paid from public.diet_orders where razorpay_order_id = $1 for update) prev
      where o.id = prev.id
      returning ${COLUMNS.split(", ").map((c) => `o.${c}`).join(", ")}, prev.was_paid`,
    [razorpayOrderId, paymentId],
  );
  return rows[0] ? { order: fromRow(rows[0]), firstTime: !rows[0].was_paid } : null;
}

export async function markDietFailed(razorpayOrderId: string): Promise<void> {
  await pool.query(`update public.diet_orders set status = 'failed', updated_at = now() where razorpay_order_id = $1 and status = 'created'`, [razorpayOrderId]);
}

export async function listDietOrders(): Promise<DietOrder[]> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.diet_orders where status = 'paid' order by paid_at desc limit 500`);
  return rows.map(fromRow);
}

export async function getDietOrder(id: string): Promise<DietOrder | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.diet_orders where id = $1`, [id]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function setDietStage(id: string, stage: DietOrder["stage"]): Promise<void> {
  await pool.query(`update public.diet_orders set stage = $2, sent_at = case when $2 = 'sent' then coalesce(sent_at, now()) else sent_at end, updated_at = now() where id = $1`, [id, stage]);
}

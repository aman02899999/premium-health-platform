import "server-only";
import { pool } from "@/health/db";
import type { CheckoutForm, MembershipQuote } from "./membership";

// public.membership_orders is server-only (RLS on, no policies), so it is
// reached through the direct database connection rather than the Supabase API.

export type MembershipOrder = {
  id: string;
  createdAt: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  status: "created" | "paid" | "failed";
  planName: string;
  duration: string;
  couple: boolean;
  amountPaise: number;
  name: string;
  phone: string;
  email: string | null;
  partnerName: string | null;
  startDate: string | null;
  referredBy: string | null;
  paidAt: string | null;
};

type Row = {
  id: string;
  created_at: Date;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  status: MembershipOrder["status"];
  plan_name: string;
  duration: string;
  couple: boolean;
  amount_paise: number;
  name: string;
  phone: string;
  email: string | null;
  partner_name: string | null;
  start_date: string | null;
  referred_by: string | null;
  paid_at: Date | null;
};

// start_date as text: node-postgres would turn a DATE into a midnight Date object.
const COLUMNS = `id, created_at, razorpay_order_id, razorpay_payment_id, status, plan_name, duration, couple,
  amount_paise, name, phone, email, partner_name, to_char(start_date, 'YYYY-MM-DD') as start_date, referred_by, paid_at`;

const fromRow = (r: Row): MembershipOrder => ({
  id: r.id,
  createdAt: r.created_at.toISOString(),
  razorpayOrderId: r.razorpay_order_id,
  razorpayPaymentId: r.razorpay_payment_id,
  status: r.status,
  planName: r.plan_name,
  duration: r.duration,
  couple: r.couple,
  amountPaise: r.amount_paise,
  name: r.name,
  phone: r.phone,
  email: r.email,
  partnerName: r.partner_name,
  startDate: r.start_date,
  referredBy: r.referred_by,
  paidAt: r.paid_at ? r.paid_at.toISOString() : null,
});

export async function insertOrder(razorpayOrderId: string, quote: MembershipQuote, form: CheckoutForm, referralCode: string | null = null): Promise<void> {
  await pool.query(
    `insert into public.membership_orders
       (razorpay_order_id, plan_id, plan_name, duration, couple, amount_paise, name, phone, email, partner_name, start_date, referred_by, referral_code)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [razorpayOrderId, quote.planId, quote.planName, quote.duration, quote.couple, quote.amountPaise, form.name, form.phone, form.email, form.partnerName, form.startDate, form.referredBy, referralCode],
  );
}

/** Marks an order paid (idempotent). Returns the order, or null if the id is unknown. */
export async function markPaid(razorpayOrderId: string, paymentId: string): Promise<MembershipOrder | null> {
  const { rows } = await pool.query<Row>(
    `update public.membership_orders
        set status = 'paid',
            razorpay_payment_id = coalesce(razorpay_payment_id, $2),
            paid_at = coalesce(paid_at, now()),
            updated_at = now()
      where razorpay_order_id = $1
      returning ${COLUMNS}`,
    [razorpayOrderId, paymentId],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function markFailed(razorpayOrderId: string): Promise<void> {
  await pool.query(`update public.membership_orders set status = 'failed', updated_at = now() where razorpay_order_id = $1 and status = 'created'`, [razorpayOrderId]);
}

export async function listOrders(limit = 300): Promise<MembershipOrder[]> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.membership_orders order by created_at desc limit $1`, [limit]);
  return rows.map(fromRow);
}

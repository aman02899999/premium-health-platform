import "server-only";
import { pool } from "@/health/db";

// The "remind me if my payment doesn't go through" tick on the membership, library and supplement
// checkouts. Best-effort like attribution: a failed write never blocks a payment, it only means no
// reminder for that order.

const TABLES = { membership: "public.membership_orders", library: "public.book_orders", shop: "public.shop_orders" } as const;

export type ReminderTarget = keyof typeof TABLES;

/** Only an explicit `remind: true` in the request body counts as asking for a reminder. */
export const wantsReminder = (body: Record<string, unknown>) => body.remind === true;

export async function saveReminderConsent(target: ReminderTarget, razorpayOrderId: string): Promise<void> {
  try {
    await pool.query(`update ${TABLES[target]} set reminder_consent_at = coalesce(reminder_consent_at, now()) where razorpay_order_id = $1`, [razorpayOrderId]);
  } catch (err) {
    console.error(`[reminder-consent] ${target}:`, (err as Error).message);
  }
}

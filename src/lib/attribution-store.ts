import "server-only";
import { pool } from "@/health/db";
import { attributionFromRequest, type Attribution } from "./attribution";

// Stores the visitor's attribution on the lead or order a request just created. Best-effort by
// design: a missing or broken cookie, or a failed write, never blocks a lead or a payment.

const TARGETS = {
  lead: { table: "public.leads", key: "id" },
  membership: { table: "public.membership_orders", key: "razorpay_order_id" },
  library: { table: "public.book_orders", key: "razorpay_order_id" },
  diet: { table: "public.diet_orders", key: "razorpay_order_id" },
  shop: { table: "public.shop_orders", key: "razorpay_order_id" },
} as const;

export type AttributionTarget = keyof typeof TARGETS;

/** Never overwrites attribution already stored on the row. */
export async function saveAttribution(target: AttributionTarget, id: string, a: Attribution | null): Promise<void> {
  if (!a) return;
  const t = TARGETS[target];
  await pool.query(`update ${t.table} set attribution = coalesce(attribution, $2::jsonb) where ${t.key} = $1`, [id, JSON.stringify(a)]);
}

/** The request's attribution, saved on the row it created; errors are logged and swallowed. */
export async function attributeFromRequest(req: Request, target: AttributionTarget, id: string): Promise<void> {
  try {
    await saveAttribution(target, id, attributionFromRequest(req));
  } catch (err) {
    console.error(`[attribution] ${target}:`, (err as Error).message);
  }
}

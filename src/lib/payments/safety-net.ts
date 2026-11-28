import "server-only";
import { FREQUENT_CHECK, reconcilePayments } from "./reconcile";
import { finishStalledDietOrders } from "@/lib/growth/hooks";
import { recordStatus } from "@/lib/growth/system-status";

export type SafetyNetResult = { ok: boolean; checked: number; recovered: number; mismatched: string[]; plansFinished: number; errors: string[] };

/**
 * Runs on every scheduler tick (every 5 minutes on Cloud Run), so a paying customer never waits
 * for the morning run when the browser's verify step and the webhook both miss:
 * 1. asks Razorpay (read-only) about unpaid orders 5 minutes to 6 hours old and applies any
 *    captured payment (marks it paid, sends the confirmation, builds the diet plan);
 * 2. finishes paid diet orders whose after-payment work stalled (no plan PDF yet).
 * Never throws: the tick's other jobs must still run.
 */
export async function paymentSafetyNet(now = new Date()): Promise<SafetyNetResult> {
  const out: SafetyNetResult = { ok: true, checked: 0, recovered: 0, mismatched: [], plansFinished: 0, errors: [] };
  try {
    const r = await reconcilePayments(now, FREQUENT_CHECK);
    out.checked = r.checked;
    out.recovered = r.recovered.length;
    out.mismatched = r.mismatched;
    out.errors.push(...r.errors);
    if (r.recovered.length) console.error("[payments] recovered on the 5-minute check:", JSON.stringify(r.recovered));
  } catch (err) {
    out.errors.push((err as Error).message);
  }
  try {
    const d = await finishStalledDietOrders(now);
    out.plansFinished = d.finished;
    out.errors.push(...d.errors);
  } catch (err) {
    out.errors.push((err as Error).message);
  }
  out.ok = out.errors.length === 0;
  await recordStatus("payments-tick", { at: now.toISOString(), ...out, mismatched: out.mismatched.slice(0, 5), errors: out.errors.slice(0, 5) }).catch(() => {});
  return out;
}

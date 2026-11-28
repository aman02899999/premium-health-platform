import "server-only";
import { fetchOrderPayments, razorpayConfigured, type RazorpayPayment } from "./razorpay";
import { ordersToReconcile } from "./ledger";
import { applyCapturedPayment } from "./process";
import { captureProblem } from "./webhook-event";

export type ReconcileWindow = { minAgeMinutes?: number; maxAgeHours?: number };

/**
 * The every-5-minutes check (Cloud Run's scheduler tick): orders 5 minutes to 6 hours old, so a
 * buyer whose phone never came back from the UPI app gets their order within minutes instead of
 * the next morning. The daily run still sweeps the full 72 hours.
 */
export const FREQUENT_CHECK: ReconcileWindow = { minAgeMinutes: 5, maxAgeHours: 6 };

export type ReconcileResult = { checked: number; recovered: { kind: string; razorpayOrderId: string; paymentId: string }[]; mismatched: string[]; errors: string[] };

/** The captured payment Razorpay holds for this order. A refunded one is left for a person to look at. */
export function capturedPayment(payments: RazorpayPayment[]): RazorpayPayment | null {
  return payments.find((p) => p.status === "captured") ?? null;
}

/**
 * Safety net for a payment Razorpay captured but this site never recorded: the buyer closed the
 * tab before the verify step and the webhook was missed, misconfigured or failed every retry.
 * Asks Razorpay (read-only) about recent unpaid orders and applies any captured payment through
 * the same idempotent path as the webhook. Never creates, captures or refunds anything.
 */
export async function reconcilePayments(now = new Date(), window: ReconcileWindow = {}): Promise<ReconcileResult> {
  const result: ReconcileResult = { checked: 0, recovered: [], mismatched: [], errors: [] };
  if (!razorpayConfigured()) return result;
  for (const o of await ordersToReconcile(now, window)) {
    result.checked++;
    try {
      const payments = await fetchOrderPayments(o.razorpayOrderId);
      const p = capturedPayment(payments);
      if (!p) {
        const refunded = payments.find((x) => x.status === "refunded");
        if (refunded) result.mismatched.push(`${o.razorpayOrderId}: payment ${refunded.id} was captured and refunded in Razorpay; not applied`);
        // Money held but not taken: Razorpay refunds it on its own after a few days unless it is captured.
        const authorized = payments.find((x) => x.status === "authorized");
        if (authorized) result.mismatched.push(`${o.razorpayOrderId}: payment ${authorized.id} is authorized but not captured; capture it in Razorpay → Payments and turn on automatic capture`);
        continue;
      }
      const problem = captureProblem({ kind: o.kind, amountPaise: o.amountPaise, status: "created", paymentId: null }, { paymentId: p.id, amountPaise: p.amount, currency: p.currency });
      if (problem) {
        result.mismatched.push(`${o.razorpayOrderId}: ${problem}`);
        continue;
      }
      if (await applyCapturedPayment(o.razorpayOrderId, p.id)) result.recovered.push({ kind: o.kind, razorpayOrderId: o.razorpayOrderId, paymentId: p.id });
    } catch (err) {
      result.errors.push(`${o.razorpayOrderId}: ${(err as Error).message}`);
    }
  }
  if (result.recovered.length || result.mismatched.length || result.errors.length) console.error("[payments] reconciliation:", JSON.stringify(result));
  return result;
}

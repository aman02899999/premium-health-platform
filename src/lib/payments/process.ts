import "server-only";
import { markFailed, markPaid } from "./orders";
import { markBookFailed, markBookPaid } from "@/lib/library/orders";
import { afterDietPaid, afterMembershipPaid } from "@/lib/growth/hooks";
import { markDietFailed } from "@/lib/growth/diet-orders";
import { afterShopPaid } from "@/lib/shop/paid";
import { markShopFailed } from "@/lib/shop/store";
import { claimEvent, findOrder, finishEvent, recordDispute, recordRefund, type Outcome } from "./ledger";
import { captureProblem, isDoublePayment, type OrderKind, type RazorpayEvent } from "./webhook-event";

type Defer = (fn: () => Promise<void>) => void;

/**
 * Applies a captured payment to its order: marks it paid and runs that product's side effects
 * (membership days, book access, diet plan, stock). Every step is idempotent, so the browser's
 * verify call, the webhook and reconciliation can all reach it, in any order, any number of times.
 * Returns the kind of order it was, or null when no table has this Razorpay order id.
 */
export async function applyCapturedPayment(razorpayOrderId: string, paymentId: string, defer?: Defer): Promise<OrderKind | null> {
  const order = await findOrder(razorpayOrderId);
  if (!order) return null;
  switch (order.kind) {
    case "membership":
      if (await markPaid(razorpayOrderId, paymentId)) await afterMembershipPaid(razorpayOrderId);
      break;
    case "library":
      await markBookPaid(razorpayOrderId, paymentId);
      break;
    case "diet":
      await afterDietPaid(razorpayOrderId, paymentId, defer);
      break;
    case "shop":
      await afterShopPaid(razorpayOrderId, paymentId);
      break;
  }
  return order.kind;
}

async function markOrderFailed(razorpayOrderId: string): Promise<void> {
  // Each only moves a 'created' order, so a failed attempt never undoes a later successful one.
  await markFailed(razorpayOrderId);
  await markBookFailed(razorpayOrderId);
  await markDietFailed(razorpayOrderId);
  await markShopFailed(razorpayOrderId);
}

export type HandleResult = { status: 200 | 500; outcome: Outcome | "duplicate"; detail: string; purchase: boolean };

/**
 * One verified webhook event. Logs it in payment_events first, so retried deliveries are
 * recognised; a delivery that throws stays open and Razorpay's retry processes it again.
 * `purchase` tells the caller to report the sale to Meta (only for a payment we accepted).
 */
export async function handleRazorpayEvent(e: RazorpayEvent, defer?: Defer): Promise<HandleResult> {
  let claim;
  try {
    claim = await claimEvent(e);
  } catch (err) {
    // Database unreachable: change nothing and let Razorpay retry.
    return { status: 500, outcome: "error", detail: (err as Error).message, purchase: false };
  }
  if (claim === "duplicate") return { status: 200, outcome: "duplicate", detail: "", purchase: false };
  try {
    const { outcome, detail, purchase } = await route(e, defer);
    await finishEvent(e.eventId, outcome, detail);
    return { status: 200, outcome, detail, purchase };
  } catch (err) {
    const message = (err as Error).message;
    await finishEvent(e.eventId, "error", message).catch(() => {});
    return { status: 500, outcome: "error", detail: message, purchase: false };
  }
}

async function route(e: RazorpayEvent, defer?: Defer): Promise<{ outcome: Outcome; detail: string; purchase: boolean }> {
  switch (e.event) {
    case "payment.captured": {
      if (!e.orderId || !e.paymentId) return { outcome: "ignored", detail: "Payment without an order id (payment link or page)", purchase: false };
      const order = await findOrder(e.orderId);
      // Not one of ours (another integration or a payment link): still a real sale for ads.
      if (!order) return { outcome: "unknown_order", detail: "No website order has this Razorpay order id", purchase: true };
      const problem = captureProblem(order, e);
      if (problem) return { outcome: "amount_mismatch", detail: `${problem}. Not applied: check it in Razorpay before doing anything.`, purchase: false };
      const double = isDoublePayment(order, e.paymentId);
      await applyCapturedPayment(e.orderId, e.paymentId, defer);
      return {
        outcome: "applied",
        detail: double ? `Second payment on an order already paid by ${order.paymentId}: refund one of them in Razorpay.` : "",
        purchase: !double,
      };
    }
    case "payment.failed":
      if (!e.orderId) return { outcome: "ignored", detail: "Failed payment without an order id", purchase: false };
      await markOrderFailed(e.orderId);
      return { outcome: "applied", detail: "", purchase: false };
    case "refund.processed": {
      if (!e.paymentId || e.refundedPaise === null) return { outcome: "ignored", detail: "Refund without a payment id or amount", purchase: false };
      const kinds = await recordRefund(e.paymentId, e.refundedPaise);
      return kinds.length ? { outcome: "applied", detail: `Refunded ${e.refundedPaise} paise on ${kinds.join(", ")} order`, purchase: false } : { outcome: "unknown_order", detail: "No website order has this payment id", purchase: false };
    }
    case "payment.dispute.created": {
      if (!e.paymentId) return { outcome: "ignored", detail: "Dispute without a payment id", purchase: false };
      const kinds = await recordDispute(e.paymentId);
      return kinds.length ? { outcome: "applied", detail: `Disputed ${kinds.join(", ")} order: respond in Razorpay`, purchase: false } : { outcome: "unknown_order", detail: "No website order has this payment id", purchase: false };
    }
    default:
      return { outcome: "ignored", detail: "", purchase: false };
  }
}

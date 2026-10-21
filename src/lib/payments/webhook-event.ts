// Razorpay webhook payloads, reduced to what the order tables need (pure; safe to unit-test).
//
// Payments carry the order id; refunds and disputes carry the payment id. Refund amounts are
// taken from the payment's cumulative amount_refunded where Razorpay sends it, so applying the
// same or an older refund event again never counts money twice.

export type RazorpayEvent = {
  /** Stable id for dedupe: Razorpay's X-Razorpay-Event-Id, or one derived from the payload. */
  eventId: string;
  event: string;
  orderId: string | null;
  paymentId: string | null;
  amountPaise: number | null;
  currency: string | null;
  /** Total refunded on the payment so far (paise), for refund events. */
  refundedPaise: number | null;
  email: string | null;
  contact: string | null;
  description: string | null;
};

type Entity = Record<string, unknown> | undefined;

const str = (v: unknown, max = 100): string | null => (typeof v === "string" && v.length > 0 && v.length <= max ? v : null);
const paise = (v: unknown): number | null => (typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null);

/** Returns null for a body that isn't a Razorpay event at all. */
export function parseRazorpayEvent(raw: string, headerEventId: string | null): RazorpayEvent | null {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") return null;
  const b = body as { event?: unknown; payload?: Record<string, { entity?: Entity } | undefined> };
  const event = str(b.event, 60);
  if (!event) return null;
  const payment = b.payload?.payment?.entity;
  const refund = b.payload?.refund?.entity;
  const dispute = b.payload?.dispute?.entity;

  const paymentId = str(payment?.id, 60) ?? str(refund?.payment_id, 60) ?? str(dispute?.payment_id, 60);
  const orderId = str(payment?.order_id, 60);
  const refundedPaise = event.startsWith("refund.") ? (paise(payment?.amount_refunded) ?? paise(refund?.amount)) : null;
  const subject = str(refund?.id, 60) ?? str(dispute?.id, 60) ?? paymentId ?? orderId ?? "none";
  return {
    eventId: str(headerEventId, 100) ?? `${event}:${subject}`.slice(0, 100),
    event,
    orderId,
    paymentId,
    amountPaise: paise(payment?.amount),
    currency: str(payment?.currency, 10),
    refundedPaise,
    email: str(payment?.email, 120),
    contact: str(payment?.contact, 20),
    description: str(payment?.description, 200),
  };
}

export type OrderKind = "membership" | "library" | "diet" | "shop" | "request";
export type KnownOrder = { kind: OrderKind; amountPaise: number; status: string; paymentId: string | null };

/**
 * Why a captured payment must not be applied to this order, or null when it can be.
 * Razorpay orders fix the amount, so a mismatch means something is wrong (a reused order id,
 * a misconfigured account, a forged payload with a leaked secret); a person should look first.
 */
export function captureProblem(order: KnownOrder, payment: { paymentId: string | null; amountPaise: number | null; currency: string | null }): string | null {
  if (payment.currency !== "INR") return `Currency ${payment.currency ?? "missing"}, expected INR`;
  if (payment.amountPaise === null) return "Payment amount missing";
  if (payment.amountPaise !== order.amountPaise) return `Paid ${payment.amountPaise} paise, order is ${order.amountPaise} paise`;
  return null;
}

/** A second, different payment captured for an order that is already paid: the buyer was charged twice. */
export const isDoublePayment = (order: KnownOrder, paymentId: string | null) => order.status === "paid" && !!order.paymentId && !!paymentId && order.paymentId !== paymentId;

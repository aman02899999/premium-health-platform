import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { markPaid } from "@/lib/payments/orders";
import { formatPaise } from "@/lib/payments/membership";
import { afterMembershipPaid } from "@/lib/growth/hooks";
import { memberForOrder } from "@/lib/growth/members";
import { formatDate } from "@/lib/growth/dates";

export const dynamic = "force-dynamic";

// Step 2: Checkout hands back order id + payment id + signature; only a valid
// signature (made with our key secret) marks the order paid.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const paymentId = typeof body?.paymentId === "string" ? body.paymentId : "";
  const signature = typeof body?.signature === "string" ? body.signature : "";
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "We couldn't verify this payment. If money was deducted, WhatsApp us your payment ID." }, { status: 400 });
  }
  try {
    const order = await markPaid(orderId, paymentId);
    if (!order) return NextResponse.json({ error: "Order not found. Please WhatsApp us your payment ID." }, { status: 404 });
    // Membership days, welcome message and referral bonus (idempotent; never fails the payment).
    await afterMembershipPaid(orderId);
    const member = await memberForOrder(orderId).catch(() => null);
    return NextResponse.json({
      validUntil: member ? formatDate(member.expiresOn) : null,
      referralCode: member?.referralCode ?? null,
      ok: true,
      paymentId,
      plan: `${order.planName} (${order.duration}${order.couple ? ", couple" : ""})`,
      amount: formatPaise(order.amountPaise),
      name: order.name,
      startDate: order.startDate,
    });
  } catch (err) {
    console.error("[membership] verify failed:", (err as Error).message);
    // The signature was valid, so the payment is real; the webhook will record it.
    return NextResponse.json({ ok: true, paymentId, pending: true });
  }
}

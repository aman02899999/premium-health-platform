import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { findOrder } from "@/lib/payments/ledger";
import { markRequestPaid } from "@/lib/payments/requests";

// Step 2: the browser returns Razorpay's signed result; only a valid signature marks it paid.
// The webhook does the same independently, so a closed tab still ends up recorded.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = typeof b?.razorpay_order_id === "string" ? b.razorpay_order_id : "";
  const paymentId = typeof b?.razorpay_payment_id === "string" ? b.razorpay_payment_id : "";
  const signature = typeof b?.razorpay_signature === "string" ? b.razorpay_signature : "";
  if (!orderId || !paymentId || !verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "We couldn't verify this payment. If money was deducted, WhatsApp us with your payment ID." }, { status: 400 });
  }
  try {
    const order = await findOrder(orderId);
    if (!order || order.kind !== "request") return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    await markRequestPaid(orderId, paymentId);
    return NextResponse.json({ ok: true, paymentId });
  } catch (err) {
    console.error("[pay] verify:", (err as Error).message);
    return NextResponse.json({ error: `Payment received (ID ${paymentId}); we'll confirm it shortly.` }, { status: 500 });
  }
}

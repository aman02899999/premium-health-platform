import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { markBookPaid } from "@/lib/library/orders";

export const dynamic = "force-dynamic";

// Step 2: the browser returns Razorpay's signed result; only a valid signature unlocks the downloads.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!orderId || !paymentId || !verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "We couldn't verify this payment. If money was deducted, WhatsApp us with your payment ID." }, { status: 400 });
  }
  try {
    const order = await markBookPaid(orderId, paymentId);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ ok: true, paymentId, accessUrl: `/library/access/${order.accessToken}` });
  } catch (err) {
    console.error("[library] verify failed:", (err as Error).message);
    return NextResponse.json({ error: "Payment received, but we couldn't open your downloads yet. Use 'Recover my books' with your payment ID in a minute." }, { status: 500 });
  }
}

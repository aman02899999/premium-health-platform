import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { afterShopPaid } from "@/lib/shop/paid";

export const dynamic = "force-dynamic";

// Step 2: only a valid Razorpay signature marks the order paid (the webhook does the same).
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = typeof b?.orderId === "string" ? b.orderId : "";
  const paymentId = typeof b?.paymentId === "string" ? b.paymentId : "";
  const signature = typeof b?.signature === "string" ? b.signature : "";
  if (!verifyPaymentSignature(orderId, paymentId, signature)) return NextResponse.json({ error: "We couldn't verify this payment. If money was deducted, WhatsApp us your payment ID." }, { status: 400 });
  try {
    if (!(await afterShopPaid(orderId, paymentId))) return NextResponse.json({ error: "Order not found. Please WhatsApp us your payment ID." }, { status: 404 });
    return NextResponse.json({ ok: true, paymentId });
  } catch (err) {
    console.error("[shop] verify failed:", (err as Error).message);
    return NextResponse.json({ ok: true, paymentId, pending: true }); // signature was valid; the webhook will record it
  }
}

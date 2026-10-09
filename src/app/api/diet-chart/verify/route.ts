import { NextResponse, after } from "next/server";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { afterDietPaid } from "@/lib/growth/hooks";
import { DIET_CHART } from "@/lib/growth/config";

export const dynamic = "force-dynamic";
// The paid diet order builds the client's plan PDF after the response.
export const maxDuration = 60;

// Step 2: only a valid Razorpay signature marks the order paid. The webhook does the same
// if the buyer closes the tab first; afterDietPaid is idempotent.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const paymentId = typeof body?.paymentId === "string" ? body.paymentId : "";
  const signature = typeof body?.signature === "string" ? body.signature : "";
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "We couldn't verify this payment. If money was deducted, WhatsApp us your payment ID." }, { status: 400 });
  }
  try {
    const found = await afterDietPaid(orderId, paymentId, after);
    if (!found) return NextResponse.json({ error: "Order not found. Please WhatsApp us your payment ID." }, { status: 404 });
    return NextResponse.json({ ok: true, paymentId, turnaround: DIET_CHART.turnaround });
  } catch (err) {
    console.error("[diet-chart] verify failed:", (err as Error).message);
    // The signature was valid, so the payment is real; the webhook will record it.
    return NextResponse.json({ ok: true, paymentId, pending: true, turnaround: DIET_CHART.turnaround });
  }
}

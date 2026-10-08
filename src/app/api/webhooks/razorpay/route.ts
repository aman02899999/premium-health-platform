import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { markFailed, markPaid } from "@/lib/payments/orders";
import { markBookFailed, markBookPaid } from "@/lib/library/orders";
import { afterDietPaid, afterMembershipPaid } from "@/lib/growth/hooks";
import { markDietFailed } from "@/lib/growth/diet-orders";
import { afterShopPaid } from "@/lib/shop/paid";
import { markShopFailed } from "@/lib/shop/store";

export const dynamic = "force-dynamic";

// Razorpay → Webhooks: https://<your-site>/api/webhooks/razorpay, events
// payment.captured and payment.failed. Records payments even when the buyer
// closes the tab before the browser reaches /api/membership/verify, /api/library/verify or /api/diet-chart/verify.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id || !payment.id) return NextResponse.json({ ok: true });
  try {
    // The order id belongs to a membership, book or diet-chart order; each update is a no-op for the other tables.
    if (event.event === "payment.captured") {
      if (await markPaid(payment.order_id, payment.id)) await afterMembershipPaid(payment.order_id);
      await markBookPaid(payment.order_id, payment.id);
      await afterDietPaid(payment.order_id, payment.id);
      await afterShopPaid(payment.order_id, payment.id);
    } else if (event.event === "payment.failed") {
      await markFailed(payment.order_id);
      await markBookFailed(payment.order_id);
      await markDietFailed(payment.order_id);
      await markShopFailed(payment.order_id);
    }
  } catch (err) {
    console.error("[razorpay webhook] update failed:", (err as Error).message);
    return NextResponse.json({ error: "Temporary failure" }, { status: 500 }); // Razorpay retries
  }
  return NextResponse.json({ ok: true });
}

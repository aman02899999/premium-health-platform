import { NextResponse, after } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { handleRazorpayEvent } from "@/lib/payments/process";
import { parseRazorpayEvent } from "@/lib/payments/webhook-event";
import { sendCapiEvent } from "@/lib/growth/meta-capi";

export const dynamic = "force-dynamic";
// The paid diet order builds the client's plan PDF after the response.
export const maxDuration = 60;

// Razorpay → Webhooks: https://<your-site>/api/webhooks/razorpay, events payment.captured,
// payment.failed, refund.processed and payment.dispute.created. Records payments even when the
// buyer closes the tab before the browser reaches the verify step, and refunds and chargebacks,
// which only Razorpay knows about. Each delivery is logged in payment_events by its event id.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) console.error("[razorpay webhook] RAZORPAY_WEBHOOK_SECRET is not set: every webhook is refused");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = parseRazorpayEvent(raw, req.headers.get("x-razorpay-event-id"));
  if (!event) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const res = await handleRazorpayEvent(event, after);
  if (res.status === 500) {
    console.error(`[razorpay webhook] ${event.event} ${event.eventId} failed:`, res.detail);
    return NextResponse.json({ error: "Temporary failure" }, { status: 500 }); // Razorpay retries
  }
  if (res.outcome === "amount_mismatch" || (res.outcome === "applied" && res.detail && event.event === "payment.captured")) {
    console.error(`[razorpay webhook] ${event.event} ${event.eventId} needs a person:`, res.detail);
  }
  if (res.purchase && event.paymentId) {
    // The sale for Meta ads, with the payment id as the event id: the browser's Purchase event and
    // Razorpay's retries of this webhook all count once.
    const { paymentId, email, contact, amountPaise, description } = event;
    after(() => sendCapiEvent({ name: "Purchase", id: paymentId, user: { email: email ?? undefined, phone: contact ?? undefined }, value: (amountPaise ?? 0) / 100, contentName: description ?? undefined, source: "system_generated" }));
  }
  return NextResponse.json({ ok: true, outcome: res.outcome });
}

import { NextRequest, NextResponse } from "next/server";

// Mock Razorpay webhook — in production verify signature with RAZORPAY_WEBHOOK_SECRET
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event || "payment.captured";
    const paymentId = body.payload?.payment?.entity?.id || `pay_mock_${Date.now()}`;
    const orderId = body.payload?.payment?.entity?.order_id || body.payload?.order?.entity?.id || `order_mock_${Date.now()}`;
    const email = body.payload?.payment?.entity?.email || body.payload?.payment?.entity?.notes?.email || "demo@bharathealthglobe.in";

    // Demo: log event, in prod update DB, set premium, send email, gtag purchase
    console.log(`[Razorpay Webhook] ${event} ${paymentId} ${orderId} ${email}`);

    return NextResponse.json({
      ok: true,
      received: true,
      event,
      paymentId,
      orderId,
      email,
      message: "Webhook received — in prod verify signature, update premium, send confirmation, gtag purchase, FB Pixel Purchase",
      earning: "Premium Rs199/mo MRR — webhook confirms payment — earning platform",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Razorpay webhook endpoint — POST payment.captured event — mock — production verify signature",
    docs: "https://razorpay.com/docs/webhooks/",
  });
}

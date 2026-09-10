import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider, generateDownloadToken } from "@/lib/monetization/payment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || `order_${Date.now()}`;

  const provider = getPaymentProvider("razorpay");
  const keyId = process.env.RAZORPAY_KEY_ID;

  if (!keyId) {
    return NextResponse.json({
      ok: false,
      error: "Razorpay not configured — set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET in .env. Using mock mode.",
      fallback: `/api/monetization/checkout/mock?orderId=${orderId}`,
      setup: [
        "Create Razorpay account at https://razorpay.com/",
        "Get Key ID and Key Secret from Dashboard → Settings → API Keys",
        "Set in .env: RAZORPAY_KEY_ID=rzp_test_xxx, RAZORPAY_KEY_SECRET=xxx, RAZORPAY_WEBHOOK_SECRET=xxx",
        "Set PAYMENT_PROVIDER=razorpay",
        "Configure webhook: https://yourdomain.com/api/webhooks/razorpay with secret",
        "Test with Razorpay test cards: https://razorpay.com/docs/payments/payments/test-card-details/",
      ],
    });
  }

  // In production, create Razorpay order via SDK:
  // const razorpay = new Razorpay({ key_id, key_secret });
  // const rpOrder = await razorpay.orders.create({ amount: amount*100, currency, receipt: orderId });

  const { token, expiresAt } = generateDownloadToken(orderId, "demo-product", 72);

  return NextResponse.json({
    ok: true,
    mode: "razorpay",
    orderId,
    keyId, // public key is safe to expose — secret never
    message: "Razorpay checkout ready — integrate Razorpay Checkout.js on frontend with key_id and order_id.",
    checkoutOptions: {
      key: keyId,
      order_id: `rzp_order_${orderId}`,
      amount: "Amount in paise (e.g., 19900 for ₹199)",
      currency: "INR",
      name: "Bharat Health Guide",
      description: "Digital Health Guide",
      prefill: { email: "user@example.in" },
      theme: { color: "#047857" },
    },
    nextSteps: [
      "Include https://checkout.razorpay.com/v1/checkout.js on frontend",
      "Create Razorpay instance with options + handler that POSTs to /api/monetization/checkout/verify",
      "Verify signature server-side via HMAC SHA256 — never trust frontend alone",
    ],
    downloadToken: token,
    downloadUrl: `/download/${token}`,
    expiresAt,
  });
}

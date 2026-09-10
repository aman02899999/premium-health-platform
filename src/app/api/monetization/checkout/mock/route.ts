import { NextRequest, NextResponse } from "next/server";
import { generateDownloadToken } from "@/lib/monetization/payment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || `order_${Date.now()}`;

  // Mock checkout — in production, redirect to Razorpay Checkout with key_id, order_id, etc.
  // Server-side verification required via /api/monetization/checkout/verify
  const { token, expiresAt } = generateDownloadToken(orderId, "demo-product", 72);

  return NextResponse.json({
    ok: true,
    mode: "mock",
    orderId,
    message: "Mock checkout — no real payment. In production, this would redirect to Razorpay Checkout (key_id, order_id, amount, currency, prefill, theme).",
    nextSteps: [
      "Frontend: Razorpay Checkout opens with options: key, order_id, amount, currency, name, description, prefill email",
      "User completes payment — Razorpay returns razorpay_order_id, razorpay_payment_id, razorpay_signature",
      "POST /api/monetization/checkout/verify with orderId, paymentId, signature, provider=razorpay — server verifies HMAC SHA256",
      "On verified, generate download token expiring 72h, limit 3, via /download/[token] — private PDF URLs never public",
    ],
    mockPaymentId: `mock_pay_${Date.now()}`,
    downloadToken: token,
    downloadUrl: `/download/${token}`,
    verifyUrl: "/api/monetization/checkout/verify",
    expiresAt,
    security: "Payment confirmation must be server-side verified — never trust frontend state alone. Use env RAZORPAY_KEY_ID, SECRET, WEBHOOK_SECRET.",
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}

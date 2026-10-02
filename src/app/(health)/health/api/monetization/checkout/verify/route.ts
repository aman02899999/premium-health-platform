import { NextRequest, NextResponse } from "next/server";
import { healthPaymentsLive, paymentsUnavailable } from "@/health/lib/monetization/live-guard";
import { getPaymentProvider, generateDownloadToken } from "@/health/lib/monetization/payment";
import { verifyPaymentSignature } from "@/lib/payments/signature";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!healthPaymentsLive()) return paymentsUnavailable();
  try {
    const body = await req.json();
    const { orderId, paymentId, signature, provider } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json({ ok: false, error: "Missing orderId/paymentId" }, { status: 400 });
    }

    // Server-side verification — never trust frontend alone. On the live site the
    // provider isn't the caller's choice: only a real Razorpay signature passes.
    const result =
      process.env.VERCEL_ENV === "production"
        ? verifyPaymentSignature(String(orderId), String(paymentId), String(signature ?? ""))
          ? { verified: true as const, error: undefined }
          : { verified: false as const, error: "Invalid payment signature" }
        : await getPaymentProvider(provider).verifyPayment({ orderId, paymentId, signature, provider: provider || getPaymentProvider(provider).name });

    if (!result.verified) {
      return NextResponse.json({ ok: false, error: result.error || "Verification failed" }, { status: 400 });
    }

    // Generate secure download token — expiring, not public URL
    const { token, expiresAt } = generateDownloadToken(orderId, "product", 72);

    // In production: update order status to paid, store paymentId, send email receipt, etc.

    return NextResponse.json({
      ok: true,
      verified: true,
      orderId,
      paymentId,
      downloadToken: token,
      downloadUrl: `/health/download/${token}`,
      expiresAt,
      message: "Payment verified server-side. Download token generated — expiring in 72h.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

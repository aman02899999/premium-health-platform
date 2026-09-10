import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider, generateDownloadToken } from "@/lib/monetization/payment";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentId, signature, provider } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json({ ok: false, error: "Missing orderId/paymentId" }, { status: 400 });
    }

    // Server-side verification — never trust frontend alone
    const paymentProvider = getPaymentProvider(provider);
    const result = await paymentProvider.verifyPayment({ orderId, paymentId, signature, provider: provider || paymentProvider.name });

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
      downloadUrl: `/download/${token}`,
      expiresAt,
      message: "Payment verified server-side. Download token generated — expiring in 72h.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

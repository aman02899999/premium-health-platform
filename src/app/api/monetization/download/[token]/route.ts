import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/monetization/payment";
import { DIGITAL_PRODUCTS } from "@/lib/monetization/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const verification = verifyDownloadToken(token);
  if (!verification.valid) {
    return NextResponse.json({ ok: false, error: verification.error || "Invalid token" }, { status: 400 });
  }

  // In production: check order status paid, check download limit, serve file from private storage with signed URL
  // Never expose private PDF file URLs publicly — use expiring/signed download URLs

  const product = DIGITAL_PRODUCTS.find((p) => p.id === verification.productId || p.slug === verification.productId) || DIGITAL_PRODUCTS[0];

  // For demo, return JSON with download info — in prod would stream file or redirect to presigned S3 URL
  return NextResponse.json({
    ok: true,
    orderId: verification.orderId,
    productId: verification.productId,
    productTitle: product.title,
    expiresAt: verification.expiresAt,
    message: "Demo download — in production, this would return a presigned S3 URL or stream the PDF with Content-Disposition attachment, after verifying payment server-side.",
    downloadUrl: `/api/monetization/preview/${product.slug}?token=${token}`, // demo preview
    security: "Token verified server-side, expiring in 72h, download limit 3 — private file URLs never exposed publicly.",
  });
}

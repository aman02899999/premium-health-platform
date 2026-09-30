import { NextRequest, NextResponse } from "next/server";
import { getActiveCoupons, getExpiredCoupons, COUPONS } from "@/lib/monetization/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeExpired = searchParams.get("includeExpired") === "true";

  const active = getActiveCoupons();
  const expired = getExpiredCoupons();

  return NextResponse.json({
    ok: true,
    activeCount: active.length,
    expiredCount: expired.length,
    coupons: active.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      code: c.code,
      discount: c.discount,
      merchant: c.merchant,
      affiliateUrl: c.affiliateUrl,
      expirationDate: c.expirationDate,
      category: c.category,
      ctaText: c.ctaText,
      terms: c.terms,
    })),
    ...(includeExpired ? { expired: expired.map((c) => ({ id: c.id, code: c.code, expirationDate: c.expirationDate })) } : {}),
    note: "Automatically marks expired coupons as inactive — never display expired as active. Affiliate disclosure required.",
  });
}

import { NextRequest, NextResponse } from "next/server";

type Click = {
  id: string;
  productId: string;
  productName?: string;
  affiliateUrl?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
};

// In-memory for demo — production use DB + KV
const clicks: Click[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, productName, affiliateUrl, utm_source, utm_medium, utm_campaign } = body;

    if (!productId) {
      return NextResponse.json({ ok: false, error: "productId required" }, { status: 400 });
    }

    const click: Click = {
      id: `clk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: String(productId),
      productName: productName ? String(productName).slice(0, 100) : undefined,
      affiliateUrl: affiliateUrl ? String(affiliateUrl).slice(0, 500) : undefined,
      utm_source: utm_source?.toString().slice(0, 100),
      utm_medium: utm_medium?.toString().slice(0, 100),
      utm_campaign: utm_campaign?.toString().slice(0, 100),
      timestamp: new Date().toISOString(),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: req.headers.get("user-agent")?.slice(0, 200),
    };

    clicks.push(click);
    if (clicks.length > 1000) clicks.shift();

    // In production: push to GA4 gtag affiliate_click + FB Pixel ViewContent + DB
    return NextResponse.json({
      ok: true,
      id: click.id,
      message: "Affiliate click tracked — earning platform — gtag affiliate_click",
      earning: "Avg 8% commission, e.g., glucometer Rs1999 * 8% = Rs160 per sale — tracked via UTM + gtag",
      next: click.affiliateUrl || `/deals?product=${productId}&utm_source=affiliate`,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const productId = searchParams.get("productId");

  let filtered = clicks;
  if (productId) filtered = clicks.filter((c) => c.productId === productId);

  const total = filtered.length;
  const byProduct = filtered.reduce((acc: Record<string, number>, c) => {
    acc[c.productId] = (acc[c.productId] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    ok: true,
    total,
    byProduct,
    clicks: filtered.slice(-limit).reverse(),
    note: "Demo in-memory — production use DB + analytics dashboard at /admin/earning — earning platform",
  });
}

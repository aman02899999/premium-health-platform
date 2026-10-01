import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const EVENTS: any[] = [];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
  const type = searchParams.get("type");

  let filtered = EVENTS;
  if (type) filtered = filtered.filter((e) => e.type === type);

  // Aggregate stats — privacy-conscious, no personal health info
  const stats = {
    total: EVENTS.length,
    byType: EVENTS.reduce((acc: Record<string, number>, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
    topPages: Object.entries(
      EVENTS.reduce((acc: Record<string, number>, e) => {
        acc[e.page] = (acc[e.page] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    topProducts: Object.entries(
      EVENTS.filter((e) => e.productId).reduce((acc: Record<string, number>, e) => {
        acc[e.productId] = (acc[e.productId] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    ctr: (() => {
      const views = EVENTS.filter((e) => e.type === "affiliate_product_view").length;
      const clicks = EVENTS.filter((e) => e.type === "affiliate_product_click").length;
      return views ? (clicks / views) * 100 : 0;
    })(),
  };

  return NextResponse.json({ ok: true, stats, events: filtered.slice(-limit).reverse() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, productId, page, campaign, source, cta, timestamp, utm } = body;

    if (!type || !page) {
      return NextResponse.json({ ok: false, error: "Missing type/page" }, { status: 400 });
    }

    // Minimal validation — no sensitive health data
    const event = {
      id: id || `evt_${Date.now()}`,
      type,
      productId,
      page: page.slice(0, 200),
      campaign: campaign?.slice(0, 100),
      source: source?.slice(0, 100),
      cta: cta?.slice(0, 100),
      timestamp: timestamp || new Date().toISOString(),
      utm: utm ? { source: utm.source?.slice(0, 50), medium: utm.medium?.slice(0, 50), campaign: utm.campaign?.slice(0, 50) } : undefined,
    };

    EVENTS.push(event);
    if (EVENTS.length > 1000) EVENTS.shift();

    return NextResponse.json({ ok: true, id: event.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
}

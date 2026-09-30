import { NextRequest, NextResponse } from "next/server";

type Subscriber = {
  id: string;
  email: string;
  name?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  leadMagnet?: string;
  timestamp: string;
};

const subscribers: Subscriber[] = [];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, utm_source, utm_medium, utm_campaign, leadMagnet } = body;

    if (!email || !EMAIL_RE.test(String(email))) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }

    const exists = subscribers.find((s) => s.email.toLowerCase() === String(email).toLowerCase());
    if (exists) {
      return NextResponse.json({ ok: true, id: exists.id, message: "Already subscribed — lead magnet sent", duplicate: true });
    }

    const sub: Subscriber = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      email: String(email).toLowerCase().trim(),
      name: name ? String(name).slice(0, 100) : undefined,
      utm_source: utm_source?.toString().slice(0, 100),
      utm_medium: utm_medium?.toString().slice(0, 100),
      utm_campaign: utm_campaign?.toString().slice(0, 100),
      leadMagnet: leadMagnet ? String(leadMagnet).slice(0, 100) : "thali-builder-pdf",
      timestamp: new Date().toISOString(),
    };

    subscribers.push(sub);
    if (subscribers.length > 2000) subscribers.shift();

    return NextResponse.json({
      ok: true,
      id: sub.id,
      message: "Subscribed — lead magnet: 7-day thali plan PDF + 20% conversion demo",
      leadMagnet: sub.leadMagnet,
      earning: "Newsletter 20% open, 5% click, 2% premium conversion — earning platform — digital marketing optimized",
      next: "/premium?utm_source=newsletter",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  return NextResponse.json({
    ok: true,
    total: subscribers.length,
    subscribers: subscribers.slice(-limit).reverse(),
    note: "Demo in-memory — production use DB + email service + /admin/earning dashboard — UTM tracked",
  });
}

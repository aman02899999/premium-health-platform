import { NextRequest, NextResponse } from "next/server";

type PushSub = {
  id: string;
  endpoint: string;
  utm_source?: string;
  timestamp: string;
};

const subs: PushSub[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, utm_source } = body;
    if (!endpoint) return NextResponse.json({ ok: false, error: "endpoint required" }, { status: 400 });

    const sub: PushSub = {
      id: `push_${Date.now()}`,
      endpoint: String(endpoint).slice(0, 500),
      utm_source: utm_source?.toString().slice(0, 100),
      timestamp: new Date().toISOString(),
    };
    subs.push(sub);
    if (subs.length > 1000) subs.shift();

    return NextResponse.json({
      ok: true,
      id: sub.id,
      message: "Push subscribed — will send daily health tips + premium upsell — digital marketing optimized",
      earning: "Push 30% open, 8% click — re-engagement + earning",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, total: subs.length, note: "Demo in-memory — production use web-push + VAPID + /admin/earning" });
}

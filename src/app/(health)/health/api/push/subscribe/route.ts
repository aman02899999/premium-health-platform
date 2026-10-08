import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isAdmin } from "@/health/lib/auth/server";
import { countPushSubscriptions, savePushSubscription } from "@/health/lib/signups";

export const dynamic = "force-dynamic";

// Stores a real browser PushSubscription (https endpoint + keys). Sending needs VAPID keys;
// the prompt is hidden until NEXT_PUBLIC_VAPID_PUBLIC_KEY is set.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; utm_source?: unknown } | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!/^https:\/\/.{10,1000}$/.test(endpoint) || typeof body?.keys?.p256dh !== "string" || typeof body.keys.auth !== "string") {
    return NextResponse.json({ ok: false, error: "A browser push subscription is required" }, { status: 400 });
  }
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Unavailable" }, { status: 503 });
  try {
    await savePushSubscription(endpoint, { p256dh: body.keys.p256dh.slice(0, 200), auth: body.keys.auth.slice(0, 100) }, body.utm_source);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push] save failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Couldn't save the subscription" }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  return NextResponse.json({ ok: true, total: await countPushSubscriptions() });
}

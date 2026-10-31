import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isAdmin } from "@/health/lib/auth/server";
import { countPushSubscriptions, savePushSubscription } from "@/health/lib/signups";
import { parseSubscription } from "@/lib/push/core";

export const dynamic = "force-dynamic";

// Stores a real browser PushSubscription (https endpoint + keys). Sending needs VAPID keys;
// the prompt is hidden until NEXT_PUBLIC_VAPID_PUBLIC_KEY is set.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; utm_source?: unknown } | null;
  // Only the browsers' own push services: the server posts to this address when it sends.
  const sub = parseSubscription(body);
  if (typeof sub === "string") {
    return NextResponse.json({ ok: false, error: "A browser push subscription is required" }, { status: 400 });
  }
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Unavailable" }, { status: 503 });
  try {
    await savePushSubscription(sub.endpoint, { p256dh: sub.p256dh, auth: sub.auth }, body?.utm_source);
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

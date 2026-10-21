import { NextResponse, after } from "next/server";
import { isDbConfigured } from "@/health/db";
import { parseResendEvent, verifySvix } from "@/lib/growth/tracking-core";
import { recordEmailEvent } from "@/lib/growth/tracking";

export const dynamic = "force-dynamic";

// Resend email events (Resend → Webhooks): email.delivered, .bounced, .complained, .opened,
// .clicked. Signed with the webhook's signing secret, stored in RESEND_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const raw = await req.text();
  const h = req.headers;
  if (!verifySvix(secret, h.get("svix-id"), h.get("svix-timestamp"), h.get("svix-signature"), raw)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event;
  try {
    event = parseResendEvent(JSON.parse(raw));
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (event && isDbConfigured) {
    const e = event;
    after(() => recordEmailEvent(e).then(() => undefined).catch((err: Error) => console.error("[resend webhook]", e.type, err.message)));
  }
  return NextResponse.json({ ok: true });
}

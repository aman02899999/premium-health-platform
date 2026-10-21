import { NextResponse, after } from "next/server";
import { isDbConfigured } from "@/health/db";
import { handleInbound } from "@/lib/social/automation";
import { handleCall } from "@/lib/social/calls";
import { parseCalls, parseWebhook, type MetaWebhook } from "@/lib/social/inbound";
import { verifyMetaSignature } from "@/lib/social/meta";
import { parseStatuses } from "@/lib/growth/tracking-core";
import { recordWhatsAppStatus } from "@/lib/growth/tracking";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Meta webhooks for WhatsApp (fields "messages", including delivery/read statuses, and "calls") and Instagram (fields "messages" and "comments").
// Callback URL: https://<your-site>/api/webhooks/meta, verify token: META_VERIFY_TOKEN.

/** Meta's one-time check when the callback URL is saved. */
export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const token = process.env.META_VERIFY_TOKEN;
  if (token && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === token) {
    return new Response(q.get("hub.challenge") ?? "", { status: 200, headers: { "content-type": "text/plain" } });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let body: MetaWebhook;
  try {
    body = JSON.parse(raw) as MetaWebhook;
  } catch {
    return NextResponse.json({ ok: true });
  }
  const items = parseWebhook(body);
  const calls = parseCalls(body);
  const statuses = parseStatuses(body);
  // Answer Meta at once (it retries slow webhooks); replies go out after the response.
  if ((items.length || calls.length || statuses.length) && isDbConfigured) {
    after(async () => {
      for (const st of statuses) {
        await recordWhatsAppStatus(st).catch((err) => console.error("[meta webhook] status", st.status, (err as Error).message));
      }
      for (const m of items) {
        await handleInbound(m).catch((err) => console.error("[meta webhook]", m.channel, (err as Error).message));
      }
      for (const c of calls) {
        await handleCall(c)
          .then((r) => console.log("[meta webhook] call", c.event, c.direction, c.status, r))
          .catch((err) => console.error("[meta webhook] call", (err as Error).message));
      }
    });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { currentCustomer } from "@/lib/shop/server";
import { isPushEndpoint, parseSubscription } from "@/lib/push/core";
import { pushConfigured, vapidPublicKey } from "@/lib/push/send";
import { disableMemberSubscription, saveMemberSubscription } from "@/lib/push/store";

// Free app notifications for signed-in members: turn on or off in this browser.
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

async function gate() {
  const member = await currentCustomer();
  if (!member) return { error: json({ error: "Please sign in again." }, 401) };
  if (!pushConfigured() || !isDbConfigured) return { error: json({ error: "Notifications aren't switched on yet." }, 503) };
  return { member };
}

/** Whether notifications can be offered, and the public key the browser subscribes with. */
export async function GET() {
  if (!(await currentCustomer())) return json({ error: "Please sign in again." }, 401);
  const available = pushConfigured() && isDbConfigured;
  return json({ available, publicKey: available ? vapidPublicKey() : null });
}

/** Turn on: saves this browser's subscription ({ subscription }) for the member. */
export async function POST(req: Request) {
  const g = await gate();
  if (g.error) return g.error;
  const body = (await req.json().catch(() => null)) as { subscription?: unknown } | null;
  const sub = parseSubscription(body?.subscription);
  if (typeof sub === "string") return json({ error: sub }, 400);
  try {
    await saveMemberSubscription(g.member.email, sub, req.headers.get("user-agent") ?? "");
    return json({ ok: true });
  } catch (err) {
    console.error("[push] save failed:", (err as Error).message);
    return json({ error: "Couldn't turn notifications on. Please try again in a minute." }, 500);
  }
}

/** Turn off in this browser ({ endpoint }). The row is kept, marked off. */
export async function DELETE(req: Request) {
  const g = await gate();
  if (g.error) return g.error;
  const body = (await req.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string" || !isPushEndpoint(body.endpoint)) return json({ error: "Invalid request" }, 400);
  try {
    await disableMemberSubscription(g.member.email, body.endpoint);
    return json({ ok: true });
  } catch (err) {
    console.error("[push] disable failed:", (err as Error).message);
    return json({ error: "Couldn't turn notifications off. Please try again in a minute." }, 500);
  }
}

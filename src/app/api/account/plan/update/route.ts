import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { currentCustomer } from "@/lib/shop/server";
import { requestUpdate } from "@/lib/growth/client-plans";

export const dynamic = "force-dynamic";
// Builds the plan PDF on the server.
export const maxDuration = 60;

// The signed-in client asks for their next plan. Ownership, the package limits and the spacing
// between plans are all checked in requestUpdate; nothing from the browser is trusted.
export async function POST(req: Request) {
  const customer = await currentCustomer();
  if (!customer) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Plans are temporarily unavailable." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.orderId !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const r = await requestUpdate(customer, body.orderId, body);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true, version: r.version.version, review: r.review });
  } catch (err) {
    console.error("[account/plan] update failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't build your plan. Please try again in a minute." }, { status: 500 });
  }
}

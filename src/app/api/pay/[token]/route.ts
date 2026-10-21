import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isToken } from "@/lib/payments/requests-core";
import { startRequestOrder } from "@/lib/payments/requests";

// Step 1 of paying a WhatsApp payment link: the Razorpay order for it (created once, then reused).
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isDbConfigured || !isToken(token)) return NextResponse.json({ error: "This payment link doesn't exist." }, { status: 404 });
  try {
    const r = await startRequestOrder(token);
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: r.status });
  } catch (err) {
    console.error("[pay] order:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't start the payment. Please try again in a minute." }, { status: 502 });
  }
}

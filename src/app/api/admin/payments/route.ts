import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/payments/orders";
import { flaggedEvents } from "@/lib/payments/ledger";
import { razorpayConfigured } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // Flagged webhook events (refused captures, double payments, refunds, chargebacks) cover every product, not just memberships.
    const [orders, flagged] = await Promise.all([listOrders(), flaggedEvents().catch(() => [])]);
    return NextResponse.json({ configured: razorpayConfigured(), orders, flagged });
  } catch (err) {
    console.error("[payments] list failed:", (err as Error).message);
    return NextResponse.json({ configured: razorpayConfigured(), orders: [], error: "Couldn't load payments from the database." });
  }
}

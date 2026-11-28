import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/payments/orders";
import { flaggedEvents, unconfirmedCheckouts } from "@/lib/payments/ledger";
import { razorpayConfigured, razorpayKeyId } from "@/lib/payments/razorpay";
import { reconcilePayments } from "@/lib/payments/reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // Flagged webhook events (refused captures, double payments, refunds, chargebacks) cover every product, not just memberships.
    // Unconfirmed checkouts (all products, last 3 days) show a payment the site hasn't recorded yet.
    const [orders, flagged, waiting] = await Promise.all([listOrders(), flaggedEvents().catch(() => []), unconfirmedCheckouts().catch(() => [])]);
    // The Key ID is public (every checkout sends it to the browser); shown so the owner can match it
    // to the Razorpay account and mode it belongs to. The secret never leaves the server.
    return NextResponse.json({ configured: razorpayConfigured(), keyId: razorpayKeyId(), orders, flagged, waiting });
  } catch (err) {
    console.error("[payments] list failed:", (err as Error).message);
    return NextResponse.json({ configured: razorpayConfigured(), orders: [], error: "Couldn't load payments from the database." });
  }
}

// "Check Razorpay now": asks Razorpay (read-only) about every unconfirmed checkout from the last
// 3 days and records any captured payment, exactly as the scheduled check does. Never charges or refunds.
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!razorpayConfigured()) return NextResponse.json({ error: "Razorpay keys are not set on the server." }, { status: 503 });
  const result = await reconcilePayments(new Date(), { minAgeMinutes: 2, maxAgeHours: 72 }).catch((err: Error) => ({ checked: 0, recovered: [], mismatched: [], errors: [err.message] }));
  return NextResponse.json(result);
}

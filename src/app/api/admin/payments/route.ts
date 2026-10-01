import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/payments/orders";
import { razorpayConfigured } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ configured: razorpayConfigured(), orders: await listOrders() });
  } catch (err) {
    console.error("[payments] list failed:", (err as Error).message);
    return NextResponse.json({ configured: razorpayConfigured(), orders: [], error: "Couldn't load payments from the database." });
  }
}

import { NextResponse } from "next/server";
import { currentCustomer } from "@/lib/shop/server";
import { ordersForCustomer } from "@/lib/shop/store";

export const dynamic = "force-dynamic";

/** The signed-in customer's orders (matched by account or email). */
export async function GET() {
  const me = await currentCustomer().catch(() => null);
  if (!me) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const orders = await ordersForCustomer(me.id, me.email);
    return NextResponse.json({ email: me.email, orders: orders.map(({ adminNotes: _a, razorpayOrderId: _r, ...o }) => o) });
  } catch (err) {
    console.error("[shop] my-orders failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load your orders right now." }, { status: 500 });
  }
}

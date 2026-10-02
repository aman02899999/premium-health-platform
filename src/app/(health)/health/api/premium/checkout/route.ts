import { NextRequest, NextResponse } from "next/server";
import { healthPaymentsLive, paymentsUnavailable } from "@/health/lib/monetization/live-guard";

export const dynamic = "force-dynamic";

/**
 * Premium checkout — earning platform
 * Mock Razorpay/UPI — in prod integrate Razorpay Orders API
 * SSO optimized: requires auth cookie
 */

export async function POST(req: NextRequest) {
  if (!healthPaymentsLive()) return paymentsUnavailable();
  try {
    const body = await req.json();
    const { plan, email, utm } = body as { plan?: "monthly" | "yearly" | "lifetime"; email?: string; utm?: Record<string, string> };

    if (!plan) return NextResponse.json({ ok: false, error: "plan required: monthly/yearly/lifetime" }, { status: 400 });

    const prices: Record<string, { amount: number; display: string; days: number }> = {
      monthly: { amount: 19900, display: "Rs 199/mo", days: 30 },
      yearly: { amount: 199900, display: "Rs 1999/year (save 16%)", days: 365 },
      lifetime: { amount: 499900, display: "Rs 4999 lifetime", days: 365 * 10 },
    };

    const selected = prices[plan];
    if (!selected) return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });

    // Mock order — in prod: Razorpay orders.create({ amount, currency: "INR", receipt })
    const order = {
      id: `order_${Date.now()}`,
      plan,
      amount: selected.amount,
      amountDisplay: selected.display,
      currency: "INR",
      status: "created",
      email,
      utm,
      createdAt: new Date().toISOString(),
      // Mock Razorpay
      razorpayOrderId: `rzp_mock_${Date.now()}`,
      checkoutUrl: `/health/premium?order=${Date.now()}&plan=${plan}&demo=1`,
      message: "Payment gateway not connected yet — no charge made and premium is not activated.",
    };

    // Premium is granted only by a verified payment writing health.premium_subscriptions;
    // creating an order never unlocks anything.
    const res = NextResponse.json({ ok: true, order });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Checkout failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/health/api/premium/checkout",
    method: "POST",
    body: { plan: "monthly|yearly|lifetime", email: "optional", utm: "object" },
    plans: {
      monthly: { price: "Rs 199", amount: 19900, saving: "0%" },
      yearly: { price: "Rs 1999", amount: 199900, saving: "16%" },
      lifetime: { price: "Rs 4999", amount: 499900, saving: "79%" },
    },
    integration: "Razorpay Orders API + Webhook /api/premium/webhook (to be implemented)",
    seo: "Premium is earning pillar — MRR, LTV",
  });
}

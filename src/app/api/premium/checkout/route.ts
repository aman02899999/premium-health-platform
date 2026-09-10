import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Premium checkout — earning platform
 * Mock Razorpay/UPI — in prod integrate Razorpay Orders API
 * SSO optimized: requires auth cookie
 */

export async function POST(req: NextRequest) {
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
      checkoutUrl: `/premium?order=${Date.now()}&plan=${plan}&demo=1`,
      message: "Demo checkout — in prod redirect to Razorpay/UPI",
    };

    // In prod: set cookie for premium after payment webhook
    const res = NextResponse.json({ ok: true, order });
    // For demo: set premium cookie if email matches session
    if (email) {
      try {
        const sessionCookie = req.cookies.get("bhg_session")?.value;
        if (sessionCookie) {
          const user = JSON.parse(decodeURIComponent(sessionCookie));
          if (user.email.toLowerCase() === email.toLowerCase()) {
            const premiumUser = {
              ...user,
              role: "premium",
              premiumUntil: new Date(Date.now() + selected.days * 24 * 60 * 60 * 1000).toISOString(),
            };
            res.cookies.set("bhg_session", encodeURIComponent(JSON.stringify(premiumUser)), {
              path: "/",
              maxAge: 60 * 60 * 24 * 30,
              sameSite: "lax",
            });
          }
        }
      } catch {}
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Checkout failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/premium/checkout",
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

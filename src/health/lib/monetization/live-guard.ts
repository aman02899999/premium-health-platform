import { NextResponse } from "next/server";

/**
 * The Premium Health Platform has no real payment integration yet: its provider layer
 * creates mock orders and simulates verification. On the live site every health payment
 * endpoint must therefore refuse, so nobody can be charged for — or unlock — anything
 * through a simulated flow. (Royal Fitness Club's Razorpay checkout is separate and real.)
 */
export const healthPaymentsLive = (env: Record<string, string | undefined> = process.env) => env.VERCEL_ENV !== "production";

export function paymentsUnavailable() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "online_payments_unavailable",
        message: "Online payment isn't available on Premium Health Platform yet. Message us on WhatsApp (+91 88518 30081) and we'll help.",
        status: 503,
      },
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

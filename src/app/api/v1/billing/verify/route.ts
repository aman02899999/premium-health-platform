import { NextRequest, NextResponse } from "next/server";
import { readSessionIdentity } from "@/lib/saas/session";
import { paymentAttestation, settleApiSubscription } from "@/lib/saas/billing";
import { getPaymentProvider } from "@/lib/monetization/payment";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/billing/verify — settle a pending API subscription.
 *
 * Body: { subscriptionId, paymentId, signature? }
 *
 * Two gates must both pass before a plan is granted:
 *   1. The payment provider abstraction must verify the payment (signature check
 *      for Razorpay; simulated for the sandbox provider).
 *   2. The configured provider must be able to attest the charge at all. A
 *      Razorpay deployment missing its secrets verifies everything with the mock
 *      fallback — that path is refused here, because "asked for real billing,
 *      silently got a demo upgrade" is exactly the bug worth failing closed on.
 */
export async function POST(req: NextRequest) {
  const identity = readSessionIdentity(req);
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorised", message: "Sign in to verify a payment.", status: 401 } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: { subscriptionId?: unknown; paymentId?: unknown; signature?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    /* handled below */
  }

  const subscriptionId = typeof body.subscriptionId === "string" ? body.subscriptionId : "";
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  const signature = typeof body.signature === "string" ? body.signature : undefined;

  if (!subscriptionId || !paymentId) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "invalid_request", message: "subscriptionId and paymentId are required.", status: 400 },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const attestation = paymentAttestation();
  const provider = getPaymentProvider(attestation.provider);
  const verification = await provider.verifyPayment({
    orderId: subscriptionId,
    paymentId,
    signature,
    provider: attestation.provider,
  });

  const settlement = {
    // A signature-verified charge from a provider that holds real secrets.
    attested: attestation.attested && verification.verified,
    // The sandbox provider is allowed to activate a plan, but only as demo.
    demo: attestation.simulated && attestation.provider === "mock" && verification.verified,
    providerSubscriptionId: verification.paymentId ?? null,
  };

  const result = await settleApiSubscription(subscriptionId, identity, settlement);

  if (!result.activated) {
    const status = result.reason === "not_found" ? 404 : result.reason === "cancelled" ? 409 : 402;
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: result.reason === "not_found" ? "not_found" : "payment_not_attested",
          message:
            result.reason === "not_found"
              ? "No such subscription for this account."
              : result.reason === "cancelled"
                ? "This subscription was cancelled — start a new checkout."
                : `Payment could not be attested (${attestation.reason}). No plan change was applied.`,
          status,
        },
        data: { verified: verification.verified, provider: attestation.provider },
      },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        subscription: result.subscription,
        demo: result.subscription?.demo ?? false,
        invoicePaid: result.subscription?.invoicePaid ?? false,
        note: result.subscription?.demo
          ? "Sandbox activation: plan granted, recorded as demo, not counted as revenue."
          : "Payment attested — keys on this account now carry the subscribed plan.",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

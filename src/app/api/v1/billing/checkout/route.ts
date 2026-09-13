import { NextRequest, NextResponse } from "next/server";
import { readSessionIdentity } from "@/lib/saas/session";
import { createApiSubscription, paymentAttestation } from "@/lib/saas/billing";
import { getPaymentProvider } from "@/lib/monetization/payment";
import { getPlan, isKnownPlan, type PlanId } from "@/lib/saas/plans";

export const dynamic = "force-dynamic";

const SELF_SERVE_PLANS: PlanId[] = ["starter", "pro"];

/**
 * POST /api/v1/billing/checkout — start a subscription checkout.
 *
 * Creates a provider order and a `past_due` subscription. No quota is granted
 * here: entitlement only moves when POST /api/v1/billing/verify settles a
 * payment, which is why a failed or abandoned checkout cannot upgrade anyone.
 *
 * Fails closed when real billing is requested (PAYMENT_PROVIDER=razorpay) but the
 * provider secrets are missing — the underlying payment stack would silently
 * verify with the mock in that state, so we refuse the checkout instead.
 */
export async function POST(req: NextRequest) {
  const identity = readSessionIdentity(req);
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorised", message: "Sign in to subscribe.", status: 401 } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: { plan?: unknown; utm?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    /* handled below */
  }

  const requested = typeof body.plan === "string" ? body.plan.toLowerCase() : "";
  if (!isKnownPlan(requested)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message: `plan must be one of: ${SELF_SERVE_PLANS.join(", ")}`,
          status: 400,
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const planId = requested as PlanId;
  if (!SELF_SERVE_PLANS.includes(planId)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_request",
          message:
            planId === "enterprise"
              ? "Enterprise is contract-based — contact sales via /partner-with-us."
              : "The Free plan needs no checkout: create a key and start calling the API.",
          status: 400,
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const attestation = paymentAttestation();
  if (attestation.provider === "razorpay" && !attestation.attested) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "payment_provider_unconfigured",
          message: `Real billing is enabled but not configured (${attestation.reason}). Set the Razorpay secrets, or unset PAYMENT_PROVIDER to use the sandbox provider.`,
          status: 503,
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const plan = getPlan(planId);
  const provider = getPaymentProvider(attestation.provider);
  const order = await provider.createOrder({
    productId: `api-${planId}`,
    productType: "plan",
    amount: plan.pricePaise,
    currency: "INR",
    email: identity.ownerEmail ?? undefined,
    attribution: { page: "/developers", cta: "api-subscribe" },
  });

  const subscription = await createApiSubscription({
    ownerId: identity.ownerId,
    ownerEmail: identity.ownerEmail,
    plan: planId,
    provider: attestation.provider,
    providerOrderId: order.providerOrderId ?? order.id,
    demo: attestation.simulated,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        subscription,
        order: {
          id: order.id,
          providerOrderId: order.providerOrderId ?? null,
          amountPaise: plan.pricePaise,
          currency: "INR",
          status: order.status,
          checkoutUrl: provider.getCheckoutUrl(order),
        },
        mode: attestation.attested ? "live" : "simulated",
        next: {
          step: "verify",
          endpoint: "/api/v1/billing/verify",
          body: { subscriptionId: subscription.subscriptionId, paymentId: "<provider payment id>" },
          note: attestation.attested
            ? "After the provider confirms the charge, post the payment id and its signature here."
            : "Sandbox provider: verification activates the plan but is recorded with demo: true and never counted as revenue.",
        },
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

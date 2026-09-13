import { NextRequest, NextResponse } from "next/server";
import { readSessionIdentity } from "@/lib/saas/session";
import {
  bestActive,
  cancelApiSubscription,
  listApiSubscriptions,
  paymentAttestation,
  resolvedAccountPlan,
  SUBSCRIPTION_PERIOD_DAYS,
} from "@/lib/saas/billing";
import { listOwnedKeys } from "@/lib/saas/keys";
import { getPlan, monthlyPriceLabel } from "@/lib/saas/plans";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/billing/subscription — the signed-in account's billing state.
 *
 * Session-authenticated (this powers the console, not the API: a caller with an
 * API key has no business reading someone's invoices). The response states
 * explicitly whether the configured payment provider can attest a real charge,
 * so the UI never presents a simulated upgrade as paid revenue.
 */
export async function GET(req: NextRequest) {
  const identity = readSessionIdentity(req);
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorised", message: "Sign in to view billing.", status: 401 } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const owner = { ownerId: identity.ownerId, ownerEmail: identity.ownerEmail };
  const [subscriptions, plan, keys] = await Promise.all([
    listApiSubscriptions(owner),
    resolvedAccountPlan(owner),
    listOwnedKeys(identity.ownerId, identity.ownerEmail),
  ]);
  const active = bestActive(subscriptions);
  const planDef = getPlan(plan);
  const attestation = paymentAttestation();

  return NextResponse.json(
    {
      ok: true,
      data: {
        plan: {
          id: planDef.id,
          name: planDef.name,
          priceLabel: monthlyPriceLabel(planDef),
          requestsPerDay: planDef.requestsPerDay,
          requestsPerMinute: planDef.requestsPerMinute,
          bulkExport: planDef.bulkExport,
          attributionRequired: planDef.attributionRequired,
        },
        subscription: active,
        subscriptions,
        periodDays: SUBSCRIPTION_PERIOD_DAYS,
        billing: {
          provider: attestation.provider,
          realPaymentsEnabled: attestation.attested,
          mode: attestation.attested ? "live" : "simulated",
          reason: attestation.reason,
        },
        keys: {
          total: keys.length,
          active: keys.filter((k) => k.status === "active").length,
          onPlan: keys.filter((k) => k.status === "active" && k.plan === plan).length,
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}


/**
 * DELETE /api/v1/billing/subscription?subscriptionId=sub_… — cancel and downgrade.
 *
 * Cancellation releases the paid quota immediately and returns the account's live
 * keys to Free, so a cancelled subscription cannot keep spending someone else's
 * plan limits. Ownership is enforced inside the billing module (a subscription
 * belonging to another account reports 404, not 403, to avoid enumeration).
 */
export async function DELETE(req: NextRequest) {
  const identity = readSessionIdentity(req);
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorised", message: "Sign in to manage billing.", status: 401 } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const subscriptionId =
    req.nextUrl.searchParams.get("subscriptionId")?.trim() ||
    (await listApiSubscriptions({ ownerId: identity.ownerId, ownerEmail: identity.ownerEmail })).find(
      (s) => s.status === "active"
    )?.subscriptionId ||
    "";

  if (!subscriptionId) {
    return NextResponse.json(
      { ok: false, error: { code: "invalid_request", message: "subscriptionId is required.", status: 400 } },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const outcome = await cancelApiSubscription(subscriptionId, {
    ownerId: identity.ownerId,
    ownerEmail: identity.ownerEmail,
  });

  if (outcome === "not_found") {
    return NextResponse.json(
      { ok: false, error: { code: "not_found", message: "No such subscription for this account.", status: 404 } },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        outcome,
        note:
          outcome === "already_cancelled"
            ? "Already cancelled — nothing changed."
            : "Subscription cancelled and this account's active keys returned to the Free plan.",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

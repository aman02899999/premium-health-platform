import { NextRequest, NextResponse } from "next/server";
import { createApiKey, listApiKeys } from "@/lib/saas/keys";
import { readSessionIdentity } from "@/lib/saas/session";
import { resolvedAccountPlan } from "@/lib/saas/billing";
import { API_PLANS, isKnownPlan, planRank, type PlanId } from "@/lib/saas/plans";

export const dynamic = "force-dynamic";

const unauthorised = () =>
  NextResponse.json(
    {
      ok: false,
      error: {
        code: "unauthorised",
        message: "Sign in to manage API keys.",
        status: 401,
      },
    },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );

/**
 * GET /api/v1/keys — list the signed-in account's keys.
 * Only prefixes are returned; the plaintext key exists solely in the create response.
 */
export async function GET(req: NextRequest) {
  const identity = readSessionIdentity(req);
  if (!identity) return unauthorised();

  const keys = await listApiKeys({ ownerId: identity.ownerId, ownerEmail: identity.ownerEmail });
  return NextResponse.json(
    { ok: true, data: { keys, total: keys.length, plans: API_PLANS.map((p) => p.id) } },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * POST /api/v1/keys — create a key. The plaintext value is returned exactly once.
 *
 * The plan is never taken from the request body: a client cannot promote itself.
 * It comes from the account's active subscription (see src/lib/saas/billing.ts),
 * falling back to Free — so keys created during a paid period inherit that plan.
 */
export async function POST(req: NextRequest) {
  const identity = readSessionIdentity(req);
  if (!identity) return unauthorised();

  let body: { name?: unknown; environment?: unknown; plan?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    /* empty body is fine — defaults apply */
  }

  // Plan comes from the subscription, never from the request — even if the client
  // sends one, it only selects among plans the account already pays for.
  const subscribed: PlanId = await resolvedAccountPlan({
    ownerId: identity.ownerId,
    ownerEmail: identity.ownerEmail,
  });
  const requested = typeof body.plan === "string" ? body.plan.toLowerCase() : "";
  // A key may be issued below the account's entitlement (handy for staging keys on
  // Free limits) but never above it.
  const plan: PlanId =
    isKnownPlan(requested) && planRank(requested) <= planRank(subscribed) ? (requested as PlanId) : subscribed;

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : undefined;
  const environment = body.environment === "test" ? "test" : "live";

  const { key, record } = await createApiKey({
    name: name || undefined,
    ownerId: identity.ownerId,
    ownerEmail: identity.ownerEmail,
    plan,
    environment,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        key,
        record,
        warning: "Copy this key now — it is stored only as a hash and cannot be shown again.",
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

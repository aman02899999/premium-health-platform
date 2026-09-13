import { NextRequest, NextResponse } from "next/server";
import { listOwnedKeys } from "@/lib/saas/keys";
import { getUsage } from "@/lib/saas/metering";
import { readSessionIdentity } from "@/lib/saas/session";
import { getPlan, isUnlimited } from "@/lib/saas/plans";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/keys/usage — quota consumption for every key on the signed-in
 * account, plus account totals. Session-authenticated (the per-key
 * /api/v1/usage endpoint is for the key holder, this one is for the dashboard).
 */
export async function GET(req: NextRequest) {
  const identity = readSessionIdentity(req);
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorised", message: "Sign in to view usage.", status: 401 } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const keys = await listOwnedKeys(identity.ownerId, identity.ownerEmail);

  const usage = await Promise.all(
    keys.map(async (key) => {
      const plan = getPlan(key.plan);
      const snapshot = await getUsage(key.keyId, plan);
      return {
        keyId: key.keyId,
        name: key.name,
        plan: key.plan,
        status: key.status,
        requestsToday: snapshot.requests,
        errorsToday: snapshot.errors,
        limitPerDay: isUnlimited(plan.requestsPerDay) ? "unlimited" : plan.requestsPerDay,
        remainingToday: snapshot.unlimited ? "unlimited" : snapshot.remaining,
        percentUsed: snapshot.percentUsed,
        resetsAt: snapshot.resetAt,
        topEndpoints: Object.entries(snapshot.byEndpoint)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([endpoint, requests]) => ({ endpoint, requests })),
      };
    })
  );

  return NextResponse.json(
    {
      ok: true,
      data: {
        keys: usage,
        totals: {
          keys: keys.length,
          activeKeys: keys.filter((k) => k.status === "active").length,
          requestsToday: usage.reduce((sum, u) => sum + u.requestsToday, 0),
          errorsToday: usage.reduce((sum, u) => sum + u.errorsToday, 0),
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

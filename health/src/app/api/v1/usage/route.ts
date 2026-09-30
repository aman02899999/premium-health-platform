import { apiSuccess } from "@/lib/saas/auth";
import { keyedRoute } from "@/lib/saas/handler";
import { isUnlimited } from "@/lib/saas/plans";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/usage
 * Requires an API key. Reports quota consumption for the key that made the
 * request, including a per-endpoint breakdown.
 */
export const GET = keyedRoute(async (_req, { auth }) => {
  const { plan, usage, key } = auth;

  const topEndpoints = Object.entries(usage.byEndpoint)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, requests]) => ({ endpoint, requests }));

  return apiSuccess(
    {
      keyId: key.keyId,
      keyName: key.name,
      plan: plan.id,
      planName: plan.name,
      day: usage.day,
      requestsToday: usage.requests,
      errorsToday: usage.errors,
      limitPerDay: isUnlimited(plan.requestsPerDay) ? "unlimited" : plan.requestsPerDay,
      remainingToday: usage.unlimited ? "unlimited" : usage.remaining,
      percentUsed: usage.percentUsed,
      limitPerMinute: isUnlimited(plan.requestsPerMinute) ? "unlimited" : plan.requestsPerMinute,
      resetsAt: usage.resetAt,
      topEndpoints,
      upgradeUrl: "/developers#pricing",
    },
    auth
  );
});

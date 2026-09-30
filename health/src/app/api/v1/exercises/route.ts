import { apiSuccess } from "@/lib/saas/auth";
import { intParam, keyedRoute, requireQuery } from "@/lib/saas/handler";
import { wgerProvider } from "@/services/health/providers/wger/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/exercises?q=squat&limit=10
 * Requires an API key. Exercise library with muscles and equipment (wger).
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const query = requireQuery(url) ?? "squat";
  const limit = intParam(url, "limit", 10, 1, 20);
  const result = await wgerProvider.search({ query, limit });

  return apiSuccess(
    {
      results: result.data,
      total: result.total,
      provider: result.source,
      live: result.live,
      attribution: "wger.de (AGPL-3.0)",
    },
    auth,
    {},
    86_400
  );
});

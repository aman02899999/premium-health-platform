import { apiSuccess } from "@/lib/saas/auth";
import { intParam, keyedRoute, requireQuery } from "@/lib/saas/handler";
import { fruityviceProvider } from "@/services/health/providers/fruityvice/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/nutrition/fruit?name=mango
 * Requires an API key. Per-100g nutrition for fruit (Fruityvice).
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const name = requireQuery(url, "name") ?? requireQuery(url);
  if (!name) {
    return apiSuccess({ results: [], total: 0, message: "Provide ?name=<fruit>" }, auth, {}, 0);
  }

  const limit = intParam(url, "limit", 10, 1, 30);
  const result = await fruityviceProvider.search({ query: name, limit });

  return apiSuccess(
    {
      results: result.data,
      total: result.total,
      provider: result.source,
      live: result.live,
      attribution: "Fruityvice (https://www.fruityvice.com)",
    },
    auth,
    {},
    86_400
  );
});

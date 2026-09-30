import { apiSuccess } from "@/lib/saas/auth";
import { intParam, keyedRoute, requireQuery } from "@/lib/saas/handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/food/search?q=millet&limit=10
 * Requires an API key. Proxies the registry's food providers (Open Food Facts
 * first, USDA as fallback) and returns normalised nutrition records.
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const query = requireQuery(url);
  if (!query) {
    return apiSuccess({ results: [], total: 0, message: "Provide ?q=<food name>" }, auth, {}, 0);
  }

  const limit = intParam(url, "limit", 10, 1, 20);
  const { openFoodFactsProvider } = await import("@/services/health/providers/openfoodfacts/provider");
  const { usdaProvider } = await import("@/services/health/providers/usda/provider");

  let result = await openFoodFactsProvider.search({ query, limit });
  let provider = "Open Food Facts";

  if (result.data.length === 0) {
    const usda = await usdaProvider.search({ query, limit }).catch(() => null);
    if (usda && usda.data.length > 0) {
      result = usda;
      provider = "USDA FoodData Central";
    }
  }

  return apiSuccess(
    {
      results: result.data,
      total: result.total,
      provider,
      live: result.live,
      cached: result.cached,
    },
    auth,
    {},
    3600
  );
});

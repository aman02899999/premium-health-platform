import { apiSuccess } from "@/lib/saas/auth";
import { intParam, keyedRoute, requireQuery } from "@/lib/saas/handler";
import { europePmcProvider } from "@/services/health/providers/europepmc/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/literature/search?q=millet%20glycemic&limit=10
 * Requires an API key. Europe PMC: peer-reviewed literature with abstracts,
 * citation counts and DOIs.
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const query = requireQuery(url);
  if (!query) {
    return apiSuccess({ results: [], total: 0, message: "Provide ?q=<search terms>" }, auth, {}, 0);
  }

  const limit = intParam(url, "limit", 10, 1, 25);
  const offset = intParam(url, "offset", 0, 0, 10_000);
  const result = await europePmcProvider.search({ query, limit, offset });

  return apiSuccess(
    {
      results: result.data,
      total: result.total,
      limit,
      offset,
      hasMore: result.hasMore,
      provider: result.source,
      live: result.live,
      attribution: "Europe PMC (https://europepmc.org)",
    },
    auth,
    {},
    3600
  );
});

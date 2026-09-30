import { apiSuccess } from "@/lib/saas/auth";
import { intParam, keyedRoute, requireQuery } from "@/lib/saas/handler";
import { openAlexProvider } from "@/services/health/providers/openalex/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/scholarly/search?q=intermittent%20fasting&limit=10
 * Requires an API key. OpenAlex (CC0): works, authors, citation counts and
 * open-access links.
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const query = requireQuery(url);
  if (!query) {
    return apiSuccess({ results: [], total: 0, message: "Provide ?q=<topic or author>" }, auth, {}, 0);
  }

  const limit = intParam(url, "limit", 10, 1, 25);
  const offset = intParam(url, "offset", 0, 0, 10_000);
  const result = await openAlexProvider.search({ query, limit, offset });

  return apiSuccess(
    {
      results: result.data,
      total: result.total,
      limit,
      offset,
      hasMore: result.hasMore,
      provider: result.source,
      live: result.live,
      attribution: "OpenAlex (CC0, https://openalex.org)",
    },
    auth,
    {},
    3600
  );
});

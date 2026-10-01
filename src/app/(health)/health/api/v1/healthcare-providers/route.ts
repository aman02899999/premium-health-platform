import { apiSuccess } from "@/health/lib/saas/auth";
import { intParam, keyedRoute } from "@/health/lib/saas/handler";
import { nppesProvider } from "@/health/services/health/providers/nppes/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/healthcare-providers?q=sharma&state=NY&limit=10
 * Requires an API key. NPPES NPI Registry (CMS): registered healthcare providers
 * with speciality, practice address and registration status.
 *
 * A query is required — the registry does not support "list everything", and an
 * unfiltered page would be meaningless.
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const query = (url.searchParams.get("q") ?? url.searchParams.get("name") ?? "").trim();
  const state = (url.searchParams.get("state") ?? "").trim();
  const limit = intParam(url, "limit", 10, 1, 25);

  if (!query && !state) {
    return apiSuccess(
      {
        results: [],
        total: 0,
        message: "Provide ?q=<name> and/or ?state=<two-letter code>.",
      },
      auth,
      {},
      0
    );
  }

  const result = await nppesProvider.search({ query, limit, filters: { state } });

  return apiSuccess(
    {
      results: result.data,
      total: result.total,
      limit,
      hasMore: result.hasMore,
      provider: result.source,
      live: result.live,
      coverage: "United States (CMS NPPES) — not Indian provider data",
      attribution: "Centers for Medicare & Medicaid Services, NPPES public registry",
    },
    auth,
    {},
    86_400
  );
});

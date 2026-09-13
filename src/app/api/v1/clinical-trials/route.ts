import { apiSuccess } from "@/lib/saas/auth";
import { intParam, keyedRoute, requireQuery } from "@/lib/saas/handler";
import { clinicalTrialsProvider } from "@/services/health/providers/clinicaltrials/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/clinical-trials?q=diabetes&limit=10
 * Requires an API key. Registered trials with phase, status and locations
 * (ClinicalTrials.gov — public domain).
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const query = requireQuery(url);
  if (!query) {
    return apiSuccess({ results: [], total: 0, message: "Provide ?q=<condition or intervention>" }, auth, {}, 0);
  }

  const limit = intParam(url, "limit", 10, 1, 20);
  const result = await clinicalTrialsProvider.search({ query, limit });

  return apiSuccess(
    {
      results: result.data,
      total: result.total,
      provider: result.source,
      live: result.live,
      attribution: "ClinicalTrials.gov (US NLM, public domain)",
    },
    auth,
    {},
    3600
  );
});

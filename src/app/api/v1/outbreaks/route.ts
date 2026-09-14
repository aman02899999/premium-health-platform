import { apiSuccess } from "@/lib/saas/auth";
import { keyedRoute } from "@/lib/saas/handler";
import { openDiseaseProvider } from "@/services/health/providers/opendisease/provider";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/outbreaks?country=india
 * Requires an API key. Tracked outbreak totals (cases, deaths, recoveries,
 * testing) for a country, or worldwide when no country is given.
 *
 * Note on honesty: this reflects the upstream aggregator's most recent update,
 * not real-time reporting. `sourceUpdatedAt` is the upstream timestamp and is
 * deliberately separate from the request time — an outbreak number without its
 * as-of date is misleading.
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const country = (url.searchParams.get("country") ?? url.searchParams.get("q") ?? "").trim();
  const result = await openDiseaseProvider.search({ query: country, limit: 1 });

  return apiSuccess(
    {
      results: result.data,
      total: result.total,
      provider: result.source,
      live: result.live,
      scope: country || "Worldwide",
      attribution: "disease.sh · data: Johns Hopkins CSSE, WHO",
      notice:
        "Figures are as reported by the upstream aggregator; compare `sourceUpdatedAt` before drawing conclusions.",
    },
    auth,
    {},
    900
  );
});

import { apiSuccess } from "@/lib/saas/auth";
import { keyedRoute } from "@/lib/saas/handler";
import { worldBankProvider } from "@/services/health/providers/worldbank/provider";

export const dynamic = "force-dynamic";

const DEFAULT_INDICATORS = ["SP.DYN.LE00.IN", "SH.XPD.CHEX.GD.ZS", "SH.DYN.MORT"];

/**
 * GET /api/v1/indicators?country=IN&indicator=SP.DYN.LE00.IN
 * Requires an API key. Country-level health indicators (World Bank Open Data).
 */
export const GET = keyedRoute(async (_req, { auth, url }) => {
  const country = (url.searchParams.get("country") || "IN").toUpperCase().slice(0, 3);
  const requested = (url.searchParams.get("indicator") || "").trim();
  const indicators = requested ? [requested.slice(0, 40)] : DEFAULT_INDICATORS;

  const settled = await Promise.allSettled(
    indicators.map((indicator) => worldBankProvider.search({ query: indicator, filters: { country, indicator } }))
  );

  const results = settled
    .map((outcome, index) => {
      if (outcome.status !== "fulfilled") return null;
      const data = outcome.value.data as unknown[];
      return { indicator: indicators[index], data, live: outcome.value.live };
    })
    .filter(Boolean);

  const anyLive = results.some((r) => r?.live);

  return apiSuccess(
    {
      country,
      indicators: results,
      live: anyLive,
      note: anyLive ? undefined : "World Bank is unreachable right now — no indicator values were returned.",
      attribution: "World Bank Open Data (CC BY 4.0)",
    },
    auth,
    {},
    86_400
  );
});

import { NextResponse } from "next/server";
import { API_PLANS, formatQuota, monthlyPriceLabel } from "@/lib/saas/plans";

export const revalidate = 3600;

/**
 * GET /api/v1/plans — public. Plan catalogue with quotas and prices, so pricing
 * can be rendered from one source of truth by any client.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      data: {
        plans: API_PLANS.map((plan) => ({
          id: plan.id,
          name: plan.name,
          tagline: plan.tagline,
          pricePaise: plan.pricePaise,
          priceLabel: monthlyPriceLabel(plan),
          currency: plan.currency,
          requestsPerDay: plan.requestsPerDay,
          requestsPerDayLabel: formatQuota(plan.requestsPerDay),
          requestsPerMinute: plan.requestsPerMinute,
          requestsPerMinuteLabel: formatQuota(plan.requestsPerMinute),
          bulkExport: plan.bulkExport,
          attributionRequired: plan.attributionRequired,
          support: plan.support,
          sla: plan.sla,
          features: plan.features,
        })),
        currency: "INR",
        docs: "/developers/docs",
      },
      meta: { generatedAt: new Date().toISOString() },
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600", "X-API-Version": "v1" } }
  );
}

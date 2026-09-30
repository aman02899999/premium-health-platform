import { NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/saas/endpoints";
import { API_PLANS, monthlyPriceLabel } from "@/lib/saas/plans";

export const revalidate = 3600;

/**
 * GET /api/v1 — the API index. Public: describes the surface (and how to get a
 * key) without requiring one, so a new developer can discover it from a single
 * curl rather than the docs page.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      data: {
        name: "Bharat Health Guide Data API",
        version: "v1",
        description:
          "India-focused health, nutrition and research data aggregated from open, licence-clean sources.",
        authentication: {
          header: "x-api-key",
          alternative: "Authorization: Bearer <key>",
          getKey: "/developers/dashboard",
          docs: "/developers/docs",
        },
        responseShape: {
          success: { ok: true, meta: { plan: "free", quota: { requestsToday: 0, remainingToday: 1000 } }, data: "..." },
          error: { ok: false, error: { code: "invalid_api_key", message: "...", docs: "https://…/developers/docs" } },
        },
        rateLimitHeaders: [
          "X-RateLimit-Limit-Day",
          "X-RateLimit-Remaining-Day",
          "X-RateLimit-Limit-Minute",
          "X-RateLimit-Remaining-Minute",
          "X-RateLimit-Reset",
          "Retry-After (429 only)",
        ],
        endpoints: API_ENDPOINTS.map((e) => ({
          method: e.method,
          path: e.path,
          title: e.title,
          auth: e.auth,
          source: e.source?.name,
        })),
        plans: API_PLANS.map((p) => ({
          id: p.id,
          name: p.name,
          price: monthlyPriceLabel(p),
          requestsPerDay: p.requestsPerDay,
          requestsPerMinute: p.requestsPerMinute,
        })),
        openapi: "/api/v1/openapi.json",
      },
      meta: { generatedAt: new Date().toISOString() },
    },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400", "X-API-Version": "v1" } }
  );
}

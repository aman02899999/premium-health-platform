import { NextResponse } from "next/server";
import { openApiDocument } from "@/health/lib/saas/endpoints";
import { SITE } from "@/health/lib/site";

export const revalidate = 86400; // 1 day: ISR writes are capped on Vercel Hobby (see src/lib/isr-budget.test.ts)

/**
 * GET /api/v1/openapi.json — public OpenAPI 3.1 document.
 * Generated from src/lib/saas/endpoints.ts, so it cannot drift from the routes.
 */
export async function GET() {
  return NextResponse.json(openApiDocument(SITE.url), {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-API-Version": "v1",
    },
  });
}

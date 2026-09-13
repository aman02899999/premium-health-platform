import { NextResponse } from "next/server";
import { openApiDocument } from "@/lib/saas/endpoints";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

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

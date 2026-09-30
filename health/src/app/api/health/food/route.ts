import { NextResponse } from "next/server";
import { openFoodFactsProvider } from "@/services/health/providers/openfoodfacts/provider";
import { usdaProvider } from "@/services/health/providers/usda/provider";
import { rateLimitFromRequest } from "@/services/health/cache/rate-limit";

export const revalidate = 0;

export async function GET(req: Request) {
  const rl = rateLimitFromRequest(req, 60);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 10)));
  const provider = searchParams.get("provider") || "openfoodfacts";

  if (!q) return NextResponse.json({ error: "Missing ?q=" }, { status: 400 });

  try {
    if (provider === "usda") {
      const res = await usdaProvider.search({ query: q, limit });
      return NextResponse.json(res, { headers: { "Cache-Control": "public, s-maxage=3600" } });
    }
    const res = await openFoodFactsProvider.search({ query: q, limit });
    return NextResponse.json(res, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Food search failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { unifiedHealthSearch } from "@/services/health/search";
import { cacheStats } from "@/services/health/cache";

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 5)));

  if (!q) return NextResponse.json({ error: "Missing ?q=" }, { status: 400 });

  try {
    const data = await unifiedHealthSearch({ query: q, limit });
    return NextResponse.json(
      { ...data, cache: cacheStats() },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status: 500 });
  }
}

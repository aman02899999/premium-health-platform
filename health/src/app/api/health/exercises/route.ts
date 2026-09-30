import { NextResponse } from "next/server";
import { wgerProvider } from "@/services/health/providers/wger/provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim() || "chest";
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") || 10)));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));

  try {
    const res = await wgerProvider.search({ query: q, limit, offset });
    return NextResponse.json(res, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Exercise search failed" }, { status: 500 });
  }
}

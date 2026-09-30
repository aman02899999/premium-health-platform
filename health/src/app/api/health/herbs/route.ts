import { NextResponse } from "next/server";
import { ayurvedaProvider } from "@/services/health/providers/ayurveda/provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim() || "ashwagandha";
  const limit = Math.min(30, Number(searchParams.get("limit") || 20));

  try {
    const res = await ayurvedaProvider.search({ query: q, limit });
    // merge with local herbs static data
    try {
      const { searchAll } = await import("@/lib/search-index");
      const local = searchAll(q, limit).filter((i: { type: string }) => i.type === "herb");
      return NextResponse.json({ ...res, local, combined: [...(res.data as unknown[]), ...local].slice(0, limit) });
    } catch {
      return NextResponse.json(res);
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Herb search failed" }, { status: 500 });
  }
}

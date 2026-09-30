import { NextResponse } from "next/server";
import { getIndiaHealthIndicators } from "@/lib/worldbank";

export const revalidate = 86400; // 24h

export async function GET() {
  try {
    const data = await getIndiaHealthIndicators();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ error: "World Bank data unavailable", live: false, indicators: [] }, { status: 503 });
  }
}

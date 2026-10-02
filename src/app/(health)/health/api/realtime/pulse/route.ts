import { NextResponse } from "next/server";
import { getIndiaPulse } from "@/health/lib/realtime";

// Dynamic so it is never frozen at build time; the CDN still caches it for 10 minutes.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pulse = await getIndiaPulse();
    return NextResponse.json(pulse, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ error: "Live data temporarily unavailable" }, { status: 503 });
  }
}

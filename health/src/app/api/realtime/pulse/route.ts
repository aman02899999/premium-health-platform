import { NextResponse } from "next/server";
import { getIndiaPulse } from "@/lib/realtime";

export const revalidate = 600;

export async function GET() {
  try {
    const pulse = await getIndiaPulse();
    return NextResponse.json(pulse, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ error: "Live data temporarily unavailable" }, { status: 503 });
  }
}

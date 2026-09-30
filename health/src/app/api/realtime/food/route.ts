import { NextResponse } from "next/server";
import { searchFoodLive } from "@/lib/realtime";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 60);
  if (!q) return NextResponse.json({ error: "Pass ?q=product name" }, { status: 400 });
  try {
    const data = await searchFoodLive(q);
    if (!data) return NextResponse.json({ found: false, query: q });
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  } catch {
    return NextResponse.json({ error: "Food lookup unavailable" }, { status: 503 });
  }
}

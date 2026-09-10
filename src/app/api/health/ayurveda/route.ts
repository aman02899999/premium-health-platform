import { NextResponse } from "next/server";
import { ayurvedaProvider } from "@/services/health/providers/ayurveda/provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim() || "ashwagandha";
  const limit = Math.min(30, Number(searchParams.get("limit") || 20));
  const res = await ayurvedaProvider.search({ query: q, limit });
  return NextResponse.json(res);
}

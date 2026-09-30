import { NextResponse } from "next/server";
import { homeopathyProvider } from "@/services/health/providers/homeopathy/provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim() || "arnica";
  const limit = Math.min(30, Number(searchParams.get("limit") || 20));
  const res = await homeopathyProvider.search({ query: q, limit });
  return NextResponse.json(res);
}

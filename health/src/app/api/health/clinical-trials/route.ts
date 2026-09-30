import { NextResponse } from "next/server";
import { clinicalTrialsProvider } from "@/services/health/providers/clinicaltrials/provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(20, Number(searchParams.get("limit") || 5));
  if (!q) return NextResponse.json({ error: "Missing ?q=" }, { status: 400 });
  const res = await clinicalTrialsProvider.search({ query: q, limit });
  return NextResponse.json(res);
}

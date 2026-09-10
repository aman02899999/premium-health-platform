import { NextResponse } from "next/server";
import { searchAll } from "@/lib/search-index";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(30, Number(searchParams.get("limit") || 20));
  if (!q) return NextResponse.json({ error: "Missing ?q=" }, { status: 400 });
  const results = searchAll(q, limit).filter((i: { type: string }) => i.type === "symptom" || i.type === "disease");
  return NextResponse.json({ query: q, data: results, total: results.length, source: "Local BHG index" });
}

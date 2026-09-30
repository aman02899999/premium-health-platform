import { NextResponse } from "next/server";
import { searchPubMed } from "@/lib/pubmed";

export const revalidate = 21600; // 6h

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || searchParams.get("disease") || "").trim().slice(0, 120);
  if (!q) return NextResponse.json({ error: "Pass ?q=disease name" }, { status: 400 });
  try {
    const data = await searchPubMed(q, 5);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ error: "PubMed lookup unavailable", live: false, query: q, articles: [] }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { searchAll } from "@/lib/search-index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ error: "Missing ?q=" }, { status: 400 });
  return NextResponse.json({ query: q, count: searchAll(q, 24).length, data: searchAll(q, 24) });
}

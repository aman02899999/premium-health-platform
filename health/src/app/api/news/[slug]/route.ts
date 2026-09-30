import { NextResponse } from "next/server";
import { getNewsItem } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getNewsItem(slug);
  if (!item) return NextResponse.json({ error: "News item not found" }, { status: 404 });
  return NextResponse.json({ data: item });
}

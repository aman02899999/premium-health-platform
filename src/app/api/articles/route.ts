import { NextResponse } from "next/server";
import { ARTICLES } from "@/data/editorial";

export async function GET() {
  return NextResponse.json({ count: ARTICLES.length, data: ARTICLES.map((a) => ({ slug: a.slug, title: a.title, category: a.category, excerpt: a.excerpt })) });
}

import { NextResponse } from "next/server";
import { parseCart } from "@/lib/shop/checkout";
import { quoteCart } from "@/lib/shop/pricing";
import { getCatalog } from "@/lib/shop/server";

export const dynamic = "force-dynamic";

/** Live prices and stock for the cart page. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { lines?: unknown } | null;
  const cat = await getCatalog();
  if (cat.offline) return NextResponse.json({ error: "The store is being updated — please try again in a minute." }, { status: 503 });
  return NextResponse.json({ quote: quoteCart(parseCart(body?.lines), cat.productById, cat.comboById, cat.settings) });
}

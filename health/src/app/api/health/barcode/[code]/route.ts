import { NextResponse } from "next/server";
import { openFoodFactsProvider } from "@/services/health/providers/openfoodfacts/provider";

export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!code) return NextResponse.json({ error: "Missing barcode" }, { status: 400 });
  if (!/^\d{8,14}$/.test(code)) return NextResponse.json({ error: "Invalid barcode format" }, { status: 400 });

  const data = await openFoodFactsProvider.getById(code);
  if (!data) return NextResponse.json({ found: false, barcode: code }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=86400" } });
}

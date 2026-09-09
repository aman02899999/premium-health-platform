import { NextResponse } from "next/server";
import { openFoodFactsProvider } from "@/services/health/providers/openfoodfacts/provider";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const data = await openFoodFactsProvider.getById(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

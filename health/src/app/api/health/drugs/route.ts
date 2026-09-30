import { NextResponse } from "next/server";
import { openFDAProvider } from "@/services/health/providers/openfda/provider";
import { rxNormProvider } from "@/services/health/providers/rxnorm/provider";
import { pubChemProvider } from "@/services/health/providers/pubchem/provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(20, Number(searchParams.get("limit") || 10));
  const provider = searchParams.get("provider") || "openfda";

  if (!q) return NextResponse.json({ error: "Missing ?q=" }, { status: 400 });

  try {
    if (provider === "rxnorm") {
      const res = await rxNormProvider.search({ query: q, limit });
      return NextResponse.json(res);
    }
    if (provider === "pubchem") {
      const res = await pubChemProvider.search({ query: q, limit });
      return NextResponse.json(res);
    }
    const res = await openFDAProvider.search({ query: q, limit });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Drug search failed" }, { status: 500 });
  }
}

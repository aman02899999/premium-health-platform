import { NextResponse } from "next/server";
import { icd10Provider } from "@/services/health/providers/icd10/provider";
import { snomedProvider } from "@/services/health/providers/snomed/provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(30, Number(searchParams.get("limit") || 20));
  const provider = searchParams.get("provider") || "icd10";

  if (!q) return NextResponse.json({ error: "Missing ?q=" }, { status: 400 });

  try {
    if (provider === "snomed") {
      const res = await snomedProvider.search({ query: q, limit });
      return NextResponse.json(res);
    }
    const res = await icd10Provider.search({ query: q, limit });
    // Also include local diseases from static data
    try {
      const { searchAll } = await import("@/lib/search-index");
      const local = searchAll(q, limit).filter((i: { type: string }) => i.type === "disease");
      return NextResponse.json({ ...res, local, combined: [...(res.data as unknown[]), ...local].slice(0, limit) });
    } catch {
      return NextResponse.json(res);
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Disease search failed" }, { status: 500 });
  }
}

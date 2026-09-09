import { NextResponse } from "next/server";
import { wgerProvider } from "@/services/health/providers/wger/provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(30, Number(searchParams.get("limit") || 20));

  // wger muscles endpoint
  const base = process.env.WGER_API_URL || "https://wger.de/api/v2";
  try {
    const res = await fetch(`${base}/muscle/`, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error("Failed to fetch muscles");
    const json = (await res.json()) as { results: { id: number; name: string; is_front: boolean }[] };
    let results = json.results;
    if (q) results = results.filter((m) => m.name.toLowerCase().includes(q));
    results = results.slice(0, limit);
    return NextResponse.json({
      data: results.map((m) => ({
        id: String(m.id),
        name: m.name,
        isFront: m.is_front,
        provenance: {
          source: "wger",
          source_id: String(m.id),
          source_url: `https://wger.de/api/v2/muscle/${m.id}/`,
          license: "AGPL-3.0",
          retrieved_at: new Date().toISOString(),
        },
      })),
      total: results.length,
      source: "wger",
      live: true,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

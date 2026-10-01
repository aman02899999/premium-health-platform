import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(30, Number(searchParams.get("limit") || 20));

  const base = process.env.WGER_API_URL || "https://wger.de/api/v2";
  try {
    const res = await fetch(`${base}/equipment/`, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error("Failed to fetch equipment");
    const json = (await res.json()) as { results: { id: number; name: string }[] };
    let results = json.results;
    if (q) results = results.filter((e) => e.name.toLowerCase().includes(q));
    results = results.slice(0, limit);
    return NextResponse.json({
      data: results.map((e) => ({
        id: String(e.id),
        name: e.name,
        provenance: {
          source: "wger",
          source_id: String(e.id),
          source_url: `https://wger.de/api/v2/equipment/${e.id}/`,
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

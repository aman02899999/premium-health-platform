import { NextResponse } from "next/server";
import { searchPubMed } from "@/lib/pubmed";
import { searchClinicalTrials } from "@/lib/clinicaltrials";

export const revalidate = 21600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || searchParams.get("disease") || "").trim().slice(0, 120);
  if (!q) return NextResponse.json({ error: "Pass ?q=disease name" }, { status: 400 });
  try {
    const [pubmed, trials] = await Promise.all([searchPubMed(q, 5), searchClinicalTrials(q, 5)]);
    return NextResponse.json(
      { query: q, pubmed, trials, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600" } }
    );
  } catch {
    return NextResponse.json({ error: "Research lookup unavailable", live: false, query: q }, { status: 503 });
  }
}

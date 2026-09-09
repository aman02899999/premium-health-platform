import { NextResponse } from "next/server";
import { DISEASES } from "@/data/diseases-index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const system = searchParams.get("system");
  const limit = Math.min(200, Number(searchParams.get("limit") || 120));
  let out = DISEASES;
  if (system) out = out.filter((d) => d.system === system);
  if (q) out = out.filter((d) => `${d.name} ${d.short}`.toLowerCase().includes(q));
  return NextResponse.json({ count: out.length, data: out.slice(0, limit) });
}

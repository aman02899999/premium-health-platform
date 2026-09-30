import { NextResponse } from "next/server";
import { getDrugLive } from "@/lib/realtime";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") || "").trim().slice(0, 60);
  if (!name) return NextResponse.json({ error: "Pass ?name=metformin" }, { status: 400 });
  try {
    const data = await getDrugLive(name);
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  } catch {
    return NextResponse.json({ error: "Drug lookup unavailable" }, { status: 503 });
  }
}

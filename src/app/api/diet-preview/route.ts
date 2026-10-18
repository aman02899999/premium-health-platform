import { NextResponse } from "next/server";
import { dietPreview, parsePreview } from "@/lib/diet-pro/preview";

// The free one-day diet preview. Nothing is stored; rate-limited so it can't be scraped.
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 20;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
  const input = parsePreview(body);
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
  return NextResponse.json(dietPreview(input));
}

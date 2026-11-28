import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { currentCustomer } from "@/lib/shop/server";
import { isLevel, monthOf } from "@/lib/challenge/levels";
import { leaderboard } from "@/lib/challenge/store";

// Leaderboard for one level and month. Signed-in players only (owner, 28 Nov); names are shown
// only for players who opted in, as first name + surname initial.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isDbConfigured) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const c = await currentCustomer();
  if (!c) return NextResponse.json({ error: "Please sign in to see the ranks." }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const level = q.get("level");
  const month = q.get("month") ?? monthOf();
  if (!isLevel(level) || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  return NextResponse.json({ level, month, ...(await leaderboard(level, month, c.id)) }, { headers: { "Cache-Control": "private, no-store" } });
}

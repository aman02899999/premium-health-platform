import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { nurtureBusiness } from "@/lib/growth/daily";
import { recordStatus } from "@/lib/growth/system-status";
import { runMonthPost, runSecondReel } from "@/lib/social/automation";

export const dynamic = "force-dynamic";
// The second Reel renders (~30 s) and waits for Instagram's processing (up to 2 min).
export const maxDuration = 300;

// The month plan's extra posts (vercel.json): ?slot=am (morning card), ?slot=reel2 (midday Reel),
// ?slot=pm (afternoon card), and ?slot=all late in the evening to retry anything that failed or
// was missed. Outside the plan's dates every slot answers "not-scheduled" and posts nothing.
const SLOTS = ["am", "pm", "reel2", "all"] as const;
type Slot = (typeof SLOTS)[number];

export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const slot = new URL(req.url).searchParams.get("slot") as Slot | null;
  if (!slot || !SLOTS.includes(slot)) return NextResponse.json({ error: "Unknown slot" }, { status: 400 });
  try {
    const biz = await nurtureBusiness();
    const now = new Date();
    const result: Record<string, unknown> = {};
    if (slot === "am" || slot === "all") result.am = await runMonthPost("am", now, biz);
    if (slot === "reel2" || slot === "all") result.reel2 = await runSecondReel(now, biz);
    if (slot === "pm" || slot === "all") result.pm = await runMonthPost("pm", now, biz);
    await recordStatus("month-plan-run", { at: now.toISOString(), slot, ok: true, result });
    return NextResponse.json({ ok: true, slot, ...result });
  } catch (err) {
    console.error("[cron] month plan failed:", (err as Error).message);
    await recordStatus("month-plan-run", { at: new Date().toISOString(), slot, ok: false, error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

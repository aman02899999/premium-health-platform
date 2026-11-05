import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { nurtureBusiness } from "@/lib/growth/daily";
import { recordStatus } from "@/lib/growth/system-status";
import { runShort, YT_SLOTS, type YtSlot } from "@/lib/youtube/automation";

export const dynamic = "force-dynamic";
// Rendering a Short takes about 10–15 s and the upload a few more; ?slot=all does all three.
export const maxDuration = 300;

// vercel.json: ?slot=1 (morning), ?slot=2 (midday), ?slot=3 (evening), and ?slot=all late at night
// to retry anything that failed. YOUTUBE_SHORTS=off in Vercel stops it without a deploy.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const raw = new URL(req.url).searchParams.get("slot");
  const slots: YtSlot[] | null = raw === "all" ? [...YT_SLOTS] : YT_SLOTS.find((s) => String(s) === raw) ? [Number(raw) as YtSlot] : null;
  if (!slots) return NextResponse.json({ error: "Unknown slot" }, { status: 400 });
  const now = new Date();
  try {
    const biz = await nurtureBusiness();
    const result: Record<string, string> = {};
    // One after another: never two renders at once on one function.
    for (const s of slots) result[`slot${s}`] = await runShort(s, now, biz);
    await recordStatus("youtube-run", { at: now.toISOString(), slot: raw, ok: true, result });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] youtube failed:", (err as Error).message);
    await recordStatus("youtube-run", { at: now.toISOString(), slot: raw, ok: false, error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

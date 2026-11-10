import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { nurtureBusiness } from "@/lib/growth/daily";
import { recordStatus } from "@/lib/growth/system-status";
import { runLongVideo, runShort, shortsRenderedOnVercel, YT_SLOTS, type YtSlot } from "@/lib/youtube/automation";

export const dynamic = "force-dynamic";
// Rendering a one-minute Short with its own music takes about 30–60 s; ?slot=all does up to three.
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
    for (const s of slots) {
      // Shorts are rendered by the free GitHub runner unless YOUTUBE_RENDERER=vercel (see automation.ts).
      if (!shortsRenderedOnVercel()) {
        result[`slot${s}`] = "github-runner";
        continue;
      }
      // Leave room inside the 300 s limit: a slot that doesn't fit now is picked up by the next run.
      if (Date.now() - now.getTime() > 170_000) {
        result[`slot${s}`] = "deferred";
        continue;
      }
      result[`slot${s}`] = await runShort(s, now, biz);
    }
    // The day's long video (if one is due) rides on the midday and late-night runs. It is a ready-made
    // MP4, so it needs no render, only the upload.
    if (raw === "2" || raw === "all") result.long = Date.now() - now.getTime() > 200_000 ? "deferred" : await runLongVideo(now);
    await recordStatus("youtube-run", { at: now.toISOString(), slot: raw, ok: true, result });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] youtube failed:", (err as Error).message);
    await recordStatus("youtube-run", { at: now.toISOString(), slot: raw, ok: false, error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

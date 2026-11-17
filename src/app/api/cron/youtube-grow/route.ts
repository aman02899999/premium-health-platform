import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { recordStatus } from "@/lib/growth/system-status";
import { runChannelGrowth } from "@/lib/youtube/automation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily at 01:00 IST (vercel.json), after the tags job: topic playlists, one comment per video and
// "next video" links on long videos (see src/lib/youtube/engagement.ts). ?dry=1 only reports.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const now = new Date();
  try {
    const result = await runChannelGrowth({ dry });
    const ok = typeof result === "string" ? result === "off" || result === "not-connected" : result.stopped !== "reconnect";
    if (typeof result !== "string" && result.stopped === "reconnect") console.error("[cron] youtube-grow: connect YouTube again in Admin to allow comments and playlists");
    await recordStatus("youtube-grow", { at: now.toISOString(), dry, ok, result: typeof result === "string" ? result : { ...result, errors: result.errors.slice(0, 5) } });
    return NextResponse.json({ ok, dry, result });
  } catch (err) {
    console.error("[cron] youtube-grow failed:", (err as Error).message);
    await recordStatus("youtube-grow", { at: now.toISOString(), dry, ok: false, error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

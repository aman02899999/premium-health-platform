import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { recordStatus } from "@/lib/growth/system-status";
import { runTagsBackfill } from "@/lib/youtube/automation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily at 00:00 IST (vercel.json), after the day's last upload run: adds missing tags to every video
// on the channel (see src/lib/youtube/tags-backfill.ts). ?dry=1 only reports what it would change.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const now = new Date();
  try {
    const result = await runTagsBackfill({ dry });
    const ok = typeof result !== "string" || result === "off" || result === "not-connected";
    if (typeof result !== "string" && result.stopped === "reconnect") console.error("[cron] youtube-tags: reconnect YouTube in Admin to allow tag edits");
    await recordStatus("youtube-tags", { at: now.toISOString(), dry, ok, result: typeof result === "string" ? result : { ...result, untagged: result.untagged.length } });
    return NextResponse.json({ ok, dry, result });
  } catch (err) {
    console.error("[cron] youtube-tags failed:", (err as Error).message);
    await recordStatus("youtube-tags", { at: now.toISOString(), dry, ok: false, error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

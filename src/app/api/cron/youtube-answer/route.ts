import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { recordStatus } from "@/lib/growth/system-status";
import { runCommentAnswers, runTrendShorts } from "@/lib/youtube/automation";
import { shareClipsAsReels } from "@/lib/youtube/clips";
import { nurtureBusiness } from "@/lib/growth/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Daily at 09:15 IST (vercel.json), before the 1 pm Short slot:
//  - trends: a fact-check Short when a fitness or diet trend is being searched in India today
//  - Sundays: an answer Short for the best viewer question in the comments
//  - every day: a reply under the viewer's comment once their answer is live
//  - every day: the next posted phone clip shared as an Instagram / Facebook Reel (when connected)
// Clean drafts post by themselves in the next midday slot; held-back ones wait in Admin → Social.
// ?dry=1 only reports; ?force=1 drafts the comment answer on any day.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const dry = q.get("dry") === "1";
  const now = new Date();
  try {
    const trends = await runTrendShorts({ dry }).catch((err) => `failed: ${(err as Error).message.slice(0, 200)}`);
    const answers = await runCommentAnswers(now, { dry, force: q.get("force") === "1" });
    const reels = dry ? "dry run" : await shareClipsAsReels((await nurtureBusiness()).phone).catch((err) => `failed: ${(err as Error).message.slice(0, 200)}`);
    const result = { trends, answers, reels };
    const ok = (typeof answers === "string" ? !answers.startsWith("failed") : answers.errors.length === 0) && !(typeof trends === "string" && trends.startsWith("failed"));
    await recordStatus("youtube-answer", { at: now.toISOString(), dry, ok, result });
    return NextResponse.json({ ok, dry, result });
  } catch (err) {
    console.error("[cron] youtube-answer failed:", (err as Error).message);
    await recordStatus("youtube-answer", { at: now.toISOString(), dry, ok: false, error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

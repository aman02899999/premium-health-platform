import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { recordStatus } from "@/lib/growth/system-status";
import { runCommentAnswers } from "@/lib/youtube/automation";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Daily at 09:15 IST (vercel.json). On Sundays it drafts an answer Short for the best viewer
// question (Admin approves it before it posts); every day it replies under the viewer's comment
// once their answer is live. ?dry=1 only reports; ?force=1 drafts on any day.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const dry = q.get("dry") === "1";
  const now = new Date();
  try {
    const result = await runCommentAnswers(now, { dry, force: q.get("force") === "1" });
    const ok = typeof result === "string" ? !result.startsWith("failed") : result.errors.length === 0;
    await recordStatus("youtube-answer", { at: now.toISOString(), dry, ok, result });
    return NextResponse.json({ ok, dry, result });
  } catch (err) {
    console.error("[cron] youtube-answer failed:", (err as Error).message);
    await recordStatus("youtube-answer", { at: now.toISOString(), dry, ok: false, error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

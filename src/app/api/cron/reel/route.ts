import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { nurtureBusiness, runLeadEscalation } from "@/lib/growth/daily";
import { recordDailyRun } from "@/lib/growth/system-status";
import { runReels } from "@/lib/social/automation";

export const dynamic = "force-dynamic";
// Rendering the video (~30 s) plus Instagram's processing (up to 2 min) needs the long limit.
export const maxDuration = 300;

// Vercel Cron (vercel.json) calls this in the evening, at peak time on Instagram and Facebook in
// India, and once more later as a retry: a channel already posted is skipped, a failed one retried.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  // Evening check for leads nobody has called yet; it never holds up the Reel.
  const leads = await runLeadEscalation().catch((err: Error) => (console.error("[cron] lead escalation:", err.message), { waiting: 0, queued: 0 }));
  try {
    const result = { ...(await runReels(new Date(), await nurtureBusiness())), leads };
    await recordDailyRun("cron", true, result, "reel-run");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] reel run failed:", (err as Error).message);
    await recordDailyRun("cron", false, (err as Error).message, "reel-run");
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

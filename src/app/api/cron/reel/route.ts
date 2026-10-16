import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { nurtureBusiness } from "@/lib/growth/daily";
import { recordDailyRun } from "@/lib/growth/system-status";
import { runReels } from "@/lib/social/automation";

export const dynamic = "force-dynamic";
// Rendering the video (~30 s) plus Instagram's processing (up to 2 min) needs the long limit.
export const maxDuration = 300;

// Vercel Cron (vercel.json) calls this in the evening, at peak time on Instagram and Facebook in
// India, and once more later as a retry: a channel already posted is skipped, a failed one retried.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret ? req.headers.get("authorization") !== `Bearer ${secret}` : process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const result = await runReels(new Date(), await nurtureBusiness());
    await recordDailyRun("cron", true, result, "reel-run");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] reel run failed:", (err as Error).message);
    await recordDailyRun("cron", false, (err as Error).message, "reel-run");
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

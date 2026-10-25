import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { publicStatus } from "@/lib/observability/alerts";
import { runWatchdog } from "@/lib/observability/watchdog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The site's health check. The uptime workflow (.github/workflows/uptime.yml, outside Vercel)
// calls it every hour and Vercel Cron once a morning; each call emails the owner about any new
// problem (once per problem per day). It answers 503 only when the site itself is broken (no
// database), so an uptime monitor pages for an outage but not every hour for a problem the owner
// was already emailed about. The public answer names failing checks only; the scheduler
// (Authorization: Bearer $CRON_SECRET) also gets the details.
let last: { at: number; body: ReturnType<typeof publicStatus> } | null = null;
const PUBLIC_CACHE_MS = 5 * 60_000;
const httpStatus = (b: ReturnType<typeof publicStatus>) => (b.failing.includes("db-down") ? 503 : 200);

export async function GET(req: Request) {
  if (!isDbConfigured) return NextResponse.json({ ok: false, failing: ["db-not-configured"] }, { status: 503 });
  const scheduler = cronAuthorized(req, process.env, { allowUnsetInDev: false });
  // Anyone can call this, so repeated public calls within a few minutes reuse the last answer.
  if (!scheduler && last && Date.now() - last.at < PUBLIC_CACHE_MS) return NextResponse.json(last.body, { status: httpStatus(last.body) });
  const { problems, alerted } = await runWatchdog();
  const body = publicStatus(problems);
  last = { at: Date.now(), body };
  const res = scheduler ? { ...body, alerted, problems } : body;
  return NextResponse.json(res, { status: httpStatus(body), headers: { "cache-control": "no-store" } });
}

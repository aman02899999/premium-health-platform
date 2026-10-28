import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { isManager } from "@/lib/auth";
import { todayIST } from "@/lib/growth/dates";
import { healthAudience, parsePeriod, revenueReport } from "@/lib/revenue/report";

export const dynamic = "force-dynamic";

/**
 * Admin only. Revenue (gross, refunded, net) and acquisition for the period, computed from the
 * order and lead tables, plus the health site's real audience counts. Nothing here is estimated:
 * figures with no data behind them are listed under `unavailable`.
 * GET /health/api/earn/stats?from=YYYY-MM-DD&to=YYYY-MM-DD (default: last 30 days, IST)
 */
export async function GET(req: Request) {
  if (!(await isManager())) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!isDbConfigured) return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const period = parsePeriod(q.get("from"), q.get("to"), todayIST());
  try {
    const [report, audience] = await Promise.all([revenueReport(period), healthAudience()]);
    return NextResponse.json({ ok: true, report, audience }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[earn/stats]", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Couldn't load the figures" }, { status: 500 });
  }
}

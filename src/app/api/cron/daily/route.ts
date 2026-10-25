import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { runDaily } from "@/lib/growth/daily";
import { recordDailyRun, recordStatus } from "@/lib/growth/system-status";
import { reconcilePayments } from "@/lib/payments/reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vercel Cron (vercel.json) calls this every morning with "Authorization: Bearer $CRON_SECRET".
// Without CRON_SECRET it refuses to run in production; the admin's "Run now" button still works.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  // First, payments Razorpay captured that the site never recorded (read-only lookups; on its own
  // so a Razorpay outage can't stop the reminders).
  const payments = await reconcilePayments().catch((err: Error) => ({ checked: 0, recovered: [], mismatched: [], errors: [err.message] }));
  // The watchdog (/api/status) alerts the owner about mismatches and payments the webhook missed.
  await recordStatus("reconcile-run", { at: new Date().toISOString(), ok: !payments.errors.length, recovered: payments.recovered.length, mismatched: payments.mismatched.slice(0, 5), errors: payments.errors.slice(0, 5) });
  try {
    const result = { ...(await runDaily()), payments };
    await recordDailyRun("cron", true, result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] daily growth run failed:", (err as Error).message);
    await recordDailyRun("cron", false, (err as Error).message);
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

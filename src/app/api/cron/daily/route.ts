import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { runDaily } from "@/lib/growth/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron (vercel.json) calls this every morning with "Authorization: Bearer $CRON_SECRET".
// Without CRON_SECRET it refuses to run in production; the admin's "Run now" button still works.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret ? req.headers.get("authorization") !== `Bearer ${secret}` : process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    return NextResponse.json({ ok: true, ...(await runDaily()) });
  } catch (err) {
    console.error("[cron] daily growth run failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

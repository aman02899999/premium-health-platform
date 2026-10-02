import { NextResponse } from "next/server";
import { lastSyncAt, runLiveSync } from "@/health/lib/live-sync";

// Daily sync of live sources (WHO outbreaks, FDA recalls of Indian-made drugs, new
// India-focused research). Scheduled in vercel.json. When CRON_SECRET is set, Vercel
// sends it as a Bearer token and anything else is refused; without it, the job is
// rate-limited to one run every 6 hours so it can't be used to hammer the sources.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_GAP_MS = 6 * 3600 * 1000;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const last = await lastSyncAt();
  if (!secret && last && Date.now() - last.getTime() < MIN_GAP_MS) {
    return NextResponse.json({ skipped: true, lastSyncAt: last.toISOString() });
  }
  try {
    const results = await runLiveSync();
    return NextResponse.json({ ok: results.some((r) => r.ok), results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

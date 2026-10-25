import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { lastSyncAt, runLiveSync } from "@/health/lib/live-sync";

// Daily sync of live sources (WHO outbreaks, FDA recalls of Indian-made drugs, new
// India-focused research). Scheduled in vercel.json: Vercel sends CRON_SECRET as a Bearer
// token and anything else is refused. Without the secret it refuses in production; in local
// development it is rate-limited to one run every 6 hours so it can't hammer the sources.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_GAP_MS = 6 * 3600 * 1000;

export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const last = await lastSyncAt();
  if (!process.env.CRON_SECRET && last && Date.now() - last.getTime() < MIN_GAP_MS) {
    return NextResponse.json({ skipped: true, lastSyncAt: last.toISOString() });
  }
  try {
    const results = await runLiveSync();
    return NextResponse.json({ ok: results.some((r) => r.ok), results });
  } catch (err) {
    console.error("[health cron] live sync failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}

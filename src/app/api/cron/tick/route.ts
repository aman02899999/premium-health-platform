import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { dueJobs } from "@/lib/cron-schedule";
import { localGet } from "@/lib/local-get";

export const dynamic = "force-dynamic";
// The slowest job (a Reel render) takes a few minutes; Cloud Run's request timeout is set to 15 min.
export const maxDuration = 900;

// Google Cloud Scheduler calls this every 5 minutes with the same "Bearer CRON_SECRET" that Vercel
// Cron used. It runs the vercel.json jobs due in this window, one after another, on this same server.
// On Vercel (where Vercel Cron calls the jobs directly) nothing schedules it, so it never runs there.
export async function GET(req: Request) {
  if (!cronAuthorized(req, process.env, { allowUnsetInDev: false })) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const origin = `http://127.0.0.1:${process.env.PORT || 3000}`;
  const ran: Record<string, number | string> = {};
  for (const job of dueJobs(now)) {
    try {
      // Not fetch(): it gives up after 5 minutes, which froze long Reel jobs half way (see local-get.ts).
      const status = await localGet(`${origin}${job.path}`, { authorization: req.headers.get("authorization") ?? "" });
      ran[job.path] = status;
      if (status < 200 || status >= 300) console.error(`[tick] ${job.path} answered ${status}`);
    } catch (err) {
      ran[job.path] = `error: ${(err as Error).message.slice(0, 120)}`;
      console.error(`[tick] ${job.path} failed:`, (err as Error).message);
    }
  }
  return NextResponse.json({ ok: true, at: now.toISOString(), ran }, { headers: { "cache-control": "no-store" } });
}

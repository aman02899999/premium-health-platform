import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { dueJobs } from "@/lib/cron-schedule";

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
      const res = await fetch(`${origin}${job.path}`, { headers: { authorization: req.headers.get("authorization") ?? "" }, cache: "no-store" });
      ran[job.path] = res.status;
      if (!res.ok) console.error(`[tick] ${job.path} answered ${res.status}`);
    } catch (err) {
      ran[job.path] = `error: ${(err as Error).message.slice(0, 120)}`;
      console.error(`[tick] ${job.path} failed:`, (err as Error).message);
    }
  }
  return NextResponse.json({ ok: true, at: now.toISOString(), ran }, { headers: { "cache-control": "no-store" } });
}

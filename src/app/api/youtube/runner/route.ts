import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { isDbConfigured } from "@/health/db";
import { nurtureBusiness } from "@/lib/growth/daily";
import { claimRunnerShort, recordRunnerShort, YT_SLOTS, type YtSlot } from "@/lib/youtube/automation";
import { parseRunnerRequest } from "@/lib/youtube/runner-protocol";

export const dynamic = "force-dynamic";

// The GitHub runner (.github/workflows/youtube-shorts.yml) renders the Shorts so Vercel doesn't
// spend its CPU on them. It calls this with the same CRON_SECRET as the Vercel crons:
//   {action:"claim", slot}         -> a job (script, business details, a 1-hour YouTube token) or why not
//   {action:"result", id, result}  -> records the upload on the claimed row
export async function POST(req: Request) {
  if (!cronAuthorized(req, process.env, { allowUnsetInDev: false })) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const parsed = parseRunnerRequest(await req.json().catch(() => null), YT_SLOTS);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    if (parsed.value.action === "claim") {
      const job = await claimRunnerShort(parsed.value.slot as YtSlot, new Date(), await nurtureBusiness());
      return NextResponse.json(typeof job === "string" ? { ok: true, status: job } : { ok: true, job }, { headers: { "cache-control": "no-store" } });
    }
    const saved = await recordRunnerShort(parsed.value.id, parsed.value.result);
    return NextResponse.json({ ok: saved }, { status: saved ? 200 : 409 });
  } catch (err) {
    console.error("[youtube-runner] failed:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "Run failed" }, { status: 500 });
  }
}

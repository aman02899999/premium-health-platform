import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { analyse } from "@/lib/lab/analyse";
import { CONSENT_VERSION, parseAnalyseRequest } from "@/lib/lab/overrides";
import { labViewer } from "@/lib/lab/session";
import { countUsage, deleteReports, liveMarkers, reportsFor, saveReport, savingEnabled } from "@/lib/lab/store";

// The member's blood report analyser. Health data: never cached, never logged.
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

// Seeing and deleting your own saved reports only needs sign-in, so someone whose access ends
// can still get at, or remove, their data. Running a new analysis needs access.
async function gate(needAccess = true) {
  const v = await labViewer();
  if (!v) return { error: json({ error: "Please sign in again." }, 401) };
  if (needAccess && !v.allowed) return { error: json({ error: "The blood report analyser isn't switched on for your account yet. Message us on WhatsApp and we'll turn it on." }, 403) };
  if (!isDbConfigured) return { error: json({ error: "The analyser is temporarily unavailable." }, 503) };
  return { viewer: v };
}

/** The member's saved reports, analysed again with today's library. */
export async function GET() {
  const g = await gate(false);
  if (g.error) return g.error;
  try {
    const markers = await liveMarkers();
    const reports = await reportsFor(g.viewer.email);
    return json({
      saving: savingEnabled(),
      reports: reports.map((r) => ({ id: r.id, createdAt: r.createdAt, expiresAt: r.expiresAt, label: r.label, person: r.person, analysis: analyse(markers, r.results, r.person) })),
    });
  } catch (err) {
    console.error("[blood-report] list failed:", (err as Error).message);
    return json({ error: "Couldn't load your reports. Please try again in a minute." }, 500);
  }
}

/** Analyse a typed-in report; saves it (encrypted) only when the member asks. */
export async function POST(req: Request) {
  const g = await gate();
  if (g.error) return g.error;
  const parsed = parseAnalyseRequest((await req.json().catch(() => null)) as Record<string, unknown> | null);
  if (typeof parsed === "string") return json({ error: parsed }, 400);
  try {
    const analysis = analyse(await liveMarkers(), parsed.results, parsed.person);
    let savedId: string | null = null;
    if (parsed.save) savedId = await saveReport(g.viewer.email, { person: parsed.person, results: parsed.results }, CONSENT_VERSION);
    await countUsage(Boolean(savedId)).catch(() => {});
    return json({ analysis, savedId, saving: savingEnabled() });
  } catch (err) {
    console.error("[blood-report] analyse failed:", (err as Error).message);
    return json({ error: "Couldn't analyse your report. Please try again in a minute." }, 500);
  }
}

/** The member deletes one saved report ({ id }) or all of them ({ all: true }). */
export async function DELETE(req: Request) {
  const g = await gate(false);
  if (g.error) return g.error;
  const b = (await req.json().catch(() => null)) as { id?: unknown; all?: unknown } | null;
  const id = typeof b?.id === "string" && /^[0-9a-f-]{36}$/i.test(b.id) ? b.id : null;
  if (!id && b?.all !== true) return json({ error: "Invalid request" }, 400);
  try {
    return json({ ok: true, deleted: await deleteReports(g.viewer.email, id) });
  } catch (err) {
    console.error("[blood-report] delete failed:", (err as Error).message);
    return json({ error: "Couldn't delete just now. Please try again in a minute." }, 500);
  }
}

import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { MAX_CAP, MAX_KNOWLEDGE, MODELS, MODES } from "@/lib/ai/agent-core";
import { agentStats, aiConfigured, draftAnswer, getAgentSettings, logRun, saveAgentSettings } from "@/lib/ai/agent";

// Admin AI agent (owners and managers; the proxy keeps desk agents out).
// GET                                       settings, whether the API key is set, today's and 30 days' numbers, recent answers
// POST { action: "save", settings }         mode, model, daily cap, desk notes
// POST { action: "test", question }         what the agent would answer, with the settings as saved (nothing is sent)
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const [settings, stats] = await Promise.all([getAgentSettings(), agentStats()]);
    return NextResponse.json({ settings, stats, configured: aiConfigured(), modes: MODES, models: MODELS.map(({ id, label, hint }) => ({ id, label, hint })), maxKnowledge: MAX_KNOWLEDGE, maxCap: MAX_CAP });
  } catch (err) {
    console.error("[ai-agent]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the AI agent. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const by = await adminIdentity();
  try {
    if (b.action === "save") {
      const settings = await saveAgentSettings(b.settings, by);
      return NextResponse.json({ ok: true, settings });
    }
    if (b.action === "test") {
      const question = typeof b.question === "string" ? b.question.trim().slice(0, 1000) : "";
      if (question.length < 2) return NextResponse.json({ error: "Type a question to test." }, { status: 400 });
      const r = await draftAnswer({ question });
      await logRun({ source: "test", question, result: r, by });
      return r.ok ? NextResponse.json({ ok: true, answer: r.answer }) : NextResponse.json({ error: r.error }, { status: 502 });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[ai-agent]", (err as Error).message);
    return NextResponse.json({ error: "Something went wrong. Is the latest database migration applied?" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { adminIdentity, adminRole } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { checkQuestion } from "@/lib/challenge/bank";
import { isLevel, monthOf } from "@/lib/challenge/levels";
import { finaliseAndNotify, previousMonth } from "@/lib/challenge/automation";
import { addQuestion, adminQuestions, isFinalised, monthAttempts, prizesFor, redeemPrize, reviewQuestions, voidPrize } from "@/lib/challenge/store";

// Knowledge Challenge admin.
// GET ?view=questions                          every question with its review state
// GET ?view=month&month=YYYY-MM                attempts (with flags) and prizes for a month
// POST { action: "review", ids, status }       approve or retire questions        (owner, manager)
// POST { action: "add", level, topic, prompt, options, answer, why, source }      (owner, manager)
// POST { action: "finalise", month }           hand out a finished month's prizes now (owner, manager)
// POST { action: "redeem" | "void", code, note }  prize desk                      (any admin)
export const dynamic = "force-dynamic";
const MANAGE = new Set(["owner", "manager"]);
const NO_STORE = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

async function gate() {
  const role = await adminRole();
  if (!role) return { error: json({ error: "Unauthorized" }, 401) };
  if (role === "reviewer") return { error: json({ error: "Forbidden" }, 403) };
  if (!isDbConfigured) return { error: json({ error: "Database not configured" }, 503) };
  return { role };
}

export async function GET(req: Request) {
  const g = await gate();
  if (g.error) return g.error;
  const q = new URL(req.url).searchParams;
  try {
    if (q.get("view") === "questions") {
      if (!MANAGE.has(g.role)) return json({ error: "Only owners and managers can see the questions." }, 403);
      return json({ questions: await adminQuestions() });
    }
    const month = q.get("month") ?? previousMonth();
    if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "Bad month" }, 400);
    const [attempts, prizes, finalised] = await Promise.all([monthAttempts(month), prizesFor(month), isFinalised(month)]);
    return json({ month, current: monthOf(), finalised, attempts: MANAGE.has(g.role) ? attempts : [], prizes });
  } catch (err) {
    console.error("[admin/challenge]", (err as Error).message);
    return json({ error: "Couldn't load. Is the latest database migration applied?" }, 500);
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const g = await gate();
  if (g.error) return g.error;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return json({ error: "Bad request" }, 400);
  const by = await adminIdentity();

  if (b.action === "redeem" || b.action === "void") {
    const code = str(b.code, 20);
    if (!/^WIN-[0-9A-F]{8}$/i.test(code)) return json({ error: "Type the claim code, like WIN-1A2B3C4D." }, 400);
    const err = b.action === "redeem" ? await redeemPrize(code, by, str(b.note, 500)) : await voidPrize(code, by, str(b.note, 500));
    return err ? json({ error: err }, 400) : json({ ok: true });
  }

  if (!MANAGE.has(g.role)) return json({ error: "Only owners and managers can do this." }, 403);

  if (b.action === "review") {
    const ids = Array.isArray(b.ids) ? b.ids.filter((x): x is string => typeof x === "string" && /^[a-z]\d{3,4}$/.test(x)).slice(0, 500) : [];
    if (!ids.length || (b.status !== "approved" && b.status !== "retired")) return json({ error: "Bad request" }, 400);
    return json({ ok: true, changed: await reviewQuestions(ids, b.status, by) });
  }

  if (b.action === "add") {
    if (!isLevel(b.level)) return json({ error: "Pick a level." }, 400);
    const options = Array.isArray(b.options) ? b.options.map((o) => str(o, 120)) : [];
    const q = { level: b.level, topic: str(b.topic, 40), prompt: str(b.prompt, 300), options, answer: Number(b.answer), why: str(b.why, 300), source: str(b.source, 200) };
    const problem = checkQuestion(q);
    if (problem) return json({ error: problem }, 400);
    return json({ ok: true, id: await addQuestion(q, by) });
  }

  if (b.action === "finalise") {
    const month = str(b.month, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "Bad month" }, 400);
    if (month >= monthOf()) return json({ error: "A month can be finalised only after it ends. It happens automatically on the 1st." }, 400);
    const r = await finaliseAndNotify(month, by);
    return r ? json({ ok: true, ...r }) : json({ error: "That month is already finalised." }, 409);
  }

  return json({ error: "Unknown action" }, 400);
}

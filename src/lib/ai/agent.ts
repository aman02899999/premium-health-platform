import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { applyOffer } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";
import { todayIST } from "@/lib/growth/dates";
import {
  DEFAULT_SETTINGS,
  OUTPUT_SCHEMA,
  buildKnowledge,
  cleanSettings,
  conversationPrompt,
  costUsd,
  parseAnswer,
  systemPrompt,
  withLiveLine,
  type AgentAnswer,
  type AgentSettings,
  type ChatTurn,
  type Usage,
} from "./agent-core";

/** The Claude API key is set in Vercel (ANTHROPIC_API_KEY); without it the agent stays off. */
export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function getAgentSettings(): Promise<AgentSettings> {
  const { rows } = await pool.query<{ settings: unknown }>(`select settings from public.ai_agent_settings where id = 1`).catch(() => ({ rows: [] as { settings: unknown }[] }));
  return rows[0] ? cleanSettings(rows[0].settings) : DEFAULT_SETTINGS;
}

export async function saveAgentSettings(raw: unknown, by: string): Promise<AgentSettings> {
  const s = cleanSettings(raw);
  await pool.query(
    `insert into public.ai_agent_settings (id, settings, updated_by) values (1, $1, $2)
     on conflict (id) do update set settings = excluded.settings, updated_by = excluded.updated_by, updated_at = now()`,
    [JSON.stringify(s), by.slice(0, 200)],
  );
  return s;
}

export type ModelCall = (req: { model: string; system: string; knowledge: string; prompt: string }) => Promise<{ text: string; usage: Usage; refused: boolean }>;

/** One structured answer from Claude. Swapped out in tests. */
const callClaude: ModelCall = async ({ model, system, knowledge, prompt }) => {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
  // Opus and Sonnet re-run a declined request on another model instead of stopping.
  const fallback = model === "claude-haiku-5-5" ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
  const res = await client.beta.messages.create({
    model,
    max_tokens: 4000,
    ...fallback,
    // Instructions, then the gym's facts (the big, stable part, cached between messages).
    system: [
      { type: "text", text: system },
      { type: "text", text: `<knowledge>\n${knowledge}\n</knowledge>`, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: prompt }],
    output_config: { effort: "low", format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const u = res.usage;
  return {
    text,
    refused: res.stop_reason === "refusal",
    usage: { input: (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0), cached: u.cache_read_input_tokens ?? 0, output: u.output_tokens ?? 0 },
  };
};

export type AgentResult = { ok: true; answer: AgentAnswer; usage: Usage; model: string } | { ok: false; error: string };

/**
 * Writes the reply to one customer message from the site's facts and the recent chat. Never
 * sends anything; the caller decides. A refusal or an unusable answer becomes a hand-off.
 */
export async function draftAnswer(q: { question: string; history?: ChatTurn[]; name?: string; settings?: AgentSettings }, call: ModelCall = callClaude): Promise<AgentResult> {
  if (!aiConfigured() && call === callClaude) return { ok: false, error: "The AI agent needs ANTHROPIC_API_KEY in Vercel." };
  const settings = q.settings ?? (await getAgentSettings());
  const c = await getContent();
  const knowledge = buildKnowledge(c, applyOffer(c.plans, todayIST()), SITE_URL, settings.knowledge);
  try {
    const r = await call({ model: settings.model, system: systemPrompt(c.business.name, c.business.phone), knowledge, prompt: conversationPrompt(q.history ?? [], q.question, q.name ?? "") });
    const parsed = r.refused ? null : parseAnswer(r.text);
    const answer: AgentAnswer = parsed ?? { reply: "Thanks for your message! A coach will reply to you shortly.", handoff: true, reason: r.refused ? "The AI declined to answer" : "The AI's answer wasn't usable" };
    return { ok: true, answer: { ...answer, reply: withLiveLine(answer.reply, c.business.phone, answer.handoff) }, usage: r.usage, model: settings.model };
  } catch (err) {
    const e = err as Error & { status?: number };
    const error = e instanceof Anthropic.AuthenticationError ? "The Claude API key was rejected. Check ANTHROPIC_API_KEY in Vercel." : e instanceof Anthropic.RateLimitError ? "Claude is rate-limiting this key. Try again in a minute." : `Claude didn't answer${e.status ? ` (${e.status})` : ""}: ${e.message}`;
    console.error("[ai-agent]", error);
    return { ok: false, error: error.slice(0, 300) };
  }
}

export type LogEntry = {
  source: "auto" | "draft" | "test";
  peer?: string | null;
  inboxId?: string | null;
  question: string;
  result: AgentResult;
  sent?: boolean;
  by?: string;
};

export async function logRun(e: LogEntry): Promise<void> {
  const r = e.result;
  await pool
    .query(
      `insert into public.ai_agent_log (source, peer, inbox_id, question, answer, handoff, reason, sent, model, input_tokens, cached_tokens, output_tokens, error, by_user)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        e.source,
        e.peer && /^\d{6,20}$/.test(e.peer) ? e.peer : null,
        e.inboxId?.slice(0, 200) ?? null,
        e.question.slice(0, 1000),
        r.ok ? r.answer.reply.slice(0, 2000) : "",
        r.ok && r.answer.handoff,
        r.ok ? r.answer.reason : "",
        Boolean(e.sent),
        r.ok ? r.model : "",
        r.ok ? r.usage.input : 0,
        r.ok ? r.usage.cached : 0,
        r.ok ? r.usage.output : 0,
        r.ok ? null : r.error.slice(0, 300),
        (e.by ?? "").slice(0, 200),
      ],
    )
    .catch((err: Error) => console.error("[ai-agent] log:", err.message));
}

/** Answers written today (India), for the daily cap. Tests and drafts don't count. */
export async function answersToday(now = new Date()): Promise<number> {
  const { rows } = await pool.query<{ n: number }>(
    `select count(*)::int as n from public.ai_agent_log where source = 'auto' and error is null and to_char(created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD') = $1`,
    [todayIST(now)],
  );
  return rows[0]?.n ?? 0;
}

export type AgentStats = {
  today: { answered: number; handedOff: number; drafts: number; errors: number; costUsd: number };
  days30: { answered: number; handedOff: number; drafts: number; costUsd: number };
  recent: { id: string; at: string; source: string; peer: string | null; question: string; answer: string; handoff: boolean; reason: string; sent: boolean; error: string | null; by: string; costUsd: number }[];
};

export async function agentStats(now = new Date()): Promise<AgentStats> {
  const { rows } = await pool.query<{
    id: string;
    created_at: Date;
    source: string;
    peer: string | null;
    question: string;
    answer: string;
    handoff: boolean;
    reason: string;
    sent: boolean;
    model: string;
    input_tokens: number;
    cached_tokens: number;
    output_tokens: number;
    error: string | null;
    by_user: string;
  }>(`select * from public.ai_agent_log where created_at > now() - interval '30 days' order by created_at desc limit 2000`);
  const today = todayIST(now);
  const istDay = (d: Date) => todayIST(d);
  const cost = (r: (typeof rows)[number]) => costUsd(r.model, { input: r.input_tokens, cached: r.cached_tokens, output: r.output_tokens });
  const sum = (xs: typeof rows) => ({
    answered: xs.filter((r) => r.source === "auto" && !r.error && r.sent).length,
    handedOff: xs.filter((r) => r.source === "auto" && r.handoff).length,
    drafts: xs.filter((r) => r.source === "draft" && !r.error).length,
    costUsd: Math.round(xs.reduce((t, r) => t + cost(r), 0) * 100) / 100,
  });
  const todays = rows.filter((r) => istDay(r.created_at) === today);
  return {
    today: { ...sum(todays), errors: todays.filter((r) => r.error).length },
    days30: sum(rows),
    recent: rows.slice(0, 60).map((r) => ({
      id: r.id,
      at: r.created_at.toISOString(),
      source: r.source,
      peer: r.peer,
      question: r.question,
      answer: r.answer,
      handoff: r.handoff,
      reason: r.reason,
      sent: r.sent,
      error: r.error,
      by: r.by_user,
      costUsd: Math.round(cost(r) * 10000) / 10000,
    })),
  };
}

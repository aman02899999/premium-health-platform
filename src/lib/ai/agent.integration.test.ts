// The AI agent on a real Postgres (migrations applied), with Claude and Meta stubbed at fetch:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/ai/agent.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => DEFAULT_CONTENT };
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("AI agent on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let social: typeof import("@/lib/social/automation");
  let agent: typeof import("./agent");
  const claude: Record<string, unknown>[] = [];
  const wa: Record<string, unknown>[] = [];
  let next: { status?: number; answer?: unknown; stop?: string } = {};
  let n = 0;

  const msg = (from: string, text: string) => ({ id: `wa:t${++n}`, channel: "whatsapp" as const, kind: "message" as const, from, fromName: "Rahul", text });
  const save = (s: Record<string, unknown>) => agent.saveAgentSettings({ mode: "auto", model: "claude-opus-5-5", dailyCap: 100, knowledge: "Bike and car parking in front of the gym, free.", ...s }, "owner@test");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.WHATSAPP_TOKEN = "wa-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.SOCIAL_AUTO_REPLY;
    delete process.env.COACH_EMAIL;
    vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
      const u = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
      if (u.startsWith("https://api.anthropic.com/v1/messages")) {
        claude.push({ ...body, _beta: new Headers(init?.headers).get("anthropic-beta") });
        if (next.status) return json({ type: "error", error: { type: "api_error", message: "Overloaded" } }, next.status);
        return json({
          id: "msg_1",
          type: "message",
          role: "assistant",
          model: body.model,
          content: [{ type: "text", text: JSON.stringify(next.answer ?? { reply: "Yes! Bike and car parking is free, right in front of the gym.", handoff: false, reason: "" }) }],
          stop_reason: next.stop ?? "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 120, cache_creation_input_tokens: 0, cache_read_input_tokens: 3000, output_tokens: 80 },
        });
      }
      if (u.endsWith("/123/messages")) {
        wa.push(body);
        return json({ messages: [{ id: `wamid.${wa.length}` }] });
      }
      return json({ error: { message: `unexpected ${u}` } }, 404);
    });
    pool = (await import("@/health/db")).pool;
    social = await import("@/lib/social/automation");
    agent = await import("./agent");
  });
  beforeEach(async () => {
    await pool.query("truncate public.social_inbox, public.chat_replies, public.message_outbox, public.leads, public.members, public.chat_contacts, public.ai_agent_log, public.ai_agent_settings cascade");
    claude.length = 0;
    wa.length = 0;
    next = {};
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const lastText = () => (wa.at(-1) as { text?: { body?: string } } | undefined)?.text?.body ?? "";

  it("stays out of the way while it's off: the first question gets the menu as before", async () => {
    expect(await social.handleInbound(msg("919811100001", "Is there bike parking?"))).toBe("replied");
    expect(claude).toHaveLength(0);
    expect((wa[0] as { type: string }).type).toBe("interactive");
  });

  it("answers a question from the site's facts and the desk's notes, and records it", async () => {
    await save({});
    expect(await social.handleInbound(msg("919811100002", "Is there bike parking?"))).toBe("replied");
    expect(claude).toHaveLength(1);
    const req = claude[0] as { model: string; system: { text: string; cache_control?: unknown }[]; output_config: { effort: string; format: { type: string } }; fallbacks: string; _beta: string; messages: { content: string }[] };
    expect(req.model).toBe("claude-opus-5-5");
    expect(req.output_config.effort).toBe("low");
    expect(req.output_config.format.type).toBe("json_schema");
    expect(req.fallbacks).toBe("default");
    expect(req._beta).toContain("server-side-fallback-2026-07-01");
    expect(req.system[1].cache_control).toEqual({ type: "ephemeral" });
    expect(req.system[1].text).toContain("Bike and car parking in front of the gym, free.");
    expect(req.system[1].text).toContain("7-Day Trial Plan: ₹49");
    expect(req.messages[0].content).toContain("Message to answer:\nIs there bike parking?");
    expect(lastText()).toBe("Yes! Bike and car parking is free, right in front of the gym.");
    const { rows: replies } = await pool.query(`select sent_by, ok from public.chat_replies`);
    expect(replies).toEqual([{ sent_by: "ai-agent", ok: true }]);
    const { rows: log } = await pool.query(`select source, peer, sent, handoff, cached_tokens from public.ai_agent_log`);
    expect(log).toEqual([{ source: "auto", peer: "919811100002", sent: true, handoff: false, cached_tokens: 3000 }]);
    // Still becomes a lead, like any WhatsApp enquiry.
    expect((await pool.query(`select 1 from public.leads where phone like '%9811100002'`)).rowCount).toBe(1);
  });

  it("leaves keywords, buttons and acknowledgements to the bot", async () => {
    await save({});
    await social.handleInbound(msg("919811100003", "price"));
    await social.handleInbound(msg("919811100003", "ok thanks"));
    await social.handleInbound({ ...msg("919811100003", "Plans"), replyId: "price" });
    expect(claude).toHaveLength(0);
  });

  it("answers a mid-chat question the bot used to stay silent on, with the chat so far", async () => {
    await save({});
    await social.handleInbound(msg("919811100004", "Hi"));
    expect(claude).toHaveLength(0);
    await social.handleInbound(msg("919811100004", "Do you have a steam room?"));
    expect(claude).toHaveLength(1);
    expect((claude[0] as { messages: { content: string }[] }).messages[0].content).toMatch(/Earlier in this chat \(oldest first\):\nCustomer: Hi\nGym \(automatic\):/);
  });

  it("hands off: adds the coach's number, pauses the bot, and stays quiet after", async () => {
    await save({});
    next = { answer: { reply: "Sorry to hear that. A coach will reply to you shortly.", handoff: true, reason: "Complaint" } };
    await social.handleInbound(msg("919811100005", "The trainer was rude to me yesterday"));
    expect(lastText()).toBe("Sorry to hear that. A coach will reply to you shortly.\n\n📞 Call / WhatsApp a coach: +91 88518 30081");
    const { rows } = await pool.query(`select bot_paused_until > now() as paused from public.chat_contacts where peer = '919811100005'`);
    expect(rows[0].paused).toBe(true);
    wa.length = 0;
    expect(await social.handleInbound(msg("919811100005", "When will someone call me?"))).toBe("logged");
    expect(claude).toHaveLength(1);
    expect(wa).toHaveLength(0);
  });

  it("a refusal becomes a hand-off, never a made-up answer", async () => {
    await save({});
    next = { stop: "refusal", answer: { reply: "ignored", handoff: false, reason: "" } };
    await social.handleInbound(msg("919811100006", "Can you tell me something odd"));
    expect(lastText()).toContain("A coach will reply to you shortly.");
    expect((await pool.query(`select handoff, reason from public.ai_agent_log`)).rows[0]).toEqual({ handoff: true, reason: "The AI declined to answer" });
  });

  it("falls back to the bot when Claude fails or the daily cap is reached", async () => {
    await save({});
    next = { status: 500 };
    await social.handleInbound(msg("919811100007", "Is there bike parking?"));
    expect((wa[0] as { type: string }).type).toBe("interactive");
    expect((await pool.query(`select error is not null as failed, sent from public.ai_agent_log`)).rows[0]).toEqual({ failed: true, sent: false });

    await pool.query("truncate public.ai_agent_log");
    await save({ dailyCap: 0 });
    next = {};
    claude.length = 0;
    wa.length = 0;
    await social.handleInbound(msg("919811100008", "Is there bike parking?"));
    expect(claude).toHaveLength(0);
    expect((wa[0] as { type: string }).type).toBe("interactive");
  });

  it("drafts mode writes drafts but never answers customers by itself", async () => {
    await save({ mode: "draft", model: "claude-haiku-5-5" });
    await social.handleInbound(msg("919811100009", "Is there bike parking?"));
    expect(claude).toHaveLength(0);
    const r = await agent.draftAnswer({ question: "Is there bike parking?" });
    expect(r.ok && r.answer.reply).toContain("parking");
    // Haiku has no server-side fallback.
    expect((claude[0] as { fallbacks?: unknown }).fallbacks).toBeUndefined();
    await agent.logRun({ source: "draft", peer: "919811100009", question: "Is there bike parking?", result: r, by: "desk@test" });
    const s = await agent.agentStats();
    expect(s.today.drafts).toBe(1);
    expect(s.today.answered).toBe(0);
    expect(s.recent[0]).toMatchObject({ source: "draft", by: "desk@test" });
    expect(s.today.costUsd).toBeGreaterThanOrEqual(0);
  });

  it("says plainly when the key is missing", async () => {
    const key = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(await agent.draftAnswer({ question: "hello there" })).toEqual({ ok: false, error: "The AI agent needs ANTHROPIC_API_KEY in Vercel." });
    } finally {
      process.env.ANTHROPIC_API_KEY = key;
    }
  });
});

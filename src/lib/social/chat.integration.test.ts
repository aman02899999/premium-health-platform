// The admin WhatsApp chat on a real Postgres (migrations applied), with Meta's API stubbed:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/social/chat.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => DEFAULT_CONTENT };
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("admin WhatsApp chat", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let social: typeof import("./automation");
  let chat: typeof import("./chat");
  let meta: typeof import("./meta");
  const sent: Record<string, unknown>[] = [];

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.WHATSAPP_TOKEN = "wa-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    delete process.env.SOCIAL_AUTO_REPLY;
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string; headers?: Record<string, string> }) => {
      const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
      if (u.endsWith("/123/messages")) {
        sent.push(JSON.parse(init!.body!));
        return json({ messages: [{ id: `wamid.${sent.length}` }] });
      }
      if (u === "https://lookaside.fbsbx.test/m/55501") return new Response(new Uint8Array([0xff, 0xd8, 0xff]), { headers: { "content-type": "image/jpeg" } });
      if (u.endsWith("/55501")) return init?.headers?.authorization === "Bearer wa-token" ? json({ url: "https://lookaside.fbsbx.test/m/55501", mime_type: "image/jpeg" }) : json({}, 401);
      return json({ error: { message: `unexpected ${u}` } }, 404);
    });
    pool = (await import("@/health/db")).pool;
    social = await import("./automation");
    chat = await import("./chat");
    meta = await import("./meta");
  });
  beforeEach(async () => {
    await pool.query("truncate public.social_inbox, public.chat_replies, public.message_outbox, public.leads, public.members, public.whatsapp_optouts, public.whatsapp_calls, public.chat_contacts cascade");
    sent.length = 0;
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const PEER = "919876543210";
  const wa = (id: string, text: string, media?: { type: "image"; id: string }, replyId?: string) => ({ id: `wa:${id}`, channel: "whatsapp" as const, kind: "message" as const, from: PEER, fromName: "Pratibha", text, ...(media ? { media } : {}), ...(replyId ? { replyId } : {}) });

  it("shows the customer's messages, the auto-replies and the sample PDF as one conversation", async () => {
    expect(await social.handleInbound(wa("1", "Need a fat lose diet plan"))).toBe("replied");
    await social.handleInbound(wa("2", "", { type: "image", id: "55501" }));

    // The trial offer with buttons, then the sample PDF as a document.
    expect(sent.map((s) => s.type)).toEqual(["interactive", "document"]);
    expect((sent[1].document as { link: string }).link).toMatch(/\/samples\/royal-fitness-diet-plan-sample\.pdf$/);

    const t = await chat.chatThread(PEER);
    expect(t.name).toBe("Pratibha");
    expect(t.window.open).toBe(true);
    expect(t.messages.map((m) => [m.fromThem, m.by])).toEqual([
      [true, ""],
      [false, "auto-reply"],
      [false, "auto-reply"],
      [true, ""],
    ]);
    expect(t.messages[1].body).toContain("Start with my *7-Day Trial Plan* for just *₹49*");
    expect(t.messages[1].body).toContain("[✅ Start 7-day ₹49] [📋 See all plans] [💬 Talk to coach]");
    expect(t.messages[3].media).toEqual({ type: "image", id: "55501" });

    const [summary] = await chat.listChats();
    expect(summary).toMatchObject({ peer: PEER, name: "Pratibha", lastFromThem: true, lastBody: "📷 Photo" });
  });

  it("a refund request gets a hand-off, not prices, and the bot steps back for the coach", async () => {
    expect(await social.handleInbound(wa("r1", "I want a refund for my membership"))).toBe("replied");
    const { rows } = await pool.query<{ body: string; sent_by: string }>(`select body, sent_by from public.chat_replies order by created_at`);
    expect(rows).toHaveLength(1);
    expect(rows[0].sent_by).toBe("auto-reply");
    expect(rows[0].body).toContain("Coach Aman* will reply to you here personally");
    expect(rows[0].body).not.toContain("₹");
    expect((await pool.query(`select bot_paused_until > now() as paused from public.chat_contacts where peer = $1`, [PEER])).rows[0].paused).toBe(true);
    // While paused, even a keyword gets no automatic reply.
    expect(await social.handleInbound(wa("r2", "price"))).toBe("logged");
  });

  it("the coach replies inside the 24-hour window, and is stopped outside it", async () => {
    await social.handleInbound(wa("5", "ok thanks"));
    sent.length = 0;
    expect(await chat.sendChatReply(PEER, "  See you at 7 pm! ", "coach@royalfitnesclub.in")).toEqual({ ok: true });
    expect(sent).toEqual([{ messaging_product: "whatsapp", to: PEER, type: "text", text: { body: "See you at 7 pm!", preview_url: true } }]);
    const t = await chat.chatThread(PEER);
    expect(t.messages.at(-1)).toMatchObject({ fromThem: false, by: "coach@royalfitnesclub.in", body: "See you at 7 pm!", ok: true });

    expect(await chat.sendChatReply(PEER, "   ", "coach")).toMatchObject({ ok: false, status: 400 });

    await pool.query(`update public.social_inbox set created_at = now() - interval '25 hours'`);
    sent.length = 0;
    expect(await chat.sendChatReply(PEER, "hello again", "coach")).toMatchObject({ ok: false, status: 409 });
    expect(sent).toEqual([]);
  });

  it("scheduled template messages appear in the conversation too", async () => {
    await social.handleInbound(wa("7", "hi"));
    await pool.query(
      `insert into public.message_outbox (channel, to_address, to_name, kind, body, template, dedupe_key, status, sent_at) values ('whatsapp', $1, 'Pratibha', 'renew-7', 'Hi Pratibha, your membership ends soon', 'rfc_renewal_7d', 'k1', 'sent', now() + interval '1 minute')`,
      [PEER],
    );
    const t = await chat.chatThread(PEER);
    expect(t.messages.at(-1)).toMatchObject({ fromThem: false, by: "scheduled", body: "Hi Pratibha, your membership ends soon" });
  });

  it("emails the coach about a new WhatsApp message, at most once per conversation per half hour", async () => {
    process.env.COACH_EMAIL = "coach@example.com";
    try {
      await social.handleInbound(wa("8", "Kal subah trial le sakta hu?"));
      await social.handleInbound(wa("9", "Please reply"));
      const { rows } = await pool.query(`select to_address, subject, body from public.message_outbox where kind = 'chat-alert'`);
      expect(rows).toHaveLength(1);
      expect(rows[0].to_address).toBe("coach@example.com");
      expect(rows[0].subject).toBe("💬 WhatsApp from Pratibha");
      expect(rows[0].body).toContain("“Kal subah trial le sakta hu?”");
      expect(rows[0].body).toContain("/admin/chats");
    } finally {
      delete process.env.COACH_EMAIL;
    }
  });

  it("streams a customer's photo with the token, and refuses odd ids", async () => {
    const file = await meta.whatsappMedia("55501");
    expect(file?.type).toBe("image/jpeg");
    expect(new Uint8Array(file!.data)).toEqual(new Uint8Array([0xff, 0xd8, 0xff]));
    expect(await meta.whatsappMedia("../etc/passwd")).toBeNull();
  });

  it("'Stop promotions' opts the number out: promotions are cancelled, membership messages still go", async () => {
    expect(await social.handleInbound(wa("10", "Stop promotions"))).toBe("replied");
    expect((sent[0].text as { body: string }).body).toMatch(/won't get promotional messages/);
    expect((await pool.query(`select phone from public.whatsapp_optouts`)).rows).toEqual([{ phone: PEER }]);
    // No lead, no diet reply: a tap on the button isn't an enquiry.
    expect((await pool.query(`select count(*)::int as n from public.leads`)).rows[0].n).toBe(0);

    const { enqueue, dispatch } = await import("@/lib/growth/outbox");
    const base = { channel: "whatsapp" as const, to: PEER, toName: "Pratibha", body: "x", params: ["Pratibha"] };
    await enqueue([
      { ...base, kind: "comeback", template: "rfc_comeback_offer_v2", dedupeKey: "comeback:t" },
      { ...base, kind: "renew-7", template: "rfc_renewal_7d", dedupeKey: "renew-7:t" },
    ]);
    sent.length = 0;
    await dispatch(5);
    expect(sent.map((s) => (s.template as { name: string }).name)).toEqual(["rfc_renewal_7d_v3"]); // queued under the old name, sent with the current one
    const { rows } = await pool.query(`select kind, status, last_error from public.message_outbox where to_address = $1 order by kind`, [PEER]);
    expect(rows).toEqual([
      { kind: "comeback", status: "cancelled", last_error: "Opted out of promotions" },
      { kind: "renew-7", status: "sent", last_error: null },
    ]);

    // "Start promotions" turns them back on.
    await social.handleInbound(wa("11", "Start promotions"));
    expect((await pool.query(`select count(*)::int as n from public.whatsapp_optouts`)).rows[0].n).toBe(0);
  });

  it("after a customer's call: one follow-up template a week, only when switched on, never after Stop promotions", async () => {
    const { handleCall } = await import("./calls");
    const call = (id: string, event = "terminate") => ({ id, from: PEER, fromName: "Pratibha", event, status: "completed", direction: "USER_INITIATED", raw: { calls: [{ id }] } });
    sent.length = 0;
    // Off until a real payload has been checked: logged, nothing sent.
    expect(await handleCall(call("c1"))).toBe("off");
    expect(sent).toEqual([]);
    process.env.CALL_FOLLOWUP = "on";
    try {
      expect(await handleCall(call("c1"))).toBe("duplicate");
      expect(await handleCall(call("c2", "connect"))).toBe("logged");
      expect(await handleCall(call("c2"))).toBe("queued");
      expect(sent.map((s) => (s.template as { name: string }).name)).toEqual(["rfc_call_followup_v3"]);
      expect(await handleCall(call("c3"))).toBe("limited"); // a second call the same week
      await pool.query(`update public.message_outbox set created_at = now() - interval '8 days' where kind = 'call-followup'`);
      await pool.query(`insert into public.whatsapp_optouts (phone) values ($1)`, [PEER]);
      expect(await handleCall(call("c4"))).toBe("opted-out");
      const { rows } = await pool.query(`select count(*)::int as n, max(payload::text) as p from public.whatsapp_calls`);
      expect(rows[0].n).toBe(5);
      expect(rows[0].p).toContain('"calls"');
    } finally {
      delete process.env.CALL_FOLLOWUP;
    }
  });

  it("a burst of greetings delivered at once still gets one reply", async () => {
    // A later message from the same burst is already stored when the first one is handled.
    await pool.query(`insert into public.social_inbox (id, channel, kind, from_id, from_name, body, intent, created_at) values ('wa:later', 'whatsapp', 'message', $1, 'Pratibha', 'Hi', 'hello', now() + interval '1 second')`, [PEER]);
    sent.length = 0;
    expect(await social.handleInbound(wa("20", "Hi"))).toBe("replied");
    expect(await social.handleInbound(wa("21", "Hi again"))).toBe("logged"); // one greeting per 12 hours
    expect(sent).toHaveLength(1);
  });

  it("the trial funnel: offer → 'Yes' → ₹49 checkout button; plans and coach buttons; 'yes' without an offer is not a sale", async () => {
    const inter = () => sent.filter((s) => s.type === "interactive").map((s) => s.interactive as { type: string; body: { text: string }; action: Record<string, unknown> });
    expect(await social.handleInbound(wa("30", "yes"))).toBe("replied"); // no offer yet: the menu, not a checkout
    expect(inter().map((i) => i.type)).toEqual(["list"]);
    sent.length = 0;

    await social.handleInbound(wa("31", "Need diet plan for weight loss, veg"));
    const [offer] = inter();
    expect(offer.type).toBe("button");
    expect(offer.body.text).toContain("Made for your goal: *Fat loss*");
    expect(offer.body.text).toContain("pure veg");
    expect((offer.action.buttons as { reply: { id: string } }[]).map((b) => b.reply.id)).toEqual(["rfc_trial7", "rfc_plans", "rfc_coach"]);
    sent.length = 0;

    expect(await social.handleInbound(wa("32", "Yes"))).toBe("replied");
    const [cta] = inter();
    expect(cta.type).toBe("cta_url");
    expect(cta.action).toEqual({ name: "cta_url", parameters: { display_text: "Start for ₹49", url: expect.stringMatching(/\/diet-chart\?plan=trial&utm_source=whatsapp.*#order$/) } });
    sent.length = 0;

    await social.handleInbound(wa("33", "📋 See all plans", undefined, "rfc_plans"));
    expect(inter()[0].body.text).toContain("*3-Month Transformation* – ₹2,999");
    sent.length = 0;
    await social.handleInbound(wa("34", "💬 Talk to coach", undefined, "rfc_coach"));
    expect(inter()[0].body.text).toContain("*Coach Aman* will reply here personally");

    const t = await chat.chatThread(PEER);
    expect(t.messages.filter((m) => m.by === "auto-reply").map((m) => m.body.split("\n")[0])).toContain("Great choice! 🎉 Just 3 easy steps:");
  });

  it("a button message Meta refuses still reaches the customer as text", async () => {
    const normal = globalThis.fetch;
    onTestFinished(() => {
      vi.stubGlobal("fetch", normal);
    });
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string }) => {
      const b = JSON.parse(init?.body ?? "{}");
      if (u.endsWith("/123/messages")) {
        sent.push(b);
        return b.type === "interactive" ? new Response(JSON.stringify({ error: { message: "(#131009) Parameter value is not valid" } }), { status: 400 }) : new Response(JSON.stringify({ messages: [{ id: "wamid.t" }] }));
      }
      return new Response("{}", { status: 404 });
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await social.handleInbound(wa("40", "Hi"))).toBe("replied");
    expect(sent.map((s) => s.type)).toEqual(["interactive", "text"]);
    expect((sent[1].text as { body: string }).body).toContain("• 7-day diet plan ₹49");
  });

  it("coach tools: profile, one-tap replies, bot pause, and templates once the window has closed", async () => {
    const tools = await import("./chat-tools");
    await pool.query(`insert into public.leads (name, phone, source, status) values ('Pratibha', '98765 43210', 'website', 'new')`);
    await social.handleInbound(wa("50", "kitne ka hai"));

    let c = await tools.contactInfo(PEER);
    expect(c).toMatchObject({ name: "Pratibha", optedOut: false, botPausedUntil: null, member: null, lead: { status: "new" } });

    // One-tap trial link: the checkout button goes out, and the bot steps back for 2 hours.
    sent.length = 0;
    expect(await tools.sendQuickReply(PEER, "trial7", "coach@x.in")).toEqual({ ok: true });
    expect((sent[0].interactive as { type: string }).type).toBe("cta_url");
    expect((await tools.contactInfo(PEER)).botPausedUntil).not.toBeNull();
    sent.length = 0;
    expect(await social.handleInbound(wa("51", "diet plan?"))).toBe("logged"); // paused: the coach answers
    expect(sent).toEqual([]);
    await tools.pauseBot(PEER, null);
    expect(await social.handleInbound(wa("52", "diet plan?"))).toBe("replied");

    // Lead status, notes and promotions from the panel.
    expect(await tools.setLeadStatus(PEER, "trial")).toEqual({ ok: true });
    expect(await tools.setLeadStatus(PEER, "vip")).toMatchObject({ ok: false, status: 400 });
    await tools.saveNotes(PEER, "Knee injury, evening batch");
    c = await tools.contactInfo(PEER);
    expect(c).toMatchObject({ notes: "Knee injury, evening batch", lead: { status: "trial" } });

    // The window closes: free text is refused, a template still goes.
    await pool.query(`update public.social_inbox set created_at = now() - interval '25 hours'`);
    expect(await tools.sendQuickReply(PEER, "trial7", "coach@x.in")).toMatchObject({ ok: false, status: 409 });
    sent.length = 0;
    expect(await tools.sendManualTemplate(PEER, "call-followup", "coach@x.in")).toEqual({ ok: true });
    expect(sent[0]).toMatchObject({ type: "template", template: { name: "rfc_call_followup_v3" } });
    await tools.setOptOut(PEER, true);
    expect(await tools.sendManualTemplate(PEER, "call-followup", "coach@x.in")).toMatchObject({ ok: false });
    const [summary] = await chat.listChats();
    expect(summary).toMatchObject({ tag: "lead", botPaused: false });
  });
});

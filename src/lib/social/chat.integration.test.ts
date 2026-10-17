// The admin WhatsApp chat on a real Postgres (migrations applied), with Meta's API stubbed:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/social/chat.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    await pool.query("truncate public.social_inbox, public.chat_replies, public.message_outbox, public.leads, public.members cascade");
    sent.length = 0;
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const PEER = "919876543210";
  const wa = (id: string, text: string, media?: { type: "image"; id: string }) => ({ id: `wa:${id}`, channel: "whatsapp" as const, kind: "message" as const, from: PEER, fromName: "Pratibha", text, ...(media ? { media } : {}) });

  it("shows the customer's messages, the auto-replies and the sample PDF as one conversation", async () => {
    expect(await social.handleInbound(wa("1", "Need a fat lose diet plan"))).toBe("replied");
    await social.handleInbound(wa("2", "", { type: "image", id: "55501" }));

    // Text reply, then the sample PDF as a document.
    expect(sent.map((s) => s.type)).toEqual(["text", "document"]);
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
    expect(t.messages[1].body).toContain("*3-Month Fat-Loss Program*");
    expect(t.messages[3].media).toEqual({ type: "image", id: "55501" });

    const [summary] = await chat.listChats();
    expect(summary).toMatchObject({ peer: PEER, name: "Pratibha", lastFromThem: true, lastBody: "📷 Photo" });
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
      expect(rows[0].body).toContain('"Kal subah trial le sakta hu?"');
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
});

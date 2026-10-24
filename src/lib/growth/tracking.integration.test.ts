// Delivery, read, failure and click tracking on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/tracking.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => DEFAULT_CONTENT };
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("message tracking on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let tr: typeof import("./tracking");
  let ob: typeof import("./outbox");
  const sent: string[] = [];
  const emailed: string[] = [];

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    delete process.env.RESEND_API_KEY;
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string }) => {
      const b = JSON.parse(init?.body ?? "{}");
      if (u.endsWith("/emails")) {
        emailed.push(...[b.to].flat());
        return new Response(JSON.stringify({ id: `em_${emailed.length}` }), { headers: { "content-type": "application/json" } });
      }
      if (u.endsWith("/123/messages")) sent.push(b.to);
      return new Response(JSON.stringify({ messages: [{ id: `wamid.${b.to}` }] }), { headers: { "content-type": "application/json" } });
    });
    pool = (await import("@/health/db")).pool;
    tr = await import("./tracking");
    ob = await import("./outbox");
  });
  beforeEach(async () => {
    await pool.query("truncate public.message_outbox, public.message_events, public.whatsapp_optouts, public.whatsapp_unreachable, public.marketing_contacts, public.email_suppressions cascade");
    sent.length = 0;
    emailed.length = 0;
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const offer = (to: string, code: string) => ({
    channel: "whatsapp" as const,
    to,
    toName: "Test",
    kind: "offer-broadcast",
    body: "offer",
    template: "rfc_offer_broadcast_v1",
    params: ["Test", "Royal Fitness Club", "offer", `https://www.royalfitnesclub.in/r/${code}`],
    dedupeKey: `campaign:t:${to}`,
    link: { code, url: "https://www.royalfitnesclub.in/membership?utm_source=whatsapp" },
  });
  const status = (id: string, s: "delivered" | "read" | "failed", recipient: string, code: string | null = null) => ({ id, status: s, at: new Date(), recipient, code, reason: code ? "Message Undeliverable." : null });
  const row = async (to: string) =>
    (await pool.query(`select status, provider_id, delivery, delivered_at is not null as d, read_at is not null as r, fail_code, clicks, last_error from public.message_outbox where to_address = $1`, [to])).rows[0];

  it("keeps Meta's id on send, then records delivered and read in any order", async () => {
    await ob.enqueue([offer("919876543210", "AAAAAAAA1")]);
    await ob.dispatch(5);
    expect(await row("919876543210")).toMatchObject({ status: "sent", provider_id: "wamid.919876543210", delivery: null });
    expect(await tr.recordWhatsAppStatus(status("wamid.919876543210", "read", "919876543210"))).toBe("read");
    // "delivered" arriving after "read" fills its time but doesn't downgrade the status.
    await tr.recordWhatsAppStatus(status("wamid.919876543210", "delivered", "919876543210"));
    expect(await row("919876543210")).toMatchObject({ delivery: "read", d: true, r: true });
    expect((await pool.query(`select count(*)::int as n from public.message_events`)).rows[0].n).toBe(2);
  });

  it("matches statuses for messages sent before ids were kept, by number and time", async () => {
    await pool.query(`insert into public.message_outbox (channel, to_address, kind, body, dedupe_key, status, sent_at) values ('whatsapp', '919811112222', 'offer-broadcast', 'x', 'old:1', 'sent', now() - interval '1 hour')`);
    expect(await tr.recordWhatsAppStatus(status("wamid.OLD", "delivered", "919811112222"))).toBe("delivered");
    expect(await row("919811112222")).toMatchObject({ provider_id: "wamid.OLD", delivery: "delivered" });
    expect(await tr.recordWhatsAppStatus(status("wamid.UNKNOWN", "delivered", "919000000000"))).toBe("unmatched");
  });

  it("a number that can't receive WhatsApp is skipped from then on; 131050 counts as an opt-out", async () => {
    await ob.enqueue([offer("919822223333", "AAAAAAAA2"), offer("919833334444", "AAAAAAAA3")]);
    await ob.dispatch(5);
    await tr.recordWhatsAppStatus(status("wamid.919822223333", "failed", "919822223333", "131026"));
    await tr.recordWhatsAppStatus(status("wamid.919833334444", "failed", "919833334444", "131050"));
    expect(await row("919822223333")).toMatchObject({ delivery: "failed", fail_code: "131026" });
    expect((await pool.query(`select phone from public.whatsapp_unreachable`)).rows).toEqual([{ phone: "919822223333" }]);
    expect((await pool.query(`select phone from public.whatsapp_optouts`)).rows).toEqual([{ phone: "919833334444" }]);
    // The next promotion to the unreachable number is cancelled, not sent.
    sent.length = 0;
    await ob.enqueue([{ ...offer("919822223333", "AAAAAAAA4"), dedupeKey: "campaign:t2:919822223333" }]);
    await ob.dispatch(5);
    expect(sent).toEqual([]);
    expect((await pool.query(`select status, last_error from public.message_outbox where dedupe_key = 'campaign:t2:919822223333'`)).rows[0]).toEqual({ status: "cancelled", last_error: "WhatsApp says this number can't receive messages" });
  });

  it("counts people's clicks, not link previews, and redirects to the stored page", async () => {
    await ob.enqueue([offer("919844445555", "AAAAAAAA5")]);
    expect(await tr.recordClick("AAAAAAAA5", false)).toBe("https://www.royalfitnesclub.in/membership?utm_source=whatsapp");
    expect(await tr.recordClick("AAAAAAAA5", true)).toBe("https://www.royalfitnesclub.in/membership?utm_source=whatsapp");
    expect(await tr.recordClick("AAAAAAAA5", true)).not.toBeNull();
    expect((await row("919844445555")).clicks).toBe(2);
    expect(await tr.recordClick("NOPE00000", true)).toBeNull();
  });

  it("email: opened counts as read, a bounce or complaint unsubscribes", async () => {
    await pool.query(`insert into public.message_outbox (channel, to_address, kind, body, dedupe_key, status, sent_at, provider_id) values ('email', 'a@x.in', 'nurture-campaign', 'x', 'e:1', 'sent', now(), 'em_1'), ('email', 'b@x.in', 'nurture-campaign', 'x', 'e:2', 'sent', now(), 'em_2')`);
    await pool.query(`insert into public.marketing_contacts (channel, address, source, consent_at) values ('email', 'b@x.in', 'test', now())`);
    await tr.recordEmailEvent({ emailId: "em_1", type: "opened", at: new Date(), link: null, reason: null });
    expect(await row("a@x.in")).toMatchObject({ delivery: "read", d: true, r: true });
    await tr.recordEmailEvent({ emailId: "em_2", type: "bounced", at: new Date(), link: null, reason: "Mailbox does not exist" });
    expect(await row("b@x.in")).toMatchObject({ delivery: "bounced" });
    expect((await pool.query(`select unsubscribed_at is not null as u from public.marketing_contacts where address = 'b@x.in'`)).rows[0].u).toBe(true);
  });

  it("email: a hard bounce or complaint suppresses the address even without a contact row; a full inbox doesn't", async () => {
    await pool.query(
      `insert into public.message_outbox (channel, to_address, kind, body, dedupe_key, status, sent_at, provider_id) values
         ('email', 'Hard@X.in', 'nurture-campaign', 'x', 'e:h', 'sent', now(), 'em_h'),
         ('email', 'full@x.in', 'nurture-campaign', 'x', 'e:f', 'sent', now(), 'em_f'),
         ('email', 'spam@x.in', 'nurture-campaign', 'x', 'e:s', 'sent', now(), 'em_s')`,
    );
    await tr.recordEmailEvent({ emailId: "em_h", type: "bounced", at: new Date(), link: null, reason: "Mailbox does not exist", bounceType: "Permanent" });
    await tr.recordEmailEvent({ emailId: "em_f", type: "bounced", at: new Date(), link: null, reason: "Inbox full", bounceType: "Transient" });
    await tr.recordEmailEvent({ emailId: "em_s", type: "complained", at: new Date(), link: null, reason: null });
    expect((await pool.query(`select address, reason from public.email_suppressions order by address`)).rows).toEqual([
      { address: "hard@x.in", reason: "bounced" },
      { address: "spam@x.in", reason: "complained" },
    ]);
  });

  it("email: marketing to a suppressed address is cancelled at send time; receipts still go", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Royal Fitness Club <hello@example.in>";
    try {
      await pool.query(`insert into public.email_suppressions (address, reason) values ('gone@x.in', 'bounced')`);
      const mail = (kind: string, key: string) => ({ channel: "email" as const, to: "gone@x.in", toName: "T", kind, body: "hi", template: "", params: [], dedupeKey: key, subject: "Hi" });
      await ob.enqueue([mail("nurture-campaign", "m:1"), mail("diet-plan-email", "r:1")]);
      await ob.dispatch(5);
      expect(emailed).toEqual(["gone@x.in"]);
      const rows = (await pool.query(`select kind, status, last_error from public.message_outbox order by kind`)).rows;
      expect(rows).toEqual([
        { kind: "diet-plan-email", status: "sent", last_error: null },
        { kind: "nurture-campaign", status: "cancelled", last_error: "Email address bounced or complained: no more marketing" },
      ]);
    } finally {
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_FROM;
    }
  });

  describe("WhatsApp billing failures (131042)", () => {
    const billingFailure = (hoursAgo: number) =>
      pool.query(
        `insert into public.message_outbox (channel, to_address, kind, body, dedupe_key, status, sent_at, delivery, fail_code, failed_at)
         values ('whatsapp', '919700000000', 'offer-broadcast', 'x', 'bill:${hoursAgo}', 'sent', now() - make_interval(hours => $1), 'failed', '131042', now() - make_interval(hours => $1))`,
        [hoursAgo],
      );
    const queueOffers = (n: number) => ob.enqueue(Array.from({ length: n }, (_, i) => offer(`9198000000${String(i).padStart(2, "0")}`, `BILL0000${i}`)));
    const utility = { channel: "whatsapp" as const, to: "919811100000", toName: "T", kind: "diet-plan-ready", body: "x", template: "rfc_diet_plan_ready_v1", params: ["T"], dedupeKey: "util:1" };

    it("holds promotions for a day after a billing failure, but utility messages still go", async () => {
      await billingFailure(2);
      await queueOffers(3);
      await ob.enqueue([utility]);
      const r = await ob.dispatch(20);
      expect(sent).toEqual(["919811100000"]);
      expect(r.whatsappBilling).toBe("hold");
      expect((await pool.query(`select count(*)::int as n from public.message_outbox where kind = 'offer-broadcast' and status = 'pending'`)).rows[0].n).toBe(3);
    });

    it("the daily run doesn't sit waiting for a cap that billing keeps shut", async () => {
      await billingFailure(2);
      // Yesterday's promotions fill the window, so without the gate the run would wait for room.
      await pool.query(`insert into public.message_outbox (channel, to_address, kind, body, dedupe_key, status, sent_at) values ('whatsapp', '919700000002', 'offer-broadcast', 'x', 'y:1', 'sent', now() - interval '23 hours 59 minutes 58 seconds')`);
      await queueOffers(2);
      const started = Date.now();
      const r = await ob.dispatch(20, Date.now() + 10_000, { waitForCap: true });
      expect(Date.now() - started).toBeLessThan(1500);
      expect(r.waitedMs ?? 0).toBe(0);
      expect(sent).toEqual([]);
    });

    it("after a day, sends only a small probe per run", async () => {
      await billingFailure(30);
      await queueOffers(8);
      const r = await ob.dispatch(20);
      expect(sent).toHaveLength(5);
      expect(r.whatsappBilling).toBe("probe");
    });

    it("reopens fully once a promotion is delivered after the failure", async () => {
      await billingFailure(30);
      await pool.query(
        `insert into public.message_outbox (channel, to_address, kind, body, dedupe_key, status, sent_at, delivery, delivered_at)
         values ('whatsapp', '919700000001', 'offer-broadcast', 'x', 'ok:1', 'sent', now() - interval '3 hours', 'delivered', now() - interval '3 hours')`,
      );
      await queueOffers(8);
      const r = await ob.dispatch(20);
      expect(sent).toHaveLength(8);
      expect(r.whatsappBilling).toBe("open");
    });
  });
});

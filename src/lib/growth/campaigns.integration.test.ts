// Audience and campaigns on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/campaigns.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readCsv } from "./sheet";
import { toContacts } from "./audience";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => DEFAULT_CONTENT };
});

const url = process.env.TEST_DATABASE_URL;
const TODAY = "2026-10-17";

describe.skipIf(!url)("audience and campaigns on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let cm: typeof import("./campaigns");
  const sent: { to: string; template?: string }[] = [];

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string }) => {
      const b = JSON.parse(init?.body ?? "{}");
      if (u.endsWith("/123/messages")) sent.push({ to: b.to, template: b.template?.name });
      return new Response(JSON.stringify({ messages: [{ id: `wamid.${sent.length}` }] }), { headers: { "content-type": "application/json" } });
    });
    pool = (await import("@/health/db")).pool;
    cm = await import("./campaigns");
  });
  beforeEach(async () => {
    await pool.query("truncate public.audience_contacts, public.campaigns, public.message_outbox, public.whatsapp_optouts, public.marketing_contacts, public.leads, public.members cascade");
    sent.length = 0;
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const member = (name: string, phone: string, expires: string, email: string | null = null) =>
    pool.query(`insert into public.members (name, phone, email, plan_name, start_on, expires_on, referral_code) values ($1, $2, $3, 'Monthly', $4::date - 30, $4, $5)`, [name, phone, email, expires, `RFC-${phone.slice(-4)}-ABCD`]);

  it("imports an old-members sheet: preview first, skips current members, updates on a second import", async () => {
    await member("Already Member", "9000000001", "2026-11-30");
    const sheet = toContacts(readCsv("Name,Mobile,Email\nAlready Member,9000000001,\nOld One,9000000002,old@x.in\nEmail Only,,only@x.in\n"));
    if (typeof sheet === "string") throw new Error(sheet);
    expect(await cm.importContacts(sheet.contacts, { tag: "Members 2023", status: "past" }, false)).toEqual({ add: 2, update: 0, members: 1, total: 3 });
    expect((await pool.query("select count(*)::int as n from public.audience_contacts")).rows[0].n).toBe(0); // preview saves nothing
    await cm.importContacts(sheet.contacts, { tag: "Members 2023", status: "past" }, true);
    expect(await cm.importContacts(sheet.contacts, { tag: "", status: "past" }, false)).toMatchObject({ add: 0, update: 2 });
    expect(await cm.importedCount()).toEqual({ total: 2, tags: [{ tag: "Members 2023", n: 2 }] });
  });

  it("segments members by date, dedupes everyone, and exports what Meta needs", async () => {
    await member("Current", "9000000011", "2026-12-31", "cur@x.in");
    await member("Expiring", "9000000012", "2026-10-30");
    await member("Recent Ex", "9000000013", "2026-09-01");
    await member("Old Ex", "9000000014", "2025-01-01");
    await pool.query(`insert into public.audience_contacts (name, phone) values ('Imported', '9000000015'), ('Same As Old Ex', '9000000014')`);
    await pool.query(`insert into public.leads (name, phone, source, status) values ('Lead', '90000 00016', 'website', 'new'), ('Joined Lead', '9000000011', 'website', 'new')`);
    const counts = Object.fromEntries((await cm.segmentCounts(TODAY)).map((s) => [s.id, s.total]));
    // "Same As Old Ex" is on the member list, so only the member segments count them.
    expect(counts).toEqual({ current: 2, expiring: 1, "ex-recent": 1, "ex-old": 1, imported: 1, leads: 1, everyone: 6 });
    const everyone = await cm.recipients("everyone", TODAY);
    expect(everyone.map((r) => r.phone).sort()).toEqual(["9000000011", "9000000012", "9000000013", "9000000014", "9000000015", "9000000016"]);
  });

  it("a WhatsApp campaign skips opted-out people and anyone promoted this week, never sends twice, and sends in batches", async () => {
    await member("Asha", "9000000021", "2026-09-01");
    await member("Bina", "9000000022", "2026-09-10");
    await member("Chetan", "9000000023", "2026-09-15");
    await pool.query(`insert into public.whatsapp_optouts (phone) values ('919000000022')`);
    await pool.query(
      `insert into public.message_outbox (channel, to_address, to_name, kind, body, template, dedupe_key, status, sent_at) values ('whatsapp', '919000000023', 'Chetan', 'comeback', 'x', 'rfc_comeback_offer_v2', 'k', 'sent', now() - interval '2 days')`,
    );
    const req = { name: "Diwali comeback", segment: "ex-recent", channel: "whatsapp", offer: "3 months for ₹4,000 till 31 Oct", link: "membership" };
    expect(cm.validateCampaign({ ...req, offer: "see https://x.in" })).toMatch(/links/);
    expect(cm.validateCampaign({ ...req, channel: "whatsapp", link: "shop" })).toMatch(/supplement shop/);
    expect(cm.validateCampaign({ ...req, channel: "email", subject: "Offer", link: "shop" })).toBeNull();
    const r = await cm.createCampaign(req, "coach@x.in", TODAY);
    expect(r).toMatchObject({ ok: true, audience: 3, queued: 1, skipped: { optedOut: 1, recent: 1, missing: 0 } });
    await cm.sendBatch(50);
    expect(sent).toEqual([{ to: "919000000021", template: "rfc_offer_broadcast_v3" }]);
    const [row] = await cm.listCampaigns();
    expect(row).toMatchObject({ name: "Diwali comeback", sent: 1, pending: 0, skipped: 2 });

    // A second campaign the same week reaches nobody new: A just got one.
    const again = await cm.createCampaign({ ...req, name: "Second" }, "coach@x.in", TODAY);
    expect(again).toMatchObject({ ok: true, queued: 0, skipped: { recent: 2, optedOut: 1 } });
  });

  it("an email campaign skips unsubscribed addresses", async () => {
    await member("Mail Me", "9000000031", "2026-12-31", "yes@x.in");
    await member("No Mail", "9000000032", "2026-12-31", "no@x.in");
    await member("No Email", "9000000033", "2026-12-31");
    await pool.query(`insert into public.marketing_contacts (channel, address, source, consent_at, unsubscribed_at) values ('email', 'no@x.in', 'unsubscribe', now(), now())`);
    const r = await cm.createCampaign({ name: "Upgrade", segment: "current", channel: "email", offer: "Add a personal diet plan for ₹999", link: "plans", subject: "Your diet, made for you" }, "coach", TODAY);
    expect(r).toMatchObject({ ok: true, audience: 3, queued: 1, skipped: { optedOut: 1, missing: 1 } });
    const { rows } = await pool.query(`select to_address, kind, subject from public.message_outbox where dedupe_key like 'campaign:%'`);
    expect(rows).toEqual([{ to_address: "yes@x.in", kind: "nurture-campaign", subject: "Your diet, made for you" }]);
  });

  it("a monthly campaign runs again with the daily job for whoever is eligible then, until it is stopped", async () => {
    await member("Asha", "9000000041", "2026-09-01");
    const r = await cm.createCampaign({ name: "Monthly comeback", segment: "ex-recent", channel: "whatsapp", offer: "Restart this month for ₹1,500", link: "membership", repeat: "monthly" }, "coach", TODAY);
    expect(r).toMatchObject({ ok: true, queued: 1 });
    expect((await cm.listCampaigns())[0]).toMatchObject({ repeat: "monthly", nextRun: "2026-11-17", active: true });
    expect(await cm.runRecurringCampaigns(TODAY)).toEqual({ runs: 0, queued: 0 }); // not due yet

    // A month on: a new ex-member joined the segment, and Asha's last promotion is old.
    await pool.query(`update public.message_outbox set created_at = now() - interval '31 days'`);
    await member("Bina", "9000000042", "2026-11-01");
    expect(await cm.runRecurringCampaigns("2026-11-17")).toEqual({ runs: 1, queued: 2 });
    expect(await cm.runRecurringCampaigns("2026-11-17")).toEqual({ runs: 0, queued: 0 }); // moved on to next month
    expect((await cm.listCampaigns())[0]).toMatchObject({ nextRun: "2026-12-17", queued: 3 });

    await cm.stopRepeating(r.ok ? r.id : "");
    await pool.query(`update public.message_outbox set created_at = now() - interval '31 days'`);
    expect(await cm.runRecurringCampaigns("2026-12-17")).toEqual({ runs: 0, queued: 0 });
    expect((await cm.listCampaigns())[0]).toMatchObject({ active: false, nextRun: null });
  });

  it("sends receipts before promotions and holds WhatsApp promotions at the daily cap", async () => {
    const outbox = await import("./outbox");
    const q = (kind: string, to: string, key: string, minsAgo: number) =>
      pool.query(`insert into public.message_outbox (channel, to_address, kind, body, template, dedupe_key, created_at) values ('whatsapp', $1, $2, 'x', 'tpl', $3, now() - make_interval(mins => $4))`, [to, kind, key, minsAgo]);
    process.env.WHATSAPP_MARKETING_DAILY_CAP = "2";
    try {
      // Three promotions queued first, then a payment receipt.
      await q("offer-broadcast", "919000000051", "p1", 30);
      await q("offer-broadcast", "919000000052", "p2", 29);
      await q("offer-broadcast", "919000000053", "p3", 28);
      await q("welcome", "919000000054", "w1", 1);
      const r = await outbox.dispatch(10);
      expect(r).toMatchObject({ sent: 3, failed: 0, marketingHeld: true });
      expect(sent.map((x) => x.to)).toEqual(["919000000054", "919000000051", "919000000052"]);
      const { rows } = await pool.query(`select dedupe_key, status from public.message_outbox order by dedupe_key`);
      expect(rows).toEqual([
        { dedupe_key: "p1", status: "sent" },
        { dedupe_key: "p2", status: "sent" },
        { dedupe_key: "p3", status: "pending" }, // tomorrow's run
        { dedupe_key: "w1", status: "sent" },
      ]);
      // The cap counts the last 24 hours, so a second run today still holds it.
      expect(await outbox.dispatch(10)).toMatchObject({ sent: 0 });
    } finally {
      delete process.env.WHATSAPP_MARKETING_DAILY_CAP;
    }
  });

  it("the daily run waits out yesterday's batch leaving the 24-hour window, instead of skipping a day", async () => {
    const outbox = await import("./outbox");
    const q = (kind: string, to: string, key: string, status: string, sentAgoSecs: number | null) =>
      pool.query(
        `insert into public.message_outbox (channel, to_address, kind, body, template, dedupe_key, status, sent_at, created_at)
         values ('whatsapp', $1, $2, 'x', 'tpl', $3, $4, case when $5::int is null then null else now() - make_interval(secs => $5::int) end, now() - interval '2 days')`,
        [to, kind, key, status, sentAgoSecs],
      );
    process.env.WHATSAPP_MARKETING_DAILY_CAP = "2";
    try {
      // Yesterday's two promotions, sent 24 hours minus 2 seconds ago: the cap is full for 2 more seconds.
      await q("offer-broadcast", "919000000081", "y1", "sent", 86400 - 2);
      await q("offer-broadcast", "919000000082", "y2", "sent", 86400 - 2);
      await q("offer-broadcast", "919000000083", "t1", "pending", null);
      await q("offer-broadcast", "919000000084", "t2", "pending", null);
      // Without waiting (any other caller), nothing goes.
      expect(await outbox.dispatch(10)).toMatchObject({ sent: 0, marketingHeld: true });
      // The daily run waits ~2.5 s, then sends today's two, and never more than the cap in 24 hours.
      const r = await outbox.dispatch(10, Date.now() + 15_000, { waitForCap: true });
      expect(r).toMatchObject({ sent: 2, failed: 0 });
      expect(r.waitedMs).toBeGreaterThan(1000);
      expect(sent.map((x) => x.to)).toEqual(["919000000083", "919000000084"]);
      const { rows } = await pool.query<{ n: number }>(`select count(*)::int as n from public.message_outbox where status = 'sent' and sent_at > now() - interval '24 hours'`);
      expect(rows[0].n).toBe(2);
    } finally {
      delete process.env.WHATSAPP_MARKETING_DAILY_CAP;
    }
  }, 30_000);

  it("the daily run doesn't wait when the cap frees up only after its deadline", async () => {
    const outbox = await import("./outbox");
    await pool.query(
      `insert into public.message_outbox (channel, to_address, kind, body, template, dedupe_key, status, sent_at) values
        ('whatsapp', '919000000091', 'offer-broadcast', 'x', 'tpl', 'z1', 'sent', now() - interval '1 hour'),
        ('whatsapp', '919000000092', 'offer-broadcast', 'x', 'tpl', 'z2', 'pending', null)`,
    );
    process.env.WHATSAPP_MARKETING_DAILY_CAP = "1";
    try {
      const t = Date.now();
      expect(await outbox.dispatch(10, Date.now() + 3_000, { waitForCap: true })).toMatchObject({ sent: 0, marketingHeld: true });
      expect(Date.now() - t).toBeLessThan(1500);
    } finally {
      delete process.env.WHATSAPP_MARKETING_DAILY_CAP;
    }
  });

  it("an imported contact who later goes on the member list leaves the imported segment", async () => {
    const sheet = toContacts(readCsv("Name,Mobile\nOld One,9000000061\nStill Contact,9000000062\n"));
    if (typeof sheet === "string") throw new Error(sheet);
    await cm.importContacts(sheet.contacts, { tag: "", status: "past" }, true);
    await member("Old One", "9000000061", "2026-08-01");
    const imported = await cm.recipients("imported", TODAY);
    expect(imported.map((r) => r.phone)).toEqual(["9000000062"]);
    expect((await cm.recipients("ex-recent", TODAY)).map((r) => r.phone)).toEqual(["9000000061"]);
  });

  it("credits a campaign with people who paid within 14 days of its message", async () => {
    await member("Asha", "9000000071", "2026-09-01");
    await member("Bina", "9000000072", "2026-09-02");
    const r = await cm.createCampaign({ name: "Comeback", segment: "ex-recent", channel: "whatsapp", offer: "Restart this month for ₹1,500", link: "membership" }, "coach", TODAY);
    expect(r).toMatchObject({ ok: true, queued: 2 });
    await pool.query(`update public.message_outbox set status = 'sent', sent_at = now() - interval '20 days' where dedupe_key like 'campaign:%'`);
    const order = (id: string, phone: string, paise: number, daysAgo: number) =>
      pool.query(
        `insert into public.membership_orders (razorpay_order_id, status, plan_id, plan_name, duration, amount_paise, name, phone, paid_at) values ($1, 'paid', 'monthly', 'Monthly', '1 month', $2, 'Buyer', $3, now() - make_interval(days => $4))`,
        [id, paise, phone, daysAgo],
      );
    await order("order_A", "+91 90000 00071", 150000, 15); // 5 days after the message
    await order("order_B", "9000000072", 200000, 1); // 19 days after: not credited
    expect((await cm.listCampaigns())[0]).toMatchObject({ sent: 2, buyers: 1, revenue: 1500 });
    // Supplement and book orders count too, net of refunds; a fully refunded one adds nothing.
    await pool.query(
      `insert into public.shop_orders (number, razorpay_order_id, status, name, email, phone, address, items, list_total, discount_total, total, refunded_paise, paid_at)
       values ('RS-CAMP01', 'order_S', 'paid', 'Bina', 'bina@example.com', '9000000072', '{}', '[]', 800, 0, 800, 30000, now() - interval '17 days')`,
    );
    await pool.query(
      `insert into public.book_orders (razorpay_order_id, status, item_id, title, slugs, amount_paise, refunded_paise, name, email, phone, access_token, paid_at)
       values ('order_K', 'paid', 'x', 'Book', '{x}', 69900, 69900, 'Asha', 'asha@example.com', '9000000071', 'tok-camp', now() - interval '16 days')`,
    );
    expect((await cm.listCampaigns())[0]).toMatchObject({ sent: 2, buyers: 2, revenue: 2000 });
    await pool.query(`delete from public.shop_orders where razorpay_order_id = 'order_S'; delete from public.book_orders where razorpay_order_id = 'order_K'`);
  });

  it("holds marketing emails at the daily email cap and sends receipts first", async () => {
    const outbox = await import("./outbox");
    const sentMail: string[] = [];
    vi.stubGlobal("fetch", async (u: string, init?: { body?: string }) => {
      const b = JSON.parse(init?.body ?? "{}");
      if (String(u).includes("resend")) sentMail.push(Array.isArray(b.to) ? b.to[0] : b.to);
      return new Response(JSON.stringify({ id: `re_${sentMail.length}`, messages: [{ id: "w" }] }), { headers: { "content-type": "application/json" } });
    });
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Gym <hi@x.in>";
    process.env.EMAIL_MARKETING_DAILY_CAP = "1";
    try {
      const q = (kind: string, to: string, key: string, minsAgo: number) =>
        pool.query(`insert into public.message_outbox (channel, to_address, kind, body, subject, dedupe_key, created_at) values ('email', $1, $2, 'x', 's', $3, now() - make_interval(mins => $4))`, [to, kind, key, minsAgo]);
      await q("nurture-campaign", "a@x.in", "e1", 30);
      await q("nurture-campaign", "b@x.in", "e2", 29);
      await q("diet-received", "c@x.in", "r1", 1);
      await outbox.dispatch(10);
      expect(sentMail).toEqual(["c@x.in", "a@x.in"]);
      const { rows } = await pool.query(`select dedupe_key, status from public.message_outbox order by dedupe_key`);
      expect(rows).toEqual([
        { dedupe_key: "e1", status: "sent" },
        { dedupe_key: "e2", status: "pending" },
        { dedupe_key: "r1", status: "sent" },
      ]);
    } finally {
      delete process.env.EMAIL_MARKETING_DAILY_CAP;
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_FROM;
    }
  });
});

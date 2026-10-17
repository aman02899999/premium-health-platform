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
    expect(counts).toEqual({ current: 2, expiring: 1, "ex-recent": 1, "ex-old": 1, imported: 2, leads: 1, everyone: 6 });
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
    const r = await cm.createCampaign(req, "coach@x.in", TODAY);
    expect(r).toMatchObject({ ok: true, audience: 3, queued: 1, skipped: { optedOut: 1, recent: 1, missing: 0 } });
    await cm.sendBatch(50);
    expect(sent).toEqual([{ to: "919000000021", template: "rfc_offer_broadcast_v1" }]);
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
});

// Contacts directory on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/admin/contacts.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => DEFAULT_CONTENT };
});

const url = process.env.TEST_DATABASE_URL;
const today = "2026-10-21";

describe.skipIf(!url)("contacts on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let ct: typeof import("./contacts");
  let cp: typeof import("@/lib/growth/campaigns");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    ct = await import("./contacts");
    cp = await import("@/lib/growth/campaigns");
  });
  beforeEach(async () => {
    await pool.query(
      "truncate public.leads, public.members, public.membership_orders, public.diet_orders, public.shop_orders, public.book_orders, public.payment_requests, public.audience_contacts, public.social_inbox, public.marketing_contacts, public.contact_tags, public.contact_attributes, public.whatsapp_optouts, public.whatsapp_unreachable, public.message_outbox, public.campaigns cascade",
    );
    // Rahul: member, also a lead, also chatted on WhatsApp, also subscribed by email only.
    await pool.query(`insert into public.members (name, phone, email, plan_name, start_on, expires_on, referral_code) values
      ('Rahul Verma', '9811111111', 'rahul@example.com', 'Monthly', '2026-10-01', '2026-11-01', 'RAHUL-1'),
      ('Old Timer', '9822222222', null, 'Monthly', '2026-01-01', '2026-02-01', 'OLD-1')`);
    await pool.query(`insert into public.leads (name, phone, email, created_at) values ('rahul', '+91 98111 11111', null, '2026-10-02'), ('Priya', '98333 33333', 'PRIYA@example.com', '2026-10-10')`);
    await pool.query(`insert into public.social_inbox (id, created_at, channel, kind, from_id, from_name, body) values ('w1', '2026-10-20T10:00:00Z', 'whatsapp', 'message', '919811111111', 'Rahul V', 'hi')`);
    await pool.query(`insert into public.marketing_contacts (channel, address, consent_at) values ('email', 'rahul@example.com', now())`);
    await pool.query(`insert into public.audience_contacts (name, phone, email, tag) values ('Neha', '9844444444', null, 'Old Members 2024!'), ('', null, 'only@example.com', '')`);
  });
  afterAll(async () => {
    await pool.end();
  });

  it("one row per person across every source, email folded into the mobile", async () => {
    const { rows, total } = await ct.listContacts({}, 50, 0, today);
    expect(total).toBe(5); // Rahul, Old Timer, Priya, Neha, only@
    const rahul = rows.find((r) => r.key === "9811111111")!;
    expect(rahul.name).toBe("Rahul Verma"); // the member record wins
    expect(rahul.email).toBe("rahul@example.com");
    expect(rahul.kinds.sort()).toEqual(["chat", "lead", "member", "subscriber"]);
    expect(rahul.memberUntil).toBe("2026-11-01");
    expect(rows.find((r) => r.key === "9822222222")!.kinds).toEqual(["ex-member"]);
    expect(rows.find((r) => r.key === "9833333333")!.email).toBe("priya@example.com");
    expect(rows.find((r) => r.key === "only@example.com")!.kinds).toEqual(["imported"]);
  });

  it("import tags show as lists, folded like typed tags", async () => {
    const f = await ct.contactFacets(today);
    expect(f.total).toBe(5);
    expect(f.kinds).toMatchObject({ member: 1, "ex-member": 1, lead: 2, imported: 2, chat: 1, subscriber: 1 });
    expect(f.tags).toEqual([{ tag: "old members 2024", n: 1 }]);
  });

  it("search by name, digits and email; filter by kind and tag", async () => {
    expect((await ct.listContacts({ q: "priya" }, 50, 0, today)).rows.map((r) => r.key)).toEqual(["9833333333"]);
    expect((await ct.listContacts({ q: "98222" }, 50, 0, today)).rows.map((r) => r.key)).toEqual(["9822222222"]);
    expect((await ct.listContacts({ q: "only@" }, 50, 0, today)).total).toBe(1);
    expect((await ct.listContacts({ kind: "lead" }, 50, 0, today)).total).toBe(2);
    expect((await ct.listContacts({ tag: "Old Members 2024" }, 50, 0, today)).rows.map((r) => r.key)).toEqual(["9844444444"]);
    expect((await ct.listContacts({ q: "%" }, 50, 0, today)).total).toBe(0); // wildcards are literal
  });

  it("tags: add, remove (including an import tag), and bad keys are ignored", async () => {
    expect(await ct.addTag(["9811111111", "9833333333", "not-a-key"], "VIP!", "admin")).toBe(2);
    expect(await ct.addTag(["9811111111"], "vip", "admin")).toBe(0); // already tagged
    expect((await ct.listContacts({ tag: "vip" }, 50, 0, today)).total).toBe(2);
    expect(await ct.removeTag(["9833333333"], "vip")).toBe(1);
    expect(await ct.removeTag(["9844444444"], "old members 2024")).toBe(1);
    expect((await ct.contactFacets(today)).tags).toEqual([{ tag: "vip", n: 1 }]);
  });

  it("a list is a campaign audience; opted-out numbers are skipped", async () => {
    await ct.addTag(["9811111111", "9833333333"], "morning batch", "admin");
    await pool.query(`insert into public.whatsapp_optouts (phone) values ('919833333333')`);
    const r = await cp.recipients("tag:morning batch", today);
    expect(r.map((x) => x.phone).sort()).toEqual(["9811111111", "9833333333"]);
    expect(cp.isAudience("tag:morning batch")).toBe(true);
    expect(cp.isAudience("tag:Bad Tag")).toBe(false);
    const res = await cp.createCampaign({ name: "Morning", segment: "tag:morning batch", channel: "whatsapp", offer: "Free protein shake this week", link: "membership" }, "admin", today);
    expect(res).toMatchObject({ ok: true, audience: 2, queued: 1, skipped: { optedOut: 1 } });
    const counts = await cp.segmentCounts(today);
    expect(counts.find((s) => s.id === "tag:morning batch")).toMatchObject({ label: "List: morning batch", total: 2, whatsapp: 2 });
  });

  it("attributes and the contact panel", async () => {
    expect(await ct.setAttribute("9811111111", "Preferred time", "6 am")).toBe(true);
    expect(await ct.setAttribute("9811111111", "goal", "fat loss")).toBe(true);
    expect(await ct.setAttribute("9811111111", "goal", "muscle gain")).toBe(true);
    expect(await ct.setAttribute("bad", "goal", "x")).toBe(false);
    const d = (await ct.getContact("9811111111", today))!;
    expect(d.attributes).toEqual([
      { name: "goal", value: "muscle gain" },
      { name: "preferred_time", value: "6 am" },
    ]);
    await ct.setAttribute("9811111111", "goal", "");
    expect((await ct.getContact("9811111111", today))!.attributes.map((a) => a.name)).toEqual(["preferred_time"]);
    expect(await ct.getContact("9899999999", today)).toBeNull();
  });

  it("flags numbers WhatsApp can't reach", async () => {
    await pool.query(`insert into public.whatsapp_unreachable (phone, code) values ('919822222222', '131026')`);
    const rows = (await ct.listContacts({}, 50, 0, today)).rows;
    expect(rows.find((r) => r.key === "9822222222")!.waBlocked).toBe(true);
    expect(rows.find((r) => r.key === "9811111111")!.waBlocked).toBe(false);
  });
});

// Runs against a real Postgres with the migrations applied:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth
// Skipped when TEST_DATABASE_URL isn't set (CI, local runs without a database).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", () => ({ getContent: async () => ({ business: { name: "Royal Fitness Club", phone: "+91 88518 30081" } }) }));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("growth automation on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let m: typeof import("./members");
  let outbox: typeof import("./outbox");
  let hooks: typeof import("./hooks");
  let diet: typeof import("./diet-orders");
  let leads: typeof import("./leads");
  let daily: typeof import("./daily");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    delete process.env.WHATSAPP_TOKEN;
    pool = (await import("@/health/db")).pool;
    m = await import("./members");
    outbox = await import("./outbox");
    hooks = await import("./hooks");
    diet = await import("./diet-orders");
    leads = await import("./leads");
    daily = await import("./daily");
  });
  beforeEach(async () => {
    await pool.query("truncate public.referral_rewards, public.message_outbox, public.diet_orders, public.members, public.membership_orders, public.leads cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  const order = async (rzp: string, o: { phone?: string; name?: string; duration?: string; start?: string | null; code?: string | null; status?: string } = {}) => {
    await pool.query(
      `insert into public.membership_orders (razorpay_order_id, plan_id, plan_name, duration, amount_paise, name, phone, start_date, referral_code, status, paid_at)
       values ($1, 'monthly', 'Monthly', $2, 200000, $3, $4, $5, $6, $7, now())`,
      [rzp, o.duration ?? "1 month", o.name ?? "Aman Sharma", o.phone ?? "9876543210", o.start ?? null, o.code ?? null, o.status ?? "paid"],
    );
  };
  const NOW = new Date("2026-10-08T06:00:00Z"); // 11:30 IST

  it("a paid order creates a member exactly once, even when applied twice or concurrently", async () => {
    await order("order_A");
    const [a, b] = await Promise.all([m.applyPaidOrder("order_A", NOW), m.applyPaidOrder("order_A", NOW)]);
    const applied = [a, b].filter(Boolean);
    expect(applied).toHaveLength(1);
    expect(applied[0]!.member.startOn).toBe("2026-10-08");
    expect(applied[0]!.member.expiresOn).toBe("2026-11-07");
    expect(applied[0]!.member.referralCode).toMatch(/^RFC-AMAN-/);
    expect(await m.applyPaidOrder("order_A", NOW)).toBeNull();
    expect((await m.listMembers()).length).toBe(1);
  });

  it("ignores unpaid orders and refuses to guess an unreadable duration", async () => {
    await order("order_U", { status: "created" });
    expect(await m.applyPaidOrder("order_U", NOW)).toBeNull();
    await order("order_X", { phone: "9876500000", duration: "festival offer" });
    await expect(m.applyPaidOrder("order_X", NOW)).rejects.toThrow(/can't be read/);
    expect(await m.unappliedPaidOrders()).toHaveLength(1);
  });

  it("an early renewal extends from the current expiry; a lapsed one starts today", async () => {
    await order("order_1");
    await m.applyPaidOrder("order_1", NOW); // 8 Oct – 7 Nov
    await order("order_2", { duration: "3 months" });
    const r = await m.applyPaidOrder("order_2", new Date("2026-11-01T06:00:00Z"));
    expect(r!.isNew).toBe(false);
    expect(r!.member.startOn).toBe("2026-10-08"); // still the same continuous membership
    expect(r!.member.expiresOn).toBe("2027-02-07"); // 8 Nov + 3 months − 1 day
    await order("order_3");
    const lapsed = await m.applyPaidOrder("order_3", new Date("2027-03-10T06:00:00Z"));
    expect(lapsed!.member.startOn).toBe("2027-03-10");
    expect(lapsed!.member.expiresOn).toBe("2027-04-09");
  });

  it("a referral code adds bonus days to both members, once, and never for a renewal", async () => {
    await order("order_R1");
    const referrer = (await m.applyPaidOrder("order_R1", NOW))!.member;
    await order("order_R2", { phone: "9811111111", name: "Priya Verma", code: referrer.referralCode });
    const res = await m.applyPaidOrder("order_R2", NOW);
    expect(res!.reward!.days).toBe(7);
    expect(res!.member.expiresOn).toBe("2026-11-14"); // 7 Nov + 7
    expect(res!.reward!.referrer.expiresOn).toBe("2026-11-14");
    // Priya renews with the same code: no second reward.
    await order("order_R3", { phone: "9811111111", name: "Priya Verma", code: referrer.referralCode });
    const again = await m.applyPaidOrder("order_R3", NOW);
    expect(again!.reward).toBeNull();
    expect((await m.listRewards()).length).toBe(1);
  });

  it("a lapsed referrer's bonus starts today", async () => {
    await order("order_S1");
    const me = (await m.applyPaidOrder("order_S1", NOW))!.member;
    await pool.query("update public.members set start_on = '2025-12-02', expires_on = '2026-01-01' where id = $1", [me.id]);
    await order("order_S2", { phone: "9822222222", name: "Rohit", code: me.referralCode });
    const res = await m.applyPaidOrder("order_S2", NOW);
    expect(res!.reward!.referrer.expiresOn).toBe("2026-10-14"); // 8 Oct .. 14 Oct = 7 days
  });

  it("the payment hook queues the welcome message once and cancels stale reminders", async () => {
    await order("order_H");
    await m.applyPaidOrder("order_H", NOW);
    const [member] = await m.listMembers();
    await outbox.enqueue([{ channel: "whatsapp", to: "919876543210", toName: "Aman", kind: "renew-7", body: "x", template: "t", params: [], dedupeKey: `renew-7:${member.id}:2026-11-07` }]);
    await order("order_H2");
    await hooks.afterMembershipPaid("order_H2");
    await hooks.afterMembershipPaid("order_H2");
    const all = await outbox.listOutbox();
    expect(all.filter((x) => x.kind === "welcome")).toHaveLength(1);
    expect(all.find((x) => x.kind === "renew-7")!.status).toBe("cancelled");
  });

  it("the outbox dedupes and the daily run queues each reminder once", async () => {
    await order("order_D");
    await m.applyPaidOrder("order_D", new Date("2026-09-08T06:00:00Z")); // expires 7 Oct
    await pool.query(`insert into public.leads (name, phone, created_at) values ('Neha', '9833333333', '2026-10-06T05:00:00Z')`);
    const first = await daily.runDaily(new Date("2026-10-08T03:00:00Z"));
    expect(first.skipped).toBe(true); // no WhatsApp API keys: messages wait for the admin
    expect(first.queued).toBe(1); // lead day-2; the member is 1 day past expiry (reminder comes on day 3)
    expect((await outbox.listOutbox()).map((x) => x.kind)).toEqual(["lead-2"]);
    const later = await daily.runDaily(new Date("2026-10-10T03:00:00Z"));
    expect(later.queued).toBe(1);
    expect((await outbox.listOutbox()).map((x) => x.kind).sort()).toEqual(["expired-3", "lead-2"]);
    const second = await daily.runDaily(new Date("2026-10-10T10:00:00Z"));
    expect(second.queued).toBe(0);
  });

  it("lead pipeline updates and stops follow-ups once a lead joins", async () => {
    await pool.query(`insert into public.leads (name, phone, created_at) values ('Neha', '9833333333', now())`);
    const l = (await leads.latestLeadByPhone("9833333333"))!;
    await leads.updateLead(l.id, { status: "joined" });
    const [after] = await leads.listPipeline();
    expect(after.status).toBe("joined");
    expect(after.contactedAt).not.toBeNull();
    await expect(leads.updateLead(l.id, { status: "bogus" as never })).rejects.toThrow();
  });

  it("a new lead gets one thank-you message; numbers that can't receive WhatsApp get none", async () => {
    await pool.query(`insert into public.leads (name, phone) values ('Amit Test', '98111 99988'), ('Bad Number', '12345 67890')`);
    await hooks.afterLeadSaved("98111 99988");
    await hooks.afterLeadSaved("98111 99988");
    await hooks.afterLeadSaved("12345 67890");
    const all = await outbox.listOutbox();
    expect(all.map((x) => [x.kind, x.to, x.status])).toEqual([["lead-0", "919811199988", "pending"]]);
  });

  it("the forms can't be used to spam a stranger: messages stop past two enquiries per email or number, or 40 a day", async () => {
    // One email, three different numbers: the third enquiry gets no thank-you.
    for (const [i, phone] of ["98111 10001", "98111 10002", "98111 10003"].entries()) {
      const id = await leads.insertLead({ name: `Spam ${i}`, phone, email: "victim@example.com", interest: "", goal: "", message: "", source: "home", marketing: false });
      await hooks.afterLeadSaved(phone, id);
    }
    expect((await outbox.listOutbox()).map((x) => x.to).sort()).toEqual(["919811110001", "919811110002"]);
    expect(await leads.leadVolumeToday("98111 10003", "VICTIM@example.com")).toEqual({ number: 1, email: 3, all: 3 });
    // Site-wide: once more than 40 enquiries came in today, a new number gets nothing either.
    await pool.query(`insert into public.leads (name, phone) select 'Bulk ' || g, '9822' || lpad(g::text, 6, '0') from generate_series(1, 40) g`);
    const id = await leads.insertLead({ name: "Late Lead", phone: "98111 20002", email: null, interest: "", goal: "", message: "", source: "home", marketing: false });
    await hooks.afterLeadSaved("98111 20002", id);
    expect((await outbox.listOutbox()).map((x) => x.to)).not.toContain("919811120002");
    expect(hooks.leadMessagesPaused({ number: 1, email: 0, all: 40 })).toBe(false);
    expect(hooks.leadMessagesPaused({ number: 3, email: 0, all: 3 })).toBe(true);
  });

  it("a booked trial is confirmed instead of 'pick a time', and the desk's marks drive the follow-ups", async () => {
    const at = "2026-10-21T12:30:00.000Z"; // 6:00 PM India time
    const id = await leads.insertLead({ name: "Neha Test", phone: "98111 77766", email: null, interest: "", goal: "", message: "", source: "home", marketing: false, trialAt: at });
    await hooks.afterLeadSaved("98111 77766", id);
    expect((await outbox.listOutbox()).map((x) => [x.kind, x.to])).toEqual([["trial-booked", "919811177766"]]);
    // On the day it's an open lead; a week after the trial it still is.
    expect((await leads.openLeads("2026-10-21")).map((l) => [l.id, l.trialAt])).toEqual([[id, at]]);
    await leads.updateLead(id, { showedUp: false });
    let l = (await leads.getLead(id))!;
    expect([l.status, l.showedUp, l.contactedAt]).toEqual(["new", false, null]);
    await leads.updateLead(id, { showedUp: true });
    l = (await leads.getLead(id))!;
    expect([l.status, l.showedUp, !!l.contactedAt]).toEqual(["trial", true, true]);
    expect((await leads.openLeads("2026-10-28")).map((x) => x.id)).toEqual([id]);
    expect(await leads.openLeads("2026-11-05")).toEqual([]);
    // Correcting "came" to "no-show" reopens the lead; a new time clears the mark.
    await leads.updateLead(id, { showedUp: false });
    expect((await leads.getLead(id))!.status).toBe("contacted");
    await leads.updateLead(id, { trialAt: "2026-10-23T01:30:00.000Z" });
    l = (await leads.getLead(id))!;
    expect([l.trialAt, l.showedUp]).toEqual(["2026-10-23T01:30:00.000Z", null]);
    await leads.updateLead(id, { trialAt: null });
    expect((await leads.getLead(id))!.trialAt).toBeNull();
  });

  it("the coach hears about a form lead at once, and in the evening if nobody has contacted it", async () => {
    process.env.COACH_EMAIL = "coach@example.com";
    try {
      const id = await leads.insertLead({ name: "Ravi Test", phone: "98111 55544", email: null, interest: "", goal: "Fat loss", message: "", source: "home", marketing: false });
      await hooks.afterLeadSaved("98111 55544", id);
      expect((await outbox.listOutbox()).map((x) => x.kind).sort()).toEqual(["admin-lead-alert", "lead-0"]);
      const later = new Date(Date.now() + 3 * 3600_000);
      expect(await daily.runLeadEscalation(later)).toEqual({ waiting: 1, queued: 1 });
      expect(await daily.runLeadEscalation(later)).toEqual({ waiting: 1, queued: 0 }); // once a day
      await leads.updateLead(id, { status: "contacted" });
      expect((await leads.uncontactedLeads(later)).length).toBe(0);
    } finally {
      delete process.env.COACH_EMAIL;
    }
  });

  it("the funnel follows each lead from enquiry to member, by source", async () => {
    const add = (name: string, phone: string, source: string, trialAt: string | null = null) => leads.insertLead({ name, phone, email: null, interest: "", goal: "", message: "", source, marketing: false, trialAt });
    const a = await add("Lead A", "98111 00001", "home", "2026-10-21T12:30:00.000Z");
    const b = await add("Lead B", "98111 00002", "home", "2026-10-21T13:30:00.000Z");
    await add("Lead C", "+91 98111 00003", "contact");
    await leads.updateLead(a, { showedUp: true });
    await leads.updateLead(b, { showedUp: false });
    // C joined at the desk today, India date (no lead status change); A paid online.
    await pool.query(`insert into public.members (name, phone, plan_name, start_on, expires_on, referral_code) values ('Lead C', '9811100003', 'Monthly', (now() at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date + 30, 'LEADC-1')`);
    await pool.query(`insert into public.membership_orders (razorpay_order_id, status, plan_id, plan_name, duration, amount_paise, name, phone, paid_at) values ('order_F1', 'paid', 'm1', 'Monthly', '1 month', 150000, 'Lead A', '9811100001', now())`);
    await leads.updateLead(a, { status: "joined" });
    expect(await leads.funnelBySource(30)).toEqual([
      { source: "home", leads: 2, booked: 2, came: 1, joined: 1, onlineRupees: 1500 },
      { source: "contact", leads: 1, booked: 0, came: 0, joined: 1, onlineRupees: 0 },
    ]);
  });

  it("diet orders flip to paid once, even with concurrent confirmations", async () => {
    const intake = { age: 30, sex: "male", heightCm: 175, weightKg: 80, goal: "fat-loss", diet: "veg", cuisine: "north", activity: "moderate", mealsPerDay: 5, wakeTime: "06:30", conditions: [], allergies: [], notes: "" } as const;
    await diet.insertDietOrder("order_DIET", 99900, { name: "Aman", phone: "9876543210", email: null }, { ...intake, conditions: [], allergies: [] });
    const results = await Promise.all([diet.markDietPaid("order_DIET", "pay_1"), diet.markDietPaid("order_DIET", "pay_1"), diet.markDietPaid("order_DIET", "pay_1")]);
    expect(results.filter((r) => r?.firstTime)).toHaveLength(1);
    expect(await diet.markDietPaid("order_nope", "pay")).toBeNull();
    // Through the payment hook: the confirmation is queued by whichever call pays it, once.
    await diet.insertDietOrder("order_DIET2", 99900, { name: "Aman", phone: "9876543210", email: null }, { ...intake, conditions: [], allergies: [] });
    expect(await hooks.afterDietPaid("order_DIET2", "pay_2")).toBe(true);
    expect(await hooks.afterDietPaid("order_DIET2", "pay_2")).toBe(true);
    expect(await hooks.afterDietPaid("order_membership", "pay_3")).toBe(false);
    expect((await outbox.listOutbox()).filter((x) => x.kind === "diet-received")).toHaveLength(1);
  });
});

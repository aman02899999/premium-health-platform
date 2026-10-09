// The sales automation end to end on a real Postgres (migrations applied):
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/automation.integration.test.ts
// Lead → marketing email → paid diet order → plan PDF built and stored → approve → WhatsApp + email with the PDF.
import { promises as fs } from "fs";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", () => ({
  getContent: async () => ({
    business: { name: "Royal Fitness Club", shortName: "Royal Fitness", phone: "+91 88518 30081", whatsapp: "918851830081", instagram: "royalfitness93_", address: { street: "Main Road", locality: "Gejha", city: "Noida", region: "UP", postalCode: "201304" } },
    trainers: [{ name: "Aman Sharma", image: "/gallery/aman-sharma-royal-fitness-gym.webp" }],
    plans: [{ name: "Monthly", duration: "1 Month", price: 2000 }],
  }),
}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("sales automation on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let leads: typeof import("./leads");
  let hooks: typeof import("./hooks");
  let diet: typeof import("./diet-orders");
  let delivery: typeof import("./plan-delivery");
  let outbox: typeof import("./outbox");
  let marketing: typeof import("./marketing");
  const sent: { url: string; body: Record<string, unknown> }[] = [];

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    for (const k of ["WHATSAPP_TOKEN", "RESEND_API_KEY", "EMAIL_FROM", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "DIET_AUTO_SEND"]) delete process.env[k];
    process.env.COACH_EMAIL = "coach@example.com";
    pool = (await import("@/health/db")).pool;
    leads = await import("./leads");
    hooks = await import("./hooks");
    diet = await import("./diet-orders");
    delivery = await import("./plan-delivery");
    outbox = await import("./outbox");
    marketing = await import("./marketing");
  });
  beforeEach(async () => {
    await pool.query("truncate public.message_outbox, public.diet_orders, public.leads, public.marketing_contacts cascade");
    sent.length = 0;
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  const rows = async (where = "true") => (await pool.query(`select channel, to_address, kind, subject, attachment, status, template from public.message_outbox where ${where} order by created_at, kind`)).rows;
  const intake = { age: 30, sex: "female", heightCm: 160, weightKg: 70, goal: "fat-loss", diet: "veg", cuisine: "north", activity: "light", mealsPerDay: 5, wakeTime: "06:30", conditions: [], allergies: [], notes: "", waistCm: 86, neckCm: 33, hipCm: 102, trainingDays: 4, trainTime: "18:00" } as const;

  it("a WhatsApp lead who opted in gets the first diet email at once; one without consent gets none", async () => {
    const id = await leads.insertLead({ name: "Priya Verma", phone: "9876543210", email: "priya@example.com", interest: "diet", goal: "", message: "", source: "whatsapp-diet", marketing: true });
    await marketing.recordEmailConsent("priya@example.com", "Priya", "test");
    await hooks.afterLeadSaved("9876543210", id);
    const r = await rows();
    // WhatsApp leads are answered by a person: no automatic WhatsApp trial reminder.
    expect(r.map((x) => x.kind)).toEqual(["nurture-diet-0"]);
    expect(r[0]).toMatchObject({ channel: "email", to_address: "priya@example.com", status: "pending" });
    const id2 = await leads.insertLead({ name: "Ravi", phone: "9876500001", email: "ravi@example.com", interest: "diet", goal: "", message: "", source: "whatsapp-diet", marketing: false });
    await hooks.afterLeadSaved("9876500001", id2);
    expect(await rows("to_address = 'ravi@example.com'")).toHaveLength(0);
  });

  it("unsubscribing cancels pending emails and stops the sequence; buyers stop getting it too", async () => {
    const id = await leads.insertLead({ name: "Priya Verma", phone: "9876543210", email: "priya@example.com", interest: "diet", goal: "", message: "", source: "whatsapp-diet", marketing: true });
    await hooks.afterLeadSaved("9876543210", id);
    expect(await leads.nurtureLeads("2026-10-09")).toHaveLength(1);
    expect(marketing.validUnsubscribe("Priya@example.com", marketing.unsubscribeToken("priya@example.com"))).toBe(true);
    expect(marketing.validUnsubscribe("priya@example.com", "forged")).toBe(false);
    await marketing.unsubscribe("priya@example.com");
    expect((await rows())[0].status).toBe("cancelled");
    expect(await leads.nurtureLeads("2026-10-09")).toHaveLength(0);

    await leads.insertLead({ name: "Asha", phone: "9876500002", email: "asha@example.com", interest: "diet", goal: "", message: "", source: "whatsapp-diet", marketing: true });
    await diet.insertDietOrder("order_BUY", 299900, { name: "Asha", phone: "9876500002", email: "asha@example.com" }, intake as never, "3m");
    await diet.markDietPaid("order_BUY", "pay_1");
    expect(await leads.nurtureLeads("2026-10-09")).toHaveLength(0);
  });

  it("payment → confirmation (WhatsApp + email) → draft plan PDF stored → coach notified → approve → plan sent with the PDF", async () => {
    await diet.insertDietOrder("order_P", 299900, { name: "Priya Verma", phone: "9876543210", email: "priya@example.com" }, intake as never, "3m");
    expect(await hooks.afterDietPaid("order_P", "pay_P")).toBe(true);
    const [order] = await diet.listDietOrders();
    expect(order).toMatchObject({ plan: "3m", stage: "draft_ready" });
    expect(order.planPath).toMatch(/^orders\/[0-9a-f-]{36}\/auto-[a-z0-9]+-royal-fitness-plan-priya-verma-\d{4}-\d{2}-\d{2}\.pdf$/);
    const pdf = await fs.readFile(path.join(process.cwd(), ".data", "diet-plans", order.planPath!));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(50_000);
    expect((await rows()).map((x) => x.kind).sort()).toEqual(["coach-diet-order", "diet-received", "diet-received-email"]);
    // Paying twice (verify + webhook) builds nothing new.
    await hooks.afterDietPaid("order_P", "pay_P");
    expect(await rows()).toHaveLength(3);

    await delivery.sendDietPlan(order.id);
    const out = await rows("kind in ('diet-plan-ready', 'diet-plan-email')");
    expect(out).toHaveLength(2);
    expect(out).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ channel: "email", kind: "diet-plan-email", attachment: order.planPath, to_address: "priya@example.com" }),
        expect.objectContaining({ channel: "whatsapp", kind: "diet-plan-ready", attachment: order.planPath, template: "rfc_diet_plan_ready" }),
      ]),
    );
    expect((await diet.getDietOrder(order.id))!.stage).toBe("sent");
  });

  it("auto-send 'no-conditions' sends healthy clients' plans at once but holds plans with a condition", async () => {
    process.env.DIET_AUTO_SEND = "no-conditions";
    try {
      await diet.insertDietOrder("order_H", 99900, { name: "Healthy Client", phone: "9876500003", email: null }, intake as never, "starter");
      await diet.insertDietOrder("order_C", 99900, { name: "Thyroid Client", phone: "9876500004", email: null }, { ...intake, conditions: ["hypothyroid"] } as never, "starter");
      await hooks.afterDietPaid("order_H", "pay_H");
      await hooks.afterDietPaid("order_C", "pay_C");
      const all = await diet.listDietOrders();
      expect(all.find((o) => o.name === "Healthy Client")!.stage).toBe("sent");
      expect(all.find((o) => o.name === "Thyroid Client")!.stage).toBe("draft_ready");
    } finally {
      delete process.env.DIET_AUTO_SEND;
    }
  });

  it("dispatch sends emails through Resend with the PDF attached and an unsubscribe header on marketing", async () => {
    vi.stubGlobal("fetch", async (u: string, init: { body: string }) => {
      sent.push({ url: String(u), body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ id: `em_${sent.length}` }), { status: 200 });
    });
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Royal Fitness Club <hello@example.in>";
    try {
      const id = await leads.insertLead({ name: "Priya Verma", phone: "9876543210", email: "priya@example.com", interest: "diet", goal: "", message: "", source: "whatsapp-diet", marketing: true });
      await diet.insertDietOrder("order_E", 299900, { name: "Priya Verma", phone: "9876543210", email: "priya@example.com" }, intake as never, "3m");
      await hooks.afterLeadSaved("9876543210", id);
      await hooks.afterDietPaid("order_E", "pay_E");
      const [order] = await diet.listDietOrders();
      await delivery.sendDietPlan(order.id);
      await outbox.dispatch(20);
      const byTo = sent.map((s) => s.body as { to: string[]; subject: string; attachments?: { filename: string; content: string }[]; headers?: Record<string, string>; html: string });
      const nurture = byTo.find((b) => b.subject.includes("personal diet plan works"))!;
      expect(nurture.headers?.["List-Unsubscribe"]).toMatch(/\/api\/unsubscribe\?e=priya%40example\.com&t=/);
      expect(nurture.html).toContain("Start my plan");
      const planMail = byTo.find((b) => b.attachments?.length)!;
      expect(planMail.to).toEqual(["priya@example.com"]);
      expect(Buffer.from(planMail.attachments![0].content, "base64").subarray(0, 5).toString()).toBe("%PDF-");
      expect(planMail.headers).toBeUndefined(); // transactional: no unsubscribe header
      // WhatsApp isn't configured: those wait in the outbox for the admin.
      expect((await rows("channel = 'whatsapp'")).every((r) => r.status === "pending")).toBe(true);
      expect((await rows("channel = 'email'")).every((r) => r.status === "sent")).toBe(true);
    } finally {
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_FROM;
      vi.unstubAllGlobals();
    }
  });
});

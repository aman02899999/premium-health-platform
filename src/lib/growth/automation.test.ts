import { describe, expect, it } from "vitest";
import { DIET_PLANS, dietPlan } from "./config";
import { intakeToProfile, parseDietOrder } from "./diet-intake";
import { emailHtml, emailText, splitCta } from "./email-html";
import { nurtureDrafts, steps, type NurtureBiz, type NurtureLead } from "./nurture";
import { DEFAULT_PROFILE } from "@/lib/diet-pro/defaults";
import { dietPlanEmail, dietPlanWhatsApp, dietReceivedEmail } from "./messages";

const biz: NurtureBiz = { name: "Royal Fitness Club", phone: "+91 88518 30081", whatsapp: "918851830081", siteUrl: "https://example.in", coach: "Coach Aman Sharma", membershipFrom: 2000 };
const lead = (interest: NurtureLead["interest"], createdAt = "2026-10-08T06:00:00Z"): NurtureLead => ({ id: `id-${interest}`, name: "Priya Verma", email: "Priya@Example.com", interest, createdAt });

describe("diet plan packages", () => {
  it("are priced on the server, with the 3-month plan at ₹2,999 and a safe default", () => {
    expect(dietPlan("3m")).toMatchObject({ priceRupees: 2999, checkIns: 6, popular: true });
    expect(dietPlan("nope").id).toBe("starter");
    expect(DIET_PLANS.map((p) => p.priceRupees)).toEqual([49, 999, 1999, 2999, 4999, 5999]);
    expect(dietPlan("trial")).toMatchObject({ priceRupees: 49, trial: true });
  });
});

describe("order form", () => {
  const base = { name: "Priya Verma", phone: "9876543210", email: "priya@example.com", age: 30, sex: "female", heightCm: 160, weightKg: 70, goal: "fat-loss", diet: "veg", activity: "light", consent: true };
  it("keeps the plan, measurements, workout details and marketing choice", () => {
    const r = parseDietOrder({ ...base, plan: "3m", marketing: true, neckCm: "33", waistCm: 86, hipCm: 102.3, targetWeightKg: 60, trainingDays: 4, trainTime: "07:15", setting: "home", medicines: "thyroxine 50 mcg" });
    if (typeof r === "string") throw new Error(r);
    expect(r.plan).toBe("3m");
    expect(r.buyer.marketing).toBe(true);
    expect(r.intake).toMatchObject({ neckCm: 33, waistCm: 86, hipCm: 102.5, targetWeightKg: 60, trainingDays: 4, trainTime: "07:15", setting: "home", medicines: "thyroxine 50 mcg" });
  });
  it("drops implausible numbers instead of guessing, and needs an email for marketing", () => {
    const r = parseDietOrder({ ...base, email: "", plan: "free-plan", marketing: true, waistCm: 5, trainingDays: 9, trainTime: "25:00" });
    if (typeof r === "string") throw new Error(r);
    expect(r.plan).toBe("starter");
    expect(r.buyer.marketing).toBe(false);
    expect(r.intake.waistCm).toBeUndefined();
    expect(r.intake.trainingDays).toBeUndefined();
    expect(r.intake.trainTime).toBeUndefined();
  });
  it("maps the answers onto a Diet Pro profile, guessing training days from activity", () => {
    const r = parseDietOrder({ ...base, waistCm: 86, neckCm: 33, hipCm: 102, goal: "gain" });
    if (typeof r === "string") throw new Error(r);
    const p = intakeToProfile("Priya Verma", r.intake, DEFAULT_PROFILE);
    expect(p.m).toEqual({ neck: 33, waist: 86, hip: 102 });
    expect(p.trainingDays).toBe(2); // "light"
    expect(p.ratePct).toBe(0.5); // gain default, not the fat-loss default
  });
});

describe("marketing emails", () => {
  it("each interest has its own sequence with one clear next step", () => {
    expect(steps("diet", lead("diet"), biz).map((s) => s.day)).toEqual([0, 2, 5, 9]);
    expect(steps("pt", lead("pt"), biz).map((s) => s.day)).toEqual([0, 3, 7]);
    expect(steps("membership", lead("membership"), biz).map((s) => s.day)).toEqual([0, 3, 7]);
    expect(steps("diet", lead("diet"), biz)[0].cta.url).toBe("https://example.in/diet-chart?plan=3m#order");
    expect(steps("diet", lead("diet"), biz)[0].body).toContain("₹2,999");
    expect(steps("membership", lead("membership"), biz)[0].body).toContain("₹2,000 a month");
    expect(steps("pt", lead("pt"), biz)[0].cta.url).toMatch(/^https:\/\/wa\.me\/918851830081\?text=/);
  });
  it("sends the email due today, catching up within 2 days, once per lead and step", () => {
    const d0 = nurtureDrafts("2026-10-08", [lead("diet")], biz);
    expect(d0).toHaveLength(1);
    expect(d0[0]).toMatchObject({ channel: "email", to: "priya@example.com", kind: "nurture-diet-0", dedupeKey: "nurture-diet-0:id-diet" });
    expect(nurtureDrafts("2026-10-12", [lead("diet")], biz).map((d) => d.kind)).toEqual(["nurture-diet-1"]); // day 4 = day-2 email, caught up
    expect(nurtureDrafts("2026-10-25", [lead("diet")], biz)).toHaveLength(0);
  });
  it("never promises results or calls itself a cure", () => {
    const all = (["diet", "pt", "membership"] as const).flatMap((i) => steps(i, lead(i), biz)).map((s) => `${s.subject} ${s.body}`.toLowerCase()).join(" ");
    expect(all).not.toMatch(/guarantee|\bcure|lose \d+ ?kg in/);
  });
});

describe("email layout", () => {
  it("turns the stored CTA into a button and escapes text", () => {
    const body = "Hi <b>Priya</b>,\n\n• one\n• two\n[[CTA:Start my plan|https://example.in/diet-chart?plan=3m]]";
    expect(splitCta(body).cta).toEqual({ label: "Start my plan", url: "https://example.in/diet-chart?plan=3m" });
    const html = emailHtml(body, { brand: "Royal Fitness Club", footer: "Footer", unsubscribeUrl: "https://example.in/api/unsubscribe?e=x&t=y" });
    expect(html).toContain("&lt;b&gt;Priya&lt;/b&gt;");
    expect(html).toContain("<li");
    expect(html).toContain('href="https://example.in/diet-chart?plan=3m"');
    expect(html).toContain("Unsubscribe");
    expect(emailText(body, "Footer")).toContain("Start my plan: https://example.in/diet-chart?plan=3m");
  });
});

describe("plan delivery messages", () => {
  const o = { id: "o1", name: "Priya Verma", phone: "9876543210", email: "Priya@Example.com" };
  const b = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://example.in" };
  it("WhatsApp carries the PDF as the template's document; email attaches it", () => {
    const wa = dietPlanWhatsApp(o, "3-Month Transformation", "orders/o1/a.pdf", b);
    expect(wa).toMatchObject({ channel: "whatsapp", to: "919876543210", template: "rfc_diet_plan_ready", attachment: "orders/o1/a.pdf" });
    expect(wa.params).toEqual(["Priya", "3-Month Transformation", "Royal Fitness Club"]);
    const em = dietPlanEmail(o, "3-Month Transformation", "orders/o1/a.pdf", { ...b, coach: "Coach Aman Sharma" });
    expect(em).toMatchObject({ channel: "email", to: "priya@example.com", attachment: "orders/o1/a.pdf" });
    expect(em.subject).toContain("3-Month Transformation");
    // A new file (coach edits) is a new message; the same file is never sent twice.
    expect(dietPlanEmail(o, "x", "orders/o1/b.pdf", { ...b, coach: "c" }).dedupeKey).not.toBe(em.dedupeKey);
    expect(dietReceivedEmail(o, "3-Month Transformation", "48 hours", b).body).toContain("48 hours");
  });
});

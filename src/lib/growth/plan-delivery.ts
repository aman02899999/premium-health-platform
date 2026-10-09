import "server-only";
import { SITE_URL } from "@/lib/site";
import { getContent } from "@/lib/content/store";
import { DIET_CHART, dietPlan } from "./config";
import { business } from "./daily";
import { getDietOrder, setDietPlanFile, setDietStage, type DietOrder } from "./diet-orders";
import { dietPlanEmail, dietPlanWhatsApp, type Draft } from "./messages";
import { dispatch, enqueue } from "./outbox";
import { renderOrderPlan } from "./plan-render";
import { putFile } from "./storage";

// After payment: build the client's plan, keep it as a draft, and send it once approved.
//
export { autoSendMode, needsReview, type AutoSend } from "./auto-send";
import { needsReview } from "./auto-send";

const planPath = (o: DietOrder, filename: string, tag: string) => `orders/${o.id}/${tag}-${Date.now().toString(36)}-${filename.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase()}`;

/** Generates and stores the draft plan; sends it straight away if auto-send allows. */
export async function prepareDietPlan(orderId: string): Promise<{ path: string; sent: boolean } | null> {
  const order = await getDietOrder(orderId);
  if (!order || order.status !== "paid") return null;
  const { pdf, filename } = await renderOrderPlan(order);
  const path = planPath(order, filename, "auto");
  await putFile(path, pdf);
  await setDietPlanFile(order.id, path);
  if (!needsReview(order)) {
    await sendDietPlan(order.id);
    return { path, sent: true };
  }
  await notifyCoach(order);
  return { path, sent: false };
}

/** A plan the coach edited in Diet Pro and uploaded; replaces the automatic draft. */
export async function storeCoachPlan(orderId: string, pdf: Buffer, filename: string): Promise<string> {
  const order = await getDietOrder(orderId);
  if (!order) throw new Error("Order not found");
  if (pdf.subarray(0, 5).toString() !== "%PDF-") throw new Error("That file is not a PDF");
  const path = planPath(order, filename, "coach");
  await putFile(path, pdf);
  await setDietPlanFile(order.id, path);
  return path;
}

/** Queues the plan on WhatsApp (document) and email (attachment), marks the order sent. */
export async function sendDietPlan(orderId: string): Promise<{ queued: number }> {
  const order = await getDietOrder(orderId);
  if (!order) throw new Error("Order not found");
  if (!order.planPath) throw new Error("No plan has been generated for this order yet");
  const [biz, c] = await Promise.all([business(), getContent()]);
  const coach = `Coach ${(c.trainers?.[0]?.name || "Aman Sharma").replace(/^coach\s+/i, "")}`;
  const name = dietPlan(order.plan).name;
  const drafts: Draft[] = [dietPlanWhatsApp(order, name, order.planPath, biz)];
  if (order.email) drafts.push(dietPlanEmail({ id: order.id, name: order.name, email: order.email }, name, order.planPath, { ...biz, coach }));
  const queued = await enqueue(drafts);
  await setDietStage(order.id, "sent");
  await dispatch(5);
  return { queued };
}

async function notifyCoach(order: DietOrder) {
  const to = process.env.COACH_EMAIL;
  if (!to) return; // the Growth dashboard shows it either way
  const p = dietPlan(order.plan);
  const i = order.intake;
  await enqueue([
    {
      channel: "email",
      to,
      toName: "Coach",
      kind: "coach-diet-order",
      subject: `New ${p.name}: ${order.name} — draft plan ready`,
      body: `${order.name} paid ₹${(order.amountPaise / 100).toLocaleString("en-IN")} for the ${p.name}.\n\n${i.sex}, ${i.age} y, ${i.heightCm} cm, ${i.weightKg} kg · goal ${i.goal} · ${i.diet}\nHealth: ${i.conditions.join(", ") || "none reported"}${i.medicines ? `\nMedicines: ${i.medicines}` : ""}\n\nThe draft plan is ready. Review it and send it to the client within ${DIET_CHART.turnaround}.\n[[CTA:Review & send|${SITE_URL}/admin/growth?tab=diet]]`,
      template: "",
      params: [],
      dedupeKey: `coach-diet-order:${order.id}`,
    },
  ]);
  await dispatch(3);
}

import "server-only";
import { pool } from "@/health/db";
import { SITE_URL } from "@/lib/site";
import { autoSendMode, needsReview } from "./auto-send";
import { dietPlan } from "./config";
import { parseDietOrder, type DietIntake } from "./diet-intake";
import { getDietOrder, type DietOrder } from "./diet-orders";
import { entitlement, type Entitlement } from "./entitlement";
import { dispatch, enqueue } from "./outbox";
import { renderOrderPlan } from "./plan-render";
import { putFile } from "./storage";

// The client side of a paid plan. A signed-in account sees the paid diet orders whose email
// matches its verified email (or that it already claimed); everything else is invisible to it.
// Every rule is checked here on the server, never trusted from the browser.

export type PlanVersion = { id: string; orderId: string; createdAt: string; version: number; source: "checkout" | "client" | "coach"; status: "draft" | "sent" | "rejected"; planPath: string; intake: DietIntake; note: string; sentAt: string | null };
export type ClientOrder = DietOrder & { userId: string | null; extraGenerations: number; accessUntil: string | null; revokedAt: string | null; versions: PlanVersion[]; entitlement: Entitlement };
export type Customer = { id: string; email: string; name: string };

type VRow = { id: string; order_id: string; created_at: Date; version: number; source: PlanVersion["source"]; status: PlanVersion["status"]; plan_path: string; intake: DietIntake; note: string; sent_at: Date | null };
const fromV = (r: VRow): PlanVersion => ({ id: r.id, orderId: r.order_id, createdAt: r.created_at.toISOString(), version: r.version, source: r.source, status: r.status, planPath: r.plan_path, intake: r.intake, note: r.note, sentAt: r.sent_at?.toISOString() ?? null });
const V_COLUMNS = "id, order_id, created_at, version, source, status, plan_path, intake, note, sent_at";

export async function versionsFor(orderIds: string[]): Promise<PlanVersion[]> {
  if (!orderIds.length) return [];
  const { rows } = await pool.query<VRow>(`select ${V_COLUMNS} from public.client_plan_versions where order_id = any($1::uuid[]) order by order_id, version`, [orderIds]);
  return rows.map(fromV);
}

type AccessRow = { id: string; user_id: string | null; extra_generations: number; access_until: string | null; revoked_at: Date | null };

async function withAccess(orders: DietOrder[]): Promise<ClientOrder[]> {
  if (!orders.length) return [];
  const ids = orders.map((o) => o.id);
  const [{ rows: access }, versions] = await Promise.all([
    pool.query<AccessRow>(`select id, user_id, extra_generations, access_until::text as access_until, revoked_at from public.diet_orders where id = any($1::uuid[])`, [ids]),
    versionsFor(ids),
  ]);
  return orders.map((o) => {
    const a = access.find((r) => r.id === o.id)!;
    const vs = versions.filter((v) => v.orderId === o.id);
    const ent = entitlement({ plan: o.plan, paidAt: o.paidAt ?? o.createdAt, extraGenerations: a.extra_generations, accessUntil: a.access_until, revoked: !!a.revoked_at, versions: vs });
    return { ...o, userId: a.user_id, extraGenerations: a.extra_generations, accessUntil: a.access_until, revokedAt: a.revoked_at?.toISOString() ?? null, versions: vs, entitlement: ent };
  });
}

/**
 * The paid orders this account may see. An order is claimed by the first account that signs in
 * with its email; after that only that account sees it (an admin can move it).
 */
export async function ordersForCustomer(c: Customer): Promise<ClientOrder[]> {
  await pool.query(`update public.diet_orders set user_id = $1 where user_id is null and status = 'paid' and lower(email) = $2`, [c.id, c.email.toLowerCase()]);
  const { rows } = await pool.query<{ id: string }>(`select id from public.diet_orders where status = 'paid' and user_id = $1 order by paid_at desc`, [c.id]);
  const orders = (await Promise.all(rows.map((r) => getDietOrder(r.id)))).filter((o): o is DietOrder => !!o);
  return withAccess(orders);
}

export async function clientOrderForAdmin(id: string): Promise<ClientOrder | null> {
  const o = await getDietOrder(id);
  return o ? (await withAccess([o]))[0] : null;
}

/** A version the signed-in client may download: theirs, and already sent to them. */
export async function clientVersion(c: Customer, versionId: string): Promise<PlanVersion | null> {
  if (!/^[0-9a-f-]{36}$/i.test(versionId)) return null;
  const { rows } = await pool.query<VRow>(
    `select ${V_COLUMNS.split(", ").map((x) => `v.${x}`).join(", ")} from public.client_plan_versions v join public.diet_orders o on o.id = v.order_id
      where v.id = $1 and o.user_id = $2 and o.status = 'paid' and v.status = 'sent'`,
    [versionId, c.id],
  );
  return rows[0] ? fromV(rows[0]) : null;
}

/** Records a built plan as the order's next version. */
export async function addVersion(orderId: string, v: { path: string; intake: DietIntake; source: PlanVersion["source"]; status: "draft" | "sent"; note?: string }): Promise<PlanVersion> {
  const { rows } = await pool.query<VRow>(
    `insert into public.client_plan_versions (order_id, version, source, status, plan_path, intake, note, sent_at)
     values ($1, coalesce((select max(version) from public.client_plan_versions where order_id = $1), 0) + 1, $2, $3, $4, $5, $6, case when $3 = 'sent' then now() else null end)
     returning ${V_COLUMNS}`,
    [orderId, v.source, v.status, v.path, JSON.stringify(v.intake), (v.note ?? "").slice(0, 600)],
  );
  return fromV(rows[0]);
}

/**
 * A plan built by checkout or by the coach. While the newest version is still a draft it is
 * replaced (rebuilding a draft doesn't use up one of the client's plans); otherwise it is added.
 */
export async function upsertDraft(orderId: string, path: string, intake: DietIntake, source: "checkout" | "coach"): Promise<void> {
  const { rowCount } = await pool.query(
    `update public.client_plan_versions set plan_path = $2, intake = $3, source = $4, created_at = now()
      where id = (select id from public.client_plan_versions where order_id = $1 order by version desc limit 1) and status = 'draft'`,
    [orderId, path, JSON.stringify(intake), source],
  );
  if (!rowCount) await addVersion(orderId, { path, intake, source, status: "draft" });
}

/** The order's plan file was (re)sent: its version becomes visible to the client. */
export async function markPathSent(orderId: string, path: string): Promise<void> {
  await pool.query(`update public.client_plan_versions set status = 'sent', sent_at = coalesce(sent_at, now()) where order_id = $1 and plan_path = $2 and status = 'draft'`, [orderId, path]);
}

/** Fields a client may change when asking for an updated plan: today's body and routine. */
const EDITABLE = ["age", "weightKg", "waistCm", "neckCm", "hipCm", "targetWeightKg", "goal", "diet", "cuisine", "activity", "mealsPerDay", "wakeTime", "trainingDays", "trainTime", "setting", "conditions", "allergies", "medicines", "notes"] as const;

/** Today's answers merged over the last plan's, validated with the same rules as checkout. */
export function mergeUpdate(order: DietOrder, last: DietIntake, body: Record<string, unknown>): DietIntake | string {
  const merged: Record<string, unknown> = { ...last, name: order.name, phone: order.phone, email: order.email ?? "", plan: order.plan, consent: true };
  for (const k of EDITABLE) if (k in body) merged[k] = body[k];
  const parsed = parseDietOrder(merged);
  if (typeof parsed === "string") return parsed;
  // Sex and height don't change between plans.
  return { ...parsed.intake, sex: last.sex, heightCm: last.heightCm };
}

const pathFor = (orderId: string, version: number, filename: string) => `orders/${orderId}/v${version}-${Date.now().toString(36)}-${filename.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase()}`;

export type UpdateResult = { ok: true; version: PlanVersion; review: boolean } | { ok: false; error: string; status: number };

/**
 * The client asks for their next plan. The order row is locked for the whole build, so a double
 * tap can't create two plans; the entitlement is re-checked inside the lock.
 */
export async function requestUpdate(c: Customer, orderId: string, body: Record<string, unknown>, now = new Date()): Promise<UpdateResult> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { ok: false, error: "Plan not found", status: 404 };
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ id: string }>(`select id from public.diet_orders where id = $1 and user_id = $2 and status = 'paid' for update`, [orderId, c.id]);
    if (!rows[0]) {
      await client.query("rollback");
      return { ok: false, error: "Plan not found", status: 404 };
    }
    const order = (await clientOrderForAdmin(orderId))!;
    if (!order.entitlement.canUpdate) {
      await client.query("rollback");
      return { ok: false, error: `Not available: ${order.entitlement.reason}`, status: 403 };
    }
    const last = [...order.versions].reverse().find((v) => v.status !== "rejected")?.intake ?? order.intake;
    const intake = mergeUpdate(order, last, body);
    if (typeof intake === "string") {
      await client.query("rollback");
      return { ok: false, error: intake, status: 400 };
    }
    // Updates go out by themselves unless there is a health condition or medicine (the coach's
    // DIET_AUTO_SEND setting can only make this looser, never send condition plans unchecked by default).
    const review = needsReview({ intake }, autoSendMode() === "all" ? "all" : "no-conditions");
    const nextVersion = order.versions.length + 1;
    const { pdf, filename } = await renderOrderPlan({ ...order, intake });
    const path = pathFor(order.id, nextVersion, filename);
    await putFile(path, pdf);
    const { rows: vr } = await client.query<VRow>(
      `insert into public.client_plan_versions (order_id, version, source, status, plan_path, intake, sent_at)
       values ($1, coalesce((select max(version) from public.client_plan_versions where order_id = $1), 0) + 1, 'client', $2, $3, $4, case when $2 = 'sent' then now() else null end)
       returning ${V_COLUMNS}`,
      [order.id, review ? "draft" : "sent", path, JSON.stringify(intake)],
    );
    // The latest plan is the order's current one; the intake follows it so the coach sees today's numbers.
    await client.query(`update public.diet_orders set plan_path = $2, plan_generated_at = now(), intake = $3, stage = $4, updated_at = now() where id = $1`, [order.id, path, JSON.stringify(intake), review ? "draft_ready" : "sent"]);
    await client.query("commit");
    const version = fromV(vr[0]);
    await afterUpdate(order, version, review, now);
    return { ok: true, version, review };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function afterUpdate(order: ClientOrder, v: PlanVersion, review: boolean, now: Date) {
  const { sendDietPlan } = await import("./plan-delivery");
  if (!review) await sendDietPlan(order.id).catch((e: Error) => console.error("[client-plans] send:", e.message));
  const to = process.env.COACH_EMAIL;
  if (!to) return;
  const p = dietPlan(order.plan);
  const i = v.intake;
  await enqueue([
    {
      channel: "email",
      to,
      toName: "Coach",
      kind: "coach-plan-update",
      subject: review ? `Review needed: ${order.name}'s plan update #${v.version}` : `${order.name} updated their plan (#${v.version})`,
      body: `${order.name} (${p.name}) asked for plan #${v.version} of ${order.entitlement.allowed} on ${now.toISOString().slice(0, 10)}.\n\nNow: ${i.weightKg} kg${i.waistCm ? `, waist ${i.waistCm} cm` : ""} · goal ${i.goal} · ${i.activity} · ${i.trainingDays ?? "?"} training days\nHealth: ${i.conditions.join(", ") || "none reported"}${i.medicines ? `\nMedicines: ${i.medicines}` : ""}${i.notes ? `\nNote: ${i.notes}` : ""}\n\n${review ? "Because of the health details, the plan waits for your approval." : "It went to the client automatically on WhatsApp, email and their dashboard."}\n[[CTA:${review ? "Review & send" : "Open the client"}|${SITE_URL}/admin/growth?tab=diet]]`,
      template: "",
      params: [],
      dedupeKey: `coach-plan-update:${v.id}`,
    },
  ]);
  await dispatch(3);
}

/** Every paid order with its access rules and versions, for the admin. */
export async function listClientOrders(): Promise<ClientOrder[]> {
  const { listDietOrders } = await import("./diet-orders");
  return withAccess(await listDietOrders());
}

export type AccessPatch = { extraGenerations?: number; accessUntil?: string | null; revoked?: boolean; email?: string; unlink?: boolean };

/** Admin changes to a client's access. A new email (or unlink) frees the order for the right account. */
export async function updateAccess(orderId: string, p: AccessPatch): Promise<void> {
  if (p.extraGenerations !== undefined && !(Number.isInteger(p.extraGenerations) && p.extraGenerations >= -50 && p.extraGenerations <= 50)) throw new Error("Extra plans must be a whole number between -50 and 50");
  if (p.accessUntil && !/^\d{4}-\d{2}-\d{2}$/.test(p.accessUntil)) throw new Error("Use a date like 2026-12-31");
  if (p.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error("That email address doesn't look right");
  await pool.query(
    `update public.diet_orders set
        extra_generations = coalesce($2, extra_generations),
        access_until = case when $3::boolean then $4::date else access_until end,
        revoked_at = case when $5::boolean is null then revoked_at when $5 then coalesce(revoked_at, now()) else null end,
        email = coalesce($6, email),
        user_id = case when $6 is not null or $7 then null else user_id end,
        updated_at = now()
      where id = $1`,
    [orderId, p.extraGenerations ?? null, p.accessUntil !== undefined, p.accessUntil || null, p.revoked ?? null, p.email?.toLowerCase() ?? null, p.unlink === true],
  );
}

/**
 * Admin rejects a version: it stops counting against the package and disappears from the
 * client's dashboard; the order goes back to the newest plan the client already has.
 */
export async function rejectVersion(versionId: string): Promise<void> {
  const { rows } = await pool.query<{ order_id: string }>(`update public.client_plan_versions set status = 'rejected' where id = $1 returning order_id`, [versionId]);
  if (!rows[0]) throw new Error("Version not found");
  await pool.query(
    `update public.diet_orders o set plan_path = v.plan_path, stage = 'sent', updated_at = now()
       from (select plan_path from public.client_plan_versions where order_id = $1 and status = 'sent' order by version desc limit 1) v
      where o.id = $1`,
    [rows[0].order_id],
  );
}

/** Any version's file, for the admin preview. */
export async function versionPath(versionId: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(versionId)) return null;
  const { rows } = await pool.query<{ plan_path: string }>(`select plan_path from public.client_plan_versions where id = $1`, [versionId]);
  return rows[0]?.plan_path ?? null;
}

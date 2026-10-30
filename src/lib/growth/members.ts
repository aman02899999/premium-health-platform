import "server-only";
import type { PoolClient } from "pg";
import { pool } from "@/health/db";
import { REFERRED_BONUS_DAYS, REFERRER_BONUS_DAYS, makeReferralCode, normaliseCode } from "./config";
import { addDays, expiryFor, isIsoDate, parseDuration, renewalStart, todayIST } from "./dates";
import type { Candidate, RowError } from "./member-import";

// public.members, public.referral_rewards: server-only tables (RLS on, no policies),
// reached through the direct database connection after the caller's own checks.

export type Member = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string | null;
  planName: string;
  startOn: string;
  expiresOn: string;
  source: "online" | "desk";
  referralCode: string;
  renewToken: string;
  reminders: boolean;
  /** False for people added from an uploaded register: renewal reminders only, no offers, until they agree. */
  offersOk: boolean;
  notes: string;
};

type Row = {
  id: string;
  created_at: Date;
  name: string;
  phone: string;
  email: string | null;
  plan_name: string;
  start_on: string;
  expires_on: string;
  source: Member["source"];
  referral_code: string;
  renew_token: string;
  reminders: boolean;
  offers_ok: boolean;
  notes: string;
};

// Dates as text so node-postgres doesn't turn them into midnight Date objects.
const COLUMNS = `id, created_at, name, phone, email, plan_name, to_char(start_on, 'YYYY-MM-DD') as start_on,
  to_char(expires_on, 'YYYY-MM-DD') as expires_on, source, referral_code, renew_token, reminders, offers_ok, notes`;

const fromRow = (r: Row): Member => ({
  id: r.id,
  createdAt: r.created_at.toISOString(),
  name: r.name,
  phone: r.phone,
  email: r.email,
  planName: r.plan_name,
  startOn: r.start_on,
  expiresOn: r.expires_on,
  source: r.source,
  referralCode: r.referral_code,
  renewToken: r.renew_token,
  reminders: r.reminders,
  offersOk: r.offers_ok,
  notes: r.notes,
});

export async function listMembers(): Promise<Member[]> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.members order by expires_on asc limit 5000`);
  return rows.map(fromRow);
}

/** Members whose reminders could be due: ending within 7 days, or ended in the last 37 (the win-back message). */
export async function membersNearExpiry(today: string): Promise<Member[]> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.members where reminders and expires_on between $1::date and $2::date`, [addDays(today, -37), addDays(today, 7)]);
  return rows.map(fromRow);
}

/** Members with an email whose membership ended 30 to 37 days ago and wasn't renewed: the win-back window (an offer, so only members who agreed to offers). */
export async function lapsedMembers(today: string): Promise<Member[]> {
  const { rows } = await pool.query<Row>(
    `select ${COLUMNS} from public.members where reminders and offers_ok and email is not null and expires_on between $1::date and $2::date`,
    [addDays(today, -37), addDays(today, -30)],
  );
  return rows.map(fromRow);
}

export async function memberById(id: string): Promise<Member | null> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.members where id = $1`, [id]);
  return rows[0] ? fromRow(rows[0]) : null;
}

/** True if this phone number already has a membership (current or lapsed). */
export async function isMemberPhone(phone: string): Promise<boolean> {
  const { rows } = await pool.query(`select 1 from public.members where phone = $1 limit 1`, [phone]);
  return rows.length > 0;
}

export async function memberByRenewToken(token: string): Promise<Member | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.members where renew_token = $1`, [token]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function memberByCode(code: string): Promise<Member | null> {
  const { rows } = await pool.query<Row>(`select ${COLUMNS} from public.members where referral_code = $1`, [normaliseCode(code)]);
  return rows[0] ? fromRow(rows[0]) : null;
}

/**
 * Inserts with a fresh referral code, retrying on the (unlikely) code collision. Inside a
 * transaction a failed statement aborts everything, so each try runs under a savepoint.
 */
export async function insertMember(db: PoolClient | typeof pool, m: { name: string; phone: string; email: string | null; planName: string; startOn: string; expiresOn: string; source: Member["source"]; notes?: string; offersOk?: boolean }, inTxn = false): Promise<Member> {
  for (let attempt = 0; attempt < 5; attempt++) {
    if (inTxn) await db.query("savepoint member_insert");
    try {
      const { rows } = await db.query<Row>(
        `insert into public.members (name, phone, email, plan_name, start_on, expires_on, source, referral_code, notes, offers_ok)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning ${COLUMNS}`,
        [m.name, m.phone, m.email, m.planName, m.startOn, m.expiresOn, m.source, makeReferralCode(m.name), m.notes ?? "", m.offersOk ?? true],
      );
      if (inTxn) await db.query("release savepoint member_insert");
      return fromRow(rows[0]);
    } catch (err) {
      if (inTxn) await db.query("rollback to savepoint member_insert");
      const e = err as { code?: string; constraint?: string };
      if (e.code === "23505" && e.constraint === "members_referral_code_key") continue;
      throw err;
    }
  }
  throw new Error("Could not create a unique referral code");
}

/** offersOk: the "Agreed to get offers" tick; left out, a new member gets offers and an edit keeps what was there. */
export type DeskInput = { name: string; phone: string; email: string | null; planName: string; startOn: string; expiresOn: string; notes: string; reminders: boolean; offersOk?: boolean };

/** Validates a member typed in by the admin. Returns an error message or the clean input. */
export function parseDeskInput(b: Record<string, unknown>): DeskInput | string {
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
  const digits = s(b.phone, 20).replace(/\D/g, "");
  const phone = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  const out = { name: s(b.name, 80), phone, email: s(b.email, 120) || null, planName: s(b.planName, 80), startOn: s(b.startOn, 10), expiresOn: s(b.expiresOn, 10), notes: typeof b.notes === "string" ? b.notes.slice(0, 1000) : "", reminders: b.reminders !== false, offersOk: typeof b.offersOk === "boolean" ? b.offersOk : undefined };
  if (out.name.length < 2) return "Enter the member's name.";
  if (!/^[6-9]\d{9}$/.test(out.phone)) return "Enter a valid 10-digit Indian mobile number.";
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return "Enter a valid email or leave it blank.";
  if (!out.planName) return "Enter the plan.";
  if (!isIsoDate(out.startOn) || !isIsoDate(out.expiresOn)) return "Enter valid start and end dates.";
  if (out.expiresOn < out.startOn) return "The end date is before the start date.";
  return out;
}

/** Adds a member who paid at the desk, or updates them if the phone number is already registered. */
export async function saveDeskMember(input: DeskInput, id?: string): Promise<Member> {
  if (id) {
    const { rows } = await pool.query<Row>(
      `update public.members set name = $2, phone = $3, email = $4, plan_name = $5, start_on = $6, expires_on = $7, notes = $8, reminders = $9, offers_ok = coalesce($10, offers_ok), updated_at = now()
        where id = $1 returning ${COLUMNS}`,
      [id, input.name, input.phone, input.email, input.planName, input.startOn, input.expiresOn, input.notes, input.reminders, input.offersOk ?? null],
    );
    if (!rows[0]) throw new Error("Member not found");
    return fromRow(rows[0]);
  }
  return insertMember(pool, { ...input, source: "desk" });
}

export type ImportPlan = {
  add: Candidate[];
  update: (Candidate & { was: string })[];
  unchanged: Candidate[];
  duplicates: RowError[];
  remindSoon: number;
};

/**
 * Decides what an import does without changing anything: new numbers are added; a number that is
 * already a member is updated only when the file gives a later end date (an import never shortens
 * a membership that was renewed online since). The same number twice keeps the later end date.
 * With commit, applies it in one transaction.
 */
export async function importMembers(candidates: Candidate[], today: string, commit: boolean): Promise<ImportPlan> {
  const byPhone = new Map<string, Candidate>();
  const duplicates: RowError[] = [];
  for (const c of candidates) {
    const prev = byPhone.get(c.phone);
    if (!prev) byPhone.set(c.phone, c);
    else {
      const [keep, drop] = c.expiresOn > prev.expiresOn ? [c, prev] : [prev, c];
      byPhone.set(c.phone, keep);
      duplicates.push({ row: drop.row, message: `Same mobile as row ${keep.row}; kept the later end date.` });
    }
  }
  const unique = [...byPhone.values()];
  const { rows } = await pool.query<{ phone: string; expires_on: string }>(`select phone, to_char(expires_on, 'YYYY-MM-DD') as expires_on from public.members where phone = any($1)`, [unique.map((c) => c.phone)]);
  const existing = new Map(rows.map((r) => [r.phone, r.expires_on]));
  const plan: ImportPlan = { add: [], update: [], unchanged: [], duplicates, remindSoon: 0 };
  for (const c of unique) {
    const was = existing.get(c.phone);
    if (!was) plan.add.push(c);
    else if (c.expiresOn > was) plan.update.push({ ...c, was });
    else plan.unchanged.push(c);
  }
  const lo = addDays(today, -10);
  const hi = addDays(today, 7);
  plan.remindSoon = [...plan.add, ...plan.update].filter((c) => c.expiresOn >= lo && c.expiresOn <= hi).length;
  if (!commit) return plan;

  const client = await pool.connect();
  try {
    await client.query("begin");
    // People from an uploaded register have no record of agreeing to offers (owner's decision, 29 Oct 2026):
    // renewal reminders only until they agree (the tick in Growth, or "Start promotions" on WhatsApp).
    for (const c of plan.add) await insertMember(client, { ...c, source: "desk", offersOk: false }, true);
    for (const c of plan.update) {
      await client.query(
        `update public.members set plan_name = $2, start_on = least(start_on, $3::date), expires_on = $4, email = coalesce(email, $5), updated_at = now() where phone = $1`,
        [c.phone, c.planName, c.startOn, c.expiresOn, c.email],
      );
    }
    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  return plan;
}

export type Applied = {
  member: Member;
  isNew: boolean;
  orderId: string;
  reward: { id: string; referrer: Member; days: number } | null;
} | null;

/**
 * Turns a paid membership order into membership days, exactly once.
 * The order row is locked, so the browser's verify call and Razorpay's webhook can both
 * call this safely: whichever comes second sees applied_at and does nothing.
 * Returns null when there is nothing to do (unknown, unpaid, or already applied).
 */
export async function applyPaidOrder(razorpayOrderId: string, now = new Date()): Promise<Applied> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ id: string; status: string; applied_at: Date | null; plan_name: string; duration: string; name: string; phone: string; email: string | null; start_date: string | null; referral_code: string | null; couple: boolean; partner_name: string | null }>(
      `select id, status, applied_at, plan_name, duration, name, phone, email, to_char(start_date, 'YYYY-MM-DD') as start_date, referral_code, couple, partner_name
         from public.membership_orders where razorpay_order_id = $1 for update`,
      [razorpayOrderId],
    );
    const o = rows[0];
    if (!o || o.status !== "paid" || o.applied_at) {
      await client.query("rollback");
      return null;
    }
    const span = parseDuration(o.duration);
    if (!span) throw new Error(`Plan duration "${o.duration}" can't be read; add this member by hand`);
    const today = todayIST(now);
    const planName = `${o.plan_name}${o.couple ? " (couple)" : ""}`;

    const existing = (await client.query<Row>(`select ${COLUMNS} from public.members where phone = $1 for update`, [o.phone])).rows[0];
    let member: Member;
    let isNew = false;
    if (existing) {
      const start = renewalStart(today, o.start_date, existing.expires_on);
      const { rows: up } = await client.query<Row>(
        `update public.members set plan_name = $2, expires_on = $3, -- A gap since the last expiry starts a new membership period; otherwise it continues.
            start_on = case when expires_on < $4::date - 1 then $4::date else start_on end,
            email = coalesce($5, email), updated_at = now() where id = $1 returning ${COLUMNS}`,
        [existing.id, planName, expiryFor(start, span), start, o.email],
      );
      member = fromRow(up[0]);
    } else {
      const start = renewalStart(today, o.start_date, null);
      member = await insertMember(client, { name: o.name, phone: o.phone, email: o.email, planName, startOn: start, expiresOn: expiryFor(start, span), source: "online", notes: o.partner_name ? `Partner: ${o.partner_name}` : "" }, true);
      isNew = true;
    }

    // Referral bonus: only for a first membership, never for your own code.
    let reward: NonNullable<Applied>["reward"] = null;
    if (isNew && o.referral_code) {
      const ref = (await client.query<Row>(`select ${COLUMNS} from public.members where referral_code = $1 for update`, [o.referral_code])).rows[0];
      if (ref && ref.id !== member.id) {
        const { rows: rw } = await client.query<{ id: string }>(
          `insert into public.referral_rewards (referrer_id, referred_id, order_id, referrer_days, referred_days)
           values ($1, $2, $3, $4, $5) on conflict (order_id) do nothing returning id`,
          [ref.id, member.id, o.id, REFERRER_BONUS_DAYS, REFERRED_BONUS_DAYS],
        );
        if (rw[0]) {
          // A lapsed referrer's bonus starts today rather than vanishing into the past.
          const { rows: r1 } = await client.query<Row>(
            `update public.members set expires_on = greatest(expires_on, $2::date - 1) + $3::int, updated_at = now() where id = $1 returning ${COLUMNS}`,
            [ref.id, today, REFERRER_BONUS_DAYS],
          );
          const { rows: r2 } = await client.query<Row>(`update public.members set expires_on = expires_on + $2::int, updated_at = now() where id = $1 returning ${COLUMNS}`, [member.id, REFERRED_BONUS_DAYS]);
          member = fromRow(r2[0]);
          reward = { id: rw[0].id, referrer: fromRow(r1[0]), days: REFERRER_BONUS_DAYS };
        }
      }
    }

    await client.query(`update public.membership_orders set applied_at = now(), member_id = $2, updated_at = now() where id = $1`, [o.id, member.id]);
    await client.query("commit");
    return { member, isNew, orderId: o.id, reward };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Paid orders that couldn't be turned into a membership automatically (shown to the admin). */
export async function unappliedPaidOrders(): Promise<{ razorpayOrderId: string; name: string; phone: string; planName: string; duration: string; paidAt: string }[]> {
  const { rows } = await pool.query<{ razorpay_order_id: string; name: string; phone: string; plan_name: string; duration: string; paid_at: Date }>(
    `select razorpay_order_id, name, phone, plan_name, duration, paid_at from public.membership_orders where status = 'paid' and applied_at is null order by paid_at desc limit 100`,
  );
  return rows.map((r) => ({ razorpayOrderId: r.razorpay_order_id, name: r.name, phone: r.phone, planName: r.plan_name, duration: r.duration, paidAt: r.paid_at.toISOString() }));
}

export type RewardRow = { id: string; createdAt: string; referrer: string; referrerCode: string; referred: string; days: number };
export async function listRewards(): Promise<RewardRow[]> {
  const { rows } = await pool.query<{ id: string; created_at: Date; referrer: string; code: string; referred: string; referrer_days: number }>(
    `select r.id, r.created_at, a.name as referrer, a.referral_code as code, b.name as referred, r.referrer_days
       from public.referral_rewards r join public.members a on a.id = r.referrer_id join public.members b on b.id = r.referred_id
      order by r.created_at desc limit 500`,
  );
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at.toISOString(), referrer: r.referrer, referrerCode: r.code, referred: r.referred, days: r.referrer_days }));
}

/** The membership a paid order was applied to (for the payment confirmation screen). */
export async function memberForOrder(razorpayOrderId: string): Promise<Member | null> {
  const { rows } = await pool.query<Row>(
    `select ${COLUMNS} from public.members where id = (select member_id from public.membership_orders where razorpay_order_id = $1)`,
    [razorpayOrderId],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

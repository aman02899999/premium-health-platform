// Royal Knowledge Challenge: everything that touches the database.
import "server-only";
import { createHash, randomBytes } from "crypto";
import type { PoolClient } from "pg";
import { pool } from "@/health/db";
import { BUILT_IN, questionHash, type Question } from "./bank";
import { answer as engineAnswer, correctCount, expire, newAttempt, reveal as engineReveal, totalMs, view as engineView, type AttemptState, type Bank, type EngineError, type PublicQuestion } from "./engine";
import { QUESTIONS_PER_ATTEMPT, attemptAccess, canStart, isLevel, monthOf, passed, publicName, referralVerdict, type LevelId } from "./levels";
import { allocatePrizes, type Award, type Candidate, type PrizeId } from "./prizes";

/** Attempts with this many tab switches are kept out of the prize draw (they still get a score). */
export const FLAG_TAB_SWITCHES = 3;
/** Attempts started from one network in a day before new starts are refused. */
export const IP_DAILY_LIMIT = 6;

export type Profile = { firstName: string; lastInitial: string; phone: string; area: "ncr" | "outside"; leaderboard: boolean; contactConsent: boolean; email: string; lastLeadMonth: string | null };

export function ipHash(ip: string, day: string): string {
  return createHash("sha256").update(`${process.env.ADMIN_SECRET || "rfc"}:${day}:${ip}`).digest("hex").slice(0, 32);
}

const code = (prefix: string) => `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;

// ───────── Profiles ─────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { rows } = await pool.query(`select * from public.challenge_profiles where user_id = $1`, [userId]);
  const r = rows[0];
  return r ? { firstName: r.first_name, lastInitial: r.last_initial, phone: r.phone, area: r.area, leaderboard: r.leaderboard, contactConsent: r.contact_consent, email: r.email, lastLeadMonth: r.last_lead_month } : null;
}

/** A short code friends type or follow in a link, e.g. RAHUL4K7Q. No look-alike characters. */
export function newReferralCode(firstName: string): string {
  const name = firstName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "RFC";
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(4);
  return name + [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

/**
 * Creates or updates the player's details. A referral code only counts when the profile is first
 * created, never for an existing player, and never their own. Returns "phone-taken" when another
 * account already uses the number (one account per mobile number).
 */
export async function saveProfile(userId: string, email: string, p: Omit<Profile, "email" | "lastLeadMonth">, refCode?: string): Promise<null | "phone-taken"> {
  return tx(async (c) => {
    const { rows: clash } = await c.query(`select 1 from public.challenge_profiles where phone = $1 and user_id <> $2`, [p.phone, userId]);
    if (clash.length) return "phone-taken";
    const { rows: existing } = await c.query(`select 1 from public.challenge_profiles where user_id = $1`, [userId]);
    if (existing.length) {
      await c.query(
        `update public.challenge_profiles set email = $2, first_name = $3, last_initial = $4, phone = $5, area = $6, leaderboard = $7, contact_consent = $8, updated_at = now() where user_id = $1`,
        [userId, email, p.firstName, p.lastInitial, p.phone, p.area, p.leaderboard, p.contactConsent],
      );
      return null;
    }
    let referrer: string | null = null;
    if (refCode && /^[A-Z0-9]{6,10}$/.test(refCode)) {
      const { rows } = await c.query(`select user_id from public.challenge_profiles where referral_code = $1`, [refCode]);
      if (rows[0] && rows[0].user_id !== userId) referrer = rows[0].user_id;
    }
    for (let i = 0; i < 5; i++) {
      const { rowCount } = await c.query(
        `insert into public.challenge_profiles (user_id, email, first_name, last_initial, phone, area, leaderboard, contact_consent, referral_code, referred_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) on conflict (referral_code) do nothing`,
        [userId, email, p.firstName, p.lastInitial, p.phone, p.area, p.leaderboard, p.contactConsent, newReferralCode(p.firstName), referrer],
      );
      if (rowCount) break;
    }
    if (referrer) await c.query(`insert into public.challenge_referrals (referred_user, referrer) values ($1, $2) on conflict do nothing`, [userId, referrer]);
    return null;
  }).catch((err: Error & { code?: string }) => {
    if (err.code === "23505" && /phone/.test(err.message)) return "phone-taken" as const;
    throw err;
  });
}

export type ReferralStats = { code: string; pending: number; qualified: number; retriesLeft: number; earnedThisMonth: number };

export async function referralStats(userId: string, now = new Date()): Promise<ReferralStats | null> {
  const { rows } = await pool.query(
    `select p.referral_code,
            count(r.*) filter (where r.status = 'pending')::int as pending,
            count(r.*) filter (where r.status = 'qualified')::int as qualified,
            (select count(*)::int from public.challenge_credits k where k.user_id = p.user_id and k.used_attempt is null) as left,
            count(r.*) filter (where r.status = 'qualified' and to_char(r.decided_at at time zone 'Asia/Kolkata', 'YYYY-MM') = $2)::int as month
       from public.challenge_profiles p left join public.challenge_referrals r on r.referrer = p.user_id
      where p.user_id = $1 group by p.user_id, p.referral_code`,
    [userId, monthOf(now)],
  );
  const r = rows[0];
  return r ? { code: r.referral_code, pending: r.pending, qualified: r.qualified, retriesLeft: r.left, earnedThisMonth: r.month } : null;
}

/**
 * Called when a player finishes an attempt. If they were referred and this was a Beginner
 * attempt, decides the referral once: retry for the referrer, or the reason it doesn't count.
 */
export async function decideReferral(userId: string, now = new Date()): Promise<string | null> {
  return tx(async (c) => {
    const { rows } = await c.query(`select referrer, status from public.challenge_referrals where referred_user = $1 for update`, [userId]);
    if (!rows[0] || rows[0].status !== "pending") return null;
    const referrer: string = rows[0].referrer;
    await c.query(`select pg_advisory_xact_lock(hashtext('challenge-ref:' || $1))`, [referrer]);
    const { rows: done } = await c.query(`select ip_hash from public.challenge_attempts where user_id = $1 and level = 'beginner' and finished_at is not null`, [userId]);
    const { rows: shared } = await c.query(
      `select 1 from public.challenge_attempts a where a.user_id = $1 and a.ip_hash <> '' and a.ip_hash = any($2::text[]) limit 1`,
      [referrer, done.map((d) => d.ip_hash)],
    );
    const { rows: count } = await c.query(
      `select count(*)::int as n from public.challenge_referrals where referrer = $1 and status = 'qualified' and to_char(decided_at at time zone 'Asia/Kolkata', 'YYYY-MM') = $2`,
      [referrer, monthOf(now)],
    );
    const verdict = referralVerdict({ selfReferral: referrer === userId, friendFinishedBeginner: done.length > 0, sameNetwork: shared.length > 0, referrerQualifiedThisMonth: count[0].n });
    if (verdict === "pending") return null;
    const status = verdict === "rejected-self" ? "rejected-network" : verdict;
    await c.query(`update public.challenge_referrals set status = $2, decided_at = now() where referred_user = $1`, [userId, status]);
    if (status === "qualified") await c.query(`insert into public.challenge_credits (user_id, source, ref) values ($1, 'referral', $2) on conflict do nothing`, [referrer, userId]);
    return status;
  });
}

// ───────── Questions ─────────

type CustomRow = { id: string; level: LevelId; topic: string; prompt: string; options: string[]; answer: number; why: string; source: string; retired_at: Date | null; created_at: Date; created_by: string };

async function customQuestions(includeRetired = false): Promise<(Question & { retired: boolean; createdBy: string })[]> {
  const { rows } = await pool.query<CustomRow>(`select * from public.challenge_custom_questions ${includeRetired ? "" : "where retired_at is null"} order by created_at`);
  return rows.map((r) => ({ id: r.id, level: r.level, topic: r.topic, prompt: r.prompt, options: r.options, answer: r.answer, why: r.why, source: r.source, custom: true, retired: r.retired_at !== null, createdBy: r.created_by }));
}

async function reviews(): Promise<Map<string, { status: string; hash: string; by: string; at: string }>> {
  const { rows } = await pool.query(`select question_id, status, hash, reviewed_by, reviewed_at from public.challenge_question_reviews`);
  return new Map(rows.map((r) => [r.question_id, { status: r.status, hash: r.hash, by: r.reviewed_by, at: r.reviewed_at.toISOString() }]));
}

/** Questions that can be served in a level: approved built-ins whose wording hasn't changed, plus live admin questions. */
export async function liveQuestions(level?: LevelId): Promise<Question[]> {
  const rv = await reviews();
  const builtIn = BUILT_IN.filter((q) => {
    const r = rv.get(q.id);
    return r?.status === "approved" && r.hash === questionHash(q);
  });
  const all = [...builtIn, ...(await customQuestions())];
  return level ? all.filter((q) => q.level === level) : all;
}

/** Lookup for the engine. Questions retired after an attempt started still resolve. */
async function bankFor(ids: string[]): Promise<Bank> {
  const custom = ids.some((id) => id.startsWith("c")) ? await customQuestions(true) : [];
  const byId = new Map([...BUILT_IN, ...custom].map((q) => [q.id, q]));
  const get = (id: string) => {
    const q = byId.get(id);
    if (!q) throw new Error(`question ${id} missing`);
    return q;
  };
  return { prompt: (id) => get(id).prompt, options: (id) => get(id).options, answer: (id) => get(id).answer };
}

export type AdminQuestion = Question & { state: "waiting" | "approved" | "retired" | "changed"; reviewedBy: string };

export async function adminQuestions(): Promise<AdminQuestion[]> {
  const rv = await reviews();
  const builtIn: AdminQuestion[] = BUILT_IN.map((q) => {
    const r = rv.get(q.id);
    const state = !r ? "waiting" : r.status === "retired" ? "retired" : r.hash === questionHash(q) ? "approved" : "changed";
    return { ...q, state, reviewedBy: r?.by ?? "" };
  });
  const custom: AdminQuestion[] = (await customQuestions(true)).map((q) => ({ ...q, state: q.retired ? "retired" : "approved", reviewedBy: q.createdBy }));
  return [...builtIn, ...custom];
}

export async function reviewQuestions(ids: string[], status: "approved" | "retired", by: string): Promise<number> {
  let n = 0;
  for (const id of ids) {
    const builtIn = BUILT_IN.find((q) => q.id === id);
    if (builtIn) {
      await pool.query(
        `insert into public.challenge_question_reviews (question_id, status, hash, reviewed_by) values ($1, $2, $3, $4)
         on conflict (question_id) do update set status = $2, hash = $3, reviewed_by = $4, reviewed_at = now()`,
        [id, status, questionHash(builtIn), by.slice(0, 200)],
      );
      n++;
    } else if (/^c\d{4}$/.test(id)) {
      const { rowCount } = await pool.query(`update public.challenge_custom_questions set retired_at = ${status === "retired" ? "coalesce(retired_at, now())" : "null"} where id = $1`, [id]);
      n += rowCount ?? 0;
    }
  }
  return n;
}

export async function addQuestion(q: { level: LevelId; topic: string; prompt: string; options: string[]; answer: number; why: string; source: string }, by: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.challenge_custom_questions (level, topic, prompt, options, answer, why, source, created_by) values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [q.level, q.topic.slice(0, 40), q.prompt.trim(), JSON.stringify(q.options.map((o) => o.trim())), q.answer, q.why.trim(), q.source.trim().slice(0, 200), by.slice(0, 200)],
  );
  return rows[0].id;
}

// ───────── Attempts ─────────

export type HistoryRow = { level: LevelId; correct: number; month: string };

export async function history(userId: string): Promise<HistoryRow[]> {
  const { rows } = await pool.query(`select level, correct, month from public.challenge_attempts where user_id = $1 and finished_at is not null order by created_at`, [userId]);
  return rows.map((r) => ({ level: r.level, correct: r.correct, month: r.month }));
}

/** When each level was last started (ms), for the "free again on …" date. */
export async function lastStarts(userId: string): Promise<Partial<Record<LevelId, number>>> {
  const { rows } = await pool.query(`select level, max(created_at) as at from public.challenge_attempts where user_id = $1 group by level`, [userId]);
  return Object.fromEntries(rows.map((r) => [r.level, r.at.getTime()]));
}

export type AttemptView = { attemptId: string; level: LevelId; index: number; total: number; question: PublicQuestion | null; deadline: number | null; serverNow: number; finished: boolean };
export type Finished = { attemptId: string; level: LevelId; month: string; correct: number; totalMs: number; certificateCode: string | null; firstOfMonth: boolean };

const toView = (s: AttemptState, question: PublicQuestion | null, now: number): AttemptView => ({
  attemptId: s.id,
  level: s.level,
  index: s.index,
  total: s.questionIds.length,
  question,
  deadline: s.shownAt === null ? null : s.shownAt + 30_000,
  serverNow: now,
  finished: s.finishedAt !== null,
});

async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (err) {
    await c.query("rollback").catch(() => {});
    throw err;
  } finally {
    c.release();
  }
}

/** Saves the state; on the first save after it finishes, records the score and certificate. */
async function persist(c: PoolClient, userId: string, s: AttemptState): Promise<Finished | null> {
  const done = s.finishedAt !== null;
  const correct = correctCount(s);
  const { rows } = await c.query(
    `update public.challenge_attempts set state = $2, tab_switches = $3,
        correct = case when $4 then $5 else correct end,
        total_ms = case when $4 then $6 else total_ms end,
        certificate_code = case when $4 and $7::text is not null then coalesce(certificate_code, $7) else certificate_code end,
        finished_at = case when $4 then coalesce(finished_at, now()) else finished_at end
      where id = $1 and finished_at is null returning month, certificate_code`,
    [s.id, JSON.stringify(s), s.tabSwitches, done, correct, totalMs(s), done && passed(correct) ? code("RFC") : null],
  );
  if (!done || !rows[0]) return null;
  const { rows: earlier } = await c.query(`select 1 from public.challenge_attempts where user_id = $1 and month = $2 and finished_at is not null and id <> $3 limit 1`, [userId, rows[0].month, s.id]);
  return { attemptId: s.id, level: s.level, month: rows[0].month, correct, totalMs: totalMs(s), certificateCode: rows[0].certificate_code, firstOfMonth: earlier.length === 0 };
}

export type StartResult = { ok: true; view: AttemptView; via: "free" | "retry" | "resume" } | { ok: false; error: "locked" | "wait" | "coming-soon" | "too-many" | "other-open"; nextFreeAt?: number };

/** Starts a level: free once every 30 days, or sooner by spending a referral retry. */
export async function startAttempt(userId: string, level: LevelId, ip: string, now = Date.now()): Promise<StartResult> {
  const ids = (await liveQuestions(level)).map((q) => q.id);
  const hist = await history(userId);
  type Inner = { ok: true; via: "free" | "retry" | "resume" } | Extract<StartResult, { ok: false }>;
  const r = await tx(async (c): Promise<Inner> => {
    await c.query(`select pg_advisory_xact_lock(hashtext('challenge-start:' || $1))`, [userId]);
    const { rows: open } = await c.query(`select level, created_at from public.challenge_attempts where user_id = $1 and finished_at is null`, [userId]);
    if (open[0] && now - open[0].created_at.getTime() < 24 * 3_600_000) {
      if (open[0].level === level) return { ok: true, via: "resume" };
      return { ok: false, error: "other-open" };
    }
    if (!canStart(level, hist)) return { ok: false, error: "locked" };
    const { rows: last } = await c.query(`select created_at from public.challenge_attempts where user_id = $1 and level = $2 order by created_at desc limit 1`, [userId, level]);
    const { rows: credit } = await c.query(`select id from public.challenge_credits where user_id = $1 and used_attempt is null order by created_at limit 1 for update`, [userId]);
    const access = attemptAccess(last[0]?.created_at.getTime() ?? null, credit.length, now);
    if (!access.via) return { ok: false, error: "wait", nextFreeAt: access.nextFreeAt ?? undefined };
    const ih = ipHash(ip, new Date(now + 5.5 * 3_600_000).toISOString().slice(0, 10));
    const { rows: ipRows } = await c.query(`select count(*)::int as n from public.challenge_attempts where ip_hash = $1 and created_at > now() - interval '24 hours'`, [ih]);
    if (ipRows[0].n >= IP_DAILY_LIMIT) return { ok: false, error: "too-many" };
    if (ids.length < QUESTIONS_PER_ATTEMPT) return { ok: false, error: "coming-soon" };
    if (open[0]) {
      // An attempt left open for a day: close it (the rest count wrong) before starting a new one.
      const { rows: stale } = await c.query(`select state from public.challenge_attempts where user_id = $1 and finished_at is null for update`, [userId]);
      await persist(c, userId, expire(stale[0].state as AttemptState, now));
    }
    const id = crypto.randomUUID();
    const s = newAttempt(id, level, ids, now);
    await c.query(`insert into public.challenge_attempts (id, user_id, level, month, state, ip_hash, via) values ($1, $2, $3, $4, $5, $6, $7)`, [id, userId, level, monthOf(new Date(now)), JSON.stringify(s), ih, access.via]);
    if (access.via === "retry") await c.query(`update public.challenge_credits set used_attempt = $2 where id = $1`, [credit[0].id, id]);
    return { ok: true, via: access.via };
  });
  if (!r.ok) return r;
  const view = await current(userId, now);
  if (!view) throw new Error("attempt vanished");
  return { ok: true, view, via: r.via };
}

type Step = { view: AttemptView | null; finished: Finished | null; error?: EngineError };

async function withActive(userId: string, fn: (s: AttemptState, bank: Bank) => { state: AttemptState; question?: PublicQuestion | null; error?: EngineError }, now: number): Promise<Step> {
  return tx(async (c) => {
    const { rows } = await c.query(`select state from public.challenge_attempts where user_id = $1 and finished_at is null order by created_at desc limit 1 for update`, [userId]);
    if (!rows[0]) return { view: null, finished: null };
    const s0 = rows[0].state as AttemptState;
    const bank = await bankFor(s0.questionIds);
    const r = fn(s0, bank);
    const finished = await persist(c, userId, r.state);
    let question = r.question ?? null;
    let state = r.state;
    if (!finished && question === null && state.finishedAt === null) {
      // After an answer, serve the next question straight away (its clock starts now).
      const v = engineView(state, now, bank);
      state = v.state;
      question = v.question;
      await persist(c, userId, state);
    }
    return { view: toView(state, question, now), finished, error: r.error };
  });
}

/** The player's unfinished attempt, if any, with the current question (starting its clock). */
export async function current(userId: string, now = Date.now()): Promise<AttemptView | null> {
  return (await withActive(userId, (s, bank) => engineView(s, now, bank), now)).view;
}

export const reveal = (userId: string, index: number, now = Date.now()) => withActive(userId, (s, bank) => engineReveal(s, index, now, bank), now);
export const submit = (userId: string, index: number, choice: number, tabSwitches: number, now = Date.now()) => withActive(userId, (s, bank) => engineAnswer(s, index, choice, now, bank, tabSwitches), now);

export async function markLeadSent(userId: string, month: string): Promise<boolean> {
  const { rowCount } = await pool.query(`update public.challenge_profiles set last_lead_month = $2 where user_id = $1 and contact_consent and last_lead_month is distinct from $2`, [userId, month]);
  return (rowCount ?? 0) > 0;
}

// ───────── Watch-and-share task ─────────

/** People who must open a player's share link (different networks, not the player's) to earn a retry. */
export const SHARE_VISITS_NEEDED = 5;

export type ShareTask = { code: string; videoId: string; visits: number; rewarded: boolean };

/** This month's share task for the player, created on first ask with the given video. */
export async function shareTask(userId: string, videoId: string | null, ip: string, now = new Date()): Promise<ShareTask | null> {
  const month = monthOf(now);
  const read = async () => {
    const { rows } = await pool.query(
      `select s.code, s.video_id, s.rewarded_at, (select count(*)::int from public.challenge_share_visits v where v.code = s.code) as visits
         from public.challenge_shares s where s.user_id = $1 and s.month = $2`,
      [userId, month],
    );
    return rows[0] ? { code: rows[0].code, videoId: rows[0].video_id, visits: Math.min(rows[0].visits, SHARE_VISITS_NEEDED), rewarded: rows[0].rewarded_at !== null } : null;
  };
  const existing = await read();
  if (existing || !videoId) return existing;
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const shareCode = "S" + [...randomBytes(8)].map((b) => alphabet[b % alphabet.length]).join("");
  await pool.query(
    `insert into public.challenge_shares (code, user_id, month, video_id, owner_ip_hash) values ($1, $2, $3, $4, $5) on conflict (user_id, month) do nothing`,
    [shareCode, userId, month, videoId, ipHash(ip, new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10))],
  );
  return read();
}

export async function shareByCode(shareCode: string): Promise<{ videoId: string; firstName: string; referralCode: string } | null> {
  if (!/^S[A-Z0-9]{8}$/.test(shareCode)) return null;
  const { rows } = await pool.query(`select s.video_id, p.first_name, p.referral_code from public.challenge_shares s join public.challenge_profiles p on p.user_id = s.user_id where s.code = $1`, [shareCode]);
  return rows[0] ? { videoId: rows[0].video_id, firstName: rows[0].first_name, referralCode: rows[0].referral_code } : null;
}

/**
 * Counts one person opening a share link. Visits from the player's own networks (any network they
 * played or created the task from) don't count. The 5th different visitor earns the retry, once.
 */
export async function recordShareVisit(shareCode: string, ip: string, now = new Date()): Promise<"counted" | "rewarded" | "ignored"> {
  if (!/^S[A-Z0-9]{8}$/.test(shareCode)) return "ignored";
  // Hash per share code (not per day) so the same person can't count twice on different days.
  const visitor = createHash("sha256").update(`${process.env.ADMIN_SECRET || "rfc"}:share:${shareCode}:${ip}`).digest("hex").slice(0, 32);
  const dayHash = ipHash(ip, new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10));
  return tx(async (c) => {
    const { rows } = await c.query(`select user_id, owner_ip_hash, rewarded_at from public.challenge_shares where code = $1 for update`, [shareCode]);
    const s = rows[0];
    if (!s || s.rewarded_at) return "ignored";
    if (dayHash === s.owner_ip_hash) return "ignored";
    const { rows: own } = await c.query(`select 1 from public.challenge_attempts where user_id = $1 and ip_hash = $2 limit 1`, [s.user_id, dayHash]);
    if (own.length) return "ignored";
    const { rowCount } = await c.query(`insert into public.challenge_share_visits (code, ip_hash) values ($1, $2) on conflict do nothing`, [shareCode, visitor]);
    if (!rowCount) return "ignored";
    const { rows: n } = await c.query(`select count(*)::int as n from public.challenge_share_visits where code = $1`, [shareCode]);
    if (n[0].n < SHARE_VISITS_NEEDED) return "counted";
    await c.query(`update public.challenge_shares set rewarded_at = now() where code = $1`, [shareCode]);
    await c.query(`insert into public.challenge_credits (user_id, source, ref) values ($1, 'share', $2) on conflict do nothing`, [s.user_id, shareCode]);
    return "rewarded";
  });
}

// ───────── Results, leaderboard, certificates ─────────

export type AttemptSummary = { id: string; level: LevelId; month: string; correct: number | null; totalMs: number | null; finished: boolean; certificateCode: string | null; flagged: boolean };

export async function attemptsOf(userId: string): Promise<AttemptSummary[]> {
  const { rows } = await pool.query(`select id, level, month, correct, total_ms, finished_at, certificate_code, tab_switches from public.challenge_attempts where user_id = $1 order by created_at desc limit 100`, [userId]);
  return rows.map((r) => ({ id: r.id, level: r.level, month: r.month, correct: r.correct, totalMs: r.total_ms, finished: r.finished_at !== null, certificateCode: r.certificate_code, flagged: r.tab_switches >= FLAG_TAB_SWITCHES }));
}

export type BoardRow = { rank: number; name: string; correct: number; totalMs: number; you: boolean };

/** Rank of every finished attempt in that level and month; names only for people who opted in. */
export async function leaderboard(level: LevelId, month: string, viewer: string | null, limit = 50): Promise<{ rows: BoardRow[]; yourRank: number | null; players: number }> {
  const { rows } = await pool.query(
    `with best as (
       select distinct on (user_id) user_id, correct, total_ms, created_at from public.challenge_attempts
        where level = $1 and month = $2 and finished_at is not null
        order by user_id, correct desc, total_ms asc
     )
     select b.user_id, b.correct, b.total_ms, p.first_name, p.last_initial, p.leaderboard,
            rank() over (order by b.correct desc, b.total_ms asc) as rank
       from best b join public.challenge_profiles p on p.user_id = b.user_id
      order by rank, b.created_at`,
    [level, month],
  );
  const you = rows.find((r) => r.user_id === viewer);
  const visible = rows.filter((r) => r.leaderboard || r.user_id === viewer).slice(0, limit);
  return {
    rows: visible.map((r) => ({ rank: Number(r.rank), name: publicName(r.first_name, r.last_initial), correct: r.correct, totalMs: r.total_ms, you: r.user_id === viewer })),
    yourRank: you ? Number(you.rank) : null,
    players: rows.length,
  };
}

export type Certificate = { code: string; name: string; level: LevelId; month: string; correct: number; issuedAt: string };

export async function certificate(certCode: string): Promise<Certificate | null> {
  if (!/^RFC-[0-9A-F]{8}$/.test(certCode)) return null;
  const { rows } = await pool.query(
    `select a.certificate_code, a.level, a.month, a.correct, a.finished_at, p.first_name, p.last_initial
       from public.challenge_attempts a join public.challenge_profiles p on p.user_id = a.user_id where a.certificate_code = $1`,
    [certCode],
  );
  const r = rows[0];
  return r && isLevel(r.level) ? { code: r.certificate_code, name: publicName(r.first_name, r.last_initial), level: r.level, month: r.month, correct: r.correct, issuedAt: r.finished_at.toISOString() } : null;
}

// ───────── Prizes ─────────

export type PrizeRow = { claimCode: string; month: string; prize: PrizeId; status: "won" | "redeemed" | "void"; level: LevelId; correct: number; name: string; phone: string; email: string; area: string; redeemedAt: string | null; redeemedBy: string; note: string };

const PRIZE_SELECT = `select z.claim_code, z.month, z.prize, z.status, z.redeemed_at, z.redeemed_by, z.note, a.level, a.correct, p.first_name, p.last_initial, p.phone, p.email, p.area
  from public.challenge_prizes z join public.challenge_attempts a on a.id = z.attempt_id join public.challenge_profiles p on p.user_id = z.user_id`;
type PrizeDbRow = { claim_code: string; month: string; prize: PrizeId; status: PrizeRow["status"]; redeemed_at: Date | null; redeemed_by: string; note: string; level: LevelId; correct: number; first_name: string; last_initial: string; phone: string; email: string; area: string };
const toPrize = (r: PrizeDbRow): PrizeRow => ({ claimCode: r.claim_code, month: r.month, prize: r.prize, status: r.status, level: r.level, correct: r.correct, name: publicName(r.first_name, r.last_initial), phone: r.phone, email: r.email, area: r.area, redeemedAt: r.redeemed_at?.toISOString() ?? null, redeemedBy: r.redeemed_by, note: r.note });

export async function prizesOf(userId: string): Promise<PrizeRow[]> {
  const { rows } = await pool.query<PrizeDbRow>(`${PRIZE_SELECT} where z.user_id = $1 order by z.created_at desc`, [userId]);
  return rows.map(toPrize);
}

export async function prizesFor(month: string): Promise<PrizeRow[]> {
  const { rows } = await pool.query<PrizeDbRow>(`${PRIZE_SELECT} where z.month = $1 order by z.created_at`, [month]);
  return rows.map(toPrize);
}

export async function isFinalised(month: string): Promise<boolean> {
  const { rows } = await pool.query(`select 1 from public.challenge_months where month = $1`, [month]);
  return rows.length > 0;
}

/**
 * Hands out a month's prizes once. Flagged attempts (many tab switches) stay out of the draw.
 * Returns null when the month was already finalised.
 */
export async function finaliseMonth(month: string, by: string): Promise<(Award & { claimCode: string; email: string; firstName: string })[] | null> {
  return tx(async (c) => {
    await c.query(`select pg_advisory_xact_lock(hashtext('challenge-finalise:' || $1))`, [month]);
    if ((await c.query(`select 1 from public.challenge_months where month = $1`, [month])).rows.length) return null;
    const { rows } = await c.query(
      `select a.id, a.user_id, a.level, a.correct, a.total_ms, p.area, p.email, p.first_name
         from public.challenge_attempts a join public.challenge_profiles p on p.user_id = a.user_id
        where a.month = $1 and a.finished_at is not null and a.tab_switches < $2`,
      [month, FLAG_TAB_SWITCHES],
    );
    const candidates: Candidate[] = rows.map((r) => ({ userId: r.user_id, attemptId: r.id, level: r.level, correct: r.correct, totalMs: r.total_ms, local: r.area === "ncr" }));
    const awards = allocatePrizes(candidates);
    const out = [];
    for (const a of awards) {
      const claimCode = code("WIN");
      await c.query(`insert into public.challenge_prizes (month, user_id, attempt_id, prize, claim_code) values ($1, $2, $3, $4, $5)`, [month, a.userId, a.attemptId, a.prize, claimCode]);
      const who = rows.find((r) => r.user_id === a.userId)!;
      out.push({ ...a, claimCode, email: who.email, firstName: who.first_name });
    }
    await c.query(`insert into public.challenge_months (month, finalised_by, awards) values ($1, $2, $3)`, [month, by.slice(0, 200), awards.length]);
    return out;
  });
}

/** Marks a prize collected at the counter. Returns why not when it can't be. */
export async function redeemPrize(claimCode: string, by: string, note: string): Promise<string | null> {
  const { rows } = await pool.query(`select status, created_at from public.challenge_prizes where claim_code = $1`, [claimCode.trim().toUpperCase()]);
  if (!rows[0]) return "No prize with that code.";
  if (rows[0].status === "redeemed") return "This prize was already collected.";
  if (rows[0].status === "void") return "This prize was cancelled.";
  if (Date.now() - rows[0].created_at.getTime() > 31 * 86_400_000) return "This prize has expired (30 days to collect).";
  await pool.query(`update public.challenge_prizes set status = 'redeemed', redeemed_at = now(), redeemed_by = $2, note = $3 where claim_code = $1 and status = 'won'`, [claimCode.trim().toUpperCase(), by.slice(0, 200), note.slice(0, 500)]);
  return null;
}

export async function voidPrize(claimCode: string, by: string, note: string): Promise<string | null> {
  const { rowCount } = await pool.query(`update public.challenge_prizes set status = 'void', redeemed_by = $2, note = $3 where claim_code = $1 and status = 'won'`, [claimCode.trim().toUpperCase(), by.slice(0, 200), note.slice(0, 500)]);
  return rowCount ? null : "Only an uncollected prize can be cancelled.";
}

export type MonthRow = { name: string; phone: string; area: string; level: LevelId; correct: number | null; totalMs: number | null; tabSwitches: number; sharedNetwork: boolean; finished: boolean };

/** Every attempt in a month, for the admin: flags many tab switches and networks shared by several accounts. */
export async function monthAttempts(month: string): Promise<MonthRow[]> {
  const { rows } = await pool.query(
    `select p.first_name, p.last_initial, p.phone, p.area, a.level, a.correct, a.total_ms, a.tab_switches, a.finished_at,
            (select count(distinct b.user_id) from public.challenge_attempts b where b.ip_hash = a.ip_hash and b.ip_hash <> '' and b.month = a.month) > 2 as shared
       from public.challenge_attempts a join public.challenge_profiles p on p.user_id = a.user_id
      where a.month = $1 order by a.level desc, a.correct desc nulls last, a.total_ms`,
    [month],
  );
  return rows.map((r) => ({ name: publicName(r.first_name, r.last_initial), phone: r.phone, area: r.area, level: r.level, correct: r.correct, totalMs: r.total_ms, tabSwitches: r.tab_switches, sharedNetwork: r.shared, finished: r.finished_at !== null }));
}

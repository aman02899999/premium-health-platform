// Knowledge Challenge store on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/challenge/store.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Knowledge Challenge on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let st: typeof import("./store");
  let bank: typeof import("./bank");
  const users = { a: "00000000-0000-0000-0000-00000000000a", b: "00000000-0000-0000-0000-00000000000b", c: "00000000-0000-0000-0000-00000000000c" };
  const profile = (phone: string, area: "ncr" | "outside" = "ncr") => ({ firstName: "Rahul", lastInitial: "K", phone, area, leaderboard: true, contactConsent: false });

  /** Plays the open attempt to the end, answering right `right` times. */
  async function play(user: string, right: number, now: number) {
    let t = now;
    for (let i = 0; i < 20; i++) {
      const v = await st.current(user, t);
      if (!v) throw new Error("no attempt");
      const r = await st.reveal(user, i, (t += 1000));
      const q = bank.BUILT_IN.find((x) => x.id === r.view!.question!.questionId)!;
      const shown = r.view!.question!.options!;
      const rightPos = shown.indexOf(q.options[q.answer]);
      const step = await st.submit(user, i, i < right ? rightPos : (rightPos + 1) % 4, 0, (t += 1000));
      if (step.finished) return step.finished;
    }
    throw new Error("did not finish");
  }

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    st = await import("./store");
    bank = await import("./bank");
  });
  beforeEach(async () => {
    await pool.query("truncate public.challenge_share_visits, public.challenge_shares, public.challenge_credits, public.challenge_prizes, public.challenge_months, public.challenge_referrals, public.challenge_attempts, public.challenge_profiles, public.challenge_question_reviews, public.challenge_custom_questions cascade");
    for (const id of Object.values(users)) await pool.query(`insert into auth.users (id) values ($1) on conflict do nothing`, [id]);
  });
  afterAll(async () => {
    await pool.end();
  });

  it("serves only approved questions, and refuses a level with fewer than 20", async () => {
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"));
    expect(await st.startAttempt(users.a, "beginner", "1.1.1.1")).toMatchObject({ ok: false, error: "coming-soon" });
    const ids = bank.BUILT_IN.filter((q) => q.level === "beginner").map((q) => q.id);
    await st.reviewQuestions(ids, "approved", "admin");
    expect((await st.liveQuestions("beginner")).length).toBe(60);
    await st.reviewQuestions(ids.slice(0, 50), "retired", "admin");
    expect((await st.liveQuestions("beginner")).length).toBe(10);
  });

  it("plays a full attempt, scores on the server, issues a certificate and enforces the 30-day wait", async () => {
    await st.reviewQuestions(bank.BUILT_IN.map((q) => q.id), "approved", "admin");
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"));
    const T = Date.now();
    const s = await st.startAttempt(users.a, "beginner", "1.1.1.1", T);
    expect(s).toMatchObject({ ok: true, via: "free" });
    expect(JSON.stringify(s)).not.toMatch(/"answer"/);
    // A second start while it's open just resumes it.
    expect(await st.startAttempt(users.a, "beginner", "1.1.1.1", T + 10)).toMatchObject({ ok: true, via: "resume" });
    const f = await play(users.a, 18, T + 20);
    expect(f).toMatchObject({ correct: 18, level: "beginner" });
    expect(f.certificateCode).toMatch(/^RFC-[0-9A-F]{8}$/);
    expect(await st.certificate(f.certificateCode!)).toMatchObject({ name: "Rahul K.", level: "beginner", correct: 18 });
    expect(await st.startAttempt(users.a, "beginner", "1.1.1.1", T + 60_000)).toMatchObject({ ok: false, error: "wait" });
    // Intermediate is now unlocked.
    expect(await st.startAttempt(users.a, "intermediate", "1.1.1.1", T + 70_000)).toMatchObject({ ok: true, via: "free" });
  });

  it("allows one account per mobile number", async () => {
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"));
    expect(await st.saveProfile(users.b, "b@x.in", profile("9876500001"))).toBe("phone-taken");
  });

  it("earns a retry from a real referral, not from the same network, and spends it once", async () => {
    await st.reviewQuestions(bank.BUILT_IN.map((q) => q.id), "approved", "admin");
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"));
    const code = (await st.referralStats(users.a))!.code;
    const T = Date.now();
    await st.startAttempt(users.a, "beginner", "1.1.1.1", T);
    await play(users.a, 10, T + 10);

    // Friend B on a different network: qualifies.
    await st.saveProfile(users.b, "b@x.in", profile("9876500002"), code);
    await st.startAttempt(users.b, "beginner", "2.2.2.2", T + 100_000);
    await play(users.b, 15, T + 100_010);
    expect(await st.decideReferral(users.b)).toBe("qualified");
    expect(await st.decideReferral(users.b)).toBeNull();

    // Friend C on A's network: doesn't count.
    await st.saveProfile(users.c, "c@x.in", profile("9876500003"), code);
    await st.startAttempt(users.c, "beginner", "1.1.1.1", T + 200_000);
    await play(users.c, 15, T + 200_010);
    expect(await st.decideReferral(users.c)).toBe("rejected-network");

    expect(await st.referralStats(users.a)).toMatchObject({ qualified: 1, retriesLeft: 1 });
    expect(await st.startAttempt(users.a, "beginner", "1.1.1.1", T + 300_000)).toMatchObject({ ok: true, via: "retry" });
    await play(users.a, 19, T + 300_010);
    expect(await st.referralStats(users.a)).toMatchObject({ retriesLeft: 0 });
    expect(await st.startAttempt(users.a, "beginner", "1.1.1.1", T + 400_000)).toMatchObject({ ok: false, error: "wait" });

    // The leaderboard keeps each player's best attempt.
    const board = await st.leaderboard("beginner", (await import("./levels")).monthOf(new Date(T)), users.a);
    expect(board.players).toBe(3);
    expect(board.rows[0]).toMatchObject({ rank: 1, correct: 19, you: true });
  });

  it("ignores a referral code for an existing player or their own code", async () => {
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"));
    const code = (await st.referralStats(users.a))!.code;
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"), code);
    await st.saveProfile(users.b, "b@x.in", profile("9876500002"));
    await st.saveProfile(users.b, "b@x.in", profile("9876500002"), code);
    const { rows } = await pool.query(`select count(*)::int as n from public.challenge_referrals`);
    expect(rows[0].n).toBe(0);
  });

  it("finalises a month once, within caps, and redeems a prize once", async () => {
    await st.reviewQuestions(bank.BUILT_IN.map((q) => q.id), "approved", "admin");
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"));
    const T = Date.now();
    await st.startAttempt(users.a, "beginner", "1.1.1.1", T);
    await play(users.a, 20, T + 10);
    const month = (await import("./levels")).monthOf(new Date(T));
    const awards = await st.finaliseMonth(month, "test");
    expect(awards).toHaveLength(1);
    expect(awards![0]).toMatchObject({ prize: "pass-7d", userId: users.a });
    expect(await st.finaliseMonth(month, "test")).toBeNull();
    const codeWon = awards![0].claimCode;
    expect(await st.redeemPrize(codeWon, "desk", "ID checked")).toBeNull();
    expect(await st.redeemPrize(codeWon, "desk", "")).toMatch(/already collected/);
    expect(await st.voidPrize(codeWon, "desk", "")).toMatch(/uncollected/);
  });

  it("earns one retry when 5 different people open a share link, not counting the player's own network", async () => {
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"));
    const task = await st.shareTask(users.a, "abcDEF12345", "1.1.1.1");
    expect(task).toMatchObject({ visits: 0, rewarded: false });
    expect(await st.shareTask(users.a, "otherVID123", "1.1.1.1")).toMatchObject({ code: task!.code, videoId: "abcDEF12345" });
    expect(await st.recordShareVisit(task!.code, "1.1.1.1")).toBe("ignored");
    for (let i = 2; i <= 5; i++) expect(await st.recordShareVisit(task!.code, `9.9.9.${i}`)).toBe("counted");
    expect(await st.recordShareVisit(task!.code, "9.9.9.2")).toBe("ignored");
    expect(await st.recordShareVisit(task!.code, "9.9.9.6")).toBe("rewarded");
    expect(await st.recordShareVisit(task!.code, "9.9.9.7")).toBe("ignored");
    expect(await st.referralStats(users.a)).toMatchObject({ retriesLeft: 1 });
    expect(await st.shareByCode(task!.code)).toMatchObject({ videoId: "abcDEF12345", firstName: "Rahul" });
  });

  it("refuses an answer after the time limit and keeps the score server-side", async () => {
    await st.reviewQuestions(bank.BUILT_IN.map((q) => q.id), "approved", "admin");
    await st.saveProfile(users.a, "a@x.in", profile("9876500001"));
    const T = Date.now();
    await st.startAttempt(users.a, "beginner", "1.1.1.1", T);
    const r = await st.reveal(users.a, 0, T + 1000);
    const q = bank.BUILT_IN.find((x) => x.id === r.view!.question!.questionId)!;
    const late = await st.submit(users.a, 0, r.view!.question!.options!.indexOf(q.options[q.answer]), 0, T + 40_000);
    expect(late.error).toBe("stale");
    expect(late.view?.index).toBe(1);
    const { rows } = await pool.query(`select state from public.challenge_attempts where user_id = $1`, [users.a]);
    expect(rows[0].state.answers[0]).toMatchObject({ chosen: null, correct: false });
  });
});

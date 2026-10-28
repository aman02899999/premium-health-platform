// Blood report analyser on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/lab/store.integration.test.ts
import { randomBytes } from "crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("blood report store on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let store: typeof import("./store");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.LAB_DATA_KEY = randomBytes(32).toString("base64");
    pool = (await import("@/health/db")).pool;
    store = await import("./store");
  });
  beforeEach(async () => {
    await pool.query("truncate public.lab_access, public.lab_reports, public.lab_access_log, public.lab_marker_overrides, public.lab_usage_daily, public.members, public.diet_orders restart identity cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  it("grants, checks and revokes access, and logs each step", async () => {
    expect(await store.hasAccess("a@x.in")).toBe(false);
    expect(await store.grantAccess(["A@x.in", "bad", "a@x.in", "b@x.in"], "owner@gym.in", "desk")).toBe(2);
    expect(await store.hasAccess("a@x.in")).toBe(true);
    expect(await store.revokeAccess("a@x.in", "owner@gym.in")).toBe(true);
    expect(await store.hasAccess("a@x.in")).toBe(false);
    // An expired grant stops working by itself.
    await store.grantAccess(["c@x.in"], "owner@gym.in", "", "2020-01-01");
    expect(await store.hasAccess("c@x.in")).toBe(false);
    const actions = (await store.recentLog()).map((l) => l.action);
    expect(actions.filter((a) => a === "grant")).toHaveLength(2);
    expect(actions).toContain("revoke");
  });

  it("lists active members and paid diet clients who don't have access yet", async () => {
    await pool.query(`insert into public.members (name, phone, email, plan_name, start_on, expires_on, referral_code) values
      ('Ravi Kumar', '9811111111', 'Ravi@x.in', 'Monthly', current_date - 10, current_date + 20, 'RAVI-1'),
      ('Old Member', '9811111112', 'old@x.in', 'Monthly', current_date - 90, current_date - 60, 'OLD-1'),
      ('No Email', '9811111113', null, 'Monthly', current_date, current_date + 30, 'NOEM-1')`);
    await pool.query(`insert into public.diet_orders (razorpay_order_id, status, amount_paise, name, phone, email, intake, consent_at, paid_at) values
      ('order_1', 'paid', 4900, 'Diet Client', '9822222222', 'diet@x.in', '{}', now(), now()),
      ('order_2', 'created', 4900, 'Unpaid', '9822222223', 'unpaid@x.in', '{}', now(), null)`);
    let people = await store.eligiblePeople();
    expect(people.map((p) => [p.email, p.kind])).toEqual([["diet@x.in", "diet client"], ["ravi@x.in", "member"]]);
    await store.grantAccess(["ravi@x.in"], "owner");
    people = await store.eligiblePeople();
    expect(people.map((p) => p.email)).toEqual(["diet@x.in"]);
    expect((await store.accessList())[0]).toMatchObject({ email: "ravi@x.in", name: "Ravi Kumar", kind: "member", active: true });
  });

  it("saves reports encrypted, lists them back, and deletes on the member's request", async () => {
    const payload = { person: { sex: "female" as const, age: 34 }, results: [{ name: "Haemoglobin", value: 10.9, unit: "g/dL" }] };
    const id = await store.saveReport("m@x.in", payload, "2026-10-28");
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const raw = (await pool.query("select payload from public.lab_reports")).rows[0].payload as string;
    expect(raw).not.toMatch(/Haemoglobin|10\.9|female/);
    expect(await store.reportsFor("m@x.in")).toMatchObject([{ id, ...payload }]);
    expect(await store.reportsFor("other@x.in")).toEqual([]);
    // Someone else can't delete it.
    expect(await store.deleteReports("other@x.in", id)).toBe(0);
    await store.saveReport("m@x.in", payload, "2026-10-28");
    expect(await store.deleteReports("m@x.in", id)).toBe(1);
    expect(await store.deleteReports("m@x.in", null)).toBe(1);
    expect(await store.reportsFor("m@x.in")).toEqual([]);
  });

  it("logs an admin look at a member's reports before returning them", async () => {
    await store.saveReport("m@x.in", { person: { sex: "male", age: 40 }, results: [] }, "2026-10-28");
    expect(await store.adminViewReports("m@x.in", "owner@gym.in", "Member asked for a review call")).toHaveLength(1);
    expect((await store.recentLog())[0]).toMatchObject({ action: "view-reports", subject: "m@x.in", reason: "Member asked for a review call" });
  });

  it("layers admin edits on the library, merges them, and resets without deleting the row", async () => {
    await store.saveOverride("alt", { aliases: ["SGPT", "Alanine aminotransferase", "ALT enzyme"] }, "owner");
    await store.saveOverride("alt", { hidden: true }, "owner");
    let alt = (await store.liveMarkers()).find((m) => m.id === "alt")!;
    expect(alt.aliases).toContain("ALT enzyme");
    expect(alt.hidden).toBe(true);
    await store.resetOverride("alt", "owner");
    alt = (await store.liveMarkers()).find((m) => m.id === "alt")!;
    expect(alt.hidden).toBeUndefined();
    expect((await pool.query("select count(*)::int as n from public.lab_marker_overrides")).rows[0].n).toBe(1);
  });

  it("counts usage without anything about the person", async () => {
    await store.countUsage(false);
    await store.countUsage(true);
    await store.grantAccess(["a@x.in"], "owner");
    expect(await store.usage(30)).toEqual({ analyses: 2, saved: 1, savedNow: 0, people: 1 });
  });
});

// Member import on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/member-import.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readCsv } from "./sheet";
import { toCandidates, type Candidate } from "./member-import";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;
const TODAY = "2026-10-15";

describe.skipIf(!url)("member import on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let m: typeof import("./members");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    m = await import("./members");
  });
  beforeEach(async () => {
    await pool.query("truncate public.referral_rewards, public.members, public.membership_orders cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  const candidates = (csv: string): Candidate[] => {
    const out = toCandidates(readCsv(csv), TODAY);
    if (typeof out === "string") throw new Error(out);
    return out.candidates;
  };

  it("previews without saving, then adds new members, extends renewed ones, never shortens, and keeps one row per number", async () => {
    // Already a member who renewed online until 31 Dec; and one who lapsed.
    await m.saveDeskMember({ name: "Online Renewer", phone: "9000000001", email: null, planName: "Monthly", startOn: "2026-12-01", expiresOn: "2026-12-31", notes: "", reminders: true });
    await m.saveDeskMember({ name: "Lapsed", phone: "9000000002", email: null, planName: "Monthly", startOn: "2026-08-01", expiresOn: "2026-08-31", notes: "", reminders: true });

    const list = candidates(
      [
        "Name,Mobile,Email,Plan,Start date,End date",
        "Rahul Kumar,9876543210,rahul@example.com,Quarterly,01/09/2026,30/11/2026",
        "Online Renewer,9000000001,,Monthly,01/10/2026,31/10/2026", // older than what's stored: unchanged
        "Lapsed,9000000002,lapsed@example.com,Quarterly,01/10/2026,31/12/2026", // renewed at the desk: extended
        "Ends Soon,9123456780,,Monthly,20/09/2026,19/10/2026",
        "Ends Soon Again,9123456780,,Monthly,20/08/2026,19/09/2026", // same number, earlier end: dropped
      ].join("\n"),
    );

    const preview = await m.importMembers(list, TODAY, false);
    expect({ add: preview.add.map((c) => c.phone), update: preview.update.map((c) => [c.phone, c.was]), unchanged: preview.unchanged.map((c) => c.phone), remindSoon: preview.remindSoon }).toEqual({
      add: ["9876543210", "9123456780"],
      update: [["9000000002", "2026-08-31"]],
      unchanged: ["9000000001"],
      remindSoon: 1,
    });
    expect(preview.duplicates).toEqual([{ row: 6, message: "Same mobile as row 5; kept the later end date." }]);
    expect((await pool.query("select count(*)::int as n from public.members")).rows[0].n).toBe(2); // preview saved nothing

    await m.importMembers(list, TODAY, true);
    const rows = (await pool.query("select name, phone, email, plan_name, to_char(start_on,'YYYY-MM-DD') s, to_char(expires_on,'YYYY-MM-DD') e, source, referral_code from public.members order by phone")).rows;
    expect(rows.map(({ referral_code, ...r }) => ({ ...r, code: /^[A-Z0-9-]{4,20}$/.test(referral_code) }))).toEqual([
      { name: "Online Renewer", phone: "9000000001", email: null, plan_name: "Monthly", s: "2026-12-01", e: "2026-12-31", source: "desk", code: true },
      { name: "Lapsed", phone: "9000000002", email: "lapsed@example.com", plan_name: "Quarterly", s: "2026-08-01", e: "2026-12-31", source: "desk", code: true },
      { name: "Ends Soon", phone: "9123456780", email: null, plan_name: "Monthly", s: "2026-09-20", e: "2026-10-19", source: "desk", code: true },
      { name: "Rahul Kumar", phone: "9876543210", email: "rahul@example.com", plan_name: "Quarterly", s: "2026-09-01", e: "2026-11-30", source: "desk", code: true },
    ]);

    // Importing the same file again changes nothing.
    const again = await m.importMembers(list, TODAY, true);
    expect([again.add.length, again.update.length, again.unchanged.length]).toEqual([0, 0, 4]);
  });
});

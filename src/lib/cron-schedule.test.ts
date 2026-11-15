import { describe, expect, it } from "vitest";
import { allCronJobs, dailyMinute, dueJobs, TICK_MINUTES } from "./cron-schedule";

describe("cron tick schedule (Cloud Run)", () => {
  it("can run every vercel.json cron: each is a daily time on a 5-minute boundary", () => {
    for (const j of allCronJobs()) {
      const at = dailyMinute(j.schedule);
      expect(at, `${j.path} ${j.schedule}`).not.toBeNull();
      expect((at as number) % TICK_MINUTES, `${j.path} ${j.schedule}`).toBe(0);
    }
  });

  it("runs each job exactly once a day across all 288 ticks", () => {
    const counts = new Map<string, number>();
    for (let m = 0; m < 24 * 60; m += TICK_MINUTES) {
      // Cloud Scheduler can fire a few seconds late; the window still matches.
      const t = new Date(Date.UTC(2026, 10, 12, 0, m, 7));
      for (const j of dueJobs(t)) counts.set(j.path, (counts.get(j.path) ?? 0) + 1);
    }
    for (const j of allCronJobs()) expect(counts.get(j.path), j.path).toBe(1);
  });

  it("picks the right jobs for a window and ignores schedules it can't read", () => {
    const jobs = [
      { path: "/a", schedule: "15 2 * * *" },
      { path: "/b", schedule: "17 2 * * *" },
      { path: "/c", schedule: "*/5 * * * *" },
    ];
    expect(dueJobs(new Date("2026-11-12T02:15:30Z"), jobs).map((j) => j.path)).toEqual(["/a", "/b"]);
    expect(dueJobs(new Date("2026-11-12T02:20:00Z"), jobs)).toEqual([]);
    expect(dailyMinute("*/5 * * * *")).toBeNull();
  });
});

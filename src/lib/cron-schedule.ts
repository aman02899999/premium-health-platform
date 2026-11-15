// Runs Vercel's cron list (vercel.json) from one scheduler job, for hosts without Vercel Cron
// (Google Cloud Run, Nov 2026: Vercel paused the account and Google gives 3 free scheduler jobs, we
// have 13 crons). Cloud Scheduler calls /api/cron/tick every 5 minutes; each tick runs the jobs whose
// daily time falls in that 5-minute window. Every schedule must be a plain daily "M H * * *".
import vercel from "../../vercel.json";

export type CronJob = { path: string; schedule: string };
export const TICK_MINUTES = 5;

/** Minute of the UTC day for a daily "M H * * *" schedule, or null when it isn't one. */
export function dailyMinute(schedule: string): number | null {
  const m = /^(\d{1,2}) (\d{1,2}) \* \* \*$/.exec(schedule.trim());
  if (!m) return null;
  const min = Number(m[1]), hour = Number(m[2]);
  return min < 60 && hour < 24 ? hour * 60 + min : null;
}

/** The jobs due in the 5-minute window that contains `now` (UTC). */
export function dueJobs(now: Date, jobs: CronJob[] = vercel.crons): CronJob[] {
  const bucket = Math.floor((now.getUTCHours() * 60 + now.getUTCMinutes()) / TICK_MINUTES);
  return jobs.filter((j) => {
    const at = dailyMinute(j.schedule);
    return at !== null && Math.floor(at / TICK_MINUTES) === bucket;
  });
}

export const allCronJobs = (): CronJob[] => vercel.crons;

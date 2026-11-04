// The site's own watchdog: given a snapshot of what the background jobs, webhooks and messages did
// recently, which problems need the owner. Pure, so every rule is tested without a database.
// Keys are stable (they name the alert and dedupe it to one a day); titles and fixes are written
// for the owner, who is not technical.
import { monthDay } from "@/lib/growth/month-plan";

export type JobRun = { at: string; ok: boolean; summary?: string } | null;

export type Snapshot = {
  /** Can the site reach its database at all? */
  db: boolean;
  dailyRun: JobRun;
  reelRun: JobRun;
  /** Last finished /health live-sources sync. */
  healthSyncAt: string | null;
  /** The payment reconciler's last result (recorded by the morning run). */
  reconcile: { at: string; recovered: number; mismatched: string[]; errors: string[] } | null;
  razorpay: {
    /** Orders paid online (with a Razorpay payment id) in the last 14 days. */
    paidOrders14d: number;
    /** Webhook deliveries recorded in payment_events in the last 14 days. */
    events14d: number;
    /** Deliveries in the last 24 hours the site refused or failed to apply (unknown order, amount mismatch, error, stuck). */
    flagged24h: number;
  };
  whatsapp: {
    /** Sent 2–26 hours ago (old enough for Meta to have reported back). */
    sent: number;
    /** Of those, how many have any delivery status at all (delivered, read or failed). */
    withStatus: number;
    failed: number;
    /** Most common failure code among them, e.g. "131042". */
    topFailCode: string | null;
  };
  email: { sent: number; bounced: number; failedToSend: number };
  /**
   * Yesterday's (India time) Instagram and Facebook posts, read the morning after so the evening
   * retries have had their go. A run that "succeeded" can still have failed on a channel (an
   * expired token answers per channel), and a schedule that never fired leaves no row at all.
   */
  social: { date: string; missing: string[]; failed: { channel: string; error: string }[] };
};

/** The social_posts channels a day should have: the evening Reel and morning Story, plus the month plan's six. */
export function expectedSocialChannels(date: string, on: { instagram: boolean; facebook: boolean; monthPlan: boolean }): string[] {
  const nets = (["instagram", "facebook"] as const).filter((n) => on[n]);
  const daily = [...nets, ...(on.instagram ? ["instagram-story"] : [])];
  if (!on.monthPlan || monthDay(date) === null) return daily;
  return [...daily, ...["am", "pm", "reel2"].flatMap((slot) => nets.map((n) => `${n}-${slot}`))];
}

export type Problem = { key: string; title: string; detail: string; fix: string };

const HOUR = 3_600_000;
/** A once-a-day job counts as missed after 26 hours (a day plus slack for a slow run). */
const STALE_AFTER = 26 * HOUR;

const hoursAgo = (iso: string, now: Date) => Math.round((now.getTime() - Date.parse(iso)) / HOUR);

function jobProblems(key: string, name: string, run: JobRun, now: Date, fix: string): Problem[] {
  if (!run) return [{ key: `${key}-missing`, title: `${name} has never run`, detail: "There is no record of it running.", fix }];
  if (now.getTime() - Date.parse(run.at) > STALE_AFTER)
    return [{ key: `${key}-stale`, title: `${name} didn't run`, detail: `Last run was ${hoursAgo(run.at, now)} hours ago; it should run every day.`, fix }];
  if (!run.ok) return [{ key: `${key}-failed`, title: `${name} failed`, detail: `The last run (${hoursAgo(run.at, now)} h ago) stopped with an error: ${(run.summary ?? "").slice(0, 200)}`, fix }];
  return [];
}

/** Meta's error codes the owner can act on, in words. */
const WA_CODES: Record<string, string> = {
  "131042": "Meta can't charge the payment method (WhatsApp Manager → Payment settings)",
  "131048": "Meta's spam limit: too many people blocked or reported recent messages",
  "131056": "too many messages to the same number too quickly",
  "130472": "Meta's experiment holding back marketing messages to some users",
  "131026": "the numbers can't receive WhatsApp messages",
};

export function evaluate(s: Snapshot, now = new Date()): Problem[] {
  if (!s.db)
    return [
      {
        key: "db-down",
        title: "The website can't reach its database",
        detail: "Payments, sign-ups, the admin and every automatic message stop until it's back.",
        fix: "Check Supabase status and the project's Database page. If it was paused, restore it.",
      },
    ];
  const out: Problem[] = [
    ...jobProblems("daily-run", "The morning automation (reminders, receipts check, digest)", s.dailyRun, now, "Admin → Growth → Run now. If it fails again, check Vercel → Cron Jobs."),
    ...jobProblems("reel-run", "The evening Reel and lead check", s.reelRun, now, "Check Vercel → Cron Jobs, then the Instagram and Facebook tokens in Admin → Growth."),
  ];
  if (!s.healthSyncAt || now.getTime() - Date.parse(s.healthSyncAt) > STALE_AFTER)
    out.push({
      key: "health-sync-stale",
      title: "The /health live data didn't update",
      detail: s.healthSyncAt ? `Last update was ${hoursAgo(s.healthSyncAt, now)} hours ago.` : "It has never finished.",
      fix: "Check Vercel → Cron Jobs for /health/api/cron/daily.",
    });

  // Payments
  const r = s.reconcile;
  if (r && now.getTime() - Date.parse(r.at) <= STALE_AFTER) {
    if (r.mismatched.length || r.errors.length)
      out.push({
        key: "payments-mismatch",
        title: r.mismatched.length ? "Razorpay and the site disagree about a payment" : "The nightly payment check couldn't reach Razorpay",
        detail: [...r.mismatched, ...r.errors].slice(0, 3).join("; ").slice(0, 400),
        fix: "Open Admin → Payments and compare with Razorpay → Transactions before doing anything else.",
      });
    if (r.recovered)
      out.push({
        key: "payments-recovered",
        title: `${r.recovered} payment${r.recovered === 1 ? "" : "s"} only found by the nightly check`,
        detail: "Razorpay took the money but the site never heard about it, so the receipt went out late.",
        fix: "Razorpay → Live mode → Webhooks: check the webhook to /api/webhooks/razorpay is active.",
      });
  }
  if (s.razorpay.paidOrders14d > 0 && s.razorpay.events14d === 0)
    out.push({
      key: "razorpay-webhook-silent",
      title: "Razorpay's webhook isn't reaching the site",
      detail: `${s.razorpay.paidOrders14d} online payment${s.razorpay.paidOrders14d === 1 ? "" : "s"} in 14 days and no webhook at all, so refunds and chargebacks aren't recorded.`,
      fix: "Razorpay → Live mode (not Test) → Webhooks: add /api/webhooks/razorpay with the same secret as in Vercel.",
    });
  if (s.razorpay.flagged24h > 0)
    out.push({
      key: "razorpay-webhook-errors",
      title: `${s.razorpay.flagged24h} Razorpay webhook${s.razorpay.flagged24h === 1 ? "" : "s"} couldn't be applied`,
      detail: "An unknown order, a wrong amount or an error while saving it.",
      fix: "Admin → Payments shows each one; compare with Razorpay before refunding anyone.",
    });

  // WhatsApp: a failure spike (200 of 200 on 21–24 Oct), or Meta's status reports stopped arriving.
  const wa = s.whatsapp;
  if (wa.failed >= 20 && wa.failed >= wa.sent * 0.5) {
    const why = wa.topFailCode ? WA_CODES[wa.topFailCode] ?? `Meta error ${wa.topFailCode}` : "see Admin → Messages";
    out.push({
      key: "whatsapp-failures",
      title: `${wa.failed} of ${wa.sent} WhatsApp messages failed`,
      detail: `Mostly: ${why}.`,
      fix: wa.topFailCode === "131042" ? "Fix the payment method in WhatsApp Manager. Promotions are held automatically until it works." : "Open Admin → Messages to see the reasons.",
    });
  } else if (wa.sent >= 20 && wa.withStatus === 0)
    out.push({
      key: "meta-webhook-silent",
      title: "WhatsApp delivery reports stopped arriving",
      detail: `${wa.sent} messages sent and Meta hasn't reported a single delivered, read or failed status, so the site can't tell whether they arrived.`,
      fix: "Meta for Developers → your app → WhatsApp → Configuration: the webhook to /api/webhooks/meta must be verified and subscribed to messages.",
    });

  // Email: Resend refusing to send, or a bounce spike (26% on 24 Oct hurts the sending domain).
  const em = s.email;
  if (em.failedToSend >= 5 && em.failedToSend >= (em.sent + em.failedToSend) * 0.5)
    out.push({ key: "email-failures", title: `${em.failedToSend} emails couldn't be sent`, detail: "Resend refused them.", fix: "Check Resend → Logs and that RESEND_API_KEY is still valid in Vercel." });
  if (em.bounced >= 5 && em.bounced >= em.sent * 0.1)
    out.push({
      key: "email-bounces",
      title: `${em.bounced} of ${em.sent} emails bounced`,
      detail: "Above 10%, inboxes start treating the gym's emails as spam.",
      fix: "Don't send campaigns to old lists until they're cleaned; bounced addresses are already stopped automatically.",
    });

  // Instagram and Facebook: a token that expired fails every post while the job still "runs".
  const so = s.social;
  const plural = (n: number, one: string, many: string) => `${n} Instagram/Facebook ${n === 1 ? one : many}`;
  if (so.failed.length)
    out.push({
      key: "social-posts-failed",
      title: `${plural(so.failed.length, "post failed", "posts failed")} on ${so.date}`,
      detail: so.failed.slice(0, 4).map((f) => `${f.channel}: ${f.error.slice(0, 140)}`).join("; "),
      fix: "Admin → Growth shows each post's error. If it mentions the access token or session, make a new token in Meta and replace INSTAGRAM_ACCESS_TOKEN or FACEBOOK_PAGE_TOKEN in Vercel (never send it in chat).",
    });
  if (so.missing.length)
    out.push({
      key: "social-posts-missing",
      title: `${plural(so.missing.length, "post didn't go out", "posts didn't go out")} on ${so.date}`,
      detail: `No record at all for: ${so.missing.join(", ")}. The schedule didn't run, or stopped before it got there.`,
      fix: "Check Vercel → Cron Jobs for /api/cron/reel, /api/cron/social and /api/cron/daily.",
    });
  return out;
}

/** One line for the morning digest. */
export function healthLines(problems: Problem[]): string[] {
  return problems.length ? problems.map((p) => `${p.title}. ${p.fix}`) : ["All checks passed: schedules ran, payments and messages look normal."];
}

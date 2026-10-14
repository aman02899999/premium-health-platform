// What a paying client may do with their plan: how many plans the package includes, how often
// they can ask for an updated one, and until when. Pure, so the dashboard, the API that builds
// the plan and the admin screen all apply exactly the same rules (the server enforces them).
import { dietPlan } from "./config";

export type VersionLite = { createdAt: string; status: "draft" | "sent" | "rejected" };

export type EntitlementInput = {
  plan: string;
  paidAt: string;
  extraGenerations: number;
  /** Admin override of the end date (YYYY-MM-DD); otherwise the package length from payment. */
  accessUntil: string | null;
  revoked: boolean;
  versions: VersionLite[];
};

export type Entitlement = {
  /** Plans the package includes (the first one, built at checkout, counts). */
  included: number;
  allowed: number;
  used: number;
  remaining: number;
  /** Days between updates, as sold ("updated every 2 weeks"); 0 = single plan, no updates. */
  everyDays: number;
  accessUntil: string;
  /** Earliest date the next update can be asked for, if any are left. */
  nextAt: string | null;
  canUpdate: boolean;
  reason: "ok" | "revoked" | "expired" | "none-left" | "too-soon" | "in-review" | "single-plan";
};

const DAY = 86_400_000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Plans included and the spacing between them, from the package as sold. */
export function packageRules(planId: string): { included: number; everyDays: number; months: number } {
  const p = dietPlan(planId);
  if (p.months <= 0) return { included: 1, everyDays: 0, months: 0 };
  const included = Math.max(1, p.checkIns);
  return { included, everyDays: Math.floor((p.months * 30) / included), months: p.months };
}

export function entitlement(e: EntitlementInput, now = new Date()): Entitlement {
  const { included, everyDays, months } = packageRules(e.plan);
  const allowed = Math.max(1, included + e.extraGenerations);
  const live = e.versions.filter((v) => v.status !== "rejected");
  const used = live.length;
  const remaining = Math.max(0, allowed - used);
  // Single-plan packages still allow extra plans the admin grants; they have no natural length.
  const lengthDays = months > 0 ? months * 30 : 30;
  const accessUntil = e.accessUntil ?? isoDay(Date.parse(e.paidAt) + lengthDays * DAY);
  const last = live.reduce((m, v) => Math.max(m, Date.parse(v.createdAt)), 0);
  const spacing = everyDays || (e.extraGenerations > 0 ? 7 : 0);
  const nextMs = last && spacing ? last + spacing * DAY : Date.parse(e.paidAt);
  const nextAt = remaining > 0 ? isoDay(nextMs) : null;
  const today = isoDay(now.getTime());

  let reason: Entitlement["reason"] = "ok";
  if (e.revoked) reason = "revoked";
  else if (today > accessUntil) reason = "expired";
  else if (live.some((v) => v.status === "draft")) reason = "in-review";
  else if (remaining <= 0) reason = included === 1 && e.extraGenerations <= 0 ? "single-plan" : "none-left";
  else if (now.getTime() < nextMs) reason = "too-soon";
  return { included, allowed, used, remaining, everyDays, accessUntil, nextAt, canUpdate: reason === "ok", reason };
}

/** What the client reads under the "Update my plan" button. */
export function entitlementMessage(e: Entitlement): string {
  switch (e.reason) {
    case "ok":
      return `You can update your plan now (${e.remaining} of ${e.allowed} left).`;
    case "too-soon":
      return `Your next update opens on ${e.nextAt}. Follow your current plan until then: it needs ${e.everyDays} days to show results.`;
    case "in-review":
      return "Your coach is checking your latest plan because of the health details you shared. You'll get it on WhatsApp and here.";
    case "none-left":
      return `You have used all ${e.allowed} plans in your package. Renew to keep getting updated plans.`;
    case "single-plan":
      return "This package includes one plan. Upgrade to a monthly package for plans that change as you progress.";
    case "expired":
      return `Your package ended on ${e.accessUntil}. Your plans stay here to download; renew for new ones.`;
    case "revoked":
      return "Access to plan updates is paused. Please message your coach on WhatsApp.";
  }
}

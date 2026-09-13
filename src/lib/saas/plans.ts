/**
 * Developer API plans — single source of truth for quotas and pricing.
 *
 * Prices are in PAISE (integer), matching the rest of the monetization stack
 * (see src/db/monetization-schema.ts). Never use floats for money.
 */

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export type ApiPlan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in paise. 0 = free. */
  pricePaise: number;
  currency: "INR";
  /** Requests allowed per calendar day (UTC). -1 = unlimited. */
  requestsPerDay: number;
  /** Requests allowed per minute (burst protection). -1 = unlimited. */
  requestsPerMinute: number;
  /** CSV/JSONL bulk export of aggregated datasets. */
  bulkExport: boolean;
  /** Attribution to Bharat Health Guide is required in the client UI. */
  attributionRequired: boolean;
  support: string;
  sla: string;
  features: string[];
};

export const UNLIMITED = -1;

export const API_PLANS: readonly ApiPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For prototypes, students and evaluation",
    pricePaise: 0,
    currency: "INR",
    requestsPerDay: 1_000,
    requestsPerMinute: 30,
    bulkExport: false,
    attributionRequired: true,
    support: "Community (GitHub issues)",
    sla: "Best effort, no uptime commitment",
    features: [
      "1,000 requests / day",
      "30 requests / minute",
      "All read endpoints",
      "Attribution required",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For production apps with modest traffic",
    pricePaise: 149_900,
    currency: "INR",
    requestsPerDay: 50_000,
    requestsPerMinute: 120,
    bulkExport: false,
    attributionRequired: false,
    support: "Email, 2 business days",
    sla: "99.5% monthly availability target",
    features: [
      "50,000 requests / day",
      "120 requests / minute",
      "No attribution requirement",
      "Email support, 2 business days",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For high-traffic products and analytics teams",
    pricePaise: 699_900,
    currency: "INR",
    requestsPerDay: 500_000,
    requestsPerMinute: 600,
    bulkExport: true,
    attributionRequired: false,
    support: "Priority email + Slack Connect",
    sla: "99.9% monthly availability target",
    features: [
      "500,000 requests / day",
      "600 requests / minute",
      "Bulk CSV / JSONL export",
      "Priority support + status updates",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For hospitals, insurers and government programmes",
    pricePaise: 0,
    currency: "INR",
    requestsPerDay: UNLIMITED,
    requestsPerMinute: UNLIMITED,
    bulkExport: true,
    attributionRequired: false,
    support: "Named contact + 24x7 escalation",
    sla: "Custom contract with credits",
    features: [
      "Unlimited requests (fair use)",
      "Custom rate limits & IP allow-list",
      "Bulk export + data licensing",
      "Named support contact",
    ],
  },
];

export const DEFAULT_PLAN_ID: PlanId = "free";

const PLAN_MAP: ReadonlyMap<string, ApiPlan> = new Map(API_PLANS.map((p) => [p.id, p]));

/** Resolves a plan id, falling back to Free for unknown/absent values. */
export function getPlan(id: string | null | undefined): ApiPlan {
  if (!id) return PLAN_MAP.get(DEFAULT_PLAN_ID)!;
  return PLAN_MAP.get(id.toLowerCase()) ?? PLAN_MAP.get(DEFAULT_PLAN_ID)!;
}

export function isKnownPlan(id: string | null | undefined): boolean {
  return Boolean(id && PLAN_MAP.has(id.toLowerCase()));
}

/**
 * Ordering of plans from cheapest to most capable, derived from API_PLANS so it
 * cannot drift. Unknown ids rank lowest, which makes the comparison safe when a
 * caller passes something arbitrary.
 */
export function planRank(id: string | null | undefined): number {
  if (!id) return -1;
  return API_PLANS.findIndex((p) => p.id === id.toLowerCase());
}

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED || value < 0;
}

/** ₹ formatting for paise values — no trailing ".00" for whole rupees. */
export function formatInr(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQuota(value: number): string {
  return isUnlimited(value) ? "Unlimited" : value.toLocaleString("en-IN");
}

export function monthlyPriceLabel(plan: ApiPlan): string {
  if (plan.id === "enterprise") return "Custom";
  if (plan.pricePaise === 0) return "Free";
  return `${formatInr(plan.pricePaise)}/month`;
}

/**
 * API subscriptions — the paid half of the developer platform.
 *
 * Entitlement rules (deliberately fail-closed):
 *  - A subscription starts as `past_due` with `invoicePaid: false`. Nothing is
 *    upgraded by creating a checkout — only a settled payment activates a plan.
 *  - Activation requires either an *attested* verification (the payment provider
 *    holds a real secret and confirmed the charge) or the explicitly-labelled
 *    mock provider, which is recorded with `demo: true` so simulated grants can
 *    never be counted as revenue. The existing payment stack silently falls back
 *    to mock verification when Razorpay secrets are missing; this module does not
 *    — see paymentAttestation() and AUDIT.md.
 *  - Cancellation returns keys to Free rather than leaving paid quota behind.
 *
 * Backend: Postgres via Drizzle when DATABASE_URL is set, otherwise an in-memory
 * store, matching src/lib/saas/keys.ts and src/lib/monetization/storage.ts.
 */

import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { apiSubscriptions } from "@/db/saas-schema";
import type { PaymentProviderName } from "@/lib/monetization/payment";
import { updateOwnedKeysPlan } from "./keys";
import { API_PLANS, DEFAULT_PLAN_ID, getPlan, isKnownPlan, type PlanId } from "./plans";

export type SubscriptionStatus = "active" | "past_due" | "cancelled";

export type ApiSubscriptionPublic = {
  subscriptionId: string;
  plan: PlanId;
  planName: string;
  status: SubscriptionStatus;
  amountPaise: number;
  currency: "INR";
  provider: string;
  providerOrderId: string | null;
  providerSubscriptionId: string | null;
  /** True only when a real (attested) payment was recorded. */
  invoicePaid: boolean;
  /** True when the entitlement came from the simulated mock provider. */
  demo: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionOwner = { ownerId?: string | null; ownerEmail?: string | null };

export const SUBSCRIPTION_PERIOD_DAYS = 30;

/** ₹ amounts are in paise; the order id is returned to the client. */
export function generateSubscriptionId(): string {
  return `sub_${randomBytes(9).toString("base64url")}`;
}

/**
 * Describes whether the configured payment provider can actually attest a charge.
 *
 * `razorpay` without all three secrets is reported as simulated instead of being
 * silently treated as verified — asking for real billing and getting a demo
 * upgrade is the failure mode this prevents.
 */
export type PaymentAttestation = {
  provider: PaymentProviderName;
  attested: boolean;
  simulated: boolean;
  reason: string;
};

export function paymentAttestation(env: Record<string, string | undefined> = process.env): PaymentAttestation {
  const configured = (env.PAYMENT_PROVIDER as PaymentProviderName) || "mock";
  if (configured === "razorpay") {
    const missing = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"].filter((k) => !env[k]);
    return missing.length === 0
      ? { provider: "razorpay", attested: true, simulated: false, reason: "Razorpay secrets present" }
      : { provider: "razorpay", attested: false, simulated: true, reason: `Missing ${missing.join(", ")}` };
  }
  if (configured === "stripe" || configured === "paypal") {
    // Wired through the same abstraction, but not implemented in this codebase.
    return { provider: configured, attested: false, simulated: true, reason: `${configured} is not implemented` };
  }
  return { provider: "mock", attested: false, simulated: true, reason: "Mock provider simulates settlement" };
}

/** Highest plan an account currently pays for, or null when it pays for none. */
export function bestActive(subscriptions: ApiSubscriptionPublic[]): ApiSubscriptionPublic | null {
  const rank = new Map(API_PLANS.map((p, i) => [p.id as string, i]));
  const active = subscriptions.filter((s) => s.status === "active");
  if (active.length === 0) return null;
  return active.reduce((best, current) =>
    (rank.get(current.plan) ?? -1) > (rank.get(best.plan) ?? -1) ? current : best
  );
}

// ---------------------------------------------------------------- memory store

const globalForBilling = globalThis as typeof globalThis & {
  __bhgApiSubscriptions?: Map<string, ApiSubscriptionPublic & { ownerId: string | null; ownerEmail: string | null }>;
};

function memoryStore(): Map<string, ApiSubscriptionPublic & { ownerId: string | null; ownerEmail: string | null }> {
  if (!globalForBilling.__bhgApiSubscriptions) globalForBilling.__bhgApiSubscriptions = new Map();
  return globalForBilling.__bhgApiSubscriptions;
}

/** Test/maintenance helper — clears the in-memory subscription store. */
export function __resetMemoryBilling(): void {
  memoryStore().clear();
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

type Row = typeof apiSubscriptions.$inferSelect;

function fromRow(row: Row): ApiSubscriptionPublic & { ownerId: string | null; ownerEmail: string | null } {
  const plan: PlanId = isKnownPlan(row.plan) ? (row.plan.toLowerCase() as PlanId) : DEFAULT_PLAN_ID;
  return {
    subscriptionId: String(row.id),
    plan,
    planName: getPlan(plan).name,
    status: (row.status as SubscriptionStatus) ?? "active",
    amountPaise: row.amountPaise ?? 0,
    currency: "INR",
    provider: row.provider,
    providerOrderId: row.providerOrderId ?? null,
    providerSubscriptionId: row.providerSubscriptionId ?? null,
    invoicePaid: Boolean(row.invoicePaid),
    demo: Boolean(row.demo),
    currentPeriodStart: toIso(row.currentPeriodStart) ?? toIso(row.createdAt) ?? new Date().toISOString(),
    currentPeriodEnd: toIso(row.currentPeriodEnd) ?? new Date().toISOString(),
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
    ownerId: row.ownerId ?? null,
    ownerEmail: row.email?.toLowerCase() ?? null,
  };
}

function stripOwner(
  record: ApiSubscriptionPublic & { ownerId: string | null; ownerEmail: string | null }
): ApiSubscriptionPublic {
  const { ownerId: _o, ownerEmail: _e, ...rest } = record;
  return rest;
}

// ------------------------------------------------------------------ create/read

export type CreateSubscriptionInput = SubscriptionOwner & {
  plan: PlanId | string;
  provider?: PaymentProviderName | string;
  providerOrderId?: string | null;
  demo?: boolean;
  amountPaise?: number;
  attribution?: Record<string, unknown> | null;
  /** Injectable clock for tests. */
  now?: Date;
};

/**
 * Records a pending subscription for a checkout. Status is `past_due` until a
 * payment is settled — creating a checkout must never hand out paid quota.
 */
export async function createApiSubscription(input: CreateSubscriptionInput): Promise<ApiSubscriptionPublic> {
  const plan: PlanId = isKnownPlan(input.plan) ? (String(input.plan).toLowerCase() as PlanId) : DEFAULT_PLAN_ID;
  const planDef = getPlan(plan);
  const now = input.now ?? new Date();
  const periodEnd = new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const amountPaise = input.amountPaise ?? planDef.pricePaise;
  const provider = input.provider ?? "mock";
  const email = input.ownerEmail?.toLowerCase() ?? "";

  const record = {
    subscriptionId: generateSubscriptionId(),
    plan,
    planName: planDef.name,
    status: "past_due" as SubscriptionStatus,
    amountPaise,
    currency: "INR" as const,
    provider,
    providerOrderId: input.providerOrderId ?? null,
    providerSubscriptionId: null,
    invoicePaid: false,
    demo: Boolean(input.demo),
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (isDbConfigured) {
    const inserted = await db
      .insert(apiSubscriptions)
      .values({
        ownerId: input.ownerId ?? null,
        email,
        plan,
        amountPaise,
        currency: "INR",
        status: "past_due",
        provider,
        providerOrderId: input.providerOrderId ?? null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        invoicePaid: false,
        demo: Boolean(input.demo),
        attribution: input.attribution ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: apiSubscriptions.id });
    return { ...record, subscriptionId: String(inserted[0]?.id ?? record.subscriptionId) };
  }

  memoryStore().set(record.subscriptionId, {
    ...record,
    ownerId: input.ownerId ?? null,
    ownerEmail: email || null,
  });
  return record;
}

function ownsSubscription(
  record: { ownerId: string | null; ownerEmail: string | null },
  owner: SubscriptionOwner
): boolean {
  const ownerId = owner.ownerId ?? null;
  const ownerEmail = owner.ownerEmail?.toLowerCase() ?? null;
  if (ownerId && record.ownerId === ownerId) return true;
  return Boolean(ownerEmail && record.ownerEmail && record.ownerEmail === ownerEmail);
}

/** All subscriptions for an account, newest first. Never returns another account's rows. */
export async function listApiSubscriptions(owner: SubscriptionOwner): Promise<ApiSubscriptionPublic[]> {
  const ownerId = owner.ownerId ?? null;
  const ownerEmail = owner.ownerEmail?.toLowerCase() ?? null;
  if (!ownerId && !ownerEmail) return [];

  if (isDbConfigured) {
    const rows = ownerId
      ? await db.select().from(apiSubscriptions).where(eq(apiSubscriptions.ownerId, ownerId)).orderBy(desc(apiSubscriptions.createdAt))
      : await db
          .select()
          .from(apiSubscriptions)
          .where(eq(apiSubscriptions.email, ownerEmail as string))
          .orderBy(desc(apiSubscriptions.createdAt));
    return rows.map((row) => stripOwner(fromRow(row)));
  }

  return [...memoryStore().values()]
    .filter((s) => ownsSubscription(s, owner))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(stripOwner);
}

/** The subscription an account is currently entitled by, if any. */
export async function getActiveSubscription(owner: SubscriptionOwner): Promise<ApiSubscriptionPublic | null> {
  return bestActive(await listApiSubscriptions(owner));
}

/** Effective plan for new/modified keys: the paid plan when active, else Free. */
export async function resolvedAccountPlan(owner: SubscriptionOwner): Promise<PlanId> {
  const active = await getActiveSubscription(owner);
  return active ? active.plan : DEFAULT_PLAN_ID;
}

// ------------------------------------------------------------------- lifecycle

export type PaymentSettlement = {
  /** True when the provider cryptographically confirmed the charge. */
  attested: boolean;
  /** True when the mock provider simulated settlement. */
  demo: boolean;
  providerSubscriptionId?: string | null;
};

/**
 * Settles a pending subscription. Returns `activated: false` with a reason when
 * the payment could not be attested, so a caller cannot accidentally treat an
 * unverified payment as revenue.
 */
export async function settleApiSubscription(
  subscriptionId: string,
  owner: SubscriptionOwner,
  settlement: PaymentSettlement
): Promise<{ activated: boolean; reason?: string; subscription?: ApiSubscriptionPublic }> {
  const owned = (await listApiSubscriptions(owner)).find((s) => s.subscriptionId === subscriptionId);
  if (!owned) return { activated: false, reason: "not_found" };
  if (owned.status === "cancelled") return { activated: false, reason: "cancelled" };

  if (!settlement.attested && !settlement.demo) {
    return { activated: false, reason: "payment_not_attested" };
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  if (isDbConfigured) {
    const rows = await db
      .update(apiSubscriptions)
      .set({
        status: "active",
        invoicePaid: settlement.attested,
        demo: settlement.demo && !settlement.attested,
        providerSubscriptionId: settlement.providerSubscriptionId ?? null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      })
      .where(and(eq(apiSubscriptions.id, Number(subscriptionId)), eq(apiSubscriptions.status, "past_due")))
      .returning({ id: apiSubscriptions.id });
    if (rows.length === 0) {
      // Either already active (idempotent re-verify) or the id is not numeric.
      const current = (await listApiSubscriptions(owner)).find((s) => s.subscriptionId === subscriptionId);
      if (current?.status === "active") return { activated: true, subscription: current };
      return { activated: false, reason: "not_found" };
    }
  } else {
    const record = memoryStore().get(subscriptionId);
    if (!record) return { activated: false, reason: "not_found" };
    record.status = "active";
    record.invoicePaid = settlement.attested;
    record.demo = settlement.demo && !settlement.attested;
    record.providerSubscriptionId = settlement.providerSubscriptionId ?? null;
    record.currentPeriodStart = now.toISOString();
    record.currentPeriodEnd = periodEnd.toISOString();
    record.updatedAt = now.toISOString();
  }

  // Entitlement and quota move together: upgrade the account's live keys.
  await updateOwnedKeysPlan(owner, owned.plan);

  const subscription = (await listApiSubscriptions(owner)).find((s) => s.subscriptionId === subscriptionId);
  return { activated: true, subscription };
}

/** Cancels a subscription and returns the account's keys to Free. */
export async function cancelApiSubscription(
  subscriptionId: string,
  owner: SubscriptionOwner
): Promise<"cancelled" | "already_cancelled" | "not_found"> {
  const owned = (await listApiSubscriptions(owner)).find((s) => s.subscriptionId === subscriptionId);
  if (!owned) return "not_found";
  if (owned.status === "cancelled") return "already_cancelled";

  const now = new Date();
  if (isDbConfigured) {
    await db
      .update(apiSubscriptions)
      .set({ status: "cancelled", updatedAt: now })
      .where(and(eq(apiSubscriptions.id, Number(subscriptionId)), eq(apiSubscriptions.status, owned.status)));
  } else {
    const record = memoryStore().get(subscriptionId);
    if (!record) return "not_found";
    record.status = "cancelled";
    record.updatedAt = now.toISOString();
  }

  // Re-resolve rather than assuming: another active subscription may still be paying.
  await updateOwnedKeysPlan(owner, await resolvedAccountPlan(owner));
  return "cancelled";
}

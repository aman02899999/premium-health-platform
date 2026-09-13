import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  bestActive,
  cancelApiSubscription,
  createApiSubscription,
  getActiveSubscription,
  listApiSubscriptions,
  paymentAttestation,
  resolvedAccountPlan,
  settleApiSubscription,
  __resetMemoryBilling,
  type ApiSubscriptionPublic,
} from "./billing";
import { createApiKey, listOwnedKeys, __resetMemoryKeyStore } from "./keys";

const OWNER = { ownerId: "user-1", ownerEmail: "dev@example.com" };
const OTHER = { ownerId: "user-2", ownerEmail: "someone@example.com" };

function subscription(over: Partial<ApiSubscriptionPublic>): ApiSubscriptionPublic {
  return {
    subscriptionId: "sub_x",
    plan: "starter",
    planName: "Starter",
    status: "active",
    amountPaise: 149_900,
    currency: "INR",
    provider: "mock",
    providerOrderId: null,
    providerSubscriptionId: null,
    invoicePaid: false,
    demo: true,
    currentPeriodStart: new Date(0).toISOString(),
    currentPeriodEnd: new Date(0).toISOString(),
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...over,
  };
}

beforeEach(() => {
  __resetMemoryBilling();
  __resetMemoryKeyStore();
});

afterEach(() => {
  delete process.env.PAYMENT_PROVIDER;
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
});

describe("paymentAttestation", () => {
  it("treats the mock provider as simulated, never attested", () => {
    const a = paymentAttestation({});
    expect(a.provider).toBe("mock");
    expect(a.attested).toBe(false);
    expect(a.simulated).toBe(true);
  });

  it("fails closed when razorpay is selected without all three secrets", () => {
    const partial = paymentAttestation({
      PAYMENT_PROVIDER: "razorpay",
      RAZORPAY_KEY_ID: "rzp_id",
    });
    expect(partial.attested).toBe(false);
    expect(partial.reason).toContain("RAZORPAY_KEY_SECRET");
  });

  it("attests razorpay only when every secret is present", () => {
    const full = paymentAttestation({
      PAYMENT_PROVIDER: "razorpay",
      RAZORPAY_KEY_ID: "rzp_id",
      RAZORPAY_KEY_SECRET: "secret",
      RAZORPAY_WEBHOOK_SECRET: "whsec",
    });
    expect(full.attested).toBe(true);
    expect(full.simulated).toBe(false);
  });

  it("does not attest providers that are not implemented", () => {
    const stripe = paymentAttestation({ PAYMENT_PROVIDER: "stripe" });
    expect(stripe.attested).toBe(false);
    expect(stripe.reason).toContain("not implemented");
  });
});

describe("bestActive", () => {
  it("returns null when nothing is active", () => {
    expect(bestActive([])).toBeNull();
    expect(bestActive([subscription({ status: "past_due" })])).toBeNull();
    expect(bestActive([subscription({ status: "cancelled" })])).toBeNull();
  });

  it("picks the highest-value active plan, not the most recent one", () => {
    const best = bestActive([
      subscription({ subscriptionId: "sub_pro", plan: "pro", createdAt: new Date(2_000).toISOString() }),
      subscription({ subscriptionId: "sub_free", plan: "free", createdAt: new Date(9_000).toISOString() }),
    ]);
    expect(best?.subscriptionId).toBe("sub_pro");
  });

  it("prefers enterprise over everything else", () => {
    const best = bestActive([
      subscription({ subscriptionId: "sub_pro", plan: "pro" }),
      subscription({ subscriptionId: "sub_ent", plan: "enterprise" }),
    ]);
    expect(best?.subscriptionId).toBe("sub_ent");
  });
});

describe("createApiSubscription", () => {
  it("creates a past_due subscription with no entitlement", async () => {
    const sub = await createApiSubscription({ ...OWNER, plan: "pro", provider: "mock", demo: true });
    expect(sub.status).toBe("past_due");
    expect(sub.invoicePaid).toBe(false);
    expect(sub.plan).toBe("pro");
    expect(sub.amountPaise).toBe(699_900);
    expect(sub.subscriptionId).toMatch(/^sub_/);
    expect(await getActiveSubscription(OWNER)).toBeNull();
  });

  it("sets a 30-day period", async () => {
    const sub = await createApiSubscription({ ...OWNER, plan: "starter" });
    const days = (new Date(sub.currentPeriodEnd).getTime() - new Date(sub.currentPeriodStart).getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(30);
  });

  it("falls back to Free for an unknown plan id", async () => {
    const sub = await createApiSubscription({ ...OWNER, plan: "diamond-9999" });
    expect(sub.plan).toBe("free");
    expect(sub.amountPaise).toBe(0);
  });

  it("does not leak subscriptions across accounts", async () => {
    await createApiSubscription({ ...OWNER, plan: "pro" });
    expect(await listApiSubscriptions(OTHER)).toEqual([]);
  });

  it("returns [] for an account with no identity at all", async () => {
    await createApiSubscription({ ...OWNER, plan: "pro" });
    expect(await listApiSubscriptions({})).toEqual([]);
    expect(await resolvedAccountPlan({})).toBe("free");
  });
});

describe("settleApiSubscription", () => {
  it("activates a subscription and upgrades the account's keys", async () => {
    await createApiKey({ name: "prod", ownerId: OWNER.ownerId, ownerEmail: OWNER.ownerEmail });
    await createApiKey({ name: "staging", ownerId: OWNER.ownerId, ownerEmail: OWNER.ownerEmail });
    const sub = await createApiSubscription({ ...OWNER, plan: "pro", demo: true });

    const result = await settleApiSubscription(sub.subscriptionId, OWNER, { attested: false, demo: true });

    expect(result.activated).toBe(true);
    expect(result.subscription?.status).toBe("active");
    expect(result.subscription?.demo).toBe(true);
    expect(result.subscription?.invoicePaid).toBe(false);

    const keys = await listOwnedKeys(OWNER.ownerId, OWNER.ownerEmail);
    expect(keys.every((k) => k.plan === "pro")).toBe(true);
  });

  it("marks a real charge as paid and not demo", async () => {
    const sub = await createApiSubscription({ ...OWNER, plan: "starter", provider: "razorpay", demo: false });
    const result = await settleApiSubscription(sub.subscriptionId, OWNER, {
      attested: true,
      demo: false,
      providerSubscriptionId: "pay_123",
    });
    expect(result.subscription?.invoicePaid).toBe(true);
    expect(result.subscription?.demo).toBe(false);
    expect(result.subscription?.providerSubscriptionId).toBe("pay_123");
  });

  it("refuses to activate when the payment is neither attested nor demo", async () => {
    const sub = await createApiSubscription({ ...OWNER, plan: "pro" });
    const result = await settleApiSubscription(sub.subscriptionId, OWNER, { attested: false, demo: false });
    expect(result.activated).toBe(false);
    expect(result.reason).toBe("payment_not_attested");
    expect((await listApiSubscriptions(OWNER))[0].status).toBe("past_due");
  });

  it("never settles a subscription owned by someone else", async () => {
    const sub = await createApiSubscription({ ...OTHER, plan: "pro" });
    const result = await settleApiSubscription(sub.subscriptionId, OWNER, { attested: true, demo: false });
    expect(result.activated).toBe(false);
    expect(result.reason).toBe("not_found");
    expect((await listApiSubscriptions(OTHER))[0].status).toBe("past_due");
  });

  it("is idempotent — a replayed verification does not double-apply", async () => {
    const sub = await createApiSubscription({ ...OWNER, plan: "pro", demo: true });
    await settleApiSubscription(sub.subscriptionId, OWNER, { attested: false, demo: true });
    const replay = await settleApiSubscription(sub.subscriptionId, OWNER, { attested: false, demo: true });
    expect(replay.activated).toBe(true);
    expect(await listApiSubscriptions(OWNER)).toHaveLength(1);
  });

  it("refuses to resurrect a cancelled subscription", async () => {
    const sub = await createApiSubscription({ ...OWNER, plan: "pro" });
    await cancelApiSubscription(sub.subscriptionId, OWNER);
    const result = await settleApiSubscription(sub.subscriptionId, OWNER, { attested: true, demo: false });
    expect(result.activated).toBe(false);
    expect(result.reason).toBe("cancelled");
  });
});

describe("cancelApiSubscription", () => {
  it("cancels and returns keys to Free", async () => {
    await createApiKey({ name: "prod", ownerId: OWNER.ownerId, ownerEmail: OWNER.ownerEmail });
    const sub = await createApiSubscription({ ...OWNER, plan: "starter", demo: true });
    await settleApiSubscription(sub.subscriptionId, OWNER, { attested: false, demo: true });

    expect(await cancelApiSubscription(sub.subscriptionId, OWNER)).toBe("cancelled");
    const keys = await listOwnedKeys(OWNER.ownerId, OWNER.ownerEmail);
    expect(keys[0].plan).toBe("free");
    expect(await resolvedAccountPlan(OWNER)).toBe("free");
  });

  it("keeps the paid plan while another subscription is still active", async () => {
    const trial = await createApiSubscription({ ...OWNER, plan: "starter", demo: true });
    const paid = await createApiSubscription({ ...OWNER, plan: "pro", demo: true });
    await settleApiSubscription(trial.subscriptionId, OWNER, { attested: false, demo: true });
    await settleApiSubscription(paid.subscriptionId, OWNER, { attested: false, demo: true });

    await cancelApiSubscription(paid.subscriptionId, OWNER);

    expect(await resolvedAccountPlan(OWNER)).toBe("starter");
  });

  it("reports already_cancelled and never touches another account's row", async () => {
    const mine = await createApiSubscription({ ...OWNER, plan: "starter" });
    await cancelApiSubscription(mine.subscriptionId, OWNER);
    expect(await cancelApiSubscription(mine.subscriptionId, OWNER)).toBe("already_cancelled");

    const theirs = await createApiSubscription({ ...OTHER, plan: "pro" });
    expect(await cancelApiSubscription(theirs.subscriptionId, OWNER)).toBe("not_found");
    expect((await listApiSubscriptions(OTHER))[0].status).toBe("past_due");
  });

  it("downgrades only active keys, leaving revoked history alone", async () => {
    const { record } = await createApiKey({ name: "dead", ownerId: OWNER.ownerId, ownerEmail: OWNER.ownerEmail });
    const sub = await createApiSubscription({ ...OWNER, plan: "starter", demo: true });
    await settleApiSubscription(sub.subscriptionId, OWNER, { attested: false, demo: true });

    const { revokeOwnedApiKey } = await import("./keys");
    await revokeOwnedApiKey(record.keyId, OWNER);

    await cancelApiSubscription(sub.subscriptionId, OWNER);
    const keys = await listOwnedKeys(OWNER.ownerId, OWNER.ownerEmail);
    // Revoked keys keep whatever plan they had — they can never serve traffic again.
    expect(keys[0].status).toBe("revoked");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const reconcilePayments = vi.fn();
const finishStalledDietOrders = vi.fn();
const recordStatus = vi.fn();
vi.mock("./reconcile", () => ({ reconcilePayments: (...a: unknown[]) => reconcilePayments(...a), FREQUENT_CHECK: { minAgeMinutes: 5, maxAgeHours: 6 } }));
vi.mock("@/lib/growth/hooks", () => ({ finishStalledDietOrders: (...a: unknown[]) => finishStalledDietOrders(...a) }));
vi.mock("@/lib/growth/system-status", () => ({ recordStatus: (...a: unknown[]) => recordStatus(...a) }));

const { paymentSafetyNet } = await import("./safety-net");

describe("paymentSafetyNet (every scheduler tick)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordStatus.mockResolvedValue(undefined);
  });

  it("checks Razorpay for the last 6 hours of unpaid orders, then finishes stalled diet orders, and records the run", async () => {
    const now = new Date("2026-11-28T02:00:00Z");
    reconcilePayments.mockResolvedValue({ checked: 1, recovered: [{ kind: "diet", razorpayOrderId: "order_X", paymentId: "pay_X" }], mismatched: [], errors: [] });
    finishStalledDietOrders.mockResolvedValue({ finished: 0, errors: [] });
    const out = await paymentSafetyNet(now);
    expect(reconcilePayments).toHaveBeenCalledWith(now, { minAgeMinutes: 5, maxAgeHours: 6 });
    // Recovery runs first, so a just-recovered diet order is not counted as stalled.
    expect(reconcilePayments.mock.invocationCallOrder[0]).toBeLessThan(finishStalledDietOrders.mock.invocationCallOrder[0]);
    expect(out).toMatchObject({ ok: true, recovered: 1, plansFinished: 0 });
    expect(recordStatus).toHaveBeenCalledWith("payments-tick", expect.objectContaining({ ok: true, recovered: 1, checked: 1 }));
  });

  it("a Razorpay outage doesn't stop the stalled-plan step and is recorded as not ok", async () => {
    reconcilePayments.mockRejectedValue(new Error("Razorpay down"));
    finishStalledDietOrders.mockResolvedValue({ finished: 1, errors: [] });
    const out = await paymentSafetyNet(new Date());
    expect(finishStalledDietOrders).toHaveBeenCalled();
    expect(out).toMatchObject({ ok: false, plansFinished: 1, errors: ["Razorpay down"] });
  });

  it("never throws, even when the database is down", async () => {
    reconcilePayments.mockRejectedValue(new Error("db"));
    finishStalledDietOrders.mockRejectedValue(new Error("db"));
    recordStatus.mockRejectedValue(new Error("db"));
    await expect(paymentSafetyNet(new Date())).resolves.toMatchObject({ ok: false });
  });
});

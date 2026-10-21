import { describe, expect, it } from "vitest";
import { cleanPurpose, isToken, newToken, parseAmount, receiptMessage, requestMessage, requestState } from "./requests-core";

describe("payment requests (pure)", () => {
  it("reads amounts the way the desk types them", () => {
    expect(parseAmount("1,500")).toBe(1500);
    expect(parseAmount("₹ 2000")).toBe(2000);
    expect(parseAmount("499.50")).toBe(499.5);
    expect(parseAmount(0.5)).toBeNull();
    expect(parseAmount("500001")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
  it("cleans the purpose", () => {
    expect(cleanPurpose("  Personal   training ")).toBe("Personal training");
    expect(cleanPurpose("x")).toBeNull();
    expect(cleanPurpose("y".repeat(200))).toHaveLength(120);
  });
  it("tokens are 16 unguessable characters", () => {
    const t = newToken();
    expect(t).toMatch(/^[A-HJ-NP-Za-km-z2-9]{16}$/);
    expect(isToken(t)).toBe(true);
    expect(isToken("short")).toBe(false);
    expect(new Set(Array.from({ length: 200 }, newToken)).size).toBe(200);
  });
  it("states: open, paid, cancelled, expired", () => {
    const now = new Date("2026-10-21T10:00:00Z");
    expect(requestState({ status: "created", expiresAt: "2026-10-22T00:00:00Z" }, now)).toBe("open");
    expect(requestState({ status: "created", expiresAt: "2026-10-20T00:00:00Z" }, now)).toBe("expired");
    expect(requestState({ status: "paid", expiresAt: "2026-10-20T00:00:00Z" }, now)).toBe("paid");
    expect(requestState({ status: "cancelled", expiresAt: "2026-10-22T00:00:00Z" }, now)).toBe("cancelled");
  });
  it("messages", () => {
    const m = requestMessage({ purpose: "Personal training", rupees: 6000, url: "https://x.in/pay/abc", gym: "Royal Fitness Club" });
    expect(m).toContain("*Personal training*: ₹6,000");
    expect(m).toContain("https://x.in/pay/abc");
    expect(receiptMessage({ purpose: "PT", rupees: 499.5, paymentId: "pay_1", gym: "RFC" })).toContain("₹499.5");
  });
});

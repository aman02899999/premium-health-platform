import { describe, expect, it } from "vitest";
import { GA_ID, gaEnabled, isPrivatePath, isValidGaId } from "./ga";

describe("GA4 setup", () => {
  it("uses a valid measurement ID", () => {
    expect(isValidGaId(GA_ID)).toBe(true);
    expect(isValidGaId("UA-123")).toBe(false);
    expect(isValidGaId(undefined)).toBe(false);
  });

  it("never counts admin or account pages", () => {
    for (const p of ["/admin", "/admin/chats", "/admin/growth", "/account", "/account/orders"]) {
      expect(isPrivatePath(p)).toBe(true);
    }
  });

  it("counts public pages, including ones that only start with the same letters", () => {
    for (const p of ["/", "/membership", "/blog/gym-fees-in-noida-membership-cost-guide", "/ig", "/administrator", "/accounts-help"]) {
      expect(isPrivatePath(p)).toBe(false);
    }
    expect(isPrivatePath(null)).toBe(false);
  });

  it("only runs on the production site", () => {
    expect(gaEnabled({ nodeEnv: "production", vercelEnv: "production" })).toBe(true);
    expect(gaEnabled({ nodeEnv: "production" })).toBe(true);
    expect(gaEnabled({ nodeEnv: "production", vercelEnv: "preview" })).toBe(false);
    expect(gaEnabled({ nodeEnv: "development" })).toBe(false);
  });
});

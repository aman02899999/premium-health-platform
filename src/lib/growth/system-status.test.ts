import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("setup checklist", () => {
  it("reports which settings exist, never their values", async () => {
    const { setupChecklist } = await import("./system-status");
    const list = setupChecklist({ CRON_SECRET: "x", RESEND_API_KEY: "re", EMAIL_FROM: "a", RAZORPAY_KEY_ID: "k", RAZORPAY_KEY_SECRET: "s", DIET_AUTO_SEND: "off" });
    const on = Object.fromEntries(list.map((x) => [x.key, x.on]));
    expect(on).toMatchObject({ CRON_SECRET: true, RESEND_API_KEY: true, RAZORPAY_KEY_ID: false, COACH_EMAIL: false, DIET_AUTO_SEND: false, WHATSAPP_TOKEN: false });
    expect(JSON.stringify(list)).not.toContain('"re"');
    expect(setupChecklist({ DIET_AUTO_SEND: "no-conditions" }).find((x) => x.key === "DIET_AUTO_SEND")!.on).toBe(true);
  });
});

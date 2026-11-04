import { beforeEach, describe, expect, it, vi } from "vitest";

const customer = vi.fn();
const configured = vi.fn(() => true);
const save = vi.fn(async () => {});
const disable = vi.fn(async () => 1);
const push = vi.fn(async () => ({ sent: 1, gone: 0, failed: 0 }));
vi.mock("server-only", () => ({}));
vi.mock("@/health/db", () => ({ isDbConfigured: true }));
vi.mock("@/lib/shop/server", () => ({ currentCustomer: () => customer() }));
vi.mock("@/lib/push/send", () => ({ pushConfigured: () => configured(), vapidPublicKey: () => (configured() ? "PUBLIC" : null), pushToMember: push }));
vi.mock("@/lib/push/store", () => ({ saveMemberSubscription: save, disableMemberSubscription: disable }));

const { GET, POST, DELETE } = await import("./route");
const test = await import("./test/route");
const req = (method: string, body: unknown) =>
  new Request("http://localhost/api/account/push", { method, body: JSON.stringify(body), headers: { "content-type": "application/json", "user-agent": "Phone" } });
const subscription = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "B" + "A".repeat(86), auth: "A".repeat(22) } };

describe("member notifications API", () => {
  beforeEach(() => {
    customer.mockReset();
    configured.mockReturnValue(true);
    save.mockClear();
    disable.mockClear();
    push.mockClear();
  });

  it("needs sign-in", async () => {
    customer.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(req("POST", { subscription }))).status).toBe(401);
    expect((await DELETE(req("DELETE", { endpoint: subscription.endpoint }))).status).toBe(401);
    expect((await test.POST()).status).toBe(401);
    expect(save).not.toHaveBeenCalled();
  });

  it("offers nothing until the keys are set", async () => {
    customer.mockResolvedValue({ email: "m@x.in" });
    configured.mockReturnValue(false);
    const res = await GET();
    expect(await res.json()).toEqual({ available: false, publicKey: null });
    expect((await POST(req("POST", { subscription }))).status).toBe(503);
  });

  it("saves this browser for the signed-in member only", async () => {
    customer.mockResolvedValue({ email: "m@x.in" });
    const res = await POST(req("POST", { subscription }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(save).toHaveBeenCalledWith("m@x.in", { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth }, "Phone");
  });

  it("refuses an endpoint that isn't a browser push service", async () => {
    customer.mockResolvedValue({ email: "m@x.in" });
    expect((await POST(req("POST", { subscription: { ...subscription, endpoint: "https://169.254.169.254/x" } }))).status).toBe(400);
    expect((await DELETE(req("DELETE", { endpoint: "https://example.com" }))).status).toBe(400);
    expect(save).not.toHaveBeenCalled();
  });

  it("turns off this browser for the member", async () => {
    customer.mockResolvedValue({ email: "m@x.in" });
    expect((await DELETE(req("DELETE", { endpoint: subscription.endpoint }))).status).toBe(200);
    expect(disable).toHaveBeenCalledWith("m@x.in", subscription.endpoint);
  });

  it("sends a test only to the member, and says so when nothing is switched on", async () => {
    customer.mockResolvedValue({ email: "t@x.in" });
    expect((await test.POST()).status).toBe(200);
    expect(push).toHaveBeenCalledWith("t@x.in", expect.objectContaining({ url: "/account" }));
    push.mockResolvedValueOnce({ sent: 0, gone: 1, failed: 0 });
    expect((await test.POST()).status).toBe(409);
    await test.POST();
    expect((await test.POST()).status).toBe(429);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { browserContext, capiPayload, hashedUser, sendCapiEvent } = await import("./meta-capi");

describe("Meta Conversions API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("hashes email and phone the way Meta normalises them, and never sends them readable", () => {
    const u = hashedUser({ email: "  Priya@Example.com ", phone: "98765 43210" });
    // sha256("priya@example.com") and sha256("919876543210")
    expect(u.em).toEqual(["6bdb7e961d54ddc243ec721e6e211ac0a179b19a9ce2ad52a418198e146e69fe"]);
    expect(u.ph).toEqual(["92b5072176e723878b5e06ff3ca61898e4eb74e8c46642a0f2db800b17364ab0"]);
    expect(u.ph![0]).toBe(hashedUser({ phone: "+91 98765-43210" }).ph![0]);
    expect(JSON.stringify(u)).not.toContain("priya");
    expect(hashedUser({ email: "not-an-email", phone: "123" })).toEqual({});
  });

  it("reads the fbp/fbc cookies, IP and user agent for matching", () => {
    const req = new Request("https://x.in/api/leads", { headers: { cookie: "a=1; _fbp=fb.1.123.456; _fbc=fb.1.123.AbC", "x-forwarded-for": "1.2.3.4, 5.6.7.8", "user-agent": "Mobile Safari" } });
    expect(browserContext(req)).toEqual({ client_ip_address: "1.2.3.4", client_user_agent: "Mobile Safari", fbp: "fb.1.123.456", fbc: "fb.1.123.AbC" });
  });

  it("builds a purchase event in rupees with the payment id as the dedupe id", () => {
    const p = capiPayload({ name: "Purchase", id: "pay_123", user: { email: "a@b.in" }, value: 1499, contentName: "Quarterly", source: "system_generated" }, new Date("2026-10-17T10:00:00Z"));
    expect(p.data[0]).toMatchObject({ event_name: "Purchase", event_id: "pay_123", event_time: 1792231200, action_source: "system_generated", custom_data: { value: 1499, currency: "INR", content_name: "Quarterly" } });
  });

  it("stays off without the pixel id and token, and posts to the pixel when set", async () => {
    const calls: { url: string; body: string; auth: string }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: { body: string; headers: Record<string, string> }) => {
      calls.push({ url, body: init.body, auth: init.headers.authorization });
      return new Response("{}", { status: 200 });
    });
    expect(await sendCapiEvent({ name: "Lead", id: "lead-12345678", user: {} })).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789");
    vi.stubEnv("META_CAPI_TOKEN", "tok");
    expect(await sendCapiEvent({ name: "Lead", id: "lead-12345678", user: { phone: "9876543210" } })).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://graph.facebook.com/v21.0/123456789/events");
    expect(calls[0].auth).toBe("Bearer tok");
    expect(JSON.parse(calls[0].body).data[0].event_name).toBe("Lead");
  });

  it("never throws when Meta is down", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789");
    vi.stubEnv("META_CAPI_TOKEN", "tok");
    vi.stubGlobal("fetch", async () => {
      throw new Error("network");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendCapiEvent({ name: "Purchase", id: "pay_1", user: {} })).toBe(false);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { createRazorpayOrder } from "./razorpay";

describe("createRazorpayOrder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  const keys = () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "s");
  };

  it("refuses less than ₹1 or a fractional amount without calling Razorpay", async () => {
    keys();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(createRazorpayOrder({ amountPaise: 99, receipt: "r" })).rejects.toThrow(/at least 100/);
    await expect(createRazorpayOrder({ amountPaise: 4900.5, receipt: "r" })).rejects.toThrow(/whole number/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("names a key problem on 401 and passes Razorpay's own message otherwise", async () => {
    keys();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { description: "Authentication failed" } }), { status: 401 })));
    await expect(createRazorpayOrder({ amountPaise: 4900, receipt: "r" })).rejects.toThrow(/rejected the API keys/);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { description: "Order amount exceeds maximum" } }), { status: 400 })));
    await expect(createRazorpayOrder({ amountPaise: 4900, receipt: "r" })).rejects.toThrow("Order amount exceeds maximum");
  });

  it("sends amount, INR and receipt with Basic auth and returns the order", async () => {
    keys();
    const fetch = vi.fn(async (_url: string, _init: RequestInit) => new Response(JSON.stringify({ id: "order_1", amount: 4900, currency: "INR", receipt: "r", status: "created" })));
    vi.stubGlobal("fetch", fetch);
    expect(await createRazorpayOrder({ amountPaise: 4900, receipt: "r" })).toMatchObject({ id: "order_1", amount: 4900, currency: "INR" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/orders$/);
    expect(JSON.parse(init.body as string)).toMatchObject({ amount: 4900, currency: "INR", receipt: "r" });
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("rzp_test_x:s").toString("base64")}`);
  });
});

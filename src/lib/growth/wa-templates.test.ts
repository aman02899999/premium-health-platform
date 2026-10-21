import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("sending a kind with its current template", () => {
  const sent: { name: string; header?: unknown }[] = [];
  let missing = new Set<string>();
  beforeEach(() => {
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "1";
    sent.length = 0;
    missing = new Set();
    vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
      const t = JSON.parse(init.body).template as { name: string; components: { type: string; parameters: unknown[] }[] };
      sent.push({ name: t.name, header: t.components.find((c) => c.type === "header")?.parameters[0] });
      if (missing.has(t.name)) return new Response(JSON.stringify({ error: { code: 132001, message: "Template name does not exist in the translation" } }), { status: 404 });
      return new Response(JSON.stringify({ messages: [{ id: "wamid.1" }] }), { status: 200 });
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends the v3 template with its banner as the image header", async () => {
    const { sendKind } = await import("./wa-templates");
    expect(await sendKind("919800000001", "offer-broadcast", "rfc_offer_broadcast_v1", ["Rahul", "RFC", "Offer", "https://x"])).toEqual({ ok: true, id: "wamid.1" });
    expect(sent).toEqual([{ name: "rfc_offer_broadcast_v3", header: { type: "image", image: { link: expect.stringMatching(/\/brand\/banners\/offer\.jpg$/) } } }]);
  });

  it("falls back to the approved legacy template, text only, until Meta approves v3", async () => {
    const { sendKind } = await import("./wa-templates");
    missing.add("rfc_renewal_7d_v3");
    const r = await sendKind("919800000001", "renew-7", "rfc_renewal_7d", ["A", "Monthly", "RFC", "1 Nov", "https://x"]);
    expect(r.ok).toBe(true);
    expect(sent.map((s) => [s.name, s.header])).toEqual([
      ["rfc_renewal_7d_v3", expect.anything()],
      ["rfc_renewal_7d", undefined],
    ]);
  });

  it("doesn't retry other errors, and leaves unknown kinds on their stored template", async () => {
    const { sendKind } = await import("./wa-templates");
    missing.add("rfc_custom");
    const r = await sendKind("919800000001", "something-else", "rfc_custom", []);
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining("#132001") });
    expect(sent.map((s) => s.name)).toEqual(["rfc_custom"]);
  });
});

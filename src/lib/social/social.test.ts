import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { applyOffer } from "@/lib/offers";
import { buildReply, detectIntent, forInstagram, shouldReply, type ReplyCtx } from "./auto-reply";
import { indianMobile, parseWebhook } from "./inbound";

vi.mock("server-only", () => ({}));

const ctx = (today: string): ReplyCtx => ({ business: DEFAULT_CONTENT.business, plans: applyOffer(DEFAULT_CONTENT.plans, today), siteUrl: "https://www.royalfitnessclub.in", name: "Rahul Kumar" });

describe("detectIntent", () => {
  it.each([
    ["Fees kitni hai?", "price"],
    ["PRICE", "price"],
    ["membership details", "price"],
    ["diet plan kitne ka hai", "diet"],
    ["weight loss membership", "price"],
    ["mujhe weight kam karna hai", "diet"],
    ["free trial", "trial"],
    ["gym ka address kya hai", "visit"],
    ["Sunday open?", "visit"],
    ["whey protein available?", "shop"],
    ["Hi", "hello"],
    ["Namaste!", "hello"],
    ["👍", "other"],
    ["", "other"],
  ])("%s → %s", (text, intent) => expect(detectIntent(text)).toBe(intent));
});

describe("buildReply", () => {
  it("quotes the festive prices while the offer runs, and the standard prices after it", () => {
    const festive = buildReply("price", ctx("2026-10-12"));
    expect(festive).toContain("• Monthly: ₹1,500 for 1 month + 5 bonus days (regular ₹2,000)");
    expect(festive).toContain("Female's Special: ₹7,000");
    expect(festive).toContain("valid until 31 Dec 2026");
    expect(festive).toContain("Couples joining together: ₹3,000 a month for two.");
    const after = buildReply("price", ctx("2027-01-01"));
    expect(after).toContain("• Monthly: ₹2,000 for 1 month");
    expect(after).not.toMatch(/Festive|Female's Special|regular/);
  });

  it("gives the address and real batch timings, and the diet plan prices from the checkout list", () => {
    const visit = buildReply("visit", ctx("2026-10-12"));
    expect(visit).toContain("Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304");
    expect(visit).toContain("• Morning: 5:30 AM – 11:00 AM (Monday – Saturday)");
    expect(visit).toContain("• Evening: 4:00 PM – 10:00 PM (Monday – Saturday)");
    const diet = buildReply("diet", ctx("2026-10-12"));
    expect(diet).toContain("• 7-Day Trial Plan: ₹49");
    expect(diet).toContain("• 3-Month Transformation: ₹2,999");
    expect(diet).toContain("https://www.royalfitnessclub.in/diet-chart#order");
  });

  it("greets by first name with a keyword menu; Instagram loses the asterisks", () => {
    const menu = buildReply("hello", ctx("2026-10-12"));
    expect(menu.startsWith("Hi Rahul! Thanks for messaging Royal Fitness Club.")).toBe(true);
    expect(forInstagram(menu)).toContain("PRICE: membership fees");
    expect(forInstagram(menu)).not.toContain("*");
  });
});

describe("shouldReply", () => {
  it("answers keywords always, opens a conversation once, and answers comments only for keywords", () => {
    expect(shouldReply("price", "message", true)).toBe(true);
    expect(shouldReply("hello", "message", false)).toBe(true);
    expect(shouldReply("hello", "message", true)).toBe(false);
    expect(shouldReply("other", "message", true)).toBe(false);
    expect(shouldReply("price", "comment", false)).toBe(true);
    expect(shouldReply("other", "comment", false)).toBe(false);
  });
});

describe("parseWebhook", () => {
  it("reads WhatsApp texts and button taps with the sender's profile name, and skips status updates", () => {
    const items = parseWebhook({
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              field: "messages",
              value: {
                contacts: [{ wa_id: "919876543210", profile: { name: "Rahul Kumar" } }],
                messages: [
                  { id: "wamid.1", from: "919876543210", type: "text", text: { body: "  Fees   kitni hai? " } },
                  { id: "wamid.2", from: "919876543210", type: "button", button: { text: "PRICE" } },
                ],
                statuses: [{ id: "wamid.0", status: "delivered" }],
              },
            },
          ],
        },
      ],
    });
    expect(items).toEqual([
      { id: "wa:wamid.1", channel: "whatsapp", kind: "message", from: "919876543210", fromName: "Rahul Kumar", text: "Fees kitni hai?" },
      { id: "wa:wamid.2", channel: "whatsapp", kind: "message", from: "919876543210", fromName: "Rahul Kumar", text: "PRICE" },
    ]);
  });

  it("reads Instagram DMs and comments, and never our own echoes or comments", () => {
    const items = parseWebhook({
      object: "instagram",
      entry: [
        {
          id: "17841400000",
          messaging: [
            { sender: { id: "555" }, message: { mid: "m1", text: "price?" } },
            { sender: { id: "17841400000" }, message: { mid: "m2", text: "our reply", is_echo: true } },
          ],
          changes: [
            { field: "comments", value: { id: "c1", text: "PRICE", from: { id: "777", username: "fit_priya" } } },
            { field: "comments", value: { id: "c2", text: "thanks!", from: { id: "17841400000", username: "royalfitness93_" } } },
          ],
        },
      ],
    });
    expect(items.map((i) => [i.id, i.kind, i.from])).toEqual([
      ["ig:m1", "message", "555"],
      ["igc:c1", "comment", "777"],
    ]);
  });

  it("reads Facebook Messenger messages and new Page comments, never the Page's own", () => {
    const items = parseWebhook({
      object: "page",
      entry: [
        {
          id: "PAGE1",
          messaging: [
            { sender: { id: "u1" }, message: { mid: "fm1", text: "timing?" } },
            { sender: { id: "PAGE1" }, message: { mid: "fm2", text: "reply", is_echo: true } },
          ],
          changes: [
            { field: "feed", value: { item: "comment", verb: "add", comment_id: "c9", message: "PRICE", from: { id: "u2", name: "Ravi K" } } },
            { field: "feed", value: { item: "comment", verb: "edited", comment_id: "c10", message: "x", from: { id: "u3" } } },
            { field: "feed", value: { item: "comment", verb: "add", comment_id: "c11", message: "thanks", from: { id: "PAGE1" } } },
          ],
        },
      ],
    });
    expect(items.map((i) => [i.id, i.channel, i.kind, i.from])).toEqual([
      ["fb:fm1", "facebook", "message", "u1"],
      ["fbc:c9", "facebook", "comment", "u2"],
    ]);
  });

  it("keeps only Indian mobiles for leads", () => {
    expect(indianMobile("919876543210")).toBe("9876543210");
    expect(indianMobile("14155550123")).toBeNull();
  });
});

describe("verifyMetaSignature", () => {
  it("accepts the Meta or Instagram app secret and refuses when no secret is set", async () => {
    const { verifyMetaSignature } = await import("./meta");
    const raw = '{"object":"instagram"}';
    const sig = (s: string) => `sha256=${createHmac("sha256", s).update(raw).digest("hex")}`;
    delete process.env.META_APP_SECRET;
    delete process.env.INSTAGRAM_APP_SECRET;
    expect(verifyMetaSignature(raw, sig("x"))).toBe(false);
    process.env.META_APP_SECRET = "meta-secret";
    process.env.INSTAGRAM_APP_SECRET = "ig-secret";
    expect(verifyMetaSignature(raw, sig("meta-secret"))).toBe(true);
    expect(verifyMetaSignature(raw, sig("ig-secret"))).toBe(true);
    expect(verifyMetaSignature(raw, sig("wrong"))).toBe(false);
    expect(verifyMetaSignature(raw, null)).toBe(false);
    delete process.env.META_APP_SECRET;
    delete process.env.INSTAGRAM_APP_SECRET;
  });
});

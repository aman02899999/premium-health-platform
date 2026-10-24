import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { applyOffer, OFFERS } from "@/lib/offers";
import { MAX_KNOWLEDGE, buildKnowledge, cleanSettings, conversationPrompt, costUsd, parseAnswer, systemPrompt, withLiveLine, worthAnswering } from "./agent-core";

describe("settings", () => {
  it("defaults to off with the most capable model", () => {
    expect(cleanSettings(null)).toEqual({ mode: "off", model: "claude-opus-5-5", dailyCap: 100, knowledge: "" });
  });
  it("keeps valid values and replaces invalid ones", () => {
    expect(cleanSettings({ mode: "auto", model: "claude-haiku-5-5", dailyCap: "40", knowledge: "  Parking free.\r\n" })).toEqual({ mode: "auto", model: "claude-haiku-5-5", dailyCap: 40, knowledge: "Parking free." });
    expect(cleanSettings({ mode: "always", model: "gpt-5", dailyCap: -3 })).toMatchObject({ mode: "off", model: "claude-opus-5-5", dailyCap: 100 });
    expect(cleanSettings({ dailyCap: 99999 }).dailyCap).toBe(1000);
    expect(cleanSettings({ knowledge: "x".repeat(MAX_KNOWLEDGE + 50) }).knowledge).toHaveLength(MAX_KNOWLEDGE);
  });
});

describe("what is worth an AI answer", () => {
  it.each(["Is there bike parking?", "kya ladies ke liye alag batch hai", "Do you have steam bath", "can i bring my own shaker"])("answers %s", (t) => expect(worthAnswering(t)).toBe(true));
  it.each(["ok", "Ok thanks", "thank you 🙏", "👍", "theek hai", "hmm", "", "  ", "12345", "ji"])("leaves %j alone", (t) => expect(worthAnswering(t)).toBe(false));
});

describe("knowledge", () => {
  const plans = applyOffer(DEFAULT_CONTENT.plans, "2026-10-21", OFFERS);
  const k = buildKnowledge(DEFAULT_CONTENT, plans, "https://www.royalfitnesclub.in", "Bike parking is free.");
  it("carries today's prices, timings, diet plans, FAQs and the desk's notes", () => {
    const paid = plans.find((p) => p.price > 0)!;
    expect(k).toContain(`₹${paid.price.toLocaleString("en-IN")}`);
    expect(k).toContain("7-Day Trial Plan: ₹49");
    expect(k).toContain(DEFAULT_CONTENT.faqs[0].q);
    expect(k).toContain("Notes from the gym's desk");
    expect(k).toContain("Bike parking is free.");
    expect(k).toContain(DEFAULT_CONTENT.business.phone);
  });
  it("leaves out the notes section when there are none", () => {
    expect(buildKnowledge(DEFAULT_CONTENT, plans, "https://x.in", "  ")).not.toContain("Notes from the gym's desk");
  });
  it("instructs hand-offs, no medical advice and the coach's number", () => {
    const s = systemPrompt("Royal Fitness Club", "+91 88518 30081");
    expect(s).toMatch(/handoff to true/);
    expect(s).toMatch(/no medical advice/);
    expect(s).toContain("+91 88518 30081");
  });
});

describe("the agent's answer", () => {
  it("accepts the structured answer", () => {
    expect(parseAnswer(JSON.stringify({ reply: " Yes, free parking.\n\n\n\nSee you! ", handoff: false, reason: "" }))).toEqual({ reply: "Yes, free parking.\n\nSee you!", handoff: false, reason: "" });
  });
  it("rejects anything unusable", () => {
    expect(parseAnswer("Sure! Parking is free.")).toBeNull();
    expect(parseAnswer(JSON.stringify({ reply: "", handoff: false, reason: "" }))).toBeNull();
    expect(parseAnswer(JSON.stringify({ reply: "x", handoff: "no" }))).toBeNull();
    expect(parseAnswer(JSON.stringify({ reply: "x".repeat(1300), handoff: false, reason: "" }))).toBeNull();
  });
  it("adds the coach's number to a hand-off that doesn't have it", () => {
    expect(withLiveLine("A coach will reply soon.", "+91 88518 30081", true)).toBe("A coach will reply soon.\n\n📞 Call / WhatsApp a coach: +91 88518 30081");
    expect(withLiveLine("Call us on 88518 30081.", "+91 88518 30081", true)).toBe("Call us on 88518 30081.");
    expect(withLiveLine("Parking is free.", "+91 88518 30081", false)).toBe("Parking is free.");
  });
});

describe("conversation", () => {
  it("labels who said what, oldest first, and ends with the question", () => {
    const p = conversationPrompt(
      [
        { fromThem: true, body: "Hi" },
        { fromThem: false, body: "Hi! Reply PRICE…", by: "auto-reply" },
        { fromThem: false, body: "Hello Rahul", by: "coach@gym.in" },
      ],
      "Parking hai?",
      "Rahul",
    );
    expect(p).toContain("Customer's WhatsApp name: Rahul");
    expect(p).toContain("Customer: Hi\nGym (automatic): Hi! Reply PRICE…\nGym: Hello Rahul");
    expect(p.trim().endsWith("Message to answer:\nParking hai?")).toBe(true);
  });
  it("keeps only the last 12 messages", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({ fromThem: true, body: `m${i}` }));
    const p = conversationPrompt(history, "q", "");
    expect(p).not.toContain("Customer: m7\n");
    expect(p).toContain("Customer: m8\n");
  });
});

it("prices an answer", () => {
  expect(costUsd("claude-opus-5-5", { input: 1_000_000, cached: 0, output: 0 })).toBe(4);
  expect(costUsd("claude-haiku-5-5", { input: 0, cached: 0, output: 1_000_000 })).toBe(0.5);
  expect(costUsd("unknown", { input: 0, cached: 1_000_000, output: 0 })).toBe(0.2);
});

import { describe, expect, it } from "vitest";
import { fitnessTrends, isTrustedSource, parseTrends, trendKey } from "./trends";
import { answerShort, checkAnswerDraft } from "./queue-core";
import { shortDescription, shortScenes } from "./shorts-core";

const item = (title: string, traffic: string, news: string[] = []) =>
  `<item><title>${title}</title><ht:approx_traffic>${traffic}</ht:approx_traffic>${news.map((n) => `<ht:news_item><ht:news_item_title>${n}</ht:news_item_title><ht:news_item_url>https://news.example/${encodeURIComponent(n)}</ht:news_item_url><ht:news_item_source>Example</ht:news_item_source></ht:news_item>`).join("")}</item>`;
const FEED = `<rss><channel>${item("mcc neet pg counselling 2026", "2000+", ["NEET PG result"])}${item("ind vs aus", "50000+", ["Fitness test for players"])}${item("chia seeds water", "5000+", ["Chia seed water trend &amp; weight loss"])}${item("75 hard challenge", "10000+")}${item("ozempic india launch", "20000+", ["Weight loss injection launched"])}</channel></rss>`;

describe("trends", () => {
  it("parses the feed and keeps only fitness and diet trends, biggest first", () => {
    const all = parseTrends(FEED);
    expect(all).toHaveLength(5);
    expect(all[2].news[0].title).toBe("Chia seed water trend & weight loss");
    expect(fitnessTrends(all).map((t) => t.title)).toEqual(["75 hard challenge", "chia seeds water"]);
  });
  it("never turns exams or cricket into a Short", () => {
    expect(fitnessTrends(parseTrends(FEED)).map((t) => t.title)).not.toContain("ind vs aus");
  });
  it("keys a trend the same way every day", () => {
    expect(trendKey("Chia Seeds  Water!")).toBe("chia-seeds-water");
  });
  it("trusts only health bodies as sources", () => {
    expect(isTrustedSource("https://www.who.int/news-room/fact-sheets/detail/healthy-diet")).toBe(true);
    expect(isTrustedSource("https://www.nhs.uk/live-well/")).toBe(true);
    expect(isTrustedSource("https://who.int.evil.com/x")).toBe(false);
    expect(isTrustedSource("http://www.who.int/x")).toBe(false);
    expect(isTrustedSource("https://randomblog.com/who.int")).toBe(false);
  });
});

describe("a trend fact-check Short", () => {
  const raw = {
    hook: "Chia seed paani se pet kam?",
    question: "Chia seeds ka paani subah piyo, pet ki charbi chali jayegi.",
    answer: "Koi ek drink pet ki charbi nahi ghatata.",
    why: "Chia mein fibre hai jo pet bhara rakhta hai. Fat loss poore din ke khane se hota hai.",
    tips: ["Chia ko dahi ya oats mein daalo.", "Roz 30 minute walk karo."],
    ask: "Tumne chia seeds try kiye hain?",
    topic: "chia seeds",
    tags: ["chia seeds", "belly fat", "weight loss myths"],
    medical: false,
    verdict: "JHOOTH",
    source: { name: "WHO, Healthy diet fact sheet", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" },
  };
  it("needs a verdict and a trusted source", () => {
    expect(checkAnswerDraft(raw, "trend").ok).toBe(true);
    expect(checkAnswerDraft({ ...raw, source: { name: "Blog", url: "https://blog.example/chia" } }, "trend").ok).toBe(false);
    expect(checkAnswerDraft({ ...raw, verdict: "MAYBE" }, "trend").ok).toBe(false);
  });
  it("plays as a viral-claim Short and names its source in the description", () => {
    const c = checkAnswerDraft(raw, "trend");
    if (!c.ok) throw new Error("fixture");
    const s = answerShort("abcdef12-0000-0000-0000-000000000000", c.draft);
    expect(s.format).toBe("viral");
    expect(shortScenes(s).some((t) => t.scene.kind === "verdict")).toBe(true);
    const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.example.in", coach: "Coach Aman Sharma", address: "" };
    expect(shortDescription(s, biz)).toContain("Source: WHO, Healthy diet fact sheet, https://www.who.int/");
  });
});

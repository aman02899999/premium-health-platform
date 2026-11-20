import { describe, expect, it } from "vitest";
import { answerReply, answerShort, checkAnswerDraft, isAnswerDay, isUsableQuestion, pickQuestion, type Comment } from "./queue-core";
import { musicPlan, planKey } from "./music";

// The same "own track" test the Reels use: style, key, progression, tempo, pattern and melody seed.
const track = (i: number) => { const p = musicPlan(i); return `${planKey(p)}:${p.bpm}:${p.arp.join("")}:${p.seed}`; };
import { SHORTS } from "./shorts-bank";
import { shortDescription, shortScenes, shortSeconds, shortTags, shortTitle, MIN_SECONDS } from "./shorts-core";
import { QUEUE_INDEX_BASE } from "./queue-core";

const OWN = "UC_own";
const c = (id: string, text: string, likes = 0, replies = 0, publishedAt = "2026-11-15T10:00:00Z", author = "UC_viewer"): Comment => ({ id, videoId: "v1", text, likes, replies, publishedAt, authorChannelId: author });
const now = new Date("2026-11-22T04:00:00Z");

const GOOD = {
  hook: "Roti raat ko khana chhod du?",
  question: "Weight loss ke liye raat ko roti band kar du kya?",
  answer: "Band karne ki zaroorat nahi. Poore din ki calories matter karti hain, time nahi.",
  why: "Raat ko 1–2 roti sabzi-dal ke saath theek hai. Problem late-night snacking hai.",
  tips: ["Dinner mein aadhi plate sabzi rakho.", "Dinner sone se 2 ghante pehle khatam karo."],
  ask: "Tum dinner kitne baje karte ho?",
  topic: "dinner and roti",
  tags: ["roti at night", "weight loss", "dinner tips"],
  medical: false,
  skip: "",
};

describe("picking the viewer's question", () => {
  it("takes real questions only", () => {
    expect(isUsableQuestion(c("a", "Raat ko roti khana chahiye ya nahi?"), OWN)).toBe(true);
    expect(isUsableQuestion(c("b", "Nice video bhai"), OWN)).toBe(false);
    expect(isUsableQuestion(c("c", "Kya creatine safe hai? DM me on 9876543210"), OWN)).toBe(false);
    expect(isUsableQuestion(c("d", "Kitne mg creatine lena chahiye?"), OWN)).toBe(false);
    expect(isUsableQuestion(c("e", "Meri report mein sugar high hai kya karu?"), OWN)).toBe(false);
    expect(isUsableQuestion(c("f", "Ye video kaise banaya bc?"), OWN)).toBe(false);
    expect(isUsableQuestion(c("g", "Kya roz pushups kar sakte hain?", 0, 0, "", OWN), OWN)).toBe(false);
  });

  it("prefers the most liked and replied, skipping ones already used", () => {
    const list = [c("x", "Kya roz pushups kar sakte hain?", 2), c("y", "Ghee khana chahiye ya nahi?", 10, 3), c("z", "Walk subah karu ya shaam ko?", 5)];
    expect(pickQuestion(list, OWN, new Set(), now)?.id).toBe("y");
    expect(pickQuestion(list, OWN, new Set(["y"]), now)?.id).toBe("z");
    expect(pickQuestion([c("n", "Nice")], OWN, new Set(), now)).toBeNull();
  });
});

describe("checking a draft", () => {
  it("accepts a clean draft and trims it", () => {
    const r = checkAnswerDraft({ ...GOOD, hook: `  ${GOOD.hook}  ` });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.draft.hook).toBe(GOOD.hook);
  });
  it("blocks cures, guarantees, doses and quick-fix promises", () => {
    for (const bad of ["Ye diabetes cure karta hai.", "Result guaranteed hai.", "Roz 500 mg lo.", "5 kg in 7 days pakka.", "Steroid se fast hoga."]) {
      const r = checkAnswerDraft({ ...GOOD, answer: bad.padEnd(12, ".") });
      expect(r.ok, bad).toBe(false);
    }
  });
  it("lists what is missing", () => {
    const r = checkAnswerDraft({ hook: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/hook[\s\S]*question/);
  });
});

describe("an answer Short", () => {
  const d = checkAnswerDraft(GOOD);
  if (!d.ok) throw new Error("fixture");
  const s = answerShort("1234abcd-0000-0000-0000-000000000000", d.draft);
  const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.example.in", coach: "Coach Aman Sharma", address: "Sector 93, Noida" };

  it("renders like a bank Short, at least the minimum length, with tags and a title", () => {
    expect(s.id).toBe("q-1234abcd");
    expect(SHORTS.some((b) => b.id === s.id)).toBe(false);
    const timed = shortScenes(s);
    expect(timed[1].scene).toMatchObject({ kind: "card", label: "AAPKA SAWAAL" });
    expect(shortSeconds(timed)).toBeGreaterThanOrEqual(MIN_SECONDS - 0.5);
    expect(shortTitle(s)).toMatch(/#shorts$/);
    expect(shortTags(s)).toContain("roti at night");
    expect(shortDescription(s, biz)).toContain("Sawaal:");
  });

  it("gets music no bank Short uses", () => {
    const bank = new Set(SHORTS.map((_, i) => track(i)));
    expect(bank.has(track(QUEUE_INDEX_BASE + 1))).toBe(false);
  });

  it("thanks the viewer with the link", () => {
    expect(answerReply("https://youtube.com/shorts/abc")).toContain("https://youtube.com/shorts/abc");
  });
});

it("drafts on Sundays in India", () => {
  expect(isAnswerDay(new Date("2026-11-22T04:00:00Z"))).toBe(true); // Sun 09:30 IST
  expect(isAnswerDay(new Date("2026-11-21T19:00:00Z"))).toBe(true); // Sun 00:30 IST
  expect(isAnswerDay(new Date("2026-11-21T10:00:00Z"))).toBe(false);
});

it("posts clean drafts by itself unless switched off (owner's choice, 17 Nov 2026)", async () => {
  const { queueAutoApprove } = await import("./queue-core");
  expect(queueAutoApprove({})).toBe(true);
  expect(queueAutoApprove({ YOUTUBE_QUEUE_AUTO: "off" })).toBe(false);
});

describe("geminiQueueAuto", () => {
  it("holds Gemini drafts for the owner unless GEMINI_QUEUE_AUTO=on", async () => {
    const { geminiQueueAuto } = await import("./queue-core");
    expect(geminiQueueAuto({})).toBe(false);
    expect(geminiQueueAuto({ GEMINI_QUEUE_AUTO: "off" })).toBe(false);
    expect(geminiQueueAuto({ GEMINI_QUEUE_AUTO: "on" })).toBe(true);
  });
});

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FESTIVE_2026 } from "@/lib/offers";
import { SPECIAL_POSTS, SPECIAL_REELS, specialFeedPost, specialReel, specialStory } from "./special-days";

describe("special-day posts", () => {
  it("Diwali replaces only the morning card and the Story on 8 Nov 2026", () => {
    expect(specialFeedPost("2026-11-08", "am")?.id).toBe("diwali-2026");
    expect(specialFeedPost("2026-11-08", "pm")).toBeNull();
    expect(specialFeedPost("2026-11-07", "am")).toBeNull();
    expect(specialFeedPost("2026-11-09", "am")).toBeNull();
    expect(specialStory("2026-11-08")?.id).toBe("diwali-2026");
    expect(specialStory("2026-11-09")).toBeNull();
  });

  it("every image and video exists in public/", () => {
    for (const p of SPECIAL_POSTS) {
      for (const f of [p.feedImage, p.storyImage].filter(Boolean) as string[]) expect(existsSync(join(process.cwd(), "public", f)), f).toBe(true);
      expect(p.feedImage || p.storyImage, p.id).toBeTruthy();
      if (p.feedImage) expect(p.slot, p.id).toBeTruthy();
    }
    for (const r of SPECIAL_REELS) expect(existsSync(join(process.cwd(), "public", r.video)), r.video).toBe(true);
  });

  it("every Reel video ships in the server image (.dockerignore drops public/youtube, so Instagram would get a 404)", () => {
    const ignored = readFileSync(join(process.cwd(), ".dockerignore"), "utf8").split("\n").map((l) => l.trim()).filter((l) => l.startsWith("public/"));
    for (const r of SPECIAL_REELS) for (const dir of ignored) expect(`public${r.video}`.startsWith(dir), r.video).toBe(false);
  });

  it("myth Stories replace the sales Story on their days only; a Story-only post never takes a feed slot", () => {
    expect(specialStory("2026-11-10")?.id).toBe("myth-story-1");
    expect(specialStory("2026-11-16")?.id).toBe("myth-story-4");
    expect(specialStory("2026-11-12")).toBeNull();
    expect(specialFeedPost("2026-11-10", "am")).toBeNull();
    expect(specialFeedPost("2026-11-10", "pm")).toBeNull();
  });

  it("the YouTube channel promo is the 19 Nov Story only, with no feed post", () => {
    expect(specialStory("2026-11-19")?.id).toBe("youtube-promo-story");
    expect(specialStory("2026-11-20")).toBeNull();
    expect(specialFeedPost("2026-11-19", "am")).toBeNull();
    expect(specialFeedPost("2026-11-19", "pm")).toBeNull();
  });

  it("tips Reels take the midday Reel on their days only, at most one a day", () => {
    expect(specialReel("2026-11-10")?.id).toBe("reel-fat-loss-myths");
    expect(specialReel("2026-11-17")?.id).toBe("reel-muscle-basics");
    expect(specialReel("2026-11-11")).toBeNull();
    const keys = SPECIAL_REELS.map((r) => `${r.date}-${r.slot ?? "midday"}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("Coach Rubi Reels: gym at midday, diet trial in the evening on 20 Nov, both with a Collab invite to Rubi", () => {
    const gym = specialReel("2026-11-20", "midday");
    const diet = specialReel("2026-11-20", "evening");
    expect(gym?.id).toBe("reel-coach-rubi-gym");
    expect(diet?.id).toBe("reel-coach-rubi-diet-trial");
    expect(specialReel("2026-11-21", "evening")).toBeNull();
    expect(specialReel("2026-11-17", "evening")).toBeNull(); // older tips Reels stay on midday
    for (const r of [gym!, diet!]) expect(r.collaborators).toEqual(["__rubi_i_love_u"]);
    // Prices as in offers.ts / DIET_PLANS; the two ₹49 offers stay apart.
    expect(gym!.instagram).toContain("Female's Special: ₹7,000 mein 6 months");
    expect(gym!.instagram).toContain("Monthly ₹2,000 ➝ ₹1,500");
    expect(gym!.instagram).not.toContain("₹49");
    expect(diet!.instagram).toContain("7-Day Trial Plan, sirf ₹49");
    expect(diet!.instagram).toContain("1-month plan nahi");
    expect(diet!.facebook).toContain("/diet-chart?plan=trial&");
    expect(diet!.facebook).not.toContain("/diet-trial");
    for (const c of [gym!.facebook, diet!.facebook]) expect(c).not.toContain("@__rubi");
  });

  it("tips Reels follow the health rules (promo Reels carry no health facts): sources, an education note, no cure or guarantee words", () => {
    for (const r of SPECIAL_REELS.filter((x) => x.kind !== "promo")) {
      for (const c of [r.instagram, r.facebook]) {
        expect(c, r.id).toMatch(/Sources?:/);
        expect(c, r.id).toContain("medical advice nahi");
        expect(c, r.id).not.toMatch(/guarantee|cure|100%|detox/i);
      }
    }
  });

  it("captions follow the house rules: the right number, no links on Instagram, no fake urgency", () => {
    for (const p of [...SPECIAL_POSTS.filter((x) => x.feedImage), ...SPECIAL_REELS]) {
      for (const c of [p.instagram, p.facebook]) {
        expect(c).toContain("88518 30081");
        expect(c).not.toContain("92668");
        expect(c).not.toMatch(/limited (seats|slots)|only \d+ (left|spots)|hurry|last chance/i);
        expect(c.length).toBeLessThanOrEqual(2200); // Instagram's caption limit
      }
      expect(p.instagram).not.toMatch(/https?:\/\//);
      expect(p.facebook).toMatch(/https:\/\/www\.royalfitnesclub\.in\/.*utm_campaign=/);
    }
  });

  it("Diwali prices match the festive offer", () => {
    const d = SPECIAL_POSTS.find((p) => p.id === "diwali-2026")!;
    const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    for (const [id, o] of Object.entries(FESTIVE_2026.plans)) {
      expect(d.instagram, id).toContain(inr(o.price));
    }
    expect(d.instagram).toContain("Monthly ₹1,500 + 5 bonus days");
    expect(d.instagram).toContain("Annual ₹14,000 = 14 months");
    expect(d.instagram).toContain("Female's Special ₹7,000");
    expect(d.date >= FESTIVE_2026.startsOn && d.date <= FESTIVE_2026.endsOn).toBe(true);
  });

  it("coach posts take the 4 PM card and the Story on their days, and quote the real festive prices", () => {
    expect(specialFeedPost("2026-11-18", "pm")?.id).toBe("coach-meet");
    expect(specialFeedPost("2026-11-18", "am")).toBeNull();
    expect(specialStory("2026-11-21")?.id).toBe("coach-offer");
    expect(specialFeedPost("2026-11-24", "pm")?.id).toBe("coach-trial");
    const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    const offer = SPECIAL_POSTS.find((p) => p.id === "coach-offer")!;
    for (const [id, o] of Object.entries(FESTIVE_2026.plans)) expect(offer.instagram, id).toContain(inr(o.price));
    // Struck-through prices must be the real standard prices.
    for (const [id, std] of [["monthly", 2000], ["quarterly", 5000], ["half-yearly", 8000]] as const) {
      expect(offer.instagram, id).toContain(`${inr(std)} ➝ ${inr(FESTIVE_2026.plans[id].price)}`);
    }
    for (const p of SPECIAL_POSTS.filter((x) => x.id.startsWith("coach-"))) {
      expect(p.date >= FESTIVE_2026.startsOn && p.date <= FESTIVE_2026.endsOn, p.id).toBe(true);
      expect(p.instagram, p.id).not.toMatch(/\bbest\b|bonus days/i);
    }
    const days = SPECIAL_POSTS.filter((x) => x.feedImage).map((x) => `${x.date}-${x.slot}`);
    expect(new Set(days).size).toBe(days.length);
  });

  it("at most one special Story a day, so none is silently dropped", () => {
    const days = SPECIAL_POSTS.filter((x) => x.storyImage).map((x) => x.date);
    expect(new Set(days).size).toBe(days.length);
  });

  it("banner posts take the 4 PM card and the Story on their days, with real prices and the right ₹49 offer", () => {
    expect(specialFeedPost("2026-11-22", "pm")?.id).toBe("banner-diet-trial");
    expect(specialStory("2026-11-22")?.id).toBe("banner-diet-trial");
    expect(specialFeedPost("2026-11-23", "pm")?.id).toBe("banner-join-online");
    expect(specialStory("2026-11-27")?.id).toBe("banner-gym-festive");
    expect(specialFeedPost("2026-11-22", "am")).toBeNull();
    const trial = SPECIAL_POSTS.find((p) => p.id === "banner-diet-trial")!;
    expect(trial.instagram).toContain("₹49");
    expect(trial.instagram).toContain("7 din");
    expect(trial.instagram).not.toMatch(/1-month|₹1,999/); // the joining perk is a different offer
    expect(trial.facebook).toContain("/diet-chart?plan=trial&utm_source=facebook");
    const gym = SPECIAL_POSTS.find((p) => p.id === "banner-gym-festive")!;
    const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    for (const [id, o] of Object.entries(FESTIVE_2026.plans)) expect(gym.instagram, id).toContain(inr(o.price));
    for (const [id, std] of [["monthly", 2000], ["quarterly", 5000], ["half-yearly", 8000]] as const) {
      expect(gym.instagram, id).toContain(`${inr(std)} ➝ ${inr(FESTIVE_2026.plans[id].price)}`);
    }
    expect(gym.instagram).toContain("303+ ratings on Justdial");
    expect(gym.instagram).not.toMatch(/member reviews/i);
    for (const p of SPECIAL_POSTS.filter((x) => x.id.startsWith("banner-"))) {
      expect(p.date >= FESTIVE_2026.startsOn && p.date <= FESTIVE_2026.endsOn, p.id).toBe(true);
    }
  });

  it("Lab Ke Andar EP 1 takes the evening Reel on 27 Nov only, and the midday Reel stays as planned", () => {
    expect(specialReel("2026-11-27", "evening")?.id).toBe("reel-lab-khoon-ka-safar");
    expect(specialReel("2026-11-27", "midday")?.id).not.toBe("reel-lab-khoon-ka-safar");
    expect(specialReel("2026-11-28", "evening")).toBeNull();
  });
});

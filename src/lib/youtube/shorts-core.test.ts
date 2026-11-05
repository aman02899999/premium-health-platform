import { describe, expect, it } from "vitest";
import { SHORTS } from "./shorts-bank";
import { EXTRAS } from "./shorts-extra";
import { FADE, MAX_SECONDS, MEDICAL_LINE, DOCTOR_LINE, captionOf, chunks, nextShort, shortDescription, shortScenes, shortSeconds, shortTags, shortTitle } from "./shorts-core";

const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.example.in", coach: "Coach Aman Sharma", address: "Gejha Village, Sector 93, Noida" };

describe("shorts bank", () => {
  it("has enough different scripts for a month of 3 a day, each id unique", () => {
    expect(SHORTS.length).toBeGreaterThanOrEqual(87);
    expect(new Set(SHORTS.map((s) => s.id)).size).toBe(SHORTS.length);
    expect(new Set(SHORTS.map((s) => s.hook.toLowerCase())).size).toBe(SHORTS.length);
  });

  it("formats take turns, so the three Shorts of a day are never the same kind of video", () => {
    for (let i = 0; i + 2 < SHORTS.length; i += 3) {
      const day = SHORTS.slice(i, i + 3).map((s) => s.format);
      expect(new Set(day).size).toBe(3);
    }
  });

  it("every script has two coach's tips and a comment question, and no tips are orphaned", () => {
    for (const s of SHORTS) {
      const x = EXTRAS[s.id];
      expect(x, s.id).toBeTruthy();
      expect(x.tips.every((t) => t.length >= 15 && t.length <= 90)).toBe(true);
      expect(x.ask.endsWith("?") || x.ask.endsWith(".")).toBe(true);
    }
    expect(Object.keys(EXTRAS).sort()).toEqual(SHORTS.map((s) => s.id).sort());
    const all = Object.values(EXTRAS).map((x) => JSON.stringify(x).toLowerCase()).join(" ");
    expect(all).not.toMatch(/\bcures?\b|guarantee|\bmg\b|tablet|capsule/);
  });

  it("never claims a cure or gives a dose, and every fact Short names its source", () => {
    for (const s of SHORTS) {
      const text = JSON.stringify(s).toLowerCase();
      expect(text).not.toMatch(/\bcures?\b|guarantee|\bmg\b|tablet|capsule|steroid cycle|lose \d+ ?kg/);
      if (s.format === "fact") expect(s.source.url).toMatch(/^https:\/\//);
    }
  });
});

describe("short scenes", () => {
  it("every Short opens on the hook, ends on the follow screen and runs at least a minute (the owner's rule) and at most 90 seconds", () => {
    for (const s of SHORTS) {
      const timed = shortScenes(s);
      expect(timed[0].scene).toMatchObject({ kind: "hook", text: s.hook });
      expect(timed.at(-1)!.scene.kind).toBe("end");
      const total = shortSeconds(timed);
      expect(total, s.id).toBeGreaterThanOrEqual(60);
      expect(total, s.id).toBeLessThanOrEqual(MAX_SECONDS);
      for (const t of timed) {
        expect(t.steps.length).toBe(t.chunks.length);
        // The hold after the last word is long enough to read, and longer than the transition.
        expect(t.steps.at(-1)!).toBeGreaterThan(FADE * 3);
        expect(t.steps.every((x) => x > 0 || t.steps.length === 1)).toBe(true);
      }
    }
  });

  it("the pop-in pieces rebuild the caption exactly", () => {
    for (const s of SHORTS)
      for (const t of shortScenes(s)) {
        if (t.scene.kind === "plan" || t.scene.kind === "gym") continue;
        expect(t.chunks.join(" ")).toBe(captionOf(t.scene).split(/\s+/).filter(Boolean).join(" "));
        expect(t.chunks.every((c) => c.split(" ").length <= 3)).toBe(true);
      }
    expect(chunks("Push the floor away")).toEqual(["Push the floor", "away"]);
  });

  it("after the main idea: two tips, a recap, the gym's real details and a question for the comments", () => {
    for (const s of SHORTS) {
      const kinds = shortScenes(s).map((t) => t.scene.kind);
      expect(kinds.slice(-6)).toEqual(["card", "card", "plan", "gym", "ask", "end"]);
    }
    const gym = shortScenes(SHORTS[0]).find((t) => t.scene.kind === "gym")!.scene;
    expect(gym.kind === "gym" && gym.lines.join(" ")).toMatch(/Sector 93 Noida.*since 2019.*5:30–11 AM & 4–10 PM/);
  });

  it("the medical line is on the last screen, with the doctor line for health topics", () => {
    for (const s of SHORTS) {
      const end = shortScenes(s).at(-1)!.scene;
      expect(end.kind === "end" && end.note).toBe(s.medical ? `${MEDICAL_LINE} ${DOCTOR_LINE}` : MEDICAL_LINE);
    }
  });
});

describe("YouTube metadata", () => {
  it("titles fit 100 characters, end in #shorts and carry no angle brackets", () => {
    for (const s of SHORTS) {
      const t = shortTitle(s);
      expect(t.length).toBeLessThanOrEqual(100);
      expect(t.endsWith(" #shorts")).toBe(true);
      expect(t).not.toMatch(/[<>]/);
    }
    expect(shortTitle({ ...SHORTS[0], hook: "x".repeat(150) }).length).toBe(100);
  });

  it("descriptions explain the Short, link a tracked free trial, point to the human number and the disclaimer", () => {
    for (const s of SHORTS) {
      const d = shortDescription(s, biz);
      expect(d.length).toBeLessThanOrEqual(5000);
      expect(d).toContain(`https://www.example.in/?utm_source=youtube&utm_medium=shorts&utm_campaign=${s.id}`);
      expect(d).toContain("+91 88518 30081");
      expect(d).not.toContain("92668");
      expect(d).toContain(MEDICAL_LINE);
      if (s.medical) expect(d).toContain(DOCTOR_LINE);
      if (s.format === "fact") expect(d).toContain(s.source.url);
      for (const t of EXTRAS[s.id].tips) expect(d).toContain(t);
      expect(d).toContain(EXTRAS[s.id].ask);
      expect(d).toMatch(/#shorts #fitness/);
    }
  });

  it("tags stay under YouTube's 500-character limit and aren't repeated", () => {
    for (const s of SHORTS) {
      const tags = shortTags(s);
      const cost = tags.reduce((n, t) => n + t.length + (t.includes(" ") ? 2 : 0) + 1, 0);
      expect(cost).toBeLessThanOrEqual(500);
      expect(new Set(tags.map((t) => t.toLowerCase())).size).toBe(tags.length);
      expect(tags).toContain("Royal Fitness Club");
    }
  });
});

describe("next short", () => {
  it("takes the first script not yet used, and none once the bank is used up", () => {
    expect(nextShort([])?.id).toBe(SHORTS[0].id);
    expect(nextShort([SHORTS[0].id, SHORTS[2].id])?.id).toBe(SHORTS[1].id);
    expect(nextShort(SHORTS.map((s) => s.id))).toBeNull();
  });
});

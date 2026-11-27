import { describe, expect, it } from "vitest";
import { EGG_IMAGE_PROMPTS, EGG_VIDEO_PROMPTS, PARA_IMAGE_PROMPTS, PARA_VIDEO_PROMPTS, BLOODLAB_IMAGE_PROMPTS, BLOODLAB_VIDEO_PROMPTS, LABSERIES_IMAGE_PROMPTS, LABSERIES_VIDEO_PROMPTS, ANATOMY_IMAGE_PROMPTS, ANATOMY_VIDEO_PROMPTS, fullPrompt, HABITS_IMAGE_PROMPTS, HABITS_VIDEO_PROMPTS, IMAGE_PROMPTS, SUPPLEMENT_IMAGE_PROMPTS, SUPPLEMENT_VIDEO_PROMPTS, SUPPLEMENT2_IMAGE_PROMPTS, SUPPLEMENT2_VIDEO_PROMPTS, promptProblems, promptSet, reelOnlySet, VIDEO_PROMPTS } from "./visual-prompts";

describe("visual prompts", () => {
  const all = [...IMAGE_PROMPTS, ...VIDEO_PROMPTS, ...ANATOMY_IMAGE_PROMPTS, ...ANATOMY_VIDEO_PROMPTS];

  it("have unique ids", () => {
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  });

  it("never describe members, results or brands", () => {
    expect(all.flatMap(promptProblems)).toEqual([]);
    expect(promptProblems({ id: "x", prompt: "Before and after photo of a member", use: "" }).length).toBe(1);
  });

  it("always add the no-faces, no-text style rules", () => {
    for (const p of all) expect(fullPrompt(p)).toMatch(/No identifiable faces/);
  });

  it("picks the anatomy set only when asked, within the job's per-run limits", () => {
    expect(promptSet("anatomy", "image")).toBe(ANATOMY_IMAGE_PROMPTS);
    expect(promptSet("anatomy", "video")).toBe(ANATOMY_VIDEO_PROMPTS);
    expect(promptSet(undefined, "image")).toBe(IMAGE_PROMPTS);
    expect(ANATOMY_IMAGE_PROMPTS.length).toBeLessThanOrEqual(20);
    expect(ANATOMY_VIDEO_PROMPTS.length).toBeLessThanOrEqual(10);
    for (const p of ANATOMY_IMAGE_PROMPTS) expect(fullPrompt(p)).toMatch(/medical visualisation/);
  });

  it("picks the habits set, keeps it Reel-only and within the per-run limits", () => {
    expect(promptSet("habits", "image")).toBe(HABITS_IMAGE_PROMPTS);
    expect(promptSet("habits", "video")).toBe(HABITS_VIDEO_PROMPTS);
    expect(promptSet("nope", "video")).toBe(VIDEO_PROMPTS);
    expect(reelOnlySet("habits")).toBe(true);
    expect(reelOnlySet("default")).toBe(false);
    expect(HABITS_IMAGE_PROMPTS.length).toBeLessThanOrEqual(20);
    expect(HABITS_VIDEO_PROMPTS.length).toBeLessThanOrEqual(10);
    const ids = [...HABITS_IMAGE_PROMPTS, ...HABITS_VIDEO_PROMPTS, ...ANATOMY_IMAGE_PROMPTS, ...ANATOMY_VIDEO_PROMPTS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of [...HABITS_IMAGE_PROMPTS, ...HABITS_VIDEO_PROMPTS]) expect(promptProblems(p)).toEqual([]);
  });

  it("picks the supplements set, Reel-only, within limits, with ids unique across every set", () => {
    expect(promptSet("supplements", "image")).toBe(SUPPLEMENT_IMAGE_PROMPTS);
    expect(promptSet("supplements", "video")).toBe(SUPPLEMENT_VIDEO_PROMPTS);
    expect(reelOnlySet("supplements")).toBe(true);
    expect(promptSet("supplements2", "image")).toBe(SUPPLEMENT2_IMAGE_PROMPTS);
    expect(promptSet("supplements2", "video")).toBe(SUPPLEMENT2_VIDEO_PROMPTS);
    expect(SUPPLEMENT2_IMAGE_PROMPTS.length).toBeLessThanOrEqual(20);
    expect(SUPPLEMENT2_VIDEO_PROMPTS.length).toBeLessThanOrEqual(10);
    expect(SUPPLEMENT_IMAGE_PROMPTS.length).toBeLessThanOrEqual(20);
    expect(SUPPLEMENT_VIDEO_PROMPTS.length).toBeLessThanOrEqual(10);
    const ids = [...IMAGE_PROMPTS, ...VIDEO_PROMPTS, ...ANATOMY_IMAGE_PROMPTS, ...ANATOMY_VIDEO_PROMPTS, ...HABITS_IMAGE_PROMPTS, ...HABITS_VIDEO_PROMPTS, ...SUPPLEMENT_IMAGE_PROMPTS, ...SUPPLEMENT_VIDEO_PROMPTS, ...SUPPLEMENT2_IMAGE_PROMPTS, ...SUPPLEMENT2_VIDEO_PROMPTS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of [...SUPPLEMENT_IMAGE_PROMPTS, ...SUPPLEMENT_VIDEO_PROMPTS, ...SUPPLEMENT2_IMAGE_PROMPTS, ...SUPPLEMENT2_VIDEO_PROMPTS]) {
      expect(promptProblems(p)).toEqual([]);
      expect(fullPrompt(p)).toMatch(/No identifiable faces/);
    }
  });

  it("picks the egg set, Reel-only, within limits, with ids unique across every set", () => {
    expect(promptSet("egg", "image")).toBe(EGG_IMAGE_PROMPTS);
    expect(promptSet("egg", "video")).toBe(EGG_VIDEO_PROMPTS);
    expect(reelOnlySet("egg")).toBe(true);
    expect(EGG_IMAGE_PROMPTS.length).toBeLessThanOrEqual(20);
    expect(EGG_VIDEO_PROMPTS.length).toBeLessThanOrEqual(10);
    const ids = [...IMAGE_PROMPTS, ...VIDEO_PROMPTS, ...ANATOMY_IMAGE_PROMPTS, ...ANATOMY_VIDEO_PROMPTS, ...HABITS_IMAGE_PROMPTS, ...HABITS_VIDEO_PROMPTS, ...SUPPLEMENT_IMAGE_PROMPTS, ...SUPPLEMENT_VIDEO_PROMPTS, ...SUPPLEMENT2_IMAGE_PROMPTS, ...SUPPLEMENT2_VIDEO_PROMPTS, ...EGG_IMAGE_PROMPTS, ...EGG_VIDEO_PROMPTS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of [...EGG_IMAGE_PROMPTS, ...EGG_VIDEO_PROMPTS]) {
      expect(promptProblems(p)).toEqual([]);
      expect(fullPrompt(p)).toMatch(/No identifiable faces/);
    }
  });

  it("picks the paracetamol set, Reel-only, within limits, with ids unique across every set", () => {
    expect(promptSet("paracetamol", "image")).toBe(PARA_IMAGE_PROMPTS);
    expect(promptSet("paracetamol", "video")).toBe(PARA_VIDEO_PROMPTS);
    expect(reelOnlySet("paracetamol")).toBe(true);
    expect(PARA_IMAGE_PROMPTS.length).toBeLessThanOrEqual(20);
    expect(PARA_VIDEO_PROMPTS.length).toBeLessThanOrEqual(10);
    const ids = [...IMAGE_PROMPTS, ...VIDEO_PROMPTS, ...ANATOMY_IMAGE_PROMPTS, ...ANATOMY_VIDEO_PROMPTS, ...HABITS_IMAGE_PROMPTS, ...HABITS_VIDEO_PROMPTS, ...SUPPLEMENT_IMAGE_PROMPTS, ...SUPPLEMENT_VIDEO_PROMPTS, ...SUPPLEMENT2_IMAGE_PROMPTS, ...SUPPLEMENT2_VIDEO_PROMPTS, ...EGG_IMAGE_PROMPTS, ...EGG_VIDEO_PROMPTS, ...BLOODLAB_IMAGE_PROMPTS, ...BLOODLAB_VIDEO_PROMPTS, ...LABSERIES_IMAGE_PROMPTS, ...LABSERIES_VIDEO_PROMPTS, ...PARA_IMAGE_PROMPTS, ...PARA_VIDEO_PROMPTS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of [...PARA_IMAGE_PROMPTS, ...PARA_VIDEO_PROMPTS]) {
      expect(promptProblems(p)).toEqual([]);
      expect(fullPrompt(p)).toMatch(/No identifiable faces/);
    }
  });

  it("picks the bloodlab set, Reel-only, within limits, with ids unique across every set", () => {
    expect(promptSet("bloodlab", "image")).toBe(BLOODLAB_IMAGE_PROMPTS);
    expect(promptSet("bloodlab", "video")).toBe(BLOODLAB_VIDEO_PROMPTS);
    expect(promptSet("labseries", "image")).toBe(LABSERIES_IMAGE_PROMPTS);
    expect(promptSet("labseries", "video")).toBe(LABSERIES_VIDEO_PROMPTS);
    expect(LABSERIES_IMAGE_PROMPTS.length).toBeLessThanOrEqual(20);
    expect(LABSERIES_VIDEO_PROMPTS.length).toBeLessThanOrEqual(10);
    expect(reelOnlySet("bloodlab")).toBe(true);
    expect(BLOODLAB_IMAGE_PROMPTS.length).toBeLessThanOrEqual(20);
    expect(BLOODLAB_VIDEO_PROMPTS.length).toBeLessThanOrEqual(10);
    const ids = [...IMAGE_PROMPTS, ...VIDEO_PROMPTS, ...ANATOMY_IMAGE_PROMPTS, ...ANATOMY_VIDEO_PROMPTS, ...HABITS_IMAGE_PROMPTS, ...HABITS_VIDEO_PROMPTS, ...SUPPLEMENT_IMAGE_PROMPTS, ...SUPPLEMENT_VIDEO_PROMPTS, ...SUPPLEMENT2_IMAGE_PROMPTS, ...SUPPLEMENT2_VIDEO_PROMPTS, ...BLOODLAB_IMAGE_PROMPTS, ...BLOODLAB_VIDEO_PROMPTS, ...LABSERIES_IMAGE_PROMPTS, ...LABSERIES_VIDEO_PROMPTS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of [...BLOODLAB_IMAGE_PROMPTS, ...BLOODLAB_VIDEO_PROMPTS, ...LABSERIES_IMAGE_PROMPTS, ...LABSERIES_VIDEO_PROMPTS]) {
      expect(promptProblems(p)).toEqual([]);
      expect(fullPrompt(p)).toMatch(/No identifiable faces/);
    }
  });
});

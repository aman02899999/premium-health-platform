import { describe, expect, it } from "vitest";
import { ANATOMY_IMAGE_PROMPTS, ANATOMY_VIDEO_PROMPTS, fullPrompt, IMAGE_PROMPTS, promptProblems, promptSet, VIDEO_PROMPTS } from "./visual-prompts";

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
});

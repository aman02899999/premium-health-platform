import { describe, expect, it } from "vitest";
import { fullPrompt, IMAGE_PROMPTS, promptProblems, VIDEO_PROMPTS } from "./visual-prompts";

describe("visual prompts", () => {
  const all = [...IMAGE_PROMPTS, ...VIDEO_PROMPTS];

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
});

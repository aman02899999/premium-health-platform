import { describe, expect, it } from "vitest";
import { SHORTS } from "./shorts-bank";
import { FADE, shortScenes, shortSeconds } from "./shorts-core";
import { FPS, shortFilterGraph } from "./shorts-graph";

const framesOf = (i: number) => shortScenes(SHORTS[i]).flatMap((t, scene) => t.steps.map((seconds) => ({ scene, seconds })));

describe("short filter graph", () => {
  it("joins each scene's caption frames, punches in, and cross-fades scenes with varied transitions", () => {
    const frames = framesOf(0);
    const { graph, total, transitions } = shortFilterGraph(frames, true);
    const scenes = new Set(frames.map((f) => f.scene)).size;
    expect(transitions).toHaveLength(scenes - 1);
    expect(new Set(transitions).size).toBeGreaterThan(1);
    expect(graph.match(/xfade=/g)).toHaveLength(scenes - 1);
    expect(graph).toContain("exp(-7*t)");
    expect(graph).toContain(`[${frames.length}:a]afade`);
    // The video length matches the scene timing within a frame per step (rounding to 30 fps).
    expect(Math.abs(total - shortSeconds(shortScenes(SHORTS[0])))).toBeLessThan((frames.length / FPS) * 0.6 + 0.1);
    expect(total).toBeGreaterThan(FADE);
  });

  it("works with a single-frame scene and with no music", () => {
    const { graph } = shortFilterGraph([{ scene: 0, seconds: 2 }, { scene: 1, seconds: 0.2 }, { scene: 1, seconds: 2 }], false);
    expect(graph).toContain("[s0p0]null");
    expect(graph).toContain("concat=n=2");
    expect(graph).toContain("[3:a]anull[aout]");
  });
});

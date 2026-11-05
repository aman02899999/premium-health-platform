import { describe, expect, it } from "vitest";
import { SHORTS } from "./shorts-bank";
import { SR, musicPlan, planKey, renderMusic, wav } from "./music";

describe("music", () => {
  it("gives every Short in the bank (and the next 50 added) its own key, progression and scale", () => {
    const keys = Array.from({ length: Math.max(144, SHORTS.length) }, (_, i) => planKey(musicPlan(i)));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is the same track for the same Short every time (a re-upload sounds the same)", () => {
    expect(musicPlan(7)).toEqual(musicPlan(7));
    const a = renderMusic(musicPlan(3), 2);
    const b = renderMusic(musicPlan(3), 2);
    expect(Buffer.from(a.buffer).equals(Buffer.from(b.buffer))).toBe(true);
  });

  it("renders a full minute of loud-enough, unclipped stereo that differs between Shorts", () => {
    const a = renderMusic(musicPlan(0), 62);
    expect(a.length).toBeGreaterThanOrEqual(62 * SR * 2);
    let peak = 0;
    let energy = 0;
    for (const v of a) {
      peak = Math.max(peak, Math.abs(v));
      energy += v * v;
    }
    expect(peak).toBeLessThanOrEqual(0.9);
    expect(Math.sqrt(energy / a.length)).toBeGreaterThan(0.05);
    // The last 20 seconds still have music in them (not just the intro).
    let tail = 0;
    for (let i = a.length - 20 * SR * 2; i < a.length; i++) tail += a[i] * a[i];
    expect(Math.sqrt(tail / (20 * SR * 2))).toBeGreaterThan(0.05);
    const b = renderMusic(musicPlan(1), 62);
    let diff = 0;
    for (let i = 0; i < a.length; i += 97) diff += Math.abs(a[i] - b[i]);
    expect(diff).toBeGreaterThan(100);
  }, 30_000);

  it("writes a valid 16-bit stereo WAV", () => {
    const w = wav(new Float32Array([0, 0, 0.5, -0.5]));
    expect(w.subarray(0, 4).toString()).toBe("RIFF");
    expect(w.subarray(8, 12).toString()).toBe("WAVE");
    expect(w.readUInt16LE(22)).toBe(2);
    expect(w.readUInt32LE(24)).toBe(SR);
    expect(w.readUInt32LE(40)).toBe(8);
    expect(w.readInt16LE(48)).toBe(16384);
  });
});

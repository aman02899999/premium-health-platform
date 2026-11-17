import { describe, expect, it } from "vitest";
import { captionWindows, checkClipInput, CLIP_INDEX_BASE, clipDescription, clipFilterGraph, clipPath, clipReelCaption, clipTitle, END_CARD_SECONDS, probe } from "./clips-core";
import { musicPlan, planKey } from "./music";

// The same "own track" test the Reels use: style, key, progression, tempo, pattern and melody seed.
const track = (i: number) => { const p = musicPlan(i); return `${planKey(p)}:${p.bpm}:${p.arp.join("")}:${p.seed}`; };
import { QUEUE_INDEX_BASE } from "./queue-core";
import { parseRunnerRequest } from "./runner-protocol";

const ok = { hook: "Squat mein ye galti mat karo", captions: ["Ghutne andar mat aane do", " ", "Chest upar"], consent: true, medical: false };

describe("phone clips", () => {
  it("needs the consent tick and a hook, and drops empty lines", () => {
    const r = checkClipInput(ok);
    expect(r.ok && r.value.captions).toEqual(["Ghutne andar mat aane do", "Chest upar"]);
    expect(checkClipInput({ ...ok, consent: false }).ok).toBe(false);
    expect(checkClipInput({ ...ok, hook: "Hi" }).ok).toBe(false);
    expect(checkClipInput({ ...ok, captions: ["a", "b", "c", "d", "e"] }).ok).toBe(false);
  });
  it("blocks cures, doses and steroid talk in the text", () => {
    expect(checkClipInput({ ...ok, captions: ["Roz 500 mg lo"] }).ok).toBe(false);
    expect(checkClipInput({ ...ok, hook: "Ye diabetes cure karta hai" }).ok).toBe(false);
  });
  it("spreads captions over the clip before the end card", () => {
    const w = captionWindows(20, 3);
    expect(w).toHaveLength(3);
    expect(w[0][0]).toBe(2.5);
    expect(w[2][1]).toBe(20 - END_CARD_SECONDS);
    for (let i = 1; i < w.length; i++) expect(w[i][0]).toBe(w[i - 1][1]);
  });
  it("keeps the phone's sound with music underneath, or music alone for a silent clip", () => {
    const g = clipFilterGraph(20, 2, true);
    expect(g).toContain("crop=1080:1920");
    expect(g).toContain("[0:a]");
    expect(g).toContain("[5:a]"); // inputs: clip, hook, end card, 2 captions, then music
    expect(g).toContain("amix=inputs=2");
    expect(clipFilterGraph(20, 2, false)).not.toContain("[0:a]");
    expect(g.endsWith("[aout]")).toBe(true);
  });
  it("reads the length and sound from ffmpeg's report", () => {
    const withSound = "Duration: 00:00:23.45, start: 0\n  Stream #0:0[0x1](und): Video: h264\n  Stream #0:1[0x2](und): Audio: aac (LC)";
    expect(probe(withSound)).toEqual({ seconds: 23.45, hasAudio: true });
    expect(probe("Duration: 00:01:02.00\n Stream #0:0: Video: h264")).toEqual({ seconds: 62, hasAudio: false });
    expect(probe("garbage")).toBeNull();
  });
  it("gets its own music, never a bank Short's or a queue Short's", () => {
    const used = new Set([...Array.from({ length: 300 }, (_, i) => track(i)), ...Array.from({ length: 50 }, (_, i) => track(QUEUE_INDEX_BASE + i))]);
    for (let i = 1; i <= 20; i++) expect(used.has(track(CLIP_INDEX_BASE + i))).toBe(false);
  });
  it("writes a title, description and Reel caption with the medical line and the trial link", () => {
    const c = checkClipInput({ ...ok, medical: true });
    if (!c.ok) throw new Error("fixture");
    expect(clipTitle(c.value.hook)).toBe("Squat mein ye galti mat karo #shorts");
    const d = clipDescription(c.value, "https://www.example.in", "+91 88518 30081", "abcdef12-0000");
    expect(d).toContain("apne doctor ki salah maano");
    expect(d).toContain("utm_campaign=clip-abcdef12");
    expect(clipReelCaption(c.value, "88518 30081")).toContain("88518 30081");
  });
  it("stores raw clips under an unguessable path", () => {
    expect(clipPath("1234", "MOV")).toBe("clips/1234/raw.mov");
    expect(clipPath("1234", "exe")).toBe("clips/1234/raw.mp4");
  });
  it("accepts the runner's clip messages", () => {
    expect(parseRunnerRequest({ action: "claim-clip" }, [1, 2, 3])).toEqual({ ok: true, value: { action: "claim-clip" } });
    const id = "12345678-1234-1234-1234-123456789abc";
    const r = parseRunnerRequest({ action: "result-clip", id, uploadedFinal: true, result: { ok: true, id: "abc", privacy: "public", url: "https://youtube.com/shorts/abc" } }, [1, 2, 3]);
    expect(r).toEqual({ ok: true, value: { action: "result-clip", id, uploadedFinal: true, result: { ok: true, id: "abc", privacy: "public", url: "https://youtube.com/shorts/abc" } } });
    expect(parseRunnerRequest({ action: "result-clip", id: "x", result: { ok: true } }, [1]).ok).toBe(false);
  });
});

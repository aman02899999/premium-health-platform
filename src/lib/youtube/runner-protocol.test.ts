import { describe, expect, it } from "vitest";
import { parseRunnerRequest } from "./runner-protocol";

const SLOTS = [1, 2, 3] as const;
const ID = "0b9f6f0e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";

describe("parseRunnerRequest", () => {
  it("accepts a claim for a known slot only", () => {
    expect(parseRunnerRequest({ action: "claim", slot: 2 }, SLOTS)).toEqual({ ok: true, value: { action: "claim", slot: 2 } });
    expect(parseRunnerRequest({ action: "claim", slot: 4 }, SLOTS).ok).toBe(false);
    expect(parseRunnerRequest({ action: "claim", slot: "1" }, SLOTS).ok).toBe(false);
  });

  it("accepts a published result with a YouTube URL", () => {
    const r = parseRunnerRequest({ action: "result", id: ID, result: { ok: true, id: "abc_DEF-123", privacy: "public", url: "https://youtube.com/shorts/abc_DEF-123" } }, SLOTS);
    expect(r).toEqual({ ok: true, value: { action: "result", id: ID, result: { ok: true, id: "abc_DEF-123", privacy: "public", url: "https://youtube.com/shorts/abc_DEF-123" } } });
  });

  it("rejects a published result pointing anywhere but YouTube", () => {
    expect(parseRunnerRequest({ action: "result", id: ID, result: { ok: true, id: "x", privacy: "public", url: "https://evil.example/x" } }, SLOTS).ok).toBe(false);
    expect(parseRunnerRequest({ action: "result", id: ID, result: { ok: true, id: "<script>", privacy: "public", url: "https://youtube.com/x" } }, SLOTS).ok).toBe(false);
  });

  it("keeps a failure's message short and defaults quota to false", () => {
    const r = parseRunnerRequest({ action: "result", id: ID, result: { ok: false, error: "x".repeat(500) } }, SLOTS);
    expect(r.ok && r.value.action === "result" && !r.value.result.ok && r.value.result.error.length).toBe(300);
    expect(r.ok && r.value.action === "result" && !r.value.result.ok && r.value.result.quota).toBe(false);
  });

  it("rejects a bad row id, a missing body and unknown actions", () => {
    expect(parseRunnerRequest({ action: "result", id: "1; drop table", result: { ok: false, error: "e" } }, SLOTS).ok).toBe(false);
    expect(parseRunnerRequest(null, SLOTS).ok).toBe(false);
    expect(parseRunnerRequest({ action: "upload" }, SLOTS).ok).toBe(false);
  });
});

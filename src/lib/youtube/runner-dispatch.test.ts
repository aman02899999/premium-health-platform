import { describe, expect, it, vi } from "vitest";
import { dispatchRunner } from "./runner-dispatch";

const ok = () => vi.fn(async () => new Response(null, { status: 204 }));

describe("dispatchRunner", () => {
  it("does nothing without a token, so GitHub's own schedule stays the only trigger", async () => {
    const f = ok();
    expect(await dispatchRunner("1", {}, f)).toBe("github-runner");
    expect(f).not.toHaveBeenCalled();
  });

  it("starts the YouTube Shorts workflow on main for the slot", async () => {
    const f = ok();
    expect(await dispatchRunner("2", { GITHUB_DISPATCH_TOKEN: "t0k" }, f)).toBe("github-dispatched");
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/aman02899999/premium-health-platform/actions/workflows/youtube-shorts.yml/dispatches");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer t0k");
    expect(JSON.parse(String(init.body))).toEqual({ ref: "main", inputs: { slot: "2" } });
  });

  it("passes 'all' through for the late retry run", async () => {
    const f = ok();
    await dispatchRunner("all", { GITHUB_DISPATCH_TOKEN: "t" }, f);
    expect(JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body)).inputs.slot).toBe("all");
  });

  it("uses GITHUB_REPO when set", async () => {
    const f = ok();
    await dispatchRunner("3", { GITHUB_DISPATCH_TOKEN: "t", GITHUB_REPO: "someone/fork" }, f);
    expect((f.mock.calls[0] as unknown as [string])[0]).toContain("/repos/someone/fork/");
  });

  it("reports GitHub's refusal without the token, and never throws", async () => {
    const refused = vi.fn(async () => new Response(JSON.stringify({ message: "Bad credentials" }), { status: 401 }));
    const r = await dispatchRunner("1", { GITHUB_DISPATCH_TOKEN: "secret-value" }, refused);
    expect(r).toBe("dispatch-failed: HTTP 401 Bad credentials");
    expect(r).not.toContain("secret-value");
    const down = vi.fn(async () => {
      throw new Error("fetch failed");
    });
    expect(await dispatchRunner("1", { GITHUB_DISPATCH_TOKEN: "t" }, down)).toBe("dispatch-failed: fetch failed");
  });
});

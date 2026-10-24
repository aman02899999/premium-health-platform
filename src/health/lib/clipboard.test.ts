import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

afterEach(() => vi.unstubAllGlobals());

describe("copyText", () => {
  it("reports success when the clipboard accepts the text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await copyText("https://x.test/a")).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://x.test/a");
  });

  it("shows the link to copy by hand when the browser blocks the clipboard", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Write permission denied")) } });
    const prompt = vi.fn();
    vi.stubGlobal("window", { prompt });
    expect(await copyText("https://x.test/a")).toBe("manual");
    expect(prompt).toHaveBeenCalledWith("Copy this link:", "https://x.test/a");
  });

  it("falls back when there is no clipboard API at all (old in-app browsers)", async () => {
    vi.stubGlobal("navigator", {});
    const prompt = vi.fn();
    vi.stubGlobal("window", { prompt });
    expect(await copyText("u")).toBe("manual");
  });
});

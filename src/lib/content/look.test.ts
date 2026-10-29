import { describe, expect, it } from "vitest";
import { lookOf } from "./look";
import { mergeContent } from "./merge";

describe("lookOf", () => {
  it("defaults to Royal Black & Gold", () => {
    expect(lookOf(undefined)).toBe("gold");
    expect(lookOf({ primary: "#ff4d2a", secondary: "#04466d" })).toBe("gold");
  });

  it("returns the chosen look", () => {
    expect(lookOf({ look: "mono" })).toBe("mono");
    expect(lookOf({ look: "classic" })).toBe("classic");
    expect(lookOf({ look: "gold" })).toBe("gold");
  });

  it("ignores an unknown value", () => {
    expect(lookOf({ look: "neon" as never })).toBe("gold");
  });

  it("applies the default to a saved theme from before the switch existed", () => {
    const merged = mergeContent({ theme: { primary: "#ff4d2a", secondary: "#04466d" } });
    expect(merged.theme.primary).toBe("#ff4d2a");
    expect(lookOf(merged.theme)).toBe("gold");
  });
});

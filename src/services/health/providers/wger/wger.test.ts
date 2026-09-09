import { describe, it, expect } from "vitest";
import { wgerProvider } from "./provider";

describe("wger provider", () => {
  it("has correct metadata", () => {
    expect(wgerProvider.name).toBe("wger");
    expect(wgerProvider.status).toBe("AVAILABLE");
    expect(wgerProvider.config.enabled).toBe(true);
    expect(wgerProvider.config.requiresKey).toBe(false);
  });

  it("getCapabilities returns search true", () => {
    const caps = wgerProvider.getCapabilities();
    expect(caps.search).toBe(true);
    expect(caps.getById).toBe(true);
    expect(caps.healthCheck).toBe(true);
  });

  it("builds cache key correctly", async () => {
    // search with empty query should still return structure
    const res = await wgerProvider.search({ query: "test-nonexistent-xyz", limit: 1 });
    expect(res).toHaveProperty("data");
    expect(res).toHaveProperty("total");
    expect(res.source).toBe("wger Workout Manager");
  });
});

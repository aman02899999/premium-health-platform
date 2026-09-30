import { describe, it, expect } from "vitest";
import { openFDAProvider } from "./provider";

describe("openfda provider", () => {
  it("has correct metadata", () => {
    expect(openFDAProvider.name).toBe("openfda");
    expect(openFDAProvider.status).toBe("AVAILABLE");
    expect(openFDAProvider.config.requiresKey).toBe(false);
  });

  it("search returns structure even on failure", async () => {
    const res = await openFDAProvider.search({ query: "nonexistentdrugxyz123", limit: 1 });
    expect(res).toHaveProperty("data");
    expect(res).toHaveProperty("live");
  });
});

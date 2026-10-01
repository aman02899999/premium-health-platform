import { describe, it, expect } from "vitest";
import { unifiedHealthSearch } from "./index";

describe("unified health search", () => {
  it("returns categorized results for diabetes", async () => {
    const res = await unifiedHealthSearch({ query: "diabetes", limit: 2 });
    expect(res.query).toBe("diabetes");
    expect(res.total).toBeGreaterThanOrEqual(0);
    expect(res).toHaveProperty("categories");
    expect(res).toHaveProperty("sources");
  });

  it("handles ashwagandha query", async () => {
    const res = await unifiedHealthSearch({ query: "ashwagandha", limit: 2 });
    expect(res.query).toBe("ashwagandha");
    expect(res.categories.ayurveda).toBeDefined();
  });
});

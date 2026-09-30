import { describe, it, expect } from "vitest";
import { unifiedHealthSearch } from "../search";

describe("QA retrieval-first", () => {
  it("returns categorized results for diabetes millets", async () => {
    const res = await unifiedHealthSearch({ query: "diabetes millets", limit: 3 });
    expect(res.query).toBeDefined();
    expect(res.total).toBeGreaterThanOrEqual(0);
    expect(res.sources).toBeDefined();
  });

  it("handles hinglish madhumeh (may be empty but should not throw)", async () => {
    const res = await unifiedHealthSearch({ query: "madhumeh", limit: 3 });
    expect(res.query).toBeDefined();
    expect(res.total).toBeGreaterThanOrEqual(0);
  });

  it("handles empty query error", async () => {
    await expect(unifiedHealthSearch({ query: "", limit: 3 } as any)).rejects.toThrow();
  });
});

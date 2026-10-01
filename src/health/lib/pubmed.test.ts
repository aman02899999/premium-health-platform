import { describe, it, expect } from "vitest";
import { buildPubMedQuery } from "./pubmed";

describe("pubmed query builder", () => {
  it("builds query from disease name", () => {
    expect(buildPubMedQuery("Type 2 Diabetes")).toBe("Type 2 Diabetes");
    expect(buildPubMedQuery("type-2-diabetes")).toBe("type 2 diabetes");
  });

  it("adds extra context", () => {
    expect(buildPubMedQuery("Asthma", "treatment")).toBe("Asthma treatment");
  });
});

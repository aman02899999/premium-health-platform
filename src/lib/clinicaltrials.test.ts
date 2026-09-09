import { describe, it, expect } from "vitest";
import { buildTrialsQuery } from "./clinicaltrials";

describe("clinicaltrials query builder", () => {
  it("normalizes slug to spaced query", () => {
    expect(buildTrialsQuery("type-2-diabetes")).toBe("type 2 diabetes");
    expect(buildTrialsQuery("High Blood Pressure")).toBe("High Blood Pressure");
  });
});

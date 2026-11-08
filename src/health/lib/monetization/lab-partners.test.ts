import { describe, expect, it } from "vitest";
import { labPartners, safeLink } from "./lab-partners";

describe("lab booking partners", () => {
  it("accepts only full https links", () => {
    expect(safeLink(undefined)).toBeNull();
    expect(safeLink("  ")).toBeNull();
    expect(safeLink("http://linksredirect.com/?cid=1")).toBeNull();
    expect(safeLink("javascript:alert(1)")).toBeNull();
    expect(safeLink("not a url")).toBeNull();
    expect(safeLink(" https://linksredirect.com/?cid=1&url=https%3A%2F%2Fwww.1mg.com%2Flabs ")).toBe("https://linksredirect.com/?cid=1&url=https%3A%2F%2Fwww.1mg.com%2Flabs");
  });

  it("shows only partners whose link is set", () => {
    const list = labPartners([
      { id: "lab-1mg", name: "Tata 1mg Labs", env: "https://example.com/a" },
      { id: "lab-redcliffe", name: "Redcliffe Labs", env: undefined },
    ]);
    expect(list).toEqual([{ id: "lab-1mg", name: "Tata 1mg Labs", url: "https://example.com/a" }]);
  });

  it("shows nothing when no links are set", () => {
    expect(labPartners([{ id: "x", name: "X", env: "" }])).toEqual([]);
  });
});

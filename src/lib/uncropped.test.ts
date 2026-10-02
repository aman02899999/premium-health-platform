import { describe, expect, it } from "vitest";
import { uncropped } from "./uncropped";

describe("uncropped", () => {
  it("drops the Pexels crop but keeps compression and width", () => {
    expect(uncropped("https://images.pexels.com/photos/1/pexels-photo-1.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200")).toBe(
      "https://images.pexels.com/photos/1/pexels-photo-1.jpeg?auto=compress&cs=tinysrgb&w=1200",
    );
  });
  it("leaves local and other images alone", () => {
    expect(uncropped("/gallery/a.webp")).toBe("/gallery/a.webp");
    expect(uncropped("https://example.com/x.jpg?fit=crop&h=1")).toBe("https://example.com/x.jpg?fit=crop&h=1");
  });
});

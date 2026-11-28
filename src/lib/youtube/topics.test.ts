import { describe, expect, it } from "vitest";
import { videoTopics } from "./topics";

describe("video topics", () => {
  it("always adds a series playlist when the video carries the series tag", () => {
    expect(videoTopics("Lipid Profile Ke 4 Number Kaise Padhein? · lab ke andar · cholesterol test")).toEqual(["bp-heart", "lab-series"]);
    expect(videoTopics("Thyroid Report · lab ke andar · blood test hindi · thyroid · b12 · diet")).toContain("lab-series");
    expect(videoTopics("SARMs Safe Hain? · steroid ka sach · steroid myths hindi · sarms")).toEqual(expect.arrayContaining(["supplements", "steroid-series", "myths"]));
    expect(videoTopics("Whey Protein Steroid Hai? Myth · supplement myth buster · whey")).toEqual(["supplements", "supplement-series", "myths"]);
  });

  it("keeps two subject playlists at most, plus myths for a myth-buster", () => {
    expect(videoTopics("Belly fat myths · diet · thali · weight loss")).toEqual(["weight", "diet", "myths"]);
  });
});

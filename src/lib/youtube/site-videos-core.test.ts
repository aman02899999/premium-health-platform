import { describe, expect, it } from "vitest";
import { pickSiteVideo, type SiteVideo } from "./site-videos-core";
import { videoText } from "./topics";

const v = (scriptId: string, title: string, tags: string[], uploadDate = "2026-11-10T00:00:00.000Z"): SiteVideo => ({
  youtubeId: `yt-${scriptId}`,
  scriptId,
  title,
  description: "",
  thumb: "",
  uploadDate,
  text: videoText(title, tags),
});

const LIST = [
  v("long-sleep-myths-7", "Neend Ke 7 Jhooth | Weight Aur Gains Par Asar", ["sleep myths hindi", "neend aur weight loss"]),
  v("long-ozempic-glp1-myths-15-v2", "Ozempic, Mounjaro Ka Sach: 8 Myths", ["ozempic hindi", "mounjaro hindi", "glp 1 weight loss"]),
];

describe("pickSiteVideo", () => {
  it("returns the pinned video when it is live, whatever the page text says", () => {
    expect(pickSiteVideo(LIST, "sleep and weight loss", "long-ozempic-glp1-myths-15-v2")?.scriptId).toBe("long-ozempic-glp1-myths-15-v2");
  });

  it("shows nothing when the pinned video isn't live yet, rather than guessing a wrong one", () => {
    expect(pickSiteVideo(LIST, "sleep myths and weight loss", "long-steroid-myths-19")).toBeNull();
  });

  it("falls back to word matching when nothing is pinned", () => {
    expect(pickSiteVideo(LIST, "Sleep guide · sleep myths hindi · neend")?.scriptId).toBe("long-sleep-myths-7");
  });
});

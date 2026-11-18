import { describe, expect, it } from "vitest";
import { instagramEmbedUrl, instagramFrom, shortsFrom, tidyTitle, type FeedRow } from "./site-feed-core";

const row = (o: Partial<FeedRow>): FeedRow => ({ channel: "instagram", theme: "Tip", external_id: "1", permalink: null, created_at: "2026-11-17T10:00:00Z", ...o });

describe("shortsFrom", () => {
  it("keeps YouTube Shorts only, newest first, with the bank's hook as the title", () => {
    const list = shortsFrom([
      row({ channel: "youtube-1", theme: "fact-water-total", external_id: "Do9UbNU4g0g", created_at: "2026-11-17T23:56:00Z" }),
      row({ channel: "youtube-3", theme: "myth-cardio-gains", external_id: "RpTdpKRdb4U", created_at: "2026-11-17T22:03:00Z" }),
      row({ channel: "youtube-2", theme: "viral-msg", external_id: "tgf6lIfsjwM", created_at: "2026-11-18T00:00:00Z" }),
      row({ channel: "youtube-long", theme: "long-x", external_id: "u2F5suFitxI" }),
      row({ channel: "instagram", external_id: "18654582904042175" }),
    ]);
    expect(list.map((s) => s.youtubeId)).toEqual(["tgf6lIfsjwM", "Do9UbNU4g0g", "RpTdpKRdb4U"]);
    expect(list[0].title).toBe("Ajinomoto zehar hai kya?");
  });

  it("drops bad or repeated ids and names unknown themes from the slug", () => {
    const list = shortsFrom([
      row({ channel: "youtube-1", theme: "answer-knee-pain", external_id: "abcdefghijk" }),
      row({ channel: "youtube-2", theme: "answer-knee-pain", external_id: "abcdefghijk" }),
      row({ channel: "youtube-3", theme: "x", external_id: "<script>" }),
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Knee pain");
  });

  it("respects the limit", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row({ channel: "youtube-1", theme: "t", external_id: `vid${String(i).padStart(8, "0")}` }));
    expect(shortsFrom(rows, 5)).toHaveLength(5);
  });
});

describe("instagramFrom", () => {
  it("keeps feed posts and Reels, skips Stories and failed rows", () => {
    const list = instagramFrom([
      row({ channel: "instagram-pm", theme: "Meet the coaches", permalink: "https://www.instagram.com/p/Df4S2MSiTP6/", created_at: "2026-11-18T10:30:00Z" }),
      row({ channel: "instagram", theme: "Hidden salt & BP", permalink: "https://www.instagram.com/reel/Df2BmNloxgk/", created_at: "2026-11-17T13:20:00Z" }),
      row({ channel: "instagram-story", permalink: "https://www.instagram.com/stories/royalfitness93_/4032807267015300423" }),
      row({ channel: "instagram-am", permalink: null }),
      row({ channel: "facebook", permalink: "https://www.facebook.com/x" }),
    ]);
    expect(list).toEqual([
      { code: "Df4S2MSiTP6", kind: "p", title: "Meet the coaches", date: "2026-11-18T10:30:00.000Z", url: "https://www.instagram.com/p/Df4S2MSiTP6/" },
      { code: "Df2BmNloxgk", kind: "reel", title: "Hidden salt & BP", date: "2026-11-17T13:20:00.000Z", url: "https://www.instagram.com/reel/Df2BmNloxgk/" },
    ]);
  });

  it("ignores links that are not plain Instagram post URLs", () => {
    expect(instagramFrom([row({ permalink: "https://evil.example/reel/abcdef/" }), row({ permalink: "https://www.instagram.com/reel/abc def/" })])).toEqual([]);
  });

  it("builds the official embed URL", () => {
    expect(instagramEmbedUrl({ code: "Df2BmNloxgk", kind: "reel" })).toBe("https://www.instagram.com/reel/Df2BmNloxgk/embed/");
  });
});

describe("tidyTitle", () => {
  it("softens all-caps themes and leaves normal ones alone", () => {
    expect(tidyTitle("CORE THAT'S NOT CRUNCHES")).toBe("Core that's not crunches");
    expect(tidyTitle("Hidden salt & BP")).toBe("Hidden salt & BP");
    expect(tidyTitle("BP")).toBe("BP");
  });
});

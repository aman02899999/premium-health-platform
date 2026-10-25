import { describe, expect, it } from "vitest";
import { responsiveImage } from "./responsive-image";

describe("responsiveImage", () => {
  it("gives a local photo a resized srcset through the image optimizer", () => {
    const r = responsiveImage("/gallery/aman-sharma-physique.webp", "(min-width: 640px) 320px, 260px");
    expect(r.sizes).toBe("(min-width: 640px) 320px, 260px");
    expect(r.srcSet).toMatch(/\/_next\/image\?url=%2Fgallery%2Faman-sharma-physique\.webp&w=640&q=75 640w/);
    // The largest candidate is still there for big screens.
    expect(r.srcSet).toMatch(/w=1920&q=75 1920w/);
    expect(r.src).toMatch(/^\/_next\/image\?url=/);
  });

  it("resizes Pexels photos too, since they are an allowed remote host", () => {
    const r = responsiveImage("https://images.pexels.com/photos/1/pexels-photo-1.jpeg?auto=compress&w=1200", "100vw");
    expect(r.srcSet).toContain("url=https%3A%2F%2Fimages.pexels.com");
  });

  it("leaves admin uploads, query-string paths and unknown hosts untouched", () => {
    for (const src of ["/api/media/abc", "/hero.webp?v=2", "https://example.com/a.jpg", "//cdn.example.com/a.jpg", "data:image/png;base64,AA"]) {
      expect(responsiveImage(src, "100vw")).toEqual({ src });
    }
  });

  it("does nothing without sizes, so callers opt in", () => {
    expect(responsiveImage("/gallery/a.webp")).toEqual({ src: "/gallery/a.webp" });
  });
});

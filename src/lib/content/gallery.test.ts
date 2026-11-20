import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONTENT } from "./defaults";
import { mergeContent } from "./merge";
import { visibleGallery } from "./gallery";

const gallery = DEFAULT_CONTENT.gallery;

describe("mergeContent gallery", () => {
  it("adds built-in photos that a saved gallery doesn't mention, after the saved ones", () => {
    const saved = [{ ...gallery[0], title: "Edited" }];
    const merged = mergeContent({ gallery: saved });
    expect(merged.gallery[0].title).toBe("Edited");
    expect(merged.gallery).toHaveLength(gallery.length);
    expect(new Set(merged.gallery.map((g) => g.id)).size).toBe(gallery.length);
  });

  it("keeps a built-in photo hidden when the admin saved it as hidden", () => {
    const merged = mergeContent({ gallery: [{ ...gallery[1], hidden: true }] });
    expect(merged.gallery.filter((g) => g.id === gallery[1].id)).toEqual([expect.objectContaining({ hidden: true })]);
    expect(visibleGallery(merged.gallery).some((g) => g.id === gallery[1].id)).toBe(false);
  });

  it("keeps admin-added photos", () => {
    const own = { id: "mine", title: "Mine", caption: "", image: "/x.webp" };
    expect(mergeContent({ gallery: [own] }).gallery[0]).toEqual(own);
  });
});

describe("built-in gallery files", () => {
  it("every photo exists, is a small WebP and has a unique id", () => {
    expect(new Set(gallery.map((g) => g.id)).size).toBe(gallery.length);
    for (const g of gallery) {
      expect(g.image.endsWith(".webp"), g.image).toBe(true);
      const file = join(process.cwd(), "public", g.image);
      expect(existsSync(file), g.image).toBe(true);
      expect(statSync(file).size, g.image).toBeLessThan(250_000);
    }
  });

  it("visibleGallery drops hidden and image-less items", () => {
    const items = [
      { id: "a", title: "", caption: "", image: "/a.webp" },
      { id: "b", title: "", caption: "", image: "" },
      { id: "c", title: "", caption: "", image: "/c.webp", hidden: true },
    ];
    expect(visibleGallery(items).map((g) => g.id)).toEqual(["a"]);
  });
});

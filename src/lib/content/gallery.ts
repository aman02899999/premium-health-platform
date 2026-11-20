import type { GalleryItem } from "./types";

/** The photos the public site shows: ones with an image that the admin hasn't hidden. */
export function visibleGallery(items: GalleryItem[]): GalleryItem[] {
  return items.filter((g) => g.image && !g.hidden);
}

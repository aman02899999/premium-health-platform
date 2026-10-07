/**
 * Pexels URLs in our content ask the CDN for a 1200×627 centre crop (the social-card
 * size). For on-page display we want the whole photo, so drop the crop and keep the width.
 * Any other URL is returned unchanged.
 */
export function uncropped(src: string): string {
  if (!src.startsWith("https://images.pexels.com/")) return src;
  return src.replace(/&fit=crop/, "").replace(/&h=\d+/, "");
}

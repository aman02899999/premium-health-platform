import { getImageProps } from "next/image";

const PEXELS = "https://images.pexels.com/";
const PEXELS_WIDTHS = [400, 640, 828, 1200];

// Files under /public go through the Next image optimizer. Admin uploads (/api/media), paths
// with a query string and other hosts stay as they are.
function local(src: string): boolean {
  return src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/api/") && !src.includes("?");
}

// Pexels resizes on its own CDN from the `w` parameter, so its photos skip our optimizer.
function pexelsAt(src: string, w: number): string {
  const url = new URL(src);
  url.searchParams.set("w", String(w));
  return url.toString();
}

/**
 * src/srcSet/sizes for a plain <img>, so phones download a photo sized for the screen instead
 * of the 1400 px original. Pass `sizes` to opt in; without it the src is returned unchanged.
 */
export function responsiveImage(src: string, sizes?: string): { src: string; srcSet?: string; sizes?: string } {
  if (!sizes) return { src };
  if (src.startsWith(PEXELS)) {
    return { src, srcSet: PEXELS_WIDTHS.map((w) => `${pexelsAt(src, w)} ${w}w`).join(", "), sizes };
  }
  if (!local(src)) return { src };
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

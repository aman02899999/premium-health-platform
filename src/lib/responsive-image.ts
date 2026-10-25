import { getImageProps } from "next/image";

// Photos the image optimizer may resize: files under /public, and Pexels (allowed in
// next.config remotePatterns). Admin uploads (/api/media) and other hosts stay as they are.
function optimizable(src: string): boolean {
  if (src.startsWith("https://images.pexels.com/")) return true;
  return src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/api/") && !src.includes("?");
}

/**
 * src/srcSet/sizes for a plain <img>, so phones download a photo sized for the screen instead
 * of the 1400 px original. Pass `sizes` to opt in; without it the src is returned unchanged.
 */
export function responsiveImage(src: string, sizes?: string): { src: string; srcSet?: string; sizes?: string } {
  if (!sizes || !optimizable(src)) return { src };
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

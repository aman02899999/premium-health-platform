import Image from "next/image";
import { getProductImageUrl } from "@/lib/images";

interface ProductImageProps {
  /** Raw image reference from config — may be missing, malformed, or carry a query string. */
  image?: string | null;
  /** Descriptive alt text; never decorative. */
  alt: string;
  /** Wrapper classes — controls the aspect ratio that reserves layout space. */
  className?: string;
  sizes?: string;
  /** Set for above-the-fold hero images to prioritise LCP. */
  priority?: boolean;
}

/**
 * Renders a product photograph through a fixed aspect-ratio box.
 *
 * The wrapper reserves space before the image loads (protecting CLS) and
 * `getProductImageUrl` normalises the source — stripping query strings and
 * falling back to the static OG image — so local assets stay cacheable.
 */
export function ProductImage({
  image,
  alt,
  className = "aspect-[4/3] w-full",
  sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
}: ProductImageProps) {
  const src = getProductImageUrl(image);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="object-cover"
      />
    </div>
  );
}

import Image from "next/image";

/** A CSS 3D book (front cover, spine, page edges, back) — no WebGL. Turns toward the reader on hover. */
export function Book3D({ src, alt, sizes, priority = false }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  return (
    <div className="book3d">
      <div className="book3d-inner">
        <div className="book3d-back" />
        <div className="book3d-spine" />
        <div className="book3d-pages" />
        <div className="book3d-front">
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
        </div>
      </div>
    </div>
  );
}

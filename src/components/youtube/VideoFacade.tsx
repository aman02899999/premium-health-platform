"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * A YouTube video that costs nothing until it is clicked: a local thumbnail and a play button.
 * The YouTube player (about 1 MB of scripts) loads only after the click, so the page's speed
 * (LCP) is unchanged. youtube-nocookie.com sets no tracking cookies before play.
 */
export function VideoFacade({ id, title, thumb }: { id: string; title: string; thumb: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`} className="group absolute inset-0 h-full w-full cursor-pointer">
          <Image src={thumb} alt="" fill loading="lazy" sizes="(max-width: 768px) 100vw, 720px" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
          <span aria-hidden className="absolute left-1/2 top-1/2 flex h-12 w-[4.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-red-600/90 shadow-lg transition group-hover:bg-red-500">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}

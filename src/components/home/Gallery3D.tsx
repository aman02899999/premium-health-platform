"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryItem } from "@/lib/content/types";
import { SmartImage } from "@/components/ui/SmartImage";

// Coverflow carousel: drag/swipe, arrows, keyboard, auto-advance, lightbox.
export function Gallery3D({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const n = items.length;

  const go = useCallback((d: number) => setActive((a) => (a + d + n) % n), [n]);

  useEffect(() => {
    if (paused || lightbox !== null || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => go(1), 4200);
    return () => clearInterval(id);
  }, [paused, lightbox, go, n]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => ((i ?? 0) + 1) % n);
      if (e.key === "ArrowLeft") setLightbox((i) => ((i ?? 0) - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, n]);

  if (!n) return null;

  const offsetOf = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Gym gallery"
    >
      <div
        className="relative h-[380px] select-none sm:h-[460px]"
        style={{ perspective: "1400px" }}
        onPointerDown={(e) => (drag.current = { x: e.clientX, moved: false })}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          if (Math.abs(dx) > 60) {
            go(dx < 0 ? 1 : -1);
            drag.current = { x: e.clientX, moved: true };
          }
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null), 0)}
        onPointerLeave={() => (drag.current = null)}
      >
        {items.map((item, i) => {
          const d = offsetOf(i);
          const abs = Math.abs(d);
          const hidden = abs > 2;
          return (
            <button
              key={item.id}
              type="button"
              tabIndex={d === 0 ? 0 : -1}
              aria-label={`${item.title}${d === 0 ? " — open full size" : ""}`}
              onClick={() => {
                if (drag.current?.moved) return;
                if (d === 0) setLightbox(i);
                else setActive(i);
              }}
              className="absolute left-1/2 top-1/2 h-[320px] w-[260px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-all duration-700 ease-[cubic-bezier(.2,.7,.2,1)] sm:h-[400px] sm:w-[320px]"
              style={{
                transform: `translate(-50%,-50%) translateX(${d * 58}%) translateZ(${-abs * 180}px) rotateY(${d * -32}deg)`,
                zIndex: 10 - abs,
                opacity: hidden ? 0 : 1 - abs * 0.2,
                pointerEvents: hidden ? "none" : "auto",
                filter: d === 0 ? "none" : "brightness(.55) saturate(.8)",
              }}
            >
              <SmartImage src={item.image} alt={item.title} label={item.title} icon="Dumbbell" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 text-left">
                <span className="font-display block text-xl text-white">{item.title}</span>
                <span className="text-sm text-white/70">{item.caption}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 hover:border-brand hover:text-brand" aria-label="Previous photo">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-brand" : "w-2 bg-white/25"}`}
              aria-label={`Show ${item.title}`}
              aria-current={i === active}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 hover:border-brand hover:text-brand" aria-label="Next photo">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-4 backdrop-blur" role="dialog" aria-modal="true" aria-label={items[lightbox].title} onClick={() => setLightbox(null)}>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-3" aria-label="Close" onClick={() => setLightbox(null)}>
            <X className="h-5 w-5" />
          </button>
          <figure className="max-h-full w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl">
              <SmartImage src={items[lightbox].image} alt={items[lightbox].title} label={items[lightbox].title} icon="Dumbbell" priority />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4">
              <span>
                <span className="font-display block text-2xl text-white">{items[lightbox].title}</span>
                <span className="text-white/65">{items[lightbox].caption}</span>
              </span>
              <span className="flex gap-2">
                <button type="button" className="rounded-full bg-white/10 p-3" aria-label="Previous" onClick={() => setLightbox((lightbox - 1 + n) % n)}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" className="rounded-full bg-white/10 p-3" aria-label="Next" onClick={() => setLightbox((lightbox + 1) % n)}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}

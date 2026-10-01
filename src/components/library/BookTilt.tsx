"use client";

import { useRef } from "react";

/** Turns the 3D book inside it to follow the pointer (or a finger drag); springs back on leave. */
export function BookTilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (ry: string, rx: string) => {
    const book = ref.current?.querySelector<HTMLElement>(".book3d");
    if (!book) return;
    book.style.setProperty("--ry", ry);
    book.style.setProperty("--rx", rx);
  };
  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    set(`${(-18 + x * 46).toFixed(1)}deg`, `${(-y * 14).toFixed(1)}deg`);
  };
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={() => set("", "")} className="touch-pan-y px-[6%] py-4">
      {children}
    </div>
  );
}

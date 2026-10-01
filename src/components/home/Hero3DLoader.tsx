"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// three.js is ~150 kB gzipped and compiling its shaders blocks a phone's main thread for
// seconds. So phones get a pre-rendered still of the same scene (floating via CSS), and
// tablets/desktops load the live WebGL scene once the browser is idle, never on the server.
const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false, loading: () => null });

export function Hero3DLoader() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const start = () => setLive(true);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(start, 1200);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative still; next/image adds nothing here */}
      <img src="/hero/dumbbell-poster.webp" alt="" aria-hidden width={720} height={706} decoding="async" fetchPriority="low" className="hero-poster md:hidden" />
      {live && <Hero3D />}
    </>
  );
}

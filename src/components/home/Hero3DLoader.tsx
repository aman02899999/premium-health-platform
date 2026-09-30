"use client";

import dynamic from "next/dynamic";

// three.js is ~150 kB gzipped: load it after hydration, never on the server.
const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false, loading: () => null });

export function Hero3DLoader() {
  return <Hero3D />;
}

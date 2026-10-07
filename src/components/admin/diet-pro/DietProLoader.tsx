"use client";

import dynamic from "next/dynamic";
import type { PdfBusiness } from "./pdf";

// Client-only: the planner reads saved clients from localStorage and renders WebGL.
const DietPro = dynamic(() => import("./DietPro"), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center bg-ink text-sm text-white/50">Loading Diet Pro…</div>,
});

export function DietProLoader(props: { business: PdfBusiness; coach: string }) {
  return <DietPro {...props} />;
}

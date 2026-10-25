"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

export type ChartDatum = { name: string; value: number };

const RiskBars = dynamic(() => import("./charts-recharts").then((m) => m.RiskBars), { ssr: false });
const Donut = dynamic(() => import("./charts-recharts").then((m) => m.Donut), { ssr: false });

/**
 * Fetches the chart library only when the chart is about to scroll into view. Until then the box
 * keeps its size (the parent sets the height), so nothing shifts when the chart appears.
 */
export function LazyChart({ kind, data }: { kind: "bars" | "donut"; data: ChartDatum[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="h-full w-full">
      {near && (kind === "bars" ? <RiskBars data={data} /> : <Donut data={data} />)}
    </div>
  );
}

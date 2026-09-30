"use client";

import { useState } from "react";
import type { Muscle } from "@/lib/fitness/exercises";

// Stylised front/back figure. Each shape maps to a muscle group.
type Shape = { m: Muscle; d: string };

const FRONT: Shape[] = [
  { m: "shoulders", d: "M58 88 q-18 4 -22 26 l18 4 q4 -16 14 -22z M142 88 q18 4 22 26 l-18 4 q-4 -16 -14 -22z" },
  { m: "chest", d: "M72 90 h26 v34 q-18 4 -30 -6 q-4 -18 4 -28z M102 90 h26 q8 10 4 28 q-12 10 -30 6z" },
  { m: "biceps", d: "M36 118 l18 4 l-4 44 l-16 -2z M164 118 l-18 4 l4 44 l16 -2z" },
  { m: "core", d: "M74 128 q26 8 52 0 l-4 70 q-22 8 -44 0z" },
  { m: "quads", d: "M76 204 q12 6 22 2 l-2 88 h-18 q-6 -44 -2 -90z M102 206 q10 4 22 -2 q4 46 -2 90 h-18z" },
  { m: "calves", d: "M80 304 h16 l-2 70 h-12z M104 304 h16 l-2 70 h-12z" },
];

const BACK: Shape[] = [
  { m: "shoulders", d: "M58 88 q-18 4 -22 26 l18 4 q4 -16 14 -22z M142 88 q18 4 22 26 l-18 4 q-4 -16 -14 -22z" },
  { m: "back", d: "M72 88 h56 q10 20 2 50 l-14 40 h-32 l-14 -40 q-8 -30 2 -50z" },
  { m: "triceps", d: "M36 118 l18 4 l-4 44 l-16 -2z M164 118 l-18 4 l4 44 l16 -2z" },
  { m: "glutes", d: "M76 184 h48 q6 18 -2 30 q-22 8 -44 0 q-8 -12 -2 -30z" },
  { m: "hamstrings", d: "M78 218 q10 6 20 2 l-2 76 h-16 q-4 -40 -2 -78z M102 220 q10 4 20 -2 q2 38 -2 78 h-16z" },
  { m: "calves", d: "M80 304 h16 l-2 70 h-12z M104 304 h16 l-2 70 h-12z" },
];

export function BodyMap({ selected, onSelect }: { selected: Muscle | "all"; onSelect: (m: Muscle | "all") => void }) {
  const [side, setSide] = useState<"front" | "back">("front");
  const shapes = side === "front" ? FRONT : BACK;
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 flex rounded-full border border-line p-1 text-xs">
        {(["front", "back"] as const).map((s) => (
          <button key={s} type="button" onClick={() => setSide(s)} className={`rounded-full px-4 py-1.5 font-semibold capitalize ${side === s ? "bg-brand text-white" : "text-white/70"}`}>
            {s}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 200 390" className="h-[340px] w-auto [transform:perspective(600px)_rotateY(-8deg)]" role="group" aria-label={`Body map, ${side} view`}>
        <defs>
          <linearGradient id="bm-body" x1="0" x2="1">
            <stop offset="0" stopColor="#0f2438" />
            <stop offset="1" stopColor="#1d3a57" />
          </linearGradient>
        </defs>
        {/* silhouette */}
        <circle cx="100" cy="52" r="24" fill="url(#bm-body)" pointerEvents="none" />
        <path d="M60 84 q40 -14 80 0 q30 8 30 34 l-4 50 l-16 0 l-2 -30 l-6 50 q6 18 0 34 l-4 96 l-2 74 h-20 l-4 -150 h-4 l-4 150 h-20 l-2 -74 l-4 -96 q-6 -16 0 -34 l-6 -50 l-2 30 l-16 0 l-4 -50 q0 -26 30 -34z" fill="url(#bm-body)" pointerEvents="none" />
        {shapes.map((s) => {
          const on = selected === s.m;
          return (
            <path
              key={s.m + s.d}
              d={s.d}
              role="button"
              tabIndex={0}
              aria-label={s.m}
              aria-pressed={on}
              onClick={() => onSelect(on ? "all" : s.m)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(on ? "all" : s.m)}
              className="cursor-pointer outline-none transition-all duration-300 hover:opacity-100 focus-visible:stroke-white"
              fill="#e8394b"
              fillOpacity={on ? 0.95 : 0.22}
              stroke={on ? "#ff9aa4" : "#7cc0ee"}
              strokeOpacity={on ? 1 : 0.5}
              strokeWidth={1.2}
              style={on ? { filter: "drop-shadow(0 0 8px rgba(232,57,75,.85))" } : undefined}
            />
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-white/45">Tap a muscle to filter</p>
    </div>
  );
}

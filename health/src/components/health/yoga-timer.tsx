"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, Wind, Sun } from "lucide-react";

export function YogaTimer() {
  const [mode, setMode] = useState<"pranayama" | "surya" | "meditation">("pranayama");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  useEffect(() => {
    if (mode !== "pranayama" || !running) return;
    // 4-2-4 breathing: inhale 4s, hold 2s, exhale 4s
    const phase = seconds % 10;
    if (phase < 4) setBreathPhase("inhale");
    else if (phase < 6) setBreathPhase("hold");
    else setBreathPhase("exhale");
  }, [seconds, mode, running]);

  const reset = () => {
    setSeconds(0);
    setRunning(false);
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Timer className="h-4 w-4 text-violet-600" /> Yoga & Pranayama Timer — Unique</h3>
      <p className="mt-1 text-[11px] text-stone-500">Traditional Indian practices with modern timer — educational, not medical prescription. Stop if dizzy.</p>

      <div className="mt-3 flex gap-2">
        {(["pranayama", "surya", "meditation"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); reset(); }} className={`rounded-full px-3 py-1 text-xs font-bold ${mode === m ? "bg-violet-700 text-white" : "bg-stone-100 text-stone-600 dark:bg-stone-800"}`}>{m}</button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-6 text-center dark:from-stone-800 dark:to-stone-800">
        <p className="text-5xl font-black tabular-nums">{Math.floor(seconds / 60).toString().padStart(2, "0")}:{(seconds % 60).toString().padStart(2, "0")}</p>
        {mode === "pranayama" && <p className="mt-2 flex items-center justify-center gap-2 text-sm font-bold"><Wind className="h-4 w-4" /> {breathPhase.toUpperCase()} {breathPhase === "inhale" ? "— breathe in" : breathPhase === "hold" ? "— hold" : "— breathe out"}</p>}
        {mode === "surya" && <p className="mt-2 flex items-center justify-center gap-2 text-sm font-bold"><Sun className="h-4 w-4 text-amber-500" /> Surya Namaskar — {Math.floor(seconds / 30) + 1} rounds (30s per round est.)</p>}
        {mode === "meditation" && <p className="mt-2 text-sm">Meditation — focus on breath, no strain</p>}
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setRunning(!running)} className="rounded-xl bg-violet-700 px-5 py-2 text-sm font-bold text-white">{running ? "Pause" : "Start"}</button>
          <button onClick={reset} className="rounded-xl border px-5 py-2 text-sm font-bold">Reset</button>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-stone-500">
        <p><strong>Pranayama (4-2-4)</strong>: Inhale 4s, hold 2s, exhale 4s — traditional pattern, stop if breathless. Not for severe heart/lung disease without clinician.</p>
        <p className="mt-1"><strong>Surya Namaskar</strong>: 12 steps, 30s per round est., 5-10 rounds beginner.</p>
        <p className="mt-1"><strong>Meditation</strong>: 5-10 min daily, focus on breath.</p>
      </div>
    </div>
  );
}

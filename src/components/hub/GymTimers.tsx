"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

type Mode = "tabata" | "hiit" | "rest" | "breath";
const MODES: { id: Mode; label: string }[] = [
  { id: "tabata", label: "Tabata" },
  { id: "hiit", label: "Custom HIIT" },
  { id: "rest", label: "Rest timer" },
  { id: "breath", label: "Pranayama" },
];

function beep(freq = 880, ms = 160) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
    osc.onended = () => ctx.close();
  } catch {
    /* audio blocked */
  }
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function IntervalTimer({ work, rest, rounds }: { work: number; rest: number; rounds: number }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cycle = work + rest;
  const total = cycle * rounds - rest;
  const done = elapsed >= total;
  const round = Math.min(rounds, Math.floor(elapsed / cycle) + 1);
  const inCycle = elapsed % cycle;
  const phase = done ? "done" : inCycle < work ? "work" : "rest";
  const left = done ? 0 : phase === "work" ? work - inCycle : cycle - inCycle;
  const phaseLen = phase === "work" ? work : rest;

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running, done]);

  useEffect(() => {
    if (!running) return;
    if (done) beep(520, 600);
    else if (inCycle === 0 || inCycle === work) beep(phase === "work" ? 988 : 660, 250);
    else if (left <= 3) beep(740, 80);
  }, [elapsed, running, done, inCycle, work, phase, left]);

  const pct = done ? 1 : 1 - left / phaseLen;
  const color = phase === "work" ? "#e23b3b" : phase === "rest" ? "#34d399" : "#d4a94a";
  const c = 2 * Math.PI * 90;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 200 200" className="h-64 w-64 -rotate-90" aria-hidden>
          <circle cx="100" cy="100" r="90" stroke="#2a2a35" strokeWidth="12" fill="none" />
          <circle cx="100" cy="100" r="90" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-live="polite">
          <span className="font-display text-sm tracking-[0.3em]" style={{ color }}>
            {phase === "done" ? "DONE" : phase.toUpperCase()}
          </span>
          <span className="font-display text-6xl tabular-nums text-white">{fmt(left)}</span>
          <span className="text-sm text-white/60">
            Round {round} / {rounds}
          </span>
        </div>
      </div>
      <Controls running={running} onToggle={() => (done ? (setElapsed(0), setRunning(true)) : setRunning((r) => !r))} onReset={() => (setRunning(false), setElapsed(0))} />
    </div>
  );
}

function RestTimer() {
  const [secs, setSecs] = useState(90);
  const [left, setLeft] = useState(90);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      beep(520, 600);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stop once the countdown hits zero
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [running, left]);
  const start = (s: number) => {
    setSecs(s);
    setLeft(s);
    setRunning(true);
  };
  return (
    <div className="flex flex-col items-center">
      <div className="font-display text-8xl tabular-nums text-white" aria-live="polite">
        {fmt(left)}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[30, 60, 90, 120, 180].map((s) => (
          <button key={s} type="button" onClick={() => start(s)} className={`rounded-xl px-4 py-2 text-sm font-bold ${secs === s ? "bg-gold text-black" : "border border-white/15 text-white/75"}`}>
            {s < 60 ? `${s}s` : `${s / 60}${s % 60 ? ".5" : ""} min`}
          </button>
        ))}
      </div>
      <Controls running={running} onToggle={() => (left <= 0 ? start(secs) : setRunning((r) => !r))} onReset={() => (setRunning(false), setLeft(secs))} />
    </div>
  );
}

const BREATH = [
  { name: "Inhale", secs: 4 },
  { name: "Hold", secs: 4 },
  { name: "Exhale", secs: 6 },
  { name: "Hold", secs: 2 },
];

function Breathing() {
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0);
  const cycle = BREATH.reduce((a, b) => a + b.secs, 0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  let pos = t % cycle;
  let idx = 0;
  while (pos >= BREATH[idx].secs) {
    pos -= BREATH[idx].secs;
    idx++;
  }
  const phase = BREATH[idx];
  const scale = phase.name === "Inhale" ? 1 : phase.name === "Exhale" ? 0.55 : idx === 1 ? 1 : 0.55;
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-64 w-64 items-center justify-center">
        <div
          className="absolute h-full w-full rounded-full bg-gradient-to-br from-gold/60 to-ember/30 blur-sm"
          style={{ transform: `scale(${running ? scale : 0.7})`, transition: `transform ${phase.secs}s ease-in-out` }}
        />
        <div className="relative text-center" aria-live="polite">
          <div className="font-display text-3xl text-white">{running ? phase.name : "Ready"}</div>
          <div className="text-white/70">{running ? `${phase.secs - pos}s` : "4 · 4 · 6 · 2"}</div>
        </div>
      </div>
      <p className="mt-4 text-sm text-white/60">Rounds completed: {Math.floor(t / cycle)} · {fmt(t)}</p>
      <Controls running={running} onToggle={() => setRunning((r) => !r)} onReset={() => (setRunning(false), setT(0))} />
      <p className="mt-4 max-w-sm text-center text-xs text-white/45">A calming breathing pattern for warm-up, cool-down or stress. Stop if you feel dizzy.</p>
    </div>
  );
}

function Controls({ running, onToggle, onReset }: { running: boolean; onToggle: () => void; onReset: () => void }) {
  return (
    <div className="mt-6 flex gap-3">
      <button type="button" onClick={onToggle} className="btn-gold inline-flex items-center gap-2 rounded-full px-8 py-3 font-bold">
        {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />} {running ? "Pause" : "Start"}
      </button>
      <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white">
        <RotateCcw className="h-4 w-4" /> Reset
      </button>
    </div>
  );
}

export function GymTimers() {
  const [mode, setMode] = useState<Mode>("tabata");
  const [cfg, setCfg] = useState({ work: 40, rest: 20, rounds: 8 });
  const wake = useRef<WakeLockSentinel | null>(null);

  // Keep the phone screen on while a timer page is open.
  const lock = useCallback(async () => {
    try {
      wake.current = await navigator.wakeLock?.request("screen");
    } catch {
      /* unsupported */
    }
  }, []);
  useEffect(() => {
    lock();
    return () => {
      wake.current?.release().catch(() => {});
    };
  }, [lock]);

  return (
    <div className="glass gold-border mx-auto max-w-2xl rounded-3xl p-6 sm:p-10">
      <div role="tablist" className="mb-8 flex flex-wrap justify-center gap-2">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="tab" aria-selected={mode === m.id} onClick={() => setMode(m.id)} className={`rounded-full px-4 py-2 text-sm font-bold ${mode === m.id ? "bg-gold text-black" : "border border-white/15 text-white/70"}`}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === "tabata" && <IntervalTimer key="tabata" work={20} rest={10} rounds={8} />}
      {mode === "hiit" && (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3 text-sm">
            {(["work", "rest", "rounds"] as const).map((k) => (
              <label key={k} className="text-center">
                <span className="text-xs uppercase tracking-wider text-white/55">{k === "rounds" ? "Rounds" : `${k} (s)`}</span>
                <input type="number" min={1} max={k === "rounds" ? 50 : 600} value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: Math.max(1, Number(e.target.value) || 1) })} className="field mt-1 text-center" />
              </label>
            ))}
          </div>
          <IntervalTimer key={`${cfg.work}-${cfg.rest}-${cfg.rounds}`} {...cfg} />
        </>
      )}
      {mode === "rest" && <RestTimer />}
      {mode === "breath" && <Breathing />}
    </div>
  );
}

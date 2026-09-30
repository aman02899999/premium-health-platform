"use client";

import { useState } from "react";
import { Check, HelpCircle, X } from "lucide-react";

export function Quiz({ question, options, answer, explanation }: { question: string; options: string[]; answer: number; explanation: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  return (
    <div className="not-prose my-8 rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/10 to-transparent p-6">
      <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
        <HelpCircle className="h-4 w-4" /> Quick quiz
      </p>
      <p className="mb-4 text-lg font-semibold text-white">{question}</p>
      <div className="grid gap-2">
        {options.map((o, i) => {
          const correct = i === answer;
          const state = !done ? "idle" : correct ? "right" : picked === i ? "wrong" : "dim";
          return (
            <button
              key={o}
              type="button"
              disabled={done}
              onClick={() => setPicked(i)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                state === "idle"
                  ? "border-white/15 hover:-translate-y-0.5 hover:border-brand"
                  : state === "right"
                    ? "border-emerald-400 bg-emerald-400/15 text-white"
                    : state === "wrong"
                      ? "border-ember bg-ember/15 text-white"
                      : "border-white/10 opacity-50"
              }`}
            >
              {o}
              {state === "right" && <Check className="h-5 w-5 text-emerald-400" />}
              {state === "wrong" && <X className="h-5 w-5 text-ember" />}
            </button>
          );
        })}
      </div>
      {done && (
        <p className="mt-4 text-sm text-white/80" role="status">
          <strong className={picked === answer ? "text-emerald-400" : "text-red-300"}>{picked === answer ? "Correct! " : "Not quite. "}</strong>
          {explanation}
        </p>
      )}
    </div>
  );
}
